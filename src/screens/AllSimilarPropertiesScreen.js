import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetSimilarPostsPaginatedQuery } from "../redux/api/apiSlice";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Heart,
  ChevronLeft,
  CircleAlert,
} from "lucide-react-native";
import PlatformBlurView from "../components/PlatformBlurView";
import { PropertyCardFull } from "../components/PropertyCard";
import { getCurrencyText } from "../utils/formatters";

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

        <View className="absolute top-3 right-3">
          <ShimmerPlaceholder width={50} height={28} borderRadius={14} />
        </View>

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

// getCurrencyText -> ../utils/formatters.js'den import ediliyor

// Memoized Similarity Score Bar
const SimilarityScoreBar = memo(
  ({ similarityScore, showBar = true, size = "sm" }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    const getSimilarityScoreInfo = useCallback((score) => {
      const percentage = Math.round(score);
      if (percentage >= 80)
        return {
          level: "excellent",
          color: "#86efac",
          text: "Mükemmel",
          percentage,
        };
      if (percentage >= 60)
        return { level: "good", color: "#9cf0ba", text: "Çok İyi", percentage };
      if (percentage >= 40)
        return { level: "medium", color: "#f59e0b", text: "İyi", percentage };
      return { level: "weak", color: "#ef4444", text: "Orta", percentage };
    }, []);

    const scoreInfo = getSimilarityScoreInfo(similarityScore);

    const sizes = {
      sm: {
        barHeight: 5,
        iconSize: 12,
        textSize: 12,
        containerPadding: 2,
        barWidth: width * 0.2,
      },
    };
    const currentSize = sizes[size];

    useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        Animated.timing(progressAnim, {
          toValue: scoreInfo.percentage,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }, 200);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [scoreInfo.percentage]);

    if (showBar) {
      return (
        <View style={{ marginTop: currentSize.containerPadding * 2 }}>
          <View className="flex-row items-center">
            <View
              className="bg-gray-100 rounded-full overflow-hidden"
              style={{
                height: 4,
                width: currentSize.barWidth,
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
              {scoreInfo.percentage}%
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className="flex-row items-center">
        <Heart
          color={scoreInfo.color}
          fill={scoreInfo.color}
          size={currentSize.iconSize}
        />
        <Text
          className="font-medium ml-1"
          style={{
            color: scoreInfo.color,
            fontSize: currentSize.textSize,
          }}
        >
          {scoreInfo.percentage}% {scoreInfo.text}
        </Text>
      </View>
    );
  }
);

// PropertyDetailsSlider -> ../components/PropertyDetailsSlider.js'den import ediliyor
// PropertyImageSlider -> ../components/PropertyImageSlider.js'den import ediliyor
// PropertyItem -> PropertyCardFull olarak ../components/PropertyCard.js'den import ediliyor

const AllSimilarPropertiesScreen = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const { landlordUserId } = route.params || {};

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("similarity");
  const [sortDirection, setSortDirection] = useState(0); // 0 = desc, 1 = asc
  const [currentPage, setCurrentPage] = useState(1);
  const [allProperties, setAllProperties] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // getRelativeTime -> ../utils/formatters.js'den import ediliyor

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

  // Tab bar visibility
  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({
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
      };
    }, [navigation])
  );

  // Reset pagination when filters change
  useEffect(() => {
    setIsFilterChanging(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);

    const timer = setTimeout(() => setIsFilterChanging(false), 300);
    return () => clearTimeout(timer);
  }, [landlordUserId]);

  // API Query
  const {
    data: similarData,
    isLoading: isLoadingSimilar,
    error,
    refetch,
  } = useGetSimilarPostsPaginatedQuery(
    {
      LandLordUserId: landlordUserId,
      page: currentPage,
      pageSize: 10,
      minSimilarityScore: 0.3,
    },
    {
      skip: !landlordUserId,
      refetchOnMountOrArgChange: true,
    }
  );

  // Update properties when new data arrives
  useEffect(() => {
    if (similarData?.data) {
      const newProperties = similarData.data;
      const pagination = similarData.pagination;

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
  }, [similarData, currentPage]);

  const sortOptions = [
    { key: "similarity", label: "Benzerlik" },
    { key: "price", label: "Fiyat" },
    { key: "date", label: "Tarih" },
  ];

  const handleSortChange = useCallback((key) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 0 ? 1 : 0));
    } else {
      setSortBy(key);
      setSortDirection(0);
    }
  }, [sortBy]);

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

    const dir = sortDirection === 0 ? -1 : 1;
    switch (sortBy) {
      case "similarity":
        filteredProperties.sort((a, b) => dir * ((b.similarityScore || b.matchScore || 0) - (a.similarityScore || a.matchScore || 0)));
        break;
      case "price":
        filteredProperties.sort((a, b) => dir * ((a.kiraFiyati || a.rent || 0) - (b.kiraFiyati || b.rent || 0)));
        break;
      case "date":
        filteredProperties.sort((a, b) => dir * (new Date(b.createdAt || b.postTime || 0) - new Date(a.createdAt || a.postTime || 0)));
        break;
    }

    return filteredProperties;
  }, [allProperties, searchQuery, sortBy, sortDirection]);

  const filteredProperties = getFilteredProperties();

  // Handlers
  const handleLoadMore = useCallback(() => {
    if (
      !isLoadingMore &&
      hasNextPage &&
      !isLoadingSimilar &&
      !isFilterChanging
    ) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasNextPage, isLoadingSimilar, isFilterChanging]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setAllProperties([]);
    setHasNextPage(true);
    setIsFilterChanging(false);
    try {
      await refetch();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Loading state effect
  useEffect(() => {
    if (currentPage > 1) {
      setIsLoadingMore(false);
    }
  }, [similarData]);

  // Render functions
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return <PropertyListLoadingSkeleton count={2} />;
  }, [isLoadingMore]);

  const renderPropertyItem = useCallback(
    ({ item }) => (
      <PropertyCardFull
        item={item}
        navigation={navigation}
        showSimilarityScore={true}
        showMatchScore={false}
      />
    ),
    [navigation]
  );

  const renderEmptyState = useCallback(() => {
    // Show skeleton during filter changes or initial loading
    if (isFilterChanging || (isLoadingSimilar && currentPage === 1)) {
      return <PropertyListLoadingSkeleton count={3} />;
    }

    // Show empty state only when not loading and no results
    return (
      <View className="flex-1 justify-center items-center p-8">
        <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
          {searchQuery.trim()
            ? "Arama sonucu bulunamadı"
            : "Benzer ilan bulunamadı"}
        </Text>
        <Text className="text-base text-gray-500 text-center">
          {searchQuery.trim()
            ? "Farklı anahtar kelimeler deneyebilirsiniz"
            : "Henüz benzer ilan bulunmuyor"}
        </Text>
        {searchQuery.trim() && (
          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-lg mt-4"
            onPress={() => setSearchQuery("")}
          >
            <Text className="text-white font-semibold">Aramayı Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isFilterChanging, isLoadingSimilar, currentPage, searchQuery]);

  const keyExtractor = useCallback(
    (item, index) => `similar_${item.postId}_${index}`,
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

  // Error checks
  if (!landlordUserId) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
            Parametre Eksik
          </Text>
          <Text className="text-base text-gray-500 text-center mb-6">
            Landlord ID'si gerekli.
          </Text>
          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-lg"
            onPress={goBack}
          >
            <Text className="text-white font-semibold">Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (!allProperties.length && isLoadingSimilar) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#303030" />
          <Text className="text-gray-600 mt-4">
            Benzer ilanlar yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <CircleAlert size={50} color="#000" />
          <Text className="text-xl font-semibold text-gray-900 mt-2 mb-2 text-center">
            Bir hata oluştu
          </Text>
          <Text className="text-base text-gray-500 text-center mb-4">
            Benzer ilanlar yüklenirken bir sorun oluştu.
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
            <ChevronLeft color="black" size={25} />
          </TouchableOpacity>

          <View className="px-4 py-4" style={{ flex: 1 }}>
            <View
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              className="bg-white rounded-3xl gap-2 px-4 flex-row items-center"
            >
              <TextInput
                className="w-full px-2 placeholder:text-gray-400 placeholder:text-[14px] py-4 text-normal"
                placeholder="Benzer ilanlar"
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
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                flexGrow: 1,
                justifyContent: "center",
              }}
              style={{ width: "100%" }}
            >
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  className={`mr-3 px-4 py-2 rounded-full ${sortBy === option.key ? "bg-green-brand-darker" : "bg-white border border-gray-400"}`}
                  onPress={() => handleSortChange(option.key)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text className={`text-sm font-medium ${sortBy === option.key ? "text-white" : "text-gray-700"}`}>
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
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 16,
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

export default AllSimilarPropertiesScreen;
