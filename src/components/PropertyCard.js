/**
 * PropertyCard - Tam ekran mülk kartı bileşeni
 * 
 * Daha önce AllNearbyPropertiesScreen.js, AllSimilarPropertiesScreen.js ve PostsScreen.js
 * dosyalarında "PropertyItem" olarak neredeyse identik şekilde tekrarlanıyordu.
 * 
 * Tek bir kaynak haline getirildi. Her ekranda opsiyonel prop'larla farklılaştırılıyor:
 * - similarityScore badge (AllSimilarPropertiesScreen)
 * - matchScore/landlord actions (PostsScreen)
 * - distance badge (AllNearbyPropertiesScreen)
 */
import React, { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import PropertyImageSlider from "./PropertyImageSlider";
import PropertyDetailsSlider from "./PropertyDetailsSlider";
import ImageWithFallback from "./ImageWithFallback";
import PlatformBlurView from "./PlatformBlurView";
import { getCurrencyText, getRelativeTime } from "../utils/formatters";

/**
 * PropertyCardFull - Tam ekran özellik kartı (listelerde kullanılır)
 * 
 * Kullanıldığı ekranlar:
 * - AllNearbyPropertiesScreen
 * - AllSimilarPropertiesScreen
 * - PostsScreen (kiracı ve ev sahibi görünümleri)
 */
const PropertyCardFull = React.memo(
  ({
    item,
    navigation,
    // Opsiyonel - sadece PostsScreen'de
    userRole,
    currentUser,
    onEdit,
    onDelete,
    onOffers,
    isDeleting,
    // Opsiyonel — ekranlar arası farklılıklar
    showSimilarityScore = false,
    showMatchScore = true,
  }) => {
    const handleImagePress = useCallback(() => {
      navigation.navigate("PostDetail", { postId: item.postId });
    }, [item.postId, navigation]);

    const handleProfilePress = useCallback(() => {
      navigation.navigate("UserProfile", {
        userId: item.landlordId || item.userId,
        userRole: "EVSAHIBI",
        matchScore: item.matchScore,
      });
    }, [item.landlordId, item.userId, item.matchScore, navigation]);

    // Memoized değerler
    const titleText = useMemo(
      () => item.ilanBasligi || "İlan başlığı yok",
      [item.ilanBasligi]
    );

    const locationText = useMemo(() => {
      if (item.ilce && item.il) return `${item.ilce}, ${item.il}`;
      return item.il || "Konum belirtilmemiş";
    }, [item.ilce, item.il]);

    const priceText = useMemo(() => {
      if (item.kiraFiyati || item.rent) {
        return `${(item.kiraFiyati || item.rent).toLocaleString()} ${getCurrencyText(item.paraBirimi || item.currency)}`;
      }
      return "Fiyat belirtilmemiş";
    }, [item.kiraFiyati, item.rent, item.paraBirimi, item.currency]);

    const userInitial = useMemo(
      () => item.user?.name?.charAt(0) || "E",
      [item.user?.name]
    );

    const userName = useMemo(
      () => `${item.user?.name || ""} ${item.user?.surname || ""}`.trim(),
      [item.user?.name, item.user?.surname]
    );

    const matchScoreText = useMemo(
      () =>
        item.matchScore ? `Skor: ${item.matchScore.toFixed(1)}` : "Rating",
      [item.matchScore]
    );

    const relativeTime = useMemo(
      () => getRelativeTime(item.postTime || item.olusturmaTarihi),
      [item.postTime, item.olusturmaTarihi]
    );

    return (
      <View
        style={{ marginHorizontal: 16 }}
        className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
      >
        {/* Image slider */}
        <PropertyImageSlider
          images={item.postImages}
          distance={item.distance}
          status={item.status}
          postId={item.postId}
          onPress={handleImagePress}
          // Landlord-specific (sadece PostsScreen)
          userRole={userRole}
          currentUser={currentUser}
          item={item}
          onEdit={onEdit ? () => onEdit(item.postId) : undefined}
          onDelete={onDelete ? () => onDelete(item.postId) : undefined}
          onOffers={onOffers ? () => onOffers(item.postId) : undefined}
          isDeleting={isDeleting}
        />

        <View className="mt-4 px-1">
          {/* Title */}
          <View className="items-start mb-1">
            <Text
              style={{ fontSize: 18, fontWeight: 700 }}
              className="text-gray-800"
              numberOfLines={2}
            >
              {titleText}
            </Text>
          </View>

          {/* Location */}
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 12 }} className="text-gray-500">
              {locationText}
            </Text>
          </View>

          {/* Price */}
          <View className="flex-row items-center">
            <Text
              style={{ fontSize: 18, fontWeight: 500 }}
              className="text-gray-900 underline"
            >
              {priceText}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">/ay</Text>
          </View>

          {/* Property details slider */}
          <PropertyDetailsSlider item={item} />
        </View>

        {/* Similarity Score Badge */}
        {showSimilarityScore && item.similarityScore && (
          <PlatformBlurView
            tint="dark"
            style={{ top: 32, left: 20 }}
            className="absolute overflow-hidden px-4 py-1.5 rounded-full"
          >
            <Text style={{ fontSize: 12 }} className="text-white font-medium">
              {item.similarityScore}% Benzer
            </Text>
          </PlatformBlurView>
        )}

        {/* User Info Footer */}
        <View className="flex flex-col">
          <View className="mb-5 pl-1 mt-3">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={handleProfilePress}
            >
              <View className="flex-1 flex-row justify-between items-center w-full">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={handleProfilePress}
                >
                  <View
                    className="w-12 h-12 rounded-full justify-center items-center mr-3 border"
                    style={{ borderColor: "#20604C" }}
                  >
                    {item.user?.profilePictureUrl ? (
                      <ImageWithFallback
                        source={{ uri: item.user.profilePictureUrl }}
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                        className="w-full h-full rounded-full"
                        fallbackWidth={48}
                        fallbackHeight={48}
                        borderRadius={24}
                      />
                    ) : (
                      <View>
                        <Text
                          style={{ fontSize: 20 }}
                          className="font-bold text-gray-900"
                        >
                          {userInitial}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-col gap-1">
                    <Text
                      style={{ fontSize: 14 }}
                      className="font-semibold text-gray-800"
                    >
                      {userName}
                    </Text>
                    <View className="flex flex-row items-center gap-1">
                      <Text style={{ fontSize: 12 }} className="text-gray-500">
                        {showMatchScore ? matchScoreText : "Ev Sahibi"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <Text
                  className="mb-2 pl-1 text-gray-500"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {relativeTime}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Özel karşılaştırma — gereksiz re-render'ları önler
    return (
      prevProps.item.postId === nextProps.item.postId &&
      prevProps.item.matchScore === nextProps.item.matchScore &&
      prevProps.item.similarityScore === nextProps.item.similarityScore &&
      prevProps.item.status === nextProps.item.status
    );
  }
);

/**
 * PropertyCardMini - Küçük yatay mülk kartı (PostDetailScreen similarPosts, HomeScreen vb.)
 */
const PropertyCardMini = React.memo(({ item, navigation }) => {
  const handlePress = useCallback(() => {
    navigation.push("PostDetail", { postId: item.postId });
  }, [item.postId, navigation]);

  const priceText = useMemo(() => {
    if (item.kiraFiyati) {
      return `${item.kiraFiyati.toLocaleString()} ${getCurrencyText(item.paraBirimi)}`;
    }
    return "Fiyat belirtilmemiş";
  }, [item.kiraFiyati, item.paraBirimi]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      className="overflow-hidden w-72 flex flex-col px-3 py-3"
      onPress={handlePress}
    >
      {/* Image Container */}
      <View className="relative">
        <Image
          style={{
            height: 220,
            borderRadius: 25,
            boxShadow: "0px 0px 12px #00000024",
          }}
          source={{
            uri:
              item.postImages && item.postImages.length > 0
                ? item.postImages[0].postImageUrl
                : item.firstPostİmageURL ||
                  "https://via.placeholder.com/300x200",
          }}
          className="w-full"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      </View>

      {/* Property Details */}
      <View className="py-3 px-1">
        <Text
          style={{ fontSize: 16, fontWeight: 600 }}
          className="text-gray-800"
          numberOfLines={2}
        >
          {item.ilanBasligi ||
            `${item.il} ${item.ilce} ${item.odaSayisi} Kiralık Daire`}
        </Text>

        <View className="flex justify-between flex-row items-center mt-1">
          <View className="flex-row items-center">
            <Text
              style={{ fontSize: 14, fontWeight: 400 }}
              className="text-gray-500"
            >
              {priceText}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">/ay</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export { PropertyCardFull, PropertyCardMini };
export default PropertyCardFull;
