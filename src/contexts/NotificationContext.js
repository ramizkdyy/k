import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Store current screen info manually
  const currentScreenInfo = useRef({ screenName: null, partnerId: null });
  
  // Function to update current screen info (to be called from screens)
  const updateCurrentScreen = useCallback((screenName, partnerId = null) => {
    currentScreenInfo.current = { screenName, partnerId };
    console.log('📱 Current screen updated:', { screenName, partnerId });
  }, []);
  
  // Helper function to get current screen info
  const getCurrentScreenInfo = useCallback(() => {
    return currentScreenInfo.current;
  }, []);
  
  // Check if notification should be filtered (user is on ChatDetailScreen with same partner)
  const shouldFilterNotification = useCallback((notification) => {
    const { screenName, partnerId: currentPartnerId } = getCurrentScreenInfo();
    
    console.log('🔍 NOTIFICATION FILTERING DEBUG:', {
      currentScreen: screenName,
      currentPartnerId,
      notificationData: notification?.data,
      notificationTitle: notification?.title,
      notificationMessage: notification?.message?.substring(0, 50)
    });
    
    // Only filter if we're on ChatDetailScreen and it's a chat message
    if (screenName === 'ChatDetailScreen' && notification?.data?.type === 'new_message') {
      const notificationSenderId = notification?.data?.senderId;
      const notificationChatId = notification?.data?.chatId;
      
      // Check if notification is from current partner by comparing senderId directly
      // or checking if current partner is in the chatId
      const isFromCurrentPartner = 
        notificationSenderId === currentPartnerId || 
        (notificationChatId && notificationChatId.includes(currentPartnerId));
      
      console.log('📋 DETAILED FILTERING CHECK:', {
        isOnChatDetailScreen: screenName === 'ChatDetailScreen',
        isNewMessage: notification?.data?.type === 'new_message',
        currentPartnerId,
        notificationSenderId,
        notificationChatId,
        senderIdMatch: notificationSenderId === currentPartnerId,
        chatIdContainsPartner: notificationChatId?.includes(currentPartnerId),
        isFromCurrentPartner,
        currentPartnerType: typeof currentPartnerId,
        senderIdType: typeof notificationSenderId
      });
      
      if (isFromCurrentPartner && currentPartnerId) {
        console.log('🚫 FILTERING NOTIFICATION from current chat partner:', {
          currentScreen: screenName,
          currentPartnerId,
          notificationSenderId,
          notificationTitle: notification?.title
        });
        return true; // Filter out this notification
      } else {
        console.log('✅ ALLOWING NOTIFICATION - different partner or conditions not met');
      }
    } else {
      console.log('✅ ALLOWING NOTIFICATION - not on ChatDetailScreen or not new_message type');
    }
    
    return false; // Don't filter
  }, [getCurrentScreenInfo]);

  const showNotification = useCallback(
    (notification) => {
      // First check if notification should be filtered based on current screen
      if (shouldFilterNotification(notification)) {
        console.log("🚫 Notification filtered - user is viewing this chat");
        return null;
      }
      
      const now = Date.now();

      // Check if there's already a visible notification
      if (notifications.length > 0) {
        console.log("🔄 Updating existing notification content");
        
        // Update the existing notification with new content
        const existingNotification = notifications[0]; // Take the first (most recent) notification
        const updatedNotification = {
          ...existingNotification,
          title: notification.title,
          message: notification.message,
          profileImage: notification.profileImage,
          isOnline: notification.isOnline,
          data: notification.data,
          duration: notification.duration || 4000,
          timestamp: now,
          isUpdating: true, // Flag to trigger content update animation
        };

        setNotifications([updatedNotification]);

        console.log("📱 NotificationProvider: Updated existing notification:", {
          id: existingNotification.id,
          newTitle: notification.title,
          newMessage: notification.message,
          timestamp: new Date(now).toISOString(),
        });

        // Reset the updating flag after a brief delay
        setTimeout(() => {
          setNotifications((prev) => 
            prev.map((notif) => ({ ...notif, isUpdating: false }))
          );
        }, 100);

        return existingNotification.id;
      } else {
        // No existing notification, create new one
        const id = Date.now().toString();
        const newNotification = {
          id,
          ...notification,
          timestamp: now,
          isUpdating: false,
        };

        console.log("📱 NotificationProvider: Adding new notification to state:", {
          id,
          title: notification.title,
          duration: notification.duration,
          timestamp: new Date(now).toISOString(),
        });

        setNotifications([newNotification]);

        console.log(
          "⏱️ NotificationProvider: No auto-hide timer set, component will handle its own timing"
        );

        return id;
      }
    },
    [notifications, shouldFilterNotification]
  );

  const hideNotification = useCallback((id) => {
    console.log("🗑️ NotificationProvider: Hiding notification:", id);
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const hideAllNotifications = useCallback(() => {
    console.log("🗑️ NotificationProvider: Hiding all notifications");
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id, updates) => {
    console.log("🔄 NotificationProvider: Updating notification:", id, updates);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, ...updates } : notification
      )
    );
  }, []);

  const value = {
    notifications,
    showNotification,
    hideNotification,
    hideAllNotifications,
    updateNotification,
    shouldFilterNotification, // Export filtering function for custom notification service
    updateCurrentScreen, // Export function to update current screen info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
