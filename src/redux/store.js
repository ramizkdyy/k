// redux/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import postReducer from "./slices/postSlice";
import offerReducer from "./slices/offerSlice";
import profileReducer from "./slices/profileSlice";
import expectationReducer from "./slices/expectationSlice";
import chatReducer from "./slices/chatSlice";
import { apiSlice } from "./api/apiSlice";
import { chatApiSlice } from "./api/chatApiSlice";
import searchReducer from "./slices/searchSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "profiles", "expectations", "search"],
  // Chat verilerini persist etmemek daha iyi - real-time olduğu için
  blacklist: [apiSlice.reducerPath, chatApiSlice.reducerPath],
};

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postReducer,
  offers: offerReducer,
  profiles: profileReducer,
  expectations: expectationReducer,
  search: searchReducer,
  chat: chatReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
  [chatApiSlice.reducerPath]: chatApiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          // RTK Query actions
          "api/executeQuery/pending",
          "api/executeQuery/fulfilled",
          "api/executeQuery/rejected",
          "chatApi/executeQuery/pending",
          "chatApi/executeQuery/fulfilled",
          "chatApi/executeQuery/rejected",
        ],
        ignoredActionsPaths: [
          "meta.arg",
          "payload.timestamp",
          "meta.baseQueryMeta",
        ],
        ignoredPaths: [
          "api.mutations",
          "api.queries",
          "api.subscriptions",
          "chatApi.mutations",
          "chatApi.queries",
          "chatApi.subscriptions",
        ],
      },
    })
      .concat(apiSlice.middleware)
      .concat(chatApiSlice.middleware), // Chat API middleware eklendi
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
