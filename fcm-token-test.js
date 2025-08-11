// FCM Token Test Script
// Bu scripti çalıştırarak FCM token'ını konsola yazdırabilirsin
// Firebase konsolundan test mesajı göndermek için bu token'ı kullan

import React, { useEffect } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

const FCMTokenTest = () => {
  useEffect(() => {
    async function getFCMTokenForTesting() {
      try {
        // Request permissions
        if (Platform.OS === 'ios') {
          const authStatus = await messaging().requestPermission();
          const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
          if (!enabled) {
            Alert.alert('Permission denied', 'Firebase messaging permission not granted');
            return;
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
          Alert.alert('Permission denied', 'Notification permissions required');
          return;
        }

        // Get FCM token
        const fcmToken = await messaging().getToken();
        
        console.log('=================================');
        console.log('🔥 FCM TOKEN FOR FIREBASE CONSOLE TEST:');
        console.log('=================================');
        console.log(fcmToken);
        console.log('=================================');
        
        Alert.alert(
          'FCM Token Ready', 
          'Token console da yazdırıldı. Firebase konsolunda test mesajı gönderebilirsin!',
          [
            {
              text: 'Copy Token',
              onPress: () => {
                // Clipboard'a kopyala
                import('expo-clipboard').then(Clipboard => {
                  Clipboard.setStringAsync(fcmToken);
                });
              }
            },
            { text: 'OK' }
          ]
        );

        // Listen for foreground messages
        const unsubscribe = messaging().onMessage(async remoteMessage => {
          console.log('📱 Foreground message received:', remoteMessage);
          Alert.alert('FCM Message Received!', JSON.stringify(remoteMessage, null, 2));
        });

        // Background message handler
        messaging().setBackgroundMessageHandler(async remoteMessage => {
          console.log('📱 Background message received:', remoteMessage);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ FCM Token test error:', error);
        Alert.alert('Error', `FCM test failed: ${error.message}`);
      }
    }

    getFCMTokenForTesting();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
        🔥 FCM Token Test
      </Text>
      <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
        Console'da FCM token'ını kontrol et.
        Firebase konsolundan bu token'a test mesajı gönderebilirsin.
      </Text>
    </View>
  );
};

export default FCMTokenTest;