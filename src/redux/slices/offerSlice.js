// src/redux/slices/offerSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const initialState = {
  sentOffers: [],
  receivedOffers: [],
  currentOffer: null,
  isLoading: false,
  error: null,
  offerFormData: null, // Store form data when navigating between screens
};

const offerSlice = createSlice({
  name: "offers",
  initialState,
  reducers: {
    setCurrentOffer: (state, action) => {
      state.currentOffer = action.payload;
    },
    clearCurrentOffer: (state) => {
      state.currentOffer = null;
    },
    saveOfferFormData: (state, action) => {
      state.offerFormData = action.payload;
    },
    clearOfferFormData: (state) => {
      state.offerFormData = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle fetching sent offers
    builder.addMatcher(
      apiSlice.endpoints.getSentOffers.matchFulfilled,
      (state, { payload }) => {
        console.log("Sent offers response:", payload);
        if (payload && payload.isSuccess) {
          // Handle tenant sent offers structure
          if (Array.isArray(payload.result)) {
            // Check if it's the structure with rentalOfferDto and postDto
            if (payload.result.length > 0 && payload.result[0].rentalOfferDto) {
              state.sentOffers = payload.result.map((item) => ({
                ...item.rentalOfferDto,
                post: item.postDto
                  ? {
                      postId: item.postDto.postId,
                      ilanBasligi: item.postDto.ilanBasligi,
                      kiraFiyati: item.postDto.kiraFiyati,
                      ilce: item.postDto.ilce,
                      mahalle: item.postDto.mahalle,
                      postImages: item.postDto.postImages,
                    }
                  : null,
              }));
            } else {
              // Direct array of offers
              state.sentOffers = payload.result;
            }
          } else if (payload.result && Array.isArray(payload.result.offers)) {
            // If the result contains an offers array
            state.sentOffers = payload.result.offers;
          } else {
            // Fallback to empty array
            state.sentOffers = [];
          }
        }
      }
    );

    // Handle fetching received offers
    builder.addMatcher(
      apiSlice.endpoints.getReceivedOffers.matchFulfilled,
      (state, { payload }) => {
        console.log("Received offers response:", payload);
        if (payload && payload.isSuccess) {
          // Handle both array and object responses
          if (Array.isArray(payload.result)) {
            state.receivedOffers = payload.result;
          } else if (payload.result) {
            // If the result is an object with offers from multiple posts
            // Extract all offers from the landlord's posts
            const allOffers = [];

            // Check if result has rentalPosts array
            if (
              payload.result.rentalPosts &&
              Array.isArray(payload.result.rentalPosts)
            ) {
              payload.result.rentalPosts.forEach((post) => {
                if (post.offers && Array.isArray(post.offers)) {
                  // Add post information to each offer for display
                  post.offers.forEach((offer) => {
                    allOffers.push({
                      ...offer,
                      post: {
                        postId: post.postId,
                        ilanBasligi: post.ilanBasligi,
                        kiraFiyati: post.kiraFiyati,
                        ilce: post.ilce,
                        mahalle: post.mahalle,
                        postImages: post.postImages,
                      },
                    });
                  });
                }
              });
            }

            state.receivedOffers = allOffers;
          } else {
            // Fallback to empty array
            state.receivedOffers = [];
          }
        }
      }
    );

    // Handle creating a new offer
    builder.addMatcher(
      apiSlice.endpoints.createOffer.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          // Add new offer to sentOffers array if it doesn't exist yet
          const exists = state.sentOffers.some(
            (offer) => offer.offerId === payload.result.offerId
          );
          if (!exists) {
            state.sentOffers.push(payload.result);
          }
        }
      }
    );

    // Handle fetching a single offer
    builder.addMatcher(
      apiSlice.endpoints.getOffer.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.currentOffer = payload.result;
        }
      }
    );

    // Handle accepting an offer
    builder.addMatcher(
      apiSlice.endpoints.acceptOffer.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess) {
          // Extract the offer ID from the response
          const acceptedOfferId =
            payload.result?.offerId ||
            (payload.result && typeof payload.result === "object"
              ? Object.keys(payload.result).find((key) =>
                  key.includes("offerId")
                )
              : null);

          if (acceptedOfferId) {
            // Update the offer in receivedOffers array
            const offerIndex = state.receivedOffers.findIndex(
              (offer) => offer.offerId === acceptedOfferId
            );

            if (offerIndex >= 0) {
              state.receivedOffers[offerIndex] = {
                ...state.receivedOffers[offerIndex],
                status: 1, // Accepted status
                isActive: false,
              };
            }

            // Also update currentOffer if it matches
            if (
              state.currentOffer &&
              state.currentOffer.offerId === acceptedOfferId
            ) {
              state.currentOffer = {
                ...state.currentOffer,
                status: 1,
                isActive: false,
              };
            }
          }
        }
      }
    );

    // Handle rejecting an offer
    builder.addMatcher(
      apiSlice.endpoints.rejectOffer.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess) {
          // Extract the offer ID from the response
          const rejectedOfferId =
            payload.result?.offerId ||
            (payload.result && typeof payload.result === "object"
              ? Object.keys(payload.result).find((key) =>
                  key.includes("offerId")
                )
              : null);

          if (rejectedOfferId) {
            // Update the offer in receivedOffers array
            const offerIndex = state.receivedOffers.findIndex(
              (offer) => offer.offerId === rejectedOfferId
            );

            if (offerIndex >= 0) {
              state.receivedOffers[offerIndex] = {
                ...state.receivedOffers[offerIndex],
                status: 2, // Rejected status
                isActive: false,
              };
            }

            // Also update currentOffer if it matches
            if (
              state.currentOffer &&
              state.currentOffer.offerId === rejectedOfferId
            ) {
              state.currentOffer = {
                ...state.currentOffer,
                status: 2,
                isActive: false,
              };
            }
          }
        }
      }
    );

    // Handle errors
    builder.addMatcher(
      apiSlice.endpoints.getSentOffers.matchRejected,
      (state, { payload }) => {
        state.error = payload?.data?.message || "Failed to fetch sent offers";
        state.isLoading = false;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getReceivedOffers.matchRejected,
      (state, { payload }) => {
        state.error =
          payload?.data?.message || "Failed to fetch received offers";
        state.isLoading = false;
      }
    );

    // Handle pending states
    builder.addMatcher(
      apiSlice.endpoints.getSentOffers.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getReceivedOffers.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );
  },
});

