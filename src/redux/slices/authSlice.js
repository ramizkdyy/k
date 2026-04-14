import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  userRole: null,
  hasUserProfile: false,
  isLoading: false,
  error: null,
  fcmToken: null,
  fcmTokenRegistered: false,
  lastLoginTime: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, hasUserProfile } = action.payload;
      const previousUserId = state.user?.id;
      const currentUserId = user?.id;

      if (previousUserId && currentUserId && previousUserId !== currentUserId) {
        Object.assign(state, initialState);
      }

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.hasUserProfile = hasUserProfile || false;
      state.lastLoginTime = new Date().toISOString();
      state.error = null;

      if (user?.role) {
        state.userRole = user.role;
      } else if (user?.user?.role) {
        state.userRole = user.user.role;
      }
    },

    logout: (state) => {
      Object.assign(state, initialState);
    },

    forceLogout: (state) => {
      Object.assign(state, initialState);
    },

    setRole: (state, action) => {
      const newRole = action.payload;
      state.userRole = newRole;
      if (state.user) {
        state.user = { ...state.user, role: newRole };
      }
    },

    setHasUserProfile: (state, action) => {
      state.hasUserProfile = action.payload;
    },

    updateUserData: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      if (action.payload.role) {
        state.userRole = action.payload.role;
      }
    },

    setFcmToken: (state, action) => {
      state.fcmToken = action.payload;
    },

    setFcmTokenRegistered: (state, action) => {
      state.fcmTokenRegistered = action.payload;
    },

    clearFcmToken: (state) => {
      state.fcmToken = null;
      state.fcmTokenRegistered = false;
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    resetAuthState: (state) => {
      Object.assign(state, initialState);
    },
  },

  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.assignRole?.matchFulfilled,
      (state, { payload }) => {
        if (payload?.result?.role && state.user) {
          const newRole = payload.result.role;
          state.userRole = newRole;
          state.user.role = newRole;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile?.matchFulfilled,
      (state) => {
        state.hasUserProfile = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile?.matchFulfilled,
      (state) => {
        state.hasUserProfile = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation?.matchFulfilled,
      (state, { payload }) => {
        if (payload?.isSuccess && state.user) {
          state.user.isLandlordExpectationCompleted = true;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation?.matchFulfilled,
      (state, { payload }) => {
        if (payload?.isSuccess && state.user) {
          state.user.isTenantExpectationCompleted = true;
        }
      }
    );
  },
});

export const {
  setCredentials,
  logout,
  forceLogout,
  setRole,
  setHasUserProfile,
  updateUserData,
  setFcmToken,
  setFcmTokenRegistered,
  clearFcmToken,
  setLoading,
  setError,
  clearError,
  resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentUserId = (state) => state.auth.user?.id;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.userRole;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;
export const selectHasUserProfile = (state) => state.auth.hasUserProfile;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectFcmToken = (state) => state.auth.fcmToken;
export const selectFcmTokenRegistered = (state) => state.auth.fcmTokenRegistered;

export const selectIsFullyAuthenticated = (state) =>
  state.auth.isAuthenticated && !!state.auth.token && !!state.auth.user;

export const selectUserInfo = (state) => ({
  user: state.auth.user,
  role: state.auth.userRole,
  hasProfile: state.auth.hasUserProfile,
  isAuthenticated: state.auth.isAuthenticated,
});

export const selectNotificationTokens = (state) => ({
  fcmToken: state.auth.fcmToken,
  fcmRegistered: state.auth.fcmTokenRegistered,
});

export const selectCanReceiveNotifications = (state) =>
  state.auth.isAuthenticated && state.auth.fcmToken && state.auth.fcmTokenRegistered;

export const selectAuthStatus = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isLoading: state.auth.isLoading,
  hasError: !!state.auth.error,
  error: state.auth.error,
  lastLoginTime: state.auth.lastLoginTime,
});
