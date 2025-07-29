// screens/ChatDetailScreen.js - Optimized with Socket Integration
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
  const [messages, setMessages] = useState([]); // Local state for messages
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);
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

  // Only load initial chat history once
  const {
    data: initialChatHistory = [],
    isLoading,
    error,
    refetch,
  } = useGetChatHistoryQuery(
    { partnerId, page: 1 },
    {
      skip: !partnerId,
      refetchOnMountOrArgChange: true, // ✅ Her seferinde yeni data yükle
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Partner online status
  const isPartnerOnline = onlineUsers.has(partnerId);
  const isPartnerTyping = typingUsers.has(partnerId);

  // Set initial messages when chat history is loaded
  useEffect(() => {
    if (initialChatHistory.length > 0 && !hasLoadedInitialMessages) {
      setMessages(initialChatHistory);
      setHasLoadedInitialMessages(true);
      console.log(
        "Initial chat history loaded:",
        initialChatHistory.length,
        "messages"
      );
    }
  }, [initialChatHistory, hasLoadedInitialMessages]);

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
            console.log("✅ Adding new message to local state");
            return [...prevMessages, newMessage];
          } else {
            console.log("⚠️ Duplicate message, not adding");
          }
          return prevMessages;
        });

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
            return {
              ...msg,
              isOptimistic: false,
              sentAt:
                confirmationData.SentAt ||
                confirmationData.sentAt ||
                msg.sentAt,
              id: msg.id.startsWith("temp-") ? `msg-${Date.now()}` : msg.id,
            };
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
  }, [connection, isConnected, partnerId, currentUserId, markMessagesAsRead]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (partnerId && isConnected && hasLoadedInitialMessages) {
      markMessagesAsRead(partnerId);
    }
  }, [partnerId, isConnected, hasLoadedInitialMessages, markMessagesAsRead]);

  // Debug: Messages state changes
  useEffect(() => {
    console.log("📊 Messages state updated:", {
      count: messages.length,
      lastMessage: messages[messages.length - 1],
      optimisticCount: messages.filter((m) => m.isOptimistic).length,
    });
  }, [messages]);

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

    // Add optimistic message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderUserId: currentUserId,
      receiverUserId: partnerId,
      content: messageText,
      sentAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
    };

    console.log("🔮 Adding optimistic message:", optimisticMessage);
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, optimisticMessage];
      console.log("🔮 Messages after optimistic add:", newMessages.length);
      return newMessages;
    });

    // Scroll to bottom
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

        // REST API başarılı olursa optimistic mesajı güncelle
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...msg, isOptimistic: false, id: `msg-${Date.now()}` }
              : msg
          )
        );
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

  // Refresh messages manually (pull to refresh or retry)
  const refreshMessages = useCallback(() => {
    setHasLoadedInitialMessages(false);
    setMessages([]);
    refetch();
  }, [refetch]);

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

  // Message renderer
  const renderMessage = ({ item, index }) => {
    const isSent = item.senderUserId === currentUserId;
    const isLastMessage = index === messages.length - 1;
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

              {/* Message status for sent messages */}
              {isSent && isLastMessage && (
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
  if (isLoading && !hasLoadedInitialMessages) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-2 text-gray-600">Loading messages...</Text>
      </View>
    );
  }

  // Error state
  if (error && !hasLoadedInitialMessages) {
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
    <View
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) =>
          item.id?.toString() || `${item.senderUserId}-${item.sentAt}`
        }
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
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
      <View
        className="bg-white px-4 py-3 border-t border-gray-100"
        style={{
          paddingBottom:
            Platform.OS === "ios" ? Math.max(keyboardHeight, 16) : 16,
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

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default ChatDetailScreen;
