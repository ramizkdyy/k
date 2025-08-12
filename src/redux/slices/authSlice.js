// src/redux/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  userRole: null,
  hasUserProfile: false,
  isLoading: false,
  error: null,

  // ✅ FCM Token management
  fcmToken: null,
  fcmTokenRegistered: false,

  // ✅ Additional tracking
  lastLoginTime: null,
  deviceInfo: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ✅ Enhanced loading states
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      const { user, token, hasUserProfile } = action.payload;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.role = user?.role;
      state.userRole = user?.role;
      state.hasUserProfile = hasUserProfile || false;
      state.isLoading = false;
      state.error = null;
      state.lastLoginTime = new Date().toISOString();

      // Reset FCM registration status on new login (will be re-registered)
      state.fcmTokenRegistered = false;

      console.log("✅ Login successful - Redux state updated", {
        userId: user?.id,
        role: user?.role,
        hasProfile: hasUserProfile,
      });
    },

    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.role = null;
      state.userRole = null;
      state.hasUserProfile = false;

      console.log("❌ Login failed - Redux state cleared");
    },

    // ENHANCED: Better user switching detection and cleanup in setCredentials
    setCredentials: (state, action) => {
      const { user, token, hasUserProfile } = action.payload;
      const previousUserId = state.user?.id;
      const currentUserId = user?.id;

      // Detect user switch
      const isUserSwitch =
        previousUserId && currentUserId && previousUserId !== currentUserId;

      if (isUserSwitch) {
        console.log("🔄 USER SWITCH in setCredentials:", {
          previousUserId,
          currentUserId,
          clearingPreviousData: true,
        });

        // Clear previous user's data completely for user switch
        Object.assign(state, initialState);
        // Keep FCM token but reset registration status
        state.fcmTokenRegistered = false;
      }

      // Set new credentials
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.hasUserProfile = hasUserProfile || false;
      state.lastLoginTime = new Date().toISOString();

      if (user && user.role) {
        state.role = user.role;
        state.userRole = user.role;
      } else if (user && user.user && user.user.role) {
        state.role = user.user.role;
        state.userRole = user.user.role;
      }

      state.error = null;

      console.log("setCredentials çalıştı:", {
        userId: user?.id,
        wasUserSwitch: isUserSwitch,
        previousUserId,
        user,
        token: token?.substring(0, 20) + "...",
        role: state.role,
        userRole: state.userRole,
        hasUserProfile: state.hasUserProfile,
      });
    },

    // ENHANCED: More thorough logout with detailed logging and FCM cleanup
    logout: (state) => {
      console.log("🚪 Logout initiated for user:", state.user?.id);

      // Store previous user info for logging
      const previousUserId = state.user?.id;
      const previousRole = state.role;
      const hadFcmToken = state.fcmTokenRegistered;

      // Reset to initial state completely
      Object.assign(state, initialState);

      console.log("🧹 Logout completed - all auth state cleared:", {
        previousUserId,
        previousRole,
        hadFcmToken,
        stateReset: true,
      });
    },

    // NEW: Force clear all user data for hard reset (emergency logout)
    forceLogout: (state) => {
      console.log("🔥 FORCE LOGOUT initiated - clearing everything");

      // Store previous info
      const previousUserId = state.user?.id;

      // Hard reset - no partial state retention
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.userRole = null;
      state.hasUserProfile = false;
      state.isLoading = false;
      state.error = null;
      state.fcmToken = null;
      state.fcmTokenRegistered = false;
      state.lastLoginTime = null;
      state.deviceInfo = null;

      console.log("🔥 FORCE LOGOUT completed:", {
        previousUserId,
        allDataCleared: true,
      });
    },

    // ENHANCED: More robust role setting
    setRole: (state, action) => {
      const newRole = action.payload;
      state.role = newRole;
      state.userRole = newRole;

      // Ensure user object is updated too
      if (state.user) {
        state.user = {
          ...state.user,
          role: newRole,
        };
      }

      console.log("setRole çalıştı:", {
        newRole,
        userId: state.user?.id,
        userObject: state.user,
      });
    },

    setHasUserProfile: (state, action) => {
      state.hasUserProfile = action.payload;
      console.log("setHasUserProfile çalıştı:", {
        hasProfile: action.payload,
        userId: state.user?.id,
      });
    },

    // ENHANCED: Better user data updates
    updateUserData: (state, action) => {
      if (!state.user) {
        console.warn("Trying to update user data but no user exists");
        return;
      }

      state.user = {
        ...state.user,
        ...action.payload,
      };

      if (action.payload.role) {
        state.role = action.payload.role;
        state.userRole = action.payload.role;
      }

      console.log("updateUserData çalıştı:", {
        updatedUser: state.user,
        userId: state.user?.id,
      });
    },

    syncUserDataFromProfile: (state, action) => {
      const profile = action.payload;
      if (profile && profile.user && state.user) {
        state.user = {
          ...state.user,
          ...profile.user,
          isLandlordExpectationCompleted:
            profile.isLandlordExpectationCompleted ||
            profile.isLandLordExpectationCompleted,
          isTenantExpectationCompleted: profile.isTenantExpectationCompleted,
        };

        console.log("User data synced from profile:", {
          userId: state.user.id,
          user: state.user,
        });
      }
    },

    syncExpectationStatus: (state, action) => {
      const { isTenantExpectationCompleted, isLandlordExpectationCompleted } =
        action.payload;

      if (state.user) {
        if (isTenantExpectationCompleted !== undefined) {
          state.user.isTenantExpectationCompleted =
            isTenantExpectationCompleted;
        }
        if (isLandlordExpectationCompleted !== undefined) {
          state.user.isLandlordExpectationCompleted =
            isLandlordExpectationCompleted;
        }

        console.log("Expectation status synced:", {
          userId: state.user.id,
          isTenantExpectationCompleted: state.user.isTenantExpectationCompleted,
          isLandlordExpectationCompleted:
            state.user.isLandlordExpectationCompleted,
        });
      }
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    // NEW: Clear all user-related data (for debugging)
    clearUserData: (state) => {
      state.user = null;
      state.role = null;
      state.userRole = null;
      state.hasUserProfile = false;
      console.log("User data cleared");
    },

    // ✅ FCM Token management
    setFcmToken: (state, action) => {
      state.fcmToken = action.payload;
      console.log(
        "🔥 FCM token stored in Redux:",
        action.payload?.substring(0, 20) + "..."
      );
    },

    setFcmTokenRegistered: (state, action) => {
      state.fcmTokenRegistered = action.payload;
      console.log("📝 FCM token registration status updated:", action.payload);
    },

    clearFcmToken: (state) => {
      state.fcmToken = null;
      state.fcmTokenRegistered = false;
      console.log("🗑️ FCM token cleared from Redux");
    },


    // ✅ Device info (optional)
    setDeviceInfo: (state, action) => {
      state.deviceInfo = action.payload;
      console.log("📱 Device info stored:", action.payload);
    },

    // ✅ Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // ✅ Complete reset (for app restart or critical errors)
    resetAuthState: (state) => {
      Object.assign(state, initialState);
      console.log("🔄 Auth state completely reset");
    },
  },

  extraReducers: (builder) => {
    // Handle login response
    builder.addMatcher(
      apiSlice.endpoints.login?.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.result) {
          const { user, token, hasUserProfile } = payload.result;

          // Clear any existing data first
          Object.assign(state, initialState);

          // Set new data
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          state.role = user?.role || null;
          state.userRole = user?.role || null;
          state.hasUserProfile = hasUserProfile || false;
          state.error = null;
          state.lastLoginTime = new Date().toISOString();

          console.log("Login API successful:", {
            userId: user?.id,
            role: user?.role,
            hasUserProfile,
          });
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.login?.matchRejected,
      (state, { payload }) => {
        state.error = payload?.message || "Login failed";
        state.isAuthenticated = false;
        state.isLoading = false;
        console.error("Login failed:", payload);
      }
    );

    // Handle registration response
    builder.addMatcher(
      apiSlice.endpoints.register?.matchFulfilled,
      (state, { payload }) => {
        console.log("Register API yanıtı:", payload);
        if (payload && payload.result) {
          const { user, token, hasUserProfile } = payload.result;

          // Clear any existing data first
          Object.assign(state, initialState);

          // Set new data
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          state.role = user?.role || null;
          state.userRole = user?.role || null;
          state.hasUserProfile = hasUserProfile || false;
          state.error = null;
          state.lastLoginTime = new Date().toISOString();

          console.log("Registration successful:", {
            userId: user?.id,
            role: user?.role,
            hasUserProfile,
          });
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.register?.matchRejected,
      (state, { payload }) => {
        state.error = payload?.message || "Registration failed";
        state.isLoading = false;
        console.error("Registration failed:", payload);
      }
    );

    // ENHANCED: Handle role assignment with better validation
    builder.addMatcher(
      apiSlice.endpoints.assignRole?.matchFulfilled,
      (state, { payload, meta }) => {
        console.log("AssignRole API yanıtı:", payload);
        console.log("AssignRole meta:", meta);

        if (payload && payload.result && state.user) {
          const newRole = payload.result.role;
          state.role = newRole;
          state.userRole = newRole;
          state.user.role = newRole;

          console.log("Rol atama başarılı:", {
            userId: state.user.id,
            oldRole: meta.arg.role,
            newRole: newRole,
            currentUser: state.user,
          });
        } else if (!state.user) {
          console.error("Role assignment failed: No user in state");
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.assignRole?.matchRejected,
      (state, { payload, meta }) => {
        console.error("Role assignment failed:", payload);
        console.log("Failed role assignment meta:", meta);
        state.error = payload?.message || "Role assignment failed";
      }
    );

    // Profile creation handlers
    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile?.matchFulfilled,
      (state, { payload, meta }) => {
        state.hasUserProfile = true;
        console.log("Ev sahibi profili oluşturuldu:", {
          userId: state.user?.id,
          profileData: meta.arg,
          response: payload,
        });
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile?.matchFulfilled,
      (state, { payload, meta }) => {
        state.hasUserProfile = true;
        console.log("Kiracı profili oluşturuldu:", {
          userId: state.user?.id,
          profileData: meta.arg,
          response: payload,
        });
      }
    );

    // Expectation creation handlers with better logging
    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation?.matchFulfilled,
      (state, { payload, meta }) => {
        if (payload && payload.isSuccess && state.user) {
          state.user.isLandlordExpectationCompleted = true;
          console.log("Landlord expectation created successfully:", {
            userId: state.user.id,
            expectationData: meta.arg,
            response: payload,
          });
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordExpectation?.matchRejected,
      (state, { payload, meta }) => {
        console.error("Landlord expectation creation failed:", {
          error: payload,
          sentData: meta.arg,
          currentUserId: state.user?.id,
        });
        state.error =
          payload?.message || "Landlord expectation creation failed";
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation?.matchFulfilled,
      (state, { payload, meta }) => {
        if (payload && payload.isSuccess && state.user) {
          state.user.isTenantExpectationCompleted = true;
          console.log("Tenant expectation created successfully:", {
            userId: state.user.id,
            expectationData: meta.arg,
            response: payload,
          });
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantExpectation?.matchRejected,
      (state, { payload, meta }) => {
        console.error("Tenant expectation creation failed:", {
          error: payload,
          sentData: meta.arg,
          currentUserId: state.user?.id,
        });
        state.error = payload?.message || "Tenant expectation creation failed";
      }
    );
  },
});

export const {
  // ✅ Auth flow actions
  loginStart,
  loginSuccess,
  loginFailure,

  // ✅ Existing actions
  setCredentials,
  logout,
  forceLogout,
  setRole,
  setError,
  clearError,
  setHasUserProfile,
  updateUserData,
  syncUserDataFromProfile,
  syncExpectationStatus,
  clearUserData,

  // ✅ FCM token actions
  setFcmToken,
  setFcmTokenRegistered,
  clearFcmToken,


  // ✅ Additional actions
  setDeviceInfo,
  setLoading,
  resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;

// ✅ Enhanced selectors with better null checking
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentUserId = (state) => state.auth.user?.id;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.userRole || state.auth.role;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;
export const selectHasUserProfile = (state) => state.auth.hasUserProfile;
export const selectIsLoading = (state) => state.auth.isLoading;

// ✅ Notification token selectors
export const selectFcmToken = (state) => state.auth.fcmToken;
export const selectFcmTokenRegistered = (state) =>
  state.auth.fcmTokenRegistered;

// ✅ Computed selectors
export const selectIsFullyAuthenticated = (state) =>
  state.auth.isAuthenticated && !!state.auth.token && !!state.auth.user;

export const selectUserInfo = (state) => ({
  user: state.auth.user,
  role: state.auth.userRole || state.auth.role,
  hasProfile: state.auth.hasUserProfile,
  isAuthenticated: state.auth.isAuthenticated,
});

export const selectNotificationTokens = (state) => ({
  fcmToken: state.auth.fcmToken,
  fcmRegistered: state.auth.fcmTokenRegistered,
});

export const selectCanReceiveNotifications = (state) =>
  state.auth.isAuthenticated &&
  state.auth.fcmToken &&
  state.auth.fcmTokenRegistered;

export const selectAuthStatus = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isLoading: state.auth.isLoading,
  hasError: !!state.auth.error,
  error: state.auth.error,
  lastLoginTime: state.auth.lastLoginTime,
});
