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
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  BedDouble,
  Grid2x2,
  Banknote,
  Ruler,
  ShowerHead,
  Car,
  Calendar,
  Building,
  Coins,
  Search,
  ChevronLeft,
  CircleAlert,
  ListFilter,
  SlidersHorizontal,
  House,
  Heart,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// ✅ OPTIMIZED: Memoized ErrorPlaceholder
const ErrorPlaceholder = memo(({ width, height, borderRadius = 8 }) => {
  const iconSize = useMemo(
    () => Math.min(width, height) * 0.1,
    [width, height]
  );

  return (
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
      <House size={iconSize} color="#fff" />
    </View>
  );
});

// ✅ OPTIMIZED: Memoized ImageWithFallback with better performance
const ImageWithFallback = memo(
  ({
    source,
    style,
    contentFit = "cover",
    className = "",
    fallbackWidth,
    fallbackHeight,
    borderRadius,
    placeholder,
    recyclingKey,
    ...props
  }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // ✅ Start with false for better UX
    const [imageKey, setImageKey] = useState(0);
    const sourceUri = useMemo(() => source?.uri, [source?.uri]);

    // ✅ OPTIMIZED: Reset only when URI actually changes
    useEffect(() => {
      if (sourceUri) {
        setHasError(false);
        setIsLoading(false); // ✅ Don't show loading for cached images
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
          borderRadius={borderRadius || style?.borderRadius || 8}
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
          placeholder={placeholder}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey}
          transition={0} // ✅ Disable transition for better performance
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
              borderRadius: style?.borderRadius || 8,
            }}
          >
            <ShimmerPlaceholder
              width={fallbackWidth || style?.width || 200}
              height={fallbackHeight || style?.height || 200}
              borderRadius={borderRadius || style?.borderRadius || 8}
            />
          </View>
        )}
      </View>
    );
  }
);

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

