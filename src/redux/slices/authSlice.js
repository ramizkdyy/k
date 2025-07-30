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
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ENHANCED: Better user switching detection and cleanup in setCredentials
    setCredentials: (state, action) => {
      const { user, token, hasUserProfile } = action.payload;
      const previousUserId = state.user?.id;
      const currentUserId = user?.id;
      
      // Detect user switch
      const isUserSwitch = previousUserId && currentUserId && previousUserId !== currentUserId;
      
      if (isUserSwitch) {
        console.log("🔄 USER SWITCH in setCredentials:", {
          previousUserId,
          currentUserId,
          clearingPreviousData: true
        });
        
        // Clear previous user's data completely for user switch
        Object.assign(state, initialState);
      }
      
      // Set new credentials
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.hasUserProfile = hasUserProfile || false;

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

    // ENHANCED: More thorough logout with detailed logging and async storage cleanup
    logout: (state) => {
      console.log("🚪 Logout initiated for user:", state.user?.id);
      
      // Store previous user info for logging
      const previousUserId = state.user?.id;
      const previousRole = state.role;
      
      // Reset to initial state completely
      Object.assign(state, initialState);
      
      console.log("🧹 Logout completed - all auth state cleared:", {
        previousUserId,
        previousRole,
        stateReset: true
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
      
      console.log("🔥 FORCE LOGOUT completed:", {
        previousUserId,
        allDataCleared: true
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
      }
    );
  },
});

export const {
  setCredentials,
  logout,
  forceLogout, // NEW
  setRole,
  setError,
  clearError,
  setHasUserProfile,
  updateUserData,
  syncUserDataFromProfile,
  syncExpectationStatus,
  clearUserData, // NEW
} = authSlice.actions;

export default authSlice.reducer;

// Selectors with better null checking
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentUserId = (state) => state.auth.user?.id;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.userRole || state.auth.role;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;
export const selectHasUserProfile = (state) => state.auth.hasUserProfile;
