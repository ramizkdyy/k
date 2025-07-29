// redux/api/chatApiSlice.js - Fixed Pagination System
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const CHAT_BASE_URL = "https://chatapi.justkey.online/";

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
  // ✅ Reduced cache times for real-time updates
  keepUnusedDataFor: 60, // 1 minute cache for unused data
  refetchOnMountOrArgChange: true, // Refetch on component mount
  refetchOnFocus: true, // Refetch when window gains focus
  refetchOnReconnect: true, // Refetch on network reconnect
  endpoints: (builder) => ({
    // ✅ FIXED: Chat geçmişini getir - Her sayfa için ayrı cache key
    getChatHistory: builder.query({
      query: ({ partnerId, page = 1 }) => ({
        url: `/api/chat/history/${partnerId}?page=${page}`,
        method: "GET",
      }),
      providesTags: (result, error, { partnerId, page }) => [
        { type: "ChatMessage", id: `${partnerId}-page-${page}` }, // ✅ Her sayfa için ayrı tag
        { type: "ChatMessage", id: partnerId }, // Genel tag
      ],
      keepUnusedDataFor: 300, // 5 minutes cache
      transformResponse: (response, meta, arg) => {
        console.log(`Chat History Response (Page ${arg.page}):`, response);

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
      // ✅ FIXED: Her page için ayrı cache key oluştur
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs.partnerId}-page-${queryArgs.page}`;
      },
      forceRefetch({ currentArg, previousArg }) {
        // Partner değişirse force refetch
        return currentArg?.partnerId !== previousArg?.partnerId;
      },
      // ✅ REMOVED: merge fonksiyonu kaldırıldı - her sayfa kendi cache'inde tutulsun
    }),

    // Chat partnerlarını getir - ✅ More aggressive refetching
    getChatPartners: builder.query({
      query: () => "/api/chat/partners",
      providesTags: ["ChatPartner"],
      keepUnusedDataFor: 30, // ✅ Reduced to 30 seconds for fresher partner data
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
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

    // Okunmamış mesaj sayısını getir - ✅ More frequent updates
    getUnreadCount: builder.query({
      query: () => "/api/chat/unread-count",
      providesTags: ["UnreadCount"],
      keepUnusedDataFor: 15, // ✅ 15 seconds cache for unread count
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
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

    // ✅ REMOVED: loadOlderMessages endpoint'i kaldırıldı - getChatHistory kullanacağız

    // ✅ Mesaj gönder - Better invalidation strategy
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/api/chat/send-message",
        method: "POST",
        body: {
          receiverUserId: messageData.receiverUserId,
          content: messageData.content,
        },
      }),
      // ✅ Invalidate relevant tags to trigger refetch
      invalidatesTags: (result, error, { receiverUserId }) => [
        "ChatPartner", // Partner listesini güncelle
        "UnreadCount", // Unread count'u güncelle
        { type: "ChatMessage", id: receiverUserId }, // Specific chat'i güncelle
        { type: "ChatMessage", id: `${receiverUserId}-page-1` }, // İlk sayfayı güncelle
      ],
    }),

    // Mesajları okundu olarak işaretle
    markMessagesAsRead: builder.mutation({
      query: (partnerId) => ({
        url: `/api/chat/mark-read/${partnerId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, partnerId) => [
        "UnreadCount", // Unread count'u güncelle
        "ChatPartner", // Partner listesini güncelle (last message read status)
        { type: "ChatMessage", id: partnerId }, // Specific chat'i güncelle
        { type: "ChatMessage", id: `${partnerId}-page-1` }, // İlk sayfayı güncelle
      ],
    }),

    // ✅ Health check endpoint
    chatHealthCheck: builder.query({
      query: () => "/health",
      keepUnusedDataFor: 0,
    }),

    // ✅ Belirli bir kullanıcının online durumunu kontrol et
    getUserOnlineStatus: builder.query({
      query: (userId) => `/api/chat/user-status/${userId}`,
      keepUnusedDataFor: 30,
      transformResponse: (response) => {
        return {
          userId: response.userId || response.UserId,
          isOnline: response.isOnline || response.IsOnline || false,
          lastSeen: response.lastSeen || response.LastSeen,
        };
      },
    }),

    // ✅ Chat istatistikleri getir
    getChatStats: builder.query({
      query: () => "/api/chat/stats",
      keepUnusedDataFor: 300,
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
  useGetUserOnlineStatusQuery,
  useGetChatStatsQuery,
} = chatApiSlice;

// ✅ Enhanced SignalR ile real-time mesaj yönetimi için helper functions
export const chatApiHelpers = {
  // ✅ FIXED: Pagination için mesajları birleştir
  getCombinedMessages: (getState, partnerId, maxPages = 10) => {
    const state = getState();
    const allMessages = [];

    // Page 1'den başlayarak tüm yüklü sayfaları topla
    for (let page = 1; page <= maxPages; page++) {
      const cacheKey = `getChatHistory({"partnerId":"${partnerId}","page":${page}})`;
      const pageCache = state.chatApi.queries[cacheKey];

      if (pageCache?.data && Array.isArray(pageCache.data)) {
        console.log(
          `📖 Page ${page} found with ${pageCache.data.length} messages`
        );
        allMessages.push(...pageCache.data);
      } else if (page === 1) {
        // İlk sayfa yoksa boş array döndür
        console.log("📖 No first page data found");
        break;
      } else {
        // Sonraki sayfalar yoksa dur
        console.log(`📖 No more pages after ${page - 1}`);
        break;
      }
    }

    // Duplicateları temizle ve tarihe göre sırala
    const uniqueMessages = allMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );

    // En yeni mesajlar önce olacak şekilde sırala
    uniqueMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    console.log(
      `📖 Combined ${uniqueMessages.length} unique messages from ${Math.ceil(
        allMessages.length / 20
      )} pages`
    );
    return uniqueMessages;
  },

  // SignalR'dan gelen mesajı cache'e manuel ekle
  addMessageToCache: (dispatch, partnerId, messageData) => {
    console.log("🔄 Adding message to cache:", { partnerId, messageData });

    // Sadece ilk sayfayı güncelle (en yeni mesajlar burada)
    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          if (Array.isArray(draft)) {
            const newMessage = {
              id: messageData.Id || messageData.id || `msg-${Date.now()}`,
              senderUserId:
                messageData.SenderUserId || messageData.senderUserId,
              receiverUserId:
                messageData.ReceiverUserId || messageData.receiverUserId,
              content: messageData.Content || messageData.content,
              sentAt:
                messageData.SentAt ||
                messageData.sentAt ||
                new Date().toISOString(),
              isRead: messageData.IsRead || messageData.isRead || false,
            };

            // Duplicate kontrolü
            const exists = draft.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.content === newMessage.content &&
                  msg.senderUserId === newMessage.senderUserId &&
                  Math.abs(new Date(msg.sentAt) - new Date(newMessage.sentAt)) <
                    2000)
            );

            if (!exists) {
              console.log("✅ Adding new message to cache");
              // Add at the beginning since latest messages come first
              draft.unshift(newMessage);
            } else {
              console.log("⚠️ Duplicate message, not adding to cache");
            }
          }
        }
      )
    );
  },

  // Cache'deki mesajları okundu olarak işaretle
  markCacheMessagesAsRead: (dispatch, partnerId, currentUserId) => {
    console.log("👁️ Marking cache messages as read:", {
      partnerId,
      currentUserId,
    });

    // Tüm sayfaları güncelle
    for (let page = 1; page <= 10; page++) {
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getChatHistory",
          { partnerId, page },
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
    }
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

    console.log("🔮 Adding optimistic message to cache:", optimisticMessage);

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 }, // Sadece ilk sayfaya ekle
        (draft) => {
          if (Array.isArray(draft)) {
            draft.unshift(optimisticMessage);
          }
        }
      )
    );

    return optimisticMessage.id;
  },

  // Optimistic mesajı kaldır (hata durumunda)
  removeOptimisticMessage: (dispatch, partnerId, messageId) => {
    console.log("🗑️ Removing optimistic message:", { partnerId, messageId });

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 }, // Sadece ilk sayfadan kaldır
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
    console.log("🔄 Replacing optimistic message:", {
      partnerId,
      tempId,
      realMessage,
    });

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 }, // Sadece ilk sayfada değiştir
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
    console.log("🧹 Clearing all chat cache");
    dispatch(chatApiSlice.util.resetApiState());
  },

  // Belirli bir chat'in cache'ini temizle
  clearSpecificChatCache: (dispatch, partnerId) => {
    console.log("🗑️ Clearing specific chat cache:", partnerId);
    // Tüm sayfa cache'lerini temizle
    for (let page = 1; page <= 10; page++) {
      dispatch(
        chatApiSlice.util.invalidateTags([
          { type: "ChatMessage", id: `${partnerId}-page-${page}` },
        ])
      );
    }
    dispatch(
      chatApiSlice.util.invalidateTags([{ type: "ChatMessage", id: partnerId }])
    );
  },

  // ✅ Partner listesini manuel güncelle - Enhanced
  updatePartnersList: (dispatch) => {
    console.log("🔄 Invalidating partners list cache");
    dispatch(chatApiSlice.util.invalidateTags(["ChatPartner"]));
  },

  // ✅ Unread count'u manuel güncelle - Enhanced
  updateUnreadCount: (dispatch) => {
    console.log("🔄 Invalidating unread count cache");
    dispatch(chatApiSlice.util.invalidateTags(["UnreadCount"]));
  },

  // ✅ Specific chat'i yenile
  refreshSpecificChat: (dispatch, partnerId) => {
    console.log("🔄 Refreshing specific chat:", partnerId);
    // Tüm sayfa cache'lerini yenile
    for (let page = 1; page <= 10; page++) {
      dispatch(
        chatApiSlice.util.invalidateTags([
          { type: "ChatMessage", id: `${partnerId}-page-${page}` },
        ])
      );
    }
    dispatch(
      chatApiSlice.util.invalidateTags([{ type: "ChatMessage", id: partnerId }])
    );
  },

  // ✅ Tüm cache'i yenile (SignalR reconnect durumunda)
  refreshAllCache: (dispatch) => {
    console.log("🔄 Refreshing all cache");
    dispatch(
      chatApiSlice.util.invalidateTags([
        "ChatMessage",
        "ChatPartner",
        "UnreadCount",
      ])
    );
  },

  // ✅ Cache durumunu kontrol et
  getCacheStatus: (getState, partnerId) => {
    const state = getState();
    const chatCache =
      state.chatApi.queries[
        `getChatHistory({"partnerId":"${partnerId}","page":1})`
      ];
    const partnersCache = state.chatApi.queries["getChatPartners(undefined)"];
    const unreadCache = state.chatApi.queries["getUnreadCount(undefined)"];

    return {
      chatHistory: {
        exists: !!chatCache,
        isLoading: chatCache?.status === "pending",
        lastFetch: chatCache?.fulfilledTimeStamp,
        data: chatCache?.data,
      },
      partners: {
        exists: !!partnersCache,
        isLoading: partnersCache?.status === "pending",
        lastFetch: partnersCache?.fulfilledTimeStamp,
        data: partnersCache?.data,
      },
      unreadCount: {
        exists: !!unreadCache,
        isLoading: unreadCache?.status === "pending",
        lastFetch: unreadCache?.fulfilledTimeStamp,
        data: unreadCache?.data,
      },
    };
  },

  // ✅ Manuel prefetch - Chat'e girmeden önce data'yı yükle
  prefetchChatHistory: (dispatch, partnerId, page = 1) => {
    console.log("📥 Prefetching chat history for:", partnerId, "page:", page);
    dispatch(
      chatApiSlice.util.prefetch(
        "getChatHistory",
        { partnerId, page },
        { force: false }
      )
    );
  },

  // ✅ Cache'deki bir mesajı güncelle (read status vs.)
  updateMessageInCache: (dispatch, partnerId, messageId, updates) => {
    console.log("🔄 Updating message in cache:", {
      partnerId,
      messageId,
      updates,
    });

    // Tüm sayfaları kontrol et ve mesajı bul
    for (let page = 1; page <= 10; page++) {
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getChatHistory",
          { partnerId, page },
          (draft) => {
            if (Array.isArray(draft)) {
              const messageIndex = draft.findIndex(
                (msg) => msg.id === messageId
              );
              if (messageIndex !== -1) {
                Object.assign(draft[messageIndex], updates);
                return; // Mesaj bulundu, diğer sayfaları kontrol etme
              }
            }
          }
        )
      );
    }
  },
};
