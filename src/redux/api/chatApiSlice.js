// redux/api/chatApiSlice.js - Optimized to Reduce API Calls
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const CHAT_BASE_URL = "https://20053fb3ffb3.ngrok-free.app";

export const chatApiSlice = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: CHAT_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      console.log("CHAT BEARER TOKEN:", token?.substring(0, 50) + "...");

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
        headers.set("ngrok-skip-browser-warning", "true");
        headers.set("Content-Type", "application/json");
      }

      return headers;
    },
    // Response transformer - Backend response'unu standardize et
    transformResponse: (response, meta, arg) => {
      console.log("API Response:", response);

      // Eğer response direkt array veya primitive ise, doğrudan döndür
      if (Array.isArray(response) || typeof response !== "object") {
        return response;
      }

      // Backend'in standart response formatlarını handle et
      if (response.isSuccess && response.result !== undefined) {
        return response.result;
      }

      if (response.data !== undefined) {
        return response.data;
      }

      // Default olarak response'u döndür
      return response;
    },
    // Error handler
    transformErrorResponse: (response, meta, arg) => {
      console.error("API Error Response:", response);

      // Backend error response'unu handle et
      if (response.data?.message) {
        return { error: response.data.message };
      }

      if (response.data?.error) {
        return { error: response.data.error };
      }

      return { error: "An unexpected error occurred" };
    },
  }),
  tagTypes: ["ChatMessage", "ChatPartner", "UnreadCount"],
  // ✅ Global cache settings to reduce API calls
  keepUnusedDataFor: 300, // 5 minutes cache for unused data
  refetchOnMountOrArgChange: false, // Don't refetch on component mount
  refetchOnFocus: false, // Don't refetch when window gains focus
  refetchOnReconnect: false, // Don't refetch on network reconnect
  endpoints: (builder) => ({
    // Chat geçmişini getir - SADECE İLK YÜKLEMEDE
    getChatHistory: builder.query({
      query: ({ partnerId, page = 1 }) => ({
        url: `/api/chat/history/${partnerId}?page=${page}`,
        method: "GET",
      }),
      providesTags: (result, error, { partnerId }) => [
        { type: "ChatMessage", id: partnerId },
      ],
      // ✅ Prevent automatic refetching
      keepUnusedDataFor: 600, // 10 minutes cache
      // ✅ Transform response için ek processing
      transformResponse: (response) => {
        console.log("Chat History Response:", response);

        // Response array ise direkt döndür
        if (Array.isArray(response)) {
          return response;
        }

        // Object içinde array arama
        if (response?.result && Array.isArray(response.result)) {
          return response.result;
        }

        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }

        if (response?.messages && Array.isArray(response.messages)) {
          return response.messages;
        }

        // Eğer hiç mesaj yoksa boş array döndür
        return [];
      },
      // ✅ Only refetch when explicitly requested or partnerId changes
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.partnerId !== previousArg?.partnerId;
      },
      // ✅ Pagination için cache merge stratejisi (sadece gerekirse)
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs.partnerId}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        // Yeni sayfanın verilerini mevcut cache'e ekle (eski mesajlar)
        return [...newItems, ...(currentCache || [])];
      },
    }),

    // Chat partnerlarını getir
    getChatPartners: builder.query({
      query: () => "/api/chat/partners",
      providesTags: ["ChatPartner"],
      keepUnusedDataFor: 600, // 10 minutes cache
      // ✅ Partners için özel transform
      transformResponse: (response) => {
        console.log("Chat Partners Response:", response);

        // Response direkt array ise
        if (Array.isArray(response)) {
          return response;
        }

        // Object içinde array arama
        if (response?.result && Array.isArray(response.result)) {
          return response.result;
        }

        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }

        if (response?.partners && Array.isArray(response.partners)) {
          return response.partners;
        }

        if (response?.chatPartners && Array.isArray(response.chatPartners)) {
          return response.chatPartners;
        }

        // Eğer hiç partner yoksa boş array döndür
        return [];
      },
    }),

    // Okunmamış mesaj sayısını getir
    getUnreadCount: builder.query({
      query: () => "/api/chat/unread-count",
      providesTags: ["UnreadCount"],
      keepUnusedDataFor: 60, // 1 minute cache for unread count
      // ✅ Unread count için özel transform
      transformResponse: (response) => {
        console.log("Unread Count Response:", response);

        // Response direkt number ise
        if (typeof response === "number") {
          return { count: response };
        }

        // Response object ise count field'ını ara
        if (response?.count !== undefined) {
          return response;
        }

        if (response?.result?.count !== undefined) {
          return { count: response.result.count };
        }

        if (response?.data?.count !== undefined) {
          return { count: response.data.count };
        }

        // Default 0
        return { count: 0 };
      },
    }),

    // ✅ Mesaj gönder - Optimistic update KALDIRILDI (SignalR handles this)
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/api/chat/send-message",
        method: "POST",
        body: {
          receiverUserId: messageData.receiverUserId,
          content: messageData.content,
        },
      }),
      // ✅ Sadece unread count'u invalidate et, chat messages'ı değil
      invalidatesTags: (result, error, { receiverUserId }) => [
        "ChatPartner", // Partner listesini güncelle
        "UnreadCount", // Unread count'u güncelle
        // ChatMessage invalidate etme - SignalR hallediyor
      ],
      // ✅ Optimistic update kaldırıldı - SignalR real-time handling yapıyor
    }),

    // Mesajları okundu olarak işaretle
    markMessagesAsRead: builder.mutation({
      query: (partnerId) => ({
        url: `/api/chat/mark-read/${partnerId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, partnerId) => [
        "UnreadCount", // Sadece unread count'u güncelle
        // ChatMessage invalidate etme - SignalR hallediyor
      ],
    }),

    // ✅ Health check endpoint - Backend'in çalışıp çalışmadığını kontrol et
    chatHealthCheck: builder.query({
      query: () => "/health",
      keepUnusedDataFor: 0, // Cache'leme
    }),

    // ✅ Manuel refresh için endpoint (pull-to-refresh için)
    refreshChatHistory: builder.query({
      query: ({ partnerId }) => ({
        url: `/api/chat/history/${partnerId}?page=1&refresh=true`,
        method: "GET",
      }),
      // Bu endpoint cache'lenmesin, her zaman fresh data getirsin
      keepUnusedDataFor: 0,
      transformResponse: (response) => {
        console.log("Refreshed Chat History Response:", response);

        if (Array.isArray(response)) {
          return response;
        }

        if (response?.result && Array.isArray(response.result)) {
          return response.result;
        }

        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }

        if (response?.messages && Array.isArray(response.messages)) {
          return response.messages;
        }

        return [];
      },
    }),

    // ✅ Eski mesajları yükle (pagination için)
    loadOlderMessages: builder.query({
      query: ({ partnerId, page }) => ({
        url: `/api/chat/history/${partnerId}?page=${page}`,
        method: "GET",
      }),
      keepUnusedDataFor: 300, // 5 minutes cache
      transformResponse: (response) => {
        console.log("Older Messages Response:", response);

        if (Array.isArray(response)) {
          return response;
        }

        if (response?.result && Array.isArray(response.result)) {
          return response.result;
        }

        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }

        if (response?.messages && Array.isArray(response.messages)) {
          return response.messages;
        }

        return [];
      },
    }),

    // ✅ Belirli bir kullanıcının online durumunu kontrol et
    getUserOnlineStatus: builder.query({
      query: (userId) => `/api/chat/user-status/${userId}`,
      keepUnusedDataFor: 30, // 30 seconds cache
      transformResponse: (response) => {
        return {
          userId: response.userId || response.UserId,
          isOnline: response.isOnline || response.IsOnline || false,
          lastSeen: response.lastSeen || response.LastSeen,
        };
      },
    }),

    // ✅ Chat istatistikleri getir (optional)
    getChatStats: builder.query({
      query: () => "/api/chat/stats",
      keepUnusedDataFor: 300, // 5 minutes cache
      transformResponse: (response) => {
        return {
          totalChats: response.totalChats || response.TotalChats || 0,
          unreadCount: response.unreadCount || response.UnreadCount || 0,
          onlineUsers: response.onlineUsers || response.OnlineUsers || 0,
        };
      },
    }),
  }),
});

export const {
  useGetChatHistoryQuery,
  useGetChatPartnersQuery,
  useGetUnreadCountQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useChatHealthCheckQuery,
  useRefreshChatHistoryQuery, // Manuel refresh için
  useLoadOlderMessagesQuery, // Pagination için
  useGetUserOnlineStatusQuery, // User status için
  useGetChatStatsQuery, // Chat istatistikleri için
} = chatApiSlice;

// ✅ SignalR ile real-time mesaj yönetimi için helper functions
export const chatApiHelpers = {
  // SignalR'dan gelen mesajı cache'e manuel ekle (gerekirse kullan)
  addMessageToCache: (dispatch, partnerId, messageData) => {
    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          if (Array.isArray(draft)) {
            const newMessage = {
              id: messageData.Id || `msg-${Date.now()}`,
              senderUserId: messageData.SenderUserId,
              receiverUserId: messageData.ReceiverUserId,
              content: messageData.Content,
              sentAt: messageData.SentAt,
              isRead: messageData.IsRead || false,
            };

            // Duplicate kontrolü
            const exists = draft.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.content === newMessage.content &&
                  msg.senderUserId === newMessage.senderUserId &&
                  Math.abs(new Date(msg.sentAt) - new Date(newMessage.sentAt)) <
                    1000)
            );

            if (!exists) {
              draft.push(newMessage);
            }
          }
        }
      )
    );
  },

  // Cache'deki mesajları okundu olarak işaretle
  markCacheMessagesAsRead: (dispatch, partnerId, currentUserId) => {
    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          if (Array.isArray(draft)) {
            draft.forEach((msg) => {
              if (msg.senderUserId === currentUserId) {
                msg.isRead = true;
              }
            });
          }
        }
      )
    );
  },

  // Optimistic mesajı cache'e ekle
  addOptimisticMessage: (dispatch, partnerId, messageData, currentUserId) => {
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderUserId: currentUserId,
      receiverUserId: partnerId,
      content: messageData.content,
      sentAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
    };

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          if (Array.isArray(draft)) {
            draft.push(optimisticMessage);
          }
        }
      )
    );

    return optimisticMessage.id;
  },

  // Optimistic mesajı kaldır (hata durumunda)
  removeOptimisticMessage: (dispatch, partnerId, messageId) => {
    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          if (Array.isArray(draft)) {
            const index = draft.findIndex((msg) => msg.id === messageId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          }
        }
      )
    );
  },

  // Optimistic mesajı gerçek mesajla değiştir
  replaceOptimisticMessage: (dispatch, partnerId, tempId, realMessage) => {
    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          if (Array.isArray(draft)) {
            const index = draft.findIndex((msg) => msg.id === tempId);
            if (index !== -1) {
              draft[index] = {
                ...realMessage,
                isOptimistic: false,
              };
            }
          }
        }
      )
    );
  },

  // Cache'i temizle (çıkış yaparken)
  clearChatCache: (dispatch) => {
    dispatch(chatApiSlice.util.resetApiState());
  },

  // Belirli bir chat'in cache'ini temizle
  clearSpecificChatCache: (dispatch, partnerId) => {
    dispatch(
      chatApiSlice.util.invalidateTags([{ type: "ChatMessage", id: partnerId }])
    );
  },

  // Partner listesini manuel güncelle
  updatePartnersList: (dispatch) => {
    dispatch(chatApiSlice.util.invalidateTags(["ChatPartner"]));
  },

  // Unread count'u manuel güncelle
  updateUnreadCount: (dispatch) => {
    dispatch(chatApiSlice.util.invalidateTags(["UnreadCount"]));
  },
};
