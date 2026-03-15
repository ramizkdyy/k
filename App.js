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

        const tokens = await notificationService.initialize();

        if (tokens?.fcmToken) {
          currentFcmTokenRef.current = tokens.fcmToken;
          dispatch(setFcmToken(tokens.fcmToken));
        }
      } catch (error) {
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

      // User just logged in
      if (!wasAuthenticated && isNowAuthenticated) {
        await registerFcmToken();
      }
      // User just logged out
      else if (wasAuthenticated && !isNowAuthenticated) {
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
        return;
      }

      if (tokenRegisteredRef.current) {
        return;
      }


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
    } catch (error) {
      if (error.status === 404) {
      } else {
      }
    }
  };

  const unregisterFcmToken = async () => {
    try {
      if (!tokenRegisteredRef.current) {
        return;
      }

      if (!currentFcmTokenRef.current) {
        tokenRegisteredRef.current = false;
        dispatch(setFcmTokenRegistered(false));
        return;
      }


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
    } catch (error) {
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
    }
  }, [isAuthenticated]);

  return null;
};

// Asset loading function
const loadResourcesAsync = async () => {
  try {
    // Add any asset loading logic here
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulated loading
  } catch (error) {
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

      } catch (e) {

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
