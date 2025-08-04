// screens/ChatDetailScreen.js - Fixed with Backend Pagination Response
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
  Dimensions,
  Animated,
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
  faChevronLeft,
  faPaperPlaneTop,
  faPlus,
} from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";
import {
  useGetChatHistoryQuery,
  useSendMessageMutation,
  chatApiHelpers,
} from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useSelector, useDispatch } from "react-redux";
import { BlurView } from "expo-blur";
import { useHeaderHeight } from "@react-navigation/elements";

const ChatDetailScreen = ({ navigation, route }) => {
  const { partnerId, partnerName } = route.params || {};
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]); // Local state for combined messages
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // ✅ Backend'den gelecek
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  const [loadedPages, setLoadedPages] = useState(new Set([1])); // ✅ Yüklenen sayfaları takip et
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();
  const textInputRef = useRef();
  const headerHeight = Platform.OS === "ios" ? useHeaderHeight() : 0;

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
    data: firstPageResponse,
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
    data: currentPageResponse,
    isLoading: isLoadingCurrentPage,
    error: currentPageError,
    refetch: refetchCurrentPage,
  } = useGetChatHistoryQuery(
    { partnerId, page: currentPage },
    {
      skip: !partnerId || currentPage === 1 || loadedPages.has(currentPage),
    }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Partner online status
  const isPartnerOnline = onlineUsers.has(partnerId);
  const isPartnerTyping = typingUsers.has(partnerId);
  const handleTextInputFocus = () => {
    // iOS'ta klavye yüksekliğini tahmin ederek hemen başlatın
    if (Platform.OS === "ios") {
      // Standard iOS keyboard height (iPhone'lara göre)
      const estimatedKeyboardHeight =
        Dimensions.get("window").height > 800 ? 346 : 316; // iPhone büyüklüğüne göre

      Animated.timing(keyboardHeight, {
        toValue: estimatedKeyboardHeight,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  // ✅ FIXED: Backend response structure'ını parse et
  const parseBackendResponse = (response) => {
    if (!response) return { messages: [], hasNextPage: false, currentPage: 1 };

    // Eğer direkt array geliyorsa (eski format)
    if (Array.isArray(response)) {
      return {
        messages: response,
        hasNextPage: response.length === 20, // 20 item varsa muhtemelen daha var
        currentPage: 1,
      };
    }

    // Yeni backend format: { currentPage, hasNextPage, messages, pageSize }
    return {
      messages: response.messages || [],
      hasNextPage: response.hasNextPage || false,
      currentPage: response.currentPage || 1,
      pageSize: response.pageSize || 20,
    };
  };

  useEffect(() => {
    // iOS için keyboardWillShow/Hide kullanın (daha responsive)
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (e) => {
      console.log("Keyboard showing:", e.endCoordinates);

      // iOS'ta animasyon süresini keyboard'un kendi animasyon süresiyle eşleştirin
      const animationDuration = Platform.OS === "ios" ? e.duration || 250 : 150;

      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    });

    const hide = Keyboard.addListener(hideEvent, (e) => {
      console.log("Keyboard hiding");

      const animationDuration =
        Platform.OS === "ios" ? e?.duration || 250 : 150;

      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ✅ İlk sayfa yüklendiğinde mesajları set et
  useEffect(() => {
    if (firstPageResponse && !hasLoadedInitialMessages) {
      const { messages: firstPageMessages, hasNextPage } =
        parseBackendResponse(firstPageResponse);

      console.log("📖 Setting initial messages from page 1:", {
        messageCount: firstPageMessages.length,
        hasNextPage,
      });

      setMessages(firstPageMessages);
      setHasLoadedInitialMessages(true);
      setShouldScrollToEnd(true);
      setHasMoreMessages(hasNextPage); // ✅ Backend'den gelen hasNextPage kullan

      console.log(`📖 Initial load complete. HasMore: ${hasNextPage}`);
    }
  }, [firstPageResponse, hasLoadedInitialMessages]);

  // ✅ FIXED: Yeni sayfa yüklendiğinde mesajları birleştir
  useEffect(() => {
    if (
      currentPageResponse &&
      currentPage > 1 &&
      !loadedPages.has(currentPage)
    ) {
      const { messages: currentPageMessages, hasNextPage } =
        parseBackendResponse(currentPageResponse);

      console.log(`📖 Loading page ${currentPage}:`, {
        messageCount: currentPageMessages.length,
        hasNextPage,
      });

      setMessages((prevMessages) => {
        // Yeni sayfadaki mesajları eskilerle birleştir (eski mesajlar sonda)
        const combinedMessages = [...prevMessages, ...currentPageMessages];

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

      // ✅ Backend'den gelen hasNextPage bilgisini kullan
      setHasMoreMessages(hasNextPage);
      console.log(`📖 Page ${currentPage} loaded. HasMore: ${hasNextPage}`);

      setIsLoadingMore(false);
    }
  }, [currentPageResponse, currentPage, loadedPages]);

  // ✅ Auto scroll to bottom after messages are loaded
  useEffect(() => {
    if (shouldScrollToEnd && messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setShouldScrollToEnd(false);
      }, 100);
    }
  }, [shouldScrollToEnd, messages]);

  // ✅ FIXED: Load more messages - Backend hasNextPage'e göre kontrol et
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

    console.log(`📖 Loading page ${nextPage}... (hasMore: ${hasMoreMessages})`);
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
    setHasMoreMessages(true); // ✅ Reset hasMore to true for fresh start
    setIsLoadingMore(false);
    setShouldScrollToEnd(true);
    setLoadedPages(new Set([1])); // ✅ Reset loaded pages
    refetchFirstPage();
  }, [refetchFirstPage]);

  // Helper function to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Format timestamp for message separators (shows "Bugün", "Dün", or date)
  const formatSeparatorTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffInDays = Math.floor(
      (today - messageDate) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return "Bugün";
    } else if (diffInDays === 1) {
      return "Dün";
    } else {
      // Turkish months
      const months = [
        "Ocak",
        "Şubat",
        "Mart",
        "Nisan",
        "Mayıs",
        "Haziran",
        "Temmuz",
        "Ağustos",
        "Eylül",
        "Ekim",
        "Kasım",
        "Aralık",
      ];

      return `${date.getDate()} ${months[date.getMonth()]}`;
    }
  };

  // Format timestamp for individual messages (shows only hour:minute)
  const formatMessageTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Updated renderMessage function with new timestamp formatting
  const renderMessage = ({ item, index }) => {
    const isSent = item.senderUserId === currentUserId;
    const isLatestMessage = index === messages.length - 1;

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
      <View style={{ marginBottom: 1 }}>
        {showTimestamp && (
          <View className="items-center my-2">
            <Text className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {formatSeparatorTimestamp(item.sentAt)}
            </Text>
          </View>
        )}

        <View
          className={`flex-row mb-1 ${
            isSent ? "justify-end" : "justify-start"
          }`}
        >
          <View
            style={{
              boxShadow: "0px 0px 12px #00000014",
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: isSent ? "#242424" : "#fff",
            }}
            className={`max-w-[75%] rounded-3xl`}
          >
            <Text
              style={{ fontSize: 16 }}
              className={` ${isSent ? "text-white" : "text-gray-900"}`}
            >
              {item.content}{" "}
              {isSent
                ? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"
                : "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
            </Text>
            <View
              style={{ bottom: 9, right: 12, gap: 2 }}
              className="absolute flex flex-row items-center"
            >
              <Text
                className={`text-xs ${
                  isSent ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {formatMessageTimestamp(item.sentAt)}
              </Text>
              {/* Message status for sent messages */}
              {isSent && (
                <View className=" flex-row items-center">
                  {item.isOptimistic ? (
                    <View className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
                  ) : item.isRead ? (
                    <FontAwesomeIcon
                      icon={faCheckDouble}
                      size={10}
                      color="#5ba8fc"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} size={10} color="#b0b0b0" />
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
      <View className="flex-1 bg-white">
        <StatusBar style="dark" backgroundColor="transparent" translucent />

        {/* Error content */}
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

        {/* ✅ Absolute positioned BlurView Header for error state */}
        <BlurView
          intensity={90}
          tint="light"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
          }}
        >
          <SafeAreaView style={{ backgroundColor: "transparent" }} />
          <View className="px-4 py-3 flex-row items-center">
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
        </BlurView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View className="flex-1">
        <StatusBar style="dark" backgroundColor="transparent" translucent />

        {/* Messages - Full screen FlatList */}
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
          contentContainerStyle={{
            paddingTop: Platform.OS === "ios" ? 140 : 120, // Space for header
            paddingBottom: Platform.OS === "ios" ? 90 : 120, // Space for input
            paddingVertical: 16,
          }}
          keyboardDismissMode="interactive"
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
            ) : !hasMoreMessages && messages.length > 0 ? (
              <View className="py-4 items-center">
                <Text className="text-xs text-gray-400">
                  🔚 Bu sohbetin başlangıcı
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

        {/* Connection Status Indicator - Positioned above input */}
        {!isConnected && (
          <View
            className="bg-yellow-100 px-4 py-2 border-t border-yellow-200"
            style={{
              position: "absolute",
              bottom: Platform.OS === "ios" ? 120 : 100,
              left: 0,
              right: 0,
              zIndex: 30,
            }}
          >
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

        {/* ✅ Absolute positioned BlurView Header */}
        <BlurView
          intensity={70}
          tint="light"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
          }}
        >
          <SafeAreaView style={{ backgroundColor: "transparent" }} />
          <View className="px-4 pb-2 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="p-2 -ml-2 mr-2"
              >
                <FontAwesomeIcon icon={faChevronLeft} size={20} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${
                      partnerName || partnerId
                    }&background=0ea5e9&color=fff&size=40`,
                  }}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <View className="flex-1">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900"
                  >
                    {partnerName || partnerId}
                  </Text>
                  <View className="flex-row items-center">
                    {isPartnerOnline ? (
                      <Text className="text-gray-500" style={{ fontSize: 12 }}>
                        {isPartnerTyping
                          ? "Yazıyor..."
                          : isPartnerOnline
                          ? "Çevrimiçi"
                          : ""}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center space-x-3">
              <TouchableOpacity className="p-2">
                <FontAwesomeIcon icon={faCircleInfo} size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>

        {/* ✅ BlurView Input Area */}

        <BlurView intensity={70} tint="light">
          <View className="">
            <View className="flex-row items-center bg-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <TouchableOpacity
                onPress={handleSendMessage}
                className={`w-10 h-10 rounded-full items-center justify-center mr-3`}
                disabled={!message.trim() || isSending}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  size={22}
                  color={message.trim() ? "#000" : "#000"}
                />
              </TouchableOpacity>
              <BlurView
                style={{ boxShadow: "0px 0px 12px #00000014" }}
                className="flex-1 rounded-full overflow-hidden px-4"
              >
                <TextInput
                  ref={textInputRef}
                  className="text-base py-2 max-h-20 rounded-full"
                  value={message}
                  onChangeText={(text) => {
                    setMessage(text);
                    if (text.trim()) {
                      handleTypingStart();
                    }
                  }}
                  onFocus={handleTextInputFocus} // Yeni eklenen
                  multiline
                  maxLength={500}
                  placeholderTextColor="#999"
                  editable={!isSending}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                />
              </BlurView>

              <TouchableOpacity
                onPress={handleSendMessage}
                style={{ backgroundColor: "#4ade80" }}
                className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                  message.trim() && !isSending ? "bg-blue-500" : ""
                }`}
                disabled={!message.trim() || isSending}
              >
                <FontAwesomeIcon
                  icon={faPaperPlaneTop}
                  size={18}
                  color={message.trim() ? "#000" : "#fff"}
                />
              </TouchableOpacity>
            </View>
          </View>
          <SafeAreaView style={{ backgroundColor: "transparent" }} />
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatDetailScreen;
