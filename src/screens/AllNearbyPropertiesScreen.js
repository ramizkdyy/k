import React, { useState, useEffect, useRef, memo, useCallback } from "react";
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
  faBedBunk,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import {
  faChevronLeft,
  faFilter,
  faSliders,
} from "@fortawesome/pro-regular-svg-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// Memoized Skeleton Components
const ShimmerPlaceholder = memo(
  ({ width, height, borderRadius = 8, style }) => {
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
  }
);

const PropertyListItemSkeleton = memo(() => {
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

        <View className="mb-2 mt-2">
          <ShimmerPlaceholder width={150} height={14} borderRadius={7} />
        </View>

        <View className="flex-row items-center mb-3">
          <ShimmerPlaceholder width={120} height={18} borderRadius={9} />
          <View className="ml-2">
            <ShimmerPlaceholder width={25} height={14} borderRadius={7} />
          </View>
        </View>

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
                <ShimmerPlaceholder width={30} height={30} borderRadius={15} />
                <ShimmerPlaceholder
                  width={40}
                  height={16}
                  borderRadius={8}
                  style={{ marginTop: 8 }}
                />
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

      <View className="flex flex-col">
        <View className="mb-5 pl-1 mt-3">
          <View className="flex-1 flex-row justify-between items-center w-full">
            <View className="flex-row items-center">
              <ShimmerPlaceholder
                width={48}
                height={48}
                borderRadius={24}
                style={{ marginRight: 12 }}
              />
              <View className="flex-col">
                <ShimmerPlaceholder
                  width={120}
                  height={14}
                  borderRadius={7}
                  style={{ marginBottom: 4 }}
                />
                <ShimmerPlaceholder width={80} height={12} borderRadius={6} />
              </View>
            </View>
            <ShimmerPlaceholder width={60} height={12} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
});

const PropertyListLoadingSkeleton = memo(({ count = 2 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <PropertyListItemSkeleton key={`property-skeleton-${index}`} />
      ))}
    </View>
  );
});

