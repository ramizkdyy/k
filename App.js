// App.js - Safe Area kontrolü ile
import React, { useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import {
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { store, persistor } from "./src/redux/store";
import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";
import { selectIsAuthenticated } from "./src/redux/slices/authSlice";

// KeyboardProvider import
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";

// Loading component for PersistGate
const LoadingScreen = () => (
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: "#000000", // Safe area'ları da siyah yap
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

// Root component with Redux setup
const App = () => {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load all assets (icons, fonts, etc.)
        await loadResourcesAsync();
      } catch (e) {
        console.warn("Asset loading failed:", e);
      } finally {
        setLoadingComplete(true);
      }
    }

    loadResourcesAndDataAsync();

    if (__DEV__) {
      console.log("App component mounted");
      console.log("FontAwesome setup loaded");
    }
  }, []);

  if (!isLoadingComplete) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          {/* ✅ YÖNTEM 1: Ana wrapper'da safe area'ları tamamen kaldır */}
          <View style={{ flex: 1, backgroundColor: "transparent" }}>
            {/* ✅ Status bar konfigürasyonu */}
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent={true}
            />

            <KeyboardProvider
              statusBarTranslucent={true}
              navigationBarTranslucent={false}
            >
              <AppNavigator />
            </KeyboardProvider>
          </View>
        </SafeAreaProvider>
        {__DEV__ && <ReduxTester />}
      </PersistGate>
    </Provider>
  );
};

export default App;
