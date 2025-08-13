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
      // Create unique key to prevent duplicates
      const uniqueKey = `${notification.title}-${notification.message}-${
        notification.data?.chatId || ""
      }`;

      // Check if similar notification already exists (within last 2 seconds)
      const now = Date.now();
      const isDuplicate = notifications.some((existing) => {
        const existingKey = `${existing.title}-${existing.message}-${
          existing.data?.chatId || ""
        }`;
        return existingKey === uniqueKey && now - existing.timestamp < 2000;
      });

      if (isDuplicate) {
        console.log("Duplicate notification prevented:", uniqueKey);
        return null;
      }

      const id = Date.now().toString();
      const newNotification = {
        id,
        ...notification,
        timestamp: now,
      };

      console.log("📱 NotificationProvider: Adding notification to state:", {
        id,
        title: notification.title,
        duration: notification.duration,
        timestamp: new Date(now).toISOString(),
      });

      setNotifications((prev) => [...prev, newNotification]);

      // ✅ REMOVED: Auto-hide timer - let AnimatedNotification handle its own timing
      // Timer'ı kaldırdık, sadece AnimatedNotification kendi exit animasyonunu kontrol edecek
      console.log(
        "⏱️ NotificationProvider: No auto-hide timer set, component will handle its own timing"
      );

      return id;
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
