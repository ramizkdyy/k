// src/redux/slices/expectationSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const initialState = {
  landlordExpectation: null,
  tenantExpectation: null,
  isLoading: false,
  error: null,
  expectationFormData: null, // Form verileri için geçici depolama
};

const expectationSlice = createSlice({
  name: "expectations",
  initialState,
  reducers: {
    setLandlordExpectation: (state, action) => {
      state.landlordExpectation = action.payload;
    },
    clearLandlordExpectation: (state) => {
      state.landlordExpectation = null;
    },
    setTenantExpectation: (state, action) => {
      state.tenantExpectation = action.payload;
    },
    clearTenantExpectation: (state) => {
      state.tenantExpectation = null;
    },
    saveExpectationFormData: (state, action) => {
      state.expectationFormData = action.payload;
    },
    clearExpectationFormData: (state) => {
      state.expectationFormData = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Ev sahibi beklenti profili oluşturma
    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.landlordExpectation = payload.result;
          state.error = null;
        }
      }
    );

    // Ev sahibi beklenti profili oluşturma hatası
    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation.matchRejected,
      (state, { payload, error }) => {
        state.error =
          payload?.message ||
          error?.message ||
          "Beklenti profili oluşturulamadı";
      }
    );

    // Kiracı beklenti profili oluşturma
    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.tenantExpectation = payload.result;
          state.error = null;
        }
      }
    );

    // Kiracı beklenti profili oluşturma hatası
    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation.matchRejected,
      (state, { payload, error }) => {
        state.error =
          payload?.message ||
          error?.message ||
          "Beklenti profili oluşturulamadı";
      }
    );

    // Ev sahibi beklenti profili getirme
    builder.addMatcher(
      apiSlice.endpoints.getLandlordExpectation.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.landlordExpectation = payload.result;
        }
      }
    );

    // Kiracı beklenti profili getirme
    builder.addMatcher(
      apiSlice.endpoints.getTenantExpectation.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.tenantExpectation = payload.result;
        }
      }
    );

    // Ev sahibi beklenti profili güncelleme
    builder.addMatcher(
      apiSlice.endpoints.updateLandlordExpectation.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.landlordExpectation = payload.result;
          state.error = null;
        }
      }
    );

    // Kiracı beklenti profili güncelleme
    builder.addMatcher(
      apiSlice.endpoints.updateTenantExpectation.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.tenantExpectation = payload.result;
          state.error = null;
        }
      }
    );
  },
});

export const {
  setLandlordExpectation,
  clearLandlordExpectation,
  setTenantExpectation,
  clearTenantExpectation,
  saveExpectationFormData,
  clearExpectationFormData,
  setError,
  clearError,
} = expectationSlice.actions;

export default expectationSlice.reducer;

// Selectors
export const selectLandlordExpectation = (state) =>
  state.expectations.landlordExpectation;
export const selectTenantExpectation = (state) =>
  state.expectations.tenantExpectation;
export const selectExpectationFormData = (state) =>
  state.expectations.expectationFormData;
export const selectExpectationError = (state) => state.expectations.error;
