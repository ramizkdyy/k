import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
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
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Platform,
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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Search,
  Home,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  Mail,
  Edit,
  Trash2,
} from "lucide-react-native";
import PlatformBlurView from "../components/PlatformBlurView";
import ImageWithFallback from "../components/ImageWithFallback";
import { PropertyCardFull } from "../components/PropertyCard";
import PropertiesFilterModal from "../modals/PropertiesFilterModal";
import { PostsScreenSkeleton } from "../components/PostsScreenSkeleton";
import { useSearchPostsMutation } from "../redux/api/searchApiSlice";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrencyText, getRelativeTime } from "../utils/formatters";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
// Logger utility
const Logger = {
  info: (component, action, data = {}) => {
    console.log(`[INFO][${component}] ${action}`, data);
  },
  error: (component, action, error) => {
    console.error(`[ERROR][${component}] ${action}`, error);
  },
  event: (eventName, properties = {}) => {
    console.log(`[EVENT] ${eventName}`, properties);
  },
};

const { width: screenWidth } = Dimensions.get("window");

// getCurrencyText -> ../utils/formatters.js'den import ediliyor
// ImageWithFallback -> ../components/ImageWithFallback.js'den import ediliyor

// 🎯 Landlord Actions BottomSheet Modal Component
const LandlordActionsModal = React.memo(
  ({ visible, onClose, item, onEdit, onDelete, onOffers, isDeleting }) => {
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ["30%"], []);

    // Modal açılış/kapanış kontrolü
    useEffect(() => {
      if (visible && item) {
        bottomSheetModalRef.current?.present();
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    }, [visible, item]);

    // Bottom Sheet dismiss handler
    const handleSheetChanges = useCallback(
      (index) => {
        if (index === -1) {
          onClose();
        }
      },
      [onClose]
    );

    // Backdrop component
    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    if (!item) return null;

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        enableDismissOnClose={true}
        backgroundStyle={{
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#d1d5db",
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100,
          }}
        >
          <View className="mb-4">
            <Text
              style={{ fontSize: 18, fontWeight: "bold" }}
              className="text-gray-900 text-center"
            >
              İlan İşlemleri
            </Text>
          </View>

          <View style={{ gap: 30, marginTop: 10 }}>
            {/* Teklifler */}
            <TouchableOpacity
              className="flex-row items-center gap-4 mt-2  rounded-xl"
              onPress={() => {
                onOffers();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View className=" rounded-full items-center justify-center">
                <Mail size={18} color="#505050" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontSize: 16, fontWeight: "400" }}
                  className="text-gray-900"
                >
                  Teklifleri Görüntüle ({item.offerCount || 0})
                </Text>
              </View>
            </TouchableOpacity>

            {/* Düzenle */}
            <TouchableOpacity
              className="flex-row items-center gap-4  rounded-xl"
              onPress={() => {
                onEdit();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View className="w items-center justify-center">
                <Edit size={18} color="#505050" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontSize: 16, fontWeight: "400" }}
                  className="text-gray-900"
                >
                  İlanı Düzenle
                </Text>
                {/* <Text style={{ fontSize: 14 }} className="text-gray-500">
                İlan bilgilerini güncelle
              </Text> */}
              </View>
            </TouchableOpacity>

            {/* Sil */}
            <TouchableOpacity
              className="flex-row items-center gap-4  rounded-xl"
              onPress={() => {
                onDelete();
                onClose();
              }}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <View className="w items-center justify-center">
                <Trash2 size={18} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontSize: 16, fontWeight: "400" }}
                  className="text-red-600"
                >
                  İlanı Sil
                </Text>
                {/* <Text style={{ fontSize: 14 }} className="text-red-400">
                Bu işlem geri alınamaz
              </Text> */}
              </View>
              {isDeleting && <ActivityIndicator size="small" color="#ef4444" />}
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

