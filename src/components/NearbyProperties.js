import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Animated,
} from "react-native";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetForYouPageQuery } from "../redux/api/apiSlice";
import * as Location from "expo-location";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import {
  faList,
  faRoad,
  faUser,
  faHeart,
  faLocationDot,
  faBath,
  faBed,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { LoadingSkeleton } from "./LoadingSkeleton"; // Import the skeleton component
import { LinearGradient } from "expo-linear-gradient";

const NearbyProperties = ({ navigation, onRefresh, refreshing }) => {
  // Match Score gösterim fonksiyonu
  const getMatchScoreInfo = (score) => {
    if (score >= 80)
      return {
        level: "excellent",
        color: "#86efac",
        text: "Mükemmel",
        bgColor: "#dcfce7",
      };
    if (score >= 60)
      return {
        level: "good",
        color: "#9cf0ba",
        text: "Çok İyi",
        bgColor: "#dbeafe",
      };
    if (score >= 40)
      return {
        level: "medium",
        color: "#f59e0b",
        text: "İyi",
        bgColor: "#fef3c7",
      };
    return {
      level: "weak",
      color: "#ef4444",
      text: "Orta",
      bgColor: "#fee2e2",
    };
  };

  // Match Score Bar Component
  const MatchScoreBar = ({ matchScore, showBar = false, size = "sm" }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    const scoreInfo = getMatchScoreInfo(matchScore);

    // Boyut ayarları
    const sizes = {
      xs: {
        barHeight: 2,
        iconSize: 10,
        textSize: 11,
        containerPadding: 1,
        barWidth: 180,
      },
      sm: {
        barHeight: 5,
        iconSize: 12,
        textSize: 12,
        containerPadding: 2,
        barWidth: 180,
      },
      md: {
        barHeight: 4,
        iconSize: 14,
        textSize: 14,
        containerPadding: 3,
        barWidth: 180,
      },
    };

    const currentSize = sizes[size];

    // Score değiştiğinde debounce ile animasyonu başlat
    useEffect(() => {
      // Önceki timeout'u temizle
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Yeni timeout ayarla
      timeoutRef.current = setTimeout(() => {
        Animated.timing(progressAnim, {
          toValue: matchScore,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }, 200);

      // Cleanup function
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [matchScore]);

    if (showBar) {
      return (
        <View style={{ marginTop: currentSize.containerPadding * 2 }}>
          {/* Uyum Barı */}
          <View className="flex-row items-center">
            <View
              className="bg-gray-100 rounded-full overflow-hidden"
              style={{
                height: currentSize.barHeight,
                width: currentSize.barWidth,
                marginRight: 6,
              }}
            >
              <Animated.View
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                    extrapolate: "clamp",
                  }),
                  backgroundColor: scoreInfo.color,
                  height: "100%",
                  borderRadius: currentSize.barHeight / 2,
                }}
              />
            </View>
            <Text
              className="font-medium ml-1"
              style={{
                color: scoreInfo.color,
                fontSize: currentSize.textSize,
              }}
            >
              {matchScore}%
            </Text>
          </View>
        </View>
      );
    }

    // Sadece skor gösterimi (bar olmadan)
    return (
      <View className="flex-row items-center">
        <FontAwesomeIcon
          color={scoreInfo.color}
          icon={faHeart}
          size={currentSize.iconSize}
        />
        <Text
          className="font-medium ml-1"
          style={{
            color: scoreInfo.color,
            fontSize: currentSize.textSize,
          }}
        >
          {matchScore}% {scoreInfo.text}
        </Text>
      </View>
    );
  };
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
      skip: !userLocation || !currentUser?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  // Get data based on user role
  const getBestForYouData = () => {
    if (userRole === "KIRACI") {
      // For tenants, use bestForYou from response (properties)
      return nearbyData?.result?.bestForYou || [];
    } else if (userRole === "EVSAHIBI") {
      // For landlords, use bestTenantMatch from response (tenants)
      return nearbyData?.result?.bestTenantMatch || [];
    }
    return [];
  };

  const getBestLandlordData = () => {
    if (userRole === "KIRACI") {
      // For tenants, show best landlord matches
      return nearbyData?.result?.bestLandlordMatch || [];
    }
    return [];
  };

  // Get similar posts for landlords (EVSAHIBI)
  const getSimilarPostsData = () => {
    if (userRole === "EVSAHIBI") {
      return nearbyData?.result?.similarPost || [];
    }
    return [];
  };

  const nearbyProperties = getBestForYouData();
  const nearFromYouProperties = nearbyData?.result?.nearFromYou || [];
  const bestLandlordMatches = getBestLandlordData();
  const similarPosts = getSimilarPostsData();

  // Handle refresh from parent component
  useEffect(() => {
    if (refreshing && userLocation && currentUser?.id) {
      handleRefresh();
    }
  }, [refreshing, userLocation, currentUser?.id]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!userLocation || !currentUser?.id) return;

    setIsRefreshing(true);
    try {
      const result = await refetch();
      console.log("Refetch Result:", result);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
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

  // Benzer ilanlar için yeni render fonksiyonu - solda resim, sağda bilgiler
  const renderSimilarPostCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      className="overflow-hidden w-full flex flex-row items-center gap-4 py-2"
      onPress={() => {
        navigation.navigate("PostDetail", { postId: item.postId });
      }}
    >
      {/* Sol taraf - Resim */}
      <View className="relative">
        <Image
          style={{ width: 80, height: 80, boxShadow: "0px 0px 12px #00000014" }}
          source={{
            uri:
              item.postImages && item.postImages.length > 0
                ? item.postImages[0].postImageUrl
                : item.firstPostİmageURL ||
                  "https://via.placeholder.com/120x120",
          }}
          className="rounded-2xl border border-gray-100"
          resizeMode="cover"
        />
      </View>

      {/* Sağ taraf - Bilgiler */}
      <View className="flex-1 flex flex-col">
        {/* Üst kısım - Başlık */}
        <View>
          <Text
            style={{ fontSize: 16, fontWeight: 600 }}
            className="text-gray-800 mb-2"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.ilanBasligi || item.title || "İlan Başlığı"}
          </Text>
        </View>

        {/* Alt kısım - Fiyat ve match score */}
        <View>
          {/* Fiyat */}
          <Text
            style={{ fontSize: 14, fontWeight: 600 }}
            className="text-gray-400 mb-2"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.kiraFiyati || item.rent
              ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${
                  item.paraBirimi || item.currency || "₺"
                }`
              : "Fiyat belirtilmemiş"}
          </Text>

          {/* Match Score */}
          {item.matchScore && (
            <MatchScoreBar
              matchScore={item.matchScore}
              showBar={true}
              size="xs"
            />
          )}
        </View>

        {/* Konum */}
        {/* <View className="flex-row items-center gap-1 mb-2">
          <FontAwesomeIcon size={12} color="#9CA3AF" icon={faLocationDot} />
          <Text
            className="text-gray-500 text-sm flex-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.ilce && item.il
              ? `${item.ilce}, ${item.il}`
              : item.location || "Konum bilgisi yok"}
          </Text>
        </View> */}
        <View className="flex flex-row gap-4 items-center">
          <View className="flex flex-row gap-2 items-center">
            <FontAwesomeIcon color="#6B7280" icon={faBath} />
            <Text style={{ fontSize: 12 }} className="text-gray-500">
              {item.banyoSayisi} Banyo
            </Text>
          </View>
          <View className="flex flex-row gap-2 items-center">
            <FontAwesomeIcon color="#6B7280" icon={faBed} />
            <Text style={{ fontSize: 12 }} className="text-gray-500">
              {item.banyoSayisi} Yatak odası
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render property card for KIRACI (tenant)
  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      className="overflow-hidden w-72 flex flex-col px-3 py-3"
      onPress={() => {
        navigation.navigate("PostDetail", { postId: item.postId });
      }}
    >
      {/* Image Container with Overlay */}
      <View className="relative ">
        {/* Background Image */}
        <Image
          style={{
            height: 230,
            borderRadius: 30,
            boxShadow: "0px 0px 12px #00000024",
          }}
          source={{
            uri:
              item.postImages && item.postImages.length > 0
                ? item.postImages[0].postImageUrl
                : item.firstPostİmageURL ||
                  "https://via.placeholder.com/300x200",
          }}
          className="w-full "
          resizeMode="cover"
        />

        {/* Distance Badge */}
        {(item.distanceInKM !== undefined || item.distance !== undefined) && (
          <BlurView
            intensity={50}
            tint="dark"
            className="absolute top-3 left-3 rounded-full overflow-hidden"
          >
            <View className="px-2 py-1.5 flex-row items-center gap-1">
              <FontAwesomeIcon color="white" icon={faRoad} size={14} />
              <Text className="text-white text-xs font-semibold">
                {item.distanceInKM
                  ? item.distanceInKM.toFixed(1)
                  : item.distance !== undefined
                  ? item.distance.toFixed(1)
                  : "0.0"}{" "}
                km
              </Text>
            </View>
          </BlurView>
        )}

        {/* Match Score Badge */}
        {item.matchScore && (
          <BlurView
            intensity={60}
            tint="dark"
            className="absolute top-3 right-3 rounded-full overflow-hidden"
          >
            <View className="px-3 py-1.5 flex-row items-center gap-1">
              <FontAwesomeIcon color="white" icon={faHeart} size={14} />
              <Text className="text-white text-xs font-semibold">
                {item.matchScore}%
              </Text>
            </View>
          </BlurView>
        )}
      </View>

      {/* Property Details - Below Image */}
      <View className="py-3 px-1">
        <View className="">
          {/* Title - On Light Gradient */}
          <Text
            style={{ fontSize: 16, fontWeight: 600 }}
            className="text-gray-800"
            numberOfLines={2}
          >
            {item.il} {item.ilce} {item.odaSayisi} Kiralık Daire
          </Text>
        </View>
        <View className="flex justify-between flex-row items-center mt-1">
          {/* Price */}
          <View className="flex-row items-center">
            <Text
              style={{ fontSize: 14, fontWeight: 400 }}
              className="text-gray-500"
            >
              {item.kiraFiyati || item.rent
                ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${
                    item.paraBirimi || item.currency || "₺"
                  }`
                : "Fiyat belirtilmemiş"}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">/ay</Text>
          </View>
        </View>

        {/* Compatibility Level for recommended properties */}
        {item.compatibilityLevel && item.matchScore && (
          <View className="mt-2">
            <MatchScoreBar
              matchScore={item.matchScore}
              showBar={true}
              size="sm"
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render tenant card for EVSAHIBI (landlord)
  const renderTenantCard = ({ item }) => (
    <TouchableOpacity
      style={{ boxShadow: "0px 0px 12px #00000014", borderRadius: 25 }}
      activeOpacity={1}
      className="mr-4 mb-3 overflow-hidden w-72 flex flex-col bg-white border border-gray-200 p-4"
      onPress={() => {
        // Navigate to tenant profile or contact screen
        navigation.navigate("TenantProfile", {
          tenantId: item.tenantProfileId,
        });
      }}
    >
      {/* Tenant Image and Basic Info */}
      <View className="flex-row items-center mb-3">
        <Image
          style={{ width: 60, height: 60, boxShadow: "0px 0px 12px #00000020" }}
          source={{
            uri: item.tenantURL || "https://via.placeholder.com/60x60",
          }}
          className="rounded-full border border-gray-100"
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          <Text
            style={{ fontSize: 16, fontWeight: 700 }}
            className="text-gray-800 mb-1"
            numberOfLines={1}
          >
            {item.tenantName || "Kiracı"}
          </Text>
          <View className="flex flex-row items-center gap-1">
            {" "}
            <Text className="text-gray-500" style={{ fontSize: 12 }}>
              Profili görüntüle
            </Text>
            <FontAwesomeIcon size={12} color="#dee0ea" icon={faChevronRight} />
          </View>
        </View>
      </View>

      {/* Tenant Details */}
      <View className="space-y-2">
        {/* Budget */}
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Bütçe:</Text>
          <Text className="text-gray-800 text-sm font-medium">
            {item.details?.budget?.toLocaleString()} ₺
          </Text>
        </View>

        {/* Preferred Location */}
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Tercih Edilen Bölge:</Text>
          <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>
            {item.details?.preferredLocation || "Belirtilmemiş"}
          </Text>
        </View>

        {/* Room Preference */}
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Min. Oda Sayısı:</Text>
          <Text className="text-gray-800 text-sm font-medium">
            {item.details?.minRooms || "Belirtilmemiş"}
          </Text>
        </View>

        {/* Compatibility Level */}
        <View className="py-1">
          <MatchScoreBar
            matchScore={item.matchScore}
            showBar={true}
            size="sm"
          />

          {/* Match Reasons */}
          {item.matchReasons && item.matchReasons.length > 0 && (
            <Text style={{ fontSize: 12 }} className="text-gray-500 mt-2">
              {item.matchReasons[0]}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render landlord card for KIRACI (tenant)
  const renderLandlordCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      className="mr-4 overflow-hidden w-72 flex flex-col bg-white border border-gray-200 rounded-2xl p-4"
      onPress={() => {
        navigation.navigate("PostDetail", { postId: item.propertyId });
      }}
    >
      {/* Landlord Image and Basic Info */}
      <View className="flex-row items-center mb-3">
        <Image
          style={{ width: 60, height: 60 }}
          source={{
            uri: item.landlordProfileURL || "https://via.placeholder.com/60x60",
          }}
          className="rounded-full"
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          <Text
            style={{ fontSize: 16, fontWeight: 700 }}
            className="text-gray-800 mb-1"
            numberOfLines={1}
          >
            {item.landlordName || "Ev Sahibi"}
          </Text>

          {/* Match Score */}
          <View className="flex-row items-center">
            <MatchScoreBar
              matchScore={item.matchScore}
              showBar={true}
              size="xs"
            />
          </View>
        </View>
      </View>

      {/* Property Details */}
      <View className="space-y-2">
        {/* Property Title */}
        <Text
          style={{ fontSize: 14, fontWeight: 600 }}
          className="text-gray-800 mb-2"
          numberOfLines={2}
        >
          {item.propertyTitle || "Mülk Başlığı"}
        </Text>

        {/* Rent */}
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Kira:</Text>
          <Text className="text-gray-800 text-sm font-medium">
            {item.rent?.toLocaleString()} {item.currency || "₺"}
          </Text>
        </View>

        {/* Location */}
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Konum:</Text>
          <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>
            {item.location || "Konum bilgisi yok"}
          </Text>
        </View>

        {/* Property Details */}
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Detaylar:</Text>
          <Text className="text-gray-800 text-sm font-medium">
            {item.propertyDetails?.rooms || "N/A"} •{" "}
            {item.propertyDetails?.size || "N/A"}m²
          </Text>
        </View>

        {/* Compatibility Level */}
        <View className="mt-2 pt-2 border-t border-gray-100">
          <MatchScoreBar
            matchScore={item.matchScore}
            showBar={true}
            size="sm"
          />

          {/* Match Reasons */}
          {item.matchReasons && item.matchReasons.length > 0 && (
            <Text className="text-xs text-gray-500 mt-1">
              {item.matchReasons[0]}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSeeAll = (type) => {
    console.log("handleSeeAll called with type:", type); // Debug için

    // Type ve user role'e göre farklı navigation
    if (type === "similarPosts") {
      // Benzer ilanlar için AllSimilarProperties
      navigation.navigate("AllSimilarProperties", {
        userLocation: userLocation,
        similarPosts: similarPosts,
        searchType: "general", // ✅ Açık olarak belirt
        landlordUserId: currentUser?.id, // ✅ Mevcut kullanıcının ID'si
        // postId genellikle belirli bir post'a benzer ilanlar için kullanılır
        // Bu durumda genel benzer ilanlar olduğu için gerek yok
      });
    } else if (type === "bestTenants") {
      // Size uygun kiracılar için AllMatchingUsers (landlord için)
      navigation.navigate("AllMatchingUsers", {
        initialLocation: userLocation,
        searchType: type,
      });
    } else if (type === "bestLandlords") {
      // Size uygun ev sahipleri için AllMatchingUsers (tenant için)
      navigation.navigate("AllMatchingUsers", {
        initialLocation: userLocation,
        searchType: type,
      });
    } else {
      // nearby, bestForYou ve diğerleri için AllNearbyProperties
      navigation.navigate("AllNearbyProperties", {
        initialLocation: userLocation,
        searchType: type,
      });
    }
  };

  // Show loading skeleton if location is being fetched
  if (locationLoading) {
    return (
      <View className="mb-6">
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex flex-col">
        <View className="">
          <LoadingSkeleton count={3} />
        </View>
        <View className="mb-6">
          <LoadingSkeleton count={3} />
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6 flex flex-col">
      {/* Loading skeleton state */}
      {isLoadingNearby || isRefreshing ? (
        <View>
          <LoadingSkeleton count={3} />
          {/* Show second skeleton if both sections will be visible */}
          <LoadingSkeleton count={3} />
        </View>
      ) : (
        <>
          {/* Near From You Section - Always show properties */}
          {nearFromYouProperties.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center px-5 mb-6 mt-6 ">
                <View>
                  <Text
                    style={{ fontSize: 20 }}
                    className="font-semibold text-gray-900"
                  >
                    Yakınındaki Evler
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() => handleSeeAll("nearby")}
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              {/* Properties List */}
              <FlatList
                style={{ paddingLeft: 16 }}
                data={nearFromYouProperties}
                renderItem={renderPropertyCard}
                keyExtractor={(item, index) => `near_${item.postId}_${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                contentContainerStyle={{ paddingRight: 20 }}
                onScrollBeginDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: false,
                  });
                }}
                onScrollEndDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
                onMomentumScrollEnd={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
              />
            </View>
          )}

          {/* Best For You Section - Different content based on user role */}
          {nearbyProperties.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-5 mt-6 px-5">
                <View>
                  <Text
                    style={{ fontSize: 20 }}
                    className="font-semibold text-gray-900"
                  >
                    {userRole === "KIRACI"
                      ? "Sizin İçin Önerilen"
                      : "Size Uygun Kiracılar"}
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() =>
                    handleSeeAll(
                      userRole === "KIRACI" ? "bestForYou" : "bestTenants"
                    )
                  }
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              {/* List - Properties for tenants, Tenants for landlords */}
              <FlatList
                style={{ paddingLeft: 16 }}
                data={nearbyProperties}
                renderItem={
                  userRole === "KIRACI" ? renderPropertyCard : renderTenantCard
                }
                keyExtractor={(item, index) =>
                  userRole === "KIRACI"
                    ? `best_${item.postId}_${index}`
                    : `tenant_${item.tenantProfileId}_${index}`
                }
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                onScrollBeginDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: false,
                  });
                }}
                onScrollEndDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
                onMomentumScrollEnd={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
              />
            </View>
          )}

          {/* Best Landlord Matches Section - Only for tenants */}
          {userRole === "KIRACI" && bestLandlordMatches.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-5 mt-6 px-5">
                <View>
                  <Text
                    style={{ fontSize: 20 }}
                    className="font-semibold text-gray-900"
                  >
                    Size Uygun Ev Sahipleri
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() => handleSeeAll("bestLandlords")}
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              {/* Landlords List */}
              <FlatList
                style={{ paddingLeft: 16 }}
                data={bestLandlordMatches}
                renderItem={renderLandlordCard}
                keyExtractor={(item, index) =>
                  `landlord_${item.landlordProfileId}_${index}`
                }
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                onScrollBeginDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: false,
                  });
                }}
                onScrollEndDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
                onMomentumScrollEnd={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
              />
            </View>
          )}

          {/* Similar Posts Section - Only for landlords (EVSAHIBI) */}
          {userRole === "EVSAHIBI" && similarPosts.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4 mt-3 px-5">
                <View>
                  <Text
                    style={{ fontSize: 20 }}
                    className="font-semibold text-gray-900"
                  >
                    Benzer İlanlar
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() => handleSeeAll("similarPosts")}
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              {/* Similar Posts List */}
              <FlatList
                style={{ paddingLeft: 16, marginBottom: 60 }}
                data={similarPosts.slice(0, 4)}
                renderItem={renderSimilarPostCard}
                keyExtractor={(item, index) =>
                  `similar_${item.postId}_${index}`
                }
                vertical
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                onScrollBeginDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: false,
                  });
                }}
                onScrollEndDrag={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
                onMomentumScrollEnd={() => {
                  navigation.getParent()?.setOptions({
                    swipeEnabled: true,
                  });
                }}
              />
            </View>
          )}

          {/* Empty State - Only show if relevant arrays are empty */}
          {nearFromYouProperties.length === 0 &&
            nearbyProperties.length === 0 &&
            (userRole !== "KIRACI" || bestLandlordMatches.length === 0) &&
            (userRole !== "EVSAHIBI" || similarPosts.length === 0) && (
              <View
                style={{ marginTop: 180 }}
                className="flex-1 justify-center items-center"
              >
                <View className="rounded-xl p-6 bg-white">
                  <View className="items-center">
                    <FontAwesomeIcon
                      size={60}
                      icon={userRole === "KIRACI" ? faList : faUser}
                    />
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-500 text-center font-semibold mb-1 mt-2"
                    >
                      {userRole === "KIRACI"
                        ? "Yakınınızda henüz ilan bulunmuyor"
                        : "Henüz size uygun kiracı bulunmuyor"}
                    </Text>
                    <Text className="text-gray-400 text-center text-sm">
                      {userRole === "KIRACI"
                        ? "Arama kriterlerinizi genişletmeyi deneyin"
                        : "Profilinizi güncelleyerek daha fazla eşleşme elde edebilirsiniz"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
        </>
      )}
    </View>
  );
};

export default NearbyProperties;
