import * as Device from "expo-device";
import { Platform } from "react-native";
import messaging, { firebase } from "@react-native-firebase/messaging";
import customNotificationService from "./customNotificationService";

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
      return null;
    }
  }

  async getFCMToken() {
    try {
      // Check if device is physical device (required for FCM)
      if (!Device.isDevice) {
        return null;
      }

      // Register device for remote messages first
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }

      // Request permission for iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === firebase.messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === firebase.messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return null;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();

      return fcmToken;
    } catch (error) {
      return null;
    }
  }

  setupNotificationListeners() {
    // Handle foreground messages
    this.notificationListener = messaging().onMessage(async (remoteMessage) => {
      // Handle foreground notification here
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened app from background/quit state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      this.handleNotificationResponse(remoteMessage);
    });

    // Check if app was opened from a notification (when app was quit)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          this.handleNotificationResponse(remoteMessage);
        }
      });
  }

  handleForegroundMessage(remoteMessage) {
    // Handle foreground message display

    const { notification, data } = remoteMessage;

    if (notification) {
      const messageId = data?.messageId || data?.id || `firebase-${Date.now()}`;


      // Show in-app custom notification with Firebase source
      customNotificationService.showFirebaseNotification({
        title: notification.title,
        body: notification.body,
        data: {
          ...data,
          messageId,
          profileImage: data?.senderImage || data?.profileImage,
          isOnline: data?.isOnline || false,
        },
      });
    }
  }

  handleNotificationResponse(remoteMessage) {
    const data = remoteMessage.data;
    this.handleNotificationTap(data);
  }

  handleNotificationTap(data) {
    // Handle different notification types
    switch (data?.type) {
      case "new_message":
        // Navigate to chat detail screen
        this.navigateToChat(data.chatId);
        break;
      case "chat_message":
        // Legacy support for old notification type
        this.navigateToChat(data.chatId);
        break;
      case "new_offer":
        // Navigate to offers screen
        this.navigateToOffers();
        break;
      case "offer_response":
        // Navigate to specific offer
        this.navigateToOffers();
        break;
      default:
    }
  }

  // Navigation methods - these will be set from the navigation context
  setNavigationRef(navigationRef) {
    this.navigationRef = navigationRef;
  }

  navigateToChat(data) {
    // Handle both old format (just chatId) and new format (full data object)
    const chatId = typeof data === 'string' ? data : data?.chatId;
    const senderId = data?.senderId || chatId;
    const senderName = data?.senderName || "Chat";
    
    if (this.navigationRef && senderId) {
      // Direct navigation to ChatDetail in RootStack
      // Use senderId as partnerId (the actual user ID)
      this.navigationRef.navigate("ChatDetail", { 
        partnerId: senderId,
        partnerName: senderName,
        fromNotification: true
      });
    }
  }

  navigateToOffers() {
    if (this.navigationRef) {
      this.navigationRef.navigate("Offers");
    }
  }

  scheduleLocalNotification(title, body, data = {}) {
    // This method is called when app is in background
    // For foreground notifications, we use Toast in SignalR context

    // If app is in foreground, show custom notification instead
    if (data.type === "chat_message") {
      customNotificationService.showChatMessage({
        senderName: title,
        messageContent: body,
        senderImage: data?.profileImage,
        chatId: data?.chatId,
        messageId: data?.messageId,
        isOnline: data?.isOnline || false,
      });
    }
  }

  async registerTokenWithServer(registerTokenMutation) {
    try {
      if (!this.fcmToken) {
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


      const result = await registerTokenMutation(tokenData).unwrap();
      return { success: true, data: result };
    } catch (error) {
      // Handle specific error cases
      if (error.status === 404) {
        // Store token locally for future use when endpoints are implemented
        return {
          success: false,
          error: "Notification endpoints not available",
          skipLogging: true,
        };
      } else if (error.status >= 500) {
      } else {
      }
      return { success: false, error: error.message || "Registration failed" };
    }
  }

  async unregisterTokenWithServer(unregisterTokenMutation) {
    try {
      if (!this.fcmToken) {
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


      const result = await unregisterTokenMutation(tokenData).unwrap();
      return { success: true, data: result };
    } catch (error) {
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
