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
import { useGetLandlordTenantsWithFallbackQuery } from "../redux/api/apiSlice";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faGrid2,
  faRuler,
  faShower,
  faCar,
  faCalendar,
  faBuilding,
  faUsers,
  faHeart,
  faPercentage,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import {
  faChevronLeft,
  faFilter,
  faSliders,
  faChevronRight,
  faPaw,
  faMoneyBills,
  faCoins,
  faMapMarked,
  faBed,
  faGraduationCap,
} from "@fortawesome/pro-regular-svg-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

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

const TenantListItemSkeleton = memo(() => {
  return (
    <View
      style={{ marginHorizontal: 16 }}
      className="mb-4 pt-4 border-gray-200"
    >
      <View
        className="bg-white border border-gray-200 p-4"
        style={{ boxShadow: "0px 0px 12px #00000014", borderRadius: 25 }}
      >
        {/* Header with Profile Image and Basic Info */}
        <View className="flex-row items-center mb-4">
          <ShimmerPlaceholder width={60} height={60} borderRadius={30} />
          <View className="flex-1 ml-4">
            <ShimmerPlaceholder
              width={150}
              height={18}
              borderRadius={9}
              style={{ marginBottom: 8 }}
            />
            <ShimmerPlaceholder width={100} height={12} borderRadius={6} />
          </View>
        </View>

        {/* Tenant Details Grid */}
        <View className="space-y-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <View key={index} className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <ShimmerPlaceholder width={18} height={18} borderRadius={9} />
                <ShimmerPlaceholder
                  width={80}
                  height={14}
                  borderRadius={7}
                  style={{ marginLeft: 8 }}
                />
              </View>
              <ShimmerPlaceholder width={60} height={14} borderRadius={7} />
            </View>
          ))}
        </View>

        {/* Compatibility Level */}
        <View className="mt-4 pt-3 border-t border-gray-100">
          <ShimmerPlaceholder
            width={width * 0.8}
            height={5}
            borderRadius={2.5}
            style={{ marginBottom: 8 }}
          />
          <ShimmerPlaceholder width={120} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
});

const TenantListLoadingSkeleton = memo(({ count = 2 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <TenantListItemSkeleton key={`tenant-skeleton-${index}`} />
      ))}
    </View>
  );
});

