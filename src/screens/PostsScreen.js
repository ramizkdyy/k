import React, { useState, useEffect, useCallback, useRef } from "react";
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
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useSelector, useDispatch } from "react-redux";
import { selectUserRole, selectCurrentUser } from "../redux/slices/authSlice";
import {
  selectAllUserPosts,
  selectPostFilters,
  setPostFilters,
  clearPostFilters,
} from "../redux/slices/postSlice";
import {
  useGetLandlordPropertyListingsQuery,
  useGetAllPostsPaginatedQuery,
  useDeletePostMutation,
} from "../redux/api/apiSlice";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faHomeAlt,
  faHouseBlank,
  faPlus,
  faSliders,
} from "@fortawesome/pro-regular-svg-icons";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import { BlurView } from "expo-blur";
import {
  faEdit,
  faTrash,
  faBed,
  faShower,
  faRuler,
  faBuilding,
  faCalendar,
  faMoneyBills,
  faCoins,
  faBedBunk,
  faBath,
} from "@fortawesome/pro-light-svg-icons";
import PropertiesFilterModal from "../modals/PropertiesFilterModal";
import { useSearchPostsMutation } from "../redux/api/searchApiSlice";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Logger utility
const Logger = {
  info: (component, action, data = {}) => {
    console.log(`[${component}] ${action}`, data);
  },
  error: (component, action, error) => {
    console.error(`[${component}] ERROR: ${action}`, error);
  },
  event: (eventName, properties = {}) => {
    console.log(`[EVENT] ${eventName}`, properties);
  },
};

const { width: screenWidth } = Dimensions.get("window");

// Image with Fallback Component (AllNearbyPropertiesScreen'den)
const ImageWithFallback = React.memo(
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (source?.uri) {
        setHasError(false);
        setIsLoading(true);
      }
    }, [source?.uri]);

    if (hasError || !source?.uri) {
      return (
        <View
          style={{
            width: fallbackWidth || style?.width || 200,
            height: fallbackHeight || style?.height || 200,
            borderRadius: borderRadius || style?.borderRadius || 8,
            backgroundColor: "#f5f5f5",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesomeIcon
            icon={faHomeAlt}
            size={
              Math.min(
                fallbackWidth || style?.width || 200,
                fallbackHeight || style?.height || 200
              ) * 0.1
            }
            color="#cbd5e1"
          />
        </View>
      );
    }

    return (
      <View style={{ position: "relative" }}>
        <Image
          source={source}
          style={style}
          className={className}
          contentFit={contentFit}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
          placeholder={placeholder}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey}
          transition={0}
          {...props}
        />
      </View>
    );
  }
);

