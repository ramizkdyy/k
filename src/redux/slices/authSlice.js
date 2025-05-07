// src/redux/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

// Ensure initial state is fully defined to prevent errors
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null, // 'tenant' or 'landlord' or null
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      // Eğer kullanıcının rolü varsa bu alanı güncelle
      // API'den gelen kullanıcı verisinde role değeri olup olmadığını kontrol et
      state.role = user?.role || null;

      state.error = null;

      console.log("setCredentials çalıştı:", { user, token, role: state.role });
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
    },
    setRole: (state, action) => {
      state.role = action.payload;
      if (state.user) {
        state.user.role = action.payload;
      }
      console.log("setRole çalıştı:", { newRole: action.payload });
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Added for testing - will be removed in production
    setTestCredentials: (state) => {
      // Set dummy credentials for testing only
      state.user = { id: "test-id", name: "Test User", role: "tenant" };
      state.token = "test-token";
      state.isAuthenticated = true;
      state.role = "tenant";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle login response
    builder.addMatcher(
      apiSlice.endpoints.login?.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.result) {
          state.user = payload.result.user;
          state.token = payload.result.token;
          state.isAuthenticated = true;
          state.role = payload.result.user?.role || null;
          state.error = null;

          console.log("Login API yanıtı:", payload);
          console.log("Kullanıcı rolü:", payload.result.user?.role);
        }
      }
    );

    // Handle login error
    builder.addMatcher(
      apiSlice.endpoints.login?.matchRejected,
      (state, { payload }) => {
        state.error = payload?.message || "Login failed";
        state.isAuthenticated = false;
      }
    );

    // Handle registration response
    builder.addMatcher(
      apiSlice.endpoints.register?.matchFulfilled,
      (state, { payload }) => {
        console.log("Register API yanıtı:", payload);
        if (payload && payload.result) {
          state.user = payload.result.user;
          state.token = payload.result.token;
          state.isAuthenticated = true;
          state.role = payload.result.user?.role || null;
          state.error = null;

          console.log(
            "Kayıt sonrası kullanıcı rolü:",
            payload.result.user?.role
          );
        }
      }
    );

    // Handle registration error
    builder.addMatcher(
      apiSlice.endpoints.register?.matchRejected,
      (state, { payload }) => {
        state.error = payload?.message || "Registration failed";
      }
    );

    // Handle role assignment
    builder.addMatcher(
      apiSlice.endpoints.assignRole?.matchFulfilled,
      (state, { payload }) => {
        console.log("AssignRole API yanıtı:", payload);
        if (payload && payload.result && state.user) {
          state.role = payload.result.role;
          state.user.role = payload.result.role;

          console.log("Rol atama sonrası:", { role: state.role });
        }
      }
    );
  },
});

export const {
  setCredentials,
  logout,
  setRole,
  setError,
  clearError,
  setTestCredentials, // Include test function
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.role;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;
