// screens/ChatDetailScreen.js - Fixed pagination with proper hasNextPage handling
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
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
} from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";
import {
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
  useSendMessageMutation,
  chatApiHelpers,
} from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useSelector, useDispatch } from "react-redux";
import { BlurView } from "expo-blur";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import { faArrowUp, faPlus } from "@fortawesome/pro-regular-svg-icons";

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
  const [paginationComplete, setPaginationComplete] = useState(false); // ✅ New flag

  const flatListRef = useRef();
  const typingTimeoutRef = useRef();
  const textInputRef = useRef();
  const backgroundLoadingTimeoutRef = useRef();
  const headerHeight = Platform.OS === "ios" ? useHeaderHeight() : 0;

  const insets = useSafeAreaInsets();

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
      refetchOnMountOrArgChange: true,
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
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  console.log("firstPageResponse:", firstPageResponse);

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

  // Partner online status
  const isPartnerOnline = onlineUsers.has(partnerId);
  const isPartnerTyping = typingUsers.has(partnerId);

  const scrollToBottom = useCallback((animated = true) => {
    if (!flatListRef.current) return;

    requestAnimationFrame(() => {
      try {
        // ✅ Inverted mode için scrollToOffset(0) kullan
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated,
        });
      } catch (error) {
        console.log("Scroll error:", error);
        // Fallback: try scrolling to index 0
        try {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated,
            viewPosition: 0,
          });
        } catch (indexError) {
          console.log("Index scroll error:", indexError);
        }
      }
    });
  }, []);

  // ✅ Enhanced scroll to bottom with delay for better UX
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

  // ✅ Enhanced parseBackendResponse with better hasNextPage handling
  const parseBackendResponse = (response) => {
    if (!response) return { messages: [], hasNextPage: false, currentPage: 1 };

    if (Array.isArray(response)) {
      return {
        messages: response,
        hasNextPage: response.length === 20, // Only assume more if we got full page
        currentPage: 1,
      };
    }

    const hasNextPage = Boolean(response.hasNextPage);
    const messages = response.messages || [];

    console.log(
      `📊 Parsing response - Page ${response.currentPage || "unknown"}: ${
        messages.length
      } messages, hasNextPage: ${hasNextPage}`
    );

    return {
      messages,
      hasNextPage,
      currentPage: response.currentPage || 1,
      pageSize: response.pageSize || 20,
    };
  };

  // ✅ Enhanced background preloading with better completion detection
  const startBackgroundPreloading = useCallback(async () => {
    if (
      !hasMoreMessages ||
      isBackgroundLoading ||
      backgroundLoadedUntilPage >= 5 ||
      paginationComplete
    ) {
      console.log("⏭️ Skipping background preloading:", {
        hasMoreMessages,
        isBackgroundLoading,
        backgroundLoadedUntilPage,
        paginationComplete,
      });
      return;
    }

    console.log(
      `🔄 Starting background preloading from page ${
        backgroundLoadedUntilPage + 1
      } to 5`
    );
    setIsBackgroundLoading(true);

    // Load pages 3, 4, 5 one by one with delays
    for (let page = backgroundLoadedUntilPage + 1; page <= 5; page++) {
      if (loadedPages.has(page)) {
        console.log(`⏭️ Page ${page} already loaded, skipping`);
        continue;
      }

      try {
        console.log(`📦 Background loading page ${page}...`);

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

        console.log(
          `✅ Background loaded page ${page}: ${pageMessages.length} messages, hasNext: ${hasNextPage}`
        );

        // Add messages to state
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

          console.log(
            `📦 Background merge page ${page}: ${combinedMessages.length} -> ${uniqueMessages.length}`
          );
          return uniqueMessages;
        });

        // Mark page as loaded
        setLoadedPages((prev) => new Set([...prev, page]));
        setBackgroundLoadedUntilPage(page);

        // ✅ Check if pagination should be complete
        if (!hasNextPage || pageMessages.length === 0) {
          setHasMoreMessages(false);
          setPaginationComplete(true);
          break;
        } else if (page === 5) {
          // Continue with regular pagination for 6+ pages
          setHasMoreMessages(hasNextPage);
          break;
        }
      } catch (error) {
        console.error(`❌ Background loading failed for page ${page}:`, error);
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

  // ✅ Enhanced initial loading with proper completion detection
  useEffect(() => {
    if (firstPageResponse && secondPageResponse && !hasLoadedInitialMessages) {
      const { messages: firstPageMessages, hasNextPage: firstHasNext } =
        parseBackendResponse(firstPageResponse);
      const { messages: secondPageMessages, hasNextPage: secondHasNext } =
        parseBackendResponse(secondPageResponse);

      console.log("📖 Setting initial messages from pages 1 & 2:", {
        page1Count: firstPageMessages.length,
        page2Count: secondPageMessages.length,
        page1HasNext: firstHasNext,
        page2HasNext: secondHasNext,
      });

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

      // ✅ Check if we should stop pagination early
      if (!secondHasNext || secondPageMessages.length === 0) {
        console.log("🏁 Pagination complete after page 2");
        setHasMoreMessages(false);
        setPaginationComplete(true);
      } else {
        setHasMoreMessages(secondHasNext);
      }

      setIsInitialLoading(false);

      // ✅ Only start background preloading if there are more messages
      if (secondHasNext && secondPageMessages.length > 0) {
        setTimeout(() => {
          startBackgroundPreloading();
        }, 500);
        console.log(
          "📖 Initial load complete, starting background preloading..."
        );
      } else {
        console.log("📖 Initial load complete, no more messages to load");
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

      // ✅ Check if pagination is complete
      if (!hasNextPage || firstPageMessages.length === 0) {
        setHasMoreMessages(false);
        setPaginationComplete(true);
        console.log("🏁 Pagination complete after page 1");
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

  // ✅ Handle dynamic page loading (6+ pages) with completion detection
  useEffect(() => {
    if (
      currentPageResponse &&
      currentPage > 5 &&
      !loadedPages.has(currentPage)
    ) {
      const { messages: currentPageMessages, hasNextPage } =
        parseBackendResponse(currentPageResponse);

      console.log(`📖 Loading page ${currentPage}:`, {
        messageCount: currentPageMessages.length,
        hasNextPage,
      });

      // ✅ Check if pagination should be complete
      if (!hasNextPage || currentPageMessages.length === 0) {
        console.log(`🏁 Pagination complete at page ${currentPage}`);
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

      console.log(
        `📖 Page ${currentPage} loaded. HasMore: ${hasNextPage}, Complete: ${
          !hasNextPage || currentPageMessages.length === 0
        }`
      );
    }
  }, [currentPageResponse, currentPage, loadedPages]);

  // ✅ FIXED: Load more messages with proper completion checking
  const handleLoadMore = useCallback(async () => {
    // ✅ Enhanced conditions to prevent unnecessary requests
    if (
      isLoadingMore ||
      !hasMoreMessages ||
      paginationComplete ||
      isLoadingCurrentPage ||
      currentPage <= 5 ||
      isBackgroundLoading
    ) {
      console.log("⚠️ Skipping load more:", {
        isLoadingMore,
        hasMoreMessages,
        paginationComplete,
        isLoadingCurrentPage,
        currentPage,
        isBackgroundLoading,
      });
      return;
    }

    // ✅ Load 5 pages at once for better UX
    const pagesToLoad = Math.min(5, Math.ceil(hasMoreMessages ? 5 : 1));
    const startPage = currentPage;
    const endPage = startPage + pagesToLoad - 1;

    console.log(`📖 Loading pages ${startPage} to ${endPage}...`);
    setIsLoadingMore(true);

    try {
      // Load multiple pages in parallel
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

        // ✅ Check if we should complete pagination
        if (!hasNextPage || pageMessages.length === 0) {
          shouldComplete = true;
          console.log(`🏁 Pagination should complete at page ${actualPage}`);
        }

        // Mark pages as loaded
        setLoadedPages((prev) => new Set([...prev, actualPage]));

        console.log(
          `📖 Batch loaded page ${actualPage}: ${pageMessages.length} messages`
        );
      });

      // Add all messages at once
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

        console.log(
          `📖 Batch merge: ${combinedMessages.length} -> ${uniqueMessages.length}`
        );
        return uniqueMessages;
      });

      setCurrentPage(endPage + 1);

      // ✅ Set completion state properly
      if (shouldComplete || !finalHasMore || allMessages.length === 0) {
        setHasMoreMessages(false);
        setPaginationComplete(true);
        console.log("🏁 Pagination marked as complete");
      } else {
        setHasMoreMessages(finalHasMore);
      }

      console.log(
        `📖 Batch load complete. Next page: ${
          endPage + 1
        }, HasMore: ${finalHasMore}, Complete: ${shouldComplete}`
      );
    } catch (error) {
      console.error("❌ Failed to load more pages:", error);
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

  // ✅ Enhanced scroll handler with better completion checking
  const handleScroll = useCallback(
    (event) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      // ✅ Inverted mode için en üst = offset büyük değer
      const isAtTop =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;

      if (
        isAtTop &&
        hasMoreMessages &&
        !paginationComplete &&
        !isLoadingMore &&
        !isBackgroundLoading
      ) {
        console.log("📜 User scrolled to top, triggering load more");
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

  // ✅ Function to sync message to cache
  const syncMessageToCache = useCallback(
    (messageData) => {
      console.log("🔄 Syncing message to cache:", messageData);
      chatApiHelpers.addMessageToCache(dispatch, partnerId, messageData);
      chatApiHelpers.updatePartnersList(dispatch);
    },
    [dispatch, partnerId]
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
    console.log("🔄 Refreshing messages - resetting all pagination state");

    // Clear all timeouts
    if (backgroundLoadingTimeoutRef.current) {
      clearTimeout(backgroundLoadingTimeoutRef.current);
    }

    setHasLoadedInitialMessages(false);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(true);
    setPaginationComplete(false); // ✅ Reset completion flag
    setIsLoadingMore(false);
    setLoadedPages(new Set());
    setIsInitialLoading(true);
    setIsBackgroundLoading(false);
    setBackgroundLoadedUntilPage(2);

    refetchFirstPage();
  }, [refetchFirstPage]);

  // SignalR message listeners (unchanged)
  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log("Setting up SignalR listeners for chat:", partnerId);

    const handleReceiveMessage = (messageData) => {
      console.log(
        "📨 Received new message via SignalR:",
        JSON.stringify(messageData, null, 2)
      );

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
            console.log("✅ Adding new message to local state at index 0");
            return [newMessage, ...prevMessages];
          } else {
            console.log("⚠️ Duplicate message, not adding");
          }
          return prevMessages;
        });

        syncMessageToCache(messageData);

        scrollToBottomWithDelay(0, true);

        if (messageData.SenderUserId === partnerId && isConnected) {
          setTimeout(() => {
            markMessagesAsRead(partnerId);
          }, 500);
        }
      }
    };

    const handleMessageSent = (confirmationData) => {
      console.log(
        "✅ Message sent confirmation:",
        JSON.stringify(confirmationData, null, 2)
      );

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
              id: msg.id.startsWith("temp-") ? `msg-${Date.now()}` : msg.id,
            };

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

    const handleMessagesRead = (readData) => {
      console.log("Messages marked as read:", readData);

      if (readData.ReadByUserId === partnerId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.senderUserId === currentUserId ? { ...msg, isRead: true } : msg
          )
        );

        chatApiHelpers.markCacheMessagesAsRead(
          dispatch,
          partnerId,
          currentUserId
        );
      }
    };

    const handleMessageError = (errorData) => {
      console.error("❌ Message error:", JSON.stringify(errorData, null, 2));

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

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessageSent", handleMessageSent);
    connection.on("MessagesRead", handleMessagesRead);
    connection.on("MessageError", handleMessageError);

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

  // Update partners list when leaving chat
  useEffect(() => {
    return () => {
      console.log("🔄 Chat screen unmounting, updating partners list");
      chatApiHelpers.updatePartnersList(dispatch);
      chatApiHelpers.updateUnreadCount(dispatch);
    };
  }, [dispatch]);

  // ✅ Enhanced debug logging with completion status
  useEffect(() => {
    console.log("📊 Messages state updated:", {
      count: messages.length,
      latestMessage: messages[0],
      optimisticCount: messages.filter((m) => m.isOptimistic).length,
      currentPage,
      hasMoreMessages,
      paginationComplete, // ✅ Added completion status
      loadedPages: Array.from(loadedPages),
      backgroundLoadedUntilPage,
      isBackgroundLoading,
    });
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

  // Send message handler (unchanged)
  const handleSendMessage = async () => {
    if (!message.trim() || !partnerId) {
      console.log("❌ Empty message or no partnerId");
      return;
    }

    const messageText = message.trim();
    console.log("📤 Sending message:", { partnerId, messageText, isConnected });
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

    console.log("🔮 Adding optimistic message at index 0:", optimisticMessage);

    setMessages((prevMessages) => {
      const newMessages = [optimisticMessage, ...prevMessages];
      return newMessages;
    });

    // ✅ AUTO-SCROLL AFTER SENDING MESSAGE
    scrollToBottomWithDelay(0, true);

    try {
      if (isConnected) {
        console.log("📡 Sending message via SignalR...");
        await sendSignalRMessage(partnerId, messageText);
        console.log("✅ Message sent via SignalR successfully");
      } else {
        console.log("🌐 SignalR not connected, using REST API...");
        const result = await sendMessage({
          receiverUserId: partnerId,
          content: messageText,
        }).unwrap();

        console.log("✅ Message sent via REST API:", result);

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

  // Helper functions (unchanged)
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

  // 2. ✅ renderMessage fonksiyonunu inverted mode için güncelleme
  const renderMessage = ({ item, index }) => {
    const isSent = item.senderUserId === currentUserId;

    // ✅ Inverted mode için index hesaplaması değişti
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage =
      index < messages.length - 1 ? messages[index + 1] : null;

    // ✅ Show date separator only when day changes
    const showDateSeparator =
      !nextMessage || !isSameDay(item.sentAt, nextMessage.sentAt);

    const showAvatar =
      !isSent &&
      (!prevMessage || prevMessage.senderUserId !== item.senderUserId);

    return (
      <View style={{ marginBottom: 1 }}>
        {/* ✅ Date separator - shows only when day changes */}
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

  // ✅ Initial loading state (while first 2 pages are loading)
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

        {/* ✅ BlurView Header for error state with manual safe area */}
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
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* ✅ BlurView Header with manual safe area */}
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
              <FontAwesomeIcon icon={faChevronLeft} size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center flex-1">
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
                    source={{ uri: partner.profileImageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text
                    style={{ fontSize: 20 }}
                    className="text-gray-900 font-bold"
                  >
                    {(partnerName || partnerId)?.charAt(0)?.toUpperCase() ||
                      "P"}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontSize: 18 }}
                  className="font-semibold text-gray-900"
                >
                  {partner.name} {partner.surname}
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

      {/* ✅ WhatsApp-style Keyboard Sticky Input Area with BlurView */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: 28 }}
        style={{
          paddingTop: Platform.OS === "ios" ? insets.top + 40 : insets.top + 50,
          paddingBottom: 80,
          zIndex: 100,
          flex: 1,
        }}
      >
        {/* ✅ Messages - FlatList with optimized performance */}
        <Animated.FlatList
          ref={flatListRef}
          data={messages} // ✅ .reverse() kaldırıldı çünkü inverted kullanıyoruz
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
          inverted={true} // ✅ Inverted mode - en alttan başlar
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
                  console.log("Open attachment picker");
                }}
              >
                <FontAwesomeIcon icon={faPlus} size={25} color="#000" />
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
                <FontAwesomeIcon
                  icon={faArrowUp}
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
