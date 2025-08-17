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
  faFingerprint
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { LoadingSkeleton } from "./LoadingSkeleton"; // Import the skeleton component
import { LinearGradient } from "expo-linear-gradient";
import { useFypCacheTracker } from "../hooks/useFypCacheTracker"; // YENİ IMPORT


const NearbyProperties = ({ navigation, onRefresh, refreshing }) => {
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


  const { cacheEnabled, calculateCacheStatus, resetCache, getCacheInfo } = useFypCacheTracker();

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


  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldCache, setShouldCache] = useState(false);


  // İlk mount'ta ve belirli aralıklarla cache durumunu kontrol et
  useEffect(() => {
    // İlk kontrolü yap
    const status = calculateCacheStatus();
    setShouldCache(status);

    // Her 5 saniyede bir cache durumunu kontrol et
    const interval = setInterval(() => {
      const newStatus = calculateCacheStatus();
      setShouldCache(newStatus);

      // Debug için
      console.log('📊 Cache durumu kontrolü:', getCacheInfo());
    }, 5000);

    return () => clearInterval(interval);
  }, [calculateCacheStatus, getCacheInfo]);

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
  // Fetch nearby properties using FYP API - UPDATED with cache
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
      isCached: shouldCache, // CACHE TRACKER KULLAN
    },
    {
      skip: !userLocation || !currentUser?.id,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
    }
  );

  // YENİ MANTIK: Veri kaynaklarını doğru şekilde organize et

  // 1. Yakınındaki Evler - Herkes için aynı (mülkler)
  const nearFromYouProperties = nearbyData?.result?.nearFromYou || [];

  // 2. İkinci bölüm verileri
  const getSecondSectionData = () => {
    if (userRole === "EVSAHIBI") {
      // Ev sahibi için: Size uygun kiracılar
      return nearbyData?.result?.bestTenantMatch || [];
    } else if (userRole === "KIRACI") {
      // Kiracı için: Size uygun ev sahipleri
      return nearbyData?.result?.bestLandlordMatch || [];
    }
    return [];
  };

  // 3. Üçüncü bölüm verileri
  const getThirdSectionData = () => {
    if (userRole === "EVSAHIBI") {
      // Ev sahibi için: Benzer ilanlar (mülkler)
      return nearbyData?.result?.similarPost || [];
    } else if (userRole === "KIRACI") {
      // Kiracı için: Sizin için önerilen (mülkler)
      return nearbyData?.result?.bestForYou || [];
    }
    return [];
  };

  const secondSectionData = getSecondSectionData();
  const thirdSectionData = getThirdSectionData();

  // Handle refresh from parent component
  useEffect(() => {
    if (refreshing && userLocation && currentUser?.id) {
      handleRefresh();
    }
  }, [refreshing, userLocation, currentUser?.id]);

  // Manual refresh handler - cache'i reset et
  const handleRefresh = async () => {
    if (!userLocation || !currentUser?.id) return;

    setIsRefreshing(true);
    try {
      // Cache'i reset et çünkü kullanıcı manuel refresh yapıyor
      resetCache();
      setShouldCache(false); // Cache state'ini hemen güncelle

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

  const handleFullRefresh = async () => {
    console.log("===== FULL REFRESH STARTED =====");
    setIsRefreshing(true);

    try {
      // Cache'i reset et
      resetCache();

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

  // Horizontal Property Card - Sadece 1. bölüm için kullanılacak
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
            {item.ilanBasligi || item.title || `${item.il} ${item.ilce} ${item.odaSayisi} Kiralık Daire`}
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
                ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${item.paraBirimi || item.currency || "₺"
                }`
                : "Fiyat belirtilmemiş"}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">/ay</Text>
          </View>
        </View>

        {/* Compatibility Level for recommended properties */}
        {item.matchScore && (
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

  // Vertical Property Card - 3. bölüm için kullanılacak (hem benzer ilanlar hem önerilen)
  const renderVerticalPropertyCard = ({ item }) => (
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
            {item.ilanBasligi || item.title || `${item.il} ${item.ilce} Kiralık Daire`}
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
              ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${item.paraBirimi || item.currency || "₺"
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

        {/* Oda ve banyo bilgileri */}
        <View className="flex flex-row gap-4 items-center">
          <View className="flex flex-row gap-2 items-center">
            <FontAwesomeIcon color="#6B7280" icon={faBath} />
            <Text style={{ fontSize: 12 }} className="text-gray-500">
              {item.banyoSayisi || "N/A"} Banyo
            </Text>
          </View>
          <View className="flex flex-row gap-2 items-center">
            <FontAwesomeIcon color="#6B7280" icon={faBed} />
            <Text style={{ fontSize: 12 }} className="text-gray-500">
              {item.odaSayisi || "N/A"} Yatak odası
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // UNIFIED Person Card - Hem kiracı hem ev sahibi için kullanılacak
  const renderPersonCard = ({ item }) => (
    <TouchableOpacity
      style={{ boxShadow: "0px 0px 12px #00000014", borderRadius: 25 }}
      activeOpacity={1}
      className="mr-4 mb-3 overflow-hidden w-72 flex flex-col bg-white border border-gray-200 p-4"
      onPress={() => {
        if (userRole === "EVSAHIBI") {
          // Ev sahibi kiracı profiline gidiyor
          navigation.navigate("UserProfile", {
            userId: item.userId,
            userRole: "KIRACI"
          });
        } else {
          // ✅ Kiracı da ev sahibi profiline gitsin
          navigation.navigate("UserProfile", {
            userId: item.landlordId || item.userId, // landlordId varsa onu kullan, yoksa userId
            userRole: "EVSAHIBI"
          });
        }
      }}
    >
      {/* Person Image and Basic Info */}
      <View className="flex-row items-center mb-3">
        <Image
          style={{ width: 60, height: 60, boxShadow: "0px 0px 12px #00000020" }}
          source={{
            uri: userRole === "EVSAHIBI"
              ? (item.tenantURL || "https://via.placeholder.com/60x60")
              : (item.landlordProfileURL || "https://via.placeholder.com/60x60")
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
            {userRole === "EVSAHIBI"
              ? (item.tenantName || "Kiracı")
              : (item.landlordName || "Ev Sahibi")
            }
          </Text>
          <View className="flex flex-row items-center gap-1">
            <Text className="text-gray-500" style={{ fontSize: 12 }}>
              Profili Görüntüle
            </Text>
            <FontAwesomeIcon size={12} color="#dee0ea" icon={faChevronRight} />
          </View>
        </View>
      </View>

      {/* Person Details */}
      <View className="space-y-2">
        {userRole === "EVSAHIBI" ? (
          // Kiracı detayları (ev sahibi için)
          <>
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
          </>
        ) : (
          // Ev sahibi detayları (kiracı için)
          <>
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
          </>
        )}

        {/* Compatibility Level - Her ikisi için de aynı */}
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

  const handleSeeAll = (type) => {
    console.log("handleSeeAll called with type:", type);

    // Type ve user role'e göre farklı navigation
    if (type === "similarPosts" || type === "recommendedForYou") {
      if (userRole === "EVSAHIBI") {
        // Ev sahibi benzer ilanlar
        navigation.navigate("AllSimilarProperties", {
          userLocation: userLocation,
          similarPosts: thirdSectionData,
          searchType: "general",
          landlordUserId: currentUser?.id,
        });
      } else {
        // Kiracı önerilen ilanlar
        navigation.navigate("AllRecommendedPosts");
      }
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
      // nearby ve diğerleri için AllNearbyProperties
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
    <View className="flex flex-col">
      {/* Loading skeleton state */}
      {isLoadingNearby || isRefreshing ? (
        <View>
          <LoadingSkeleton count={3} />
          {/* Show second skeleton if both sections will be visible */}
          <LoadingSkeleton count={3} />
        </View>
      ) : (
        <>
          {/* 1. BÖLÜM: Yakınındaki Evler - Herkes için aynı (mülkler) */}
          {nearFromYouProperties.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center px-5 mb-4">
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

          {/* 2. BÖLÜM: Kişiler - Ev sahibi için kiracılar, Kiracı için ev sahipleri */}
          {secondSectionData.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-5 mt-6 px-5">
                <View>
                  <Text
                    style={{ fontSize: 20 }}
                    className="font-semibold text-gray-900"
                  >
                    {userRole === "EVSAHIBI"
                      ? "Size Uygun Kiracılar"
                      : "Size Uygun Ev Sahipleri"}
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() =>
                    handleSeeAll(
                      userRole === "EVSAHIBI" ? "bestTenants" : "bestLandlords"
                    )
                  }
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              {/* Person List */}
              <FlatList
                style={{ paddingLeft: 16 }}
                data={secondSectionData}
                renderItem={renderPersonCard}
                keyExtractor={(item, index) =>
                  userRole === "EVSAHIBI"
                    ? `tenant_${item.tenantProfileId}_${index}`
                    : `landlord_${item.landlordProfileId}_${index}`
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

          {/* 3. BÖLÜM: Mülkler - Ev sahibi için benzer ilanlar, Kiracı için önerilen ilanlar */}
          {thirdSectionData.length > 0 && (
            <View className="">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4 mt-3 px-5">
                <View>
                  <Text
                    style={{ fontSize: 20 }}
                    className="font-semibold text-gray-900"
                  >
                    {userRole === "EVSAHIBI"
                      ? "Benzer İlanlar"
                      : "Sizin İçin Önerilen"}
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() =>
                    handleSeeAll(
                      userRole === "EVSAHIBI" ? "similarPosts" : "recommendedForYou"
                    )
                  }
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              {/* Vertical Properties List */}
              <FlatList
                style={{ paddingLeft: 16 }}
                data={thirdSectionData.slice(0, 4)}
                renderItem={renderVerticalPropertyCard}
                keyExtractor={(item, index) =>
                  `third_${item.postId}_${index}`
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
            secondSectionData.length === 0 &&
            thirdSectionData.length === 0 && (
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