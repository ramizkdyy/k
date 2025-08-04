import React, { useState, useEffect, useCallback } from "react";
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

const PostsScreen = ({ navigation }) => {
  const COMPONENT_NAME = "PostsScreen";
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const filters = useSelector(selectPostFilters);
  const userPosts = useSelector(selectAllUserPosts);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allPostsData, setAllPostsData] = useState([]); // Tüm yüklenen postları tutacak
  const PAGE_SIZE = 10;

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

  // Log API errors
  useEffect(() => {
    if (landlordListingsError) {
      Logger.error(
        COMPONENT_NAME,
        "Failed to fetch landlord listings",
        landlordListingsError
      );
    }
  }, [landlordListingsError]);

  // Paginated posts query - sadece tenant için
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

  // Log API errors
  useEffect(() => {
    if (allPostsError) {
      Logger.error(COMPONENT_NAME, "Failed to fetch all posts", allPostsError);
    }
  }, [allPostsError]);

  const [deletePost, { isLoading: isDeleting, error: deleteError }] =
    useDeletePostMutation();

  // Log delete errors
  useEffect(() => {
    if (deleteError) {
      Logger.error(COMPONENT_NAME, "Failed to delete post", deleteError);
    }
  }, [deleteError]);

  // Log data loads
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

      // Pagination state güncelle
      setHasNextPage(paginatedPostsResponse?.pagination?.hasNextPage || false);

      // Eğer ilk sayfa ise, veriyi direkt set et
      if (currentPage === 1) {
        setAllPostsData(paginatedPostsResponse?.data || []);
      } else {
        // Sonraki sayfalar için - DUPLICATE KONTROLÜ EKLENDİ
        setAllPostsData((prevData) => {
          const newData = paginatedPostsResponse?.data || [];
          const existingPostIds = new Set(prevData.map(item => item.postId));

          // Sadece daha önce eklenmemiş postları ekle
          const uniqueNewData = newData.filter(item =>
            item && item.postId && !existingPostIds.has(item.postId)
          );

          console.log(`Adding ${uniqueNewData.length} new unique posts out of ${newData.length} total`);

          return [...prevData, ...uniqueNewData];
        });
      }

      setIsLoadingMore(false);
    }
  }, [paginatedPostsResponse, userRole, currentPage]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      Logger.info(COMPONENT_NAME, "Screen focused", { userRole });

      // Reset pagination when screen is focused
      setCurrentPage(1);
      setHasNextPage(true);
      setAllPostsData([]); // Önceki veriyi temizle

      if (userRole === "EVSAHIBI") {
        refetchLandlordListings();
      } else {
        refetchAllPosts();
      }
    }, [userRole, refetchLandlordListings, refetchAllPosts])
  );

  // Handle pull-to-refresh
  const onRefresh = async () => {
    Logger.event("refresh_posts_list", { userRole });

    setRefreshing(true);
    setCurrentPage(1);
    setHasNextPage(true);
    setAllPostsData([]); // Veriyi temizle

    try {
      if (userRole === "EVSAHIBI") {
        await refetchLandlordListings();
      } else {
        await refetchAllPosts();
      }
      Logger.info(COMPONENT_NAME, "Refresh completed");
    } catch (error) {
      Logger.error(COMPONENT_NAME, "Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load more posts function
  const loadMorePosts = useCallback(() => {
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
  }, [userRole, hasNextPage, isLoadingMore, isFetchingAllPosts, currentPage]);

  // Apply filters
  const applyFilters = () => {
    Logger.event("apply_filters", localFilters);

    // Reset pagination when applying filters
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

  // Reset filters function
  const resetFilters = () => {
    Logger.event("reset_filters");

    setCurrentPage(1);
    setHasNextPage(true);
    setAllPostsData([]);

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
  };

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      Logger.event("search_posts", { query: searchQuery });
    }
  }, [searchQuery]);

  // Handle delete post
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

  // Navigation handlers
  const handlePostNavigation = (postId) => {
    Logger.event("view_post_detail", { postId });
    navigation.navigate("PostDetail", { postId });
  };

  const handleEditPostNavigation = (postId) => {
    Logger.event("edit_post", { postId });

    // İlgili post verisini bulun
    const postToEdit = landlordListingsData?.result?.find(post => post.postId === postId);

    if (postToEdit) {
      navigation.navigate("EditPost", {
        propertyData: postToEdit  // ✅ Tüm post verisini gönderin
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
    let filteredPosts = [];

    // Get the appropriate posts based on user role
    if (userRole === "EVSAHIBI") {
      filteredPosts = landlordListingsData?.result || [];
    } else {
      // For tenants, use accumulated posts data
      filteredPosts = allPostsData || [];
    }

    // DUPLICATE POST KONTROLÜ EKLENDİ
    const uniquePosts = [];
    const seenPostIds = new Set();

    filteredPosts.forEach(post => {
      if (post && post.postId && !seenPostIds.has(post.postId)) {
        seenPostIds.add(post.postId);
        uniquePosts.push(post);
      }
    });

    filteredPosts = uniquePosts;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          (post.ilanBasligi &&
            post.ilanBasligi.toLowerCase().includes(query)) ||
          (post.il && post.il.toLowerCase().includes(query)) ||
          (post.ilce && post.ilce.toLowerCase().includes(query))
      );
    }

    // Location filter
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          (post.il && post.il.toLowerCase().includes(location)) ||
          (post.ilce && post.ilce.toLowerCase().includes(location))
      );
    }

    // Price range filter
    if (filters.priceMin || filters.priceMax) {
      filteredPosts = filteredPosts.filter((post) => {
        const price = post.kiraFiyati || 0;
        const minPrice = filters.priceMin || 0;
        const maxPrice = filters.priceMax || Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Room count filter
    if (filters.rooms) {
      filteredPosts = filteredPosts.filter((post) => {
        if (filters.rooms === "5+") {
          return (post.odaSayisi || 0) >= 5;
        }
        return String(post.odaSayisi) === filters.rooms;
      });
    }

    // Property type filter
    if (filters.propertyType) {
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.propertyType &&
          post.propertyType.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    // Features filter
    if (filters.features && Object.keys(filters.features).length > 0) {
      filteredPosts = filteredPosts.filter((post) => {
        if (filters.features.furnished && !post.esyali) return false;
        if (filters.features.parking && !post.otopark) return false;
        if (filters.features.elevator && !post.asansor) return false;
        if (filters.features.balcony && !post.balkon) return false;
        return true;
      });
    }

    // Status filter (for landlords)
    if (userRole === "EVSAHIBI" && filters.status !== null) {
      filteredPosts = filteredPosts.filter(
        (post) => post.status === filters.status
      );
    }

    // Simple sorting
    if (filters.sortBy) {
      filteredPosts = [...filteredPosts].sort((a, b) => {
        switch (filters.sortBy) {
          case "newest":
            return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
          case "priceLow":
            return (a.kiraFiyati || 0) - (b.kiraFiyati || 0);
          case "priceHigh":
            return (b.kiraFiyati || 0) - (a.kiraFiyati || 0);
          default:
            return 0;
        }
      });
    }

    return filteredPosts;
  };

  // Render post item - Optimized for performance
  // renderPostItem fonksiyonu - TAM HALİ (Title kısmı düzeltildi)

  const renderPostItem = useCallback(
    ({ item, index }) => {
      // Null check for item
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
            {/* Post image with Expo Image */}
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

            {/* Status badge */}
            <BlurView
              tint="dark"
              intensity={50}
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

            {/* Distance badge (if available) */}
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

            {/* Landlord action buttons */}
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
            {/* Title and Price - DÜZELTİLDİ */}
            <View className="mb-2">
              {/* Title - Sadeleştirildi */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#111827',
                  lineHeight: 24
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.ilanBasligi || "İlan başlığı yok"}
              </Text>

              {/* Location */}
              <View className="mt-2 mb-3">
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {[item.il, item.ilce, item.mahalle]
                    .filter(Boolean)
                    .join(", ") || "Konum belirtilmemiş"}
                </Text>
              </View>

              {/* Price - Sadeleştirildi */}
              <View className="mb-2">
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#111827',
                      textDecorationLine: 'underline'
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

            {/* Description */}
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                fontSize: 14,
                color: '#6B7280',
                lineHeight: 20
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

  // Render loading more indicator
  const renderLoadingMore = () => {
    if (!isLoadingMore) return null;

    return (
      <View className="py-4 justify-center items-center">
        <ActivityIndicator size="small" color="#4A90E2" />
        <Text className="mt-2 text-sm text-gray-500">
          Daha fazla ilan yükleniyor...
        </Text>
      </View>
    );
  };

  // Render empty state
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
            className="bg-gray-900 px-6 py-2 rounded-full"
            onPress={handleCreatePostNavigation}
          >
            <Text className="text-white font-semibold">Yeni ilan oluştur</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Header with title and filter toggle
  const renderHeader = () => (
    <View className="flex-row justify-between items-center mt-4 mb-4">
      <View className="flex-col">
        <Text style={{ fontSize: 14 }} className="font-medium text-gray-500">
          {userRole === "EVSAHIBI" ? "Mülklerim" : "İlanlar"}
        </Text>
        {/* Pagination info for tenants */}
        {userRole === "KIRACI" && paginatedPostsResponse?.pagination && (
          <Text style={{ fontSize: 12 }} className="text-gray-400 mt-1">
            {paginatedPostsResponse.pagination.totalCount} ilanın{" "}
            {allPostsData.length} tanesi gösteriliyor
          </Text>
        )}
      </View>

      <View className="flex-row">
        {userRole === "EVSAHIBI" && (
          <TouchableOpacity
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className="p-3 bg-white flex justify-center items-center rounded-full mr-2"
            onPress={handleCreatePostNavigation}
          >
            <FontAwesomeIcon icon={faPlus} size={18} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{ boxShadow: "0px 0px 12px #00000014" }}
          className={`p-3 rounded-full ${isFilterVisible ||
            Object.values(filters).some((val) => val !== null)
            ? "bg-gray-700"
            : "bg-white"
            }`}
          onPress={() => {
            Logger.event("toggle_filter_panel", { show: !isFilterVisible });
            setIsFilterVisible(!isFilterVisible);
          }}
        >
          <FontAwesomeIcon
            icon={faSliders}
            size={18}
            color={
              isFilterVisible ||
                Object.values(filters).some((val) => val !== null)
                ? "lightgray"
                : "#000"
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Applied filters display
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
          className="bg-gray-200 rounded-full px-3 py-1 mb-1 flex-row items-center"
          onPress={resetFilters}
        >
          <Text className="text-gray-700 text-sm">Tümünü Temizle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isLoading =
    userRole === "EVSAHIBI" ? isLoadingLandlordListings : isLoadingAllPosts;
  const filteredPosts = getFilteredPosts();

  const keyExtractor = useCallback((item, index) => {
    if (item && item.postId) {
      return `post_${item.postId}_${index}`; // ← INDEX EKLENDİ
    }
    return `post_index_${index}`;
  }, []);

  // Get item layout for better performance
  const getItemLayout = useCallback(
    (data, index) => ({
      length: 500, // Approximate item height
      offset: 500 * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Status Bar Configuration */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F9FAFB"
        translucent={false}
      />

      <View className="flex-1 p-4">
        {/* Search bar */}
        <View className="">
          <View
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className="bg-white rounded-3xl gap-2 px-4 flex-row items-center"
          >
            <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
            <TextInput
              className="w-full placeholder:text-gray-500 placeholder:text-[14px] py-4 text-normal"
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
        </View>

        {renderHeader()}
        {renderAppliedFilters()}

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text className="mt-3 text-base text-gray-500">
              İlanlar yükleniyor...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            renderItem={renderPostItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderLoadingMore}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            // Performance optimizations - daha muhafazakar ayarlar
            removeClippedSubviews={false} // Bu false yapıldı
            maxToRenderPerBatch={5} // Azaltıldı
            updateCellsBatchingPeriod={50} // Azaltıldı
            initialNumToRender={8} // Artırıldı
            windowSize={5} // Azaltıldı
            // Memory optimization
            disableVirtualization={false}
            // Prevent text disappearing issues
            getItemLayout={undefined} // getItemLayout kaldırıldı
            // Improve stability
            extraData={`${searchQuery}_${JSON.stringify(filters)}_${allPostsData.length
              }`}
          />
        )}
      </View>

      {/* Properties Filter Modal */}
      <PropertiesFilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={(appliedFilters) => {
          console.log("Applied filters:", appliedFilters);
          setIsFilterVisible(false);
        }}
        currentFilters={filters}
        userRole={userRole}
      />
    </SafeAreaView>
  );
};

export default PostsScreen;
