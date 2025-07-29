// screens/ChatDetailScreen.js - Fixed with Proper Pagination
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faPhone,
  faVideo,
  faPaperPlane,
  faCircleInfo,
  faCircle,
  faCheck,
  faCheckDouble,
  faExclamationCircle,
  faTimes,
} from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";
import {
  useGetChatHistoryQuery,
  useSendMessageMutation,
  chatApiHelpers,
} from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useSelector, useDispatch } from "react-redux";

const ChatDetailScreen = ({ navigation, route }) => {
  const { partnerId, partnerName } = route.params || {};
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messages, setMessages] = useState([]); // Local state for combined messages
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  const [loadedPages, setLoadedPages] = useState(new Set([1])); // ✅ Yüklenen sayfaları takip et

  const flatListRef = useRef();
  const typingTimeoutRef = useRef();
  const textInputRef = useRef();

  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?.id || user?.userId;
  const dispatch = useDispatch();

  const {
    isConnected,
    isConnecting,
    connectionError,
    onlineUsers,
    typingUsers,
    sendMessage: sendSignalRMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    connection,
    reconnect,
  } = useSignalR();

  // ✅ FIXED: İlk sayfayı yükle (Page 1)
  const {
    data: firstPageData = [],
    isLoading: isLoadingFirstPage,
    error: firstPageError,
    refetch: refetchFirstPage,
  } = useGetChatHistoryQuery(
    { partnerId, page: 1 },
    {
      skip: !partnerId,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // ✅ FIXED: Dinamik sayfa yükleme - Sadece gerekli sayfayı yükle
  const {
    data: currentPageData = [],
    isLoading: isLoadingCurrentPage,
    error: currentPageError,
    refetch: refetchCurrentPage,
  } = useGetChatHistoryQuery(
    { partnerId, page: currentPage },
    {
      skip: !partnerId || currentPage === 1 || loadedPages.has(currentPage), // ✅ Zaten yüklü sayfaları atla
    }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Partner online status
  const isPartnerOnline = onlineUsers.has(partnerId);
  const isPartnerTyping = typingUsers.has(partnerId);

  // ✅ İlk sayfa yüklendiğinde mesajları set et
  useEffect(() => {
    if (firstPageData.length > 0 && !hasLoadedInitialMessages) {
      console.log(
        "📖 Setting initial messages from page 1:",
        firstPageData.length
      );
      setMessages(firstPageData);
      setHasLoadedInitialMessages(true);
      setShouldScrollToEnd(true);

      // Eğer 20'den az mesaj varsa (sayfa boyutu 20 ise), daha fazla sayfa yok
      if (firstPageData.length < 20) {
        setHasMoreMessages(false);
        console.log("🔚 No more messages to load (first page < 20)");
      }
    }
  }, [firstPageData, hasLoadedInitialMessages]);

  // ✅ FIXED: Yeni sayfa yüklendiğinde mesajları birleştir
  useEffect(() => {
    if (
      currentPageData.length > 0 &&
      currentPage > 1 &&
      !loadedPages.has(currentPage)
    ) {
      console.log(
        `📖 Loading page ${currentPage} with ${currentPageData.length} messages`
      );

      setMessages((prevMessages) => {
        // Yeni sayfadaki mesajları eskilerle birleştir (eski mesajlar sonda)
        const combinedMessages = [...prevMessages, ...currentPageData];

        // Duplicate kontrolü - ID ve timestamp'e göre
        const uniqueMessages = combinedMessages.filter(
          (message, index, self) =>
            index ===
            self.findIndex(
              (m) =>
                m.id === message.id ||
                (m.content === message.content &&
                  m.senderUserId === message.senderUserId &&
                  Math.abs(new Date(m.sentAt) - new Date(message.sentAt)) <
                    2000)
            )
        );

        console.log(
          `📖 Combined messages: ${combinedMessages.length} -> ${
            uniqueMessages.length
          } (removed ${
            combinedMessages.length - uniqueMessages.length
          } duplicates)`
        );
        return uniqueMessages;
      });

      // Bu sayfayı yüklü olarak işaretle
      setLoadedPages((prev) => new Set([...prev, currentPage]));

      // Eğer 20'den az mesaj varsa, daha fazla sayfa yok
      if (currentPageData.length < 20) {
        setHasMoreMessages(false);
        console.log("🔚 No more messages to load");
      }

      setIsLoadingMore(false);
    }
  }, [currentPageData, currentPage, loadedPages]);

  // ✅ Auto scroll to bottom after messages are loaded
  useEffect(() => {
    if (shouldScrollToEnd && messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setShouldScrollToEnd(false);
      }, 100);
    }
  }, [shouldScrollToEnd, messages]);

  // ✅ FIXED: Load more messages - Doğru sayfa numarasını kullan
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || isLoadingCurrentPage) {
      console.log("⚠️ Skipping load more:", {
        isLoadingMore,
        hasMoreMessages,
        isLoadingCurrentPage,
      });
      return;
    }

    const nextPage = currentPage + 1;

    // Eğer bu sayfa zaten yüklenmiş ise atla
    if (loadedPages.has(nextPage)) {
      console.log(`⚠️ Page ${nextPage} already loaded, skipping`);
      return;
    }

    console.log(`📖 Loading page ${nextPage}...`);
    setIsLoadingMore(true);
    setCurrentPage(nextPage);
  }, [
    isLoadingMore,
    hasMoreMessages,
    isLoadingCurrentPage,
    currentPage,
    loadedPages,
  ]);

  // Handle scroll event to detect when user reaches top
  const handleScroll = useCallback(
    (event) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      // Normal FlatList - check if user scrolled to top
      const isAtTop = contentOffset.y <= 50;

      if (isAtTop && hasMoreMessages && !isLoadingMore) {
        handleLoadMore();
      }
    },
    [hasMoreMessages, isLoadingMore, handleLoadMore]
  );

  // ✅ Function to sync message to cache
  const syncMessageToCache = useCallback(
    (messageData) => {
      console.log("🔄 Syncing message to cache:", messageData);
      chatApiHelpers.addMessageToCache(dispatch, partnerId, messageData);

      // Also update partners list to show latest message
      chatApiHelpers.updatePartnersList(dispatch);
    },
    [dispatch, partnerId]
  );

  // SignalR message listeners
  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log("Setting up SignalR listeners for chat:", partnerId);

    // Listen for new messages
    const handleReceiveMessage = (messageData) => {
      console.log(
        "📨 Received new message via SignalR:",
        JSON.stringify(messageData, null, 2)
      );

      // Only add message if it's from our current chat partner OR if it's TO our current partner
      if (
        messageData.SenderUserId === partnerId ||
        messageData.ReceiverUserId === partnerId
      ) {
        const newMessage = {
          id: messageData.Id || messageData.id || `msg-${Date.now()}`,
          senderUserId: messageData.SenderUserId || messageData.senderUserId,
          receiverUserId:
            messageData.ReceiverUserId ||
            messageData.receiverUserId ||
            currentUserId,
          content: messageData.Content || messageData.content,
          sentAt:
            messageData.SentAt ||
            messageData.sentAt ||
            new Date().toISOString(),
          isRead: messageData.IsRead || messageData.isRead || false,
        };

        console.log(
          "🔄 Processed message:",
          JSON.stringify(newMessage, null, 2)
        );

        setMessages((prevMessages) => {
          // Avoid duplicates
          const exists = prevMessages.some(
            (msg) =>
              msg.id === newMessage.id ||
              (msg.content === newMessage.content &&
                msg.senderUserId === newMessage.senderUserId &&
                Math.abs(new Date(msg.sentAt) - new Date(newMessage.sentAt)) <
                  2000)
          );

          if (!exists) {
            console.log("✅ Adding new message to local state at index 0");
            // Add new message at the beginning (index 0) since latest messages come first
            return [newMessage, ...prevMessages];
          } else {
            console.log("⚠️ Duplicate message, not adding");
          }
          return prevMessages;
        });

        // ✅ Sync to cache for MessagesScreen to see
        syncMessageToCache(messageData);

        // ✅ Yeni mesaj geldiğinde scroll et
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Mark as read if it's from partner and we're in the chat
        if (messageData.SenderUserId === partnerId && isConnected) {
          setTimeout(() => {
            markMessagesAsRead(partnerId);
          }, 500);
        }
      } else {
        console.log("🚫 Message not for current chat:", {
          messageSender: messageData.SenderUserId,
          messageReceiver: messageData.ReceiverUserId,
          currentPartner: partnerId,
        });
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (confirmationData) => {
      console.log(
        "✅ Message sent confirmation:",
        JSON.stringify(confirmationData, null, 2)
      );

      // Update optimistic messages to show as delivered
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.isOptimistic) {
            console.log("🔄 Updating optimistic message to delivered");
            const updatedMessage = {
              ...msg,
              isOptimistic: false,
              sentAt:
                confirmationData.SentAt ||
                confirmationData.sentAt ||
                msg.sentAt,
              id: msg.id.startsWith("temp-") ? `msg-${Date.now()}` : msg.id,
            };

            // ✅ Sync confirmed message to cache
            syncMessageToCache({
              Id: updatedMessage.id,
              SenderUserId: updatedMessage.senderUserId,
              ReceiverUserId: updatedMessage.receiverUserId,
              Content: updatedMessage.content,
              SentAt: updatedMessage.sentAt,
              IsRead: updatedMessage.isRead,
            });

            return updatedMessage;
          }
          return msg;
        })
      );
    };

    // Listen for message read status
    const handleMessagesRead = (readData) => {
      console.log("Messages marked as read:", readData);

      if (readData.ReadByUserId === partnerId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.senderUserId === currentUserId ? { ...msg, isRead: true } : msg
          )
        );

        // ✅ Update cache for read status
        chatApiHelpers.markCacheMessagesAsRead(
          dispatch,
          partnerId,
          currentUserId
        );
      }
    };

    // Listen for message errors
    const handleMessageError = (errorData) => {
      console.error("❌ Message error:", JSON.stringify(errorData, null, 2));

      // Remove failed optimistic messages
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(
          (msg) => !msg.isOptimistic
        );
        console.log(
          `🗑️ Removed ${
            prevMessages.length - filteredMessages.length
          } optimistic messages due to error`
        );
        return filteredMessages;
      });

      Alert.alert(
        "Message Failed",
        errorData.Error || errorData.error || "Failed to send message"
      );
    };

    // Register SignalR listeners
    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessageSent", handleMessageSent);
    connection.on("MessagesRead", handleMessagesRead);
    connection.on("MessageError", handleMessageError);

    // Cleanup listeners
    return () => {
      connection.off("ReceiveMessage", handleReceiveMessage);
      connection.off("MessageSent", handleMessageSent);
      connection.off("MessagesRead", handleMessagesRead);
      connection.off("MessageError", handleMessageError);
    };
  }, [
    connection,
    isConnected,
    partnerId,
    currentUserId,
    markMessagesAsRead,
    syncMessageToCache,
    dispatch,
  ]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // ✅ Klavye açıldığında da scroll et
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (partnerId && isConnected && hasLoadedInitialMessages) {
      markMessagesAsRead(partnerId);
    }
  }, [partnerId, isConnected, hasLoadedInitialMessages, markMessagesAsRead]);

  // ✅ Update partners list when leaving chat (so MessagesScreen shows latest message)
  useEffect(() => {
    return () => {
      // When component unmounts, update partners list
      console.log("🔄 Chat screen unmounting, updating partners list");
      chatApiHelpers.updatePartnersList(dispatch);
      chatApiHelpers.updateUnreadCount(dispatch);
    };
  }, [dispatch]);

  // Debug: Messages state changes
  useEffect(() => {
    console.log("📊 Messages state updated:", {
      count: messages.length,
      latestMessage: messages[0], // Latest message is now at index 0
      optimisticCount: messages.filter((m) => m.isOptimistic).length,
      currentPage,
      hasMoreMessages,
      loadedPages: Array.from(loadedPages),
    });
  }, [messages, currentPage, hasMoreMessages, loadedPages]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      startTyping(partnerId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(partnerId);
    }, 1000);
  }, [isTyping, isConnected, partnerId, startTyping, stopTyping]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim() || !partnerId) {
      console.log("❌ Empty message or no partnerId");
      return;
    }

    const messageText = message.trim();
    console.log("📤 Sending message:", { partnerId, messageText, isConnected });
    setMessage("");

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      stopTyping(partnerId);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Add optimistic message at the beginning (index 0)
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderUserId: currentUserId,
      receiverUserId: partnerId,
      content: messageText,
      sentAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
    };

    console.log("🔮 Adding optimistic message at index 0:", optimisticMessage);
    setMessages((prevMessages) => {
      const newMessages = [optimisticMessage, ...prevMessages];
      console.log("🔮 Messages after optimistic add:", newMessages.length);
      return newMessages;
    });

    // ✅ Mesaj gönderildikten sonra scroll et
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // SignalR bağlantısı varsa önce onu dene
      if (isConnected) {
        console.log("📡 Sending message via SignalR...");
        await sendSignalRMessage(partnerId, messageText);
        console.log("✅ Message sent via SignalR successfully");
      } else {
        console.log("🌐 SignalR not connected, using REST API...");
        // SignalR bağlantısı yoksa REST API kullan
        const result = await sendMessage({
          receiverUserId: partnerId,
          content: messageText,
        }).unwrap();

        console.log("✅ Message sent via REST API:", result);

        // REST API başarılı olursa optimistic mesajı güncelle ve cache'e sync et
        const confirmedMessage = {
          ...optimisticMessage,
          isOptimistic: false,
          id: `msg-${Date.now()}`,
        };

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === optimisticMessage.id ? confirmedMessage : msg
          )
        );

        // ✅ Sync to cache
        syncMessageToCache({
          Id: confirmedMessage.id,
          SenderUserId: confirmedMessage.senderUserId,
          ReceiverUserId: confirmedMessage.receiverUserId,
          Content: confirmedMessage.content,
          SentAt: confirmedMessage.sentAt,
          IsRead: confirmedMessage.isRead,
        });
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error);

      // Başarısız optimistic mesajı kaldır
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(
          (msg) => msg.id !== optimisticMessage.id
        );
        console.log(
          `🗑️ Removed optimistic message, remaining: ${filteredMessages.length}`
        );
        return filteredMessages;
      });

      Alert.alert(
        "Message Failed",
        `Failed to send message${
          !isConnected ? " (chat disconnected)" : ""
        }. Please try again.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry",
            onPress: () => {
              setMessage(messageText);
              textInputRef.current?.focus();
            },
          },
        ]
      );
    }
  };

  // ✅ FIXED: Refresh messages manually - Reset pagination state
  const refreshMessages = useCallback(() => {
    console.log("🔄 Refreshing messages - resetting pagination state");
    setHasLoadedInitialMessages(false);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(true);
    setIsLoadingMore(false);
    setShouldScrollToEnd(true);
    setLoadedPages(new Set([1])); // ✅ Reset loaded pages
    refetchFirstPage();
  }, [refetchFirstPage]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Message renderer - Normal order (newest at bottom)
  const renderMessage = ({ item, index }) => {
    const isSent = item.senderUserId === currentUserId;
    const isLatestMessage = index === messages.length - 1; // Latest message is now at the end

    // For normal list order
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage =
      index < messages.length - 1 ? messages[index + 1] : null;

    const showAvatar =
      !isSent &&
      (!nextMessage || nextMessage.senderUserId !== item.senderUserId);

    const showTimestamp =
      !prevMessage ||
      new Date(item.sentAt) - new Date(prevMessage.sentAt) > 5 * 60 * 1000; // 5 minutes

    return (
      <View className="mb-1">
        {showTimestamp && (
          <View className="items-center my-2">
            <Text className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {formatTimestamp(item.sentAt)}
            </Text>
          </View>
        )}

        <View
          className={`flex-row mb-1 ${
            isSent ? "justify-end" : "justify-start"
          }`}
        >
          {/* Avatar for received messages */}
          {!isSent && (
            <View className="mr-2" style={{ width: 32 }}>
              {showAvatar && (
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${item.senderUserId}&background=0ea5e9&color=fff&size=32`,
                  }}
                  className="w-8 h-8 rounded-full"
                />
              )}
            </View>
          )}

          <View
            className={`max-w-[75%] px-3 py-2 rounded-2xl ${
              isSent ? "bg-blue-500 rounded-br-md" : "bg-gray-200 rounded-bl-md"
            }`}
          >
            <Text
              className={`text-base ${isSent ? "text-white" : "text-gray-900"}`}
            >
              {item.content}
            </Text>

            <View className="flex-row items-center justify-between mt-1">
              <Text
                className={`text-xs ${
                  isSent ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {formatTimestamp(item.sentAt)}
              </Text>

              {/* Message status for sent messages (only show for latest message) */}
              {isSent && isLatestMessage && (
                <View className="ml-2 flex-row items-center">
                  {item.isOptimistic ? (
                    <View className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" />
                  ) : item.isRead ? (
                    <FontAwesomeIcon
                      icon={faCheckDouble}
                      size={10}
                      color="#93c5fd"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} size={10} color="#93c5fd" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoadingFirstPage && !hasLoadedInitialMessages) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-2 text-gray-600">Loading messages...</Text>
      </View>
    );
  }

  // Error state
  if (firstPageError && !hasLoadedInitialMessages) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={{ flex: 0, backgroundColor: "#fff" }} />
        <StatusBar style="dark" backgroundColor="#fff" />

        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2 mr-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            {partnerName || partnerId}
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-4">
          <FontAwesomeIcon
            icon={faExclamationCircle}
            size={40}
            color="#ef4444"
          />
          <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
            Failed to load messages
          </Text>
          <Text className="mt-2 text-gray-600 text-center">
            Please check your connection and try again.
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
            onPress={refreshMessages}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView style={{ flex: 0, backgroundColor: "#fff" }} />
      <StatusBar style="dark" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2 mr-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center flex-1">
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${
                  partnerName || partnerId
                }&background=0ea5e9&color=fff&size=40`,
              }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {partnerName || partnerId}
              </Text>
              <View className="flex-row items-center">
                {isPartnerOnline && (
                  <FontAwesomeIcon icon={faCircle} size={6} color="#10b981" />
                )}
                <Text
                  className={`text-xs ml-1 ${
                    isPartnerOnline ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {isPartnerTyping
                    ? "Typing..."
                    : isPartnerOnline
                    ? "Online"
                    : "Offline"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="p-2">
            <FontAwesomeIcon icon={faPhone} size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <FontAwesomeIcon icon={faVideo} size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <FontAwesomeIcon icon={faCircleInfo} size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages - Normal FlatList with pagination at top */}
      <FlatList
        ref={flatListRef}
        data={messages.slice().reverse()} // Reverse to show oldest at top, newest at bottom
        renderItem={({ item, index }) =>
          renderMessage({
            item,
            index: messages.length - 1 - index, // Adjust index for reversed array
          })
        }
        keyExtractor={(item) =>
          item.id?.toString() || `${item.senderUserId}-${item.sentAt}`
        }
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListHeaderComponent={() =>
          isLoadingMore && hasMoreMessages ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text className="text-xs text-gray-500 mt-1">
                Loading page {currentPage}...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500 text-base text-center">
              No messages yet. Start the conversation!
            </Text>
          </View>
        )}
      />

      {/* Connection Status Indicator */}
      {!isConnected && (
        <View className="bg-yellow-100 px-4 py-2 border-t border-yellow-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-yellow-600 text-sm">
              {isConnecting
                ? "Connecting to chat..."
                : connectionError
                ? "Chat disconnected"
                : "Reconnecting to chat..."}
            </Text>
            {!isConnecting && (
              <TouchableOpacity
                onPress={reconnect}
                className="bg-yellow-500 px-3 py-1 rounded"
              >
                <Text className="text-white text-xs font-medium">Retry</Text>
              </TouchableOpacity>
            )}
          </View>
          {connectionError && (
            <Text className="text-yellow-500 text-xs mt-1">
              Using fallback messaging
            </Text>
          )}
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View
          className="bg-white px-4 py-3 border-t border-gray-100"
          style={{
            paddingBottom: Platform.OS === "ios" ? 16 : 16,
          }}
        >
          <View className="flex-row items-end bg-gray-100 rounded-full px-4 py-2">
            <TextInput
              ref={textInputRef}
              className="flex-1 text-base py-2 max-h-20"
              placeholder="Type a message..."
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (text.trim()) {
                  handleTypingStart();
                }
              }}
              multiline
              maxLength={500}
              placeholderTextColor="#999"
              editable={!isSending}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />

            <TouchableOpacity
              onPress={handleSendMessage}
              className={`ml-2 w-8 h-8 rounded-full items-center justify-center ${
                message.trim() && !isSending ? "bg-blue-500" : "bg-gray-300"
              }`}
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  size={14}
                  color={message.trim() ? "#fff" : "#666"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default ChatDetailScreen;
