import * as Device from "expo-device";
import { Platform } from "react-native";
import messaging, { firebase } from "@react-native-firebase/messaging";

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Get FCM token
      const fcmToken = await this.getFCMToken();
      this.fcmToken = fcmToken;

      // Set up notification listeners
      this.setupNotificationListeners();

      return {
        fcmToken,
      };
    } catch (error) {
      console.error("Notification service initialization failed:", error);
      return null;
    }
  }

  async getFCMToken() {
    try {
      // Check if device is physical device (required for FCM)
      if (!Device.isDevice) {
        console.log("FCM requires physical device");
        return null;
      }

      // Register device for remote messages first
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
        console.log("Device registered for remote messages");
      }

      // Request permission for iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === firebase.messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === firebase.messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log("FCM permission not granted");
        return null;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      console.log("FCM Token:", fcmToken);

      return fcmToken;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }


  setupNotificationListeners() {
    // Handle foreground messages
    this.notificationListener = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM Message received in foreground:', remoteMessage);
      // Handle foreground notification here
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened app from background/quit state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('FCM Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationResponse(remoteMessage);
    });

    // Check if app was opened from a notification (when app was quit)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('FCM Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationResponse(remoteMessage);
        }
      });
  }

  handleForegroundMessage(remoteMessage) {
    // Handle foreground message display
    console.log('Handling foreground message:', remoteMessage.notification?.title);
    // You can show custom in-app notification here
  }

  handleNotificationResponse(remoteMessage) {
    const data = remoteMessage.data;

    // Handle different notification types
    switch (data?.type) {
      case "chat_message":
        // Navigate to chat detail screen
        // You can use navigation service or Redux action here
        console.log("Navigate to chat:", data.chatId);
        break;
      case "new_offer":
        // Navigate to offers screen
        console.log("Navigate to offers");
        break;
      case "offer_response":
        // Navigate to specific offer
        console.log("Navigate to offer:", data.offerId);
        break;
      default:
        console.log("Unknown notification type:", data?.type);
    }
  }




  async registerTokenWithServer(registerTokenMutation) {
    try {
      if (!this.fcmToken) {
        console.log("❌ No FCM token available for registration");
        return { success: false, error: "No FCM token available" };
      }

      const tokenData = {
        token: this.fcmToken,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
            ? "android"
            : "web",
      };

      console.log("📝 Registering FCM token with backend:", {
        platform: tokenData.platform,
        token: tokenData.token.substring(0, 20) + "...",
      });

      const result = await registerTokenMutation(tokenData).unwrap();
      console.log("✅ FCM token registered successfully:", result);
      return { success: true, data: result };
    } catch (error) {
      // Handle specific error cases
      if (error.status === 404) {
        console.warn(
          "⚠️ Notification endpoints not implemented on server - FCM token registration skipped"
        );
        // Store token locally for future use when endpoints are implemented
        return {
          success: false,
          error: "Notification endpoints not available",
          skipLogging: true,
        };
      } else if (error.status >= 500) {
        console.error("❌ Server error during FCM token registration:", error);
      } else {
        console.error("❌ Failed to register FCM token:", error);
      }
      return { success: false, error: error.message || "Registration failed" };
    }
  }

  async unregisterTokenWithServer(unregisterTokenMutation) {
    try {
      if (!this.fcmToken) {
        console.log("❌ No FCM token available for unregistration");
        return { success: false, error: "No FCM token available" };
      }

      const tokenData = {
        token: this.fcmToken,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
            ? "android"
            : "web",
      };

      console.log("🗑️ Unregistering FCM token from backend:", {
        platform: tokenData.platform,
        token: tokenData.token.substring(0, 20) + "...",
      });

      const result = await unregisterTokenMutation(tokenData).unwrap();
      console.log("✅ FCM token unregistered successfully:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to unregister FCM token:", error);
      return {
        success: false,
        error: error.message || "Unregistration failed",
      };
    }
  }

  getFCMTokenValue() {
    return this.fcmToken;
  }


  getPlatform() {
    return Platform.OS === "ios"
      ? "ios"
      : Platform.OS === "android"
      ? "android"
      : "web";
  }

  cleanup() {
    if (this.notificationListener) {
      this.notificationListener();
    }
  }
}

export default new NotificationService();
