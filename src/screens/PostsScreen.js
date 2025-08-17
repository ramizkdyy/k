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
  faPlus,
  faSliders,
} from "@fortawesome/pro-regular-svg-icons";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import { BlurView } from "expo-blur";
import { faEdit, faTrash } from "@fortawesome/pro-light-svg-icons";
import PropertiesFilterModal from "../modals/PropertiesFilterModal";
import { useSearchPostsMutation } from '../redux/api/searchApiSlice';
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

const { width: screenWidth } = Dimensions.get('window');

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
  const [sortDirection, setSortDirection] = useState(0); // 0: asc, 1: desc
  const [sortBy, setSortBy] = useState(null); // 'date' yerine null

  // ===== ANIMATION SETUP =====
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header height calculations
  const SCROLL_DISTANCE = 50; // Başlığın kaybolma mesafesi


  const sortPosts = useCallback((posts, sortType = sortBy, direction = sortDirection) => {
    if (!posts || posts.length === 0) return posts;

    if (!sortType) return posts;


    return [...posts].sort((a, b) => {
      let valueA, valueB;

      switch (sortType) {
        case 'distance':
          valueA = a.distance ? parseFloat(a.distance.replace(/[^\d.]/g, '')) : 999999;
          valueB = b.distance ? parseFloat(b.distance.replace(/[^\d.]/g, '')) : 999999;
          break;

        case 'price':
          valueA = a.kiraFiyati || 0;
          valueB = b.kiraFiyati || 0;
          break;

        case 'date':
          valueA = new Date(a.olusturmaTarihi || a.createdAt || 0);
          valueB = new Date(b.olusturmaTarihi || b.createdAt || 0);
          break;

        case 'views':
          valueA = a.goruntulemeSayisi || a.viewCount || 0;
          valueB = b.goruntulemeSayisi || b.viewCount || 0;
          break;

        default:
          return 0;
      }

      if (direction === 0) { // Ascending
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else { // Descending
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }, [sortBy, sortDirection]);



  const renderSortOptions = () => {
    const sortOptions = [
      { key: 'distance', label: "Uzaklık" },
      { key: 'price', label: "Fiyat" },
      { key: 'date', label: "Tarih" },
      { key: 'views', label: "Görüntüleme" },
    ];

    // Check if any sort option is active (not default)
    const hasActiveSortFilter = sortBy !== 'date' || sortDirection !== 0;

    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: 0,
        }}
        style={{ width: "100%" }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Reset button */}
          {sortBy(
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                marginRight: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 16,
                backgroundColor: '#ef4444',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={resetSortOptions}
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          )}

          {/* Sort option buttons */}
          {[
            { key: 'distance', label: "Uzaklık" },
            { key: 'price', label: "Fiyat" },
            { key: 'date', label: "Tarih" },
            { key: 'views', label: "Görüntüleme" },
          ].map((option) => (
            <TouchableOpacity
              activeOpacity={0.7}
              key={option.key}
              style={{
                marginRight: 12,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 18,
                backgroundColor: sortBy === option.key ? '#111827' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: sortBy === option.key ? '#111827' : 'rgba(209, 213, 219, 0.8)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => handleSortChange(option.key)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: sortBy === option.key ? '600' : '500',
                  color: sortBy === option.key ? 'white' : '#374151',
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
    );
  };

  // Başlık bölümü opacity
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Başlık scale (küçülerek kaybolur)
  const titleScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Search bar yukarı kayma
  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -50], // Başlık alanına doğru kayar
    extrapolate: 'clamp',
  });

  // ===== EXISTING CODE CONTINUES =====

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

  // API calls based on user role
  const {
    data: landlordListingsData,
    isLoading: isLoadingLandlordListings,
    refetch: refetchLandlordListings,
    error: landlordListingsError,
  } = useGetLandlordPropertyListingsQuery(currentUser?.id, {
    skip: userRole !== "EVSAHIBI" || !currentUser?.id,
  });

  // Paginated posts query
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

  // Log component mount
  useEffect(() => {
    Logger.info(COMPONENT_NAME, "Component mounted", {
      userRole,
      userId: currentUser?.id,
    });

    return () => {
      Logger.info(COMPONENT_NAME, "Component unmounted");
    };
  }, []);

  // [REST OF YOUR useEffect HOOKS - UNCHANGED]
  // ...

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

  // [ALL YOUR HANDLER FUNCTIONS - UNCHANGED]
  const handleFilterPress = () => {
    Logger.event("filter_button_pressed");
    setIsFilterModalVisible(true);
  };

  const handleFilterModalClose = () => {
    Logger.event("filter_modal_closed");
    setIsFilterModalVisible(false);
  };

  const handleFilterModalApply = (appliedFilters, searchResult) => {
    console.log('=== FILTER MODAL APPLY DEBUG ===');
    console.log('Applied filters:', appliedFilters);
    console.log('Search result:', searchResult);

    Logger.event("filter_modal_applied", {
      filtersCount: Object.keys(appliedFilters).length,
      resultsCount: searchResult?.posts?.length || 0
    });

    dispatch(setPostFilters(appliedFilters));

    const hasFilters = Object.values(appliedFilters).some(
      value => value !== null && value !== "" &&
        (Array.isArray(value) ? value.length > 0 : true)
    );
    setHasActiveFilters(hasFilters);
    setActiveFilterData(hasFilters ? appliedFilters : null);

    setCurrentPage(1);
    setFilterCurrentPage(1); // YENİ EKLENEN

    if (searchResult) {
      let postsData = [];

      if (searchResult.posts && Array.isArray(searchResult.posts)) {
        postsData = searchResult.posts;
      }

      const validPosts = postsData.filter(post => {
        return post && post.postId &&
          (typeof post.postId === 'number' || typeof post.postId === 'string');
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
      totalPages: filterMetadata.totalPages
    });

    setIsLoadingMoreFiltered(true);

    try {
      // Filtreli arama için pagination parametresi ekle
      const filtersWithPagination = {
        ...activeFilterData,
        page: filterCurrentPage + 1,
        pageSize: PAGE_SIZE
      };

      console.log('Loading more filtered posts with:', filtersWithPagination);

      const searchResult = await searchPosts(filtersWithPagination).unwrap();

      if (searchResult && searchResult.posts && Array.isArray(searchResult.posts)) {
        const validNewPosts = searchResult.posts.filter(post =>
          post && post.postId &&
          (typeof post.postId === 'number' || typeof post.postId === 'string')
        );

        console.log(`Adding ${validNewPosts.length} more filtered posts`);

        // Yeni postları mevcut listeye ekle
        setAllPostsData(prevData => {
          const existingPostIds = new Set(prevData.map(item => item.postId));
          const uniqueNewPosts = validNewPosts.filter(
            post => !existingPostIds.has(post.postId)
          );
          return [...prevData, ...uniqueNewPosts];
        });

        // Pagination metadata'sını güncelle
        if (searchResult.metadata) {
          setFilterMetadata(searchResult.metadata);
          setHasNextPage(searchResult.metadata.hasNextPage || false);
        }

        // Sayfa numarasını artır
        setFilterCurrentPage(prev => prev + 1);

        Logger.info(COMPONENT_NAME, "More filtered posts loaded successfully");
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, "Load more filtered posts failed", error);
      console.error('Load more filtered posts error:', error);
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
    searchPosts
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
        direction: sortBy === newSortBy ? (sortDirection === 0 ? 1 : 0) : 0
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
    setSortBy(null); // varsayılan sort değeri
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
              const validPosts = searchResult.posts.filter(post =>
                post && post.postId
              );
              setAllPostsData(validPosts);

              if (searchResult.metadata) {
                setFilterMetadata(searchResult.metadata);
                setHasNextPage(searchResult.metadata.hasNextPage || false);
              }
            }
          } catch (filterError) {
            console.error('Filter refresh error:', filterError);
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
    // Eğer filtre aktifse, filtreli pagination kullan
    if (hasActiveFilters) {
      loadMoreFilteredPosts();
      return;
    }

    // Normal pagination (filtre yokken)
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
    loadMoreFilteredPosts
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

    // Sıralama seçeneklerini de sıfırla
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
    console.log('=== GET FILTERED POSTS DEBUG ===');
    console.log('User role:', userRole);
    console.log('Has active filters:', hasActiveFilters);
    console.log('All posts data length:', allPostsData?.length || 0);
    console.log('Search query:', searchQuery);
    console.log('Sort by:', sortBy, 'Sort direction:', sortDirection); // sortOrder değil sortDirection

    let filteredPosts = [];

    if (userRole === "EVSAHIBI") {
      filteredPosts = landlordListingsData?.result || [];
      console.log('Using landlord listings:', filteredPosts.length);
    } else {
      filteredPosts = allPostsData || [];
      console.log('Using all posts data:', filteredPosts.length);
    }

    console.log('Raw filtered posts sample:', filteredPosts.slice(0, 2));

    const validPosts = filteredPosts.filter(post => {
      const isValid = post &&
        post.postId &&
        (typeof post.postId === 'number' || typeof post.postId === 'string');

      if (!isValid && post) {
        console.log('Filtering out invalid post:', { postId: post.postId, type: typeof post.postId });
      }

      return isValid;
    });

    console.log(`Valid posts after null check: ${validPosts.length}`);

    if (hasActiveFilters) {
      console.log('Processing with active filters');

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

      // Apply sorting - sortDirection kullan
      const sortedPosts = sortPosts(finalPosts, sortBy, sortDirection);
      console.log(`Final result (with filters and sorting): ${sortedPosts.length}`);
      return sortedPosts;
    }

    console.log('Processing without active filters');

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

    // Apply sorting - sortDirection kullan
    const sortedPosts = sortPosts(finalPosts, sortBy, sortDirection);
    console.log(`Final result (no filters, with sorting): ${sortedPosts.length}`);
    return sortedPosts;
  };

  const renderPostItem = useCallback(
    ({ item, index }) => {
      if (!item || !item.postId) {
        return null;
      }

      return (
        <TouchableOpacity
          className="bg-white overflow-hidden mb-4"
          onPress={() => handlePostNavigation(item.postId)}
          activeOpacity={1}
        >
          <View style={{ borderRadius: 30 }} className="relative">
            {item.postImages && item.postImages.length > 0 ? (
              <Image
                source={{ uri: item.postImages[0].postImageUrl }}
                style={{
                  width: "100%",
                  height: 350,
                  borderRadius: 30,
                }}
                contentFit="cover"
                transition={200}
                placeholder={{
                  uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
                }}
                cachePolicy="memory-disk"
                onError={() =>
                  Logger.error(COMPONENT_NAME, "Image load failed", {
                    postId: item.postId,
                    imageUrl: item.postImages[0]?.postImageUrl,
                  })
                }
              />
            ) : (
              <View
                style={{ height: 350, borderRadius: 30 }}
                className="w-full bg-gray-100 justify-center items-center"
              >
                <FontAwesomeIcon size={50} color="#dee0ea" icon={faHomeAlt} />
              </View>
            )}

            <BlurView
              tint=""
              intensity={60}
              style={{
                boxShadow: "0px 0px 12px #00000014",
                overflow: "hidden",
              }}
              className="absolute top-3 left-3 rounded-full"
            >
              <View className="px-3 py-1.5 rounded-full">
                <Text className="text-white text-sm font-semibold">
                  {item.status === 0
                    ? "Aktif"
                    : item.status === 1
                      ? "Kiralandı"
                      : "Kapalı"}
                </Text>
              </View>
            </BlurView>

            {item.distance && (
              <View className="absolute top-3 left-3">
                <View className="bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full flex-row items-center">
                  <MaterialIcons name="location-on" size={12} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">
                    {item.distance}
                  </Text>
                </View>
              </View>
            )}

            {userRole === "EVSAHIBI" && item.userId === currentUser?.id && (
              <View className="flex-row absolute gap-2 top-3 right-3">
                <BlurView
                  style={{ boxShadow: "0px 0px 12px #00000014" }}
                  tint="dark"
                  intensity={50}
                  className="overflow-hidden rounded-full"
                >
                  <TouchableOpacity
                    className="flex justify-center items-center"
                    onPress={() => handleOffersNavigation(item.postId)}
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
                    onPress={() => handleEditPostNavigation(item.postId)}
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
                    onPress={() => handleDeletePost(item.postId)}
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
          </View>

          <View className="px-2 py-3">
            <View className="mb-2">
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#111827",
                  lineHeight: 24,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.ilanBasligi || "İlan başlığı yok"}
              </Text>

              <View className="mt-2 mb-3">
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {[item.il, item.ilce, item.mahalle]
                    .filter(Boolean)
                    .join(", ") || "Konum belirtilmemiş"}
                </Text>
              </View>

              <View className="mb-2">
                <Text style={{ fontSize: 14, color: "#6B7280" }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#111827",
                      textDecorationLine: "underline",
                    }}
                  >
                    {item.kiraFiyati
                      ? item.kiraFiyati.toLocaleString("tr-TR")
                      : "0"}{" "}
                    {item.paraBirimi || "₺"}
                  </Text>
                  {" /ay"}
                </Text>
              </View>
            </View>

            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 20,
              }}
            >
              {item.postDescription || "Açıklama yok"}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [userRole, currentUser?.id, isDeleting]
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


  const renderAnimatedHeader = () => {
    const headerContainerHeight = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [
        insets.top + 50 + 60 + 50 + 16, // Normal: SafeArea + Title + SearchBar + SortOptions + padding
        insets.top + 60 + 50 + 8        // Scroll: SafeArea + SearchBar + SortOptions + minimal padding (sort options kalır)
      ],
      extrapolate: 'clamp',
    });

    // ÖNEMLİ: Arama barının genişlik animasyonu
    const searchBarWidth = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [
        screenWidth - 32, // Başta neredeyse tam genişlik (sadece padding)
        screenWidth - 32 - 50 - 8 // Scroll sonunda filter butonu için yer bırak
      ],
      extrapolate: 'clamp',
    });

    // Arama barının sağdan margin animasyonu
    const searchBarMarginRight = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [0, 58], // Filter butonu için yer (50 + 8 margin)
      extrapolate: 'clamp',
    });

    const searchBarTranslateY = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [0, -50], // Title'ın yerine geçer
      extrapolate: 'clamp',
    });

    // Sort options için sadece hafif opacity değişimi - kaybolmasın
    const sortOptionsOpacity = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [1, 0.8], // 0'a düşmez, sadece hafif sönük olur
      extrapolate: 'clamp',
    });

    // Sort options height sabit kalsın
    const sortOptionsHeight = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [50, 42], // Tamamen kaybolmaz, sadece biraz küçülür
      extrapolate: 'clamp',
    });

    // Sort options yukarı kayma - çok az
    const sortOptionsTranslateY = scrollY.interpolate({
      inputRange: [0, SCROLL_DISTANCE],
      outputRange: [0, -8], // Çok az yukarı kayar
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: headerContainerHeight,
        }}
      >
        {/* BlurView Background */}
        <BlurView
          intensity={80}
          tint="light"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Semi-transparent overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
          }}
        />

        {/* Content Container */}
        <View style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          flex: 1,
          zIndex: 10,
        }}>

          {/* Title Section - Kaybolur */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
              height: 50,
              justifyContent: 'center',
            }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-col flex-1">
                <Text style={{ fontSize: 20 }} className="font-medium text-gray-900">
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

              {userRole === "EVSAHIBI" && (
                <TouchableOpacity
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                    marginLeft: 8,
                  }}
                  className="p-3 bg-white/90 backdrop-blur flex justify-center items-center rounded-full"
                  onPress={handleCreatePostNavigation}
                >
                  <FontAwesomeIcon icon={faPlus} size={18} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Search Bar - Title'ın yerine geçer */}
          <Animated.View
            style={{
              marginTop: 10,
              transform: [{ translateY: searchBarTranslateY }],
              width: searchBarWidth, // Animasyonlu genişlik
              marginRight: searchBarMarginRight, // Sağdan margin animasyonu
            }}
          >
            <BlurView
              intensity={60}
              tint="light"
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
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

          {/* Sort Options - Search bar ile birlikte hareket etsin */}
          <Animated.View
            style={{
              marginTop: 8,
              height: sortOptionsHeight,
              transform: [{ translateY: searchBarTranslateY }],
              overflow: 'hidden',
            }}
          >
            <View style={{ flex: 1, justifyContent: 'center', }}>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: "center",
                  paddingHorizontal: 0,
                }}
                style={{ width: "100%" }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Reset button - animated header version */}
                  {sortBy && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        marginRight: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                      onPress={resetSortOptions}
                      className="bg-red-600"
                    >
                      <MaterialIcons name="close" size={20} color="white" />

                    </TouchableOpacity>
                  )}

                  {/* Sort option buttons */}
                  {[
                    { key: 'distance', label: "Uzaklık" },
                    { key: 'price', label: "Fiyat" },
                    { key: 'date', label: "Tarih" },
                    { key: 'views', label: "Görüntüleme" },
                  ].map((option) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={option.key}
                      style={{
                        marginRight: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 18,
                        backgroundColor: sortBy === option.key ? '#111827' : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1,
                        borderColor: sortBy === option.key ? '#111827' : 'rgba(209, 213, 219, 0.8)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                      onPress={() => handleSortChange(option.key)}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: sortBy === option.key ? '600' : '500',
                          color: sortBy === option.key ? 'white' : '#374151',
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

        {/* Filter Button */}
        <View
          style={{
            position: 'absolute',
            right: 16,
            top: insets.top + 12,
            zIndex: 20,
          }}
        >
          <TouchableOpacity
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
            className={`p-3 rounded-full  ${isFilterVisible ||
              Object.values(filters).some((val) => val !== null)
              ? "bg-gray-900/90"
              : "bg-white/90"
              }`}
            onPress={handleFilterPress}
          >
            <FontAwesomeIcon
              icon={faSliders}
              size={20}
              color={
                isFilterVisible ||
                  Object.values(filters).some((val) => val !== null)
                  ? "white"
                  : "#111827"
              }
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // FlatList'te de paddingTop'u dinamik yapalım
  const getDynamicPaddingTop = () => {
    // Normal durum: Title + SearchBar + SortOptions + extra padding
    const normalPadding = insets.top + 50 + 60 + 50 + 32; // +50 for sort options
    return normalPadding;
  };

  // Ana return kısmında da güncelleme:
  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="rgba(17, 24, 39, 0.9)"  // Koyu gri
        translucent={true}
      />

      {/* Animated Header */}
      {renderAnimatedHeader()}

      {/* Main Content */}
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
              paddingTop: getDynamicPaddingTop(), // DİNAMİK PADDING
              paddingHorizontal: 16,
            }}
            ListHeaderComponent={() => (
              <View style={{ marginTop: -8 }}>
                {renderAppliedFilters()}
              </View>
            )}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderLoadingMore}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                progressViewOffset={getDynamicPaddingTop()} // DİNAMİK OFFSET
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
            // Animation scroll handler
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false } // width/height animasyonu için false
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