// getCurrencyText -> ../utils/formatters.js'den import ediliyor
// ImageWithFallback -> ../components/ImageWithFallback.js'den import ediliyor
// PropertyDetailsSlider -> ../components/PropertyDetailsSlider.js'den import ediliyor
// PropertyImageSlider -> ../components/PropertyImageSlider.js'den import ediliyor

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
  const [selectedPost, setSelectedPost] = useState(null);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
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
            // Distance parsing - uzak olanları sona koy
            valueA = a.distance
              ? parseFloat(a.distance.replace(/[^\d.]/g, ""))
              : 999999;
            valueB = b.distance
              ? parseFloat(b.distance.replace(/[^\d.]/g, ""))
              : 999999;
            break;

          case "price":
            // Fiyat sıralaması
            valueA = a.kiraFiyati || a.rent || 0;
            valueB = b.kiraFiyati || b.rent || 0;
            break;

          case "date":
            // Tarih sıralaması - tarihi olmayanları en eski yap
            const dateA = a.olusturmaTarihi || a.postTime || a.createdAt;
            const dateB = b.olusturmaTarihi || b.postTime || b.createdAt;

            if (dateA) {
              valueA = new Date(dateA).getTime();
            } else {
              valueA = 0; // Tarihi olmayanlar en eski
            }

            if (dateB) {
              valueB = new Date(dateB).getTime();
            } else {
              valueB = 0; // Tarihi olmayanlar en eski
            }
            break;

          case "views":
            // Görüntüleme sayısı sıralaması
            valueA = a.goruntulemeSayisi || a.viewCount || 0;
            valueB = b.goruntulemeSayisi || b.viewCount || 0;
            break;

          default:
            return 0;
        }

        // Sıralama yönü: 0 = artan (küçükten büyüğe), 1 = azalan (büyükten küçüğe)
        if (direction === 0) {
          // Artan sıralama
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          // Azalan sıralama
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
  // getRelativeTime -> ../utils/formatters.js'den import ediliyor

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

  const handleOpenActionsModal = useCallback((item) => {
    setSelectedPost(item);
    setIsActionsModalVisible(true);
  }, []);

  const handleCloseActionsModal = useCallback(() => {
    setIsActionsModalVisible(false);
    setSelectedPost(null);
  }, []);

  const handleFilterModalApply = (appliedFilters, searchResult) => {

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

      if (!hasActiveFilters) {
        if (userRole === "EVSAHIBI") {
          // Landlord: her zaman taze tut (ilan ekleyip/silebilirler)
          refetchLandlordListings();
        } else if (allPostsData.length === 0) {
          // Tenant: sadece hiç data yoksa fetch yap (back navigation'da gereksiz yeniden yüklemeyi engeller)
          setCurrentPage(1);
          setHasNextPage(true);
          refetchAllPosts();
        }
      }
    }, [userRole, hasActiveFilters, allPostsData.length, refetchLandlordListings, refetchAllPosts])
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
                errorMessage: error.data?.message || error.message || "Unknown error",
                errorStatus: error.status,
                errorData: error.data,
                errorName: error.name,
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
      Alert.alert("Hata", "İlan verisi bulunamadı.");
    }
  };

  // handleOffersNavigation fonksiyonunu güncelle
  const handleOffersNavigation = (postId) => {
    Logger.event("view_all_offers", { postId });
    navigation.navigate("AllOffers", { postId });
  };

  const handleCreatePostNavigation = () => {
    Logger.event("create_post_initiated");
    navigation.navigate("CreatePost");
  };

  const getFilteredPosts = () => {

    let filteredPosts = [];

    if (userRole === "EVSAHIBI") {
      filteredPosts = landlordListingsData?.result || [];
    } else {
      filteredPosts = allPostsData || [];
    }


    const validPosts = filteredPosts.filter((post) => {
      const isValid =
        post &&
        post.postId &&
        (typeof post.postId === "number" || typeof post.postId === "string");

      if (!isValid && post) {
      }

      return isValid;
    });


    if (hasActiveFilters) {

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

      }

      const sortedPosts = sortPosts(finalPosts, sortBy, sortDirection);
      return sortedPosts;
    }


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

    }

    const sortedPosts = sortPosts(finalPosts, sortBy, sortDirection);
    return sortedPosts;
  };

  // YENİ TASARIM - KİRACI İÇİN (AllNearbyPropertiesScreen tarzı)
  const renderTenantPostItem = useCallback(
    ({ item, index }) => {
      if (!item || !item.postId) {
        return null;
      }

      return (
        <PropertyCardFull
          item={item}
          navigation={navigation}
          userRole={userRole}
          currentUser={currentUser}
          onEdit={() => handleEditPostNavigation(item.postId)}
          onDelete={() => handleDeletePost(item.postId)}
          onOffers={() => handleOffersNavigation(item.postId)}
          isDeleting={isDeleting}
          showMatchScore={true}
        />
      );
    },
    [userRole, currentUser?.id, isDeleting, navigation]
  );


  const renderLandlordPostItem = useCallback(
    ({ item, index }) => {
      if (!item || !item.postId) {
        return null;
      }

      return (
        <TouchableOpacity
          activeOpacity={1}
          className="overflow-hidden w-full flex flex-row items-center gap-4 py-2 border-b border-gray-100"
          onPress={() => handlePostNavigation(item.postId)}
        >
          {/* Sol taraf - Resim */}
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
                    : null,
              }}
              className="rounded-2xl border border-gray-100"
              contentFit="cover"
              fallbackWidth={80}
              fallbackHeight={80}
              borderRadius={20}
            />

            {/* Status badge - Sol üst köşe */}
            <View className="absolute top-2 left-2">
              <PlatformBlurView
                intensity={60}
                tint="dark"
                style={{
                  overflow: "hidden",
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text className="text-white text-[10px] font-semibold">
                  {item.status === 0
                    ? "Aktif"
                    : item.status === 1
                      ? "Kiralandı"
                      : "Kapalı"}
                </Text>
              </PlatformBlurView>
            </View>
          </View>

          {/* Orta kısım - Bilgiler */}
          <View className="flex flex-col flex-1">
            {/* Başlık + Actions */}
            <View className="flex-row items-center justify-between">
              <Text
                style={{ fontSize: 15, fontWeight: 600 }}
                className="text-gray-800 flex-1 mr-2"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.ilanBasligi || `${item.il} ${item.ilce} Kiralık Daire`}
              </Text>
              <TouchableOpacity
                className="p-1"
                onPress={() => handleOpenActionsModal(item)}
              >
                <MoreVertical size={18} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Fiyat */}
            <Text
              style={{ fontSize: 14, fontWeight: 600 }}
              className="text-gray-400 mb-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.kiraFiyati || item.rent
                ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${getCurrencyText(item.paraBirimi || item.currency)}/ay`
                : "Fiyat belirtilmemiş"}
            </Text>

            {/* Lokasyon */}
            <Text style={{ fontSize: 12 }} className="text-gray-500 mb-2">
              {item.ilce && item.il
                ? `${item.ilce}, ${item.il}`
                : item.il || "Konum belirtilmemiş"}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePostNavigation, handleOpenActionsModal]
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
    // İlk yükleme durumunu kontrol et
    const isInitialLoading = isLoading && allPostsData.length === 0;
    const isRefreshLoading = refreshing;
    const isFilterLoading = isLoadingMore || isLoadingMoreFiltered;

    // Herhangi bir loading durumu varsa skeleton göster
    if (isInitialLoading || isRefreshLoading || isFilterLoading) {
      return (
        <View style={{ marginTop: 16 }}>
          <PostsScreenSkeleton userRole={userRole} count={userRole === "KIRACI" ? 2 : 4} />
        </View>
      );
    }

    // Loading tamamlandıktan sonra veri kontrolü
    const hasNoData = filteredPosts.length === 0;

    if (!hasNoData) {
      return null;
    }

    // Sadece loading bitmiş ve gerçekten veri yoksa empty state göster
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
        <Home size={60} color="#6b7280" />
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
            style={{ marginTop: 10, borderRadius: 999, overflow: 'hidden' }}
            onPress={handleCreatePostNavigation}
          >
            <LinearGradient
              colors={['#25a244', '#1a7431']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text className="text-white font-semibold">Yeni ilan oluştur</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAppliedFilters = () => {
    return null;
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



  const renderAnimatedHeader = () => {
    const headerContainerHeight = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [insets.top + 40 + 50 + 12, insets.top + 50 + 6],
      extrapolate: "clamp",
    });

    // ✅ DÜZELTİLMİŞ: Responsive button sayısı ve boyutu
    const filterButtonWidth = 45; // Filter butonu genişliği
    const createButtonWidth = userRole === "EVSAHIBI" ? 50 : 0; // Create butonu (sadece ev sahibi için)
    const showFilter = userRole !== "EVSAHIBI";
    const buttonGap = userRole === "EVSAHIBI" ? 0 : 0; // Butonlar arası gap
    const totalButtonsWidth =
      (showFilter ? filterButtonWidth : 0) + createButtonWidth + buttonGap + 16; // 16 = padding right

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
        <PlatformBlurView
          intensity={80}
          tint="light"
          androidColor="rgba(255, 255, 255, 0.95)"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {Platform.OS === "ios" && (
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
        )}

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
              <PlatformBlurView
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
                  <Search size={20} color="#000" />
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
              </PlatformBlurView>
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
                  <Plus size={18} color="#000" />
                </TouchableOpacity>
              )}

              {/* Filter Button - sadece kiracı için */}
              {showFilter && (
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
                  <SlidersHorizontal
                    size={18}
                    color={
                      isFilterVisible ||
                        Object.values(filters).some((val) => val !== null)
                        ? "white"
                        : "#111827"
                    }
                  />
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

        </View>
      </Animated.View>
    );
  };

  const getDynamicPaddingTop = () => {
    const normalPadding = insets.top + 40 + 50 + 12;
    return normalPadding;
  };

  // Main return
  // Ana render kısmını değiştir - debug ile:
  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="rgba(17, 24, 39, 0.9)"
        translucent={true}
      />

      {renderAnimatedHeader()}

      <View className="flex-1">

        {(isLoading ||
          (userRole === "KIRACI" && allPostsData.length === 0 && !hasActiveFilters) ||
          (userRole === "EVSAHIBI" && (!landlordListingsData || !landlordListingsData.result))
        ) ? (
          <View style={{ paddingTop: getDynamicPaddingTop() + 20, paddingHorizontal: userRole === "KIRACI" ? 0 : 16 }}>
            <PostsScreenSkeleton userRole={userRole} count={userRole === "KIRACI" ? 3 : 5} />
          </View>
        ) : (
          <Animated.FlatList
            data={filteredPosts}
            renderItem={renderPostItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: insets.bottom + 80,
              paddingTop: getDynamicPaddingTop() + 20,
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
                colors={["#303030"]}
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
            extraData={`${searchQuery}_${JSON.stringify(filters)}_${allPostsData.length}`}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        )}
      </View>

      {/* Filter Modal */}
      <PropertiesFilterModal
        visible={isFilterModalVisible}
        onClose={handleFilterModalClose}
        onApply={handleFilterModalApply}
        initialFilters={filters}
        userRole={userRole}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onResetSort={resetSortOptions}
        onResetFilters={resetFilters}
      />

      {/* Landlord Actions Modal */}
      <LandlordActionsModal
        visible={isActionsModalVisible}
        onClose={handleCloseActionsModal}
        item={selectedPost}
        onEdit={() => handleEditPostNavigation(selectedPost?.postId)}
        onDelete={() => handleDeletePost(selectedPost?.postId)}
        onOffers={() => handleOffersNavigation(selectedPost?.postId)}
        isDeleting={isDeleting}
      />
    </View>
  );
};

export default PostsScreen;
