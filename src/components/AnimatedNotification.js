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
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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

  // Gesture state
  const gestureTranslateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const isDragging = useSharedValue(false);

  // Auto-hide timer ref
  const autoHideTimerRef = useRef(null);
  const isExitingRef = useRef(false);

  const {
    title,
    message,
    profileImage,
    isOnline,
    data = {},
    isUpdating,
  } = notification;

  // Content update animation values
  const contentOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);

  // Handle content updates with smooth transition
  useEffect(() => {
    if (isUpdating) {
      console.log(
        "🔄 AnimatedNotification: Content updating, starting transition and restarting timer"
      );

      // Clear existing timer when content updates
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }

      // Fade out and scale down slightly
      contentOpacity.value = withTiming(0.7, { duration: 150 });
      contentScale.value = withTiming(0.98, { duration: 150 });

      // Then fade back in and scale back up
      setTimeout(() => {
        contentOpacity.value = withTiming(1, { duration: 200 });
        contentScale.value = withTiming(1, { duration: 200 });
      }, 150);

      // Restart the auto-hide timer with full duration after content update
      setTimeout(() => {
        if (!isExitingRef.current && !isDragging.value) {
          console.log(
            "⏰ AnimatedNotification: Restarting auto-hide timer after content update"
          );
          autoHideTimerRef.current = setTimeout(() => {
            if (!isExitingRef.current && !isDragging.value) {
              exitAnimation();
            }
          }, duration);
        }
      }, 350); // Wait for content transition to complete before starting timer
    }
  }, [isUpdating, title, message, profileImage, duration]);

  // Enhanced exit animation function
  const exitAnimation = (callback) => {
    if (isExitingRef.current) return; // Prevent multiple exit animations
    isExitingRef.current = true;

    // Clear auto-hide timer if it exists
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    // Default upward exit animation
    translateY.value = withSpring(-250, {
      damping: 25,
      stiffness: 90,
      mass: 1.2,
    });

    opacity.value = withTiming(0, {
      duration: 600,
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
    }, 700);
  };

  // Enhanced enter animation
  useEffect(() => {
    // Smooth enter animation
    const targetY = insets.top + index * 90;

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

  // Helper functions for timer management
  const clearTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const restartTimer = () => {
    if (!isExitingRef.current) {
      autoHideTimerRef.current = setTimeout(() => {
        if (!isExitingRef.current && !isDragging.value) {
          exitAnimation();
        }
      }, duration * 0.8);
    }
  };

  // Gesture handlers for vertical scrolling only
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      runOnJS(clearTimer)();
    })
    .onUpdate((event) => {
      // Only vertical movement (up/down scrolling)
      let translationY = event.translationY;

      // Add resistance for excessive movements - more restrictive for downward movement
      const maxUpwardMovement = -150;
      const maxDownwardMovement = 60; // Reduced from 150 to 60 for more restrictive downward movement

      if (translationY < maxUpwardMovement) {
        translationY =
          maxUpwardMovement + (translationY - maxUpwardMovement) * 0.2;
      } else if (translationY > maxDownwardMovement) {
        translationY =
          maxDownwardMovement + (translationY - maxDownwardMovement) * 0.1; // More resistance (0.1 instead of 0.2)
      }

      gestureTranslateY.value = translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;

      const verticalVelocity = event.velocityY;
      const verticalTranslation = event.translationY;

      // Check for upward swipe to dismiss
      const shouldDismissUpward =
        verticalTranslation < -80 || verticalVelocity < -800;

      if (shouldDismissUpward) {
        // Upward swipe dismiss
        runOnJS(exitAnimation)();
      } else {
        // Return to original position
        gestureTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
          mass: 1,
        });

        runOnJS(restartTimer)();
      }
    });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value + gestureTranslateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  // Content update animation styles
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ scale: contentScale.value }],
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
          paddingHorizontal: "3%",
        },
        animatedStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
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
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.2)",
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
            {/* Animated Content Container */}
            <Animated.View
              style={[
                { flexDirection: "row", alignItems: "center", flex: 1 },
                contentAnimatedStyle,
              ]}
            >
              {/* Avatar/Icon */}
              <View style={{ marginRight: 12 }}>
                <View
                  style={{ width: 45, height: 45 }}
                  className="justify-center items-center rounded-full border border-gray-900"
                >
                  {profileImage &&
                  profileImage !== "default_profile_image_url" ? (
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
            </Animated.View>

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
      </GestureDetector>
    </Animated.View>
  );
};

export default AnimatedNotification;
