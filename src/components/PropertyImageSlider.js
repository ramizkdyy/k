/**
 * PropertyImageSlider - Mülk resim kaydırıcısı
 * 
 * Daha önce AllNearbyPropertiesScreen.js, AllSimilarPropertiesScreen.js ve PostsScreen.js
 * dosyalarında farklı varyasyonlarda tekrarlanıyordu.
 * 
 * Tüm varyasyonları kapsayan tek bir bileşen haline getirildi:
 * - Distance badge (opsiyonel)
 * - Status badge (opsiyonel)
 * - Landlord action butonları (opsiyonel - sadece PostsScreen'de kullanılıyor)
 * - Pagination dots
 */
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Home, Edit, Trash2 } from "lucide-react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import PlatformBlurView from "./PlatformBlurView";
import ImageWithFallback from "./ImageWithFallback";

const { width: screenWidth } = Dimensions.get("window");

const BASE64_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=";

const PropertyImageSlider = React.memo(
  ({
    images,
    distance,
    status,
    postId,
    onPress,
    // Landlord-specific props (sadece PostsScreen'de kullanılıyor)
    userRole,
    currentUser,
    item,
    onEdit,
    onDelete,
    onOffers,
    isDeleting,
    // Style overrides
    imageHeight = 350,
    slideWidth,
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const effectiveSlideWidth = slideWidth || screenWidth - 32;

    const handleScroll = useCallback(
      (event) => {
        const index = Math.round(
          event.nativeEvent.contentOffset.x / effectiveSlideWidth
        );
        setCurrentIndex(index);
      },
      [effectiveSlideWidth]
    );

    const handleDotPress = useCallback(
      (index) => {
        setCurrentIndex(index);
        scrollViewRef.current?.scrollTo({
          x: effectiveSlideWidth * index,
          animated: true,
        });
      },
      [effectiveSlideWidth]
    );

    const hasImages = images && images.length > 0;
    const hasMultipleImages = images && images.length > 1;
    const hasDistance = distance && distance > 0;

    const statusText = useMemo(() => {
      switch (status) {
        case 0:
          return "Aktif";
        case 1:
          return "Kiralandı";
        default:
          return "Kapalı";
      }
    }, [status]);

    // Landlord kontrolü — kendi ilanı mı?
    const isOwner =
      userRole === "EVSAHIBI" && item?.userId === currentUser?.id;

    if (!hasImages) {
      return (
        <TouchableOpacity
          className="w-full justify-center items-center rounded-3xl bg-gray-100"
          style={{ height: imageHeight }}
          onPress={onPress}
          activeOpacity={1}
        >
          <Home size={50} color="#cbd5e1" />
        </TouchableOpacity>
      );
    }

    return (
      <View
        className="relative bg-gray-100"
        style={{ borderRadius: 25, overflow: "hidden" }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={true}
          style={{ width: effectiveSlideWidth }}
        >
          {images.map((img, index) => (
            <TouchableOpacity
              key={`image-${postId}-${index}`}
              style={{ width: effectiveSlideWidth }}
              activeOpacity={1}
              onPress={onPress}
            >
              <ImageWithFallback
                source={{ uri: img.postImageUrl }}
                style={{
                  width: effectiveSlideWidth,
                  height: imageHeight,
                }}
                contentFit="cover"
                fallbackWidth={effectiveSlideWidth}
                fallbackHeight={imageHeight}
                borderRadius={0}
                placeholder={{ uri: BASE64_PLACEHOLDER }}
                recyclingKey={`${postId}-${index}`}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Distance badge */}
        {hasDistance && (
          <PlatformBlurView
            style={{ boxShadow: "0px 0px 12px #00000012" }}
            intensity={50}
            tint="dark"
            className="absolute top-3 left-3 rounded-full overflow-hidden"
          >
            <View className="px-3 py-1.5 rounded-full flex-row items-center">
              <MaterialIcons name="location-on" size={12} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                {typeof distance === "number"
                  ? `${distance.toFixed(1)} km`
                  : distance}
              </Text>
            </View>
          </PlatformBlurView>
        )}

        {/* Status badge */}
        {status !== undefined && (
          <View className="absolute top-3 right-3">
            <PlatformBlurView
              intensity={50}
              tint="dark"
              style={{ overflow: "hidden", borderRadius: 100 }}
              className="px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-xs font-semibold">
                {statusText}
              </Text>
            </PlatformBlurView>
          </View>
        )}

        {/* Landlord action butonları (sadece PostsScreen'de kullanılıyor) */}
        {isOwner && onEdit && onDelete && onOffers && (
          <View className="flex-row absolute gap-2 bottom-3 right-3">
            <PlatformBlurView
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              tint="dark"
              intensity={50}
              className="overflow-hidden rounded-full"
            >
              <TouchableOpacity
                className="flex justify-center items-center"
                onPress={onOffers}
                activeOpacity={1}
              >
                <View className="flex-row items-center justify-center px-3 py-3">
                  <Text className="text-white font-medium text-center text-sm">
                    Teklifler ({item?.offerCount || 0})
                  </Text>
                </View>
              </TouchableOpacity>
            </PlatformBlurView>

            <PlatformBlurView
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              intensity={50}
              tint="dark"
              className="overflow-hidden rounded-full"
            >
              <TouchableOpacity
                className="flex justify-center items-center py-3 px-3"
                onPress={onEdit}
                activeOpacity={1}
              >
                <View className="flex-row items-center justify-center">
                  <Edit color="white" size={20} />
                </View>
              </TouchableOpacity>
            </PlatformBlurView>

            <PlatformBlurView
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              intensity={50}
              tint="dark"
              className="overflow-hidden rounded-full"
            >
              <TouchableOpacity
                className="flex justify-center items-center"
                onPress={onDelete}
                disabled={isDeleting}
                activeOpacity={1}
              >
                <View className="flex-row items-center justify-center py-3 px-3">
                  <Trash2 color="#ff0040" size={20} />
                </View>
              </TouchableOpacity>
            </PlatformBlurView>
          </View>
        )}

        {/* Pagination dots */}
        {hasMultipleImages && (
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
            <View
              style={{
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <View className="flex-row justify-center">
                {images.map((_, index) => (
                  <TouchableOpacity
                    key={`dot-${index}`}
                    onPress={() => handleDotPress(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 4,
                      backgroundColor:
                        index === currentIndex
                          ? "#FFFFFF"
                          : "rgba(255, 255, 255, 0.5)",
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
);

export default PropertyImageSlider;
