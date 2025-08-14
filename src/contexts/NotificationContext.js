import React, { createContext, useContext, useState, useCallback } from "react";

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

  const showNotification = useCallback(
    (notification) => {
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
    [notifications]
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
