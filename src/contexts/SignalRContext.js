// contexts/SignalRContext.js - Optimize edilmiş global mesaj handling
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import notificationService from "../services/notificationService";
import { chatApiHelpers } from "../redux/api/chatApiSlice";

const SignalRContext = createContext();

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
};

export const SignalRProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [lastPingTime, setLastPingTime] = useState(null);

  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const connectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // ✅ Güncel ngrok URL'ini dinamik olarak al veya manuel güncelle
  const SIGNALR_BASE_URL = "https://chatapi.justkey.online/";

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

  // ✅ GLOBAL MESAJ HANDLER - Tüm ekranlarda çalışacak
  const setupGlobalMessageHandlers = useCallback(
    (conn) => {
      if (!conn || !user?.id) return;

      console.log(
        "🌐 Setting up GLOBAL SignalR message handlers for user:",
        user.id
      );

      // ✅ Global mesaj alma handler'ı
      const handleGlobalReceiveMessage = (messageData) => {
        console.log("📨 GLOBAL message received:", messageData);

        const senderId = messageData.SenderUserId || messageData.senderUserId;
        const receiverId =
          messageData.ReceiverUserId || messageData.receiverUserId;

        console.log("📨 Global message details:", {
          senderId,
          receiverId,
          currentUserId: user?.id,
          content: messageData.Content || messageData.content,
        });

        // ✅ Doğru partnerId hesaplama
        let partnerId = null;

        // Eğer biz mesajı aldıysak, gönderen kişi partner'dır
        if (receiverId === user?.id && senderId !== user?.id) {
          partnerId = senderId;
          console.log("📦 GLOBAL: Received message from partner:", partnerId);
        }
        // Eğer biz mesajı gönderdiysek, alıcı kişi partner'dır
        else if (senderId === user?.id && receiverId !== user?.id) {
          partnerId = receiverId;
          console.log("📦 GLOBAL: Sent message to partner:", partnerId);
        }

        // ✅ Her durumda cache'e ekle
        if (partnerId) {
          console.log(
            "💾 GLOBAL: Adding message to cache for partner:",
            partnerId
          );
          chatApiHelpers.addMessageToCache(dispatch, partnerId, messageData);
          chatApiHelpers.updatePartnersList(dispatch);
          chatApiHelpers.updateUnreadCount(dispatch);
        }

        // ✅ Notification gönder (sadece alınan mesajlar için)
        if (receiverId === user?.id && senderId !== user?.id) {
          const senderName = messageData.SenderName || messageData.senderName;
          const content = messageData.Content || messageData.content;

          if (senderName && content) {
            notificationService.scheduleLocalNotification(senderName, content, {
              type: "chat_message",
              chatId: senderId,
              senderName: senderName,
              messageId:
                messageData.Id || messageData.id || messageData.MessageId,
            });
          }
        }
      };

      // ✅ Global mesaj gönderildi confirmation handler'ı
      const handleGlobalMessageSent = (confirmationData) => {
        console.log("✅ GLOBAL message sent confirmation:", confirmationData);

        const receiverId =
          confirmationData.ReceiverUserId || confirmationData.receiverUserId;
        const senderId =
          confirmationData.SenderUserId || confirmationData.senderUserId;

        // Eğer biz gönderiysek, alıcı partner'dır
        if (senderId === user?.id && receiverId && receiverId !== user?.id) {
          console.log(
            "📦 GLOBAL: Adding sent message confirmation to cache for partner:",
            receiverId
          );
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
        console.log("👁️ GLOBAL messages read:", readData);

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

        chatApiHelpers.updateUnreadCount(dispatch);
      };

      // ✅ Global mesaj hatası handler'ı
      const handleGlobalMessageError = (errorData) => {
        console.error("❌ GLOBAL message error:", errorData);
        // Global error handling - UI'da gösterilecek error'lar için
        const error = errorData.Error || errorData.error;
        const details = errorData.Details || errorData.details;
        console.error("❌ Global error details:", { error, details });
      };

      // ✅ Global unread count update handler'ı
      const handleGlobalUnreadCountUpdate = (updateData) => {
        console.log("📊 GLOBAL unread count update:", updateData);
        chatApiHelpers.updateUnreadCount(dispatch);

        const totalUnreadCount =
          updateData.TotalUnreadCount || updateData.totalUnreadCount;
        const totalUnreadChats =
          updateData.TotalUnreadChats || updateData.totalUnreadChats;
        const fromUserId = updateData.FromUserId || updateData.fromUserId;

        console.log("📊 Global unread details:", {
          totalUnreadCount,
          totalUnreadChats,
          fromUserId,
        });
      };

      // ✅ Global partner list update handler'ı
      const handleGlobalPartnerListUpdate = () => {
        console.log("👥 GLOBAL partner list update");
        chatApiHelpers.updatePartnersList(dispatch);
      };

      // ✅ Global new message notification handler'ı
      const handleGlobalNewMessageNotification = (notificationData) => {
        console.log("🔔 GLOBAL new message notification:", notificationData);

        const senderId = notificationData.SenderId || notificationData.senderId;
        const messageId =
          notificationData.MessageId || notificationData.messageId;
        const message = notificationData.Message || notificationData.message;
        const senderName =
          notificationData.SenderName || notificationData.senderName;
        const senderSurname =
          notificationData.SenderSurname || notificationData.senderSurname;

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

          console.log(
            "📦 GLOBAL: Adding notification message to cache for partner:",
            senderId
          );
          chatApiHelpers.addMessageToCache(dispatch, senderId, fullMessageData);
          chatApiHelpers.updatePartnersList(dispatch);
          chatApiHelpers.updateUnreadCount(dispatch);

          // Local notification göster
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
      };

      // ✅ Global unread summary update handler'ı
      const handleGlobalUnreadSummaryUpdate = (summaryData) => {
        console.log("📋 GLOBAL unread summary update:", summaryData);
        chatApiHelpers.updateUnreadCount(dispatch);

        const totalUnreadMessages =
          summaryData.TotalUnreadMessages || summaryData.totalUnreadMessages;
        const totalUnreadChats =
          summaryData.TotalUnreadChats || summaryData.totalUnreadChats;
        const unreadChats = summaryData.UnreadChats || summaryData.unreadChats;

        console.log("📋 Global summary details:", {
          totalUnreadMessages,
          totalUnreadChats,
          unreadChats,
        });
      };

      // ✅ FIXED: Global user status handler'ı - Infinite loop prevention
      const handleGlobalUserStatusChanged = (statusData) => {
        const userId = statusData.UserId || statusData.userId;
        const isOnline = statusData.IsOnline || statusData.isOnline;
        const lastSeen = statusData.LastSeen || statusData.lastSeen;

        // ✅ FIXED: Sadece kendi status'umuz değilse işle
        if (userId && userId !== user?.id) {
          console.log("👤 GLOBAL user status changed:", {
            userId,
            isOnline,
            lastSeen,
          });

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
              console.log("👥 Online users updated:", Array.from(newUsers));
              return newUsers;
            }

            return prevUsers; // No change needed
          });
        }
      };

      // ✅ FIXED: Global typing handlers - Throttle ve own user check
      const handleGlobalUserStartedTyping = (userId) => {
        if (userId && userId !== user?.id) {
          console.log("⌨️ GLOBAL user started typing:", userId);
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
          console.log("⌨️ GLOBAL user stopped typing:", userId);
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
        console.log("💓 GLOBAL heartbeat response:", responseData);
        const timestamp = responseData.Timestamp || responseData.timestamp;
        setLastPingTime(new Date(timestamp));
      };

      // ✅ Global connection established handler'ı
      const handleGlobalConnectionEstablished = (connectionData) => {
        console.log("🔗 GLOBAL connection established:", connectionData);
        const connectionId =
          connectionData.ConnectionId || connectionData.connectionId;
        const connectedAt =
          connectionData.ConnectedAt || connectionData.connectedAt;
        console.log("🔗 Global connection details:", {
          connectionId,
          connectedAt,
        });
      };

      // ✅ Event listener'ları ekle
      conn.on("ReceiveMessage", handleGlobalReceiveMessage);
      conn.on("MessageSent", handleGlobalMessageSent);
      conn.on("MessagesRead", handleGlobalMessagesRead);
      conn.on("MessageError", handleGlobalMessageError);
      conn.on("UnreadCountUpdate", handleGlobalUnreadCountUpdate);
      conn.on("PartnerListUpdate", handleGlobalPartnerListUpdate);
      conn.on("NewMessageNotification", handleGlobalNewMessageNotification);
      conn.on("UnreadSummaryUpdate", handleGlobalUnreadSummaryUpdate);
      conn.on("UserStatusChanged", handleGlobalUserStatusChanged);
      conn.on("UserStartedTyping", handleGlobalUserStartedTyping);
      conn.on("UserStoppedTyping", handleGlobalUserStoppedTyping);
      conn.on("HeartbeatResponse", handleGlobalHeartbeatResponse);
      conn.on("ConnectionEstablished", handleGlobalConnectionEstablished);

      // ✅ Backward compatibility handlers
      conn.on("Pong", (timestamp) => {
        console.log("🏓 Global Pong received:", timestamp);
        setLastPingTime(new Date(timestamp));
      });

      conn.on("TestResponse", (message) => {
        console.log("🧪 Global test response:", message);
      });

      conn.on("UserStatusResponse", (statusResponse) => {
        console.log("👤 Global user status response:", statusResponse);
      });

      console.log("✅ GLOBAL SignalR handlers setup completed");

      // ✅ Cleanup function return et
      return () => {
        console.log("🧹 Cleaning up GLOBAL SignalR handlers");
        conn.off("ReceiveMessage", handleGlobalReceiveMessage);
        conn.off("MessageSent", handleGlobalMessageSent);
        conn.off("MessagesRead", handleGlobalMessagesRead);
        conn.off("MessageError", handleGlobalMessageError);
        conn.off("UnreadCountUpdate", handleGlobalUnreadCountUpdate);
        conn.off("PartnerListUpdate", handleGlobalPartnerListUpdate);
        conn.off("NewMessageNotification", handleGlobalNewMessageNotification);
        conn.off("UnreadSummaryUpdate", handleGlobalUnreadSummaryUpdate);
        conn.off("UserStatusChanged", handleGlobalUserStatusChanged);
        conn.off("UserStartedTyping", handleGlobalUserStartedTyping);
        conn.off("UserStoppedTyping", handleGlobalUserStoppedTyping);
        conn.off("HeartbeatResponse", handleGlobalHeartbeatResponse);
        conn.off("ConnectionEstablished", handleGlobalConnectionEstablished);
        conn.off("Pong");
        conn.off("TestResponse");
        conn.off("UserStatusResponse");
      };
    },
    [user?.id, dispatch]
  );

  // ✅ ENHANCED: Heartbeat gönderme fonksiyonu (Backend'deki HeartbeatTimer ile uyumlu)
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Backend'deki HeartbeatTimer 30 saniyede bir çalışıyor, biz 25 saniyede bir gönderelim
    heartbeatIntervalRef.current = setInterval(async () => {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        try {
          await connectionRef.current.invoke("Heartbeat");
          console.log("💓 Heartbeat gönderildi");
        } catch (error) {
          console.log("⚠️ Heartbeat hatası:", error.message);
        }
      }
    }, 25000); // 25 saniye
  }, []);

  // SignalR bağlantısını başlat
  const startConnection = useCallback(async () => {
    if (!token || !user?.id) {
      console.log(
        "❌ Token veya user ID yok, SignalR bağlantısı başlatılamıyor"
      );
      return;
    }

    if (
      isConnecting ||
      (connection && connection.state === HubConnectionState.Connected)
    ) {
      console.log("🔄 Zaten bağlanıyor veya bağlı");
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);

      console.log("🚀 SignalR bağlantısı başlatılıyor...");
      console.log("🔗 URL:", `${SIGNALR_BASE_URL}/chathub`);
      console.log("👤 User ID:", user.id);
      console.log("🔑 Token preview:", token.substring(0, 20) + "...");

      // ✅ FIXED: Mevcut bağlantıyı temizle - Better cleanup
      if (connectionRef.current) {
        try {
          // ✅ Global handler'ları önce temizle
          if (
            connectionRef.current.cleanup &&
            typeof connectionRef.current.cleanup === "function"
          ) {
            connectionRef.current.cleanup();
          }
          await connectionRef.current.stop();
          console.log("✅ Old connection stopped");
        } catch (error) {
          console.log("⚠️ Old connection stop error:", error.message);
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
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [2000, 5000, 10000, 20000, 30000];
            return delays[
              Math.min(retryContext.previousRetryCount, delays.length - 1)
            ];
          },
        })
        .configureLogging(LogLevel.Warning) // ✅ FIXED: Reduce log spam
        .build();

      // Event listeners
      newConnection.onclose((error) => {
        console.log(
          "❌ SignalR bağlantısı kapandı:",
          error?.message || "Bilinmeyen sebep"
        );
        setIsConnected(false);
        setConnectionError(error?.message || "Connection closed");

        // Heartbeat'i durdur
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Manuel reconnect deneme
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );
          console.log(`🔄 ${delay}ms sonra yeniden bağlanmayı deneye...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            startConnection();
          }, delay);
        } else {
          console.log("❌ Maksimum yeniden bağlanma denemesi aşıldı");
        }
      });

      newConnection.onreconnecting((error) => {
        console.log("🔄 SignalR yeniden bağlanıyor...", error?.message);
        setIsConnected(false);
        setConnectionError("Reconnecting...");
      });

      newConnection.onreconnected((connectionId) => {
        console.log("✅ SignalR yeniden bağlandı:", connectionId);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // ✅ FIXED: Reconnect durumunda state'i temizle
        setOnlineUsers(new Set());
        setTypingUsers(new Set());

        // Heartbeat'i yeniden başlat
        startHeartbeat();
      });

      // Bağlantıyı başlat
      await newConnection.start();

      console.log("✅ SignalR bağlantısı başarılı!");
      console.log("🔗 Connection ID:", newConnection.connectionId);

      // ✅ Connection reference'ı önce set et
      connectionRef.current = newConnection;
      setConnection(newConnection);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // ✅ FIXED: Global handler'ları setup et ve guard against multiple setups
      let cleanup = null;
      try {
        cleanup = setupGlobalMessageHandlers(newConnection);
        console.log("🔧 Global handlers attached to connection");
      } catch (handlerError) {
        console.log("⚠️ Global handler setup error:", handlerError.message);
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

      // ✅ ENHANCED: İlk bağlantıda unread count'u al
      try {
        await newConnection.invoke("GetUnreadCount");
        console.log("📊 Initial unread count requested");
      } catch (unreadError) {
        console.log("⚠️ Get unread count hatası:", unreadError.message);
      }

      // Test mesajı gönder
      try {
        await newConnection.invoke("TestMethod");
        console.log("🧪 Test method çağrıldı");
      } catch (testError) {
        console.log("⚠️ Test method hatası:", testError.message);
      }

      return newConnection;
    } catch (error) {
      console.error("❌ SignalR bağlantı hatası:", error);
      setConnectionError(error.message);
      setIsConnected(false);
      setIsConnecting(false);

      // Hata durumunda yeniden deneme
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000
        );
        console.log(`🔄 ${delay}ms sonra yeniden bağlanmayı deneye...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          startConnection();
        }, delay);
      }

      return null;
    }
  }, [
    token,
    user?.id,
    isConnecting,
    connection,
    startHeartbeat,
    setupGlobalMessageHandlers,
  ]);

  // ✅ Ping gönderme fonksiyonu (backward compatibility için)
  const startPingInterval = useCallback(() => {
    // Mevcut interval'ı temizle
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    // Her 30 saniyede bir ping gönder
    pingIntervalRef.current = setInterval(async () => {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        try {
          await connectionRef.current.invoke("Ping");
          console.log("🏓 Ping gönderildi");
        } catch (error) {
          console.log("⚠️ Ping hatası:", error.message);
        }
      }
    }, 30000);
  }, []);

  // ✅ ENHANCED: Bağlantıyı durdur - Complete cleanup for user switching
  const stopConnection = useCallback(async () => {
    console.log("🛑 SignalR bağlantısı durduruluyor...");

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
            console.log("🧹 Global handlers cleaned up");
          } catch (cleanupError) {
            console.log("⚠️ Cleanup function error:", cleanupError.message);
          }
        }

        // First try to leave any groups/rooms server-side
        if (connectionRef.current.state === HubConnectionState.Connected) {
          try {
            // ✅ Backend'de böyle bir method yoksa comment out edebilirsin
            // await connectionRef.current.invoke("Disconnect");
            console.log("🚪 User disconnecting...");
          } catch (disconnectError) {
            console.log(
              "⚠️ Disconnect invoke hatası:",
              disconnectError.message
            );
          }
        }

        await connectionRef.current.stop();
        console.log("✅ SignalR bağlantısı durduruldu");
      } catch (error) {
        console.log("⚠️ Bağlantı durdurulurken hata:", error.message);
      }
    }

    // Reset all state completely
    setConnection(null);
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    setOnlineUsers(new Set());
    setTypingUsers(new Set());
    setLastPingTime(null);
    connectionRef.current = null;
    reconnectAttempts.current = 0;

    console.log("🧹 SignalR state completely reset");
  }, []);

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
        console.error(
          "❌ Mesaj gönderme hatası: Kullanıcı kimliği veya token bulunamadı",
          {
            hasUser: !!user,
            userId: user?.id,
            hasToken: !!token,
          }
        );
        throw new Error("Kullanıcı kimliği veya yetkilendirme bulunamadı");
      }

      // Additional validation to ensure we're using the right user
      const currentUserId = user.id;
      const currentConnectionId = connectionRef.current.connectionId;

      try {
        console.log("📤 Mesaj gönderiliyor:", {
          senderId: currentUserId,
          receiverUserId,
          content:
            content.substring(0, 50) + (content.length > 50 ? "..." : ""),
          connectionId: currentConnectionId,
          hasToken: !!token,
        });

        await connectionRef.current.invoke(
          "SendMessage",
          receiverUserId,
          content
        );

        console.log("✅ Mesaj SignalR ile gönderildi:", {
          senderId: currentUserId,
          receiverUserId,
          connectionId: currentConnectionId,
        });
      } catch (error) {
        console.error("❌ Mesaj gönderme hatası:", {
          error: error.message,
          senderId: currentUserId,
          receiverUserId,
          connectionState: connectionRef.current?.state,
          connectionId: currentConnectionId,
        });
        throw error;
      }
    },
    [user?.id, token]
  );

  // Typing durumu
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
      console.log("⚠️ Start typing hatası:", error.message);
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
      console.log("⚠️ Stop typing hatası:", error.message);
    }
  }, []);

  // Mesajları okundu işaretle
  const markMessagesAsRead = useCallback(async (senderUserId) => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connectionRef.current.invoke("MarkMessagesAsRead", senderUserId);
      console.log("👁️ Mesajlar okundu olarak işaretlendi:", senderUserId);
    } catch (error) {
      console.log("⚠️ Mark as read hatası:", error.message);
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
      console.log("👤 Online status kontrol edildi:", targetUserId);
    } catch (error) {
      console.log("⚠️ Check online status hatası:", error.message);
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
      console.log("📋 Unread summary istendi");
    } catch (error) {
      console.log("⚠️ Get unread summary hatası:", error.message);
    }
  }, []);

  // Manuel yeniden bağlanma
  const reconnect = useCallback(() => {
    console.log("🔄 Manuel yeniden bağlanma başlatılıyor...");
    reconnectAttempts.current = 0;
    stopConnection().then(() => {
      setTimeout(() => {
        startConnection();
      }, 1000);
    });
  }, [startConnection, stopConnection]);

  // ✅ ENHANCED: Auth changes listener with better user switching detection
  const previousUserIdRef = useRef(null);
  const isUserSwitchingRef = useRef(false);

  useEffect(() => {
    const currentUserId = user?.id;
    const previousUserId = previousUserIdRef.current;

    // Detect user switching (different user ID)
    const isUserSwitch =
      previousUserId && currentUserId && previousUserId !== currentUserId;

    if (isUserSwitch) {
      console.log("🔄 USER SWITCH DETECTED:", {
        previousUserId,
        currentUserId,
        tokenExists: !!token,
      });
      isUserSwitchingRef.current = true;
    }

    if (token && currentUserId) {
      console.log("🔑 Token ve user mevcut, SignalR başlatılıyor...");
      console.log("👤 Current user ID:", currentUserId);
      console.log("🔑 Token preview:", token.substring(0, 20) + "...");

      // ✅ FIXED: Prevent multiple connections
      if (isConnecting || (connection && connection.state === "Connected")) {
        console.log("⚠️ Connection already in progress or connected, skipping");
        return;
      }

      // Handle user switch or initial connection
      const handleConnection = async () => {
        // For user switches, do more thorough cleanup
        if (isUserSwitchingRef.current) {
          console.log("🔥 PERFORMING DEEP CLEANUP FOR USER SWITCH");

          // Stop connection and clear all cached references
          await stopConnection();

          // Clear connection reference completely
          connectionRef.current = null;

          // ✅ Cache'i temizle user switch durumunda
          chatApiHelpers.clearChatCache(dispatch);

          // Longer delay for user switches to ensure backend cleanup
          setTimeout(() => {
            console.log(
              "🆕 Starting fresh connection for new user:",
              currentUserId
            );
            isUserSwitchingRef.current = false;
            startConnection();
          }, 2000); // ✅ FIXED: Longer delay to prevent race conditions
        } else {
          // Regular connection start
          await stopConnection();
          setTimeout(() => {
            console.log("🔄 Starting connection for user:", currentUserId);
            startConnection();
          }, 1000); // ✅ FIXED: Shorter delay for regular reconnects
        }
      };

      handleConnection();
    } else {
      console.log("❌ Token veya user yok, SignalR durduruluyor...");
      console.log("🧹 Cleaning up for logout/user switch");
      isUserSwitchingRef.current = false;
      stopConnection();
    }

    // Update previous user ID reference
    previousUserIdRef.current = currentUserId;

    return () => {
      console.log("🧹 Effect cleanup: stopping connection");
      // ✅ FIXED: Don't stop connection on every render
      // stopConnection();
    };
  }, [token, user?.id, startConnection, stopConnection, dispatch]);

  // Cleanup
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
