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

        const tokens = await notificationService.initialize();

        if (tokens?.fcmToken) {
          dispatch(setFcmToken(tokens.fcmToken));
        }
      } catch (error) {
      }
    };

    initializeFcmToken();
  }, [dispatch]);

  // Register token function
  const registerFcmToken = useCallback(async () => {
    if (!isAuthenticated || !authToken) {
      return { success: false, error: "User not authenticated" };
    }

    if (!fcmToken) {
      return { success: false, error: "No FCM token available" };
    }

    if (fcmTokenRegistered) {
      return { success: true, alreadyRegistered: true };
    }

    try {

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

      return { success: true, data: result };
    } catch (error) {
      if (error.status === 404) {
        return {
          success: false,
          error: "Endpoints not available",
          skipLogging: true,
        };
      }

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
      return { success: true, noToken: true };
    }

    if (!fcmTokenRegistered) {
      return { success: true, notRegistered: true };
    }

    try {

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

      return { success: true, data: result };
    } catch (error) {

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


    // Handle different scenarios
    if (userLoggedIn) {
      registerFcmToken();
    } else if (userLoggedOut) {
      unregisterFcmToken();
    } else if (userSwitched) {
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
        unregisterFcmToken();
      }
    };
  }, [isAuthenticated, fcmTokenRegistered, unregisterFcmToken]);

  // Get live token values
  const getLiveTokens = useCallback(() => {
    return {
      fcmToken: fcmToken || notificationService.getFCMTokenValue(),
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
