import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

const ShimmerPlaceholder = ({ width, height, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      { iterations: -1 } // Sonsuz döngü
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.5, width * 1.5],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#f5f5f5",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0.8)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: width * 1.5,
            height: "100%",
          }}
        />
      </Animated.View>
    </View>
  );
};

const PropertyCardSkeleton = () => {
  return (
    <View className="mr-4 overflow-hidden w-72 flex flex-col bg-white">
      {/* Image Skeleton */}
      <View className="relative rounded-3xl">
        <ShimmerPlaceholder
          width={250} // w-72 equivalent
          height={250}
          borderRadius={24}
        />
      </View>

      {/* Property Details Skeleton */}
      <View className="mt-2 flex flex-col">
        {/* Title Skeleton */}
        <ShimmerPlaceholder
          width={200}
          height={16}
          borderRadius={8}
          style={{ marginBottom: 8 }}
        />

        <View className="flex justify-between flex-row items-center">
          {/* Price Skeleton */}
          <ShimmerPlaceholder width={80} height={14} borderRadius={7} />
        </View>
      </View>
    </View>
  );
};

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <View className="mb-6 mt-4">
      {/* Header Skeleton */}
      <View className="flex-row justify-between items-center mb-4 px-5">
        <ShimmerPlaceholder width={150} height={20} borderRadius={10} />
        <ShimmerPlaceholder width={80} height={16} borderRadius={8} />
      </View>

      {/* Cards Skeleton */}
      <View className="flex-row" style={{ paddingLeft: 16 }}>
        {Array.from({ length: count }).map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

export { LoadingSkeleton, ShimmerPlaceholder };
