// App.js - Enhanced notification setup with proper token management
import React, { useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
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
  setExpoPushToken,
} from "./src/redux/slices/authSlice";
import { SignalRProvider } from "./src/contexts/SignalRContext";
import notificationService from "./src/services/notificationService";
import { useNotificationToken } from "./src/hooks/useNotificationToken";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

// Simple notification hook wrapper component
const NotificationManager = () => {
  useNotificationToken(); // This handles FCM token registration
  return null;
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

        // Initialize notification service (get initial tokens)
        const tokens = await notificationService.initialize();
        if (tokens?.fcmToken) {
          console.log(
            "📱 FCM token obtained:",
            tokens.fcmToken.substring(0, 20) + "..."
          );
        }
        if (tokens?.expoToken) {
          console.log(
            "📱 Expo token obtained:",
            tokens.expoToken.substring(0, 20) + "..."
          );
          store.dispatch(setExpoPushToken(tokens.expoToken));
        }
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
              <SignalRProvider>
                <NotificationManager />
                <AppNavigator />
              </SignalRProvider>
            </KeyboardProvider>
          </View>
        </SafeAreaProvider>
        {__DEV__ && <ReduxTester />}
      </PersistGate>
    </Provider>
  );
};

export default App;
