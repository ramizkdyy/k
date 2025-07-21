import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "https://kiraxapiyeni.justkey.online/";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: [
    "Post",
    "Offer",
    "Profile",
    "User",
    "Expectation",
    "Matching",
    "Health",
  ],
  endpoints: (builder) => ({
    // User endpoints
    register: builder.mutation({
      query: (userData) => ({
        url: "/api/user/Register",
        method: "POST",
        body: userData,
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/api/user/Login",
        method: "POST",
        body: credentials,
      }),
    }),
    assignRole: builder.mutation({
      query: (userData) => ({
        url: "/api/user/AssignRole",
        method: "POST",
        body: userData,
      }),
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/api/user/DeleteUser/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // Health Check
    healthCheck: builder.query({
      query: () => "/api/HealthCheck",
      providesTags: ["Health"],
    }),

    // Post endpoints
    // Eski getAllPosts endpoint'i (geriye dönük uyumluluk için)
    getAllPosts: builder.query({
      query: () => "/api/post",
      providesTags: ["Post"],
    }),

    // YENİ: Paginated posts endpoint'i
    getAllPostsPaginated: builder.query({
      query: ({ page = 1, pageSize = 10 } = {}) => ({
        url: `/api/post/GetAllPostPaginated?page=${page}&pageSize=${pageSize}`,
        method: "GET",
      }),
      providesTags: ["Post"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems, { arg }) => {
        // Eğer sayfa 1 ise cache'i sıfırla, yoksa ekle
        if (arg.page === 1) {
          return newItems;
        }
        // Yeni sayfanın verilerini mevcut cache'e ekle
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    getPost: builder.query({
      query: ({ postId, userId }) => ({
        url: `/api/post/${postId}?UserId=${userId}`,
        method: "GET",
      }),
      providesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
      ],
    }),
    createPost: builder.mutation({
      query: (postData) => ({
        url: "/api/post",
        method: "POST",
        body: postData,
        formData: true,
      }),
      invalidatesTags: ["Post"],
    }),
    updatePost: builder.mutation({
      query: (postData) => ({
        url: "/api/post",
        method: "PUT",
        body: postData,
        formData: true,
      }),
      invalidatesTags: (result, error, { PostId }) => [
        { type: "Post", id: PostId },
      ],
    }),
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/api/post/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    // Post tracking and stats
    trackPost: builder.mutation({
      query: ({ postId, userId }) => ({
        url: `/api/post/track/${postId}?userId=${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Post"],
    }),
    getPostStats: builder.query({
      query: (postId) => `/api/post/stats/${postId}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    // Offer endpoints
    createOffer: builder.mutation({
      query: (offerData) => ({
        url: "/api/post/tenant-action",
        method: "POST",
        body: offerData,
      }),
      invalidatesTags: ["Offer", "Post"],
    }),
    getOffer: builder.query({
      query: (offerId) => `/api/post/offer/${offerId}`,
      providesTags: (result, error, id) => [{ type: "Offer", id }],
    }),
    getSentOffers: builder.query({
      query: (userId) => `/api/post/offers/sent/${userId}`,
      providesTags: ["Offer"],
    }),
    getReceivedOffers: builder.query({
      query: (landlordId) => `/api/post/offers/received/${landlordId}`,
      providesTags: ["Offer"],
    }),

    // DÜZELTME: Landlord offer action endpoint'i
    landlordOfferAction: builder.mutation({
      query: (actionData) => ({
        url: "/api/post/landlord-action",
        method: "POST",
        body: actionData, // { userId, offerId, actionType }
      }),
      invalidatesTags: ["Offer", "Post"],
    }),

    // Eski endpoint'ler (geriye dönük uyumluluk için)
    acceptOffer: builder.mutation({
      query: (actionData) => ({
        url: "/api/post/landlord-action",
        method: "POST",
        body: {
          userId: actionData.userId,
          offerId: actionData.offerId,
          actionType: 0, // Accept action
        },
      }),
      invalidatesTags: ["Offer", "Post"],
    }),
    rejectOffer: builder.mutation({
      query: (actionData) => ({
        url: "/api/post/landlord-action",
        method: "POST",
        body: {
          userId: actionData.userId,
          offerId: actionData.offerId,
          actionType: 1, // Reject action
        },
      }),
      invalidatesTags: ["Offer", "Post"],
    }),

    // FYP (For You Page) endpoints
    getForYouPage: builder.query({
      query: ({ userId, latitude, longitude, radiusKm = 50, limit = 15 }) => ({
        url: `/api/Fyp/GetForYourPage?userId=${userId}&latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Post"],
    }),

    getNearbyPostsPaginated: builder.query({
      query: ({
        userId,
        latitude,
        longitude,
        radiusKm = 50,
        page = 1,
        pageSize = 10,
        sortBy,
        sortDirection,
        isMatch = false,
      }) => {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (latitude !== undefined) params.append("latitude", latitude);
        if (longitude !== undefined) params.append("longitude", longitude);
        params.append("radiusKm", radiusKm);
        params.append("page", page);
        params.append("pageSize", pageSize);
        if (sortBy !== undefined) params.append("sortBy", sortBy);
        if (sortDirection !== undefined)
          params.append("sortDirection", sortDirection);
        params.append("isMatch", isMatch);

        return {
          url: `/api/Fyp/GetNearbyPostsPaginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Post"],
    }),

    // YENİ: Posts sorted endpoint
    getPostsSorted: builder.query({
      query: ({
        userId,
        page = 1,
        pageSize = 10,
        sortBy,
        sortDirection,
        isMatch = false,
      }) => ({
        url: `/api/Fyp/GetPostsSorted?userId=${userId}&page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}&isMatch=${isMatch}`,
        method: "GET",
      }),
      providesTags: ["Post"],
    }),

    // YENİ: Matching endpoints
    getBestTenant: builder.query({
      query: (landlordUserId) => `/api/Matching/best-tenant/${landlordUserId}`,
      providesTags: ["Matching"],
    }),
    getBestLandlord: builder.query({
      query: (tenantUserId) => `/api/Matching/best-landlord/${tenantUserId}`,
      providesTags: ["Matching"],
    }),
    getMatchingScore: builder.query({
      query: ({ tenantUserId, landlordUserId }) =>
        `/api/Matching/score/${tenantUserId}/${landlordUserId}`,
      providesTags: ["Matching"],
    }),
    getTopTenants: builder.query({
      query: ({ landlordUserId, count = 5 }) =>
        `/api/Matching/top-tenants/${landlordUserId}?count=${count}`,
      providesTags: ["Matching"],
    }),
    getTopLandlords: builder.query({
      query: ({ tenantUserId, count = 5 }) =>
        `/api/Matching/top-landlords/${tenantUserId}?count=${count}`,
      providesTags: ["Matching"],
    }),
    getTopPostsForTenant: builder.query({
      query: ({ tenantUserId, count = 15 }) =>
        `/api/Matching/top-posts-tenant/${tenantUserId}?count=${count}`,
      providesTags: ["Matching"],
    }),

    // YENİ: Paginated Matching endpoints
    getLandlordTenantsPaginated: builder.query({
      query: ({
        landlordUserId,
        page = 1,
        pageSize = 10,
        minMatchScore = 0.3,
        propertyId,
      }) => {
        const params = new URLSearchParams();
        if (landlordUserId) params.append("landlordUserId", landlordUserId);
        params.append("page", page);
        params.append("pageSize", pageSize);
        params.append("minMatchScore", minMatchScore);
        if (propertyId) params.append("propertyId", propertyId);

        return {
          url: `/api/Matching/landlord/tenants/paginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Matching"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { landlordUserId, minMatchScore, propertyId } = queryArgs;
        return `${endpointName}-${landlordUserId}-${minMatchScore}-${
          propertyId || "all"
        }`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    getLandlordTenantsWithFallback: builder.query({
      query: ({
        landlordUserId,
        page = 1,
        pageSize = 10,
        minMatchScore = 0.3,
        propertyId,
        includeFallback = true,
      }) => {
        const params = new URLSearchParams();
        if (landlordUserId) params.append("landlordUserId", landlordUserId);
        params.append("page", page);
        params.append("pageSize", pageSize);
        params.append("minMatchScore", minMatchScore);
        if (propertyId) params.append("propertyId", propertyId);
        params.append("includeFallback", includeFallback);

        return {
          url: `/api/Matching/landlord/tenants/paginated-with-fallback?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Matching"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { landlordUserId, minMatchScore, propertyId, includeFallback } =
          queryArgs;
        return `${endpointName}-${landlordUserId}-${minMatchScore}-${
          propertyId || "all"
        }-${includeFallback}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    getTenantLandlordsPaginated: builder.query({
      query: ({
        tenantUserId,
        page = 1,
        pageSize = 10,
        minMatchScore = 0.3,
      }) => {
        const params = new URLSearchParams();
        if (tenantUserId) params.append("tenantUserId", tenantUserId);
        params.append("page", page);
        params.append("pageSize", pageSize);
        params.append("minMatchScore", minMatchScore);

        return {
          url: `/api/Matching/tenant/landlords/paginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Matching"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { tenantUserId, minMatchScore } = queryArgs;
        return `${endpointName}-${tenantUserId}-${minMatchScore}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    getTenantLandlordsWithFallback: builder.query({
      query: ({
        tenantUserId,
        page = 1,
        pageSize = 10,
        minMatchScore = 0.3,
        includeFallback = true,
      }) => {
        const params = new URLSearchParams();
        if (tenantUserId) params.append("tenantUserId", tenantUserId);
        params.append("page", page);
        params.append("pageSize", pageSize);
        params.append("minMatchScore", minMatchScore);
        params.append("includeFallback", includeFallback);

        return {
          url: `/api/Matching/tenant/landlords/paginated-with-fallback?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Matching"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { tenantUserId, minMatchScore, includeFallback } = queryArgs;
        return `${endpointName}-${tenantUserId}-${minMatchScore}-${includeFallback}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    // Profile endpoints
    createLandlordProfile: builder.mutation({
      query: (profileData) => ({
        url: "/api/profile/CreateLandlordProfile",
        method: "POST",
        body: profileData,
        formData: true,
      }),
      invalidatesTags: ["Profile"],
    }),
    createTenantProfile: builder.mutation({
      query: (profileData) => ({
        url: "/api/profile/CreateTenantProfile",
        method: "POST",
        body: profileData,
        formData: true,
      }),
      invalidatesTags: ["Profile"],
    }),
    updateLandlordProfile: builder.mutation({
      query: (profileData) => ({
        url: "/api/profile/UpdateLandlordProfile",
        method: "PUT",
        body: profileData,
        formData: true,
      }),
      invalidatesTags: (result, error, { UserId }) => [
        { type: "Profile", id: UserId },
        { type: "User", id: UserId }, // Also invalidate User tag
        { type: "Expectation", id: UserId }, // Also invalidate Expectation tag
      ],
    }),
    updateTenantProfile: builder.mutation({
      query: (profileData) => ({
        url: "/api/profile/UpdateTenantProfile",
        method: "PUT",
        body: profileData,
        formData: true,
      }),
      invalidatesTags: (result, error, { UserId }) => [
        { type: "Profile", id: UserId },
        { type: "User", id: UserId }, // Also invalidate User tag
        { type: "Expectation", id: UserId }, // Also invalidate Expectation tag
      ],
    }),

    getLandlordProfiles: builder.query({
      query: () => "/api/profile/GetLandlordProfiles",
      providesTags: ["Profile"],
    }),
    getTenantProfiles: builder.query({
      query: () => "/api/profile/GetTenantProfiles",
      providesTags: ["Profile"],
    }),
    getLandlordProfile: builder.query({
      query: (id) => `/api/profile/GetLandlordProfile/${id}`,
      providesTags: (result, error, id) => [{ type: "Profile", id }],
    }),
    getTenantProfile: builder.query({
      query: (id) => `/api/profile/GetTenantProfile/${id}`,
      providesTags: (result, error, id) => [{ type: "Profile", id }],
    }),
    deleteProfile: builder.mutation({
      query: (userId) => ({
        url: `/api/profile/DeleteProfile/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Profile", id }, "User"],
    }),

    getLandlordPropertyListings: builder.query({
      query: (userId) => `/api/profile/GetLandlordPropertyListings/${userId}`,
      providesTags: ["Post", "Profile"],
    }),
    getTenantFavoriteProperties: builder.query({
      query: (userId) => `/api/profile/GetTenantFavoriteProperties/${userId}`,
      providesTags: ["Post", "Profile"],
    }),
    toggleFavoriteProperty: builder.mutation({
      query: (favoriteData) => ({
        url: "/api/post/tenant-action",
        method: "POST",
        body: favoriteData,
      }),
      invalidatesTags: ["Profile", "Post"],
    }),

    // Updated expectation endpoints with "ById" suffix
    createLandlordExpectation: builder.mutation({
      query: (expectationData) => ({
        url: "/api/profile/CreateLandlordExpectation",
        method: "POST",
        body: expectationData,
      }),
      invalidatesTags: ["Expectation", "User", "Profile"],
    }),
    createTenantExpectation: builder.mutation({
      query: (expectationData) => ({
        url: "/api/profile/CreateTenantExpectation",
        method: "POST",
        body: expectationData,
      }),
      invalidatesTags: ["Expectation", "User", "Profile"],
    }),
    getLandlordExpectationById: builder.query({
      query: (userId) => `/api/profile/GetLandlordExpectationById/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "Expectation", id: userId },
      ],
    }),
    getTenantExpectationById: builder.query({
      query: (userId) => `/api/profile/GetTenantExpectationById/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "Expectation", id: userId },
      ],
    }),
    updateLandlordExpectation: builder.mutation({
      query: (expectationData) => ({
        url: "/api/profile/UpdateLandlordExpectation",
        method: "PUT",
        body: expectationData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "Expectation", id: userId },
        { type: "User", id: userId },
      ],
    }),
    updateTenantExpectation: builder.mutation({
      query: (expectationData) => ({
        url: "/api/profile/UpdateTenantExpectation",
        method: "PUT",
        body: expectationData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "Expectation", id: userId },
        { type: "User", id: userId },
      ],
    }),

    // YENİ: Seed endpoints
    getSeedStatus: builder.query({
      query: () => "/api/Seed/status",
      providesTags: ["Health"],
    }),
    runSeed: builder.mutation({
      query: () => ({
        url: "/api/Seed/seed",
        method: "POST",
      }),
      invalidatesTags: ["Post", "Profile", "User"],
    }),
    runSeedForce: builder.mutation({
      query: () => ({
        url: "/api/Seed/seed-force",
        method: "POST",
      }),
      invalidatesTags: ["Post", "Profile", "User"],
    }),

    // YENİ: Callback endpoints (bunları genellikle client tarafında kullanmazsınız, backend için)
    postUploadImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/PostCallBack/PostUploadImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    postUpdateImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/PostCallBack/UpdateImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    postDeleteImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/PostCallBack/PostDeleteImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    postSensorImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/PostCallBack/PostSensorImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    postUpdateTextStatus: builder.mutation({
      query: (data) => ({
        url: "/api/PostCallBack/PostUpdateTextStatus",
        method: "POST",
        body: data,
      }),
    }),

    // YENİ: Landlord Profile Callback endpoints
    landlordProfileUploadImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/LandLordProfileCallback/LandLordProfileUploadImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    landlordProfileUpdateImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/LandLordProfileCallback/UpdateImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    landlordProfileDeleteImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/LandLordProfileCallback/LandLordProfileDeleteImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    landlordProfileSensorImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/LandLordProfileCallback/LandLordProfileSensorImageStatus",
        method: "POST",
        body: data,
      }),
    }),

    // YENİ: Tenant Profile Callback endpoints
    tenantProfileUploadImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/TenantProfileCallback/TenantProfileUploadImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    tenantProfileUpdateImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/TenantProfileCallback/UpdateImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    tenantProfileDeleteImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/TenantProfileCallback/TenantProfileDeleteImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    tenantProfileSensorImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/TenantProfileCallback/TenantProfileSensorImageStatus",
        method: "POST",
        body: data,
      }),
    }),

    // YENİ: Profile Callback endpoints
    profileUploadImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/ProfileCallBack/ProfileUploadImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    profileSensorImageStatus: builder.mutation({
      query: (data) => ({
        url: "/api/ProfileCallBack/ProfileSensorImageStatus",
        method: "POST",
        body: data,
      }),
    }),
    getSimilarPostsPaginated: builder.query({
      query: ({
        LandLordUserId,
        page = 1,
        pageSize = 10,
        minSimilarityScore = 0.3,
      }) => {
        const params = new URLSearchParams();
        if (LandLordUserId) params.append("LandLordUserId", LandLordUserId);
        params.append("page", page);
        params.append("pageSize", pageSize);
        params.append("minSimilarityScore", minSimilarityScore);

        return {
          url: `/api/Matching/similar-posts/paginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Matching"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { LandLordUserId, minSimilarityScore } = queryArgs;
        return `${endpointName}-${
          LandLordUserId || "all"
        }-${minSimilarityScore}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),

    getSimilarPostsByPostIdPaginated: builder.query({
      query: ({
        postId,
        page = 1,
        pageSize = 10,
        minSimilarityScore = 0.3,
      }) => {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("pageSize", pageSize);
        params.append("minSimilarityScore", minSimilarityScore);

        return {
          url: `/api/Matching/similar-posts/by-post/${postId}/paginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Matching"],
      // Pagination için cache merge stratejisi
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { postId, minSimilarityScore } = queryArgs;
        return `${endpointName}-${postId}-${minSimilarityScore}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
  }),
});

// Export the auto-generated hooks for use in your components
export const {
  // User hooks
  useRegisterMutation,
  useLoginMutation,
  useAssignRoleMutation,
  useDeleteUserMutation,

  // Health hooks
  useHealthCheckQuery,

  // Post hooks
  useGetAllPostsQuery, // Eski hook (geriye dönük uyumluluk için)
  useGetAllPostsPaginatedQuery, // YENİ paginated hook
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useTrackPostMutation,
  useGetPostStatsQuery,

  // FYP hooks
  useGetForYouPageQuery,
  useGetNearbyPostsPaginatedQuery,
  useGetPostsSortedQuery,

  // Matching hooks
  useGetBestTenantQuery,
  useGetBestLandlordQuery,
  useGetMatchingScoreQuery,
  useGetTopTenantsQuery,
  useGetTopLandlordsQuery,
  useGetTopPostsForTenantQuery,

  // YENİ: Paginated Matching hooks
  useGetLandlordTenantsPaginatedQuery,
  useGetLandlordTenantsWithFallbackQuery,
  useGetTenantLandlordsPaginatedQuery,
  useGetTenantLandlordsWithFallbackQuery,

  useGetSimilarPostsPaginatedQuery,
  useGetSimilarPostsByPostIdPaginatedQuery,

  // Offer hooks
  useCreateOfferMutation,
  useGetOfferQuery,
  useGetSentOffersQuery,
  useGetReceivedOffersQuery,

  // DÜZELTME: Yeni landlord action hook'u
  useLandlordOfferActionMutation,

  // Geriye dönük uyumluluk için eski hook'lar
  useAcceptOfferMutation,
  useRejectOfferMutation,

  // Profile hooks
  useCreateLandlordProfileMutation,
  useCreateTenantProfileMutation,
  useUpdateLandlordProfileMutation,
  useUpdateTenantProfileMutation,
  useGetLandlordProfilesQuery,
  useGetTenantProfilesQuery,
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
  useDeleteProfileMutation,
  useGetLandlordPropertyListingsQuery,
  useGetTenantFavoritePropertiesQuery,
  useToggleFavoritePropertyMutation,

  // Updated expectation hooks (changed to ById)
  useCreateLandlordExpectationMutation,
  useCreateTenantExpectationMutation,
  useGetLandlordExpectationByIdQuery,
  useGetTenantExpectationByIdQuery,
  useUpdateLandlordExpectationMutation,
  useUpdateTenantExpectationMutation,

  // Seed hooks
  useGetSeedStatusQuery,
  useRunSeedMutation,
  useRunSeedForceMutation,

  // Callback hooks (genellikle client tarafında kullanılmaz)
  usePostUploadImageStatusMutation,
  usePostUpdateImageStatusMutation,
  usePostDeleteImageStatusMutation,
  usePostSensorImageStatusMutation,
  usePostUpdateTextStatusMutation,

  // Landlord Profile Callback hooks
  useLandlordProfileUploadImageStatusMutation,
  useLandlordProfileUpdateImageStatusMutation,
  useLandlordProfileDeleteImageStatusMutation,
  useLandlordProfileSensorImageStatusMutation,

  // Tenant Profile Callback hooks
  useTenantProfileUploadImageStatusMutation,
  useTenantProfileUpdateImageStatusMutation,
  useTenantProfileDeleteImageStatusMutation,
  useTenantProfileSensorImageStatusMutation,

  // Profile Callback hooks
  useProfileUploadImageStatusMutation,
  useProfileSensorImageStatusMutation,
} = apiSlice;
