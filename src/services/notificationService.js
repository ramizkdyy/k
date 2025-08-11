import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import messaging from '@react-native-firebase/messaging';

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.fcmToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Register for push notifications (Expo)
      const expoToken = await this.registerForPushNotificationsAsync();
      this.expoPushToken = expoToken;

      // Get FCM token
      const fcmToken = await this.getFCMToken();
      this.fcmToken = fcmToken;

      // Set up notification listeners
      this.setupNotificationListeners();

      return {
        fcmToken,
        expoToken
      };
    } catch (error) {
      console.error("Notification service initialization failed:", error);
      return null;
    }
  }

  async getFCMToken() {
    try {
      // Request permission for iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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

  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      try {
        const projectId = "ec7b8e3c-31c0-470c-8664-583719f38588"; // Your Expo project ID from app.json
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Expo Push Token:", token);
      } catch (e) {
        console.error("Error getting Expo push token:", e);
        return null;
      }
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  }

  setupNotificationListeners() {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        // Handle foreground notification here
      }
    );

    // Listener for when user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        this.handleNotificationResponse(response);
      });
  }

  handleNotificationResponse(response) {
    const { notification } = response;
    const data = notification.request.content.data;

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

  async scheduleLocalNotification(title, body, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: { seconds: 1 },
      });
      return notificationId;
    } catch (error) {
      console.error("Error scheduling local notification:", error);
      return null;
    }
  }

  async sendPushNotification(expoPushToken, title, body, data = {}) {
    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log("Push notification sent:", result);
      return result;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return null;
    }
  }

  // Chat-specific notification methods
  async sendChatNotification(recipientToken, senderName, message, chatId) {
    return this.sendPushNotification(
      recipientToken,
      `${senderName} size mesaj gönderdi`,
      message,
      {
        type: "chat_message",
        chatId,
        senderName,
      }
    );
  }

  async sendOfferNotification(
    recipientToken,
    offerType,
    propertyTitle,
    offerId
  ) {
    const title =
      offerType === "new_offer"
        ? "Yeni Teklif Aldınız!"
        : "Teklifinize Yanıt Var!";

    const body =
      offerType === "new_offer"
        ? `${propertyTitle} ilanınız için yeni bir teklif aldınız`
        : `${propertyTitle} için verdiğiniz teklife yanıt geldi`;

    return this.sendPushNotification(recipientToken, title, body, {
      type: offerType,
      offerId,
      propertyTitle,
    });
  }

  async registerTokenWithServer(registerTokenMutation) {
    try {
      if (!this.fcmToken) {
        console.log("❌ No FCM token available for registration");
        return { success: false, error: "No FCM token available" };
      }

      const tokenData = {
        token: this.fcmToken,
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"
      };

      console.log("📝 Registering FCM token with backend:", {
        platform: tokenData.platform,
        token: tokenData.token.substring(0, 20) + "..."
      });

      const result = await registerTokenMutation(tokenData).unwrap();
      console.log("✅ FCM token registered successfully:", result);
      return { success: true, data: result };
    } catch (error) {
      // Handle specific error cases
      if (error.status === 404) {
        console.warn("⚠️ Notification endpoints not implemented on server - FCM token registration skipped");
        // Store token locally for future use when endpoints are implemented
        return { success: false, error: "Notification endpoints not available", skipLogging: true };
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
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"
      };

      console.log("🗑️ Unregistering FCM token from backend:", {
        platform: tokenData.platform,
        token: tokenData.token.substring(0, 20) + "..."
      });

      const result = await unregisterTokenMutation(tokenData).unwrap();
      console.log("✅ FCM token unregistered successfully:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to unregister FCM token:", error);
      return { success: false, error: error.message || "Unregistration failed" };
    }
  }

  getFCMTokenValue() {
    return this.fcmToken;
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  getPlatform() {
    return Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new NotificationService();