// Property Details Slider Component (AllNearbyPropertiesScreen'den)
const PropertyDetailsSlider = React.memo(({ item }) => {
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

// Image Slider Component (AllNearbyPropertiesScreen'den)
const PropertyImageSlider = React.memo(
  ({
    images,
    distance,
    status,
    postId,
    onPress,
    userRole,
    currentUser,
    item,
    onEdit,
    onDelete,
    onOffers,
    isDeleting,
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const handleScroll = useCallback((event) => {
      const slideSize = screenWidth - 32;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentIndex(index);
    }, []);

    const handleDotPress = useCallback((index) => {
      setCurrentIndex(index);
      const slideSize = screenWidth - 32;
      scrollViewRef.current?.scrollTo({ x: slideSize * index, animated: true });
    }, []);

    if (!images || images.length === 0) {
      return (
        <TouchableOpacity
          className="w-full justify-center items-center rounded-3xl bg-gray-100"
          style={{ height: 350 }}
          onPress={onPress}
          activeOpacity={1}
        >
          <FontAwesomeIcon icon={faHomeAlt} size={50} color="#cbd5e1" />
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
          style={{ width: screenWidth - 32 }}
        >
          {images.map((img, index) => (
            <TouchableOpacity
              key={`image-${postId}-${index}`}
              style={{ width: screenWidth - 32 }}
              activeOpacity={1}
              onPress={onPress}
            >
              <ImageWithFallback
                source={{ uri: img.postImageUrl }}
                style={{ width: screenWidth - 32, height: 350 }}
                contentFit="cover"
                fallbackWidth={screenWidth - 32}
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
        {distance && (
          <BlurView
            style={{ boxShadow: "0px 0px 12px #00000012" }}
            intensity={50}
            tint="dark"
            className="absolute top-3 left-3 rounded-full overflow-hidden"
          >
            <View className="px-3 py-1.5 rounded-full flex-row items-center">
              <MaterialIcons name="location-on" size={12} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                {distance}
              </Text>
            </View>
          </BlurView>
        )}

        {/* Status badge - sadece ev sahibi için */}
        {userRole === "EVSAHIBI" && (
          <BlurView
            intensity={50}
            tint="dark"
            style={{ overflow: "hidden", borderRadius: 100 }}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              {status === 0 ? "Aktif" : status === 1 ? "Kiralandı" : "Kapalı"}
            </Text>
          </BlurView>
        )}

        {/* Ev sahibi action buttons */}
        {userRole === "EVSAHIBI" && item.userId === currentUser?.id && (
          <View className="flex-row absolute gap-2 bottom-3 right-3">
            <BlurView
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              tint="dark"
              intensity={50}
              className="overflow-hidden rounded-full"
            >
              <TouchableOpacity
                className="flex justify-center items-center"
                onPress={onOffers}
                activeOpacity={1}
              >
                <View className="flex-row items-center justify-center px-3 py-3">
                  <Text className="text-white font-medium text-center text-sm">
                    Teklifler ({item.offerCount || 0})
                  </Text>
                </View>
              </TouchableOpacity>
            </BlurView>

            <BlurView
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              intensity={50}
              tint="dark"
              className="overflow-hidden rounded-full"
            >
              <TouchableOpacity
                className="flex justify-center items-center py-3 px-3"
                onPress={onEdit}
                activeOpacity={1}
              >
                <View className="flex-row items-center justify-center">
                  <FontAwesomeIcon color="white" icon={faEdit} />
                </View>
              </TouchableOpacity>
            </BlurView>

            <BlurView
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              intensity={50}
              tint="dark"
              className="overflow-hidden rounded-full"
            >
              <TouchableOpacity
                className="flex justify-center items-center"
                onPress={onDelete}
                disabled={isDeleting}
                activeOpacity={1}
              >
                <View className="flex-row items-center justify-center py-3 px-3">
                  <FontAwesomeIcon color="#ff0040" icon={faTrash} />
                </View>
              </TouchableOpacity>
            </BlurView>
          </View>
        )}

        {/* Pagination dots */}
        {images && images.length > 1 && (
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

const PostsScreen = ({ navigation }) => {
  const COMPONENT_NAME = "PostsScreen";
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const filters = useSelector(selectPostFilters);
  const userPosts = useSelector(selectAllUserPosts);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [searchPosts] = useSearchPostsMutation();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allPostsData, setAllPostsData] = useState([]);
  const PAGE_SIZE = 10;
  const [filterCurrentPage, setFilterCurrentPage] = useState(1);
  const [isLoadingMoreFiltered, setIsLoadingMoreFiltered] = useState(false);

  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [activeFilterData, setActiveFilterData] = useState(null);
  const [filterMetadata, setFilterMetadata] = useState(null);
  const [sortDirection, setSortDirection] = useState(0);
  const [sortBy, setSortBy] = useState(null);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const SCROLL_DISTANCE = 50;

  const sortPosts = useCallback(
    (posts, sortType = sortBy, direction = sortDirection) => {
      if (!posts || posts.length === 0) return posts;
      if (!sortType) return posts;

      return [...posts].sort((a, b) => {
        let valueA, valueB;

        switch (sortType) {
          case "distance":
            valueA = a.distance
              ? parseFloat(a.distance.replace(/[^\d.]/g, ""))
              : 999999;
            valueB = b.distance
              ? parseFloat(b.distance.replace(/[^\d.]/g, ""))
              : 999999;
            break;

          case "price":
            valueA = a.kiraFiyati || 0;
            valueB = b.kiraFiyati || 0;
            break;

          case "date":
            valueA = new Date(a.olusturmaTarihi || a.createdAt || 0);
            valueB = new Date(b.olusturmaTarihi || b.createdAt || 0);
            break;

          case "views":
            valueA = a.goruntulemeSayisi || a.viewCount || 0;
            valueB = b.goruntulemeSayisi || b.viewCount || 0;
            break;

          default:
            return 0;
        }

        if (direction === 0) {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });
    },
    [sortBy, sortDirection]
  );

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: "clamp",
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    location: filters.location || "",
    priceMin: filters.priceMin ? String(filters.priceMin) : "",
    priceMax: filters.priceMax ? String(filters.priceMax) : "",
    quickPrice: filters.quickPrice || null,
    rooms: filters.rooms || null,
    propertyType: filters.propertyType || null,
    features: filters.features || {},
    status: filters.status || null,
    sortBy: filters.sortBy || null,
  });

  const {
    data: landlordListingsData,
    isLoading: isLoadingLandlordListings,
    refetch: refetchLandlordListings,
    error: landlordListingsError,
  } = useGetLandlordPropertyListingsQuery(currentUser?.id, {
    skip: userRole !== "EVSAHIBI" || !currentUser?.id,
  });

  const {
    data: paginatedPostsResponse,
    isLoading: isLoadingAllPosts,
    isFetching: isFetchingAllPosts,
    refetch: refetchAllPosts,
    error: allPostsError,
  } = useGetAllPostsPaginatedQuery(
    {
      page: currentPage,
      pageSize: PAGE_SIZE,
    },
    {
      skip: userRole !== "KIRACI",
    }
  );

  const [deletePost, { isLoading: isDeleting, error: deleteError }] =
    useDeletePostMutation();

  // Helper function for relative time
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

  useEffect(() => {
    Logger.info(COMPONENT_NAME, "Component mounted", {
      userRole,
      userId: currentUser?.id,
    });

    return () => {
      Logger.info(COMPONENT_NAME, "Component unmounted");
    };
  }, []);

  useEffect(() => {
    if (landlordListingsError) {
      Logger.error(
        COMPONENT_NAME,
        "Failed to fetch landlord listings",
        landlordListingsError
      );
    }
  }, [landlordListingsError]);

  useEffect(() => {
    if (allPostsError) {
      Logger.error(COMPONENT_NAME, "Failed to fetch all posts", allPostsError);
    }
  }, [allPostsError]);

  useEffect(() => {
    if (deleteError) {
      Logger.error(COMPONENT_NAME, "Failed to delete post", deleteError);
    }
  }, [deleteError]);

  useEffect(() => {
    if (userRole === "EVSAHIBI" && landlordListingsData) {
      Logger.info(COMPONENT_NAME, "Landlord listings loaded", {
        count: landlordListingsData?.result?.length || 0,
      });
    }
  }, [landlordListingsData, userRole]);

  useEffect(() => {
    if (userRole === "KIRACI" && paginatedPostsResponse) {
      Logger.info(COMPONENT_NAME, "Paginated posts loaded", {
        totalCount: paginatedPostsResponse?.pagination?.totalCount || 0,
        currentPage: paginatedPostsResponse?.pagination?.currentPage || 1,
        totalPages: paginatedPostsResponse?.pagination?.totalPages || 1,
        hasNextPage: paginatedPostsResponse?.pagination?.hasNextPage || false,
        newDataLength: paginatedPostsResponse?.data?.length || 0,
      });

      setHasNextPage(paginatedPostsResponse?.pagination?.hasNextPage || false);

      if (currentPage === 1) {
        setAllPostsData(paginatedPostsResponse?.data || []);
      } else {
        setAllPostsData((prevData) => {
          const newData = paginatedPostsResponse?.data || [];
          const existingPostIds = new Set(prevData.map((item) => item.postId));

          const uniqueNewData = newData.filter(
            (item) => item && item.postId && !existingPostIds.has(item.postId)
          );

          console.log(
            `Adding ${uniqueNewData.length} new unique posts out of ${newData.length} total`
          );

          return [...prevData, ...uniqueNewData];
        });
      }

      setIsLoadingMore(false);
    }
  }, [paginatedPostsResponse, userRole, currentPage]);

  useEffect(() => {
    if (searchQuery) {
      Logger.event("search_posts", { query: searchQuery });
    }
  }, [searchQuery]);

  const handleFilterPress = () => {
    Logger.event("filter_button_pressed");
    setIsFilterModalVisible(true);
  };

  const handleFilterModalClose = () => {
    Logger.event("filter_modal_closed");
    setIsFilterModalVisible(false);
  };

  const handleFilterModalApply = (appliedFilters, searchResult) => {
    console.log("=== FILTER MODAL APPLY DEBUG ===");
    console.log("Applied filters:", appliedFilters);
    console.log("Search result:", searchResult);

    Logger.event("filter_modal_applied", {
      filtersCount: Object.keys(appliedFilters).length,
      resultsCount: searchResult?.posts?.length || 0,
    });

    dispatch(setPostFilters(appliedFilters));

    const hasFilters = Object.values(appliedFilters).some(
      (value) =>
        value !== null &&
        value !== "" &&
        (Array.isArray(value) ? value.length > 0 : true)
    );
    setHasActiveFilters(hasFilters);
    setActiveFilterData(hasFilters ? appliedFilters : null);

    setCurrentPage(1);
    setFilterCurrentPage(1);

    if (searchResult) {
      let postsData = [];

      if (searchResult.posts && Array.isArray(searchResult.posts)) {
        postsData = searchResult.posts;
      }

      const validPosts = postsData.filter((post) => {
        return (
          post &&
          post.postId &&
          (typeof post.postId === "number" || typeof post.postId === "string")
        );
      });

      setAllPostsData(validPosts);

      if (searchResult.metadata) {
        setFilterMetadata(searchResult.metadata);
        setHasNextPage(searchResult.metadata.hasNextPage || false);
      } else {
        setFilterMetadata(null);
        setHasNextPage(false);
      }
    } else {
      setAllPostsData([]);
      setFilterMetadata(null);
      setHasNextPage(false);
    }

    setIsFilterModalVisible(false);
  };

  const loadMoreFilteredPosts = useCallback(async () => {
    if (
      !hasActiveFilters ||
      !hasNextPage ||
      isLoadingMoreFiltered ||
      !activeFilterData ||
      !filterMetadata
    ) {
      return;
    }

    Logger.event("load_more_filtered_posts", {
      currentPage: filterCurrentPage + 1,
      totalPages: filterMetadata.totalPages,
    });

    setIsLoadingMoreFiltered(true);

    try {
      const filtersWithPagination = {
        ...activeFilterData,
        page: filterCurrentPage + 1,
        pageSize: PAGE_SIZE,
      };

      console.log("Loading more filtered posts with:", filtersWithPagination);

      const searchResult = await searchPosts(filtersWithPagination).unwrap();

      if (
        searchResult &&
        searchResult.posts &&
        Array.isArray(searchResult.posts)
      ) {
        const validNewPosts = searchResult.posts.filter(
          (post) =>
            post &&
            post.postId &&
            (typeof post.postId === "number" || typeof post.postId === "string")
        );

        console.log(`Adding ${validNewPosts.length} more filtered posts`);

        setAllPostsData((prevData) => {
          const existingPostIds = new Set(prevData.map((item) => item.postId));
          const uniqueNewPosts = validNewPosts.filter(
            (post) => !existingPostIds.has(post.postId)
          );
          return [...prevData, ...uniqueNewPosts];
        });

        if (searchResult.metadata) {
          setFilterMetadata(searchResult.metadata);
          setHasNextPage(searchResult.metadata.hasNextPage || false);
        }

        setFilterCurrentPage((prev) => prev + 1);

        Logger.info(COMPONENT_NAME, "More filtered posts loaded successfully");
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, "Load more filtered posts failed", error);
      console.error("Load more filtered posts error:", error);
    } finally {
      setIsLoadingMoreFiltered(false);
    }
  }, [
    hasActiveFilters,
    hasNextPage,
    isLoadingMoreFiltered,
    activeFilterData,
    filterMetadata,
    filterCurrentPage,
    searchPosts,
  ]);

  useFocusEffect(
    useCallback(() => {
      Logger.info(COMPONENT_NAME, "Screen focused", { userRole });

      setCurrentPage(1);
      setHasNextPage(true);

      if (!hasActiveFilters) {
        setAllPostsData([]);
        setFilterMetadata(null);

        if (userRole === "EVSAHIBI") {
          refetchLandlordListings();
        } else {
          refetchAllPosts();
        }
      }
    }, [userRole, hasActiveFilters, refetchLandlordListings, refetchAllPosts])
  );

  const handleSortChange = useCallback(
    (newSortBy) => {
      Logger.event("sort_posts_changed", {
        oldSort: sortBy,
        newSort: newSortBy,
        direction: sortBy === newSortBy ? (sortDirection === 0 ? 1 : 0) : 0,
      });

      if (newSortBy === sortBy) {
        setSortDirection((prev) => (prev === 0 ? 1 : 0));
      } else {
        setSortBy(newSortBy);
        setSortDirection(0);
      }
    },
    [sortBy, sortDirection]
  );

  const resetSortOptions = useCallback(() => {
    Logger.event("reset_sort_options");
    setSortBy(null);
    setSortDirection(0);
  }, []);

  const onRefresh = async () => {
    Logger.event("refresh_posts_list", { userRole, hasActiveFilters });

    setRefreshing(true);
    setCurrentPage(1);
    setHasNextPage(true);
    setAllPostsData([]);

    try {
      if (userRole === "EVSAHIBI") {
        await refetchLandlordListings();
      } else if (userRole === "KIRACI") {
        if (hasActiveFilters && activeFilterData) {
          try {
            const searchResult = await searchPosts(activeFilterData).unwrap();

            if (searchResult && searchResult.posts) {
              const validPosts = searchResult.posts.filter(
                (post) => post && post.postId
              );
              setAllPostsData(validPosts);

              if (searchResult.metadata) {
                setFilterMetadata(searchResult.metadata);
                setHasNextPage(searchResult.metadata.hasNextPage || false);
              }
            }
          } catch (filterError) {
            console.error("Filter refresh error:", filterError);
            setHasActiveFilters(false);
            setActiveFilterData(null);
            setFilterMetadata(null);
            dispatch(clearPostFilters());
            await refetchAllPosts();
          }
        } else {
          await refetchAllPosts();
        }
      }

      Logger.info(COMPONENT_NAME, "Refresh completed");
    } catch (error) {
      Logger.error(COMPONENT_NAME, "Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMorePosts = useCallback(() => {
    if (hasActiveFilters) {
      loadMoreFilteredPosts();
      return;
    }

    if (
      userRole !== "KIRACI" ||
      !hasNextPage ||
      isLoadingMore ||
      isFetchingAllPosts
    ) {
      return;
    }

    Logger.event("load_more_posts", { currentPage: currentPage + 1 });

    setIsLoadingMore(true);
    setCurrentPage((prevPage) => prevPage + 1);
  }, [
    userRole,
    hasNextPage,
    isLoadingMore,
    isFetchingAllPosts,
    currentPage,
    hasActiveFilters,
    loadMoreFilteredPosts,
  ]);

  const applyFilters = () => {
    Logger.event("apply_filters", localFilters);

    setCurrentPage(1);
    setHasNextPage(true);
    setAllPostsData([]);

    dispatch(
      setPostFilters({
        location: localFilters.location || null,
        priceMin: localFilters.priceMin
          ? parseFloat(localFilters.priceMin)
          : null,
        priceMax: localFilters.priceMax
          ? parseFloat(localFilters.priceMax)
          : null,
        status: localFilters.status,
      })
    );
    setIsFilterVisible(false);
  };

  const resetFilters = () => {
    Logger.event("reset_filters");

    setCurrentPage(1);
    setFilterCurrentPage(1);
    setHasNextPage(true);
    setAllPostsData([]);
    setHasActiveFilters(false);
    setActiveFilterData(null);
    setFilterMetadata(null);

    setSortBy(null);
    setSortDirection(0);

    const emptyFilters = {
      location: "",
      priceMin: "",
      priceMax: "",
      quickPrice: null,
      rooms: null,
      propertyType: null,
      features: {},
      status: null,
      sortBy: null,
    };

    setLocalFilters(emptyFilters);
    dispatch(clearPostFilters());
    setIsFilterVisible(false);

    if (userRole === "KIRACI") {
      refetchAllPosts();
    }
  };

  const handleDeletePost = (postId) => {
    Logger.event("delete_post_initiated", { postId });

    Alert.alert(
      "İlanı Sil",
      "Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      [
        {
          text: "İptal",
          style: "cancel",
          onPress: () => Logger.event("delete_post_cancelled", { postId }),
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              Logger.info(COMPONENT_NAME, "Deleting post", { postId });
              await deletePost(postId).unwrap();
              Logger.info(COMPONENT_NAME, "Post deleted successfully", {
                postId,
              });

              Alert.alert("Başarılı", "İlan başarıyla silindi.");
              refetchLandlordListings();
            } catch (error) {
              Logger.error(COMPONENT_NAME, "Delete post error", {
                postId,
                errorMessage: error.data?.message || "Unknown error",
              });

              Alert.alert(
                "Hata",
                error.data?.message || "İlan silinirken bir hata oluştu."
              );
            }
          },
        },
      ]
    );
  };

  const handlePostNavigation = (postId) => {
    Logger.event("view_post_detail", { postId });
    navigation.navigate("PostDetail", { postId });
  };

  const handleEditPostNavigation = (postId) => {
    Logger.event("edit_post", { postId });

    const postToEdit = landlordListingsData?.result?.find(
      (post) => post.postId === postId
    );

    if (postToEdit) {
      navigation.navigate("EditPost", {
        propertyData: postToEdit,
      });
    } else {
      console.error("Post data not found for editing:", postId);
      Alert.alert("Hata", "İlan verisi bulunamadı.");
    }
  };

  const handleOffersNavigation = (postId) => {
    Logger.event("view_offers", { postId });
    navigation.navigate("Offers", { postId });
  };

  const handleCreatePostNavigation = () => {
    Logger.event("create_post_initiated");
    navigation.navigate("CreatePost");
  };

  const getFilteredPosts = () => {
    console.log("=== GET FILTERED POSTS DEBUG ===");
    console.log("User role:", userRole);
    console.log("Has active filters:", hasActiveFilters);
    console.log("All posts data length:", allPostsData?.length || 0);
    console.log("Search query:", searchQuery);
    console.log("Sort by:", sortBy, "Sort direction:", sortDirection);

    let filteredPosts = [];

    if (userRole === "EVSAHIBI") {
      filteredPosts = landlordListingsData?.result || [];
      console.log("Using landlord listings:", filteredPosts.length);
    } else {
      filteredPosts = allPostsData || [];
      console.log("Using all posts data:", filteredPosts.length);
    }

    console.log("Raw filtered posts sample:", filteredPosts.slice(0, 2));

    const validPosts = filteredPosts.filter((post) => {
      const isValid =
        post &&
        post.postId &&
        (typeof post.postId === "number" || typeof post.postId === "string");

      if (!isValid && post) {
        console.log("Filtering out invalid post:", {
          postId: post.postId,
          type: typeof post.postId,
        });
      }

      return isValid;
    });

    console.log(`Valid posts after null check: ${validPosts.length}`);

    if (hasActiveFilters) {
      console.log("Processing with active filters");

      const uniquePosts = [];
      const seenPostIds = new Set();

      validPosts.forEach((post) => {
        if (post && post.postId && !seenPostIds.has(post.postId)) {
          seenPostIds.add(post.postId);
          uniquePosts.push(post);
        }
      });

      console.log(`Unique posts: ${uniquePosts.length}`);

      let finalPosts = uniquePosts;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        finalPosts = finalPosts.filter(
          (post) =>
            (post.ilanBasligi &&
              post.ilanBasligi.toLowerCase().includes(query)) ||
            (post.il && post.il.toLowerCase().includes(query)) ||
            (post.ilce && post.ilce.toLowerCase().includes(query))
        );

        console.log(`After search filter: ${finalPosts.length}`);
      }

      const sortedPosts = sortPosts(finalPosts, sortBy, sortDirection);
      console.log(
        `Final result (with filters and sorting): ${sortedPosts.length}`
      );
      return sortedPosts;
    }

    console.log("Processing without active filters");

    const uniquePosts = [];
    const seenPostIds = new Set();

    validPosts.forEach((post) => {
      if (post && post.postId && !seenPostIds.has(post.postId)) {
        seenPostIds.add(post.postId);
        uniquePosts.push(post);
      }
    });

    let finalPosts = uniquePosts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      finalPosts = finalPosts.filter(
        (post) =>
          (post.ilanBasligi &&
            post.ilanBasligi.toLowerCase().includes(query)) ||
          (post.il && post.il.toLowerCase().includes(query)) ||
          (post.ilce && post.ilce.toLowerCase().includes(query))
      );

      console.log(`After search filter: ${finalPosts.length}`);
    }

    const sortedPosts = sortPosts(finalPosts, sortBy, sortDirection);
    console.log(
      `Final result (no filters, with sorting): ${sortedPosts.length}`
    );
    return sortedPosts;
  };

  // YENİ TASARIM - KİRACI İÇİN (AllNearbyPropertiesScreen tarzı)
  const renderTenantPostItem = useCallback(
    ({ item, index }) => {
      if (!item || !item.postId) {
        return null;
      }

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
            onPress={() => handlePostNavigation(item.postId)}
            userRole={userRole}
            currentUser={currentUser}
            item={item}
            onEdit={() => handleEditPostNavigation(item.postId)}
            onDelete={() => handleDeletePost(item.postId)}
            onOffers={() => handleOffersNavigation(item.postId)}
            isDeleting={isDeleting}
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
                onPress={() => {
                  navigation.navigate("UserProfile", {
                    userId: item.userId,
                    userRole: "EVSAHIBI",
                    matchScore: item.matchScore,
                  });
                }}
              >
                <View className="flex-1 flex-row justify-between items-center w-full">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => {
                      navigation.navigate("UserProfile", {
                        userId: item.userId,
                        userRole: "EVSAHIBI",
                        matchScore: item.matchScore,
                      });
                    }}
                  >
                    <View className="w-12 h-12 rounded-full justify-center items-center mr-3 border-gray-900 border">
                      {item.user?.profileImageUrl ? (
                        <ImageWithFallback
                          source={{ uri: item.user.profileImageUrl }}
                          style={{ width: 48, height: 48, borderRadius: 24 }}
                          className="w-full h-full rounded-full"
                          fallbackWidth={48}
                          fallbackHeight={48}
                          borderRadius={24}
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
                        <Text
                          style={{ fontSize: 12 }}
                          className="text-gray-500"
                        >
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
                    {getRelativeTime(item.postTime || item.olusturmaTarihi)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [userRole, currentUser?.id, isDeleting, navigation, getRelativeTime]
  );

  // YENİ TASARIM - EV SAHİBİ İÇİN (NearbyProperties renderVerticalPropertyCard tarzı)
  const renderLandlordPostItem = useCallback(
    ({ item, index }) => {
      if (!item || !item.postId) {
        return null;
      }

      return (
        <TouchableOpacity
          activeOpacity={1}
          className="overflow-hidden w-full flex flex-row items-center gap-4 py-2  border-b border-gray-100"
          onPress={() => handlePostNavigation(item.postId)}
        >
          {/* Sol taraf - Resim */}
          <View className="relative">
            <ImageWithFallback
              style={{
                width: 120,
                height: 120,
                borderRadius: 20,
                boxShadow: "0px 0px 12px #00000014",
              }}
              source={{
                uri:
                  item.postImages && item.postImages.length > 0
                    ? item.postImages[0].postImageUrl
                    : null,
              }}
              className="rounded-2xl border border-gray-100"
              contentFit="cover"
              fallbackWidth={80}
              fallbackHeight={80}
              borderRadius={20}
            />
            {/* Status badge for landlord */}
            <View className="absolute -top-2 -right-2">
              <View
                className={`px-2 py-1 rounded-full ${item.status === 0
                  ? "bg-green-500"
                  : item.status === 1
                    ? "bg-blue-500"
                    : "bg-gray-500"
                  }`}
              >
                <Text className="text-white text-[10px] font-semibold">
                  {item.status === 0
                    ? "Aktif"
                    : item.status === 1
                      ? "Kiralandı"
                      : "Kapalı"}
                </Text>
              </View>
            </View>
          </View>

          {/* Sağ taraf - Bilgiler */}
          <View className="flex-1 flex flex-col pr-4">
            {/* Üst kısım - Başlık */}
            <View>
              <Text
                style={{ fontSize: 16, fontWeight: 600 }}
                className="text-gray-800 mb-2"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.ilanBasligi || `${item.il} ${item.ilce} Kiralık Daire`}
              </Text>
            </View>

            {/* Alt kısım - Fiyat ve lokasyon */}
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
                  }/ay`
                  : "Fiyat belirtilmemiş"}
              </Text>

              {/* Lokasyon */}
              <Text style={{ fontSize: 13 }} className="text-gray-500 mb-2">
                {item.ilce && item.il
                  ? `${item.ilce}, ${item.il}`
                  : item.il || "Konum belirtilmemiş"}
              </Text>
            </View>

            {/* Oda ve banyo bilgileri */}
            <View className="flex flex-row gap-4 items-center">
              <View className="flex flex-row gap-2 items-center">
                <FontAwesomeIcon color="#6B7280" icon={faBath} size={15} />
                <Text style={{ fontSize: 15 }} className="text-gray-500">
                  {item.banyoSayisi || "N/A"} Banyo
                </Text>
              </View>
              <View className="flex flex-row gap-2 items-center">
                <FontAwesomeIcon color="#6B7280" icon={faBed} size={15} />
                <Text style={{ fontSize: 15 }} className="text-gray-500">
                  {item.odaSayisi || "N/A"} Oda
                </Text>
              </View>
            </View>

            {/* Action buttons for landlord */}
            <View className="flex flex-row gap-2 mt-3">
              <TouchableOpacity
                className="bg-white border-2 border-gray-900 py-2 px-3 rounded-full"
                onPress={() => handleOffersNavigation(item.postId)}
              >
                <Text className="text-gray-900 text-s px-2 text-center font-medium">
                  Teklifler ({item.offerCount || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className=" py-2 px-3 rounded-lg"
                onPress={() => handleEditPostNavigation(item.postId)}
              >
                <FontAwesomeIcon icon={faEdit} size={20} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                className=" py-2  rounded-lg"
                onPress={() => handleDeletePost(item.postId)}
                disabled={isDeleting}
              >
                <FontAwesomeIcon icon={faTrash} size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [userRole, currentUser?.id, isDeleting, navigation]
  );

  // Ana renderPostItem - userRole'e göre seçim yapar
  const renderPostItem = useCallback(
    ({ item, index }) => {
      if (userRole === "KIRACI") {
        return renderTenantPostItem({ item, index });
      } else {
        return renderLandlordPostItem({ item, index });
      }
    },
    [userRole, renderTenantPostItem, renderLandlordPostItem]
  );

  const renderLoadingMore = () => {
    const isLoading = isLoadingMore || isLoadingMoreFiltered;

    if (!isLoading) return null;

    return (
      <View className="py-4 justify-center items-center">
        <ActivityIndicator size="small" color="#4A90E2" />
        <Text className="mt-2 text-sm text-gray-500">
          Daha fazla ilan yükleniyor...
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    Logger.info(COMPONENT_NAME, "No posts found", {
      userRole,
      hasFilters: Object.values(filters).some((val) => val !== null),
      hasSearchQuery: !!searchQuery.trim(),
    });

    return (
      <View
        style={{ marginBottom: 120 }}
        className="flex-1 justify-center items-center "
      >
        <FontAwesomeIcon icon={faHomeAlt} size={60} />
        <Text className="text-lg font-semibold text-gray-500 mt-2 mb-1">
          {userRole === "EVSAHIBI"
            ? "Henüz ilan oluşturmadınız"
            : "İlan bulunamadı"}
        </Text>
        <Text className="text-gray-400 text-sm text-center px-8">
          {userRole === "EVSAHIBI"
            ? "Mülkünüzü kiralamak için yeni ilan oluşturun."
            : "Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirerek tekrar deneyin."}
        </Text>
        {userRole === "EVSAHIBI" && (
          <TouchableOpacity
            style={{ marginTop: 10 }}
            className="bg-gray-900 px-6 py-3 rounded-full "
            onPress={handleCreatePostNavigation}
          >
            <Text className="text-white font-semibold">Yeni ilan oluştur</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAppliedFilters = () => {
    const hasFilters = Object.values(filters).some((val) => val !== null);

    if (!hasFilters) return null;

    return (
      <View className="flex-row flex-wrap mb-4">
        {filters.location && (
          <View className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-1 flex-row items-center">
            <Text className="text-green-800 text-sm mr-1">
              Konum: {filters.location}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Logger.event("remove_filter", { type: "location" });
                dispatch(setPostFilters({ ...filters, location: null }));
                setLocalFilters({ ...localFilters, location: "" });
              }}
            >
              <MaterialIcons name="close" size={16} color="#1E40AF" />
            </TouchableOpacity>
          </View>
        )}

        {filters.status !== null && (
          <View className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-1 flex-row items-center">
            <Text className="text-green-800 text-sm mr-1">
              Durum:{" "}
              {filters.status === 0
                ? "Aktif"
                : filters.status === 1
                  ? "Kiralandı"
                  : "Kapalı"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Logger.event("remove_filter", { type: "status" });
                dispatch(setPostFilters({ ...filters, status: null }));
                setLocalFilters({ ...localFilters, status: null });
              }}
            >
              <MaterialIcons name="close" size={16} color="#1E40AF" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          className="bg-gray-900 rounded-full px-4 py-2 mb-1 flex-row items-center"
          onPress={resetFilters}
        >
          <Text className="text-white text-s">Tümünü Temizle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isLoading =
    userRole === "EVSAHIBI" ? isLoadingLandlordListings : isLoadingAllPosts;
  const filteredPosts = getFilteredPosts();

  const keyExtractor = useCallback((item, index) => {
    if (item && item.postId) {
      return `post_${item.postId}_${index}`;
    }
    return `post_index_${index}`;
  }, []);

  // renderAnimatedHeader fonksiyonundaki düzeltilmiş kod

  const renderAnimatedHeader = () => {
    const headerContainerHeight = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [insets.top + 40 + 50 + 40 + 12, insets.top + 50 + 40 + 6],
      extrapolate: "clamp",
    });

    // ✅ DÜZELTİLMİŞ: Responsive button sayısı ve boyutu
    const filterButtonWidth = 45; // Filter butonu genişliği
    const createButtonWidth = userRole === "EVSAHIBI" ? 50 : 0; // Create butonu (sadece ev sahibi için)
    const buttonGap = userRole === "EVSAHIBI" ? 8 : 0; // Butonlar arası gap
    const totalButtonsWidth = filterButtonWidth + createButtonWidth + buttonGap + 16; // 16 = padding right

    const searchBarWidth = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [
        screenWidth - 32, // Normal durumda full width (minus padding)
        screenWidth - 32 - totalButtonsWidth, // Animasyon tamamlandığında butonlar için yer bırak
      ],
      extrapolate: "clamp",
    });

    const searchBarTranslateY = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [0, -50],
      extrapolate: "clamp",
    });

    const sortOptionsOpacity = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [1, 0.8],
      extrapolate: "clamp",
    });

    const sortOptionsHeight = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [50, 42],
      extrapolate: "clamp",
    });

    const sortOptionsTranslateY = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [0, -8],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: headerContainerHeight,
        }}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          }}
        />

        <View
          style={{
            paddingTop: insets.top,
            paddingHorizontal: 16,
            flex: 1,
            zIndex: 10,
          }}
        >
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
              height: 40,
              justifyContent: "center",
            }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-col flex-1">
                <Text
                  style={{ fontSize: 20 }}
                  className="font-medium text-gray-900"
                >
                  {userRole === "EVSAHIBI" ? "Mülklerim" : "İlanlar"}
                </Text>
                {userRole === "KIRACI" && (
                  <Text style={{ fontSize: 14 }} className="text-gray-700 mt-1">
                    {hasActiveFilters && filterMetadata ? (
                      <>
                        {filterMetadata.totalCount || 0} ilanın{" "}
                        {allPostsData.length} tanesi gösteriliyor
                      </>
                    ) : (
                      paginatedPostsResponse?.pagination && (
                        <>
                          {paginatedPostsResponse.pagination.totalCount} ilanın{" "}
                          {allPostsData.length} tanesi gösteriliyor
                        </>
                      )
                    )}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ✅ DÜZELTİLMİŞ: Search Bar ve Button Container */}
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Search Bar */}
            <Animated.View
              style={{
                transform: [{ translateY: searchBarTranslateY }],
                width: searchBarWidth,
                flex: 1, // ✅ Responsive için flex kullan
              }}
            >
              <BlurView
                intensity={60}
                tint="light"
                style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                  className="border border-gray-100 border-[1px] rounded-full"
                >
                  <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
                  <TextInput
                    className="flex-1 placeholder:text-gray-500 placeholder:text-[14px] py-4 text-normal"
                    style={{
                      textAlignVertical: "center",
                      includeFontPadding: false,
                    }}
                    placeholder={
                      userRole === "KIRACI"
                        ? "Konuma göre ev ara..."
                        : "İlanlarınızda arayın..."
                    }
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </BlurView>
            </Animated.View>

            {/* ✅ DÜZELTİLMİŞ: Action Buttons Container */}
            <Animated.View
              style={{
                transform: [{ translateY: searchBarTranslateY }],
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Create Post Button (sadece ev sahibi için) */}
              {userRole === "EVSAHIBI" && (
                <TouchableOpacity
                  style={{
                    width: filterButtonWidth,
                    height: filterButtonWidth,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                  className="bg-white/90 backdrop-blur flex justify-center items-center rounded-full"
                  onPress={handleCreatePostNavigation}
                >
                  <FontAwesomeIcon icon={faPlus} size={18} />
                </TouchableOpacity>
              )}

              {/* Filter Button */}
              <TouchableOpacity
                style={{
                  width: filterButtonWidth,
                  height: filterButtonWidth,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                }}
                className={`rounded-full flex justify-center items-center ${isFilterVisible ||
                  Object.values(filters).some((val) => val !== null)
                  ? "bg-gray-900/90"
                  : "bg-white/90"
                  }`}
                onPress={handleFilterPress}
              >
                <FontAwesomeIcon
                  icon={faSliders}
                  size={18}
                  color={
                    isFilterVisible ||
                      Object.values(filters).some((val) => val !== null)
                      ? "white"
                      : "#111827"
                  }
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Sort Options */}
          <Animated.View
            style={{
              marginTop: 0,
              height: sortOptionsHeight,
              transform: [{ translateY: searchBarTranslateY }],
              overflow: "hidden",
            }}
          >
            <View style={{ flex: 1, justifyContent: "center" }}>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: "center",
                  paddingHorizontal: 0,
                }}
                style={{ width: "100%" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {sortBy && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        elevation: 2,
                      }}
                      onPress={resetSortOptions}
                      className="bg-gray-900"
                    >
                      <MaterialIcons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  )}

                  {[
                    { key: "distance", label: "Uzaklık" },
                    { key: "price", label: "Fiyat" },
                    { key: "date", label: "Tarih" },
                    { key: "views", label: "Görüntüleme" },
                  ].map((option) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={option.key}
                      style={{
                        marginRight: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 18,
                        backgroundColor:
                          sortBy === option.key
                            ? "#111827"
                            : "rgba(255, 255, 255, 0.9)",
                        borderWidth: sortBy === option.key ? 1 : 0,
                        borderColor:
                          sortBy === option.key
                            ? "#111827"
                            : "rgba(209, 213, 219, 0.8)",
                        elevation: 2,
                      }}
                      onPress={() => handleSortChange(option.key)}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: sortBy === option.key ? "500" : "400",
                          color: sortBy === option.key ? "white" : "#a5a5a5",
                        }}
                      >
                        {option.label}
                        {sortBy === option.key && (
                          <Text style={{ marginLeft: 4 }}>
                            {sortDirection === 0 ? " ↑" : " ↓"}
                          </Text>
                        )}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  const getDynamicPaddingTop = () => {
    const normalPadding = insets.top + 50 + 60 + 50 + 32;
    return normalPadding;
  };

  // Main return
  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="rgba(17, 24, 39, 0.9)"
        translucent={true}
      />

      {renderAnimatedHeader()}

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text className="mt-3 text-base text-gray-500">
              İlanlar yükleniyor...
            </Text>
          </View>
        ) : (
          <Animated.FlatList
            data={filteredPosts}
            renderItem={renderPostItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 16,
              paddingTop: getDynamicPaddingTop(),
              paddingHorizontal: userRole === "KIRACI" ? 0 : 16,
            }}
            ListHeaderComponent={() => (
              <View
                style={{
                  marginTop: -8,
                  paddingHorizontal: userRole === "KIRACI" ? 16 : 0,
                }}
              >
                {renderAppliedFilters()}
              </View>
            )}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderLoadingMore}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                progressViewOffset={getDynamicPaddingTop()}
              />
            }
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            removeClippedSubviews={false}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            initialNumToRender={8}
            windowSize={5}
            disableVirtualization={false}
            extraData={`${searchQuery}_${JSON.stringify(filters)}_${allPostsData.length
              }`}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        )}
      </View>

      <PropertiesFilterModal
        visible={isFilterModalVisible}
        onClose={handleFilterModalClose}
        onApply={handleFilterModalApply}
      />
    </View>
  );
};

export default PostsScreen;
