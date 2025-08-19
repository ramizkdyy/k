import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { View, Text, TouchableOpacity, FlatList, Animated } from "react-native";
import { Image } from "expo-image";
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
  faBath,
  faBed,
} from "@fortawesome/pro-light-svg-icons";
import { faHeart, faHouseBlank } from "@fortawesome/pro-regular-svg-icons";
import { BlurView } from "expo-blur";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { useFypCacheTracker } from "../hooks/useFypCacheTracker";

// ✅ ULTRA OPTIMIZED: Memoized Static Components
const ErrorPlaceholder = React.memo(({ width, height, borderRadius = 30 }) => (
  <View
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: "#f5f5f5",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <FontAwesomeIcon icon={faHouseBlank} size={30} color="#ccc" />
  </View>
));

const LoadingPlaceholder = React.memo(({ style, borderRadius }) => (
  <View
    style={{
      ...style,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: borderRadius || 30,
      backgroundColor: "#f5f5f5",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <FontAwesomeIcon icon={faHouseBlank} size={20} color="#ccc" />
  </View>
));

// ✅ ULTRA OPTIMIZED: Memoized ImageWithFallback
const ImageWithFallback = React.memo(
  ({
    source,
    style,
    contentFit = "cover",
    className = "",
    fallbackWidth,
    fallbackHeight,
    borderRadius,
    ...props
  }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const sourceUri = source?.uri;

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoading(false);
    }, []);

    const handleLoadStart = useCallback(() => setIsLoading(true), []);
    const handleLoad = useCallback(() => setIsLoading(false), []);

    // Reset error state when URI changes
    useEffect(() => {
      if (sourceUri) {
        setHasError(false);
        setIsLoading(false);
      }
    }, [sourceUri]);

    if (hasError || !sourceUri) {
      return (
        <ErrorPlaceholder
          width={fallbackWidth || style?.width || 200}
          height={fallbackHeight || style?.height || 200}
          borderRadius={borderRadius || style?.borderRadius || 30}
        />
      );
    }

    return (
      <View style={{ position: "relative" }}>
        <Image
          source={source}
          style={style}
          className={className}
          contentFit={contentFit}
          onError={handleError}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          cachePolicy="memory-disk"
          transition={0}
          recyclingKey={sourceUri}
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          {...props}
        />
        {isLoading && (
          <LoadingPlaceholder
            style={style}
            borderRadius={style?.borderRadius}
          />
        )}
      </View>
    );
  }
);

