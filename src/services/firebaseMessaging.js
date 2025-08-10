// Firebase Messaging Setup
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

class FirebaseMessagingService {
  constructor() {
    this.fcmToken = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Request permissions
      await this.requestPermissions();
      
      // Get FCM token
      this.fcmToken = await this.getFCMToken();
      
      // Set up message handlers
      this.setupMessageHandlers();
      
      this.initialized = true;
      console.log('✅ Firebase Messaging initialized successfully');
      return { success: true, fcmToken: this.fcmToken };
    } catch (error) {
      console.error('❌ Firebase Messaging initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async requestPermissions() {
    // iOS permissions
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (!enabled) {
        throw new Error('Firebase messaging permission not granted on iOS');
      }
    }

    // Android permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Notification permissions not granted on Android');
    }
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('🔥 FCM Token obtained:', token);
      
      // Token'ın geçerli olup olmadığını kontrol et
      if (!token || token.length < 100) {
        throw new Error('Invalid FCM token received');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      throw error;
    }
  }

  setupMessageHandlers() {
    // Foreground message handler
    messaging().onMessage(async remoteMessage => {
      console.log('📱 FCM foreground message received:', remoteMessage);
      
      // Show local notification for foreground messages
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            data: remoteMessage.data || {},
          },
          trigger: { seconds: 1 },
        });
      }
    });

    // Background message handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📱 FCM background message received:', remoteMessage);
      // Background message'lar otomatik olarak sistem tray'inde görünür
    });

    // App opened from notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('🚀 App opened from FCM notification:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    });

    // App opened from quit state
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('🚀 App opened from quit state by FCM notification:', remoteMessage);
        this.handleNotificationNavigation(remoteMessage);
      }
    });

    // Token refresh listener
    messaging().onTokenRefresh(token => {
      console.log('🔄 FCM Token refreshed:', token);
      this.fcmToken = token;
      // Yeni token'ı backend'e gönder
      this.onTokenRefresh?.(token);
    });
  }

  handleNotificationNavigation(remoteMessage) {
    const data = remoteMessage.data;
    
    // Navigation logic based on notification data
    switch (data?.type) {
      case 'chat_message':
        console.log('Navigate to chat:', data.chatId);
        break;
      case 'new_offer':
        console.log('Navigate to offers');
        break;
      case 'offer_response':
        console.log('Navigate to offer:', data.offerId);
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  }

  async showTokenForTesting() {
    if (!this.fcmToken) {
      await this.initialize();
    }

    if (this.fcmToken) {
      console.log('=================================');
      console.log('🔥 CURRENT FCM TOKEN FOR TESTING:');
      console.log('=================================');
      console.log(this.fcmToken);
      console.log('=================================');
      
      Alert.alert(
        'FCM Token',
        `Token console'da yazdırıldı.\n\nFirebase konsolundan test mesajı gönderebilirsin!`,
        [
          {
            text: 'Copy Token',
            onPress: () => {
              // Token'ı kopyala
              import('expo-clipboard').then(Clipboard => {
                Clipboard.setStringAsync(this.fcmToken);
              });
            }
          },
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('Error', 'FCM token not available');
    }
  }

  getToken() {
    return this.fcmToken;
  }

  // Token refresh callback setter
  setOnTokenRefresh(callback) {
    this.onTokenRefresh = callback;
  }
}

export default new FirebaseMessagingService();