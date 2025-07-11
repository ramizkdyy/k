import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetForYouPageQuery } from "../redux/api/apiSlice";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

const AllNearbyPropertiesScreen = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Get initial location from route params if available
  const initialLocation = route.params?.initialLocation;

  const [userLocation, setUserLocation] = useState(initialLocation || null);
  const [locationLoading, setLocationLoading] = useState(!initialLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // distance, price, date
  const [isMapView, setIsMapView] = useState(false);

  // Get user's current location if not provided
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, [initialLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
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
      setUserLocation({
        latitude: 41.0082,
        longitude: 28.9784,
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch nearby properties
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
      skip: !userLocation || !currentUser?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  const nearbyProperties = nearbyData?.result?.bestForYou || [];
  const nearFromYouProperties = nearbyData?.result?.nearFromYou || [];

  // Combine and deduplicate properties
  const allProperties = React.useMemo(() => {
    const combined = [...nearFromYouProperties, ...nearbyProperties];

    // Remove duplicates based on postId
    const uniqueProperties = combined.reduce((acc, current) => {
      const isDuplicate = acc.find((item) => item.postId === current.postId);
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueProperties;
  }, [nearFromYouProperties, nearbyProperties]);

  // Filter and sort properties
  const getFilteredAndSortedProperties = () => {
    let filteredProperties = [...allProperties];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (property) =>
          (property.ilanBasligi &&
            property.ilanBasligi.toLowerCase().includes(query)) ||
          (property.il && property.il.toLowerCase().includes(query)) ||
          (property.ilce && property.ilce.toLowerCase().includes(query)) ||
          (property.postDescription &&
            property.postDescription.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "distance":
        filteredProperties.sort((a, b) => {
          const distanceA = a.distanceInKM || 999;
          const distanceB = b.distanceInKM || 999;
          return distanceA - distanceB;
        });
        break;
      case "price":
        filteredProperties.sort((a, b) => {
          const priceA = a.kiraFiyati || 0;
          const priceB = b.kiraFiyati || 0;
          return priceA - priceB;
        });
        break;
      case "date":
        filteredProperties.sort((a, b) => {
          const dateA = new Date(a.createdDate || 0);
          const dateB = new Date(b.createdDate || 0);
          return dateB - dateA; // Newest first
        });
        break;
      default:
        break;
    }

    return filteredProperties;
  };

  const filteredProperties = getFilteredAndSortedProperties();

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Render property item
  const renderPropertyItem = ({ item }) => (
    <TouchableOpacity
      style={{ marginHorizontal: 16 }}
      className="bg-white rounded-2xl overflow-hidden mb-4 pt-4"
      onPress={() => navigation.navigate("PostDetail", { postId: item.postId })}
      activeOpacity={0.95}
    >
      <View className="relative">
        {/* Property image */}
        {item.postImages && item.postImages.length > 0 ? (
          <Image
            source={{ uri: item.postImages[0].postImageUrl }}
            style={{ width: "100%", height: 200, borderRadius: 25 }}
            contentFit="cover"
            transition={200}
            placeholder={{
              uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
            }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="w-full h-50 bg-gradient-to-br from-gray-100 to-gray-200 justify-center items-center">
            <MaterialIcons name="home" size={32} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 font-medium">Resim yok</Text>
          </View>
        )}

        {/* Distance badge */}
        {item.distanceInKM !== undefined && (
          <View className="absolute top-3 left-3">
            <View className="bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex-row items-center">
              <MaterialIcons name="location-on" size={12} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                {item.distanceInKM.toFixed(1)} km
              </Text>
            </View>
          </View>
        )}

        {/* Status badge */}
        <View className="absolute top-3 right-3">
          <View
            className={`px-3 py-1.5 rounded-full backdrop-blur-sm ${
              item.status === 0
                ? "bg-green-500/90"
                : item.status === 1
                ? "bg-green-500/90"
                : "bg-gray-500/90"
            }`}
          >
            <Text className="text-white text-xs font-semibold">
              {item.status === 0
                ? "Aktif"
                : item.status === 1
                ? "Kiralandı"
                : "Kapalı"}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-4 px-1">
        {/* Title and Price */}
        <View className="items-start mb-1">
          <Text
            style={{ fontSize: 18, fontWeight: 700 }}
            className="text-gray-800 mb-"
            numberOfLines={2}
          >
            {item.ilanBasligi || "İlan başlığı yok"}
          </Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Text style={{ fontSize: 12 }} className=" text-gray-500">
            {item.ilce && item.il
              ? `${item.ilce}, ${item.il}`
              : item.il || "Konum belirtilmemiş"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text
            style={{ fontSize: 18, fontWeight: 400 }}
            className="text-gray-900 underline"
          >
            {item.kiraFiyati || item.rent
              ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${
                  item.paraBirimi || item.currency || "₺"
                }`
              : "Fiyat belirtilmemiş"}
          </Text>
          <Text className="text-sm text-gray-400 ml-1">/ay</Text>
        </View>

        {/* Location */}

        {/* Description */}
        <Text
          numberOfLines={2}
          className="text-gray-600 text-sm mb-4 leading-5"
        >
          {item.postDescription || "Açıklama yok"}
        </Text>

        {/* Property details */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
            <MaterialIcons name="king-bed" size={16} color="#6B7280" />
            <Text className="text-xs text-gray-700 ml-1 font-medium">
              {item.odaSayisi} Oda
            </Text>
          </View>

          <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
            <MaterialIcons name="bathtub" size={16} color="#6B7280" />
            <Text className="text-xs text-gray-700 ml-1 font-medium">
              {item.banyoSayisi} Banyo
            </Text>
          </View>

          <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
            <MaterialIcons name="square-foot" size={16} color="#6B7280" />
            <Text className="text-xs text-gray-700 ml-1 font-medium">
              {item.brutMetreKare} m²
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render header
  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200 pb-4">
      {/* Title and location info */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          Yakındaki Evler
        </Text>
        {userLocation && (
          <Text className="text-sm text-gray-500">
            {filteredProperties.length} ilan bulundu • Konum:{" "}
            {userLocation.latitude.toFixed(4)},{" "}
            {userLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Search bar */}
      <View className="px-4 mb-3">
        <View className="bg-gray-50 rounded-lg flex-row items-center px-3 py-2 border border-gray-200">
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 text-base ml-2"
            placeholder="İlan ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort options */}
      <View className="px-4">
        <Text className="text-sm text-gray-600 mb-2">Sırala:</Text>
        <View className="flex-row">
          {[
            { key: "distance", label: "Uzaklık" },
            { key: "price", label: "Fiyat" },
            { key: "date", label: "Tarih" },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              className={`mr-3 px-4 py-2 rounded-full border ${
                sortBy === option.key
                  ? "bg-green-500 border-green-500"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => setSortBy(option.key)}
            >
              <Text
                className={`text-sm font-medium ${
                  sortBy === option.key ? "text-white" : "text-gray-700"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-8">
      <MaterialIcons name="location-off" size={64} color="#CBD5E0" />
      <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
        Yakınında ilan bulunamadı
      </Text>
      <Text className="text-base text-gray-500 text-center mb-6">
        {searchQuery
          ? "Arama kriterlerinize uygun yakındaki ilan bulunamadı."
          : "Yakınınızda henüz ilan bulunmuyor. Daha sonra tekrar kontrol edin."}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg"
          onPress={() => setSearchQuery("")}
        >
          <Text className="text-white font-semibold">Aramayı Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Show loading state
  if (locationLoading || (!userLocation && isLoadingNearby)) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text className="mt-3 text-base text-gray-500">
            {locationLoading
              ? "Konum alınıyor..."
              : "Yakındaki evler yükleniyor..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
            Bir hata oluştu
          </Text>
          <Text className="text-base text-gray-500 text-center mb-6">
            Yakındaki evler yüklenirken bir sorun oluştu.
          </Text>
          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-semibold">Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={(item, index) => `nearby_${item.postId}_${index}`}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A90E2"]}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 16,
        }}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={8}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

export default AllNearbyPropertiesScreen;
