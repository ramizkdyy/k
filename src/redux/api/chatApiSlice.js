// redux/api/chatApiSlice.js - Updated with Better Error Handling
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
    // ✅ Response transformer - Backend response'unu standardize et
    transformResponse: (response, meta, arg) => {
      console.log("API Response:", response);
      console.log("API Meta:", meta);
      console.log("API Arg:", arg);

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
    // ✅ Error handler
    transformErrorResponse: (response, meta, arg) => {
      console.error("API Error Response:", response);
      console.error("API Error Meta:", meta);

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
  endpoints: (builder) => ({
    // Chat geçmişini getir
    getChatHistory: builder.query({
      query: ({ partnerId, page = 1 }) => ({
        url: `/api/chat/history/${partnerId}?page=${page}`,
        method: "GET",
      }),
      providesTags: (result, error, { partnerId }) => [
        { type: "ChatMessage", id: partnerId },
      ],
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
      // Pagination için cache merge stratejisi
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
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    // Chat partnerlarını getir
    getChatPartners: builder.query({
      query: () => "/api/chat/partners",
      providesTags: ["ChatPartner"],
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

    // Mesaj gönder
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/api/chat/send-message",
        method: "POST",
        body: {
          receiverUserId: messageData.receiverUserId,
          content: messageData.content,
        },
      }),
      invalidatesTags: (result, error, { receiverUserId }) => [
        { type: "ChatMessage", id: receiverUserId },
        "ChatPartner",
        "UnreadCount",
      ],
      // ✅ Optimistic update with better error handling
      async onQueryStarted(
        messageData,
        { dispatch, queryFulfilled, getState }
      ) {
        const { receiverUserId, content } = messageData;
        const state = getState();
        const currentUserId = state.auth.user?.id || state.auth.user?.userId;

        if (!currentUserId || !receiverUserId || !content) {
          console.error("Invalid message data:", {
            currentUserId,
            receiverUserId,
            content,
          });
          return;
        }

        // Optimistic update - mesajı hemen göster
        const patchResult = dispatch(
          chatApiSlice.util.updateQueryData(
            "getChatHistory",
            { partnerId: receiverUserId },
            (draft) => {
              if (Array.isArray(draft)) {
                const optimisticMessage = {
                  id: `temp-${Date.now()}`,
                  senderUserId: currentUserId,
                  receiverUserId: receiverUserId,
                  content: content,
                  sentAt: new Date().toISOString(),
                  isRead: false,
                  isOptimistic: true,
                };
                draft.push(optimisticMessage);
              }
            }
          )
        );

        try {
          const result = await queryFulfilled;
          console.log("Message sent successfully:", result);

          // Başarılı olursa optimistic update'i kaldır ve gerçek veriyi yükle
          dispatch(
            chatApiSlice.util.invalidateTags([
              { type: "ChatMessage", id: receiverUserId },
            ])
          );
        } catch (error) {
          console.error("Failed to send message:", error);
          // Hata durumunda optimistic update'i geri al
          patchResult.undo();

          // Hata mesajını throw et ki component'ta handle edilebilsin
          throw error;
        }
      },
    }),

    // Mesajları okundu olarak işaretle
    markMessagesAsRead: builder.mutation({
      query: (partnerId) => ({
        url: `/api/chat/mark-read/${partnerId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, partnerId) => [
        { type: "ChatMessage", id: partnerId },
        "UnreadCount",
      ],
    }),

    // ✅ Health check endpoint - Backend'in çalışıp çalışmadığını kontrol et
    chatHealthCheck: builder.query({
      query: () => "/health",
      keepUnusedDataFor: 0, // Cache'leme
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
} = chatApiSlice;
