// contexts/SignalRContext.js - Fixed with Better Error Handling
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
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notificationService from "../services/notificationService";

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
  const connectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // ✅ Güncel ngrok URL'ini dinamik olarak al veya manuel güncelle
  const SIGNALR_BASE_URL = "https://b616de053604.ngrok-free.app"; // Bu URL'yi güncelleyin

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

      // Mevcut bağlantıyı temizle
      if (connectionRef.current) {
        try {
          await connectionRef.current.stop();
        } catch (error) {
          console.log("⚠️ Eski bağlantı kapatılırken hata:", error.message);
        }
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
            // Exponential backoff: 2s, 4s, 8s, 16s, 30s
            const delays = [2000, 4000, 8000, 16000, 30000];
            return delays[
              Math.min(retryContext.previousRetryCount, delays.length - 1)
            ];
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Event listeners
      newConnection.onclose((error) => {
        console.log(
          "❌ SignalR bağlantısı kapandı:",
          error?.message || "Bilinmeyen sebep"
        );
        setIsConnected(false);
        setConnectionError(error?.message || "Connection closed");

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

        // Ping'i yeniden başlat
        startPingInterval();
      });

      // Message listeners
      newConnection.on("ReceiveMessage", (messageData) => {
        console.log("📨 Yeni mesaj alındı:", messageData);

        // Send notification for received messages if user is not in chat screen
        if (messageData && messageData.senderName && messageData.content) {
          notificationService.scheduleLocalNotification(
            `${messageData.senderName}`,
            messageData.content,
            {
              type: "chat_message",
              chatId: messageData.senderId,
              senderName: messageData.senderName,
            }
          );
        }
      });

      newConnection.on("MessageSent", (confirmationData) => {
        console.log("✅ Mesaj gönderim onayı:", confirmationData);
      });

      newConnection.on("MessageError", (errorData) => {
        console.error("❌ Mesaj hatası:", errorData);
      });

      newConnection.on("MessagesRead", (readData) => {
        console.log("👁️ Mesajlar okundu:", readData);
      });

      // User status listeners
      newConnection.on("UserStatusChanged", (statusData) => {
        console.log("👤 Kullanıcı durumu değişti:", statusData);

        setOnlineUsers((prevUsers) => {
          const newUsers = new Set(prevUsers);
          if (statusData.IsOnline) {
            newUsers.add(statusData.UserId);
          } else {
            newUsers.delete(statusData.UserId);
          }
          return newUsers;
        });
      });

      // Typing listeners
      newConnection.on("UserStartedTyping", (userId) => {
        console.log("⌨️ Kullanıcı yazmaya başladı:", userId);
        setTypingUsers((prev) => new Set([...prev, userId]));
      });

      newConnection.on("UserStoppedTyping", (userId) => {
        console.log("⌨️ Kullanıcı yazmayı bıraktı:", userId);
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Ping/Pong listeners
      newConnection.on("Pong", (timestamp) => {
        console.log("🏓 Pong alındı:", timestamp);
        setLastPingTime(new Date(timestamp));
      });

      // Test response listener
      newConnection.on("TestResponse", (message) => {
        console.log("🧪 Test response:", message);
      });

      // Bağlantıyı başlat
      await newConnection.start();

      console.log("✅ SignalR bağlantısı başarılı!");
      console.log("🔗 Connection ID:", newConnection.connectionId);

      connectionRef.current = newConnection;
      setConnection(newConnection);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // Ping interval'ı başlat
      startPingInterval();

      // Test mesajı gönder
      try {
        await newConnection.invoke("TestMethod");
        console.log("🧪 Test method çağrıldı");
      } catch (testError) {
        console.log("⚠️ Test method hatası:", testError.message);
      }
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
    }
  }, [token, user?.id, isConnecting, connection]);

  // Ping gönderme fonksiyonu
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

  // Bağlantıyı durdur - ENHANCED: Complete cleanup for user switching
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

    if (connectionRef.current) {
      try {
        // First try to leave any groups/rooms server-side
        if (connectionRef.current.state === HubConnectionState.Connected) {
          try {
            await connectionRef.current.invoke("Disconnect");
            console.log("🚪 User disconnected from server groups");
          } catch (disconnectError) {
            console.log(
              "⚠️ Disconnect invoke hatası:",
              disconnectError.message
            );
          }
        }

        // Remove all event listeners to prevent memory leaks
        connectionRef.current.off("ReceiveMessage");
        connectionRef.current.off("MessageSent");
        connectionRef.current.off("MessageError");
        connectionRef.current.off("MessagesRead");
        connectionRef.current.off("UserStatusChanged");
        connectionRef.current.off("UserStartedTyping");
        connectionRef.current.off("UserStoppedTyping");
        connectionRef.current.off("Pong");
        connectionRef.current.off("TestResponse");

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

  // Mesaj gönderme - ENHANCED: Better user validation and auth checking
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

  // ENHANCED: Auth changes listener with better user switching detection
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

      // Handle user switch or initial connection
      const handleConnection = async () => {
        // For user switches, do more thorough cleanup
        if (isUserSwitchingRef.current) {
          console.log("🔥 PERFORMING DEEP CLEANUP FOR USER SWITCH");

          // Stop connection and clear all cached references
          await stopConnection();

          // Clear connection reference completely
          connectionRef.current = null;

          // Longer delay for user switches to ensure backend cleanup
          setTimeout(() => {
            console.log(
              "🆕 Starting fresh connection for new user:",
              currentUserId
            );
            isUserSwitchingRef.current = false;
            startConnection();
          }, 1500); // Longer delay for user switches
        } else {
          // Regular connection start
          await stopConnection();
          setTimeout(() => {
            console.log("🔄 Starting connection for user:", currentUserId);
            startConnection();
          }, 750);
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
      stopConnection();
    };
  }, [token, user?.id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
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
