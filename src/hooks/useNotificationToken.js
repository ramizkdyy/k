import { useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  useRegisterNotificationTokenMutation,
  useUnregisterNotificationTokenMutation 
} from "../redux/api/apiSlice";
import notificationService from "../services/notificationService";

export const useNotificationToken = () => {
  const [registerToken] = useRegisterNotificationTokenMutation();
  const [unregisterToken] = useUnregisterNotificationTokenMutation();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    let hasRegistered = false;

    const initializeAndRegisterToken = async () => {
      if (!isAuthenticated || !token) {
        console.log("User not authenticated, skipping FCM token registration");
        return;
      }

      try {
        console.log("🚀 Initializing notification service and registering FCM token...");
        
        // Initialize notification service and get FCM token
        const tokens = await notificationService.initialize();
        
        if (tokens?.fcmToken && !hasRegistered) {
          console.log("📝 FCM token obtained, registering with backend...");
          // Register FCM token with backend
          const result = await notificationService.registerTokenWithServer(registerToken);
          
          if (result.success) {
            hasRegistered = true;
            console.log("✅ FCM token registered successfully on app startup");
          } else if (!result.skipLogging) {
            console.error("❌ Failed to register FCM token:", result.error);
          }
        } else if (!tokens?.fcmToken) {
          console.log("❌ No FCM token obtained during initialization");
        }
      } catch (error) {
        console.error("❌ Failed to initialize notifications:", error);
      }
    };

    initializeAndRegisterToken();

    // Cleanup: unregister token when component unmounts or user logs out
    return () => {
      if (hasRegistered && !isAuthenticated) {
        console.log("🚪 User logged out, unregistering FCM token...");
        notificationService.unregisterTokenWithServer(unregisterToken);
      }
    };
  }, [isAuthenticated, token, registerToken, unregisterToken]);

  const manualRegister = async () => {
    return await notificationService.registerTokenWithServer(registerToken);
  };

  const manualUnregister = async () => {
    return await notificationService.unregisterTokenWithServer(unregisterToken);
  };

  return {
    fcmToken: notificationService.getFCMTokenValue(),
    expoToken: notificationService.getExpoPushToken(),
    platform: notificationService.getPlatform(),
    manualRegister,
    manualUnregister,
  };
};