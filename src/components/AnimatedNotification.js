import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/pro-regular-svg-icons";
import { faUserCircle } from "@fortawesome/pro-solid-svg-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const AnimatedNotification = ({
  notification,
  onPress,
  onDismiss,
  index = 0,
  autoHideDuration, // Notification objesinden gelecek
}) => {
  // Duration'ı notification objesinden al, yoksa 4000 kullan
  const duration = autoHideDuration || notification?.duration || 4000;
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Auto-hide timer ref
  const autoHideTimerRef = useRef(null);
  const isExitingRef = useRef(false);

  const { title, message, profileImage, isOnline, data = {} } = notification;

  // Enhanced exit animation function
  const exitAnimation = (callback) => {
    if (isExitingRef.current) return; // Prevent multiple exit animations
    isExitingRef.current = true;

    // Clear auto-hide timer if it exists
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    // Smooth exit animation - yukarı doğru yavaşça kayma
    translateY.value = withSpring(-250, {
      damping: 25,
      stiffness: 90,
      mass: 1.2,
    });

    opacity.value = withTiming(0, {
      duration: 800,
    });

    scale.value = withSpring(0.85, {
      damping: 20,
      stiffness: 80,
      mass: 1,
    });

    // Call dismiss after animation completes
    setTimeout(() => {
      callback?.();
      onDismiss?.(notification.id);
    }, 900);
  };

  // Enhanced enter animation
  useEffect(() => {
    // Smooth enter animation
    const targetY = insets.top + 20 + index * 90;

    translateY.value = withSpring(targetY, {
      damping: 20,
      stiffness: 100,
      mass: 1,
    });

    opacity.value = withTiming(1, {
      duration: 400,
    });

    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
      mass: 0.8,
    });

    // Set up auto-hide timer after enter animation completes
    const autoHideTimer = setTimeout(() => {
      if (!isExitingRef.current) {
        console.log(
          "⏰ AnimatedNotification: Auto-hide timer triggered after",
          duration,
          "ms"
        );
        exitAnimation();
      }
    }, duration);

    autoHideTimerRef.current = autoHideTimer;

    console.log(
      "⏱️ AnimatedNotification: Auto-hide timer set for",
      duration,
      "ms"
    );

    // Cleanup function
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    };
  }, [index, insets.top, duration]); // duration dependency eklendi

  // No gesture interactions - notification only auto-hides

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handleClose = () => {
    exitAnimation();
  };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000 + index,
          paddingHorizontal: "5%",
        },
        animatedStyle,
      ]}
    >
      <BlurView
        intensity={80}
        tint="regular"
        style={{
          width: "100%",
          minHeight: 70,
          borderRadius: 100,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (data?.chatId) {
              console.log("🔗 Navigating to chat:", data.chatId);
              console.log("🔗 Notification data:", data);
              // Ensure type is set for proper navigation
              const navigationData = {
                ...data,
                type: data?.type || "new_message",
                fromNotification: true,
              };
              onPress?.(navigationData);
              exitAnimation();
            } else {
              console.warn("⚠️ No chatId found in notification data");
            }
          }}
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          {/* Avatar/Icon */}
          <View style={{ marginRight: 12 }}>
            <View
              style={{ width: 45, height: 45 }}
              className="justify-center items-center rounded-full border border-gray-900"
            >
              {profileImage && profileImage !== "default_profile_image_url" ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                  onError={(error) => {
                    console.log("❌ Profile image load error:", error);
                  }}
                />
              ) : (
                <Text
                  style={{ fontSize: 20 }}
                  className="text-gray-900 font-bold"
                >
                  {title?.charAt(0)?.toUpperCase() || "P"}
                </Text>
              )}

              {isOnline && (
                <View
                  style={{ width: 16, height: 16, bottom: -2, right: -2 }}
                  className="absolute flex justify-center items-center rounded-full bg-white"
                >
                  <View
                    style={{ width: 10, height: 10 }}
                    className="flex justify-center items-center rounded-full bg-green-500"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Content */}
          <View className="flex-1">
            {/* Sender Name */}
            <Text
              className="font-semibold text-gray-900 text-base"
              numberOfLines={1}
            >
              {title}
            </Text>

            {/* Message Content */}
            <Text className="text-gray-700 text-base" numberOfLines={2}>
              {message}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            className="ml-2 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesomeIcon icon={faXmark} size={16} color="#000" />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
};

export default AnimatedNotification;
