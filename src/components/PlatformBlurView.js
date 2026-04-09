import React from "react";
import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";

/**
 * BlurView wrapper — iOS'ta gerçek blur, Android'de yarı-saydam fallback.
 * expo-blur BlurView Android'de düzgün çalışmadığından bu component kullanılmalı.
 *
 * Props (BlurView ile aynı):
 *   intensity    — blur yoğunluğu (0-100), Android'de opaklığa çevrilir
 *   tint         — "light" | "dark" | "default" | "extraLight" | "prominent"
 *   androidColor — Android fallback arka plan rengi (default: tint'e göre)
 */
const ANDROID_TINT_COLORS = {
  dark: "rgba(0,0,0,0.55)",
  light: "rgba(255,255,255,0.75)",
  default: "rgba(255,255,255,0.6)",
  extraLight: "rgba(255,255,255,0.9)",
  prominent: "rgba(0,0,0,0.4)",
  systemThinMaterialDark: "rgba(0,0,0,0.5)",
  systemChromeMaterialDark: "rgba(0,0,0,0.6)",
};

const PlatformBlurView = ({
  intensity = 50,
  tint = "default",
  androidColor,
  style,
  children,
  ...rest
}) => {
  if (Platform.OS === "android") {
    const bgColor =
      androidColor ||
      ANDROID_TINT_COLORS[tint] ||
      "rgba(255,255,255,0.6)";

    return (
      <View style={[{ backgroundColor: bgColor }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={style} {...rest}>
      {children}
    </BlurView>
  );
};

export default PlatformBlurView;
