import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetNearbyPostsPaginatedQuery } from "../redux/api/apiSlice";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBed,
  faGrid2,
  faMoneyBills,
  faRuler,
  faShower,
  faCar,
  faCalendar,
  faBuilding,
  faCoins,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import {
  faChevronLeft,
  faFilter,
  faSliders,
} from "@fortawesome/pro-regular-svg-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// Skeleton Components
const ShimmerPlaceholder = ({ width, height, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.5, width * 1.5],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E5E7EB",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0.8)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: width * 1.5,
            height: "100%",
          }}
        />
      </Animated.View>
    </View>
  );
};

const PropertyListItemSkeleton = () => {
  return (
    <View
      style={{ marginHorizontal: 16 }}
      className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
    >
      {/* Image Skeleton */}
      <View className="relative">
        <ShimmerPlaceholder width={width - 32} height={350} borderRadius={25} />

        {/* Distance badge skeleton */}
        <View className="absolute top-3 left-3">
          <ShimmerPlaceholder width={70} height={28} borderRadius={14} />
        </View>

        {/* Status badge skeleton */}
        <View className="absolute top-3 right-3">
          <ShimmerPlaceholder width={50} height={28} borderRadius={14} />
        </View>

        {/* Pagination dots skeleton */}
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
          <View className="flex-row">
            {[1, 2, 3].map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="mt-4 px-1">
        {/* Title Skeleton */}
        <View className="items-start mb-1">
          <ShimmerPlaceholder
            width={width - 80}
            height={20}
            borderRadius={10}
            style={{ marginBottom: 8 }}
          />
          <ShimmerPlaceholder
            width={width - 120}
            height={16}
            borderRadius={8}
          />
        </View>

        {/* Location Skeleton */}
        <View className="mb-2 mt-2">
          <ShimmerPlaceholder width={150} height={14} borderRadius={7} />
        </View>

        {/* Price Skeleton */}
        <View className="flex-row items-center mb-3">
          <ShimmerPlaceholder width={120} height={18} borderRadius={9} />
          <View className="ml-2">
            <ShimmerPlaceholder width={25} height={14} borderRadius={7} />
          </View>
        </View>

        {/* Property Details Slider Skeleton */}
        <View className="mt-3">
          <View className="flex-row">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View
                key={index}
                className="items-center justify-center"
                style={{
                  marginRight: 46,
                  marginLeft: 3,
                  height: 85,
                }}
              >
                {/* Icon skeleton */}
                <ShimmerPlaceholder width={30} height={30} borderRadius={15} />

                {/* Value skeleton */}
                <ShimmerPlaceholder
                  width={40}
                  height={16}
                  borderRadius={8}
                  style={{ marginTop: 8 }}
                />

                {/* Label skeleton */}
                <ShimmerPlaceholder
                  width={35}
                  height={11}
                  borderRadius={5}
                  style={{ marginTop: 4 }}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* User Profile Section Skeleton */}
      <View className="flex flex-col">
        <View className="mb-5 pl-1 mt-3">
          <View className="flex-1 flex-row justify-between items-center w-full">
            {/* User info skeleton */}
            <View className="flex-row items-center">
              {/* Profile image skeleton */}
              <ShimmerPlaceholder
                width={48}
                height={48}
                borderRadius={24}
                style={{ marginRight: 12 }}
              />

              <View className="flex-col">
                {/* Name skeleton */}
                <ShimmerPlaceholder
                  width={120}
                  height={14}
                  borderRadius={7}
                  style={{ marginBottom: 4 }}
                />

                {/* Rating skeleton */}
                <ShimmerPlaceholder width={80} height={12} borderRadius={6} />
              </View>
            </View>

            {/* Time skeleton */}
            <ShimmerPlaceholder width={60} height={12} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
};

const PropertyListLoadingSkeleton = ({ count = 2 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <PropertyListItemSkeleton
          className="hidden"
          key={`property-skeleton-${index}`}
        />
      ))}
    </View>
  );
};

