import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import postReducer from "./slices/postSlice";
import offerReducer from "./slices/offerSlice";
import profileReducer from "./slices/profileSlice";
import expectationReducer from "./slices/expectationSlice"; // Yeni eklenen reducer
import { apiSlice } from "./api/apiSlice";

// Initialize empty initial state for development
// This helps prevent errors if selectors are accessed before state is fully loaded
const initialState = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    role: null,
    isLoading: false,
    error: null,
    hasUserProfile: false,
  },
  posts: {
    posts: [],
    currentPost: null,
    userPosts: [],
    isLoading: false,
    error: null,
    postImageUploadStatus: [],
    currentFilters: {
      location: null,
      priceMin: null,
      priceMax: null,
      status: null,
    },
    postFormData: null,
  },
  offers: {
    sentOffers: [],
    receivedOffers: [],
    currentOffer: null,
    isLoading: false,
    error: null,
    offerFormData: null,
  },
  profiles: {
    landlordProfiles: [],
    tenantProfiles: [],
    currentLandlordProfile: null,
    currentTenantProfile: null,
    userProfile: null,
    favoriteProperties: [],
    isLoading: false,
    error: null,
    profileFormData: null,
    profileImageUploadStatus: null,
    coverImageUploadStatus: null,
  },
  expectations: {
    // Yeni eklenen bölüexpectations: { // Yeni eklenen bölüm
    landlordExpectation: null,
    tenantExpectation: null,
    isLoading: false,
    error: null,
    expectationFormData: null,
  },
};

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "profiles", "expectations"], // expectations eklendi, profil beklenti verilerinin de kalıcı olması için
};

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postReducer,
  offers: offerReducer,
  profiles: profileReducer,
  expectations: expectationReducer, // Yeni eklenen reducer
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  preloadedState: initialState, // Initialize with our empty state
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production", // Enable devTools only in development
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
