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
    // Set expectations data
    setLandlordExpectation: (state, action) => {
      state.landlordExpectation = action.payload;
      // Clear any existing error when setting new expectation
      if (action.payload) {
        state.error = null;
      }
    },
    setTenantExpectation: (state, action) => {
      state.tenantExpectation = action.payload;
      // Clear any existing error when setting new expectation
      if (action.payload) {
        state.error = null;
      }
    },

    // Clear expectations
    clearLandlordExpectation: (state) => {
      state.landlordExpectation = null;
    },
    clearTenantExpectation: (state) => {
      state.tenantExpectation = null;
    },
    clearExpectations: (state) => {
      state.landlordExpectation = null;
      state.tenantExpectation = null;
      state.expectationFormData = null;
      state.error = null;
    },

    // Set loading state
    setExpectationLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // Form data management
    saveExpectationFormData: (state, action) => {
      state.expectationFormData = action.payload;
    },
    clearExpectationFormData: (state) => {
      state.expectationFormData = null;
    },

    // Error management
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Update expectation fields
    updateLandlordExpectationField: (state, action) => {
      if (state.landlordExpectation) {
        const { field, value } = action.payload;
        state.landlordExpectation[field] = value;
      }
    },
    updateTenantExpectationField: (state, action) => {
      if (state.tenantExpectation) {
        const { field, value } = action.payload;
        state.tenantExpectation[field] = value;
      }
    },

    // Reset state
    resetExpectationState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Ev sahibi beklenti profili oluşturma
    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.landlordExpectation = payload.result;
          state.error = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Beklenti profili oluşturulamadı";
      }
    );

    // Kiracı beklenti profili oluşturma
    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.tenantExpectation = payload.result;
          state.error = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Beklenti profili oluşturulamadı";
      }
    );

    // Ev sahibi beklenti profili getirme (ById endpoint)
    builder.addMatcher(
      apiSlice.endpoints.getLandlordExpectationById.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.landlordExpectation = payload.result;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getLandlordExpectationById.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getLandlordExpectationById.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        // Don't set error for get operations unless it's a critical error
        if (payload?.status !== 404) {
          state.error =
            payload?.data?.message ||
            payload?.message ||
            error?.message ||
            "Beklenti profili getirilemedi";
        }
      }
    );

    // Kiracı beklenti profili getirme (ById endpoint)
    builder.addMatcher(
      apiSlice.endpoints.getTenantExpectationById.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.tenantExpectation = payload.result;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantExpectationById.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantExpectationById.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        // Don't set error for get operations unless it's a critical error
        if (payload?.status !== 404) {
          state.error =
            payload?.data?.message ||
            payload?.message ||
            error?.message ||
            "Beklenti profili getirilemedi";
        }
      }
    );

    // Ev sahibi beklenti profili güncelleme
    builder.addMatcher(
      apiSlice.endpoints.updateLandlordExpectation.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.landlordExpectation = payload.result;
          state.error = null;
          // Clear form data after successful update
          state.expectationFormData = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateLandlordExpectation.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateLandlordExpectation.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Beklenti profili güncellenemedi";
      }
    );

    // Kiracı beklenti profili güncelleme
    builder.addMatcher(
      apiSlice.endpoints.updateTenantExpectation.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.tenantExpectation = payload.result;
          state.error = null;
          // Clear form data after successful update
          state.expectationFormData = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateTenantExpectation.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateTenantExpectation.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Beklenti profili güncellenemedi";
      }
    );
  },
});

export const {
  setLandlordExpectation,
  setTenantExpectation,
  clearLandlordExpectation,
  clearTenantExpectation,
  clearExpectations,
  setExpectationLoading,
  saveExpectationFormData,
  clearExpectationFormData,
  setError,
  clearError,
  updateLandlordExpectationField,
  updateTenantExpectationField,
  resetExpectationState,
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
export const selectExpectationLoading = (state) => state.expectations.isLoading;

// Enhanced selectors
export const selectUserExpectation = (state, userRole) => {
  return userRole === "EVSAHIBI"
    ? state.expectations.landlordExpectation
    : state.expectations.tenantExpectation;
};

export const selectHasExpectationData = (state, userRole) => {
  const expectation = selectUserExpectation(state, userRole);
  return expectation !== null && expectation !== undefined;
};