// ✅ ULTRA OPTIMIZED: Memoized MatchScoreBar
const MatchScoreBar = React.memo(
  ({ matchScore, showBar = false, size = "sm" }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const lastMatchScore = useRef(null);
    const hasAnimated = useRef(false);

    // Static size configurations
    const sizeConfig = useMemo(() => {
      const configs = {
        xs: { barHeight: 3, iconSize: 10, textSize: 11, barWidth: "100%" },
        sm: { barHeight: 5, iconSize: 12, textSize: 12, barWidth: 180 },
        md: { barHeight: 4, iconSize: 14, textSize: 14, barWidth: 180 },
      };
      return configs[size];
    }, [size]);

    // Score info calculation
    const scoreInfo = useMemo(() => {
      if (matchScore >= 80) return { color: "#86efac", text: "Mükemmel" };
      if (matchScore >= 60) return { color: "#9cf0ba", text: "Çok İyi" };
      if (matchScore >= 40) return { color: "#f59e0b", text: "İyi" };
      return { color: "#ef4444", text: "Orta" };
    }, [matchScore]);

    // Optimized animation
    useEffect(() => {
      if (
        matchScore !== lastMatchScore.current &&
        typeof matchScore === "number"
      ) {
        const delay = hasAnimated.current ? 200 : 0;

        setTimeout(() => {
          Animated.timing(progressAnim, {
            toValue: matchScore,
            duration: hasAnimated.current ? 800 : 400,
            useNativeDriver: false,
          }).start();

          lastMatchScore.current = matchScore;
          hasAnimated.current = true;
        }, delay);
      }
    }, [matchScore, progressAnim]);

    if (showBar) {
      return (
        <View style={{ marginTop: sizeConfig.containerPadding * 2 }}>
          <View className="flex-row items-center">
            <View
              className="bg-gray-100 rounded-full overflow-hidden"
              style={{
                height: sizeConfig.barHeight,
                width: sizeConfig.barWidth,
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
                  backgroundColor: "#000",
                  height: "100%",
                  borderRadius: sizeConfig.barHeight / 2,
                }}
              />
            </View>
            <Text
              className="font-medium ml-1"
              style={{
                color: "#000",
                fontSize: sizeConfig.textSize,
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
          size={sizeConfig.iconSize}
        />
        <Text
          className="font-medium ml-1"
          style={{
            color: scoreInfo.color,
            fontSize: sizeConfig.textSize,
          }}
        >
          {matchScore}% {scoreInfo.text}
        </Text>
      </View>
    );
  }
);

const NearbyProperties = ({ navigation, onRefresh, refreshing }) => {
  // ✅ ULTRA OPTIMIZED: State Management
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataLoadingStates, setDataLoadingStates] = useState({
    secondSection: true,
    hasInitialData: false,
  });

  // Cache tracker
  const { getCacheValueForQuery, recordApiCall, resetCache } =
    useFypCacheTracker();

  // ✅ ULTRA OPTIMIZED: Location Effect
  useEffect(() => {
    let isMounted = true;

    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (isMounted) {
            setUserLocation({ latitude: 41.0082, longitude: 28.9784 });
            setLocationLoading(false);
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log("Location error:", error);
        if (isMounted) {
          setUserLocation({ latitude: 41.0082, longitude: 28.9784 });
        }
      } finally {
        if (isMounted) setLocationLoading(false);
      }
    };

    getCurrentLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ ULTRA OPTIMIZED: API Query
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
      isCached: getCacheValueForQuery(),
    },
    {
      skip: !userLocation || !currentUser?.id,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
    }
  );

  // ✅ ULTRA OPTIMIZED: Data Processing
  const nearFromYouProperties = useMemo(
    () => nearbyData?.result?.nearFromYou || [],
    [nearbyData?.result?.nearFromYou]
  );

  const secondSectionData = useMemo(() => {
    let data = [];

    if (userRole === "EVSAHIBI") {
      data = nearbyData?.result?.bestTenantMatch || [];
    } else if (userRole === "KIRACI") {
      data = nearbyData?.result?.bestLandlordMatch || [];
    }

    // Update loading state when data arrives
    if (data.length > 0 && dataLoadingStates.secondSection) {
      setDataLoadingStates((prev) => ({
        ...prev,
        secondSection: false,
        hasInitialData: true,
      }));
    }

    return data;
  }, [nearbyData?.result, userRole, dataLoadingStates.secondSection]);

  const thirdSectionData = useMemo(() => {
    if (userRole === "EVSAHIBI") {
      return nearbyData?.result?.similarPost || [];
    } else if (userRole === "KIRACI") {
      return nearbyData?.result?.bestForYou || [];
    }
    return [];
  }, [nearbyData?.result, userRole]);

  // ✅ ULTRA OPTIMIZED: Event Handlers
  const handleRefresh = useCallback(async () => {
    if (!userLocation || !currentUser?.id) return;

    setIsRefreshing(true);
    try {
      resetCache();
      const result = await refetch();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [userLocation, currentUser?.id, resetCache, refetch, onRefresh]);

  const handlePropertyPress = useCallback(
    (postId) => navigation.navigate("PostDetail", { postId }),
    [navigation]
  );

  const handlePersonPress = useCallback(
    (item) => {
      if (userRole === "EVSAHIBI") {
        navigation.navigate("UserProfile", {
          userId: item.userId,
          userRole: "KIRACI",
        });
      } else {
        navigation.navigate("UserProfile", {
          userId: item.landlordId || item.userId,
          userRole: "EVSAHIBI",
        });
      }
    },
    [navigation, userRole]
  );

  const handleSeeAll = useCallback(
    (type) => {
      const routes = {
        similarPosts: () => {
          if (userRole === "EVSAHIBI") {
            navigation.navigate("AllSimilarProperties", {
              userLocation,
              similarPosts: thirdSectionData,
              searchType: "general",
              landlordUserId: currentUser?.id,
            });
          } else {
            navigation.navigate("AllRecommendedPosts");
          }
        },
        recommendedForYou: () => navigation.navigate("AllRecommendedPosts"),
        bestTenants: () =>
          navigation.navigate("AllMatchingUsers", {
            initialLocation: userLocation,
            searchType: type,
          }),
        bestLandlords: () =>
          navigation.navigate("AllMatchingUsers", {
            initialLocation: userLocation,
            searchType: type,
          }),
        default: () =>
          navigation.navigate("AllNearbyProperties", {
            initialLocation: userLocation,
            searchType: type,
          }),
      };

      (routes[type] || routes.default)();
    },
    [userRole, navigation, userLocation, thirdSectionData, currentUser?.id]
  );

  // ✅ ULTRA OPTIMIZED: Render Functions
  const renderPropertyCard = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={1}
        className="overflow-hidden w-72 flex flex-col px-3 py-3"
        onPress={() => handlePropertyPress(item.postId)}
      >
        <View className="relative">
          <ImageWithFallback
            style={{
              height: 230,
              borderRadius: 30,
              boxShadow: "0px 0px 12px #00000024",
            }}
            source={{
              uri: item.postImages?.[0]?.postImageUrl || item.firstPostİmageURL,
            }}
            className="w-full"
            contentFit="cover"
            fallbackWidth="100%"
            fallbackHeight={230}
            borderRadius={30}
          />

          {(item.distanceInKM !== undefined || item.distance !== undefined) && (
            <BlurView
              intensity={50}
              tint="dark"
              className="absolute top-3 left-3 rounded-full overflow-hidden"
            >
              <View className="px-2 py-1.5 flex-row items-center gap-1">
                <FontAwesomeIcon color="white" icon={faRoad} size={14} />
                <Text className="text-white text-xs font-semibold">
                  {(item.distanceInKM || item.distance || 0).toFixed(1)} km
                </Text>
              </View>
            </BlurView>
          )}

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

        <View className="py-3 px-1">
          <Text
            style={{ fontSize: 16, fontWeight: 600 }}
            className="text-gray-800"
            numberOfLines={2}
          >
            {item.ilanBasligi ||
              item.title ||
              `${item.il} ${item.ilce} ${item.odaSayisi} Kiralık Daire`}
          </Text>

          <View className="flex justify-between flex-row items-center mt-1">
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
    ),
    [handlePropertyPress]
  );

  const renderVerticalPropertyCard = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={1}
        className="overflow-hidden w-full flex flex-row items-center gap-4 py-2"
        onPress={() => handlePropertyPress(item.postId)}
      >
        <ImageWithFallback
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            boxShadow: "0px 0px 12px #00000014",
          }}
          source={{
            uri: item.postImages?.[0]?.postImageUrl || item.firstPostİmageURL,
          }}
          className="rounded-2xl border border-gray-100"
          contentFit="cover"
          fallbackWidth={80}
          fallbackHeight={80}
          borderRadius={20}
        />

        <View className="flex-1 flex flex-col">
          <Text
            style={{ fontSize: 16, fontWeight: 600 }}
            className="text-gray-800 mb-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.ilanBasligi ||
              item.title ||
              `${item.il} ${item.ilce} Kiralık Daire`}
          </Text>

          <Text
            style={{ fontSize: 14, fontWeight: 600 }}
            className="text-gray-400"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.kiraFiyati || item.rent
              ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${
                  item.paraBirimi || item.currency || "₺"
                }`
              : "Fiyat belirtilmemiş"}
          </Text>

          {item.matchScore && (
            <View className="flex flex-row items-center gap-1 py-1">
              <FontAwesomeIcon icon={faHeart} size={15} />
              <Text style={{ fontSize: 12, fontWeight: 500 }}>
                {item.matchScore}% Uyum
              </Text>
            </View>
          )}

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
    ),
    [handlePropertyPress]
  );

  const renderPersonCard = useCallback(
    ({ item, index }) => {
      if (!item) return null;

      // ✅ ULTRA OPTIMIZED: Secure name extraction
      const getPersonName = () => {
        if (userRole === "EVSAHIBI") {
          return (
            item.tenantName ||
            item.tenant_name ||
            item.name ||
            item.firstName ||
            item.displayName ||
            `Kiracı #${index + 1}`
          );
        } else {
          return (
            item.landlordName ||
            item.landlord_name ||
            item.name ||
            item.firstName ||
            item.displayName ||
            `Ev Sahibi #${index + 1}`
          );
        }
      };

      const getProfileImage = () => {
        if (userRole === "EVSAHIBI") {
          return (
            item.tenantURL ||
            item.tenant_profile_url ||
            item.profileImage ||
            item.avatar
          );
        } else {
          return (
            item.landlordProfileURL ||
            item.landlord_profile_url ||
            item.profileImage ||
            item.avatar
          );
        }
      };

      return (
        <TouchableOpacity
          style={{ borderRadius: 25 }}
          activeOpacity={1}
          className="mr-4 mb-3 overflow-hidden w-72 flex flex-col bg-white border border-gray-200 p-4"
          onPress={() => handlePersonPress(item)}
        >
          <View className="flex-col items-center gap-2">
            <ImageWithFallback
              style={{
                width: 60,
                height: 60,
                borderRadius: 100,
                objectFit: "cover",
                boxShadow: "0px 0px 12px #00000020",
              }}
              source={{ uri: getProfileImage() }}
              className="rounded-full border border-gray-100"
              contentFit="cover"
              fallbackWidth={60}
              fallbackHeight={60}
              borderRadius={100}
            />

            <View className="flex-1 flex-col items-center mb-1">
              <Text
                style={{ fontSize: 16, fontWeight: 700 }}
                className="text-gray-800"
                numberOfLines={1}
              >
                {getPersonName()}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: 400 }}
                className="text-gray-500 mt-1"
              >
                {userRole === "EVSAHIBI" ? "Kiracı Adayı" : "Ev Sahibi"}
              </Text>
            </View>
          </View>

          <View className="px-10 flex justify-center items-center">
            <MatchScoreBar
              matchScore={item.matchScore}
              showBar={true}
              size="sm"
            />

            {item.matchReasons?.[0] && (
              <Text style={{ fontSize: 12 }} className="text-gray-500 mt-2">
                {item.matchReasons[0]}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handlePersonPress(item)}
            activeOpacity={1}
            className="py-3 mt-4 border border-black rounded-full"
          >
            <Text className="text-center font-medium">Göz at</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [handlePersonPress, userRole]
  );

  // ✅ ULTRA OPTIMIZED: FlatList Configuration
  const flatListConfig = useMemo(
    () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: 3,
      windowSize: 5,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      getItemLayout: null, // Let FlatList calculate
    }),
    []
  );

  // ✅ ULTRA OPTIMIZED: Key Extractors
  const nearPropertyKeyExtractor = useCallback(
    (item, index) => `near_${item.postId}_${index}`,
    []
  );

  const personKeyExtractor = useCallback(
    (item, index) => {
      const baseKey = userRole === "EVSAHIBI" ? "tenant" : "landlord";
      const itemId =
        item.tenantProfileId ||
        item.landlordProfileId ||
        item.userId ||
        item.id ||
        index;
      return `${baseKey}_${itemId}_${index}`;
    },
    [userRole]
  );

  const thirdSectionKeyExtractor = useCallback(
    (item, index) => `third_${item.postId}_${index}`,
    []
  );

  // ✅ ULTRA OPTIMIZED: Loading Skeletons
  const SecondSectionLoadingSkeleton = useMemo(
    () => (
      <View className="">
        <View className="flex-row justify-between items-center mb-5 mt-6 px-5">
          <View className="bg-gray-200 rounded-lg h-6 w-48" />
          <View className="bg-gray-200 rounded-lg h-4 w-20" />
        </View>
        <View style={{ paddingLeft: 16 }}>
          <View className="flex-row">
            {Array.from({ length: 3 }, (_, index) => (
              <View
                key={index}
                className="mr-4 w-72 h-48 bg-gray-200 rounded-3xl"
              />
            ))}
          </View>
        </View>
      </View>
    ),
    []
  );

  // ✅ ULTRA OPTIMIZED: Effects
  useEffect(() => {
    if (refreshing && userLocation && currentUser?.id) {
      handleRefresh();
    }
  }, [refreshing, userLocation, currentUser?.id, handleRefresh]);

  useEffect(() => {
    if (nearbyData && !getCacheValueForQuery()) {
      recordApiCall();
    }
  }, [nearbyData, getCacheValueForQuery, recordApiCall]);

  // ✅ ULTRA OPTIMIZED: Computed Values
  const isLoading = isLoadingNearby || isRefreshing;
  const hasNoData =
    nearFromYouProperties.length === 0 &&
    secondSectionData.length === 0 &&
    thirdSectionData.length === 0;
  const shouldShowSecondSection =
    !isLoadingNearby || secondSectionData.length > 0;

  // ✅ ULTRA OPTIMIZED: Early Returns
  if (locationLoading) {
    return (
      <View className="mb-6">
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex flex-col">
        <LoadingSkeleton count={3} />
        <View className="mb-6">
          <LoadingSkeleton count={3} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex flex-col">
      {isLoading ? (
        <View>
          <LoadingSkeleton count={3} />
          <LoadingSkeleton count={3} />
        </View>
      ) : (
        <>
          {/* 1. SECTION: Nearby Properties */}
          {nearFromYouProperties.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center px-5 mb-4">
                <Text
                  style={{ fontSize: 20 }}
                  className="font-semibold text-gray-900"
                >
                  Yakınındaki Evler
                </Text>
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

              <FlatList
                style={{ paddingLeft: 16 }}
                data={nearFromYouProperties}
                renderItem={renderPropertyCard}
                keyExtractor={nearPropertyKeyExtractor}
                horizontal
                contentContainerStyle={{ paddingRight: 20 }}
                {...flatListConfig}
              />
            </View>
          )}

          {/* 2. SECTION: People - Optimized */}
          {isLoadingNearby && secondSectionData.length === 0 ? (
            SecondSectionLoadingSkeleton
          ) : shouldShowSecondSection && secondSectionData.length > 0 ? (
            <View>
              <View className="flex-row justify-between items-center mb-5 mt-6 px-5">
                <Text
                  style={{ fontSize: 20 }}
                  className="font-semibold text-gray-900"
                >
                  {userRole === "EVSAHIBI"
                    ? "Size Uygun Kiracılar"
                    : "Size Uygun Ev Sahipleri"}
                </Text>
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

              <FlatList
                style={{ paddingLeft: 16 }}
                data={secondSectionData}
                renderItem={renderPersonCard}
                keyExtractor={personKeyExtractor}
                horizontal
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                extraData={`${userRole}_${secondSectionData.length}`}
                {...flatListConfig}
              />
            </View>
          ) : null}

          {/* 3. SECTION: Third Section Properties */}
          {thirdSectionData.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center mb-4 mt-3 px-5">
                <Text
                  style={{ fontSize: 20 }}
                  className="font-semibold text-gray-900"
                >
                  {userRole === "EVSAHIBI"
                    ? "Benzer İlanlar"
                    : "Sizin İçin Önerilen"}
                </Text>
                <TouchableOpacity
                  className="flex flex-row gap-1 items-center"
                  onPress={() =>
                    handleSeeAll(
                      userRole === "EVSAHIBI"
                        ? "similarPosts"
                        : "recommendedForYou"
                    )
                  }
                >
                  <Text style={{ fontSize: 12 }} className="text-gray-900">
                    Tümünü gör
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} />
                </TouchableOpacity>
              </View>

              <FlatList
                style={{ paddingLeft: 16 }}
                data={thirdSectionData.slice(0, 4)}
                renderItem={renderVerticalPropertyCard}
                keyExtractor={thirdSectionKeyExtractor}
                scrollEnabled={false}
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                {...flatListConfig}
              />
            </View>
          )}

          {/* Empty State */}
          {hasNoData && (
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

export default React.memo(NearbyProperties);
