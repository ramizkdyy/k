// redux/api/chatApiSlice.js - Backend Response Format'ına Uygun Güncellemeler
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const CHAT_BASE_URL = "https://chatapi.justkey.online/";

export const chatApiSlice = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: CHAT_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      console.log(
        "CHAT BEARER TOKEN:",
        token ? `${token.substring(0, 20)}...` : "❌ NO TOKEN"
      );

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
        headers.set("ngrok-skip-browser-warning", "true");
        headers.set("Content-Type", "application/json");
      } else {
        console.error("❌ No auth token available for API call");
      }

      return headers;
    },
    // ✅ Enhanced response transformer - Backend'in yeni response format'ına uyumlu
    transformResponse: (response, meta, arg) => {
      console.log("🔍 API Response received:", {
        endpoint: arg.endpointName || "unknown",
        response: response,
        meta: meta,
      });

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
    // Enhanced error handler
    transformErrorResponse: (response, meta, arg) => {
      console.error("❌ API Error Response:", {
        endpoint: arg.endpointName || "unknown",
        response: response,
        meta: meta,
      });

      // Backend error response'unu handle et
      if (response.data?.message) {
        return { error: response.data.message };
      }

      if (response.data?.error) {
        return { error: response.data.error };
      }

      if (response.status === 401) {
        return { error: "Authentication failed. Please login again." };
      }

      if (response.status === 403) {
        return { error: "Access denied." };
      }

      if (response.status >= 500) {
        return { error: "Server error. Please try again later." };
      }

      return { error: "An unexpected error occurred" };
    },
  }),
  tagTypes: ["ChatMessage", "ChatPartner", "UnreadCount", "Notification"],
  // ✅ Reduced cache times for real-time updates
  keepUnusedDataFor: 60, // 1 minute cache for unused data
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // ✅ ENHANCED: Chat geçmişini getir - Backend'in yeni pagination format'ına uyumlu
    getChatHistory: builder.query({
      query: ({ partnerId, page = 1, pageSize = 20 }) => ({
        url: `/api/chat/history/${partnerId}?page=${page}&pageSize=${pageSize}`,
        method: "GET",
      }),
      providesTags: (result, error, { partnerId, page }) => [
        { type: "ChatMessage", id: `${partnerId}-page-${page}` },
        { type: "ChatMessage", id: partnerId },
      ],
      keepUnusedDataFor: 300, // 5 minutes cache
      // ✅ ENHANCED: Backend'in yeni response format'ını handle et
      transformResponse: (response, meta, arg) => {
        console.log(`🔍 Chat History Response (Page ${arg.page}):`, response);

        // ✅ Backend'in yeni format'ı: { messages: [], hasNextPage: boolean, currentPage: number, pageSize: number }
        if (response && typeof response === "object" && response.messages) {
          const { messages, hasNextPage, currentPage, pageSize } = response;

          // Messages array'ini validate et
          if (Array.isArray(messages)) {
            console.log(
              `✅ Valid backend format - Page ${currentPage}: ${messages.length} messages, hasNext: ${hasNextPage}`
            );
            return {
              messages: messages,
              hasNextPage: Boolean(hasNextPage),
              currentPage: currentPage || arg.page,
              pageSize: pageSize || 20,
            };
          }
        }

        // ✅ Fallback: Response array ise (eski format için backward compatibility)
        if (Array.isArray(response)) {
          console.log(
            `⚠️ Legacy array format detected - ${response.length} messages`
          );
          return {
            messages: response,
            hasNextPage: response.length === (arg.pageSize || 20),
            currentPage: arg.page || 1,
            pageSize: arg.pageSize || 20,
          };
        }

        // ✅ Fallback: Object içinde array arama (diğer formatlar için)
        if (response?.result && Array.isArray(response.result)) {
          return {
            messages: response.result,
            hasNextPage: response.result.length === (arg.pageSize || 20),
            currentPage: arg.page || 1,
            pageSize: arg.pageSize || 20,
          };
        }

        if (response?.data && Array.isArray(response.data)) {
          return {
            messages: response.data,
            hasNextPage: response.data.length === (arg.pageSize || 20),
            currentPage: arg.page || 1,
            pageSize: arg.pageSize || 20,
          };
        }

        // ✅ Default: Boş response
        console.log("⚠️ Unknown response format, returning empty");
        return {
          messages: [],
          hasNextPage: false,
          currentPage: arg.page || 1,
          pageSize: arg.pageSize || 20,
        };
      },
      // ✅ Her page için ayrı cache key oluştur
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs.partnerId}-page-${queryArgs.page}`;
      },
      forceRefetch({ currentArg, previousArg }) {
        // Partner değişirse force refetch
        return currentArg?.partnerId !== previousArg?.partnerId;
      },
    }),

    // ✅ ENHANCED: Chat partnerlarını getir - Backend response format'ına uyumlu
    getChatPartners: builder.query({
      query: () => "/api/chat/partners",
      providesTags: ["ChatPartner"],
      keepUnusedDataFor: 30, // 30 seconds for fresher partner data
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      transformResponse: (response) => {
        console.log("🔍 Chat Partners Response:", response);

        // Response direkt array ise
        if (Array.isArray(response)) {
          console.log(`✅ Partners array format - ${response.length} partners`);
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
        console.log("⚠️ No partners found or invalid format");
        return [];
      },
    }),

    // ✅ ENHANCED: Okunmamış mesaj sayısını getir - Backend response format'ına uyumlu
    getUnreadCount: builder.query({
      query: () => "/api/chat/unread-count",
      providesTags: ["UnreadCount"],
      keepUnusedDataFor: 15, // 15 seconds cache for unread count
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      transformResponse: (response) => {
        console.log("🔍 Unread Count Response:", response);

        // Response direkt number ise
        if (typeof response === "number") {
          return { count: response };
        }

        // Response object ise count field'ını ara
        if (response?.count !== undefined) {
          return { count: Number(response.count) };
        }

        if (response?.result?.count !== undefined) {
          return { count: Number(response.result.count) };
        }

        if (response?.data?.count !== undefined) {
          return { count: Number(response.data.count) };
        }

        // Backend'in direkt { count: number } format'ı
        if (typeof response === "object" && response !== null) {
          // Response içindeki sayısal değeri bul
          const numericValue = Object.values(response).find(
            (val) => typeof val === "number"
          );
          if (numericValue !== undefined) {
            return { count: numericValue };
          }
        }

        // Default 0
        console.log("⚠️ No valid count found, defaulting to 0");
        return { count: 0 };
      },
    }),

    // ✅ ENHANCED: Mesaj gönder - Backend response format'ına uyumlu
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/api/chat/send-message",
        method: "POST",
        body: {
          receiverUserId: messageData.receiverUserId,
          content: messageData.content,
        },
      }),
      // ✅ Enhanced response handling
      transformResponse: (response) => {
        console.log("🔍 Send Message Response:", response);

        // Backend'in success response'unu handle et
        if (response?.success) {
          return {
            success: true,
            message: response.message || "Message sent successfully",
          };
        }

        if (response?.isSuccess) {
          return {
            success: true,
            message: response.message || "Message sent successfully",
          };
        }

        // Default success response
        return {
          success: true,
          message: "Message sent successfully",
        };
      },
      // ✅ Invalidate relevant tags to trigger refetch
      invalidatesTags: (result, error, { receiverUserId }) => [
        "ChatPartner", // Partner listesini güncelle
        "UnreadCount", // Unread count'u güncelle
        { type: "ChatMessage", id: receiverUserId }, // Specific chat'i güncelle
        { type: "ChatMessage", id: `${receiverUserId}-page-1` }, // İlk sayfayı güncelle
      ],
    }),

    // ✅ ENHANCED: Mesajları okundu olarak işaretle
    markMessagesAsRead: builder.mutation({
      query: (partnerId) => ({
        url: `/api/chat/mark-read/${partnerId}`,
        method: "POST",
      }),
      transformResponse: (response) => {
        console.log("🔍 Mark Read Response:", response);
        return response;
      },
      invalidatesTags: (result, error, partnerId) => [
        "UnreadCount", // Unread count'u güncelle
        "ChatPartner", // Partner listesini güncelle (last message read status)
        { type: "ChatMessage", id: partnerId }, // Specific chat'i güncelle
        { type: "ChatMessage", id: `${partnerId}-page-1` }, // İlk sayfayı güncelle
      ],
    }),

    // ✅ ENHANCED: Partner by ID getir - Backend response format'ına uyumlu
    getPartnerById: builder.query({
      query: (partnerId) => `/api/chat/GetPartner/${partnerId}`,
      keepUnusedDataFor: 120, // 2 minutes cache
      transformResponse: (response) => {
        console.log("🔍 Partner By ID Response:", response);

        // Response direkt partner object ise
        if (response && typeof response === "object" && response.id) {
          return response;
        }

        // Nested response check
        if (response?.result && response.result.id) {
          return response.result;
        }

        if (response?.data && response.data.id) {
          return response.data;
        }

        return null;
      },
    }),

    // ✅ NEW: Partner by username getir
    getPartnerByUsername: builder.query({
      query: (username) => `/api/chat/GetPartnerByUsername/${username}`,
      keepUnusedDataFor: 60, // 1 minute cache
      transformResponse: (response) => {
        console.log("🔍 Partner By Username Response:", response);

        if (response && typeof response === "object" && response.id) {
          return response;
        }

        if (response?.result && response.result.id) {
          return response.result;
        }

        if (response?.data && response.data.id) {
          return response.data;
        }

        return null;
      },
    }),

    // ✅ NEW: Partner arama
    searchPartners: builder.query({
      query: ({ query, limit = 10 }) =>
        `/api/chat/search-partners?q=${encodeURIComponent(
          query
        )}&limit=${limit}`,
      keepUnusedDataFor: 30, // 30 seconds cache for search results
      transformResponse: (response) => {
        console.log("🔍 Search Partners Response:", response);

        // Backend format: { searchTerm: string, results: [], count: number }
        if (response?.results && Array.isArray(response.results)) {
          return {
            searchTerm: response.searchTerm,
            results: response.results,
            count: response.count || response.results.length,
          };
        }

        // Fallback: direkt array
        if (Array.isArray(response)) {
          return { searchTerm: "", results: response, count: response.length };
        }

        return {
          searchTerm: "",
          results: [],
          count: 0,
        };
      },
    }),

    // ✅ NEW: Chat partner arama (sadece mesajlaştığı kişiler arasında)
    searchChatPartners: builder.query({
      query: ({ query, limit = 10 }) =>
        `/api/chat/search-chat-partners?q=${encodeURIComponent(
          query
        )}&limit=${limit}`,
      keepUnusedDataFor: 30,
      transformResponse: (response) => {
        console.log("🔍 Search Chat Partners Response:", response);

        if (response?.results && Array.isArray(response.results)) {
          return {
            searchTerm: response.searchTerm,
            results: response.results,
            count: response.count || response.results.length,
          };
        }

        if (Array.isArray(response)) {
          return {
            searchTerm: "",
            results: response,
            count: response.length,
          };
        }

        return {
          searchTerm: "",
          results: [],
          count: 0,
        };
      },
    }),

    // ✅ ENHANCED: Unread summary getir - Backend response format'ına uyumlu
    getUnreadSummary: builder.query({
      query: () => "/api/chat/unread-summary",
      providesTags: ["UnreadCount"],
      keepUnusedDataFor: 30,
      transformResponse: (response) => {
        console.log("🔍 Unread Summary Response:", response);

        // Backend format: { totalUnreadMessages: number, totalUnreadChats: number, unreadChats: [] }
        if (response && typeof response === "object") {
          return {
            totalUnreadMessages:
              response.totalUnreadMessages || response.TotalUnreadMessages || 0,
            totalUnreadChats:
              response.totalUnreadChats || response.TotalUnreadChats || 0,
            unreadChats: response.unreadChats || response.UnreadChats || [],
          };
        }

        return {
          totalUnreadMessages: 0,
          totalUnreadChats: 0,
          unreadChats: [],
        };
      },
    }),

    // ✅ NEW: Belirli chat için unread count
    getUnreadCountForChat: builder.query({
      query: (partnerId) => `/api/chat/unread-count/${partnerId}`,
      keepUnusedDataFor: 15,
      transformResponse: (response) => {
        console.log("🔍 Unread Count For Chat Response:", response);

        if (response?.unreadCount !== undefined) {
          return {
            partnerId: response.partnerId,
            unreadCount: response.unreadCount,
          };
        }

        if (typeof response === "number") {
          return {
            partnerId: "",
            unreadCount: response,
          };
        }

        return {
          partnerId: "",
          unreadCount: 0,
        };
      },
    }),

    // ✅ NEW: Chat partners with unread count
    getChatPartnersWithUnreadCount: builder.query({
      query: () => "/api/chat/partners-with-unread",
      providesTags: ["ChatPartner", "UnreadCount"],
      keepUnusedDataFor: 30,
      transformResponse: (response) => {
        console.log("🔍 Chat Partners With Unread Response:", response);

        if (Array.isArray(response)) {
          return response;
        }

        if (response?.result && Array.isArray(response.result)) {
          return response.result;
        }

        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }

        return [];
      },
    }),

    // ✅ Health check endpoint
    chatHealthCheck: builder.query({
      query: () => "/health",
      keepUnusedDataFor: 0,
      transformResponse: (response) => {
        console.log("🔍 Health Check Response:", response);
        return response;
      },
    }),

    // ✅ Belirli bir kullanıcının online durumunu kontrol et
    getUserOnlineStatus: builder.query({
      query: (userId) => `/api/chat/user-status/${userId}`,
      keepUnusedDataFor: 30,
      transformResponse: (response) => {
        console.log("🔍 User Online Status Response:", response);
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
        console.log("🔍 Chat Stats Response:", response);
        return {
          totalChats: response.totalChats || response.TotalChats || 0,
          unreadCount: response.unreadCount || response.UnreadCount || 0,
          onlineUsers: response.onlineUsers || response.OnlineUsers || 0,
        };
      },
    }),

    // ✅ Notification endpoints - Backend response format'ına uyumlu
    registerNotificationToken: builder.mutation({
      query: (tokenData) => ({
        url: "/api/notification/register-token",
        method: "POST",
        body: tokenData,
      }),
      transformResponse: (response) => {
        console.log("🔍 Register Notification Token Response:", response);
        return response;
      },
      invalidatesTags: ["Notification"],
    }),

    unregisterNotificationToken: builder.mutation({
      query: (tokenData) => ({
        url: "/api/notification/unregister-token",
        method: "POST",
        body: tokenData,
      }),
      transformResponse: (response) => {
        console.log("🔍 Unregister Notification Token Response:", response);
        return response;
      },
      invalidatesTags: ["Notification"],
    }),
  }),
});

// ✅ Export all hooks including new ones
export const {
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
  useGetChatPartnersQuery,
  useGetUnreadCountQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useGetPartnerByIdQuery,
  useLazyGetPartnerByIdQuery,
  useGetPartnerByUsernameQuery,
  useLazyGetPartnerByUsernameQuery,
  useSearchPartnersQuery,
  useLazySearchPartnersQuery,
  useSearchChatPartnersQuery,
  useLazySearchChatPartnersQuery,
  useGetUnreadSummaryQuery,
  useGetUnreadCountForChatQuery,
  useGetChatPartnersWithUnreadCountQuery,
  useChatHealthCheckQuery,
  useGetUserOnlineStatusQuery,
  useGetChatStatsQuery,
  useRegisterNotificationTokenMutation,
  useUnregisterNotificationTokenMutation,
} = chatApiSlice;

// ✅ ENHANCED: SignalR ile real-time mesaj yönetimi için helper functions - Backend format'ına uyumlu
export const chatApiHelpers = {
  // ✅ ENHANCED: Pagination için mesajları birleştir - Backend response format'ına uyumlu
  getCombinedMessages: (getState, partnerId, maxPages = 10) => {
    const state = getState();
    const allMessages = [];

    // Page 1'den başlayarak tüm yüklü sayfaları topla
    for (let page = 1; page <= maxPages; page++) {
      const cacheKey = `getChatHistory({"partnerId":"${partnerId}","page":${page}})`;
      const pageCache = state.chatApi.queries[cacheKey];

      if (pageCache?.data) {
        // ✅ Backend'in yeni format'ını handle et
        const pageData = pageCache.data;
        let pageMessages = [];

        if (pageData.messages && Array.isArray(pageData.messages)) {
          // Yeni backend format
          pageMessages = pageData.messages;
        } else if (Array.isArray(pageData)) {
          // Eski format (backward compatibility)
          pageMessages = pageData;
        }

        if (pageMessages.length > 0) {
          console.log(
            `📖 Page ${page} found with ${pageMessages.length} messages`
          );
          allMessages.push(...pageMessages);
        } else if (page === 1) {
          console.log("📖 No first page data found");
          break;
        } else {
          console.log(`📖 No more pages after ${page - 1}`);
          break;
        }
      } else if (page === 1) {
        console.log("📖 No first page cache found");
        break;
      } else {
        console.log(`📖 No more cached pages after ${page - 1}`);
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

  // ✅ ENHANCED: SignalR'dan gelen mesajı cache'e manuel ekle - Backend field names ile uyumlu
  addMessageToCache: (dispatch, partnerId, messageData) => {
    console.log("🔄 Adding message to cache:", { partnerId, messageData });

    // ✅ Backend field names'leri normalize et
    const normalizedMessage = {
      id: messageData.Id || messageData.id || `msg-${Date.now()}`,
      senderUserId: messageData.SenderUserId || messageData.senderUserId,
      receiverUserId: messageData.ReceiverUserId || messageData.receiverUserId,
      content: messageData.Content || messageData.content,
      sentAt:
        messageData.SentAt || messageData.sentAt || new Date().toISOString(),
      isRead: messageData.IsRead || messageData.isRead || false,
    };

    // Sadece ilk sayfayı güncelle (en yeni mesajlar burada)
    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          // ✅ Backend'in yeni format'ını handle et
          let messages = [];

          if (draft.messages && Array.isArray(draft.messages)) {
            // Yeni backend format
            messages = draft.messages;
          } else if (Array.isArray(draft)) {
            // Eski format (backward compatibility)
            messages = draft;
            // Array'i yeni format'a dönüştür
            Object.assign(draft, {
              messages: messages,
              hasNextPage: draft.hasNextPage || false,
              currentPage: 1,
              pageSize: 20,
            });
            messages = draft.messages;
          } else {
            // Tamamen yeni cache
            Object.assign(draft, {
              messages: [],
              hasNextPage: false,
              currentPage: 1,
              pageSize: 20,
            });
            messages = draft.messages;
          }

          // Duplicate kontrolü
          const exists = messages.some(
            (msg) =>
              msg.id === normalizedMessage.id ||
              (msg.content === normalizedMessage.content &&
                msg.senderUserId === normalizedMessage.senderUserId &&
                Math.abs(
                  new Date(msg.sentAt) - new Date(normalizedMessage.sentAt)
                ) < 2000)
          );

          if (!exists) {
            console.log("✅ Adding new message to cache");
            // Add at the beginning since latest messages come first
            messages.unshift(normalizedMessage);
          } else {
            console.log("⚠️ Duplicate message, not adding to cache");
          }
        }
      )
    );
  },

  // ✅ ENHANCED: Cache'deki mesajları okundu olarak işaretle - Backend format'ına uyumlu
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
            let messages = [];

            if (draft.messages && Array.isArray(draft.messages)) {
              messages = draft.messages;
            } else if (Array.isArray(draft)) {
              messages = draft;
            }

            messages.forEach((msg) => {
              if (msg.senderUserId === currentUserId) {
                msg.isRead = true;
              }
            });
          }
        )
      );
    }
  },

  // ✅ ENHANCED: Optimistic mesajı cache'e ekle - Backend format'ına uyumlu
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
        { partnerId, page: 1 },
        (draft) => {
          let messages = [];

          if (draft.messages && Array.isArray(draft.messages)) {
            messages = draft.messages;
          } else if (Array.isArray(draft)) {
            messages = draft;
            // Convert to new format
            Object.assign(draft, {
              messages: messages,
              hasNextPage: draft.hasNextPage || false,
              currentPage: 1,
              pageSize: 20,
            });
            messages = draft.messages;
          } else {
            Object.assign(draft, {
              messages: [],
              hasNextPage: false,
              currentPage: 1,
              pageSize: 20,
            });
            messages = draft.messages;
          }

          messages.unshift(optimisticMessage);
        }
      )
    );

    return optimisticMessage.id;
  },

  // ✅ ENHANCED: Optimistic mesajı kaldır - Backend format'ına uyumlu
  removeOptimisticMessage: (dispatch, partnerId, messageId) => {
    console.log("🗑️ Removing optimistic message:", { partnerId, messageId });

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          let messages = [];

          if (draft.messages && Array.isArray(draft.messages)) {
            messages = draft.messages;
          } else if (Array.isArray(draft)) {
            messages = draft;
          }

          const index = messages.findIndex((msg) => msg.id === messageId);
          if (index !== -1) {
            messages.splice(index, 1);
          }
        }
      )
    );
  },

  // ✅ ENHANCED: Optimistic mesajı gerçek mesajla değiştir - Backend format'ına uyumlu
  replaceOptimisticMessage: (dispatch, partnerId, tempId, realMessage) => {
    console.log("🔄 Replacing optimistic message:", {
      partnerId,
      tempId,
      realMessage,
    });

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          let messages = [];

          if (draft.messages && Array.isArray(draft.messages)) {
            messages = draft.messages;
          } else if (Array.isArray(draft)) {
            messages = draft;
          }

          const index = messages.findIndex((msg) => msg.id === tempId);
          if (index !== -1) {
            messages[index] = {
              ...realMessage,
              isOptimistic: false,
            };
          }
        }
      )
    );
  },

  // ✅ Cache'i temizle (çıkış yaparken)
  clearChatCache: (dispatch) => {
    console.log("🧹 Clearing all chat cache");
    dispatch(chatApiSlice.util.resetApiState());
  },

  // ✅ Belirli bir chat'in cache'ini temizle
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

  // ✅ Partner listesini manuel güncelle
  updatePartnersList: (dispatch) => {
    console.log("🔄 Invalidating partners list cache");
    dispatch(chatApiSlice.util.invalidateTags(["ChatPartner"]));
  },

  // ✅ Unread count'u manuel güncelle
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

  // ✅ ENHANCED: Cache durumunu kontrol et - Backend format'ına uyumlu
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
        format: chatCache?.data?.messages
          ? "new"
          : Array.isArray(chatCache?.data)
          ? "legacy"
          : "unknown",
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

  // ✅ ENHANCED: Cache'deki bir mesajı güncelle - Backend format'ına uyumlu
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
            let messages = [];

            if (draft.messages && Array.isArray(draft.messages)) {
              messages = draft.messages;
            } else if (Array.isArray(draft)) {
              messages = draft;
            }

            const messageIndex = messages.findIndex(
              (msg) => msg.id === messageId
            );
            if (messageIndex !== -1) {
              Object.assign(messages[messageIndex], updates);
              return; // Mesaj bulundu, diğer sayfaları kontrol etme
            }
          }
        )
      );
    }
  },

  // ✅ NEW: Backend health check
  checkBackendHealth: async (dispatch) => {
    try {
      const result = await dispatch(
        chatApiSlice.endpoints.chatHealthCheck.initiate()
      ).unwrap();
      console.log("✅ Backend health check passed:", result);
      return true;
    } catch (error) {
      console.error("❌ Backend health check failed:", error);
      return false;
    }
  },

  // ✅ NEW: Cache migration helper (eski format'tan yeni format'a)
  migrateCacheFormat: (dispatch, partnerId) => {
    console.log("🔄 Migrating cache format for:", partnerId);

    dispatch(
      chatApiSlice.util.updateQueryData(
        "getChatHistory",
        { partnerId, page: 1 },
        (draft) => {
          // Eğer eski format (direkt array) ise yeni format'a dönüştür
          if (Array.isArray(draft) && !draft.messages) {
            const messages = [...draft];
            Object.assign(draft, {
              messages: messages,
              hasNextPage: false,
              currentPage: 1,
              pageSize: 20,
            });
            console.log("✅ Migrated cache from legacy format to new format");
          }
        }
      )
    );
  },
};
