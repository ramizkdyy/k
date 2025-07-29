// contexts/SignalRContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useSelector, useDispatch } from "react-redux";
import { chatApiSlice } from "../redux/api/chatApiSlice";

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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const connectionRef = useRef(null);
  const dispatch = useDispatch();

  const { token, user } = useSelector((state) => state.auth);
  const currentUserId = user?.id || user?.userId;

  const CHAT_HUB_URL = "https://8b2591d0595b.ngrok-free.app/chatHub";

  // SignalR bağlantısını başlat
  const connectToHub = async () => {
    if (!token || !currentUserId) {
      console.log("❌ Token veya UserId yok, bağlantı kurulamıyor");
      return;
    }

    if (connectionRef.current) {
      console.log("⚠️ Bağlantı zaten mevcut");
      return;
    }

    try {
      console.log("🔌 SignalR bağlantısı kuruluyor...");

      const newConnection = new HubConnectionBuilder()
        .withUrl(CHAT_HUB_URL, {
          accessTokenFactory: () => {
            console.log("🔑 Token factory called");
            return token;
          },
          skipNegotiation: false,
          transport: 1, // WebSockets
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      // Event listeners
      newConnection.onclose((error) => {
        console.log("❌ SignalR bağlantısı kapandı:", error);
        setIsConnected(false);
        connectionRef.current = null;
      });

      newConnection.onreconnecting((error) => {
        console.log("🔄 SignalR yeniden bağlanıyor:", error);
        setIsConnected(false);
      });

      newConnection.onreconnected((connectionId) => {
        console.log("✅ SignalR yeniden bağlandı:", connectionId);
        setIsConnected(true);
      });

      // Hub method listeners
      newConnection.on("ReceiveMessage", (message) => {
        console.log("📨 Yeni mesaj alındı:", message);

        // Cache'i güncellemek için mesajı ekle
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getChatHistory",
            { partnerId: message.senderUserId },
            (draft) => {
              if (draft) {
                // Aynı mesajın zaten var olup olmadığını kontrol et
                const exists = draft.find((m) => m.id === message.id);
                if (!exists) {
                  draft.push({
                    id: message.id || `msg-${Date.now()}`,
                    senderUserId: message.senderUserId,
                    receiverUserId: currentUserId,
                    content: message.content,
                    sentAt: message.sentAt,
                    isRead: false,
                  });
                }
              }
            }
          )
        );

        // Unread count'u güncelle
        dispatch(
          chatApiSlice.util.invalidateTags(["UnreadCount", "ChatPartner"])
        );
      });

      newConnection.on("MessageSent", (response) => {
        console.log("✅ Mesaj gönderildi:", response);
      });

      newConnection.on("MessageError", (error) => {
        console.log("❌ Mesaj hatası:", error);
      });

      newConnection.on("MessagesRead", (data) => {
        console.log("👀 Mesajlar okundu:", data);
        // İlgili chat'in mesajlarını okundu olarak işaretle
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getChatHistory",
            { partnerId: data.readByUserId },
            (draft) => {
              if (draft) {
                draft.forEach((message) => {
                  if (message.senderUserId === currentUserId) {
                    message.isRead = true;
                  }
                });
              }
            }
          )
        );
      });

      newConnection.on("UserStartedTyping", (userId) => {
        console.log("⌨️ Kullanıcı yazıyor:", userId);
        setTypingUsers((prev) => new Map(prev.set(userId, true)));

        // 3 saniye sonra typing'i kaldır
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        }, 3000);
      });

      newConnection.on("UserStoppedTyping", (userId) => {
        console.log("⌨️ Kullanıcı yazmayı bıraktı:", userId);
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      newConnection.on("UserStatusChanged", (data) => {
        console.log("🔄 Kullanıcı durumu değişti:", data);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isOnline) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      newConnection.on("OnlineUsersCount", (count) => {
        console.log("📊 Online kullanıcı sayısı:", count);
      });

      newConnection.on("Pong", (time) => {
        console.log("🏓 Pong alındı:", time);
      });

      // Bağlantıyı başlat
      await newConnection.start();

      console.log(
        "✅ SignalR bağlantısı başarılı, Connection ID:",
        newConnection.connectionId
      );

      connectionRef.current = newConnection;
      setConnection(newConnection);
      setIsConnected(true);

      // Test ping gönder
      try {
        await newConnection.invoke("Ping");
        console.log("🏓 Ping gönderildi");
      } catch (error) {
        console.log("❌ Ping hatası:", error);
      }
    } catch (error) {
      console.error("❌ SignalR bağlantı hatası:", error);
      setIsConnected(false);
    }
  };

  // contexts/SignalRContext.js - Part 2 (Devamı)

  // Bağlantıyı kapat
  const disconnectFromHub = async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log("❌ SignalR bağlantısı kapatıldı");
      } catch (error) {
        console.error("❌ SignalR kapatma hatası:", error);
      } finally {
        connectionRef.current = null;
        setConnection(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      }
    }
  };

  // Mesaj gönder
  const sendMessage = async (receiverUserId, message) => {
    if (!connectionRef.current || !isConnected) {
      throw new Error("SignalR bağlantısı yok");
    }

    try {
      await connectionRef.current.invoke(
        "SendMessage",
        receiverUserId,
        message
      );
      console.log("📤 SignalR ile mesaj gönderildi");
    } catch (error) {
      console.error("❌ SignalR mesaj gönderme hatası:", error);
      throw error;
    }
  };

  // Typing events
  const startTyping = async (receiverUserId) => {
    if (connectionRef.current && isConnected) {
      try {
        await connectionRef.current.invoke("StartTyping", receiverUserId);
      } catch (error) {
        console.error("❌ StartTyping hatası:", error);
      }
    }
  };

  const stopTyping = async (receiverUserId) => {
    if (connectionRef.current && isConnected) {
      try {
        await connectionRef.current.invoke("StopTyping", receiverUserId);
      } catch (error) {
        console.error("❌ StopTyping hatası:", error);
      }
    }
  };

  // Mesajları okundu olarak işaretle
  const markMessagesAsRead = async (senderUserId) => {
    if (connectionRef.current && isConnected) {
      try {
        await connectionRef.current.invoke("MarkMessagesAsRead", senderUserId);
      } catch (error) {
        console.error("❌ MarkMessagesAsRead hatası:", error);
      }
    }
  };

  // Token değiştiğinde yeniden bağlan
  useEffect(() => {
    if (token && currentUserId) {
      connectToHub();
    } else {
      disconnectFromHub();
    }

    return () => {
      disconnectFromHub();
    };
  }, [token, currentUserId]);

  // Component unmount'ta bağlantıyı kapat
  useEffect(() => {
    return () => {
      disconnectFromHub();
    };
  }, []);

  const value = {
    connection,
    isConnected,
    onlineUsers,
    typingUsers,
    connectToHub,
    disconnectFromHub,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
  };

  return (
    <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
  );
};
