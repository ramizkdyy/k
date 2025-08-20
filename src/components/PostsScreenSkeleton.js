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
      { iterations: -1 }
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

// Kiracı için skeleton (büyük kartlar)
const TenantPostSkeleton = () => {
  return (
    <View
      style={{ marginHorizontal: 16 }}
      className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
    >
      {/* Image slider skeleton */}
      <ShimmerPlaceholder
        width={screenWidth - 32}
        height={350}
        borderRadius={25}
      />

      <View className="mt-4 px-1">
        {/* Title skeleton */}
        <ShimmerPlaceholder
          width={screenWidth - 64}
          height={20}
          style={{ marginBottom: 8 }}
        />

        {/* Location skeleton */}
        <ShimmerPlaceholder
          width={150}
          height={14}
          style={{ marginBottom: 8 }}
        />

        {/* Price skeleton */}
        <ShimmerPlaceholder
          width={120}
          height={18}
          style={{ marginBottom: 16 }}
        />

        {/* Property details slider skeleton */}
        <View className="mt-3">
          <View className="flex-row">
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={index}
                className="items-center justify-center"
                style={{
                  width: "fit-content",
                  marginRight: 46,
                  marginLeft: 3,
                  height: 85,
                }}
              >
                <ShimmerPlaceholder
                  width={30}
                  height={30}
                  borderRadius={15}
                  style={{ marginBottom: 8 }}
                />
                <ShimmerPlaceholder
                  width={40}
                  height={16}
                  style={{ marginBottom: 4 }}
                />
                <ShimmerPlaceholder width={35} height={11} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* User info skeleton */}
      <View className="mb-5 pl-1 mt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <ShimmerPlaceholder
              width={48}
              height={48}
              borderRadius={24}
              style={{ marginRight: 12 }}
            />
            <View>
              <ShimmerPlaceholder
                width={120}
                height={14}
                style={{ marginBottom: 4 }}
              />
              <ShimmerPlaceholder width={80} height={12} />
            </View>
          </View>
          <ShimmerPlaceholder width={60} height={12} />
        </View>
      </View>
    </View>
  );
};

// Ev sahibi için skeleton (küçük kartlar)
const LandlordPostSkeleton = () => {
  return (
    <View className="overflow-hidden w-full flex flex-row items-center gap-4 py-2 border-b border-gray-100">
      {/* Image skeleton */}
      <ShimmerPlaceholder width={120} height={120} borderRadius={20} />

      {/* Content skeleton */}
      <View className="flex-1 flex flex-col pr-4">
        {/* Title skeleton */}
        <ShimmerPlaceholder
          width={180}
          height={16}
          style={{ marginBottom: 8 }}
        />

        {/* Price skeleton */}
        <ShimmerPlaceholder
          width={100}
          height={14}
          style={{ marginBottom: 8 }}
        />

        {/* Location skeleton */}
        <ShimmerPlaceholder
          width={140}
          height={13}
          style={{ marginBottom: 8 }}
        />

        {/* Room info skeleton */}
        <View className="flex flex-row gap-4 items-center mb-3">
          <View className="flex flex-row gap-2 items-center">
            <ShimmerPlaceholder width={15} height={15} borderRadius={8} />
            <ShimmerPlaceholder width={60} height={15} />
          </View>
          <View className="flex flex-row gap-2 items-center">
            <ShimmerPlaceholder width={15} height={15} borderRadius={8} />
            <ShimmerPlaceholder width={50} height={15} />
          </View>
        </View>

        {/* Action buttons skeleton */}
        <View className="flex flex-row gap-2">
          <ShimmerPlaceholder width={80} height={32} borderRadius={16} />
          <ShimmerPlaceholder width={32} height={32} borderRadius={8} />
          <ShimmerPlaceholder width={32} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

// Ana skeleton loader komponenti
const PostsScreenSkeleton = ({ userRole, count = 5 }) => {
  return (
    <View className="flex-1">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{ paddingHorizontal: userRole === "KIRACI" ? 0 : 16 }}
        >
          {userRole === "KIRACI" ? (
            <TenantPostSkeleton />
          ) : (
            <LandlordPostSkeleton />
          )}
        </View>
      ))}
    </View>
  );
};

export { PostsScreenSkeleton, ShimmerPlaceholder };
