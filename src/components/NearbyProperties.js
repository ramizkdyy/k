import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Animated,
} from "react-native";
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
  faHeart,
  faLocationDot,
  faBath,
  faBed,
  faFingerprint,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { LoadingSkeleton, ShimmerPlaceholder } from "./LoadingSkeleton";
import { LinearGradient } from "expo-linear-gradient";
import { useFypCacheTracker } from "../hooks/useFypCacheTracker";
import { faHouseBlank } from "@fortawesome/pro-regular-svg-icons";

const NearbyProperties = ({ navigation, onRefresh, refreshing }) => {
  // ✅ OPTIMIZED: Memoized ErrorPlaceholder komponenti
  const ErrorPlaceholder = React.memo(
    ({ width, height, borderRadius = 30 }) => (
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
        <FontAwesomeIcon icon={faHouseBlank} size={30} color="#fff" />
      </View>
    )
  );

  // ✅ OPTIMIZED: Memoized ImageWithFallback komponenti
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
      const [imageKey, setImageKey] = useState(0);
      const sourceUri = useMemo(() => source?.uri, [source?.uri]);

      // ✅ OPTIMIZED: Reset sadece URI değiştiğinde
      useEffect(() => {
        if (sourceUri) {
          setHasError(false);
          setIsLoading(false);
          setImageKey((prev) => prev + 1);
        }
      }, [sourceUri]);

      const handleError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
      }, []);

      const handleLoadStart = useCallback(() => setIsLoading(true), []);
      const handleLoad = useCallback(() => setIsLoading(false), []);

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
            key={imageKey}
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
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: style?.borderRadius || 30,
                backgroundColor: "#f5f5f5",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FontAwesomeIcon icon={faHouseBlank} size={20} color="#ccc" />
            </View>
          )}
        </View>
      );
    }
  );

  // ✅ OPTIMIZED: Memoized MatchScoreBar komponenti
  const MatchScoreBar = React.memo(
    ({ matchScore, showBar = false, size = "sm" }) => {
      const progressAnim = useRef(new Animated.Value(0)).current;
      const timeoutRef = useRef(null);
      const lastMatchScore = useRef(null);
      const hasAnimated = useRef(false);

      const scoreInfo = useMemo(
        () => getMatchScoreInfo(matchScore),
        [matchScore]
      );

      // ✅ OPTIMIZED: Memoized sizes
      const sizes = useMemo(
        () => ({
          xs: {
            barHeight: 2,
            iconSize: 10,
            textSize: 11,
            containerPadding: 1,
            barWidth: "100%",
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
        }),
        []
      );

      const currentSize = sizes[size];

      // ✅ OPTIMIZED: Sadece gerçek değişikliklerde animate et
      useEffect(() => {
        if (
          matchScore !== lastMatchScore.current &&
          typeof matchScore === "number"
        ) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          const delay = hasAnimated.current ? 200 : 0;

          timeoutRef.current = setTimeout(() => {
            Animated.timing(progressAnim, {
              toValue: matchScore,
              duration: hasAnimated.current ? 800 : 400,
              useNativeDriver: false,
            }).start();

            lastMatchScore.current = matchScore;
            hasAnimated.current = true;
          }, delay);
        }

        return () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      }, [matchScore, progressAnim]);

      // ✅ OPTIMIZED: Cleanup on unmount
      useEffect(() => {
        return () => {
          progressAnim.stopAnimation();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      }, [progressAnim]);

      if (showBar) {
        return (
          <View style={{ marginTop: currentSize.containerPadding * 2 }}>
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
                    backgroundColor: "#000",
                    height: "100%",
                    borderRadius: currentSize.barHeight / 2,
                  }}
                />
              </View>
              <Text
                className="font-medium ml-1"
                style={{
                  color: "#000",
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
    }
  );

  const { getCacheValueForQuery, recordApiCall, resetCache, getCacheInfo } =
    useFypCacheTracker();

  // ✅ OPTIMIZED: Memoized Match Score gösterim fonksiyonu
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

  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ OPTIMIZED: Memoized location effect
  useEffect(() => {
    let isMounted = true;

    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (isMounted) {
            setUserLocation({
              latitude: 41.0082,
              longitude: 28.9784,
            });
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
          setUserLocation({
            latitude: 41.0082,
            longitude: 28.9784,
          });
        }
      } finally {
        if (isMounted) {
          setLocationLoading(false);
        }
      }
    };

    getCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ OPTIMIZED: API call with better dependencies
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

  // ✅ OPTIMIZED: Memoized data sections
  const nearFromYouProperties = useMemo(
    () => nearbyData?.result?.nearFromYou || [],
    [nearbyData?.result?.nearFromYou]
  );

  const secondSectionData = useMemo(() => {
    if (userRole === "EVSAHIBI") {
      return nearbyData?.result?.bestTenantMatch || [];
    } else if (userRole === "KIRACI") {
      return nearbyData?.result?.bestLandlordMatch || [];
    }
    return [];
  }, [nearbyData?.result, userRole]);

  const thirdSectionData = useMemo(() => {
    if (userRole === "EVSAHIBI") {
      return nearbyData?.result?.similarPost || [];
    } else if (userRole === "KIRACI") {
      return nearbyData?.result?.bestForYou || [];
    }
    return [];
  }, [nearbyData?.result, userRole]);

  // ✅ OPTIMIZED: Memoized refresh handler
  const handleRefresh = useCallback(async () => {
    if (!userLocation || !currentUser?.id) return;

    setIsRefreshing(true);
    try {
      resetCache();
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
  }, [userLocation, currentUser?.id, resetCache, refetch, onRefresh]);

  // ✅ OPTIMIZED: Effect for parent refresh
  useEffect(() => {
    if (refreshing && userLocation && currentUser?.id) {
      handleRefresh();
    }
  }, [refreshing, userLocation, currentUser?.id, handleRefresh]);

  // ✅ OPTIMIZED: Effect for recording API calls
  useEffect(() => {
    if (nearbyData && !getCacheValueForQuery()) {
      recordApiCall();
    }
  }, [nearbyData, getCacheValueForQuery, recordApiCall]);

  // ✅ OPTIMIZED: Memoized full refresh handler
  const handleFullRefresh = useCallback(async () => {
    console.log("===== FULL REFRESH STARTED =====");
    setIsRefreshing(true);

    try {
      resetCache();

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

      const result = await refetch();
      console.log("Full refresh refetch result:", result);
    } catch (error) {
      console.log("Full refresh error:", error);
    } finally {
      setIsRefreshing(false);
      console.log("===== FULL REFRESH ENDED =====");
    }
  }, [resetCache, refetch]);

  // ✅ OPTIMIZED: Memoized navigation handlers
  const handlePropertyPress = useCallback(
    (postId) => {
      navigation.navigate("PostDetail", { postId });
    },
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

  // ✅ OPTIMIZED: Memoized render functions
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
              uri:
                item.postImages && item.postImages.length > 0
                  ? item.postImages[0].postImageUrl
                  : item.firstPostİmageURL,
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
          <View className="">
            <Text
              style={{ fontSize: 16, fontWeight: 600 }}
              className="text-gray-800"
              numberOfLines={2}
            >
              {item.ilanBasligi ||
                item.title ||
                `${item.il} ${item.ilce} ${item.odaSayisi} Kiralık Daire`}
            </Text>
          </View>
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
        <View className="relative">
          <ImageWithFallback
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              boxShadow: "0px 0px 12px #00000014",
            }}
            source={{
              uri:
                item.postImages && item.postImages.length > 0
                  ? item.postImages[0].postImageUrl
                  : item.firstPostİmageURL,
            }}
            className="rounded-2xl border border-gray-100"
            contentFit="cover"
            fallbackWidth={80}
            fallbackHeight={80}
            borderRadius={20}
          />
        </View>

        <View className="flex-1 flex flex-col">
          <View>
            <Text
              style={{ fontSize: 16, fontWeight: 600 }}
              className="text-gray-800 mb-2"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.ilanBasligi ||
                item.title ||
                `${item.il} ${item.ilce} Kiralık Daire`}
            </Text>
          </View>

          <View>
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

            {item.matchScore && (
              <MatchScoreBar
                matchScore={item.matchScore}
                showBar={true}
                size="xs"
              />
            )}
          </View>

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
    ({ item }) => (
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
            source={{
              uri:
                userRole === "EVSAHIBI"
                  ? item.tenantURL
                  : item.landlordProfileURL,
            }}
            className="rounded-full border border-gray-100"
            contentFit="cover"
            fallbackWidth={60}
            fallbackHeight={60}
            borderRadius={100}
          />

          <View className="flex-1 flex-col items-center ml-3 mb-1">
            <Text
              style={{ fontSize: 16, fontWeight: 700 }}
              className="text-gray-800"
              numberOfLines={1}
            >
              {userRole === "EVSAHIBI"
                ? item.tenantName || "Kiracı"
                : item.landlordName || "Ev Sahibi"}
            </Text>
          </View>
        </View>

        <View className="px-10 flex justify-center items-center">
          <View className="">
            <MatchScoreBar
              matchScore={item.matchScore}
              showBar={true}
              size="sm"
            />

            {item.matchReasons && item.matchReasons.length > 0 && (
              <Text style={{ fontSize: 12 }} className="text-gray-500 mt-2">
                {item.matchReasons[0]}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handlePersonPress(item)}
          activeOpacity={1}
          className="py-3 mt-4 border border-black rounded-full"
        >
          <Text className="text-center font-medium">Göz at</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handlePersonPress, userRole]
  );

  // ✅ OPTIMIZED: Memoized handleSeeAll
  const handleSeeAll = useCallback(
    (type) => {
      console.log("handleSeeAll called with type:", type);

      if (type === "similarPosts" || type === "recommendedForYou") {
        if (userRole === "EVSAHIBI") {
          navigation.navigate("AllSimilarProperties", {
            userLocation: userLocation,
            similarPosts: thirdSectionData,
            searchType: "general",
            landlordUserId: currentUser?.id,
          });
        } else {
          navigation.navigate("AllRecommendedPosts");
        }
      } else if (type === "bestTenants") {
        navigation.navigate("AllMatchingUsers", {
          initialLocation: userLocation,
          searchType: type,
        });
      } else if (type === "bestLandlords") {
        navigation.navigate("AllMatchingUsers", {
          initialLocation: userLocation,
          searchType: type,
        });
      } else {
        navigation.navigate("AllNearbyProperties", {
          initialLocation: userLocation,
          searchType: type,
        });
      }
    },
    [userRole, navigation, userLocation, thirdSectionData, currentUser?.id]
  );

  // ✅ OPTIMIZED: Memoized scroll handlers
  const handleScrollBeginDrag = useCallback(() => {
    navigation.getParent()?.setOptions({
      swipeEnabled: false,
    });
  }, [navigation]);

  const handleScrollEndDrag = useCallback(() => {
    navigation.getParent()?.setOptions({
      swipeEnabled: true,
    });
  }, [navigation]);

  const handleMomentumScrollEnd = useCallback(() => {
    navigation.getParent()?.setOptions({
      swipeEnabled: true,
    });
  }, [navigation]);

  // ✅ OPTIMIZED: Memoized FlatList props
  const flatListProps = useMemo(
    () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: 3,
      windowSize: 5,
      initialNumToRender: 3,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      scrollEnabled: true,
      onScrollBeginDrag: handleScrollBeginDrag,
      onScrollEndDrag: handleScrollEndDrag,
      onMomentumScrollEnd: handleMomentumScrollEnd,
    }),
    [handleScrollBeginDrag, handleScrollEndDrag, handleMomentumScrollEnd]
  );

  // ✅ OPTIMIZED: Memoized key extractors
  const nearPropertyKeyExtractor = useCallback(
    (item, index) => `near_${item.postId}_${index}`,
    []
  );

  const personKeyExtractor = useCallback(
    (item, index) =>
      userRole === "EVSAHIBI"
        ? `tenant_${item.tenantProfileId}_${index}`
        : `landlord_${item.landlordProfileId}_${index}`,
    [userRole]
  );

  const thirdSectionKeyExtractor = useCallback(
    (item, index) => `third_${item.postId}_${index}`,
    []
  );

  // ✅ OPTIMIZED: Early returns with memoized conditions
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
        <View className="">
          <LoadingSkeleton count={3} />
        </View>
        <View className="mb-6">
          <LoadingSkeleton count={3} />
        </View>
      </View>
    );
  }

  const isLoading = isLoadingNearby || isRefreshing;
  const hasNoData =
    nearFromYouProperties.length === 0 &&
    secondSectionData.length === 0 &&
    thirdSectionData.length === 0;

  return (
    <View className="flex flex-col">
      {isLoading ? (
        <View>
          <LoadingSkeleton count={3} />
          <LoadingSkeleton count={3} />
        </View>
      ) : (
        <>
          {/* 1. BÖLÜM: Yakınındaki Evler */}
          {nearFromYouProperties.length > 0 && (
            <View className="">
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

              <FlatList
                style={{ paddingLeft: 16 }}
                data={nearFromYouProperties}
                renderItem={renderPropertyCard}
                keyExtractor={nearPropertyKeyExtractor}
                horizontal
                contentContainerStyle={{ paddingRight: 20 }}
                {...flatListProps}
              />
            </View>
          )}

          {/* 2. BÖLÜM: Kişiler */}
          {secondSectionData.length > 0 && (
            <View className="">
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

              <FlatList
                style={{ paddingLeft: 16 }}
                data={secondSectionData}
                renderItem={renderPersonCard}
                keyExtractor={personKeyExtractor}
                horizontal
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                {...flatListProps}
              />
            </View>
          )}

          {/* 3. BÖLÜM: Mülkler */}
          {thirdSectionData.length > 0 && (
            <View className="">
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
                vertical
                className="pt-2"
                contentContainerStyle={{ paddingRight: 20 }}
                {...flatListProps}
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