// ✅ OPTIMIZED: Memoized Property Details Slider
const PropertyDetailsSlider = memo(({ item }) => {
  const propertyDetails = useMemo(
    () => [
      {
        id: "rooms",
        Icon: BedDouble,
        value: item.odaSayisi || "N/A",
        label: "Oda",
      },
      {
        id: "bedrooms",
        Icon: BedDouble,
        value: item.yatakOdasiSayisi || "N/A",
        label: "Y.Odası",
      },
      {
        id: "bathrooms",
        Icon: ShowerHead,
        value: item.banyoSayisi || "N/A",
        label: "Banyo",
      },
      {
        id: "area",
        Icon: Ruler,
        value: item.brutMetreKare ? `${item.brutMetreKare} m²` : "N/A",
        label: "Alan",
      },
      {
        id: "floor",
        Icon: Building,
        value: item.bulunduguKat || "N/A",
        label: "Kat",
      },
      {
        id: "age",
        Icon: Calendar,
        value: item.binaYasi ? `${item.binaYasi}` : "N/A",
        label: "Bina yaşı",
      },
      {
        id: "dues",
        Icon: Banknote,
        value: item.aidat ? `${item.aidat}₺` : "Yok",
        label: "Aidat",
      },
      {
        id: "deposit",
        Icon: Coins,
        value: item.depozito ? `${item.depozito}₺` : "Yok",
        label: "Depozito",
      },
    ],
    [item]
  );

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
            <detail.Icon size={30} color="#000" />
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

// ✅ OPTIMIZED: Memoized Image Slider with better performance
const PropertyImageSlider = memo(
  ({ images, distance, status, postId, onPress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const slideSize = useMemo(() => width - 32, []);

    const handleScroll = useCallback(
      (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentIndex(index);
      },
      [slideSize]
    );

    const handleDotPress = useCallback(
      (index) => {
        setCurrentIndex(index);
        scrollViewRef.current?.scrollTo({
          x: slideSize * index,
          animated: true,
        });
      },
      [slideSize]
    );

    const hasImages = useMemo(() => images && images.length > 0, [images]);
    const hasDistance = useMemo(() => distance && distance > 0, [distance]);
    const hasMultipleImages = useMemo(
      () => images && images.length > 1,
      [images]
    );

    const statusText = useMemo(() => {
      switch (status) {
        case 0:
          return "Aktif";
        case 1:
          return "Kiralandı";
        default:
          return "Kapalı";
      }
    }, [status]);

    if (!hasImages) {
      return (
        <TouchableOpacity
          className="w-full justify-center items-center rounded-3xl"
          style={{ height: 350 }}
          onPress={onPress}
          activeOpacity={1}
        >
          <ErrorPlaceholder width={slideSize} height={350} borderRadius={25} />
        </TouchableOpacity>
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
          style={{ width: slideSize }}
        >
          {images.map((item, index) => (
            <TouchableOpacity
              key={`image-${postId}-${index}`}
              style={{ width: slideSize }}
              activeOpacity={1}
              onPress={onPress}
            >
              <ImageWithFallback
                source={{ uri: item.postImageUrl }}
                style={{ width: slideSize, height: 350 }}
                contentFit="cover"
                fallbackWidth={slideSize}
                fallbackHeight={350}
                borderRadius={0}
                placeholder={{
                  uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
                }}
                recyclingKey={`${postId}-${index}`}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Distance badge */}
        {hasDistance && (
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
              {statusText}
            </Text>
          </BlurView>
        </View>

        {/* Pagination dots */}
        {hasMultipleImages && (
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

// ✅ OPTIMIZED: Memoized Property Item - CRITICAL FOR PERFORMANCE
const PropertyItem = memo(
  ({ item, navigation, getRelativeTime }) => {
    const handleImagePress = useCallback(() => {
      navigation.navigate("PostDetail", { postId: item.postId });
    }, [item.postId, navigation]);

    const handleProfilePress = useCallback(() => {
      console.log("PROFILE NAVIGATION DATA:", JSON.stringify(item, null, 2));
      console.log("userId:", item.userId);

      navigation.navigate("UserProfile", {
        userId: item.userId,
        userRole: "EVSAHIBI",
        matchScore: item.matchScore,
      });
    }, [item, navigation]);

    // ✅ OPTIMIZED: Memoized calculated values
    const titleText = useMemo(
      () => item.ilanBasligi || "İlan başlığı yok",
      [item.ilanBasligi]
    );

    const locationText = useMemo(() => {
      if (item.ilce && item.il) return `${item.ilce}, ${item.il}`;
      return item.il || "Konum belirtilmemiş";
    }, [item.ilce, item.il]);

    const priceText = useMemo(() => {
      if (item.kiraFiyati || item.rent) {
        return `${(item.kiraFiyati || item.rent).toLocaleString()} ${
          item.paraBirimi || item.currency || "₺"
        }`;
      }
      return "Fiyat belirtilmemiş";
    }, [item.kiraFiyati, item.rent, item.paraBirimi, item.currency]);

    const userInitial = useMemo(
      () => item.user?.name?.charAt(0) || "E",
      [item.user?.name]
    );

    const userName = useMemo(
      () => `${item.user?.name} ${item.user?.surname}`,
      [item.user?.name, item.user?.surname]
    );

    const matchScoreText = useMemo(
      () =>
        item.matchScore ? `Skor: ${item.matchScore.toFixed(1)}` : "Rating",
      [item.matchScore]
    );

    const relativeTime = useMemo(
      () => getRelativeTime(item.postTime),
      [getRelativeTime, item.postTime]
    );

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
              {titleText}
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 12 }} className=" text-gray-500">
              {locationText}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text
              style={{ fontSize: 18, fontWeight: 500 }}
              className="text-gray-900 underline"
            >
              {priceText}
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
                    {item.user?.profilePictureUrl ? (
                      <ImageWithFallback
                        source={{ uri: item.user.profilePictureUrl }}
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                        className="w-full h-full rounded-full"
                        fallbackWidth={48}
                        fallbackHeight={48}
                        borderRadius={24}
                      />
                    ) : (
                      <View>
                        <Text className="text-xl font-bold text-gray-900">
                          {userInitial}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-col">
                    <Text
                      style={{ fontSize: 14 }}
                      className="font-semibold text-gray-800"
                    >
                      {userName}
                    </Text>
                    <View className="flex flex-row items-center gap-1">
                      <Text style={{ fontSize: 12 }} className="text-gray-500">
                        {matchScoreText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <Text
                  className=" text-gray-500"
                  style={{ fontSize: 12, fontWeight: 400, marginBottom: 13 }}
                >
                  {relativeTime}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // ✅ OPTIMIZED: Better comparison for performance
    return (
      prevProps.item.postId === nextProps.item.postId &&
      prevProps.item.matchScore === nextProps.item.matchScore &&
      prevProps.item.status === nextProps.item.status
    );
  }
);

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
  const [isMatch, setIsMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProperties, setAllProperties] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFilterChanging, setIsFilterChanging] = useState(false);
  const [hasInitialDataLoaded, setHasInitialDataLoaded] = useState(false); // ✅ NEW: İlk veri yüklenme durumu

  const scrollY = useRef(new Animated.Value(0)).current;

  // ✅ OPTIMIZED: Memoized getRelativeTime function
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
      console.log("Location error:", error);
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
    if (nearbyData?.data) {
      const newProperties = nearbyData.data;
      const pagination = nearbyData.pagination;

      if (currentPage === 1) {
        setAllProperties(newProperties);
        setIsFilterChanging(false);
        setHasInitialDataLoaded(true); // ✅ Mark initial data as loaded
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
      { key: 3, label: "Görüntülenme" },
      { key: 4, label: "Güncellenme" },
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
      <PropertyItem
        item={item}
        navigation={navigation}
        getRelativeTime={getRelativeTime}
      />
    ),
    [navigation, getRelativeTime]
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

    if (!hasNoData || !isLoadingComplete) {
      return null; // Henüz loading bitmemiş veya veri var
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
  const toggleMatch = useCallback(() => setIsMatch(!isMatch), [isMatch]);

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

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <CircleAlert size={50} color="#000" />
          <Text className="text-xl font-semibold text-gray-900 mt-2 mb-2 text-center">
            Bir hata oluştu
          </Text>
          <Text className="text-base text-gray-500 text-center mb-4">
            Yakındaki evler yüklenirken bir sorun oluştu.
          </Text>
          <TouchableOpacity
            className="border border-gray-900 px-6 py-3 rounded-full"
            onPress={onRefresh}
          >
            <Text className="text-gray-900 font-medium">Tekrar Dene</Text>
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
            <ChevronLeft size={25} color="black" />
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
              <SlidersHorizontal
                size={20}
                color={isMatch ? "#4A90E2" : "black"}
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