// Memoized Property Details Slider
const PropertyDetailsSlider = memo(({ item }) => {
  const propertyDetails = [
    { id: "rooms", icon: faBed, value: item.odaSayisi || "N/A", label: "Oda" },
    {
      id: "bedrooms",
      icon: faBedBunk,
      value: item.yatakOdasiSayisi || "N/A",
      label: "Y.Odası",
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
});

// Memoized Image Slider
const PropertyImageSlider = memo(
  ({ images, distance, status, postId, onPress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const handleScroll = useCallback((event) => {
      const slideSize = width - 32;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentIndex(index);
    }, []);

    const handleDotPress = useCallback((index) => {
      setCurrentIndex(index);
      const slideSize = width - 32;
      scrollViewRef.current?.scrollTo({ x: slideSize * index, animated: true });
    }, []);

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
              onPress={onPress}
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
            style={{ overflow: "hidden", borderRadius: 100 }}
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
  }
);

// Memoized Property Item - EN ÖNEMLİ PERFORMANCE OPTIMIZATION
const PropertyItem = memo(
  ({ item, navigation, getRelativeTime }) => {
    const handleImagePress = useCallback(() => {
      navigation.navigate("PostDetail", { postId: item.postId });
    }, [item.postId, navigation]);

    const handleProfilePress = useCallback(() => {
      console.log("PROFILE NAVIGATION DATA:", JSON.stringify(item, null, 2));
      console.log("userId:", item.userId);

      navigation.navigate('UserProfile', {
        userId: item.userId, // Doğru userId
        userRole: "EVSAHIBI", // Sabit değer
        matchScore: item.matchScore,
      });
    }, [item, navigation]); // item'i dependency array'e eklemeyi unutmayın

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
        />

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
                ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${item.paraBirimi || item.currency || "₺"
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
              onPress={handleProfilePress}
            >
              <View className="flex-1 flex-row justify-between items-center w-full">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={handleProfilePress}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.item.postId === nextProps.item.postId &&
      prevProps.item.matchScore === nextProps.item.matchScore
    );
  }
);

const AllNearbyPropertiesScreen = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const initialLocation = route.params?.initialLocation;

  // State
  const [userLocation, setUserLocation] = useState(initialLocation || null);
  const [locationLoading, setLocationLoading] = useState(!initialLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(0);
  const [sortDirection, setSortDirection] = useState(0);
  const [isMapView, setIsMapView] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProperties, setAllProperties] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Memoized functions
  const getRelativeTime = useCallback((postTime) => {
    if (!postTime) return "Tarih belirtilmemiş";

    const now = new Date();
    const postDate = new Date(postTime);
    if (isNaN(postDate.getTime())) return "Geçersiz tarih";

    const diffMs = now.getTime() - postDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} yıl önce`;
    if (diffMonths > 0) return `${diffMonths} ay önce`;
    if (diffWeeks > 0) return `${diffWeeks} hafta önce`;
    if (diffDays > 0) return `${diffDays} gün önce`;
    if (diffHours > 0) return `${diffHours} saat önce`;
    if (diffMinutes > 0) return `${diffMinutes} dakika önce`;
    return "Az önce";
  }, []);

  // Filter animations
  const filterTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -60],
    extrapolate: "clamp",
  });

  const filterOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const containerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [45, 0],
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
    setIsFilterChanging(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);

    const timer = setTimeout(() => setIsFilterChanging(false), 300);
    return () => clearTimeout(timer);
  }, [sortBy, sortDirection, isMatch, userLocation]);
  // Tab bar visibility
  // Tab Management for hiding bottom tabs
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: "none" },
        });
      }

      return () => {
        if (parent) {
          if (userRole === "EVSAHIBI") {
            parent.setOptions({
              tabBarStyle: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderTopColor: "rgba(224, 224, 224, 0.2)",
                paddingTop: 5,
                paddingBottom: 5,
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 8,
              },
            });
          } else if (userRole === "KIRACI") {
            parent.setOptions({
              tabBarStyle: {
                backgroundColor: "#fff",
                borderTopColor: "#e0e0e0",
                paddingTop: 5,
                paddingBottom: 5,
              },
            });
          }
        }
      };
    }, [navigation, userRole])
  );


  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setUserLocation({ latitude: 41.0082, longitude: 28.9784 });
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
      setUserLocation({ latitude: 41.0082, longitude: 28.9784 });
    } finally {
      setLocationLoading(false);
    }
  };

  // API Query
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
      sortBy: sortBy,
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
        setAllProperties(newProperties);
        setIsFilterChanging(false);
      } else {
        setAllProperties((prev) => {
          const existingIds = new Set(prev.map((item) => item.postId));
          const uniqueNewItems = newProperties.filter(
            (item) => !existingIds.has(item.postId)
          );
          return [...prev, ...uniqueNewItems];
        });
      }

      setHasNextPage(pagination?.hasNextPage || false);
    }
  }, [nearbyData, currentPage]);

  // Filter properties
  const getFilteredProperties = useCallback(() => {
    let filteredProperties = [...allProperties];

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

    return filteredProperties;
  }, [allProperties, searchQuery]);

  const filteredProperties = getFilteredProperties();

  // Handlers
  const handleLoadMore = useCallback(() => {
    if (
      !isLoadingMore &&
      hasNextPage &&
      !isLoadingNearby &&
      !isFilterChanging
    ) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasNextPage, isLoadingNearby, isFilterChanging]);

  const onRefresh = useCallback(async () => {
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
  }, [refetch]);

  const handleSortChange = useCallback(
    (newSortBy) => {
      if (newSortBy === sortBy) {
        setSortDirection((prev) => (prev === 0 ? 1 : 0));
      } else {
        setSortBy(newSortBy);
        setSortDirection(0);
      }
    },
    [sortBy]
  );

  // Loading state effect
  useEffect(() => {
    if (currentPage > 1) {
      setIsLoadingMore(false);
    }
  }, [nearbyData]);

  // Sort options
  const sortOptions = [
    { key: 0, label: "Uzaklık" },
    { key: 2, label: "Fiyat" },
    { key: 1, label: "Tarih" },
    { key: 3, label: "Görüntülenme" },
    { key: 4, label: "Güncellenme" },
  ];

  // Render functions
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return <PropertyListLoadingSkeleton count={2} />;
  }, [isLoadingMore]);

  const renderPropertyItem = useCallback(
    ({ item }) => (
      <PropertyItem
        item={item}
        navigation={navigation}
        getRelativeTime={getRelativeTime}
      />
    ),
    [navigation, getRelativeTime]
  );

  const renderEmptyState = useCallback(() => {
    if (isFilterChanging || (isLoadingNearby && currentPage === 1)) {
      return <PropertyListLoadingSkeleton count={3} />;
    }

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
  }, [isFilterChanging, isLoadingNearby, currentPage, searchQuery]);

  const keyExtractor = useCallback(
    (item, index) => `nearby_${item.postId}_${index}`,
    []
  );

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 600, // Approximate item height
      offset: 600 * index,
      index,
    }),
    []
  );

  // Clear search handler
  const clearSearch = useCallback(() => setSearchQuery(""), []);

  // Navigation handlers
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  // Toggle match handler
  const toggleMatch = useCallback(() => setIsMatch(!isMatch), [isMatch]);

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
          <TouchableOpacity onPress={goBack} style={{ width: "8%" }}>
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
                <TouchableOpacity onPress={clearSearch}>
                  <MaterialIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={{ width: "8%" }}>
            <TouchableOpacity onPress={toggleMatch}>
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
                    className={`mr-3 px-4 py-2 rounded-full border ${sortBy === option.key
                      ? "bg-gray-900"
                      : "bg-white border-white"
                      }`}
                    onPress={() => handleSortChange(option.key)}
                  >
                    <Text
                      className={`text-sm font-medium ${sortBy === option.key ? "text-white" : "text-gray-700"
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

      {/* Properties list with all performance optimizations */}
      <Animated.FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout} // CRITICAL for performance
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16} // Optimized for performance
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A90E2"]}
            tintColor="#4A90E2"
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
        }}
        // CRITICAL Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5} // Reduced from 10
        updateCellsBatchingPeriod={50} // Reduced from 100
        initialNumToRender={4} // Reduced from 8
        windowSize={5} // Reduced from 10
        // NEW performance optimizations
        legacyImplementation={false}
        disableVirtualization={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        // Memory optimizations
        recycleViewsOnNext={true}
        enableFillRate={true}
      />
    </SafeAreaView>
  );
};

export default AllNearbyPropertiesScreen;