// Memoized Match Score Bar Component
const MatchScoreBar = memo(({ matchScore, showBar = false, size = "sm" }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const getMatchScoreInfo = useCallback((score) => {
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
  }, []);

  const scoreInfo = getMatchScoreInfo(matchScore);

  const sizes = {
    xs: {
      barHeight: 2,
      iconSize: 10,
      textSize: 11,
      containerPadding: 1,
      barWidth: width * 0.8,
    },
    sm: {
      barHeight: 5,
      iconSize: 12,
      textSize: 12,
      containerPadding: 2,
      barWidth: width * 0.8,
    },
    md: {
      barHeight: 4,
      iconSize: 14,
      textSize: 14,
      containerPadding: 3,
      barWidth: width * 0.8,
    },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: matchScore,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [matchScore]);

  if (showBar) {
    return (
      <View style={{ marginTop: currentSize.containerPadding * 2 }}>
        <View className="flex-row items-center">
          <View
            className="bg-gray-100 rounded-full overflow-hidden"
            style={{
              height: currentSize.barHeight,
              width: currentSize.barWidth,
              marginRight: 12,
              maxWidth: width * 0.71,
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
});

// Memoized Tenant Item - EN ÖNEMLİ PERFORMANCE OPTIMIZATION
const TenantItem = memo(
  ({ item, navigation }) => {
    const handleTenantPress = useCallback(() => {
      navigation.navigate("TenantProfile", {
        tenantId: item.tenantProfileId,
      });
    }, [item.tenantProfileId, navigation]);

    return (
      <View
        style={{ marginHorizontal: 16 }}
        className="mb-4 pt-4 border-gray-200"
      >
        <TouchableOpacity onPress={handleTenantPress} activeOpacity={1}>
          <View
            className="bg-white p-4"
            style={{ boxShadow: "0px 0px 12px #00000014", borderRadius: 25 }}
          >
            {/* Header with Profile Image and Basic Info */}
            <View className="flex-row items-center mb-4">
              <Image
                className="border border-gray-100"
                style={{
                  width: 60,
                  height: 60,
                  boxShadow: "0px 0px 12px #00000020",
                  borderRadius: 30,
                }}
                source={{
                  uri: item.tenantURL || "https://via.placeholder.com/60x60",
                }}
                contentFit="cover"
              />

              <View className="flex-1 ml-4">
                <Text
                  style={{ fontSize: 18, fontWeight: 700 }}
                  className="text-gray-800 mb-1"
                  numberOfLines={1}
                >
                  {item.tenantName || "Kiracı"}
                </Text>
                <View className="flex flex-row items-center gap-1">
                  <Text className="text-gray-500" style={{ fontSize: 12 }}>
                    Profili görüntüle
                  </Text>
                  <FontAwesomeIcon
                    size={12}
                    color="#dee0ea"
                    icon={faChevronRight}
                  />
                </View>
              </View>
            </View>

            {/* Tenant Details Grid */}
            <View className="space-y-3 gap-1">
              {/* Budget */}
              {item.details?.budget && (
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm ml-2">Bütçe:</Text>
                  </View>
                  <Text className="text-gray-800 text-sm font-semibold">
                    {item.details.budget.toLocaleString()} ₺
                  </Text>
                </View>
              )}

              {/* Monthly Income */}
              {item.details?.monthlyIncome && (
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm ml-2">
                      Aylık Gelir:
                    </Text>
                  </View>
                  <Text className="text-gray-800 text-sm font-semibold">
                    {item.details.monthlyIncome.toLocaleString()} ₺
                  </Text>
                </View>
              )}

              {/* Preferred Location */}
              {item.details?.preferredLocation && (
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm ml-2">
                      Tercih Edilen Bölge:
                    </Text>
                  </View>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    numberOfLines={1}
                  >
                    {item.details.preferredLocation}
                  </Text>
                </View>
              )}

              {/* Room Preference */}
              {item.details?.minRooms && (
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm ml-2">
                      Min. Oda Sayısı:
                    </Text>
                  </View>
                  <Text className="text-gray-800 text-sm font-medium">
                    {item.details.minRooms} oda
                  </Text>
                </View>
              )}

              {/* Student Status */}
              {item.details?.isStudent !== undefined && (
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm ml-2">Öğrenci:</Text>
                  </View>
                  <Text className="text-gray-800 text-sm font-medium">
                    {item.details.isStudent ? "Evet" : "Hayır"}
                  </Text>
                </View>
              )}

              {/* Pet Status */}
              {item.details?.hasPets !== undefined && (
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm ml-2">
                      Evcil Hayvan:
                    </Text>
                  </View>
                  <Text className="text-gray-800 text-sm font-medium">
                    {item.details.hasPets ? "Var" : "Yok"}
                  </Text>
                </View>
              )}
            </View>

            {/* Compatibility Level */}
            {item.matchScore && (
              <View className="mt-4 pt-3 border-t border-gray-100">
                <MatchScoreBar
                  matchScore={item.matchScore}
                  showBar={true}
                  size="sm"
                />

                {/* Match Reasons */}
                {item.matchReasons && item.matchReasons.length > 0 && (
                  <Text className="text-xs text-gray-500 mt-2">
                    {item.matchReasons[0]}
                  </Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.item.tenantProfileId === nextProps.item.tenantProfileId &&
      prevProps.item.matchScore === nextProps.item.matchScore
    );
  }
);

const AllMatchingUsers = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("compatibility");
  const [isMapView, setIsMapView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allTenants, setAllTenants] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

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

  // Reset pagination when search or sort changes
  useEffect(() => {
    setIsFilterChanging(true);
    setCurrentPage(1);
    setAllTenants([]);
    setHasNextPage(true);

    const timer = setTimeout(() => setIsFilterChanging(false), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy]);

  // Fetch tenant data using paginated API
  const {
    data: tenantData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetLandlordTenantsWithFallbackQuery(
    {
      landlordUserId: currentUser?.id,
      page: currentPage,
      pageSize: 10,
      minMatchScore: 0.1,
      includeFallback: true,
    },
    {
      skip: !currentUser?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  // Update allTenants when new data comes
  useEffect(() => {
    if (tenantData?.data) {
      const newTenants = tenantData.data;
      const pagination = tenantData.pagination;

      if (currentPage === 1) {
        setAllTenants(newTenants);
        setIsFilterChanging(false);
      } else {
        setAllTenants((prev) => {
          const existingIds = new Set(
            prev.map((item) => item.tenantProfileId || item.id)
          );
          const uniqueNewItems = newTenants.filter(
            (item) => !existingIds.has(item.tenantProfileId || item.id)
          );
          return [...prev, ...uniqueNewItems];
        });
      }

      setHasNextPage(pagination?.hasNextPage || false);
    }
  }, [tenantData, currentPage]);

  // Filter and sort tenants
  const getFilteredAndSortedTenants = useCallback(() => {
    let filteredTenants = [...allTenants];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTenants = filteredTenants.filter(
        (tenant) =>
          (tenant.tenantName &&
            tenant.tenantName.toLowerCase().includes(query)) ||
          (tenant.details?.preferredLocation &&
            tenant.details.preferredLocation.toLowerCase().includes(query)) ||
          (tenant.details?.description &&
            tenant.details.description.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case "compatibility":
        filteredTenants.sort((a, b) => {
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return scoreB - scoreA;
        });
        break;
      case "budget":
        filteredTenants.sort((a, b) => {
          const budgetA = a.details?.budget || 0;
          const budgetB = b.details?.budget || 0;
          return budgetB - budgetA;
        });
        break;
      case "date":
        filteredTenants.sort((a, b) => {
          const dateA = new Date(a.createdDate || 0);
          const dateB = new Date(b.createdDate || 0);
          return dateB - dateA;
        });
        break;
      default:
        break;
    }

    return filteredTenants;
  }, [allTenants, searchQuery, sortBy]);

  const filteredTenants = getFilteredAndSortedTenants();

  // Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setAllTenants([]);
    setHasNextPage(true);
    setIsFilterChanging(false);
    try {
      await refetch();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (
      !loadingMore &&
      hasNextPage &&
      !isLoading &&
      !isFilterChanging &&
      !isFetching
    ) {
      setLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [loadingMore, hasNextPage, isLoading, isFilterChanging, isFetching]);

  // Loading state effect
  useEffect(() => {
    if (currentPage > 1) {
      setLoadingMore(false);
    }
  }, [tenantData]);

  // Render functions
  const renderEmptyState = useCallback(() => {
    if (isFilterChanging || (isLoading && currentPage === 1)) {
      return <TenantListLoadingSkeleton count={3} />;
    }

    return (
      <View className="flex-1 justify-center items-center p-8">
        <FontAwesome name="users" size={64} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
          {searchQuery.trim()
            ? "Arama sonucu bulunamadı"
            : "Henüz uygun kiracı bulunmuyor"}
        </Text>
        <Text className="text-base text-gray-500 text-center">
          {searchQuery.trim()
            ? "Farklı anahtar kelimeler deneyin"
            : "Profilinizi güncelleyerek daha fazla eşleşme elde edebilirsiniz"}
        </Text>
        {searchQuery.trim() && (
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
            onPress={() => setSearchQuery("")}
          >
            <Text className="text-white font-semibold">Aramayı Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isFilterChanging, isLoading, currentPage, searchQuery]);

  const renderLoadingFooter = useCallback(() => {
    if (!loadingMore) return null;
    return <TenantListLoadingSkeleton count={2} />;
  }, [loadingMore]);

  const renderTenantItem = useCallback(
    ({ item }) => <TenantItem item={item} navigation={navigation} />,
    [navigation]
  );

  const keyExtractor = useCallback(
    (item, index) => `tenant_${item.tenantProfileId || item.id}_${index}`,
    []
  );

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 300, // Approximate item height
      offset: 300 * index,
      index,
    }),
    []
  );

  // Clear search handler
  const clearSearch = useCallback(() => setSearchQuery(""), []);

  // Navigation handlers
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  // Show loading state
  if (isLoading && currentPage === 1 && !isFilterChanging) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text className="text-gray-600 mt-4 text-center">
            Uygun kiracılar yükleniyor...
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
            Uygun kiracılar yüklenirken bir sorun oluştu.
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
                placeholder="Size uygun kiracılar"
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
            <FontAwesomeIcon icon={faSliders} color="black" size={20} />
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
              paddingHorizontal: 18,
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
                {[
                  { key: "compatibility", label: "Uyumluluk" },
                  { key: "budget", label: "Bütçe" },
                  { key: "date", label: "Tarih" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    className={`mr-3 px-4 py-2 rounded-full border ${
                      sortBy === option.key
                        ? "bg-gray-900"
                        : "bg-white border-white"
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
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Tenants list with all performance optimizations */}
      <Animated.FlatList
        data={filteredTenants}
        renderItem={renderTenantItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout} // CRITICAL for performance
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
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

export default AllMatchingUsers;
