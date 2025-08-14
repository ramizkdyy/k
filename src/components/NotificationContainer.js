import React, { useEffect } from "react";
import { View } from "react-native";
import { useNotification } from "../contexts/NotificationContext";
import { useNavigationState } from "@react-navigation/native";
import AnimatedNotification from "./AnimatedNotification";
import notificationService from "../services/notificationService";
import customNotificationService from "../services/customNotificationService";

const NotificationContainer = () => {
  const { notifications, hideNotification, showNotification, shouldFilterNotification } =
    useNotification();

  // Set up custom notification service
  useEffect(() => {
    customNotificationService.setShowNotification(showNotification);
    if (shouldFilterNotification) {
      customNotificationService.setFilterFunction(shouldFilterNotification);
    }
  }, [showNotification, shouldFilterNotification]);

  const handleNotificationPress = (data) => {
    // Handle navigation based on notification data
    if (data?.type === "new_message" && (data?.chatId || data?.senderId)) {
      notificationService.navigateToChat(data);
    } else if (data?.type === "new_offer") {
      notificationService.navigateToOffers();
    }
  };

  const handleNotificationDismiss = (id) => {
    hideNotification(id);
  };

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000 }}
    >
      {notifications.map((notification, index) => (
        <AnimatedNotification
          key={notification.id}
          notification={notification}
          index={index}
          onPress={handleNotificationPress}
          onDismiss={handleNotificationDismiss}
        />
      ))}
    </View>
  );
};

export default NotificationContainer;
