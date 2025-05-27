import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
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

  // Log the response for debugging
  // useEffect(() => {
  //   if (nearbyData) {
  //     console.log("===== NEARBY PROPERTIES RESPONSE =====");
  //     console.log("Full Response:", JSON.stringify(nearbyData, null, 2));
  //     console.log("Best For You Array:", nearbyData?.result?.bestForYou);
  //     console.log(
  //       "Best For You Length:",
  //       nearbyData?.result?.bestForYou?.length || 0
  //     );
  //     console.log("Near From You Array:", nearbyData?.result?.nearFromYou);
  //     console.log(
  //       "Near From You Length:",
  //       nearbyData?.result?.nearFromYou?.length || 0
  //     );
  //     console.log("Combined Properties Length:", allProperties.length);
  //     console.log("Is Success:", nearbyData?.isSuccess);
  //     console.log("Message:", nearbyData?.message);
  //     console.log("Status Code:", nearbyData?.statusCode);

  //     if (nearFromYouProperties.length > 0) {
  //       console.log(
  //         "First Near Property:",
  //         JSON.stringify(nearFromYouProperties[0], null, 2)
  //       );
  //       console.log("Distance:", nearFromYouProperties[0].distanceInKM, "km");
  //     }
  //     if (nearbyProperties.length > 0) {
  //       console.log(
  //         "First Best For You Property:",
  //         JSON.stringify(nearbyProperties[0], null, 2)
  //       );
  //     }
  //     console.log("=====================================");
  //   }
  // }, [nearbyData, allProperties]);

  // Log API call parameters
  useEffect(() => {
    if (userLocation && currentUser?.id) {
      console.log("===== API CALL PARAMETERS =====");
      console.log("User ID:", currentUser.id);
      console.log("Latitude:", userLocation.latitude);
      console.log("Longitude:", userLocation.longitude);
      console.log("===============================");
    }
  }, [userLocation, currentUser?.id]);

  // Log loading and error states
  useEffect(() => {
    console.log("===== COMPONENT STATE =====");
    console.log("Is Loading Nearby:", isLoadingNearby);
    console.log("Is Refreshing:", isRefreshing);
    console.log("Location Loading:", locationLoading);
    console.log("Error:", error);
    console.log("User Location:", userLocation);
    console.log("===========================");
  }, [isLoadingNearby, isRefreshing, locationLoading, error, userLocation]);

  // Handle refresh from parent component
  useEffect(() => {
    if (refreshing && userLocation && currentUser?.id) {
      handleRefresh();
    }
  }, [refreshing, userLocation, currentUser?.id]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!userLocation || !currentUser?.id) return;

    console.log("===== MANUAL REFRESH STARTED =====");
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
      className="mr-4 bg-white rounded-xl overflow-hidden w-64 shadow-sm border border-gray-200"
      onPress={() => {
        // Navigate to property details
        navigation.navigate("PostDetail", { postId: item.postId });
      }}
    >
      {/* Property Image */}
      <View className="relative">
        <Image
          source={{
            uri:
              item.postImages && item.postImages.length > 0
                ? item.postImages[0].postImageUrl
                : "https://via.placeholder.com/300x200",
          }}
          className="w-full h-36"
          resizeMode="cover"
        />

        {/* Price Badge */}
        <View className="absolute top-2 right-2 bg-blue-500 rounded-lg px-2 py-1">
          <Text className="text-white text-xs font-bold">
            {item.kiraFiyati} {item.paraBirimi || "₺"}
          </Text>
        </View>

        {/* Distance Badge for Near Properties */}
        {item.distanceInKM !== undefined && (
          <View className="absolute top-2 left-2 bg-green-500 rounded-lg px-2 py-1">
            <Text className="text-white text-xs font-bold">
              {item.distanceInKM.toFixed(1)} km
            </Text>
          </View>
        )}
      </View>

      {/* Property Info */}
      <View className="p-3">
        <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
          {item.ilanBasligi || "İlan Başlığı"}
        </Text>

        <Text className="text-sm text-gray-500 mb-2" numberOfLines={1}>
          {item.ilce && item.il
            ? `${item.ilce}, ${item.il}`
            : "Konum bilgisi yok"}
        </Text>

        <Text className="text-base font-semibold text-blue-600 mb-2">
          {item.kiraFiyati} {item.paraBirimi || "₺"}
        </Text>

        {/* Property Features */}
        <View className="flex-row justify-between">
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-700">
              {item.odaSayisi || "N/A"} Oda
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs text-gray-700">
              {item.banyoSayisi || "N/A"} Banyo
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs text-gray-700">
              {item.brutMetreKare ? `${item.brutMetreKare}m²` : "N/A"}
            </Text>
          </View>
        </View>

        {/* Additional Info */}
        <View className="flex-row justify-between items-center mt-2">
          {item.mahalle && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              {item.mahalle}
            </Text>
          )}

          {/* Property Type Indicator */}
          {item.distanceInKM !== undefined ? (
            <Text className="text-xs text-green-600 font-medium">Yakın</Text>
          ) : (
            <Text className="text-xs text-blue-600 font-medium">Önerilen</Text>
          )}
        </View>
      </View>
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
          <ActivityIndicator size="large" color="#4A90E2" />
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
            <Text className="text-blue-500">Tümünü Gör</Text>
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
          <Text className="text-blue-500 text-sm mr-1">
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </Text>
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : (
            <Text className="text-blue-500">🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoadingNearby || isRefreshing ? (
        <View className="justify-center items-center py-8">
          <ActivityIndicator size="large" color="#4A90E2" />
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
