import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
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
  useGetAllPostsQuery,
  useDeletePostMutation,
} from "../redux/api/apiSlice";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

// Logger utility
const Logger = {
  info: (component, action, data = {}) => {
    console.log(`[${component}] ${action}`, data);

    // You could send this to a remote logging service
    // sendToRemoteLogger('info', component, action, data);
  },
  error: (component, action, error) => {
    console.error(`[${component}] ERROR: ${action}`, error);

    // You could send errors to a remote error tracking service
    // sendToErrorTracker(component, action, error);
  },
  event: (eventName, properties = {}) => {
    console.log(`[EVENT] ${eventName}`, properties);

    // You could send this to an analytics service
    // trackEvent(eventName, properties);
  },
};

const PostsScreen = ({ navigation }) => {
  const COMPONENT_NAME = "PostsScreen";
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const filters = useSelector(selectPostFilters);
  const userPosts = useSelector(selectAllUserPosts);

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
    status: filters.status,
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

  const {
    data: allPostsData,
    isLoading: isLoadingAllPosts,
    refetch: refetchAllPosts,
    error: allPostsError,
  } = useGetAllPostsQuery(undefined, {
    skip: userRole !== "KIRACI",
  });

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
        count: allPostsData?.result?.length || 0,
      });
    }
  }, [allPostsData, userRole]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      Logger.info(COMPONENT_NAME, "Screen focused", { userRole });

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

  // Apply filters
  const applyFilters = () => {
    Logger.event("apply_filters", localFilters);

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

  // Reset filters
  const resetFilters = () => {
    Logger.event("reset_filters");

    setLocalFilters({
      location: "",
      priceMin: "",
      priceMax: "",
      status: null,
    });
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

  // Filter and search posts
  const getFilteredPosts = () => {
    let filteredPosts = [];

    // Get the appropriate posts based on user role
    if (userRole === "EVSAHIBI") {
      filteredPosts = userPosts || [];
    } else {
      // For tenants, use data from all posts query
      filteredPosts = allPostsData?.result || [];
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          (post.title && post.title.toLowerCase().includes(query)) ||
          (post.location && post.location.toLowerCase().includes(query)) ||
          (post.description && post.description.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.location) {
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.location &&
          post.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.priceMin !== null) {
      filteredPosts = filteredPosts.filter(
        (post) => post.price && post.price >= filters.priceMin
      );
    }

    if (filters.priceMax !== null) {
      filteredPosts = filteredPosts.filter(
        (post) => post.price && post.price <= filters.priceMax
      );
    }

    if (filters.status !== null) {
      filteredPosts = filteredPosts.filter(
        (post) => post.status === filters.status
      );
    }

    // Log filtered results count
    Logger.info(COMPONENT_NAME, "Posts filtered", {
      totalCount: filteredPosts.length,
      hasSearchQuery: !!searchQuery.trim(),
      hasFilters: Object.values(filters).some((val) => val !== null),
    });

    return filteredPosts;
  };

  // Render post item
  const renderPostItem = ({ item }) => {
    // Log the item data for debugging
    console.log("Post Item Data:", JSON.stringify(item, null, 2));

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl overflow-hidden mb-4 shadow-lg border border-gray-100"
        onPress={() => handlePostNavigation(item.postId)}
        activeOpacity={0.95}
      >
        <View className="relative">
          {/* Post image */}
          {item.postImages && item.postImages.length > 0 ? (
            <Image
              source={{ uri: item.postImages[0].postImageUrl }}
              className="w-full h-52"
              resizeMode="cover"
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
          <View className="absolute top-3 right-3">
            <View
              className={`px-3 py-1.5 rounded-full backdrop-blur-sm ${item.status === 0
                ? "bg-green-500/90"
                : item.status === 1
                  ? "bg-blue-500/90"
                  : "bg-gray-500/90"
                }`}
            >
              <Text className="text-white text-xs font-semibold">
                {item.status === 0
                  ? "Aktif"
                  : item.status === 1
                    ? "Kiralandı"
                    : "Kapalı"}
              </Text>
            </View>
          </View>

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
        </View>

        <View className="p-5">
          {/* Title and Price */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-bold text-gray-900 flex-1 mr-3" numberOfLines={2}>
              {item.ilanBasligi || "İlan başlığı yok"}
            </Text>
            <View className="bg-blue-50 px-3 py-1 rounded-lg">
              <Text className="text-lg font-bold text-blue-600">
                {`${item.kiraFiyati} ₺`}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="location-on" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {item.il || "Konum belirtilmemiş"}
            </Text>
          </View>

          {/* Description */}
          <Text numberOfLines={2} className="text-gray-600 text-sm mb-4 leading-5">
            {item.postDescription || "Açıklama yok"}
          </Text>

          {/* Property details */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
              <MaterialIcons name="king-bed" size={16} color="#6B7280" />
              <Text className="text-xs text-gray-700 ml-1 font-medium">
                {item.odaSayisi} Oda
              </Text>
            </View>

            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
              <MaterialIcons name="bathtub" size={16} color="#6B7280" />
              <Text className="text-xs text-gray-700 ml-1 font-medium">
                {item.banyoSayisi} Banyo
              </Text>
            </View>

            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
              <MaterialIcons name="square-foot" size={16} color="#6B7280" />
              <Text className="text-xs text-gray-700 ml-1 font-medium">
                {`${item.brutMetreKare} m²`}
              </Text>
            </View>
          </View>

          {/* Show action buttons for landlords */}
          {userRole === "EVSAHIBI" && item.userId === currentUser?.id && (
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 bg-blue-50 py-3 rounded-lg mr-2 border border-blue-100"
                onPress={() => handleEditPostNavigation(item.postId)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="edit" size={16} color="#3B82F6" />
                  <Text className="text-blue-700 font-semibold text-center text-sm ml-1">
                    Düzenle
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-blue-500 py-3 rounded-lg mr-2 shadow-sm"
                onPress={() => handleOffersNavigation(item.postId)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="local-offer" size={16} color="white" />
                  <Text className="text-white font-semibold text-center text-sm ml-1">
                    Teklifler ({item.offerCount || 0})
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-12 bg-red-50 py-3 rounded-lg justify-center items-center border border-red-100"
                onPress={() => handleDeletePost(item.postId)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="delete"
                  size={18}
                  color={isDeleting ? "#FCA5A5" : "#EF4444"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={handleCreatePostNavigation}
          >
            <Text className="text-white font-semibold">Yeni İlan Oluştur</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Filter modal component
  const renderFilterModal = () =>
    isFilterVisible && (
      <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">Filtrele</Text>

        <View className="mb-3">
          <Text className="text-gray-600 mb-1">Konum</Text>
          <TextInput
            className="bg-gray-100 p-2 rounded-lg"
            placeholder="İstanbul, Ankara, vb."
            value={localFilters.location}
            onChangeText={(text) =>
              setLocalFilters({ ...localFilters, location: text })
            }
          />
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-gray-600 mb-1">Min. Fiyat (₺)</Text>
            <TextInput
              className="bg-gray-100 p-2 rounded-lg"
              placeholder="1000"
              keyboardType="numeric"
              value={localFilters.priceMin}
              onChangeText={(text) =>
                setLocalFilters({ ...localFilters, priceMin: text })
              }
            />
          </View>

          <View className="flex-1">
            <Text className="text-gray-600 mb-1">Max. Fiyat (₺)</Text>
            <TextInput
              className="bg-gray-100 p-2 rounded-lg"
              placeholder="5000"
              keyboardType="numeric"
              value={localFilters.priceMax}
              onChangeText={(text) =>
                setLocalFilters({ ...localFilters, priceMax: text })
              }
            />
          </View>
        </View>

        {userRole === "EVSAHIBI" && (
          <View className="mb-3">
            <Text className="text-gray-600 mb-1">Durum</Text>
            <View className="flex-row mt-1">
              <TouchableOpacity
                className={`mr-2 px-3 py-1 rounded-full ${localFilters.status === 0 ? "bg-blue-500" : "bg-gray-200"
                  }`}
                onPress={() => {
                  setLocalFilters({ ...localFilters, status: 0 });
                  Logger.event("filter_status_changed", { status: 0 });
                }}
              >
                <Text
                  className={`${localFilters.status === 0 ? "text-white" : "text-gray-700"
                    }`}
                >
                  Aktif
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`mr-2 px-3 py-1 rounded-full ${localFilters.status === 1 ? "bg-blue-500" : "bg-gray-200"
                  }`}
                onPress={() => {
                  setLocalFilters({ ...localFilters, status: 1 });
                  Logger.event("filter_status_changed", { status: 1 });
                }}
              >
                <Text
                  className={`${localFilters.status === 1 ? "text-white" : "text-gray-700"
                    }`}
                >
                  Kiralandı
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`px-3 py-1 rounded-full ${localFilters.status === 2 ? "bg-blue-500" : "bg-gray-200"
                  }`}
                onPress={() => {
                  setLocalFilters({ ...localFilters, status: 2 });
                  Logger.event("filter_status_changed", { status: 2 });
                }}
              >
                <Text
                  className={`${localFilters.status === 2 ? "text-white" : "text-gray-700"
                    }`}
                >
                  Kapalı
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="flex-row mt-2">
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-300 py-2 rounded-lg mr-2"
            onPress={resetFilters}
          >
            <Text className="text-gray-700 font-semibold text-center">
              Sıfırla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-blue-500 py-2 rounded-lg"
            onPress={applyFilters}
          >
            <Text className="text-white font-semibold text-center">Uygula</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

  // Header with title and filter toggle
  const renderHeader = () => (
    <View className="flex-row justify-between items-center mb-4">
      <Text className="text-xl font-bold text-gray-800">
        {userRole === "EVSAHIBI" ? "Mülklerim" : "İlanlar"}
      </Text>

      <View className="flex-row">
        {userRole === "EVSAHIBI" && (
          <TouchableOpacity
            className="bg-blue-500 p-2 rounded-full mr-2"
            onPress={handleCreatePostNavigation}
          >
            <MaterialIcons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className={`p-2 rounded-full ${isFilterVisible ||
            Object.values(filters).some((val) => val !== null)
            ? "bg-blue-500"
            : "bg-gray-200"
            }`}
          onPress={() => {
            Logger.event("toggle_filter_panel", { show: !isFilterVisible });
            setIsFilterVisible(!isFilterVisible);
          }}
        >
          <MaterialIcons
            name="filter-list"
            size={22}
            color={
              isFilterVisible ||
                Object.values(filters).some((val) => val !== null)
                ? "#FFFFFF"
                : "#4B5563"
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
          <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-1 flex-row items-center">
            <Text className="text-blue-800 text-sm mr-1">
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

        {filters.priceMin !== null && (
          <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-1 flex-row items-center">
            <Text className="text-blue-800 text-sm mr-1">
              Min: {filters.priceMin} ₺
            </Text>
            <TouchableOpacity
              onPress={() => {
                Logger.event("remove_filter", { type: "priceMin" });
                dispatch(setPostFilters({ ...filters, priceMin: null }));
                setLocalFilters({ ...localFilters, priceMin: "" });
              }}
            >
              <MaterialIcons name="close" size={16} color="#1E40AF" />
            </TouchableOpacity>
          </View>
        )}

        {filters.priceMax !== null && (
          <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-1 flex-row items-center">
            <Text className="text-blue-800 text-sm mr-1">
              Max: {filters.priceMax} ₺
            </Text>
            <TouchableOpacity
              onPress={() => {
                Logger.event("remove_filter", { type: "priceMax" });
                dispatch(setPostFilters({ ...filters, priceMax: null }));
                setLocalFilters({ ...localFilters, priceMax: "" });
              }}
            >
              <MaterialIcons name="close" size={16} color="#1E40AF" />
            </TouchableOpacity>
          </View>
        )}

        {filters.status !== null && (
          <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-1 flex-row items-center">
            <Text className="text-blue-800 text-sm mr-1">
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
    <View className="flex-1 bg-gray-50 p-4">
      {/* Search bar */}
      <View className="bg-white rounded-lg flex-row items-center px-4 py-2 mb-4 border border-gray-200">
        <MaterialIcons
          name="search"
          size={20}
          color="#9CA3AF"
          className="mr-2"
        />
        <TextInput
          className="flex-1 text-base"
          placeholder={
            userRole === "EVSAHIBI"
              ? "Kendi ilanlarınızda arayın..."
              : "İlanlarda arayın..."
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => {
              Logger.event("clear_search");
              setSearchQuery("");
            }}
          >
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {renderHeader()}
      {renderFilterModal()}
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
          keyExtractor={(item) => item.postId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => {
            Logger.event("end_of_list_reached");
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

export default PostsScreen;
