import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  ImageBackground
} from "react-native";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetForYouPageQuery } from "../redux/api/apiSlice";
import * as Location from "expo-location";

const NearbyProperties = ({ navigation, onRefresh, refreshing }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          // Use default Istanbul coordinates if permission denied
          setUserLocation({
            latitude: 41.0082,
            longitude: 28.9784,
          });
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log("Location error:", error);
        // Use default Istanbul coordinates
        setUserLocation({
          latitude: 41.0082,
          longitude: 28.9784,
        });
      } finally {
        setLocationLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  // Fetch nearby properties using FYP API
  const {
    data: nearbyData,
    isLoading: isLoadingNearby,
    error,
    refetch,
  } = useGetForYouPageQuery(
    {
      userId: currentUser?.id,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
    },
    {
      skip: !userLocation || !currentUser?.id, // Skip query until we have location and user
      refetchOnMountOrArgChange: true, // Always refetch when component mounts
      refetchOnFocus: true, // Refetch when app comes back to focus
    }
  );

  const nearbyProperties = nearbyData?.result?.bestForYou || [];
  const nearFromYouProperties = nearbyData?.result?.nearFromYou || [];

  // Combine both arrays for display, prioritizing nearFromYou
  const allProperties = [...nearFromYouProperties, ...nearbyProperties];

  // Handle refresh from parent component
  useEffect(() => {
    if (refreshing && userLocation && currentUser?.id) {
      handleRefresh();
    }
  }, [refreshing, userLocation, currentUser?.id]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!userLocation || !currentUser?.id) return;

    // console.log("===== MANUAL REFRESH STARTED =====");
    setIsRefreshing(true);
    try {
      const result = await refetch();
      console.log("Refetch Result:", result);
      if (onRefresh) {
        onRefresh(); // Notify parent that refresh is complete
      }
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
      console.log("===== MANUAL REFRESH ENDED =====");
    }
  };

  // Refresh both location and data
  const handleFullRefresh = async () => {
    console.log("===== FULL REFRESH STARTED =====");
    setIsRefreshing(true);

    try {
      // Get fresh location
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission status:", status);

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        console.log("New location obtained:", newLocation);
        setUserLocation(newLocation);
      }

      // Refetch data with current/new location
      const result = await refetch();
      console.log("Full refresh refetch result:", result);
    } catch (error) {
      console.log("Full refresh error:", error);
    } finally {
      setIsRefreshing(false);
      console.log("===== FULL REFRESH ENDED =====");
    }
  };

  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity
      className="mr-4 rounded-2xl overflow-hidden h-80 w-72 shadow-lg"
      onPress={() => {
        navigation.navigate("PostDetail", { postId: item.postId });
      }}
    >
      {/* Background Image */}
      <ImageBackground
        source={{
          uri:
            item.postImages && item.postImages.length > 0
              ? item.postImages[0].postImageUrl
              : "https://via.placeholder.com/300x200",
        }}
        className="w-full h-full"
        resizeMode="cover"
      >
        {/* Dark Gradient Overlay */}
        <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Distance Badge for Near Properties */}
        {item.distanceInKM !== undefined && (
          <View className="absolute top-3 left-3 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 flex-row items-center">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-1.5" />
            <Text className="text-white text-xs font-semibold">
              {item.distanceInKM.toFixed(1)} km
            </Text>
          </View>
        )}

        {/* Property Info - Bottom */}
        <View className="absolute bottom-0  left-0 right-0 p-3">
          {/* Title */}
          <Text className="text-white text-lg font-bold mb-1" numberOfLines={1}>
            {item.ilanBasligi || "İlan Başlığı"}
          </Text>

          {/* Location */}
          <Text className="text-white/90 text-sm mb-2" numberOfLines={1}>
            {item.ilce && item.il
              ? `${item.ilce}, ${item.il}`
              : "Konum bilgisi yok"}
          </Text>

          {/* Price */}
          <Text className="text-white text-xl font-bold">
            {item.kiraFiyati} {item.paraBirimi || "₺"}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const handleSeeAll = () => {
    // Navigate to a full list screen with location-based results
    navigation.navigate("PropertySearch", {
      initialLocation: userLocation,
      searchType: "nearby",
    });
  };

  // Show loading if location is being fetched
  if (locationLoading) {
    return (
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">
            {userRole === "KIRACI" ? "Yakındaki Evler" : "Yakındaki İlanlar"}
          </Text>
        </View>

        <View className="justify-center items-center py-8">
          <ActivityIndicator size="large" color="#A0E79E" />
          <Text className="text-gray-500 mt-2">Konum alınıyor...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    console.log("===== ERROR STATE =====");
    console.log("Error details:", error);
    console.log("Error data:", error?.data);
    console.log("Error status:", error?.status);
    console.log("Error message:", error?.message);
    console.log("======================");

    return (
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">
            {userRole === "KIRACI" ? "Yakındaki Evler" : "Yakındaki İlanlar"}
          </Text>
        </View>

        <View className="bg-red-50 rounded-xl p-4 border border-red-200">
          <Text className="text-red-600 text-center mb-2">
            Yakındaki evler yüklenirken bir hata oluştu
          </Text>
          <TouchableOpacity
            className="bg-red-500 rounded-lg py-2 px-4 self-center"
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <Text className="text-white text-sm font-medium">
              {isRefreshing ? "Yenileniyor..." : "Tekrar Dene"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xl font-bold text-gray-800">
            {userRole === "KIRACI" ? "Yakındaki Evler" : "Yakındaki İlanlar"}
          </Text>
          {allProperties.length > 0 && (
            <Text className="text-sm text-gray-500">
              {nearFromYouProperties.length} yakın • {nearbyProperties.length}{" "}
              önerilen
            </Text>
          )}
        </View>

        {allProperties.length > 0 && (
          <TouchableOpacity onPress={handleSeeAll}>
            <Text className="text-gray-400h font-normal">Tümünü Gör</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Refresh Button */}
      <View className="flex-row justify-end mb-2">
        <TouchableOpacity
          onPress={handleFullRefresh}
          disabled={isRefreshing || isLoadingNearby}
          className="flex-row items-center"
        >
          <Text className="text-[#A0E79E] text-sm mr-1">
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </Text>

        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoadingNearby || isRefreshing ? (
        <View className="justify-center items-center py-8">
          <ActivityIndicator size="large" color="#A0E79Ehh" />
          <Text className="text-gray-500 mt-2">
            {isRefreshing ? "Yenileniyor..." : "Yakındaki evler yükleniyor..."}
          </Text>
        </View>
      ) : allProperties.length > 0 ? (
        <FlatList
          data={allProperties}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.postId.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          className="pt-2"
          contentContainerStyle={{ paddingRight: 20 }}
        // Remove RefreshControl - only manual refresh button will work
        />
      ) : (
        <View className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <View className="items-center">
            <Text className="text-gray-600 text-center text-base mb-2">
              Yakınınızda henüz ilan bulunmuyor
            </Text>
            <Text className="text-gray-400 text-center text-sm">
              Arama kriterlerinizi genişletmeyi deneyin
            </Text>
          </View>
        </View>
      )}

      {/* Location Info */}
      {userLocation && (
        <Text className="text-xs text-gray-400 mt-2 text-center">
          Konum: {userLocation.latitude.toFixed(4)},{" "}
          {userLocation.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
};

export default NearbyProperties;
