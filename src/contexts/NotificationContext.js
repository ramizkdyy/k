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
  }, []);
  
  // Helper function to get current screen info
  const getCurrentScreenInfo = useCallback(() => {
    return currentScreenInfo.current;
  }, []);
  
  // Check if notification should be filtered (user is on ChatDetailScreen with same partner)
  const shouldFilterNotification = useCallback((notification) => {
    const { screenName, partnerId: currentPartnerId } = getCurrentScreenInfo();
    
    
    // Filter chat notifications based on current screen
    if (notification?.data?.type === 'new_message') {
      // If on MessagesScreen, filter all chat notifications
      if (screenName === 'MessagesScreen') {
        return true; // Filter out all chat notifications
      }
      
      // If on ChatDetailScreen, filter notifications from current chat partner
      if (screenName === 'ChatDetailScreen') {
        const notificationSenderId = notification?.data?.senderId;
        const notificationChatId = notification?.data?.chatId;
        
        // Check if notification is from current partner by comparing senderId directly
        // or checking if current partner is in the chatId
        const isFromCurrentPartner = 
          notificationSenderId === currentPartnerId || 
          (notificationChatId && notificationChatId.includes(currentPartnerId));
        
        
        if (isFromCurrentPartner && currentPartnerId) {
          return true; // Filter out this notification
        } else {
        }
      }
    } else {
    }
    
    return false; // Don't filter
  }, [getCurrentScreenInfo]);

  const showNotification = useCallback(
    (notification) => {
      // First check if notification should be filtered based on current screen
      if (shouldFilterNotification(notification)) {
        return null;
      }
      
      const now = Date.now();

      // Check if there's already a visible notification
      if (notifications.length > 0) {
        
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


        setNotifications([newNotification]);


        return id;
      }
    },
    [notifications, shouldFilterNotification]
  );

  const hideNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const hideAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id, updates) => {
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
