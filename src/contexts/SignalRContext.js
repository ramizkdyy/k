// contexts/SignalRContext.js - Complete optimized version with duplicate prevention
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from "@microsoft/signalr";
import { useSelector, useDispatch } from "react-redux";
import notificationService from "../services/notificationService";
import { chatApiHelpers } from "../redux/api/chatApiSlice";
import {
  setUnreadSummary,
  incrementUnreadMessages,
  resetChatState,
} from "../redux/slices/chatSlice";
import customNotificationService from "../services/customNotificationService";
import { AppState } from "react-native";
import { SIGNALR_URL } from "../constants/api";

const SignalRContext = createContext();

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
};

export const SignalRProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isConnectingRef = useRef(false);
  const [connectionError, setConnectionError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [lastPingTime, setLastPingTime] = useState(null);
  const [processedMessages] = useState(new Set()); // ✅ Message deduplication

  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const connectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 1;
  const currentHandlersRef = useRef(new Set()); // ✅ Track active handlers
  const previousUserIdRef = useRef(null);
  const isUserSwitchingRef = useRef(false);

  // ✅ Güncel ngrok URL'ini dinamik olarak al veya manuel güncelle
  const SIGNALR_BASE_URL = SIGNALR_URL;

  // ✅ UTILITY: Throttle function for preventing spam
  const throttle = (func, limit) => {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // ✅ ENHANCED: Message deduplication helper
  const isMessageProcessed = useCallback(
    (messageData) => {
      const messageId =
        messageData.Id || messageData.id || messageData.MessageId;
      const content = messageData.Content || messageData.content;
      const senderId = messageData.SenderUserId || messageData.senderUserId;
      const receiverId =
        messageData.ReceiverUserId || messageData.receiverUserId;

      // Create multiple keys for different scenarios
      const keys = [
        messageId,
        `${senderId}-${receiverId}-${content?.substring(0, 50)}`,
        `${messageId}-${senderId}-${receiverId}`,
      ].filter(Boolean);

      // Check if any key exists
      const isProcessed = keys.some((key) => processedMessages.has(key));

      if (!isProcessed) {
        // Add all keys to processed set
        keys.forEach((key) => processedMessages.add(key));

        // Clean up old messages (keep last 300)
        if (processedMessages.size > 300) {
          const array = Array.from(processedMessages);
          processedMessages.clear();
          array.slice(-150).forEach((id) => processedMessages.add(id));
        }
      }

      return isProcessed;
    },
    [processedMessages]
  );

  // ✅ GLOBAL MESAJ HANDLER - Complete with enhanced deduplication
  const setupGlobalMessageHandlers = useCallback(
    (conn) => {
      if (!conn || !user?.id) return;


      // ✅ FIRST: Remove ALL existing handlers completely
      const eventNames = [
        "ReceiveMessage",
        "MessageSent",
        "MessagesRead",
        "MessageError",
        "UnreadCountUpdate",
        "PartnerListUpdate",
        "NewMessageNotification",
        "UnreadSummaryUpdate",
        "UserStatusChanged",
        "UserStartedTyping",
        "UserStoppedTyping",
        "HeartbeatResponse",
        "ConnectionEstablished",
        "Pong",
        "TestResponse",
        "UserStatusResponse",
      ];

      // Remove all existing handlers first
      eventNames.forEach((eventName) => {
        conn.off(eventName);
      });

      // Clear tracked handlers
      currentHandlersRef.current.clear();

      // ✅ Global mesaj alma handler'ı - Enhanced with deduplication
      const handleGlobalReceiveMessage = (messageData) => {

        // ✅ Duplicate check first
        if (isMessageProcessed(messageData)) {
          return;
        }

        const senderId = messageData.SenderUserId || messageData.senderUserId;
        const receiverId =
          messageData.ReceiverUserId || messageData.receiverUserId;
        const content = messageData.Content || messageData.content;
        const messageId =
          messageData.Id || messageData.id || messageData.MessageId;


        // ✅ Doğru partnerId hesaplama
        let partnerId = null;

        // Eğer biz mesajı aldıysak, gönderen kişi partner'dır
        if (receiverId === user?.id && senderId !== user?.id) {
          partnerId = senderId;

          // ✅ Cache'e ekle
          chatApiHelpers.addMessageToCache(dispatch, partnerId, messageData);
          chatApiHelpers.updatePartnersList(dispatch);
          // Unread count'u local state'de artır — API isteği atmaz
          dispatch(incrementUnreadMessages());

          // ✅ Notification gönder (sadece alınan mesajlar için)
          const senderName = messageData.SenderName || messageData.senderName;
          const senderImage =
            messageData.SenderImage || messageData.senderImage;

          if (senderName && content) {
            // Firebase handles foreground notifications, SignalR handles background only
            if (AppState.currentState !== "active") {
              // App is in background - show regular notification
              notificationService.scheduleLocalNotification(
                senderName,
                content,
                {
                  type: "chat_message",
                  chatId: senderId,
                  senderName: senderName,
                  messageId: messageId,
                }
              );
            }
          }
        }
        // Eğer biz mesajı gönderdiysek, alıcı kişi partner'dır
        else if (senderId === user?.id && receiverId !== user?.id) {
          partnerId = receiverId;

          // ✅ Cache'e ekle (sent message confirmation)
          chatApiHelpers.addMessageToCache(dispatch, partnerId, messageData);
          chatApiHelpers.updatePartnersList(dispatch);
        }
      };

      // ✅ Global mesaj gönderildi confirmation handler'ı
      const handleGlobalMessageSent = (confirmationData) => {

        // ✅ Duplicate check
        if (isMessageProcessed(confirmationData)) {
          return;
        }

        const receiverId =
          confirmationData.ReceiverUserId || confirmationData.receiverUserId;
        const senderId =
          confirmationData.SenderUserId || confirmationData.senderUserId;

        // Eğer biz gönderiysek, alıcı partner'dır
        if (senderId === user?.id && receiverId && receiverId !== user?.id) {
          chatApiHelpers.addMessageToCache(
            dispatch,
            receiverId,
            confirmationData
          );
          chatApiHelpers.updatePartnersList(dispatch);
        }
      };

      // ✅ Global mesajlar okundu handler'ı
      const handleGlobalMessagesRead = (readData) => {

        const readByUserId = readData.ReadByUserId || readData.readByUserId;
        const chatPartnerId = readData.ChatPartnerId || readData.chatPartnerId;

        // ReadByUserId partner ise, o partner'ın cache'ini güncelle
        if (readByUserId && readByUserId !== user?.id) {
          chatApiHelpers.markCacheMessagesAsRead(
            dispatch,
            readByUserId,
            user?.id
          );
        }
        // Eğer chatPartnerId varsa onu kullan
        else if (chatPartnerId && chatPartnerId !== user?.id) {
          chatApiHelpers.markCacheMessagesAsRead(
            dispatch,
            chatPartnerId,
            user?.id
          );
        }

        // Okundu bildirimi gelince backend'den taze özet iste; o event UnreadSummaryUpdate
        // olarak geri döner ve setUnreadSummary ile state'i günceller. API isteği atmaz.
      };

      // ✅ Global mesaj hatası handler'ı
      const handleGlobalMessageError = (errorData) => {
        const error = errorData.Error || errorData.error;
        const details = errorData.Details || errorData.details;
      };

      // ✅ Global unread count update handler'ı — backend'den gelen sayıyı direkt kullan
      const handleGlobalUnreadCountUpdate = (updateData) => {
        const totalUnreadCount =
          updateData.TotalUnreadCount || updateData.totalUnreadCount;
        const totalUnreadChats =
          updateData.TotalUnreadChats || updateData.totalUnreadChats;

        if (totalUnreadCount !== undefined || totalUnreadChats !== undefined) {
          dispatch(
            setUnreadSummary({
              totalUnreadMessages: totalUnreadCount,
              totalUnreadChats: totalUnreadChats,
            })
          );
        }
      };

      // ✅ Global partner list update handler'ı
      const handleGlobalPartnerListUpdate = () => {
        chatApiHelpers.updatePartnersList(dispatch);
      };

      // ✅ Global new message notification handler'ı - Enhanced with deduplication
      const handleGlobalNewMessageNotification = (notificationData) => {

        const senderId = notificationData.SenderId || notificationData.senderId;
        const messageId =
          notificationData.MessageId || notificationData.messageId;
        const message = notificationData.Message || notificationData.message;
        const senderName =
          notificationData.SenderName || notificationData.senderName;
        const senderSurname =
          notificationData.SenderSurname || notificationData.senderSurname;

        // ✅ Skip if we already processed this message or it's our own
        if (senderId === user?.id) {
          return;
        }

        // ✅ Duplicate check with notification data
        const notificationKey = `notification-${
          messageId || "no-id"
        }-${senderId}`;
        if (processedMessages.has(notificationKey)) {
          return;
        }
        processedMessages.add(notificationKey);

        if (senderId && senderId !== user?.id && message) {
          const fullMessageData = {
            Id: messageId || `msg-${Date.now()}`,
            SenderUserId: senderId,
            ReceiverUserId: user?.id,
            Content: message,
            SentAt: new Date().toISOString(),
            IsRead: false,
            SenderName: senderName,
          };

          chatApiHelpers.addMessageToCache(dispatch, senderId, fullMessageData);
          chatApiHelpers.updatePartnersList(dispatch);
          // Unread count'u local state'de artır — API isteği atmaz
          dispatch(incrementUnreadMessages());

          // ✅ Show notification only if app is in background (Firebase handles foreground)
          if (AppState.currentState !== "active") {
            const fullSenderName = senderSurname
              ? `${senderName} ${senderSurname}`
              : senderName;
            if (fullSenderName && message) {
              notificationService.scheduleLocalNotification(
                fullSenderName,
                message,
                {
                  type: "chat_message",
                  chatId: senderId,
                  senderName: fullSenderName,
                  messageId: messageId,
                }
              );
            }
          }
        }
      };

      // ✅ Global unread summary update handler'ı — backend'den gelen veriyi direkt kullan
      const handleGlobalUnreadSummaryUpdate = (summaryData) => {
        const totalUnreadMessages =
          summaryData.TotalUnreadMessages ?? summaryData.totalUnreadMessages;
        const totalUnreadChats =
          summaryData.TotalUnreadChats ?? summaryData.totalUnreadChats;

        if (totalUnreadMessages !== undefined || totalUnreadChats !== undefined) {
          dispatch(
            setUnreadSummary({
              totalUnreadMessages,
              totalUnreadChats,
            })
          );
        }
      };

      // ✅ FIXED: Global user status handler'ı - Infinite loop prevention
      const handleGlobalUserStatusChanged = (statusData) => {
        const userId = statusData.UserId || statusData.userId;
        const isOnline = statusData.IsOnline || statusData.isOnline;
        const lastSeen = statusData.LastSeen || statusData.lastSeen;

        // ✅ FIXED: Sadece kendi status'umuz değilse işle
        if (userId && userId !== user?.id) {

          setOnlineUsers((prevUsers) => {
            const newUsers = new Set(prevUsers);
            const hasChanged =
              (isOnline && !newUsers.has(userId)) ||
              (!isOnline && newUsers.has(userId));

            if (hasChanged) {
              if (isOnline) {
                newUsers.add(userId);
              } else {
                newUsers.delete(userId);
              }
              return newUsers;
            }

            return prevUsers; // No change needed
          });
        }
      };

      // ✅ FIXED: Global typing handlers - Throttle ve own user check
      const handleGlobalUserStartedTyping = (userId) => {
        if (userId && userId !== user?.id) {
          setTypingUsers((prev) => {
            if (!prev.has(userId)) {
              return new Set([...prev, userId]);
            }
            return prev;
          });
        }
      };

      const handleGlobalUserStoppedTyping = (userId) => {
        if (userId && userId !== user?.id) {
          setTypingUsers((prev) => {
            if (prev.has(userId)) {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            }
            return prev;
          });
        }
      };

      // ✅ Global heartbeat response handler'ı
      const handleGlobalHeartbeatResponse = (responseData) => {
        const timestamp = responseData.Timestamp || responseData.timestamp;
        setLastPingTime(new Date(timestamp));
      };

      // ✅ Global connection established handler'ı
      const handleGlobalConnectionEstablished = (connectionData) => {
        const connectionId =
          connectionData.ConnectionId || connectionData.connectionId;
        const connectedAt =
          connectionData.ConnectedAt || connectionData.connectedAt;
      };

      // ✅ Backward compatibility handlers
      const handleGlobalPong = (timestamp) => {
        setLastPingTime(new Date(timestamp));
      };

      const handleGlobalTestResponse = (message) => {
      };

      const handleGlobalUserStatusResponse = (statusResponse) => {
      };

      // ✅ Register all handlers and track them
      const handlers = [
        ["ReceiveMessage", handleGlobalReceiveMessage],
        ["MessageSent", handleGlobalMessageSent],
        ["MessagesRead", handleGlobalMessagesRead],
        ["MessageError", handleGlobalMessageError],
        ["UnreadCountUpdate", handleGlobalUnreadCountUpdate],
        ["PartnerListUpdate", handleGlobalPartnerListUpdate],
        ["NewMessageNotification", handleGlobalNewMessageNotification],
        ["UnreadSummaryUpdate", handleGlobalUnreadSummaryUpdate],
        ["UserStatusChanged", handleGlobalUserStatusChanged],
        ["UserStartedTyping", handleGlobalUserStartedTyping],
        ["UserStoppedTyping", handleGlobalUserStoppedTyping],
        ["HeartbeatResponse", handleGlobalHeartbeatResponse],
        ["ConnectionEstablished", handleGlobalConnectionEstablished],
        ["Pong", handleGlobalPong],
        ["TestResponse", handleGlobalTestResponse],
        ["UserStatusResponse", handleGlobalUserStatusResponse],
      ];

      // Register all handlers
      handlers.forEach(([eventName, handler]) => {
        conn.on(eventName, handler);
        currentHandlersRef.current.add(eventName);
      });


      // ✅ Enhanced cleanup function
      return () => {
        handlers.forEach(([eventName, handler]) => {
          try {
            conn.off(eventName, handler);
          } catch (error) {
            console.warn("SignalR handler cleanup:", error?.message || error);
          }
        });
        currentHandlersRef.current.clear();
      };
    },
    [user?.id, dispatch, isMessageProcessed]
  );

  // ✅ ENHANCED: Heartbeat gönderme fonksiyonu (Backend'deki HeartbeatTimer ile uyumlu)
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // ✅ OPTIMIZED: Backend'deki HeartbeatTimer ile uyumlu ama daha verimli aralık
    heartbeatIntervalRef.current = setInterval(async () => {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        try {
          await connectionRef.current.invoke("Heartbeat");
        } catch (error) {
          console.warn("SignalR heartbeat:", error?.message || error);
        }
      }
    }, 60000); // ✅ OPTIMIZED: 25s → 60s (battery ve network optimizasyonu)
  }, []);

  // ✅ ENHANCED: SignalR bağlantısını başlat
  const startConnection = useCallback(async () => {
    if (!token || !user?.id) {
      return;
    }

    if (
      isConnectingRef.current ||
      (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected)
    ) {
      return;
    }

    try {
      isConnectingRef.current = true;
      setIsConnecting(true);
      setConnectionError(null);


      // ✅ ENHANCED: Mevcut bağlantıyı temizle - Better cleanup
      if (connectionRef.current) {
        try {
          // ✅ Clear notification cache on connection change
          customNotificationService.clearCache();
          processedMessages.clear();

          // ✅ Global handler'ları önce temizle
          if (
            connectionRef.current.cleanup &&
            typeof connectionRef.current.cleanup === "function"
          ) {
            connectionRef.current.cleanup();
          }
          await connectionRef.current.stop();
        } catch (error) {
          console.warn("SignalR stop:", error?.message || error);
        }
        connectionRef.current = null;
      }

      // Yeni bağlantı oluştur
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${SIGNALR_BASE_URL}/chathub`, {
          accessTokenFactory: () => token,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          withCredentials: false,
        })
        .withAutomaticReconnect([3000])
        .configureLogging(LogLevel.Warning) // ✅ FIXED: Reduce log spam
        .build();

      // Enhanced event listeners
      newConnection.onclose((error) => {
        setIsConnected(false);
        setConnectionError(error?.message || "Connection closed");

        // ✅ Clear state on close
        setOnlineUsers(new Set());
        setTypingUsers(new Set());

        // Heartbeat'i durdur
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // 1 kez daha dene, sonra bırak (401 auth hatasında deneme)
        const is401 = error?.message?.includes("401");
        if (!is401 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            startConnection();
          }, 3000);
        }
      });

      newConnection.onreconnecting((error) => {
        setIsConnected(false);
        setConnectionError("Reconnecting...");
      });

      newConnection.onreconnected(async () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // ✅ FIXED: Reconnect durumunda state'i temizle
        setOnlineUsers(new Set());
        setTypingUsers(new Set());
        processedMessages.clear();

        // Heartbeat'i yeniden başlat
        startHeartbeat();

        // Reconnect sonrası unread özeti senkronize et (tek bir istek, poll değil)
        try {
          await newConnection.invoke("GetUnreadSummary");
        } catch (e) {
          console.warn("SignalR GetUnreadSummary (reconnect):", e?.message);
        }
      });

      // Bağlantıyı başlat
      await newConnection.start();


      // ✅ Connection reference'ı önce set et
      connectionRef.current = newConnection;
      setIsConnected(true);
      isConnectingRef.current = false;
      setIsConnecting(false);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // ✅ FIXED: Global handler'ları setup et ve guard against multiple setups
      let cleanup = null;
      try {
        cleanup = setupGlobalMessageHandlers(newConnection);
      } catch (handlerError) {
        console.warn("SignalR message handlers:", handlerError?.message || handlerError);
      }

      // ✅ FIXED: Cleanup function'ı connection'a güvenli şekilde ekle
      if (
        connectionRef.current &&
        newConnection === connectionRef.current &&
        cleanup
      ) {
        connectionRef.current.cleanup = cleanup;
      }

      // ✅ Heartbeat'i başlat
      startHeartbeat();

      // İlk bağlantıda unread özeti al — backend UnreadSummaryUpdate event'i döner,
      // handler setUnreadSummary dispatch eder. Tek seferlik, poll değil.
      try {
        await newConnection.invoke("GetUnreadSummary");
      } catch (unreadError) {
        console.warn("SignalR GetUnreadSummary:", unreadError?.message || unreadError);
      }

      // Test mesajı gönder
      try {
        await newConnection.invoke("TestMethod");
      } catch (testError) {
        console.warn("SignalR TestMethod:", testError?.message || testError);
      }

      return newConnection;
    } catch (error) {
      setConnectionError(error.message);
      setIsConnected(false);
      isConnectingRef.current = false;
      setIsConnecting(false);

        // Hata durumunda 1 kez daha dene (401 auth hatasında deneme)
      const is401 = error?.message?.includes("401");
      if (!is401 && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          startConnection();
        }, 3000);
      }

      return null;
    }
  }, [token, user?.id, startHeartbeat, setupGlobalMessageHandlers]);

  // ✅ Ping gönderme fonksiyonu (backward compatibility için)
  const startPingInterval = useCallback(() => {
    // Mevcut interval'ı temizle
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    // ✅ OPTIMIZED: Ping aralığını artırarak network trafiğini azalt
    pingIntervalRef.current = setInterval(async () => {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        try {
          await connectionRef.current.invoke("Ping");
        } catch (error) {
        }
      }
    }, 90000); // ✅ OPTIMIZED: 30s → 90s (network optimizasyonu)
  }, []);

  // ✅ ENHANCED: Bağlantıyı durdur - Complete cleanup for user switching
  const stopConnection = useCallback(async () => {

    // Timeout'ları temizle
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (connectionRef.current) {
      try {
        // ✅ Global handler'ları temizle (null check ile)
        if (
          connectionRef.current.cleanup &&
          typeof connectionRef.current.cleanup === "function"
        ) {
          try {
            connectionRef.current.cleanup();
          } catch (cleanupError) {
          }
        }

        // First try to leave any groups/rooms server-side
        if (connectionRef.current.state === HubConnectionState.Connected) {
          try {
          } catch (disconnectError) {
          }
        }

        await connectionRef.current.stop();
      } catch (error) {
      }
    }

    // Reset all state completely
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    setOnlineUsers(new Set());
    setTypingUsers(new Set());
    setLastPingTime(null);
    connectionRef.current = null;
    reconnectAttempts.current = 0;

    // ✅ Clear caches
    customNotificationService.clearCache();
    processedMessages.clear();

  }, [processedMessages]);

  // ✅ ENHANCED: Mesaj gönderme - Better user validation and auth checking
  const sendMessage = useCallback(
    async (receiverUserId, content) => {
      // Validate connection state
      if (
        !connectionRef.current ||
        connectionRef.current.state !== HubConnectionState.Connected
      ) {
        throw new Error("SignalR bağlantısı yok");
      }

      // Enhanced user validation - prevent using stale user data
      if (!user?.id || !token) {
        throw new Error("Kullanıcı kimliği veya yetkilendirme bulunamadı");
      }

      // Additional validation to ensure we're using the right user
      const currentUserId = user.id;
      const currentConnectionId = connectionRef.current.connectionId;

      try {

        await connectionRef.current.invoke(
          "SendMessage",
          receiverUserId,
          content
        );

      } catch (error) {
        throw error;
      }
    },
    [user?.id, token]
  );

  // ✅ Typing durumu
  const startTyping = useCallback(async (receiverUserId) => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connectionRef.current.invoke("StartTyping", receiverUserId);
    } catch (error) {
    }
  }, []);

  const stopTyping = useCallback(async (receiverUserId) => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connectionRef.current.invoke("StopTyping", receiverUserId);
    } catch (error) {
    }
  }, []);

  // ✅ Mesajları okundu işaretle
  const markMessagesAsRead = useCallback(async (senderUserId) => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connectionRef.current.invoke("MarkMessagesAsRead", senderUserId);
    } catch (error) {
    }
  }, []);

  // ✅ NEW: Online status kontrolü
  const checkUserOnlineStatus = useCallback(async (targetUserId) => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connectionRef.current.invoke("CheckUserOnlineStatus", targetUserId);
    } catch (error) {
    }
  }, []);

  // ✅ NEW: Unread summary getir
  const getUnreadSummary = useCallback(async () => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connectionRef.current.invoke("GetUnreadSummary");
    } catch (error) {
    }
  }, []);

  // ✅ Manuel yeniden bağlanma
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    stopConnection().then(() => {
      setTimeout(() => {
        startConnection();
      }, 1000);
    });
  }, [startConnection, stopConnection]);

  // ✅ ENHANCED: Auth changes listener with better user switching detection
  useEffect(() => {
    const currentUserId = user?.id;
    const previousUserId = previousUserIdRef.current;

    // Detect user switching (different user ID)
    const isUserSwitch =
      previousUserId && currentUserId && previousUserId !== currentUserId;

    if (isUserSwitch) {
      isUserSwitchingRef.current = true;
    }

    if (token && currentUserId) {
      // ✅ FIXED: Prevent multiple connections
      if (isConnectingRef.current || (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected)) {
        return;
      }

      // ✅ Set flag synchronously to prevent race condition with parallel effect runs
      isConnectingRef.current = true;

      // Handle user switch or initial connection
      const handleConnection = async () => {
        // For user switches, do more thorough cleanup
        if (isUserSwitchingRef.current) {

          // Stop connection and clear all cached references
          await stopConnection();

          // Clear connection reference completely
          connectionRef.current = null;

          // ✅ Cache'i temizle user switch durumunda
          chatApiHelpers.clearChatCache(dispatch);
          dispatch(resetChatState());
          customNotificationService.clearCache();
          processedMessages.clear();

          // Longer delay for user switches to ensure backend cleanup
          setTimeout(() => {
            isUserSwitchingRef.current = false;
            isConnectingRef.current = false;
            startConnection();
          }, 2000); // ✅ FIXED: Longer delay to prevent race conditions
        } else {
          // Regular connection start
          await stopConnection();
          setTimeout(() => {
            isConnectingRef.current = false;
            startConnection();
          }, 1000); // ✅ FIXED: Shorter delay for regular reconnects
        }
      };

      handleConnection();
    } else {
      isUserSwitchingRef.current = false;
      stopConnection();
    }

    // Update previous user ID reference
    previousUserIdRef.current = currentUserId;

    return () => {
      // ✅ FIXED: Don't stop connection on every render
      // stopConnection();
    };
  }, [token, user?.id, startConnection, stopConnection, dispatch, processedMessages]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      stopConnection();
    };
  }, [stopConnection]);

  // ✅ Context value with all methods
  const contextValue = {
    connection: connectionRef.current,
    isConnected,
    isConnecting,
    connectionError,
    onlineUsers,
    typingUsers,
    lastPingTime,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    checkUserOnlineStatus, // ✅ NEW
    getUnreadSummary, // ✅ NEW
    reconnect,
    startConnection,
    stopConnection,
  };

  return (
    <SignalRContext.Provider value={contextValue}>
      {children}
    </SignalRContext.Provider>
  );
};
