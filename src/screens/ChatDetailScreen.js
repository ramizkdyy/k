// screens/ChatDetailScreen.js - Global ve local handler'lar optimize edilmiş
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Info,
  Circle,
  Check,
  CheckCheck,
  CircleAlert,
  X,
  ChevronLeft,
  SendHorizontal,
  ArrowUp,
  Plus,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import {
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
  useSendMessageMutation,
  chatApiHelpers,
} from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useNotification } from "../contexts/NotificationContext";
import { useSelector, useDispatch } from "react-redux";
import { BlurView } from "expo-blur";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";

const ChatDetailScreen = ({ navigation, route }) => {
  const { partnerId, partnerName, partner } = route.params || {};

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);

  // ✅ Enhanced pagination state with better control
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [backgroundLoadedUntilPage, setBackgroundLoadedUntilPage] = useState(2);
  const [paginationComplete, setPaginationComplete] = useState(false);

  const flatListRef = useRef();
  const typingTimeoutRef = useRef();
  const textInputRef = useRef();
  const backgroundLoadingTimeoutRef = useRef();
  const headerHeight = Platform.OS === "ios" ? useHeaderHeight() : 0;

  const insets = useSafeAreaInsets();

  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?.id || user?.userId;
  const dispatch = useDispatch();

  // Get notification context for screen tracking
  const { updateCurrentScreen } = useNotification();

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

  // ✅ Backend response format'ına uygun parseBackendResponse
  const parseBackendResponse = (response) => {
    if (!response) return { messages: [], hasNextPage: false, currentPage: 1 };


    // Backend'den gelen format: { messages: [], hasNextPage: boolean, currentPage: number, pageSize: number }
    if (response.messages && Array.isArray(response.messages)) {
      const {
        messages,
        hasNextPage,
        currentPage: respCurrentPage,
        pageSize,
      } = response;


      return {
        messages,
        hasNextPage: Boolean(hasNextPage),
        currentPage: respCurrentPage || 1,
        pageSize: pageSize || 20,
      };
    }

    // Fallback: Eğer direkt array gelirse (eski format)
    if (Array.isArray(response)) {
      return {
        messages: response,
        hasNextPage: response.length === 20, // Backend 20+1 kontrolü yapıyor
        currentPage: 1,
      };
    }

    return { messages: [], hasNextPage: false, currentPage: 1 };
  };

  // ✅ First 2 pages queries
  const {
    data: firstPageResponse,
    isLoading: isLoadingFirstPage,
    error: firstPageError,
    refetch: refetchFirstPage,
  } = useGetChatHistoryQuery(
    { partnerId, page: 1 },
    {
      skip: !partnerId,
      refetchOnMountOrArgChange: 120, // ✅ OPTIMIZED: 2 dakika cooldown
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const {
    data: secondPageResponse,
    isLoading: isLoadingSecondPage,
    error: secondPageError,
  } = useGetChatHistoryQuery(
    { partnerId, page: 2 },
    {
      skip: !partnerId,
      refetchOnMountOrArgChange: 120, // ✅ OPTIMIZED: 2 dakika cooldown
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // ✅ Dynamic page loading query (6+ pages)
  const {
    data: currentPageResponse,
    isLoading: isLoadingCurrentPage,
    error: currentPageError,
    refetch: refetchCurrentPage,
  } = useGetChatHistoryQuery(
    { partnerId, page: currentPage },
    {
      skip: !partnerId || currentPage <= 5 || loadedPages.has(currentPage),
    }
  );

  // ✅ Lazy query for background preloading (3-5 pages)
  const [
    triggerBackgroundLoad,
    { data: backgroundPageResponse, isLoading: isLoadingBackgroundPage },
  ] = useLazyGetChatHistoryQuery();

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Register current screen for notification filtering
  useEffect(() => {
    if (partnerId) {

      updateCurrentScreen("ChatDetailScreen", partnerId);
    }

    // Cleanup when leaving screen
    return () => {
      updateCurrentScreen(null, null);
    };
  }, [partnerId, updateCurrentScreen]);

  // Partner online status
  const isPartnerOnline = onlineUsers.has(partnerId);
  const isPartnerTyping = typingUsers.has(partnerId);

  const scrollToBottom = useCallback((animated = true) => {
    if (!flatListRef.current) return;

    requestAnimationFrame(() => {
      try {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated,
        });
      } catch (error) {
        try {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated,
            viewPosition: 0,
          });
        } catch (indexError) {
        }
      }
    });
  }, []);

  const scrollToBottomWithDelay = useCallback(
    (delay = 100, animated = true) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom(animated);
        }, delay);
      });
    },
    [scrollToBottom]
  );

  // ✅ Enhanced background preloading with backend format
  const startBackgroundPreloading = useCallback(async () => {
    if (
      !hasMoreMessages ||
      isBackgroundLoading ||
      backgroundLoadedUntilPage >= 5 ||
      paginationComplete
    ) {
      return;
    }

    setIsBackgroundLoading(true);

    for (let page = backgroundLoadedUntilPage + 1; page <= 5; page++) {
      if (loadedPages.has(page)) {
        continue;
      }

      try {

        await new Promise((resolve) => {
          backgroundLoadingTimeoutRef.current = setTimeout(
            resolve,
            page === 3 ? 100 : 1500
          );
        });

        const result = await triggerBackgroundLoad({
          partnerId,
          page,
        }).unwrap();

        const { messages: pageMessages, hasNextPage } =
          parseBackendResponse(result);


        setMessages((prevMessages) => {
          const combinedMessages = [...prevMessages, ...pageMessages];
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

          return uniqueMessages;
        });

        setLoadedPages((prev) => new Set([...prev, page]));
        setBackgroundLoadedUntilPage(page);

        if (!hasNextPage || pageMessages.length === 0) {
          setHasMoreMessages(false);
          setPaginationComplete(true);
          break;
        } else if (page === 5) {
          setHasMoreMessages(hasNextPage);
          break;
        }
      } catch (error) {
        break;
      }
    }

    setIsBackgroundLoading(false);
  }, [
    hasMoreMessages,
    isBackgroundLoading,
    backgroundLoadedUntilPage,
    loadedPages,
    partnerId,
    triggerBackgroundLoad,
    paginationComplete,
  ]);

  // ✅ Enhanced initial loading with proper backend format handling
  useEffect(() => {
    if (firstPageResponse && secondPageResponse && !hasLoadedInitialMessages) {
      const { messages: firstPageMessages, hasNextPage: firstHasNext } =
        parseBackendResponse(firstPageResponse);
      const { messages: secondPageMessages, hasNextPage: secondHasNext } =
        parseBackendResponse(secondPageResponse);


      const combinedMessages = [...firstPageMessages, ...secondPageMessages];
      const uniqueMessages = combinedMessages.filter(
        (message, index, self) =>
          index ===
          self.findIndex(
            (m) =>
              m.id === message.id ||
              (m.content === message.content &&
                m.senderUserId === message.senderUserId &&
                Math.abs(new Date(m.sentAt) - new Date(message.sentAt)) < 2000)
          )
      );

      setMessages(uniqueMessages);
      setHasLoadedInitialMessages(true);
      setLoadedPages(new Set([1, 2]));
      setCurrentPage(6);

      // ✅ Backend'in hasNextPage response'una göre pagination kontrolü
      if (!secondHasNext || secondPageMessages.length === 0) {
        setHasMoreMessages(false);
        setPaginationComplete(true);
      } else {
        setHasMoreMessages(secondHasNext);
      }

      setIsInitialLoading(false);

      if (secondHasNext && secondPageMessages.length > 0) {
        setTimeout(() => {
          startBackgroundPreloading();
        }, 500);
      } else {
      }
    } else if (
      firstPageResponse &&
      !secondPageResponse &&
      !hasLoadedInitialMessages
    ) {
      const { messages: firstPageMessages, hasNextPage } =
        parseBackendResponse(firstPageResponse);

      setMessages(firstPageMessages);
      setHasLoadedInitialMessages(true);
      setLoadedPages(new Set([1]));
      setCurrentPage(2);

      if (!hasNextPage || firstPageMessages.length === 0) {
        setHasMoreMessages(false);
        setPaginationComplete(true);
      } else {
        setHasMoreMessages(hasNextPage);
      }

      setIsInitialLoading(false);
    }
  }, [
    firstPageResponse,
    secondPageResponse,
    hasLoadedInitialMessages,
    startBackgroundPreloading,
  ]);

  // ✅ Handle dynamic page loading (6+ pages) with backend format
  useEffect(() => {
    if (
      currentPageResponse &&
      currentPage > 5 &&
      !loadedPages.has(currentPage)
    ) {
      const { messages: currentPageMessages, hasNextPage } =
        parseBackendResponse(currentPageResponse);


      if (!hasNextPage || currentPageMessages.length === 0) {
        setHasMoreMessages(false);
        setPaginationComplete(true);
      }

      setMessages((prevMessages) => {
        const combinedMessages = [...prevMessages, ...currentPageMessages];
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

        return uniqueMessages;
      });

      setLoadedPages((prev) => new Set([...prev, currentPage]));
      setHasMoreMessages(hasNextPage && currentPageMessages.length > 0);
      setIsLoadingMore(false);

    }
  }, [currentPageResponse, currentPage, loadedPages]);

  // ✅ Enhanced load more with backend format
  const handleLoadMore = useCallback(async () => {
    if (
      isLoadingMore ||
      !hasMoreMessages ||
      paginationComplete ||
      isLoadingCurrentPage ||
      currentPage <= 5 ||
      isBackgroundLoading
    ) {
      return;
    }

    const pagesToLoad = Math.min(5, Math.ceil(hasMoreMessages ? 5 : 1));
    const startPage = currentPage;
    const endPage = startPage + pagesToLoad - 1;

    setIsLoadingMore(true);

    try {
      const pagePromises = [];
      for (let page = startPage; page <= endPage; page++) {
        if (!loadedPages.has(page)) {
          pagePromises.push(
            triggerBackgroundLoad({ partnerId, page }).unwrap()
          );
        }
      }

      const results = await Promise.all(pagePromises);
      let allMessages = [];
      let finalHasMore = false;
      let shouldComplete = false;

      results.forEach((result, index) => {
        const actualPage = startPage + index;
        const { messages: pageMessages, hasNextPage } =
          parseBackendResponse(result);

        allMessages = [...allMessages, ...pageMessages];
        finalHasMore = hasNextPage;

        if (!hasNextPage || pageMessages.length === 0) {
          shouldComplete = true;
        }

        setLoadedPages((prev) => new Set([...prev, actualPage]));
      });

      setMessages((prevMessages) => {
        const combinedMessages = [...prevMessages, ...allMessages];
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

        return uniqueMessages;
      });

      setCurrentPage(endPage + 1);

      if (shouldComplete || !finalHasMore || allMessages.length === 0) {
        setHasMoreMessages(false);
        setPaginationComplete(true);
      } else {
        setHasMoreMessages(finalHasMore);
      }

    } catch (error) {
      Alert.alert("Error", "Failed to load more messages. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMoreMessages,
    paginationComplete,
    isLoadingCurrentPage,
    currentPage,
    loadedPages,
    isBackgroundLoading,
    partnerId,
    triggerBackgroundLoad,
  ]);

  // ✅ Enhanced scroll handler
  const handleScroll = useCallback(
    (event) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const isAtTop =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;

      if (
        isAtTop &&
        hasMoreMessages &&
        !paginationComplete &&
        !isLoadingMore &&
        !isBackgroundLoading
      ) {
        handleLoadMore();
      }
    },
    [
      hasMoreMessages,
      paginationComplete,
      isLoadingMore,
      isBackgroundLoading,
      handleLoadMore,
    ]
  );

  // ✅ Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (backgroundLoadingTimeoutRef.current) {
        clearTimeout(backgroundLoadingTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Enhanced refresh messages - Reset all pagination state
  const refreshMessages = useCallback(() => {

    if (backgroundLoadingTimeoutRef.current) {
      clearTimeout(backgroundLoadingTimeoutRef.current);
    }

    setHasLoadedInitialMessages(false);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(true);
    setPaginationComplete(false);
    setIsLoadingMore(false);
    setLoadedPages(new Set());
    setIsInitialLoading(true);
    setIsBackgroundLoading(false);
    setBackgroundLoadedUntilPage(2);

    refetchFirstPage();
  }, [refetchFirstPage]);

  // ✅ OPTIMIZED: Screen-specific SignalR listeners - Sadece bu ekrana özel olanlar
  useEffect(() => {
    if (!connection || !isConnected) return;


    // ✅ Screen-specific: Sadece bu chat'e gelen mesajları real-time UI'da göster
    const handleScreenReceiveMessage = (messageData) => {

      const senderId = messageData.SenderUserId || messageData.senderUserId;
      const receiverId =
        messageData.ReceiverUserId || messageData.receiverUserId;

      // Sadece bu chat ile ilgili mesajları UI'da göster
      if (senderId === partnerId || receiverId === partnerId) {
        const newMessage = {
          id: messageData.Id || messageData.id || `msg-${Date.now()}`,
          senderUserId: senderId,
          receiverUserId: receiverId || currentUserId,
          content: messageData.Content || messageData.content,
          sentAt:
            messageData.SentAt ||
            messageData.sentAt ||
            new Date().toISOString(),
          isRead: messageData.IsRead || messageData.isRead || false,
        };

        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (msg) =>
              msg.id === newMessage.id ||
              (msg.content === newMessage.content &&
                msg.senderUserId === newMessage.senderUserId &&
                Math.abs(new Date(msg.sentAt) - new Date(newMessage.sentAt)) <
                  2000)
          );

          if (!exists) {
            return [newMessage, ...prevMessages];
          } else {
          }
          return prevMessages;
        });

        scrollToBottomWithDelay(0, true);

        // Partner'dan gelen mesajları otomatik okundu işaretle
        if (senderId === partnerId && isConnected) {
          setTimeout(() => {
            markMessagesAsRead(partnerId);
          }, 500);
        }
      }
    };

    // ✅ Screen-specific: Optimistic message'ların confirmation'ını handle et
    const handleScreenMessageSent = (confirmationData) => {

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.isOptimistic) {
            const updatedMessage = {
              ...msg,
              isOptimistic: false,
              sentAt:
                confirmationData.SentAt ||
                confirmationData.sentAt ||
                msg.sentAt,
              id: msg.id.startsWith("temp-")
                ? confirmationData.MessageId ||
                  confirmationData.messageId ||
                  `msg-${Date.now()}`
                : msg.id,
            };
            return updatedMessage;
          }
          return msg;
        })
      );
    };

    // ✅ Screen-specific: Bu chat'teki mesajların read status'unu güncelle
    const handleScreenMessagesRead = (readData) => {

      const readByUserId = readData.ReadByUserId || readData.readByUserId;

      if (readByUserId === partnerId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.senderUserId === currentUserId ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    // ✅ Screen-specific: Message error handling
    const handleScreenMessageError = (errorData) => {

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(
          (msg) => !msg.isOptimistic
        );
        return filteredMessages;
      });

      Alert.alert(
        "Message Failed",
        errorData.Error || errorData.error || "Failed to send message"
      );
    };

    // ✅ Sadece screen-specific listener'ları ekle
    connection.on("ReceiveMessage", handleScreenReceiveMessage);
    connection.on("MessageSent", handleScreenMessageSent);
    connection.on("MessagesRead", handleScreenMessagesRead);
    connection.on("MessageError", handleScreenMessageError);

    return () => {
      connection.off("ReceiveMessage", handleScreenReceiveMessage);
      connection.off("MessageSent", handleScreenMessageSent);
      connection.off("MessagesRead", handleScreenMessagesRead);
      connection.off("MessageError", handleScreenMessageError);
    };
  }, [
    connection,
    isConnected,
    partnerId,
    currentUserId,
    markMessagesAsRead,
    scrollToBottomWithDelay,
  ]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (partnerId && isConnected && hasLoadedInitialMessages) {
      markMessagesAsRead(partnerId);
    }
  }, [partnerId, isConnected, hasLoadedInitialMessages, markMessagesAsRead]);

  // Update partners list when leaving chat
  useEffect(() => {
    return () => {
      chatApiHelpers.updatePartnersList(dispatch);
      chatApiHelpers.updateUnreadCount(dispatch);
    };
  }, [dispatch]);

  // Auto-focus keyboard when navigated from notification
  useEffect(() => {
    if (hasLoadedInitialMessages && textInputRef.current) {
      // Check if this navigation came from a notification
      const fromNotification =
        route.params?.fromNotification || route.params?.type === "new_message";

      if (fromNotification) {
        // Add a small delay to ensure screen is fully rendered
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 500);
      }
    }
  }, [hasLoadedInitialMessages, route.params]);

  // Debug logging
  useEffect(() => {
  }, [
    messages,
    currentPage,
    hasMoreMessages,
    paginationComplete,
    loadedPages,
    backgroundLoadedUntilPage,
    isBackgroundLoading,
  ]);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      startTyping(partnerId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(partnerId);
    }, 1000);
  }, [isTyping, isConnected, partnerId, startTyping, stopTyping]);

  // ✅ Enhanced send message handler - Backend API format'ına uygun
  const handleSendMessage = async () => {
    if (!message.trim() || !partnerId) {
      return;
    }

    const messageText = message.trim();
    setMessage("");

    if (isTyping) {
      setIsTyping(false);
      stopTyping(partnerId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderUserId: currentUserId,
      receiverUserId: partnerId,
      content: messageText,
      sentAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
    };


    setMessages((prevMessages) => {
      const newMessages = [optimisticMessage, ...prevMessages];
      return newMessages;
    });

    scrollToBottomWithDelay(0, true);

    try {
      if (isConnected) {
        await sendSignalRMessage(partnerId, messageText);
      } else {
        const result = await sendMessage({
          receiverUserId: partnerId,
          content: messageText,
        }).unwrap();


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
      }
    } catch (error) {

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(
          (msg) => msg.id !== optimisticMessage.id
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

  // Helper functions
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

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

  const formatMessageTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // ✅ Enhanced renderMessage - Backend field names ile uyumlu
  const renderMessage = ({ item, index }) => {
    const isSent = item.senderUserId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage =
      index < messages.length - 1 ? messages[index + 1] : null;

    const showDateSeparator =
      !nextMessage || !isSameDay(item.sentAt, nextMessage.sentAt);
    const showAvatar =
      !isSent &&
      (!prevMessage || prevMessage.senderUserId !== item.senderUserId);

    return (
      <View style={{ marginBottom: 1 }}>
        {/* Date separator */}
        {showDateSeparator && (
          <View className="items-center my-4">
            <Text className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
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
                    <CheckCheck size={10} color="#5ba8fc" />
                  ) : (
                    <Check size={10} color="#b0b0b0" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ✅ Enhanced loading state
  if (isInitialLoading || (isLoadingFirstPage && !hasLoadedInitialMessages)) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-2 text-gray-600">Loading messages...</Text>
        {isBackgroundLoading && (
          <Text className="mt-1 text-gray-500 text-sm">
            Preparing more messages in background...
          </Text>
        )}
      </View>
    );
  }

  // ✅ Enhanced error state
  if (firstPageError && !hasLoadedInitialMessages) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="dark" backgroundColor="transparent" translucent />

        <View className="flex-1 justify-center items-center px-4">
          <CircleAlert size={40} color="#ef4444" />
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

        {/* BlurView Header for error state */}
        <BlurView
          intensity={90}
          tint="light"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            paddingTop: insets.top,
          }}
        >
          <View className="px-4 py-3 flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2 -ml-2 mr-2"
            >
              <ArrowLeft size={20} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              {partner?.name && partner?.surname
                ? `${partner.name} ${partner.surname}`
                : partnerName || partnerId}
            </Text>
          </View>
        </BlurView>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* ✅ Enhanced BlurView Header - Backend partner data ile uyumlu */}
      <BlurView
        intensity={70}
        tint="light"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 150,
          paddingTop: insets.top,
        }}
      >
        <View className="px-4 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2 -ml-2 mr-2"
            >
              <ChevronLeft size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center flex-1"
              onPress={() => {
                navigation.navigate("UserProfile", {
                  userId: partnerId,
                  userRole: partner?.role || "KIRACI", // Default to KIRACI if role not available
                });
              }}
            >
              <View
                style={{
                  boxShadow: "0px 0px 12px #00000014",
                  width: 48,
                  height: 48,
                }}
                className="rounded-full bg-white justify-center items-center overflow-hidden mr-3"
              >
                {partner?.profileImageUrl &&
                partner?.profileImageUrl !== "default_profile_image_url" ? (
                  <Image
                    style={{ width: 48, height: 48 }}
                    source={{ uri: partner.profileImageUrl }}
                    className="w-full h-full"
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <Text
                    style={{ fontSize: 20 }}
                    className="text-gray-900 font-bold"
                  >
                    {(partner?.name || partnerName || partnerId)
                      ?.charAt(0)
                      ?.toUpperCase() || "P"}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontSize: 18 }}
                  className="font-semibold text-gray-900"
                >
                  {/* ✅ Backend'den gelen partner data'sını kullan */}
                  {partner?.name && partner?.surname
                    ? `${partner.name} ${partner.surname}`
                    : partnerName || partner?.userName || partnerId}
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
              <Info size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      {/* ✅ Enhanced Keyboard Sticky Input Area */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: 28 }}
        style={{
          paddingTop: Platform.OS === "ios" ? insets.top + 40 : insets.top + 50,
          paddingBottom: 80,
          zIndex: 100,
          flex: 1,
        }}
      >
        {/* ✅ Messages FlatList - Backend pagination ile uyumlu */}
        <Animated.FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) =>
            item.id?.toString() || `${item.senderUserId}-${item.sentAt}`
          }
          className="flex-1 px-4"
          contentContainerStyle={{
            flexGrow: 1,
          }}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          inverted={true}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-500 text-base text-center">
                No messages yet. Start the conversation!
              </Text>
            </View>
          )}
          // ✅ Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          legacyImplementation={false}
          disableVirtualization={false}
          // ✅ Loading more indicator
          ListHeaderComponent={() =>
            isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#0ea5e9" />
                <Text className="mt-2 text-sm text-gray-500">
                  Loading more messages...
                </Text>
              </View>
            ) : null
          }
        />

        {/* ✅ Enhanced Input Area with BlurView */}
        <BlurView
          style={{ paddingBottom: insets.bottom, borderTopWidth: 0.5 }}
          className="py-1.5 border-gray-200 absolute bottom-0 w-full"
          intensity={70}
          tint="light"
        >
          <View className="px-3">
            <View className="flex-row items-center">
              {/* Plus Button */}
              <TouchableOpacity
                className="w-8 h-8 rounded-full items-center justify-center mr-2 mb-1"
                onPress={() => {
                }}
              >
                <Plus size={25} color="#000" />
              </TouchableOpacity>

              {/* Text Input Container */}
              <BlurView
                style={{ borderWidth: 0.5 }}
                intensity={10}
                tint="systemUltraThinMaterialDark"
                className="flex-1 rounded-3xl overflow-hidden px-4 max-h-[100px] border-gray-200"
              >
                <TextInput
                  ref={textInputRef}
                  className="text-base"
                  value={message}
                  scrollEnabled={message.length > 50 ? true : false}
                  onChangeText={(text) => {
                    setMessage(text);
                    if (text.trim()) {
                      handleTypingStart();
                    }
                  }}
                  multiline
                  maxLength={500}
                  placeholder=""
                  placeholderTextColor="#9ca3af"
                  editable={!isSending}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                  style={{
                    fontSize: 16,
                    lineHeight: 20,
                    color: "#000",
                    paddingTop: Platform.OS === "ios" ? 8 : 4,
                    paddingBottom: Platform.OS === "ios" ? 8 : 4,
                    minHeight: 24,
                  }}
                  textAlignVertical="center"
                />
              </BlurView>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSendMessage}
                style={{
                  marginLeft: 8,
                  marginBottom: 1,
                }}
                className="w-10 h-10 items-center justify-center"
                disabled={!message.trim() || isSending}
              >
                <ArrowUp
                  size={25}
                  color={message.trim() ? "#000" : "#a6a6a6"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </KeyboardStickyView>
    </View>
  );
};

export default ChatDetailScreen;