const AllNearbyPropertiesScreen = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Get initial location from route params if available
  const initialLocation = route.params?.initialLocation;

  const [userLocation, setUserLocation] = useState(initialLocation || null);
  const [locationLoading, setLocationLoading] = useState(!initialLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // UPDATED: Backend SortBy enum değerleri
  // 0: Distance, 1: PostTime, 2: KiraFiyati, 3: ViewCount, 4: UpdatedDate
  const [sortBy, setSortBy] = useState(0);
  const [sortDirection, setSortDirection] = useState(0); // 0: ASC, 1: DESC
  const [isMapView, setIsMapView] = useState(false);
  const [isMatch, setIsMatch] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allProperties, setAllProperties] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  // NEW: Filtre değişikliği loading state'i için
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  // OPTIMIZE EDİLDİ: Native driver ile animated değerler
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filter animasyonu için transform ve opacity kullanıyoruz (native driver için)
  const filterTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -60], // Filtreyi yukarı kaydır
    extrapolate: "clamp",
  });

  const filterOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  // Container height animasyonu (JS thread'de çalışır ama gerekli)
  const containerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [45, 0], // Container yüksekliğini 60px'den 0'a küçült
    extrapolate: "clamp",
  });

  // Get user's current location if not provided
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, [initialLocation]);

  // Reset pagination when filters change
  useEffect(() => {
    // Filtre değişikliği başladığında loading state'i set et
    setIsFilterChanging(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);

    // Kısa bir delay ile loading state'i kaldır (API çağrısı başlayınca)
    const timer = setTimeout(() => {
      setIsFilterChanging(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [sortBy, sortDirection, isMatch, userLocation]);

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

  // UPDATED: Fetch nearby properties with pagination and sortBy
  const {
    data: nearbyData,
    isLoading: isLoadingNearby,
    error,
    refetch,
  } = useGetNearbyPostsPaginatedQuery(
    {
      userId: currentUser?.id,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radiusKm: 50,
      page: currentPage,
      pageSize: 10,
      sortBy: sortBy, // Backend'e gönderilen sortBy parametresi
      sortDirection: sortDirection,
      isMatch: isMatch,
    },
    {
      skip: !userLocation || !currentUser?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  // Update properties when new data arrives
  useEffect(() => {
    if (nearbyData?.data) {
      const newProperties = nearbyData.data;
      const pagination = nearbyData.pagination;

      if (currentPage === 1) {
        // First page or refresh - replace all data
        setAllProperties(newProperties);
        // İlk sayfa yüklendiğinde filter loading'i kapat
        setIsFilterChanging(false);
      } else {
        // Subsequent pages - append to existing data
        setAllProperties((prev) => {
          // Remove duplicates based on postId
          const existingIds = new Set(prev.map((item) => item.postId));
          const uniqueNewItems = newProperties.filter(
            (item) => !existingIds.has(item.postId)
          );
          return [...prev, ...uniqueNewItems];
        });
      }

      // Update pagination state
      setHasNextPage(pagination?.hasNextPage || false);
    }
  }, [nearbyData, currentPage]);

  // UPDATED: Filter properties based on search query only
  // Backend'den gelen veriler zaten sortBy'a göre sıralanmış olarak geliyor
  const getFilteredProperties = () => {
    let filteredProperties = [...allProperties];

    // Apply search filter only - sorting is now handled by backend
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

    // Backend'den gelen veriler zaten sıralanmış olarak geliyor
    return filteredProperties;
  };

  const filteredProperties = getFilteredProperties();

  // Handle load more
  const handleLoadMore = () => {
    if (
      !isLoadingMore &&
      hasNextPage &&
      !isLoadingNearby &&
      !isFilterChanging
    ) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);
    setIsFilterChanging(false);
    try {
      await refetch();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // UPDATED: Sort handling
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // Same sort option - toggle direction
      setSortDirection((prev) => (prev === 0 ? 1 : 0));
    } else {
      // Different sort option - set new sort and default direction
      setSortBy(newSortBy);
      setSortDirection(0); // Default to ascending
    }
  };

  // UPDATED: Sort options mapping - Backend enum değerlerine göre
  const sortOptions = [
    { key: 0, label: "Uzaklık" }, // Distance
    { key: 2, label: "Fiyat" }, // KiraFiyati
    { key: 1, label: "Tarih" }, // PostTime
    { key: 3, label: "Görüntülenme" }, // ViewCount
    { key: 4, label: "Güncellenme" }, // UpdatedDate
  ];

  // Loading state effect
  useEffect(() => {
    if (currentPage > 1) {
      setIsLoadingMore(false);
    }
  }, [nearbyData]);

  // Relative time function
  const getRelativeTime = (postTime) => {
    if (!postTime) return "Tarih belirtilmemiş";

    const now = new Date();
    const postDate = new Date(postTime);

    // Invalid date check
    if (isNaN(postDate.getTime())) return "Geçersiz tarih";

    // Milisaniye cinsinden fark
    const diffMs = now.getTime() - postDate.getTime();

    // Saniye cinsinden fark
    const diffSeconds = Math.floor(diffMs / 1000);

    // Dakika cinsinden fark
    const diffMinutes = Math.floor(diffSeconds / 60);

    // Saat cinsinden fark
    const diffHours = Math.floor(diffMinutes / 60);

    // Gün cinsinden fark
    const diffDays = Math.floor(diffHours / 24);

    // Hafta cinsinden fark
    const diffWeeks = Math.floor(diffDays / 7);

    // Ay cinsinden fark
    const diffMonths = Math.floor(diffDays / 30);

    // Yıl cinsinden fark
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears} yıl önce`;
    } else if (diffMonths > 0) {
      return `${diffMonths} ay önce`;
    } else if (diffWeeks > 0) {
      return `${diffWeeks} hafta önce`;
    } else if (diffDays > 0) {
      return `${diffDays} gün önce`;
    } else if (diffHours > 0) {
      return `${diffHours} saat önce`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} dakika önce`;
    } else {
      return "Az önce";
    }
  };

  // Property Details Free Drag Slider Component
  const PropertyDetailsSlider = ({ item }) => {
    const propertyDetails = [
      {
        id: "rooms",
        icon: faBed,
        value: item.odaSayisi || "N/A",
        label: "Oda",
      },
      {
        id: "bathrooms",
        icon: faShower,
        value: item.banyoSayisi || "N/A",
        label: "Banyo",
      },
      {
        id: "area",
        icon: faRuler,
        value: item.brutMetreKare ? `${item.brutMetreKare} m²` : "N/A",
        label: "Alan",
      },
      {
        id: "floor",
        icon: faBuilding,
        value: item.bulunduguKat || "N/A",
        label: "Kat",
      },
      {
        id: "age",
        icon: faCalendar,
        value: item.binaYasi ? `${item.binaYasi}` : "N/A",
        label: "Bina yaşı",
      },
      {
        id: "dues",
        icon: faMoneyBills,
        value: item.aidat ? `${item.aidat}₺` : "Yok",
        label: "Aidat",
      },
      {
        id: "deposit",
        icon: faCoins,
        value: item.depozito ? `${item.depozito}₺` : "Yok",
        label: "Depozito",
      },
    ];

    return (
      <View className="mt-3">
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="normal"
          bounces={true}
          contentContainerStyle={{}}
        >
          {propertyDetails.map((detail, index) => (
            <View
              key={`${detail.id}-${index}`}
              className="items-center justify-center rounded-2xl"
              style={{
                width: "fit-content",
                marginRight: 46,
                marginLeft: 3,
                height: 85,
              }}
            >
              <FontAwesomeIcon size={30} icon={detail.icon} color="#000" />
              <Text
                style={{ fontSize: 16, fontWeight: 600 }}
                className="text-gray-800 mt-2 text-center"
                numberOfLines={1}
              >
                {detail.value}
              </Text>
              <Text
                style={{ fontSize: 11 }}
                className="text-gray-500 text-center"
                numberOfLines={1}
              >
                {detail.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Simple and reliable image slider component
  const PropertyImageSlider = ({ images, distance, status, postId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const handleScroll = (event) => {
      const slideSize = width - 32;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentIndex(index);
    };

    const handleDotPress = (index) => {
      setCurrentIndex(index);
      const slideSize = width - 32;
      scrollViewRef.current?.scrollTo({
        x: slideSize * index,
        animated: true,
      });
    };

    if (!images || images.length === 0) {
      return (
        <View className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 justify-center items-center rounded-3xl">
          <MaterialIcons name="home" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 font-medium">Resim yok</Text>
        </View>
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
          style={{ width: width - 32 }}
        >
          {images.map((item, index) => (
            <TouchableOpacity
              key={`image-${postId}-${index}`}
              style={{ width: width - 32 }}
              activeOpacity={1}
              onPress={() =>
                navigation.navigate("PostDetail", { postId: postId })
              }
            >
              <Image
                source={{ uri: item.postImageUrl }}
                style={{ width: width - 32, height: 350 }}
                contentFit="cover"
                transition={0}
                placeholder={{
                  uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
                }}
                cachePolicy="memory-disk"
                recyclingKey={`${postId}-${index}`}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Distance badge */}
        {!!(distance && distance > 0) && (
          <BlurView
            style={{ boxShadow: "0px 0px 12px #00000012" }}
            intensity={50}
            tint="dark"
            className="absolute top-3 left-3 rounded-full overflow-hidden"
          >
            <View className="px-3 py-1.5 rounded-full flex-row items-center">
              <MaterialIcons name="location-on" size={12} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                {distance.toFixed(1)} km
              </Text>
            </View>
          </BlurView>
        )}

        {/* Status badge */}
        <View className="absolute top-3 right-3">
          <BlurView
            intensity={50}
            tint="dark"
            style={{
              overflow: "hidden",
              borderRadius: 100,
              boxShadow: "0px 0px 12px #00000012",
            }}
            className="px-3 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              {status === 0 ? "Aktif" : status === 1 ? "Kiralandı" : "Kapalı"}
            </Text>
          </BlurView>
        </View>

        {/* Pagination dots */}
        {!!(images && images.length > 1) && (
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
  };

  console.log("filteredProperties:", filteredProperties);

  // Render property item
  const renderPropertyItem = ({ item }) => (
    <View
      style={{ marginHorizontal: 16 }}
      className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
    >
      {/* Image slider */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("PostDetail", { postId: item.postId })
        }
        activeOpacity={1}
      >
        <PropertyImageSlider
          images={item.postImages}
          distance={item.distance}
          status={item.status}
          postId={item.postId}
        />
      </TouchableOpacity>

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
            style={{ fontSize: 18, fontWeight: 500 }}
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

        {/* Property details slider */}
        <PropertyDetailsSlider item={item} />
      </View>
      <View className="flex flex-col">
        <View className="mb-5 pl-1 mt-3">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() =>
              navigation.navigate("LandlordProfile", {
                userId: item.userId,
              })
            }
          >
            <View className="flex-1 flex-row justify-between items-center w-full">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() =>
                  navigation.navigate("LandlordProfile", {
                    userId: item.userId,
                  })
                }
              >
                <View className="w-12 h-12 rounded-full justify-center items-center mr-3 border-gray-900 border">
                  {!!item.user?.profileImageUrl ? (
                    <Image
                      source={{ uri: item.user.profileImageUrl }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <View>
                      <Text className="text-xl font-bold text-gray-900">
                        {item.user?.name?.charAt(0) || "E"}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-col gap-1">
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-semibold text-gray-800"
                  >
                    {item.user?.name} {item.user?.surname}
                  </Text>
                  <View className="flex flex-row items-center gap-1">
                    <Text style={{ fontSize: 12 }} className="text-gray-500">
                      {item.matchScore
                        ? `Skor: ${item.matchScore.toFixed(1)}`
                        : "Rating"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text
                className="mb-2 pl-1 text-gray-500"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {getRelativeTime(item.postTime)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render load more footer - UPDATED with skeleton
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return <PropertyListLoadingSkeleton count={2} />;
  };

  // UPDATED: Render empty state - Show skeleton during filter changes
  const renderEmptyState = () => {
    // Show skeleton during filter changes or initial loading
    if (isFilterChanging || (isLoadingNearby && currentPage === 1)) {
      return <PropertyListLoadingSkeleton count={3} />;
    }

    // Show empty state only when not loading and no results
    return (
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
        {!!searchQuery && (
          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-lg"
            onPress={() => setSearchQuery("")}
          >
            <Text className="text-white font-semibold">Aramayı Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
    <SafeAreaView className="flex-1 bg-white">
      {/* Fixed search bar */}
      <View className="bg-white border-b border-gray-200 z-10">
        <View className="flex flex-row items-center px-5">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: "8%" }}
          >
            <FontAwesomeIcon icon={faChevronLeft} color="black" size={25} />
          </TouchableOpacity>

          <View className="px-4 py-4" style={{ width: "84%" }}>
            <View
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              className="bg-white rounded-3xl gap-2 px-4 flex-row items-center"
            >
              <TextInput
                className="w-full px-2 placeholder:text-gray-400 placeholder:text-[14px] py-4 text-normal"
                placeholder="Yakındaki ilanlar"
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
          <View style={{ width: "8%" }}>
            <TouchableOpacity onPress={() => setIsMatch(!isMatch)}>
              <FontAwesomeIcon
                icon={faSliders}
                color={isMatch ? "#4A90E2" : "black"}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter container */}
        <Animated.View
          style={{
            height: containerHeight,
            overflow: "hidden",
          }}
        >
          <Animated.View
            className="flex justify-center items-center"
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              height: 50,
              opacity: filterOpacity,
              transform: [{ translateY: filterTranslateY }],
            }}
          >
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                paddingHorizontal: 0,
              }}
              style={{ width: "100%" }}
            >
              <View className="flex-row">
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    activeOpacity={1}
                    key={option.key}
                    className={`mr-3 px-4 py-2 rounded-full border ${
                      sortBy === option.key
                        ? "bg-gray-900"
                        : "bg-white border-white"
                    }`}
                    onPress={() => handleSortChange(option.key)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        sortBy === option.key ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                      {sortBy === option.key && (
                        <Text className="ml-1">
                          {sortDirection === 0 ? " ↑" : " ↓"}
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Properties list with pagination */}
      <Animated.FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={(item, index) => `nearby_${item.postId}_${index}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
          }
        )}
        scrollEventThrottle={1}
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
