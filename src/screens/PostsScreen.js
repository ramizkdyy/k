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
  useGetAllPostsPaginatedQuery, // YENİ: Paginated hook kullanıyoruz
  useDeletePostMutation,
} from "../redux/api/apiSlice";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus, faSliders } from "@fortawesome/pro-regular-svg-icons";
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
    quickPrice: filters.quickPrice || null, // Hızlı fiyat seçenekleri için
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

  // YENİ: Paginated posts query - sadece tenant için
  const {
    data: allPostsData,
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
    if (userRole === "KIRACI" && allPostsData) {
      Logger.info(COMPONENT_NAME, "All posts loaded", {
        totalCount: allPostsData?.pagination?.totalCount || 0,
        currentPage: allPostsData?.pagination?.currentPage || 1,
        totalPages: allPostsData?.pagination?.totalPages || 1,
        hasNextPage: allPostsData?.pagination?.hasNextPage || false,
      });

      // Update pagination state
      setHasNextPage(allPostsData?.pagination?.hasNextPage || false);
    }
  }, [allPostsData, userRole]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      Logger.info(COMPONENT_NAME, "Screen focused", { userRole });

      // Reset pagination when screen is focused
      setCurrentPage(1);
      setHasNextPage(true);

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
    setCurrentPage(1); // Reset to first page
    setHasNextPage(true);

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

  // YENİ: Load more posts function
  const loadMorePosts = async () => {
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

    try {
      // RTK Query will automatically handle the new page request
      // and merge the results based on our merge function in the API slice
    } catch (error) {
      Logger.error(COMPONENT_NAME, "Load more failed", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    Logger.event("apply_filters", localFilters);

    // Reset pagination when applying filters
    setCurrentPage(1);
    setHasNextPage(true);

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

  // Basitleştirilmiş resetFilters fonksiyonu
  const resetFilters = () => {
    Logger.event("reset_filters");

    // Reset pagination when clearing filters
    setCurrentPage(1);
    setHasNextPage(true);

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

  // Log navigation actions
  const handlePostNavigation = (postId) => {
    Logger.event("view_post_detail", { postId });
    navigation.navigate("PostDetail", { postId });
  };

  const handleEditPostNavigation = (postId) => {
    Logger.event("edit_post", { postId });
    navigation.navigate("EditPost", { postId });
  };

  const handleOffersNavigation = (postId) => {
    Logger.event("view_offers", { postId });
    navigation.navigate("Offers", { postId });
  };

  const handleCreatePostNavigation = () => {
    Logger.event("create_post_initiated");
    navigation.navigate("CreatePost");
  };

  // Basitleştirilmiş filtreleme fonksiyonu - sadece temel filtreler
  // Fixed getFilteredPosts function - replace the existing one
  const getFilteredPosts = () => {
    let filteredPosts = [];

    // Get the appropriate posts based on user role
    if (userRole === "EVSAHIBI") {
      // Use API data for landlords, NOT Redux store
      filteredPosts = landlordListingsData?.result || [];
    } else {
      // For tenants, use data from paginated posts query
      filteredPosts = allPostsData?.data || [];
    }

    // Arama sorgusu filtresi
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

    // Konum filtresi
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          (post.il && post.il.toLowerCase().includes(location)) ||
          (post.ilce && post.ilce.toLowerCase().includes(location))
      );
    }

    // Fiyat aralığı filtresi
    if (filters.priceMin || filters.priceMax) {
      filteredPosts = filteredPosts.filter((post) => {
        const price = post.kiraFiyati || 0;
        const minPrice = filters.priceMin || 0;
        const maxPrice = filters.priceMax || Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Oda sayısı filtresi
    if (filters.rooms) {
      filteredPosts = filteredPosts.filter((post) => {
        if (filters.rooms === "5+") {
          return (post.odaSayisi || 0) >= 5;
        }
        return String(post.odaSayisi) === filters.rooms;
      });
    }

    // Emlak tipi filtresi
    if (filters.propertyType) {
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.propertyType &&
          post.propertyType.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    // Temel özellikler filtresi
    if (filters.features && Object.keys(filters.features).length > 0) {
      filteredPosts = filteredPosts.filter((post) => {
        if (filters.features.furnished && !post.esyali) return false;
        if (filters.features.parking && !post.otopark) return false;
        if (filters.features.elevator && !post.asansor) return false;
        if (filters.features.balcony && !post.balkon) return false;
        return true;
      });
    }

    // Durum filtresi (ev sahibi için)
    if (userRole === "EVSAHIBI" && filters.status !== null) {
      filteredPosts = filteredPosts.filter(
        (post) => post.status === filters.status
      );
    }

    // Basit sıralama
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

  // Render post item
  const renderPostItem = ({ item }) => {
    return (
      <TouchableOpacity
        className="bg-white  overflow-hidden mb-4 "
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
              }} // h-52 = 208px
              contentFit="cover"
              transition={200} // Smooth transition
              placeholder={{
                uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
              }}
              cachePolicy="memory-disk" // Aggressive caching
              onError={() =>
                Logger.error(COMPONENT_NAME, "Image load failed", {
                  postId: item.postId,
                  imageUrl: item.postImages[0].postImageUrl,
                })
              }
            />
          ) : (
            <View className="w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200 justify-center items-center">
              <MaterialIcons name="home" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 font-medium">Resim yok</Text>
            </View>
          )}

          {/* Status badge - improved design */}
          <BlurView
            intensity={100}
            style={{ overflow: "hidden" }}
            className="absolute top-3 py-3 px-2 left-3 rounded-full"
          >
            <View
              className={`px-3 py-1.5 rounded-full ${
                item.status === 0 ? "" : item.status === 1 ? "" : ""
              }`}
            >
              <Text className="text-gray-900 text-sm font-semibold">
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
          {userRole === "EVSAHIBI" && item.userId === currentUser?.id && (
            <View className="flex-row absolute gap-2 top-3 right-3">
              <BlurView
                intensity={100}
                className="overflow-hidden rounded-full"
              >
                {" "}
                <TouchableOpacity
                  className=" flex justify-center items-center p-4"
                  onPress={() => handleOffersNavigation(item.postId)}
                  activeOpacity={1}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-gray-900 font-semibold text-center text-sm ml-1">
                      Teklifler ({item.offerCount || 0})
                    </Text>
                  </View>
                </TouchableOpacity>
              </BlurView>

              <BlurView
                intensity={100}
                className="overflow-hidden rounded-full"
              >
                {" "}
                <TouchableOpacity
                  className=" flex justify-center items-center p-4"
                  onPress={() => handleEditPostNavigation(item.postId)}
                  activeOpacity={1}
                >
                  <View className="flex-row items-center justify-center">
                    <FontAwesomeIcon icon={faEdit} />
                  </View>
                </TouchableOpacity>
              </BlurView>

              <BlurView
                intensity={100}
                className="overflow-hidden rounded-full"
              >
                {" "}
                <TouchableOpacity
                  className=" flex justify-center items-center p-4"
                  onPress={() => handleDeletePost(item.postId)}
                  disabled={isDeleting}
                  activeOpacity={1}
                >
                  <View className="flex-row items-center justify-center">
                    <FontAwesomeIcon color="#9c092e" icon={faTrash} />
                  </View>
                </TouchableOpacity>
              </BlurView>
            </View>
          )}
        </View>

        <View className="px-2 py-3">
          {/* Title and Price */}
          <View className="flex-col items-start mb-2">
            <Text
              className="text-lg font-bold text-gray-900 flex-1 mr-3"
              numberOfLines={2}
            >
              {item.ilanBasligi || "İlan başlığı yok"}
            </Text>
            <View className="flex flex-row items-center mb-3">
              <Text style={{ fontSize: 12 }} className="text-gray-500">
                {[item.il, item.ilce, item.mahalle]
                  .filter(Boolean)
                  .join(", ") || "Konum belirtilmemiş"}
              </Text>
            </View>
            <View className=" py-1 rounded-lg mb-2">
              <Text style={{ fontSize: 14 }} className="text-gray-500">
                <Text
                  className="underline text-gray-900 font-medium"
                  style={{ fontSize: 18 }}
                >
                  {item.kiraFiyati
                    ? item.kiraFiyati.toLocaleString("tr-TR")
                    : "0"}{" "}
                  <Text>{item.paraBirimi || "₺"}</Text>
                </Text>{" "}
                /ay
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            numberOfLines={2}
            className="text-gray-600 text-sm mb-4 leading-5"
          >
            {item.postDescription || "Açıklama yok"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // YENİ: Render loading more indicator
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
    // Log when no posts are found
    Logger.info(COMPONENT_NAME, "No posts found", {
      userRole,
      hasFilters: Object.values(filters).some((val) => val !== null),
      hasSearchQuery: !!searchQuery.trim(),
    });

    return (
      <View className="flex-1 justify-center items-center p-5">
        <MaterialIcons name="home" size={60} color="#CBD5E0" />
        <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2">
          {userRole === "EVSAHIBI"
            ? "Henüz ilan oluşturmadınız"
            : "İlan bulunamadı"}
        </Text>
        <Text className="text-base text-gray-500 text-center mb-6">
          {userRole === "EVSAHIBI"
            ? "Mülkünüzü kiralamak için yeni ilan oluşturun."
            : "Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirerek tekrar deneyin."}
        </Text>
        {userRole === "EVSAHIBI" && (
          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-lg"
            onPress={handleCreatePostNavigation}
          >
            <Text className="text-white font-semibold">Yeni İlan Oluştur</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // PostsScreen.js - Kompakt ve Verimli Filtre Sistemi

  // Header with title and filter toggle
  const renderHeader = () => (
    <View className="flex-row justify-between items-center mt-4 mb-4">
      <View className="flex-col">
        <Text style={{ fontSize: 14 }} className=" font-medium text-gray-500">
          {userRole === "EVSAHIBI" ? "Mülklerim" : "İlanlar"}
        </Text>
        {/* YENİ: Pagination info for tenants */}
        {userRole === "KIRACI" && allPostsData?.pagination && (
          <Text style={{ fontSize: 12 }} className="text-gray-400 mt-1">
            {allPostsData.pagination.totalCount} ilanın{" "}
            {Math.min(
              currentPage * PAGE_SIZE,
              allPostsData.pagination.totalCount
            )}{" "}
            tanesi gösteriliyor
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
          className={`p-3 rounded-full ${
            isFilterVisible ||
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
            className="bg-white rounded-3xl gap-2 px-4 flex-row items-center "
          >
            <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
            <TextInput
              className="w-full placeholder:text-gray-500 placeholder:text-[14px] py-4 text-normal"
              style={{
                textAlignVertical: "center", // Android için
                includeFontPadding: false, // Android için
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
            keyExtractor={(item, index) => `post_${item.postId}_${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderLoadingMore} // YENİ: Loading more indicator
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMorePosts} // YENİ: Load more function
            onEndReachedThreshold={0.3} // YENİ: Trigger earlier for better UX
            // Performance optimizations for image loading
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={100}
            initialNumToRender={5}
            windowSize={10}
          />
        )}
      </View>
      {/* YENİ: PropertiesFilterModal */}
      <PropertiesFilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={(appliedFilters) => {
          // Filtreleri uygula
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
