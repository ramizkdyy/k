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
        if (payload && payload.isSuccess && payload.result) {
          state.sentOffers = payload.result;
        }
      }
    );

    // Handle fetching received offers
    builder.addMatcher(
      apiSlice.endpoints.getReceivedOffers.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.receivedOffers = payload.result;
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
        if (payload && payload.isSuccess && payload.result) {
          const acceptedOfferId = payload.result.offerId;

          // Update the offer in receivedOffers array
          const offerIndex = state.receivedOffers.findIndex(
            (offer) => offer.offerId === acceptedOfferId
          );

          if (offerIndex >= 0) {
            state.receivedOffers[offerIndex] = payload.result;
          }

          // Also update currentOffer if it matches
          if (
            state.currentOffer &&
            state.currentOffer.offerId === acceptedOfferId
          ) {
            state.currentOffer = payload.result;
          }
        }
      }
    );

    // Handle rejecting an offer
    builder.addMatcher(
      apiSlice.endpoints.rejectOffer.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          const rejectedOfferId = payload.result.offerId;

          // Update the offer in receivedOffers array
          const offerIndex = state.receivedOffers.findIndex(
            (offer) => offer.offerId === rejectedOfferId
          );

          if (offerIndex >= 0) {
            state.receivedOffers[offerIndex] = payload.result;
          }

          // Also update currentOffer if it matches
          if (
            state.currentOffer &&
            state.currentOffer.offerId === rejectedOfferId
          ) {
            state.currentOffer = payload.result;
          }
        }
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
