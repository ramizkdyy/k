import React from "react";
import { View } from "react-native";
import { ShimmerPlaceholder } from "./LoadingSkeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const UserProfileSkeleton = () => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ minHeight: 44, paddingVertical: 8 }}
      >
        <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
        <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
      </View>

      {/* Profile Header */}
      <View className="items-center py-6 px-5">
        {/* Avatar */}
        <ShimmerPlaceholder
          width={96}
          height={96}
          borderRadius={48}
          style={{ marginBottom: 16 }}
        />

        {/* Name */}
        <ShimmerPlaceholder
          width={160}
          height={22}
          borderRadius={11}
          style={{ marginBottom: 8 }}
        />

        {/* Role */}
        <ShimmerPlaceholder
          width={80}
          height={14}
          borderRadius={7}
          style={{ marginBottom: 12 }}
        />

        {/* Rating */}
        <ShimmerPlaceholder
          width={140}
          height={16}
          borderRadius={8}
          style={{ marginBottom: 20 }}
        />

        {/* Action buttons */}
        <View className="flex-row gap-3">
          <ShimmerPlaceholder width={60} height={44} borderRadius={12} />
          <ShimmerPlaceholder width={60} height={44} borderRadius={12} />
          <ShimmerPlaceholder width={60} height={44} borderRadius={12} />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <ShimmerPlaceholder
            key={i}
            width={(screenWidth - 40 - 24) / 4}
            height={40}
            borderRadius={20}
          />
        ))}
      </View>

      {/* Content rows */}
      <View className="px-5 gap-4">
        {/* Section title */}
        <ShimmerPlaceholder width={120} height={18} borderRadius={9} />

        {/* Info rows */}
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-row items-center gap-3">
            <ShimmerPlaceholder width={20} height={20} borderRadius={10} />
            <ShimmerPlaceholder
              width={screenWidth * 0.5}
              height={14}
              borderRadius={7}
            />
          </View>
        ))}

        {/* Divider gap */}
        <View style={{ height: 8 }} />

        {/* Second section title */}
        <ShimmerPlaceholder width={100} height={18} borderRadius={9} />

        {/* Tag chips */}
        <View className="flex-row flex-wrap gap-2">
          {[100, 80, 120, 90, 110].map((w, i) => (
            <ShimmerPlaceholder key={i} width={w} height={32} borderRadius={16} />
          ))}
        </View>

        {/* Third section */}
        <View style={{ height: 8 }} />
        <ShimmerPlaceholder width={110} height={18} borderRadius={9} />
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center gap-3">
            <ShimmerPlaceholder width={20} height={20} borderRadius={10} />
            <ShimmerPlaceholder
              width={screenWidth * 0.45}
              height={14}
              borderRadius={7}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default UserProfileSkeleton;
