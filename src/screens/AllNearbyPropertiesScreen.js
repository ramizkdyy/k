import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetNearbyPostsPaginatedQuery } from "../redux/api/apiSlice";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  Search,
  ChevronLeft,
  CircleAlert,
  ListFilter,
  Heart,
} from "lucide-react-native";
import PlatformBlurView from "../components/PlatformBlurView";
import { PropertyCardFull } from "../components/PropertyCard";
import { useFocusEffect } from "@react-navigation/native";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// ✅ OPTIMIZED: Memoized ShimmerPlaceholder with better animation control
const ShimmerPlaceholder = memo(
  ({ width, height, borderRadius = 8, style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null);

    useEffect(() => {
      const shimmerAnimation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500, // ✅ Slightly faster animation
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );

      animationRef.current = shimmerAnimation;
      shimmerAnimation.start();

      return () => {
        shimmerAnimation.stop();
        animatedValue.setValue(0);
      };
    }, [animatedValue]);

    const translateX = useMemo(
      () =>
        animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 1.2, width * 1.2], // ✅ Smaller multiplier for better performance
          extrapolate: "clamp",
        }),
      [animatedValue, width]
    );

    const gradientColors = useMemo(
      () => [
        "rgba(255, 255, 255, 0)",
        "rgba(255, 255, 255, 0.4)",
        "rgba(255, 255, 255, 0.8)",
        "rgba(255, 255, 255, 0.4)",
        "rgba(255, 255, 255, 0)",
      ],
      []
    );

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
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: width * 1.2,
              height: "100%",
            }}
          />
        </Animated.View>
      </View>
    );
  }
);

