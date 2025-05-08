// src/redux/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

// Ensure initial state is fully defined to prevent errors
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null, // 'tenant' or 'landlord' or null
  userRole: null, // Eklendi: Ana role değişken adını değiştirdim (role -> userRole) AppNavigator ile uyumlu olması için
  hasUserProfile: false, // Eklendi: Profil durumunu izlemek için
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, hasUserProfile } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.hasUserProfile = hasUserProfile || false; // Profil durumu eklendi

      // Eğer kullanıcının rolü varsa bu alanı güncelle
      // API'den gelen kullanıcı verisinde role değeri olup olmadığını kontrol et
      if (user && user.role) {
        state.role = user.role;
        state.userRole = user.role; // userRole alanını da güncelle
      } else if (user && user.user && user.user.role) {
        // Bazı API yanıtlarında nested user objesi gelebilir
        state.role = user.user.role;
        state.userRole = user.user.role; // userRole alanını da güncelle
      }

      state.error = null;

      console.log("setCredentials çalıştı:", {
        user,
        token,
        role: state.role,
        userRole: state.userRole,
        hasUserProfile: state.hasUserProfile,
      });
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.userRole = null;
      state.hasUserProfile = false; // Profil durumunu sıfırla
      state.error = null;
    },
    setRole: (state, action) => {
      state.role = action.payload;
      state.userRole = action.payload; // userRole alanını da güncelle
      if (state.user) {
        state.user.role = action.payload;
      }
      console.log("setRole çalıştı:", { newRole: action.payload });
    },
    setHasUserProfile: (state, action) => {
      // Eklendi: Profil durumunu ayarlamak için
      state.hasUserProfile = action.payload;
      console.log("setHasUserProfile çalıştı:", { hasProfile: action.payload });
    },
    updateUserData: (state, action) => {
      // Eklendi: Kullanıcı bilgilerini güncellemek için
      state.user = {
        ...state.user,
        ...action.payload,
      };
      // Rol güncellemesi varsa onu da yansıt
      if (action.payload.role) {
        state.role = action.payload.role;
        state.userRole = action.payload.role;
      }
      console.log("updateUserData çalıştı:", { updatedUser: state.user });
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
      state.userRole = "tenant"; // userRole eklendi
      state.hasUserProfile = true; // Test için profil var olarak işaretle
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
          state.userRole = payload.result.user?.role || null; // userRole eklendi
          state.hasUserProfile = payload.result.hasUserProfile || false; // Profil durumu eklendi
          state.error = null;

          console.log("Login API yanıtı:", payload);
          console.log("Kullanıcı rolü:", payload.result.user?.role);
          console.log("Profil durumu:", payload.result.hasUserProfile);
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
          state.userRole = payload.result.user?.role || null; // userRole eklendi
          state.hasUserProfile = payload.result.hasUserProfile || false; // Profil durumu eklendi
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
          state.userRole = payload.result.role; // userRole eklendi
          state.user.role = payload.result.role;

          console.log("Rol atama sonrası:", { role: state.role });
        }
      }
    );

    // Yeni bir profile oluşturulduğunda hasUserProfile'ı true yap
    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile?.matchFulfilled,
      (state) => {
        state.hasUserProfile = true;
        console.log("Ev sahibi profili oluşturuldu, profil durumu güncellendi");
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile?.matchFulfilled,
      (state) => {
        state.hasUserProfile = true;
        console.log("Kiracı profili oluşturuldu, profil durumu güncellendi");
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
  setTestCredentials,
  setHasUserProfile, // Yeni eklenen action
  updateUserData, // Yeni eklenen action
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.userRole || state.auth.role; // Her ikisini de kontrol et
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;
export const selectHasUserProfile = (state) => state.auth.hasUserProfile; // Yeni eklenen selector
