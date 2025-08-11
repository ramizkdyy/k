// hooks/useNotificationToken.js - Enhanced version with better state management
import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useRegisterNotificationTokenMutation,
  useUnregisterNotificationTokenMutation,
} from "../redux/api/chatApiSlice";
import {
  selectIsAuthenticated,
  selectAuthToken,
  selectCurrentUser,
  selectFcmToken,
  selectFcmTokenRegistered,
  setFcmToken,
  setFcmTokenRegistered,
  setExpoPushToken,
} from "../redux/slices/authSlice";
import notificationService from "../services/notificationService";
import { Platform } from "react-native";

export const useNotificationToken = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authToken = useSelector(selectAuthToken);
  const currentUser = useSelector(selectCurrentUser);
  const fcmToken = useSelector(selectFcmToken);
  const fcmTokenRegistered = useSelector(selectFcmTokenRegistered);

  // API hooks
  const [registerToken] = useRegisterNotificationTokenMutation();
  const [unregisterToken] = useUnregisterNotificationTokenMutation();

  // Refs to track previous states
  const previousAuthStateRef = useRef(null);
  const previousUserIdRef = useRef(null);
  const initializationAttemptedRef = useRef(false);

  // Initialize FCM token on mount
  useEffect(() => {
    const initializeFcmToken = async () => {
      if (initializationAttemptedRef.current) return;

      try {
        initializationAttemptedRef.current = true;
        console.log("🚀 Initializing FCM token in hook...");

        const tokens = await notificationService.initialize();

        if (tokens?.fcmToken) {
          dispatch(setFcmToken(tokens.fcmToken));
          console.log(
            "🔥 FCM token initialized in hook:",
            tokens.fcmToken.substring(0, 20) + "..."
          );
        }

        if (tokens?.expoToken) {
          dispatch(setExpoPushToken(tokens.expoToken));
          console.log(
            "📱 Expo token initialized in hook:",
            tokens.expoToken.substring(0, 20) + "..."
          );
        }
      } catch (error) {
        console.error("❌ Failed to initialize FCM token in hook:", error);
      }
    };

    initializeFcmToken();
  }, [dispatch]);

  // Register token function
  const registerFcmToken = useCallback(async () => {
    if (!isAuthenticated || !authToken) {
      console.log("❌ Cannot register: user not authenticated");
      return { success: false, error: "User not authenticated" };
    }

    if (!fcmToken) {
      console.log("❌ Cannot register: no FCM token available");
      return { success: false, error: "No FCM token available" };
    }

    if (fcmTokenRegistered) {
      console.log("⚠️ Token already registered, skipping");
      return { success: true, alreadyRegistered: true };
    }

    try {
      console.log("📝 Registering FCM token via hook...");

      const tokenData = {
        token: fcmToken,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
            ? "android"
            : "web",
      };

      const result = await registerToken(tokenData).unwrap();

      dispatch(setFcmTokenRegistered(true));
      console.log("✅ FCM token registered successfully via hook");

      return { success: true, data: result };
    } catch (error) {
      if (error.status === 404) {
        console.warn(
          "⚠️ Notification endpoints not available - skipping registration"
        );
        return {
          success: false,
          error: "Endpoints not available",
          skipLogging: true,
        };
      }

      console.error("❌ Failed to register FCM token via hook:", error);
      return { success: false, error: error.message || "Registration failed" };
    }
  }, [
    isAuthenticated,
    authToken,
    fcmToken,
    fcmTokenRegistered,
    registerToken,
    dispatch,
  ]);

  // Unregister token function
  const unregisterFcmToken = useCallback(async () => {
    if (!fcmToken) {
      console.log("⚠️ No FCM token available for unregistration");
      return { success: true, noToken: true };
    }

    if (!fcmTokenRegistered) {
      console.log("⚠️ No token registered, skipping unregistration");
      return { success: true, notRegistered: true };
    }

    try {
      console.log("🗑️ Unregistering FCM token via hook...");

      const tokenData = {
        token: fcmToken,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
            ? "android"
            : "web",
      };

      const result = await unregisterToken(tokenData).unwrap();

      dispatch(setFcmTokenRegistered(false));
      console.log("✅ FCM token unregistered successfully via hook");

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to unregister FCM token via hook:", error);

      // Still mark as unregistered locally even if API call fails
      dispatch(setFcmTokenRegistered(false));

      return {
        success: false,
        error: error.message || "Unregistration failed",
      };
    }
  }, [fcmToken, fcmTokenRegistered, unregisterToken, dispatch]);

  // Handle authentication changes
  useEffect(() => {
    const currentAuthState = isAuthenticated && !!authToken;
    const previousAuthState = previousAuthStateRef.current;
    const currentUserId = currentUser?.id;
    const previousUserId = previousUserIdRef.current;

    // Skip first run
    if (previousAuthStateRef.current === null) {
      previousAuthStateRef.current = currentAuthState;
      previousUserIdRef.current = currentUserId;
      return;
    }

    // Detect state changes
    const userLoggedIn = !previousAuthState && currentAuthState;
    const userLoggedOut = previousAuthState && !currentAuthState;
    const userSwitched =
      currentAuthState &&
      previousAuthState &&
      currentUserId &&
      previousUserId &&
      currentUserId !== previousUserId;

    console.log("🔄 Auth state change detected in hook:", {
      userLoggedIn,
      userLoggedOut,
      userSwitched,
      currentUserId,
      previousUserId,
      fcmTokenRegistered,
    });

    // Handle different scenarios
    if (userLoggedIn) {
      console.log("🚪 User logged in - registering FCM token via hook");
      registerFcmToken();
    } else if (userLoggedOut) {
      console.log("🚪 User logged out - unregistering FCM token via hook");
      unregisterFcmToken();
    } else if (userSwitched) {
      console.log("🔄 User switched - re-registering FCM token via hook");
      // First unregister old token, then register for new user
      unregisterFcmToken().then(() => {
        registerFcmToken();
      });
    }

    // Update refs
    previousAuthStateRef.current = currentAuthState;
    previousUserIdRef.current = currentUserId;
  }, [
    isAuthenticated,
    authToken,
    currentUser?.id,
    registerFcmToken,
    unregisterFcmToken,
    fcmTokenRegistered,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only unregister if still authenticated (prevents unregistering on normal unmounts)
      if (fcmTokenRegistered && !isAuthenticated) {
        console.log(
          "🧹 Hook unmounting with logged out user - unregistering token"
        );
        unregisterFcmToken();
      }
    };
  }, [isAuthenticated, fcmTokenRegistered, unregisterFcmToken]);

  // Get live token values
  const getLiveTokens = useCallback(() => {
    return {
      fcmToken: fcmToken || notificationService.getFCMTokenValue(),
      expoToken: notificationService.getExpoPushToken(),
      platform:
        Platform.OS === "ios"
          ? "ios"
          : Platform.OS === "android"
          ? "android"
          : "web",
    };
  }, [fcmToken]);

  return {
    // Token values
    fcmToken: fcmToken || notificationService.getFCMTokenValue(),
    expoToken: notificationService.getExpoPushToken(),
    platform:
      Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
        ? "android"
        : "web",

    // Registration status
    isRegistered: fcmTokenRegistered,

    // Functions
    manualRegister: registerFcmToken,
    manualUnregister: unregisterFcmToken,
    getLiveTokens,

    // Status
    isAuthenticated,
    hasToken: !!fcmToken,
  };
};
