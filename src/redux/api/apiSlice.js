// src/redux/api/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the base URL for the API
const BASE_URL = "https://kiraxapi.justkey.online/";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Get the token from the auth state
      const token = getState().auth.token;

      // If we have a token, add it to the headers
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Post", "Offer", "Profile", "User", "Expectation"],
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

    // Post endpoints
    getAllPosts: builder.query({
      query: () => "/api/post",
      providesTags: ["Post"],
    }),
    getPost: builder.query({
      query: (id) => `/api/post/${id}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
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

    // ForYou page endpoint
    getForYouPage: builder.query({
      query: ({ userId, latitude, longitude }) => ({
        url: `/api/Fyp/GetForYourPage?userId=${userId}&latitude=${latitude}&longitude=${longitude}`,
        method: "GET",
      }),
      providesTags: ["Post"],
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
  }),
});

// Export the auto-generated hooks for use in your components
export const {
  // User hooks
  useRegisterMutation,
  useLoginMutation,
  useAssignRoleMutation,

  // Post hooks
  useGetAllPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,

  //ForYou hooks
  useGetForYouPageQuery,

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
} = apiSlice;