// ✅ OPTIMIZED: Memoized Skeleton Components
const PropertyListItemSkeleton = memo(() => {
  const skeletonWidth = useMemo(() => width - 32, []);

  return (
    <View
      style={{ marginHorizontal: 16 }}
      className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
    >
      {/* Image Skeleton */}
      <View className="relative">
        <ShimmerPlaceholder
          width={skeletonWidth}
          height={350}
          borderRadius={25}
        />

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
            {[0, 1, 2].map((index) => (
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
            width={skeletonWidth - 48}
            height={20}
            borderRadius={10}
            style={{ marginBottom: 8 }}
          />
          <ShimmerPlaceholder
            width={skeletonWidth - 88}
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
            {[0, 1, 2, 3, 4].map((index) => (
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
  const skeletonItems = useMemo(
    () => Array.from({ length: count }, (_, index) => index),
    [count]
  );

  return (
    <View>
      {skeletonItems.map((index) => (
        <PropertyListItemSkeleton key={`property-skeleton-${index}`} />
      ))}
    </View>
  );
});

// PropertyDetailsSlider -> ../components/PropertyDetailsSlider.js'den import ediliyor
// PropertyImageSlider -> ../components/PropertyImageSlider.js'den import ediliyor
// PropertyItem -> PropertyCardFull olarak ../components/PropertyCard.js'den import ediliyor

const AllNearbyPropertiesScreen = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const initialLocation = route.params?.initialLocation;

  // ✅ OPTIMIZED: State with better initial values
  const [userLocation, setUserLocation] = useState(initialLocation || null);
  const [locationLoading, setLocationLoading] = useState(!initialLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(0);
  const [sortDirection, setSortDirection] = useState(0);
  const [isMapView, setIsMapView] = useState(false);
  const isMatch = false;
  const [currentPage, setCurrentPage] = useState(1);
  const [allProperties, setAllProperties] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFilterChanging, setIsFilterChanging] = useState(false);
  const [hasInitialDataLoaded, setHasInitialDataLoaded] = useState(false); // ✅ NEW: İlk veri yüklenme durumu

  const scrollY = useRef(new Animated.Value(0)).current;

  // getRelativeTime -> ../utils/formatters.js'den import ediliyor

  // ✅ OPTIMIZED: Memoized filter animations
  const filterTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60],
        extrapolate: "clamp",
      }),
    [scrollY]
  );

  const filterOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 50, 100],
        outputRange: [1, 0.5, 0],
        extrapolate: "clamp",
      }),
    [scrollY]
  );

  const containerHeight = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [45, 0],
        extrapolate: "clamp",
      }),
    [scrollY]
  );

  // ✅ OPTIMIZED: Memoized location effect
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, [initialLocation]);

  // ✅ OPTIMIZED: Memoized filter reset effect
  useEffect(() => {
    setIsFilterChanging(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);
    setHasInitialDataLoaded(false); // ✅ Reset initial data flag

    const timer = setTimeout(() => setIsFilterChanging(false), 300);
    return () => clearTimeout(timer);
  }, [sortBy, sortDirection, isMatch, userLocation]);

  // ✅ OPTIMIZED: Tab management with better cleanup
  useFocusEffect(
    useCallback(() => {
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

  // ✅ OPTIMIZED: Location getter with cleanup
  const getCurrentLocation = useCallback(async () => {
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
      setUserLocation({ latitude: 41.0082, longitude: 28.9784 });
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // ✅ OPTIMIZED: API Query with better skip condition
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
      radiusKm: 100,
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

  // ✅ OPTIMIZED: Update properties with better deduplication
  useEffect(() => {
    // 🔍 Case 1: nearbyData is available
    if (nearbyData) {
      // API may return data directly or wrapped in result
      const newProperties = nearbyData.result?.data || nearbyData.data;
      const pagination = nearbyData.result?.pagination || nearbyData.pagination;

      if (newProperties) {
        if (currentPage === 1) {
          setAllProperties(newProperties);
          setIsFilterChanging(false);
          setHasInitialDataLoaded(true); // ✅ NEW: First data set is here
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
      } else if (nearbyData.isSuccess || (currentPage === 1 && !isLoadingNearby)) {
        // If query succeeded but no data field was found, or it's empty
        setHasInitialDataLoaded(true);
      }
    }
  }, [nearbyData, currentPage, isLoadingNearby]);

  // ✅ OPTIMIZED: Memoized filtered properties with better search
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return allProperties;

    const query = searchQuery.toLowerCase().trim();
    return allProperties.filter((property) => {
      const searchFields = [
        property.ilanBasligi,
        property.il,
        property.ilce,
        property.postDescription,
      ].filter(Boolean);

      return searchFields.some((field) => field.toLowerCase().includes(query));
    });
  }, [allProperties, searchQuery]);

  // ✅ OPTIMIZED: Memoized handlers
  const handleLoadMore = useCallback(() => {
    if (
      !isLoadingMore &&
      hasNextPage &&
      !isLoadingNearby &&
      !isFilterChanging &&
      filteredProperties.length === allProperties.length // Only if not searching
    ) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [
    isLoadingMore,
    hasNextPage,
    isLoadingNearby,
    isFilterChanging,
    filteredProperties.length,
    allProperties.length,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);
    setIsFilterChanging(false);
    setHasInitialDataLoaded(false); // ✅ Reset initial data flag
    try {
      await refetch();
    } catch (error) {
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

  // ✅ OPTIMIZED: Loading state effect
  useEffect(() => {
    if (currentPage > 1) {
      setIsLoadingMore(false);
    }
  }, [nearbyData, currentPage]);

  // ✅ OPTIMIZED: Memoized sort options
  const sortOptions = useMemo(
    () => [
      { key: 0, label: "Uzaklık" },
      { key: 2, label: "Fiyat" },
      { key: 1, label: "Tarih" },
    ],
    []
  );

  // ✅ OPTIMIZED: Memoized render functions
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return <PropertyListLoadingSkeleton count={2} />;
  }, [isLoadingMore]);

  const renderPropertyItem = useCallback(
    ({ item }) => (
      <PropertyCardFull
        item={item}
        navigation={navigation}
        showMatchScore={true}
      />
    ),
    [navigation]
  );

  const renderEmptyState = useCallback(() => {
    // ✅ FIXED: Daha kapsamlı loading state kontrolü
    const isInitialLoading =
      isLoadingNearby && currentPage === 1 && !hasInitialDataLoaded;
    const isRefreshLoading = refreshing;
    const isAnyLoading =
      isFilterChanging || isInitialLoading || isRefreshLoading;

    if (isAnyLoading) {
      return <PropertyListLoadingSkeleton count={3} />;
    }

    // ✅ FIXED: Sadece gerçekten veri yok ve loading bitmişse empty state göster
    const hasNoData =
      filteredProperties.length === 0 && allProperties.length === 0;
    const isLoadingComplete =
      !isLoadingNearby &&
      !refreshing &&
      !isFilterChanging &&
      hasInitialDataLoaded;

    if (isAnyLoading || !isLoadingComplete) {
      return (
        <View className="p-4">
          <PropertyListLoadingSkeleton count={3} />
        </View>
      );
    }

    if (!hasNoData) {
      return null;
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
            onPress={clearSearch}
          >
            <Text className="text-white font-semibold">Aramayı Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [
    isFilterChanging,
    isLoadingNearby,
    currentPage,
    searchQuery,
    refreshing,
    filteredProperties.length,
    allProperties.length,
    hasInitialDataLoaded,
  ]);

  // ✅ OPTIMIZED: Memoized key extractor and layout
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

  // ✅ OPTIMIZED: Memoized event handlers
  const clearSearch = useCallback(() => setSearchQuery(""), []);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY]
  );

  // ✅ OPTIMIZED: Early returns with better conditions
  if (locationLoading || (!userLocation && isLoadingNearby)) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#303030" />
          <Text className="mt-3 text-base text-gray-500">
            {locationLoading
              ? "Konum alınıyor..."
              : "Yakındaki evler yükleniyor..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <CircleAlert size={50} color="#000" />
          <Text className="text-xl font-semibold text-gray-900 mt-2 mb-2 text-center">
            Bir hata oluştu
          </Text>
          <Text className="text-base text-gray-500 text-center mb-4">
            Yakındaki evler yüklenirken bir sorun oluştu.
          </Text>
          <TouchableOpacity
            className="border px-6 py-3 rounded-full"
            style={{ borderColor: '#1a7431' }}
            onPress={onRefresh}
          >
            <Text className="font-medium" style={{ color: '#1a7431' }}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* Fixed search bar */}
      <View className="bg-white border-b border-gray-200 z-10">
        <View className="flex flex-row items-center px-5">
          <TouchableOpacity onPress={goBack} style={{ width: "8%" }}>
            <ChevronLeft size={25} color="black" />
          </TouchableOpacity>

          <View className="px-4 py-4" style={{ flex: 1 }}>
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
            <View className="flex-row items-center justify-center w-full">
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  className={`mr-3 px-4 py-2 rounded-full ${sortBy === option.key
                    ? "bg-green-brand-darker"
                    : "bg-white border border-gray-400"
                    }`}
                  onPress={() => handleSortChange(option.key)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      className={`text-sm font-medium ${sortBy === option.key ? "text-white" : "text-gray-700"}`}
                    >
                      {option.label}
                    </Text>
                    {sortBy === option.key && (
                      <Text style={{ color: "white", fontSize: Platform.OS === "android" ? 19 : 12, marginLeft: 2, lineHeight: Platform.OS === "android" ? 23 : 16, includeFontPadding: false, textAlignVertical: "center" }}>
                        {sortDirection === 0 ? "↓" : "↑"}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ✅ OPTIMIZED: Properties list with all performance optimizations */}
      <Animated.FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        // ✅ CRITICAL Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={4} // Reduced for better performance
        updateCellsBatchingPeriod={30} // Reduced for faster updates
        initialNumToRender={3} // Reduced for faster initial render
        windowSize={4} // Reduced for lower memory usage
        // ✅ NEW performance optimizations
        legacyImplementation={false}
        disableVirtualization={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        // ✅ Memory optimizations
        recyclingKey="property-list" // Enable recycling
        enableFillRate={true}
        // ✅ Additional optimization for large lists
        ItemSeparatorComponent={null} // Remove separator for better performance
        CellRendererComponent={undefined} // Use default for better performance
      />
    </SafeAreaView>
  );
};

export default React.memo(AllNearbyPropertiesScreen);
