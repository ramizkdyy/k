import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ShimmerPlaceholder = ({ width, height, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1800,
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
          backgroundColor: "#f0f0f0",
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
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.4)",
            "rgba(255,255,255,0.8)",
            "rgba(255,255,255,0.4)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: width * 1.5, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

const PostDetailScreenSkeleton = () => {
  const insets = useSafeAreaInsets();
  const imageHeight = screenHeight * 0.5;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Hero image placeholder */}
      <ShimmerPlaceholder
        width={screenWidth}
        height={imageHeight}
        borderRadius={0}
      />

      {/* Content card */}
      <View
        style={{
          backgroundColor: "#fff",
          marginTop: -20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 20,
          flex: 1,
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View
            style={{
              width: 50,
              height: 5,
              borderRadius: 3,
              backgroundColor: "#e5e7eb",
            }}
          />
        </View>

        {/* Title */}
        <ShimmerPlaceholder
          width={screenWidth - 80}
          height={26}
          borderRadius={6}
          style={{ marginBottom: 10 }}
        />
        <ShimmerPlaceholder
          width={(screenWidth - 80) * 0.65}
          height={26}
          borderRadius={6}
          style={{ marginBottom: 12 }}
        />

        {/* Location */}
        <ShimmerPlaceholder
          width={160}
          height={14}
          borderRadius={6}
          style={{ marginBottom: 24 }}
        />

        {/* 5 property features */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 4,
            marginBottom: 28,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{ alignItems: "center", gap: 8 }}>
              <ShimmerPlaceholder width={26} height={26} borderRadius={13} />
              <ShimmerPlaceholder width={44} height={13} borderRadius={5} />
            </View>
          ))}
        </View>

        {/* Landlord row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            borderTopWidth: 0.4,
            borderBottomWidth: 0.4,
            borderColor: "#dee0ea",
            marginBottom: 20,
          }}
        >
          <ShimmerPlaceholder
            width={56}
            height={56}
            borderRadius={28}
            style={{ marginRight: 12 }}
          />
          <View>
            <ShimmerPlaceholder
              width={130}
              height={16}
              borderRadius={6}
              style={{ marginBottom: 6 }}
            />
            <ShimmerPlaceholder width={70} height={12} borderRadius={5} />
          </View>
        </View>

        {/* Description */}
        <ShimmerPlaceholder
          width={120}
          height={13}
          borderRadius={5}
          style={{ alignSelf: "center", marginBottom: 12 }}
        />
        {[1, 0.9, 0.75].map((ratio, i) => (
          <ShimmerPlaceholder
            key={i}
            width={(screenWidth - 48) * ratio}
            height={14}
            borderRadius={6}
            style={{ marginBottom: 8 }}
          />
        ))}

        {/* Detail rows */}
        <View style={{ marginTop: 24 }}>
          <ShimmerPlaceholder
            width={100}
            height={13}
            borderRadius={5}
            style={{ alignSelf: "center", marginBottom: 16 }}
          />
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <ShimmerPlaceholder width={120} height={16} borderRadius={6} />
              <ShimmerPlaceholder width={80} height={14} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>

      {/* Bottom action bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 12,
          paddingTop: 16,
          paddingHorizontal: 24,
          backgroundColor: "#fff",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopWidth: 0.5,
          borderTopColor: "#e5e7eb",
        }}
      >
        <View>
          <ShimmerPlaceholder
            width={60}
            height={12}
            borderRadius={5}
            style={{ marginBottom: 6 }}
          />
          <ShimmerPlaceholder width={110} height={22} borderRadius={6} />
        </View>
        <ShimmerPlaceholder width={140} height={50} borderRadius={25} />
      </View>
    </View>
  );
};

export default PostDetailScreenSkeleton;