export const {
  setCurrentOffer,
  clearCurrentOffer,
  saveOfferFormData,
  clearOfferFormData,
  setError,
  clearError,
} = offerSlice.actions;

export default offerSlice.reducer;

// Selectors
export const selectAllSentOffers = (state) => state.offers.sentOffers;
export const selectAllReceivedOffers = (state) => state.offers.receivedOffers;
export const selectCurrentOffer = (state) => state.offers.currentOffer;
export const selectOfferFormData = (state) => state.offers.offerFormData;
export const selectOfferError = (state) => state.offers.error;
export const selectOffersLoading = (state) => state.offers.isLoading;

// Filtered offers selectors
export const selectPendingReceivedOffers = (state) =>
  state.offers.receivedOffers.filter((offer) => offer.status === 0); // 0 is pending status

export const selectAcceptedReceivedOffers = (state) =>
  state.offers.receivedOffers.filter((offer) => offer.status === 1); // 1 is accepted status

export const selectRejectedReceivedOffers = (state) =>
  state.offers.receivedOffers.filter((offer) => offer.status === 2); // 2 is rejected status

export const selectPendingSentOffers = (state) =>
  state.offers.sentOffers.filter((offer) => offer.status === 0);

export const selectAcceptedSentOffers = (state) =>
  state.offers.sentOffers.filter((offer) => offer.status === 1);

export const selectRejectedSentOffers = (state) =>
  state.offers.sentOffers.filter((offer) => offer.status === 2);

// Count selectors
export const selectPendingReceivedOffersCount = (state) =>
  selectPendingReceivedOffers(state).length;

export const selectPendingSentOffersCount = (state) =>
  selectPendingSentOffers(state).length;
