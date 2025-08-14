import React from "react";
import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/pro-regular-svg-icons";
import { faUserCircle } from "@fortawesome/pro-solid-svg-icons";

const { width: screenWidth } = Dimensions.get("window");

const CustomToast = ({ text1, text2, hide, onPress, props }) => {
  const data = props?.data || {};
  const profileImage = data?.profileImage;
  const senderName = text1;
  const isOnline = data?.isOnline;

  return (
    <View className="w-full items-center" style={{ paddingHorizontal: "2%" }}>
      <BlurView
        intensity={80}
        tint="regular"
        style={{
          boxShadow: "0px 0px 12px #00000001",
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
          onPress={onPress}
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.9}
          delayPressIn={0}
        >
          {/* Avatar/Icon */}
          <View className="mr-3">
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
                  {senderName?.charAt(0)?.toUpperCase() || "P"}
                </Text>
              )}

              {isOnline && (
                <View
                  style={{ width: 16, height: 16, bottom: -2, right: -2 }}
                  className={`absolute flex justify-center items-center rounded-full bg-white`}
                >
                  <View
                    style={{ width: 10, height: 10 }}
                    className={`flex justify-center items-center rounded-full bg-green-500`}
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
              {text1}
            </Text>

            {/* Message Content */}
            <Text className="text-gray-700 text-base" numberOfLines={2}>
              {text2}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={hide}
            className="ml-2 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesomeIcon icon={faXmark} size={16} color="#000" />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

export default CustomToast;
