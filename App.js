// App.js - Enhanced notification setup with proper token management
import React, { useEffect, useState, useRef } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import {
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { store, persistor } from "./src/redux/store";
import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthToken,
  setFcmToken,
  setFcmTokenRegistered,
} from "./src/redux/slices/authSlice";
import { SignalRProvider } from "./src/contexts/SignalRContext";
import notificationService from "./src/services/notificationService";
import {
  useRegisterNotificationTokenMutation,
  useUnregisterNotificationTokenMutation,
} from "./src/redux/api/chatApiSlice";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// 🎯 BottomSheetModalProvider import
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import NotificationContainer from "./src/components/NotificationContainer";

// Loading component for PersistGate
const LoadingScreen = () => (
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: "#000000",
    }}
    edges={["top", "bottom", "left", "right"]}
  >
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <ActivityIndicator size="large" color="#86efac" />
      <Text style={{ marginTop: 10, fontSize: 16, color: "#666" }}>
        Yükleniyor...
      </Text>
    </View>
  </SafeAreaView>
);

// ✅ Enhanced NotificationManager component
const NotificationManager = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const authToken = useSelector(selectAuthToken);

  const [registerToken] = useRegisterNotificationTokenMutation();
  const [unregisterToken] = useUnregisterNotificationTokenMutation();

  // Refs to track states
  const previousAuthStateRef = useRef(false);
  const tokenRegisteredRef = useRef(false);
  const currentFcmTokenRef = useRef(null);
  const previousUserIdRef = useRef(null);

  // Initialize notifications on app startup
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log("📱 Initializing notification service...");
        const tokens = await notificationService.initialize();

        if (tokens?.fcmToken) {
          currentFcmTokenRef.current = tokens.fcmToken;
          dispatch(setFcmToken(tokens.fcmToken));
          console.log(
            "✅ FCM token initialized:",
            tokens.fcmToken.substring(0, 20) + "..."
          );
        }
      } catch (error) {
        console.error("❌ Failed to initialize notification service:", error);
      }
    };

    initializeNotifications();
  }, [dispatch]);

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async () => {
      const wasAuthenticated = previousAuthStateRef.current;
      const isNowAuthenticated =
        isAuthenticated && authToken && currentUser?.id;
      const previousUserId = previousUserIdRef.current;
      const currentUserId = currentUser?.id;

      console.log("🔄 Auth state changed:", {
        wasAuthenticated,
        isNowAuthenticated,
        tokenRegistered: tokenRegisteredRef.current,
        hasUser: !!currentUserId,
        hasToken: !!authToken,
        userChanged: previousUserId !== currentUserId,
      });

      // User just logged in
      if (!wasAuthenticated && isNowAuthenticated) {
        console.log("🚪 User logged in - registering FCM token");
        await registerFcmToken();
      }
      // User just logged out
      else if (wasAuthenticated && !isNowAuthenticated) {
        console.log("🚪 User logged out - unregistering FCM token");
        await unregisterFcmToken();
      }
      // User switched (different user ID)
      else if (
        wasAuthenticated &&
        isNowAuthenticated &&
        previousUserId &&
        currentUserId &&
        previousUserId !== currentUserId
      ) {
        console.log("🔄 User switched - re-registering FCM token");
        await unregisterFcmToken();
        await registerFcmToken();
      }

      // Update references
      previousAuthStateRef.current = isNowAuthenticated;
      previousUserIdRef.current = currentUserId;
    };

    handleAuthStateChange();
  }, [isAuthenticated, authToken, currentUser?.id]);

  const registerFcmToken = async () => {
    try {
      if (!currentFcmTokenRef.current) {
        console.log("⚠️ No FCM token available for registration");
        return;
      }

      if (tokenRegisteredRef.current) {
        console.log("⚠️ FCM token already registered, skipping");
        return;
      }

      console.log("📝 Registering FCM token with backend...");

      const tokenData = {
        token: currentFcmTokenRef.current,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
            ? "android"
            : "web",
      };

      const result = await registerToken(tokenData).unwrap();

      tokenRegisteredRef.current = true;
      dispatch(setFcmTokenRegistered(true));
      console.log("✅ FCM token registered successfully");
    } catch (error) {
      if (error.status === 404) {
        console.warn(
          "⚠️ Notification endpoints not implemented on server - skipping"
        );
      } else {
        console.error("❌ Failed to register FCM token:", error);
      }
    }
  };

  const unregisterFcmToken = async () => {
    try {
      if (!tokenRegisteredRef.current) {
        console.log("⚠️ No token registered, skipping unregistration");
        return;
      }

      if (!currentFcmTokenRef.current) {
        console.log("⚠️ No FCM token available for unregistration");
        tokenRegisteredRef.current = false;
        dispatch(setFcmTokenRegistered(false));
        return;
      }

      console.log("🗑️ Unregistering FCM token from backend...");

      const tokenData = {
        token: currentFcmTokenRef.current,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
            ? "android"
            : "web",
      };

      const result = await unregisterToken(tokenData).unwrap();

      tokenRegisteredRef.current = false;
      dispatch(setFcmTokenRegistered(false));
      console.log("✅ FCM token unregistered successfully");
    } catch (error) {
      console.error("❌ Failed to unregister FCM token:", error);
      // Still mark as unregistered locally
      tokenRegisteredRef.current = false;
      dispatch(setFcmTokenRegistered(false));
    }
  };

  return null; // This component doesn't render anything
};

// Component to test Redux state
const ReduxTester = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (__DEV__) {
      console.log("Auth State:", isAuthenticated);
    }
  }, [isAuthenticated]);

  return null;
};

// Asset loading function
const loadResourcesAsync = async () => {
  try {
    // Add any asset loading logic here
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulated loading
    console.log("✅ Assets loaded successfully");
  } catch (error) {
    console.error("❌ Error loading assets:", error);
    throw error;
  }
};

// Root component with Redux setup
const App = () => {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load all assets (icons, fonts, etc.)
        await loadResourcesAsync();

        console.log("🚀 App initialization completed");
      } catch (e) {
        console.warn("⚠️ App initialization failed:", e);

        // Show user-friendly error for critical failures
        Alert.alert(
          "Başlatma Hatası",
          "Uygulama başlatılırken bir hata oluştu. Lütfen uygulamayı yeniden başlatın.",
          [{ text: "Tamam" }]
        );
      } finally {
        setLoadingComplete(true);
      }
    }

    loadResourcesAndDataAsync();

    // Cleanup function
    return () => {
      console.log("🧹 App cleanup");
      notificationService.cleanup();
    };
  }, []);

  if (!isLoadingComplete) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
              <View style={{ flex: 1, backgroundColor: "transparent" }}>
                <StatusBar
                  barStyle="light-content"
                  backgroundColor="transparent"
                  translucent={true}
                />

                <KeyboardProvider
                  statusBarTranslucent={true}
                  navigationBarTranslucent={false}
                >
                  <NotificationProvider>
                    <SignalRProvider>
                      <NotificationManager />
                      <AppNavigator />
                    </SignalRProvider>
                    <NotificationContainer />
                  </NotificationProvider>
                </KeyboardProvider>
              </View>
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
        {__DEV__ && <ReduxTester />}
      </PersistGate>
    </Provider>
  );
};

export default App;
