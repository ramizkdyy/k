import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  FlatList,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useGetPostQuery,
  useCreateOfferMutation,
  useToggleFavoritePropertyMutation,
  useGetSimilarPostsByPostIdPaginatedQuery,
  useGetLandlordTenantsPaginatedQuery, // YENİ: Kiracı eşleşmeleri için
} from "../redux/api/apiSlice";
import { setCurrentPost } from "../redux/slices/postSlice";
import {
  selectFavoriteProperties,
  addFavoriteProperty,
  removeFavoriteProperty,
} from "../redux/slices/profileSlice";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  faFireFlameCurved,
  faGrid2,
  faMoneyBills,
  faOven,
  faRuler,
  faShower,
  faArrowLeft,
  faShare,
  faChevronLeft,
  faBed,
  faBedBunk,
  faChevronRight,
  faLocationDot,
  faHeart,
  faUser, // YENİ: Kiracı iconu için
} from "@fortawesome/pro-light-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Haptics from "expo-haptics";
import Carousel from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationSection from "../components/LocationSection";

const { width, height } = Dimensions.get("window");

// Enum mapping functions
const getRentalPeriodText = (value) => {
  const mapping = {
    1: "6 Ay",
    2: "1 Yıl",
    3: "Uzun Vadeli (1+ Yıl)",
    4: "Kısa Dönem Olabilir",
  };
  return mapping[value] || "Belirtilmemiş";
};

const getPropertyTypeText = (value) => {
  const mapping = {
    1: "Daire",
    2: "Müstakil Ev",
    3: "Villa",
    4: "Stüdyo Daire",
    5: "Rezidans",
    6: "Diğer",
  };
  return mapping[value] || "Belirtilmemiş";
};

const getHeatingTypeText = (value) => {
  const mapping = {
    1: "Doğalgaz Kombi",
    2: "Merkezi Sistem",
    3: "Elektrikli Isıtma",
    4: "Soba",
    5: "Fark Etmez",
  };
  return mapping[value] || "Belirtilmemiş";
};

const getCurrencyText = (value) => {
  const mapping = {
    1: "₺",
    2: "USD",
    3: "EUR",
    4: "GBP",
  };
  return mapping[value] || "₺";
};

// YENİ: Match Score gösterim fonksiyonu
const getMatchScoreInfo = (score) => {
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
};

// YENİ: Match Score Bar Component
const MatchScoreBar = ({ matchScore, showBar = false, size = "sm" }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const scoreInfo = getMatchScoreInfo(matchScore);

  // Boyut ayarları
  const sizes = {
    xs: {
      barHeight: 2,
      iconSize: 10,
      textSize: 11,
      containerPadding: 1,
      barWidth: 140,
    },
    sm: {
      barHeight: 4,
      iconSize: 12,
      textSize: 12,
      containerPadding: 2,
      barWidth: 160,
    },
    md: {
      barHeight: 6,
      iconSize: 14,
      textSize: 14,
      containerPadding: 3,
      barWidth: 180,
    },
  };

  const currentSize = sizes[size];

  // Score değiştiğinde debounce ile animasyonu başlat
  useEffect(() => {
    // Önceki timeout'u temizle
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Yeni timeout ayarla
    timeoutRef.current = setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: matchScore,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 200);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [matchScore]);

  if (showBar) {
    return (
      <View style={{ marginTop: currentSize.containerPadding * 2 }}>
        {/* Uyum Barı */}
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

  // Sadece skor gösterimi (bar olmadan)
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
};

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const favoriteProperties = useSelector(selectFavoriteProperties);
  const insets = useSafeAreaInsets();

  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);
  const [isFullscreenModalVisible, setIsFullscreenModalVisible] =
    useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);

  const mainCarouselRef = useRef(null);
  const fullscreenCarouselRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Scroll animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Get post details
  const { data, isLoading } = useGetPostQuery({
    postId: postId,
    userId: currentUser.id,
  });

  // Get similar posts
  const { data: similarPostsData, isLoading: isLoadingSimilarPosts } =
    useGetSimilarPostsByPostIdPaginatedQuery(
      {
        postId: postId,
        page: 1,
        pageSize: 6,
        minSimilarityScore: 0.3,
      },
      {
        skip: !postId,
      }
    );

  // Extract post and images safely
  const post = data?.result.post;
  const images = Array.isArray(post?.postImages) ? post.postImages : [];
  const similarPosts = similarPostsData?.data || [];

  // YENİ: Get matching tenants for this property (only if current user is the landlord)
  const isOwner = userRole === "EVSAHIBI" && post?.userId === currentUser?.id;

  const { data: matchingTenantsData, isLoading: isLoadingMatchingTenants } =
    useGetLandlordTenantsPaginatedQuery(
      {
        landlordUserId: currentUser?.id,
        page: 1,
        pageSize: 6,
        minMatchScore: 0.3,
        propertyId: postId, // Bu ilana özel kiracı eşleşmeleri
      },
      {
        skip: !isOwner || !postId || !currentUser?.id,
      }
    );

  const matchingTenants = matchingTenantsData?.data || [];

  // Mutations
  const [createOffer, { isLoading: isCreatingOffer }] =
    useCreateOfferMutation();
  const [toggleFavoriteProperty] = useToggleFavoritePropertyMutation();

  console.log("similar:", similarPostsData);
  console.log("matching tenants:", matchingTenantsData); // YENİ: Debug için

  useEffect(() => {
    if (data && data.isSuccess && data.result && data.result.post) {
      dispatch(setCurrentPost(data.result.post));
      console.log("DATA:", data.result.post);
    }
  }, [data, dispatch]);

  // Check if post is favorited
  useEffect(() => {
    if (favoriteProperties?.length > 0 && postId) {
      const isFav = favoriteProperties.some((fav) => fav.postId === postId);
      setIsFavorite(isFav);
    }
  }, [favoriteProperties, postId]);

  // Header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [300, 410],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, height * 0.5],
    outputRange: [1, 0.5],
    extrapolate: "clamp",
  });

  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
    }
  );

  // Handle main carousel change
  const handleMainCarouselChange = (index) => {
    setCurrentImageIndex(index);
  };

  // Handle thumbnail press
  const handleThumbnailPress = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentImageIndex(index);
    if (mainCarouselRef.current) {
      mainCarouselRef.current.scrollTo({ index, animated: true });
    }
  };

  // Open fullscreen modal
  const openFullscreenModal = (index = currentImageIndex) => {
    setFullscreenImageIndex(index);
    setIsFullscreenModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  // Close fullscreen modal
  const closeFullscreenModal = () => {
    setIsFullscreenModalVisible(false);
  };

  // Handle fullscreen carousel change
  const handleFullscreenCarouselChange = (index) => {
    setFullscreenImageIndex(index);
  };

  // Render main image item
  const renderMainImageItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={{ width, height: "100%" }}
        onPress={() => openFullscreenModal(index)}
        activeOpacity={1}
      >
        <Image
          source={{ uri: item.postImageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  // Render fullscreen image item
  const renderFullscreenImageItem = ({ item, index }) => {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: item.postImageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>
    );
  };

  // Render similar post card
  const renderSimilarPostCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      className="overflow-hidden w-72 flex flex-col px-3 py-3"
      onPress={() => {
        navigation.navigate("PostDetail", { postId: item.postId });
      }}
    >
      {/* Image Container */}
      <View className="relative">
        <Image
          style={{
            height: 220,
            borderRadius: 25,
            boxShadow: "0px 0px 12px #00000024",
          }}
          source={{
            uri:
              item.postImages && item.postImages.length > 0
                ? item.postImages[0].postImageUrl
                : item.firstPostİmageURL ||
                  "https://via.placeholder.com/300x200",
          }}
          className="w-full"
          resizeMode="cover"
        />

        {/* Similarity Score Badge */}
        {/* {item.similarityScore && (
          <BlurView
            intensity={60}
            tint="dark"
            className="absolute top-3 right-3 rounded-full overflow-hidden"
          >
            <View className="px-3 py-1.5 flex-row items-center gap-1">
              <FontAwesome name="clone" size={14} color="white" />
              <Text className="text-white text-xs font-semibold">
                {Math.round(item.similarityScore)}% benzer
              </Text>
            </View>
          </BlurView>
        )} */}
      </View>

      {/* Property Details */}
      <View className="py-3 px-1">
        <Text
          style={{ fontSize: 16, fontWeight: 600 }}
          className="text-gray-800"
          numberOfLines={2}
        >
          {item.ilanBasligi ||
            `${item.il} ${item.ilce} ${item.odaSayisi} Kiralık Daire`}
        </Text>

        <View className="flex justify-between flex-row items-center mt-1">
          <View className="flex-row items-center">
            <Text
              style={{ fontSize: 14, fontWeight: 400 }}
              className="text-gray-500"
            >
              {item.kiraFiyati
                ? `${item.kiraFiyati.toLocaleString()} ${
                    item.paraBirimi || "₺"
                  }`
                : "Fiyat belirtilmemiş"}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">/ay</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // YENİ: Render matching tenant card
  const renderMatchingTenantCard = ({ item, index }) => (
    <TouchableOpacity
      style={{
        borderRightWidth: index === matchingTenants.length - 1 ? 0 : 0.5,
        marginRight: index === matchingTenants.length - 1 ? 0 : 16,
        paddingRight: 30,
        borderColor: "#dee0ea",
      }}
      activeOpacity={1}
      className="mr-4 mb-3 overflow-hidden w-72 flex flex-col bg-white p-4"
      onPress={() => {
        // Navigate to tenant profile
        navigation.navigate("TenantProfile", {
          tenantId: item.tenantProfileId || item.userId,
        });
      }}
    >
      {/* Tenant Image and Basic Info */}
      <View className="flex-row items-center mb-3">
        <Image
          style={{ width: 60, height: 60, boxShadow: "0px 0px 12px #00000020" }}
          source={{
            uri:
              item.tenantURL ||
              item.profilePictureUrl ||
              "https://via.placeholder.com/60x60",
          }}
          className="rounded-full border border-gray-100"
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          <Text
            style={{ fontSize: 16, fontWeight: 700 }}
            className="text-gray-800 mb-1"
            numberOfLines={1}
          >
            {item.tenantName ||
              `${item.name || ""} ${item.surname || ""}` ||
              "Kiracı"}
          </Text>
          <View className="flex flex-row items-center gap-1">
            <Text className="text-gray-500" style={{ fontSize: 12 }}>
              Profili görüntüle
            </Text>
            <FontAwesomeIcon size={12} color="#dee0ea" icon={faChevronRight} />
          </View>
        </View>
      </View>

      {/* Tenant Details */}
      <View className="space-y-2">
        {/* Budget */}
        {(item.details?.budget || item.budget) && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600 text-sm">Bütçe:</Text>
            <Text className="text-gray-800 text-sm font-medium">
              {(item.details?.budget || item.budget)?.toLocaleString()} ₺
            </Text>
          </View>
        )}

        {/* Preferred Location */}
        {(item.details?.preferredLocation || item.preferredLocation) && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600 text-sm">Tercih Edilen Bölge:</Text>
            <Text
              className="text-gray-800 text-sm font-medium"
              numberOfLines={1}
            >
              {item.details?.preferredLocation ||
                item.preferredLocation ||
                "Belirtilmemiş"}
            </Text>
          </View>
        )}

        {/* Room Preference */}
        {(item.details?.minRooms || item.minRooms) && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600 text-sm">Min. Oda Sayısı:</Text>
            <Text className="text-gray-800 text-sm font-medium">
              {item.details?.minRooms || item.minRooms || "Belirtilmemiş"}
            </Text>
          </View>
        )}

        {/* Compatibility Level */}
        {item.matchScore && (
          <View className="py-1">
            <MatchScoreBar
              matchScore={item.matchScore}
              showBar={true}
              size="sm"
            />

            {/* Match Reasons */}
            {item.matchReasons && item.matchReasons.length > 0 && (
              <Text style={{ fontSize: 12 }} className="text-gray-500 mt-2">
                {item.matchReasons[0]}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Handle see all similar posts
  const handleSeeAllSimilarPosts = () => {
    navigation.navigate("AllSimilarProperties", {
      postId: postId,
      searchType: "byPost",
      title: "Benzer İlanlar",
    });
  };

  // YENİ: Handle see all matching tenants
  const handleSeeAllMatchingTenants = () => {
    navigation.navigate("AllMatchingUsers", {
      searchType: "bestTenants",
      landlordUserId: currentUser?.id,
      propertyId: postId,
      title: "Bu İlan İçin Uygun Kiracılar",
    });
  };

  const handleCreateOffer = async () => {
    if (!offerAmount.trim()) {
      Alert.alert("Hata", "Lütfen bir teklif tutarı giriniz.");
      return;
    }

    try {
      const amount = parseFloat(offerAmount.replace(/[^0-9.]/g, ""));
      if (isNaN(amount)) {
        Alert.alert("Hata", "Geçerli bir tutar giriniz.");
        return;
      }

      const offerData = {
        postId,
        userId: currentUser.id,
        offerAmount: amount,
        actionType: 2,
        description: offerMessage.trim() || null,
      };

      const response = await createOffer(offerData).unwrap();

      if (response && response.isSuccess) {
        Alert.alert("Başarılı", "Teklifiniz başarıyla gönderildi.", [
          { text: "Tamam", onPress: () => setIsOfferModalVisible(false) },
        ]);
      } else {
        Alert.alert(
          "Hata",
          response?.message || "Teklif gönderilirken bir hata oluştu."
        );
      }
    } catch (error) {
      console.error("Offer creation error:", error);
      Alert.alert(
        "Hata",
        error.data?.message ||
          "Teklif gönderilirken bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  const handleToggleFavorite = async () => {
    if (isProcessingFavorite) return;

    setIsProcessingFavorite(true);
    const previousIsFavorite = isFavorite;
    const previousFavorites = [...favoriteProperties];

    try {
      const actionType = isFavorite ? 1 : 0;

      // Optimistic update
      if (isFavorite) {
        setIsFavorite(false);
        const favoriteProperty = favoriteProperties.find(
          (fav) => fav.postId === postId
        );
        if (favoriteProperty) {
          dispatch(removeFavoriteProperty(favoriteProperty.id));
        }
      } else {
        setIsFavorite(true);
        const tempFavorite = {
          id: `temp-${Date.now()}`,
          userId: currentUser.id,
          actionType: 0,
          postId: postId,
          post: data?.result || {},
          createdDate: new Date().toISOString(),
        };
        dispatch(addFavoriteProperty(tempFavorite));
      }

      const favoriteData = {
        userId: currentUser.id,
        postId: postId,
        actionType: actionType,
      };

      const response = await toggleFavoriteProperty(favoriteData).unwrap();

      if (response && response.isSuccess) {
        if (actionType === 0) {
          const tempFavorites = favoriteProperties.filter(
            (fav) => !fav.id.toString().startsWith("temp-")
          );
          dispatch(removeFavoriteProperty(`temp-${Date.now()}`));

          if (response.result) {
            dispatch(addFavoriteProperty(response.result));
          }
        }
      } else {
        throw new Error(response?.message || "İşlem başarısız");
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);

      // Rollback on error
      setIsFavorite(previousIsFavorite);

      if (previousIsFavorite) {
        const favoriteToRestore = previousFavorites.find(
          (fav) => fav.postId === postId
        );
        if (favoriteToRestore) {
          dispatch(addFavoriteProperty(favoriteToRestore));
        }
      } else {
        favoriteProperties.forEach((fav) => {
          if (fav.id.toString().startsWith("temp-")) {
            dispatch(removeFavoriteProperty(fav.id));
          }
        });
      }

      let errorMessage =
        "Favorilere ekleme/çıkarma işlemi sırasında bir hata oluştu.";

      if (error?.data?.errors) {
        const validationErrors = Object.values(error.data.errors).flat();
        errorMessage = validationErrors.join(", ");
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Hata", errorMessage);
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  // Calculate margin top based on scroll position
  const marginTop = scrollY.interpolate({
    inputRange: [0, height * 0.95],
    outputRange: [0, -height * 0.15],
    extrapolate: "clamp",
  });

  // Render loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">İlan yükleniyor...</Text>
      </View>
    );
  }

  // If post data is not available
  if (!post) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-700">İlan bulunamadı</Text>
        <TouchableOpacity
          className="mt-4 bg-green-500 px-6 py-2 rounded-lg"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-semibold">Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pb-10">
      {/* Absolute Blurred Header */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 50 + insets.top,
          opacity: headerOpacity,
          zIndex: 1000,
        }}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={{
            flex: 1,
          }}
        >
          {/* Safe Area Top Blur */}
          <BlurView
            intensity={0}
            tint="light"
            style={{
              height: insets.top,
              width: "100%",
            }}
          />

          <View
            style={{
              height: 50,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
            }}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color="#374151" />
            </TouchableOpacity>

            {/* Title */}
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                marginHorizontal: 16,
                fontSize: 18,
                fontWeight: "300",
                color: "#000",
                textAlign: "center",
              }}
            >
              {post?.ilanBasligi || ""}
            </Text>

            {/* Share Button (placeholder for symmetry) */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => {
                // Add share functionality here
                console.log("Share pressed");
              }}
            >
              <FontAwesomeIcon icon={faShare} size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {/* Floating Back Button (for when header is not visible) */}
      <Animated.View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          zIndex: 999,
          opacity: scrollY.interpolate({
            inputRange: [0, 100],
            outputRange: [1, 0],
            extrapolate: "clamp",
          }),
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View
            className="bg-white"
            style={{
              width: 40,
              height: 40,
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              boxShadow: "0px 0px 12px #00000020",
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} size={22} color="black" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        className="flex-1 bg-white"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Static Image Carousel */}
        <View
          style={{
            marginBottom: -20,
            height: height * 0.5,
            backgroundColor: "#f5f5f5",
          }}
        >
          {images.length > 0 ? (
            <View style={{ flex: 1 }}>
              <Animated.View style={{ flex: 1, opacity: imageOpacity }}>
                <Carousel
                  ref={mainCarouselRef}
                  width={width}
                  height="100%"
                  data={images}
                  renderItem={renderMainImageItem}
                  onSnapToItem={handleMainCarouselChange}
                  pagingEnabled={true}
                  loop={false}
                  snapEnabled={true}
                  enabled={images.length > 1}
                />
              </Animated.View>

              {/* Pagination Dots */}
              {images.length > 1 && (
                <Animated.View
                  className="absolute left-0 right-0 flex-row justify-center"
                  style={{
                    bottom: 30,
                    opacity: imageOpacity,
                  }}
                >
                  <BlurView
                    intensity={60}
                    tint="dark"
                    className="rounded-full overflow-hidden"
                  >
                    <View className="flex-row justify-center px-3 py-2">
                      {images.map((_, index) => (
                        <TouchableOpacity
                          key={`dot-${index}`}
                          className={`mx-1 h-2 w-2 rounded-full ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-gray-400"
                          }`}
                          onPress={() => handleThumbnailPress(index)}
                        />
                      ))}
                    </View>
                  </BlurView>
                </Animated.View>
              )}
            </View>
          ) : (
            <View className="w-full h-full justify-center items-center bg-gray-100">
              <Text className="text-gray-500">Resim bulunamadı</Text>
            </View>
          )}
        </View>

        {/* Content Container with Dynamic Margin */}
        <Animated.View
          className="bg-white pt-4"
          style={{
            marginTop: marginTop,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View className="flex justify-center items-center">
            <View
              style={{ height: 5, width: 50 }}
              className=" bg-gray-200 rounded-full"
            ></View>
          </View>
          {/* Thumbnail Carousel */}
          <View style={{ paddingRight: 20 }}>
            {images.length > 1 ? (
              <View style={{ marginTop: 20, marginBottom: 16 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingLeft: 20,
                    paddingRight: 20,
                  }}
                  style={{
                    height: 55,
                  }}
                >
                  {images.map((item, index) => (
                    <TouchableOpacity
                      key={`thumbnail-${index}`}
                      activeOpacity={0.8}
                      onPress={() => handleThumbnailPress(index)}
                      style={{
                        width: 70,
                        height: 55,
                        marginRight: 10,
                        borderRadius: 15,
                        opacity: index === currentImageIndex ? 1 : 0.7,
                        borderWidth: index === currentImageIndex ? 0 : 0,
                        borderColor:
                          index === currentImageIndex ? "#000" : "transparent",
                      }}
                    >
                      <Image
                        source={{ uri: item.postImageUrl }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 13,
                        }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          {/* Post Details */}
          <View className="p-6  pt-2">
            <View className="flex-col">
              <Text
                style={{ fontSize: 25, fontWeight: 700 }}
                className="font-bold text-gray-900"
              >
                {post.ilanBasligi || "İlan Başlığı"}
              </Text>
            </View>
            <View className="flex flex-col gap-4 mt-1">
              <View className="flex flex-row items-center">
                <Text style={{ fontSize: 12 }} className="text-gray-500">
                  {[post.il, post.ilce, post.mahalle]
                    .filter(Boolean)
                    .join(", ") || "Konum belirtilmemiş"}
                </Text>
              </View>
              <Text style={{ fontSize: 14 }} className="text-gray-500">
                <Text
                  className="underline text-gray-900 font-medium"
                  style={{ fontSize: 18 }}
                >
                  {post.kiraFiyati
                    ? post.kiraFiyati.toLocaleString("tr-TR")
                    : "0"}{" "}
                  <Text>{getCurrencyText(post.paraBirimi)}</Text>
                </Text>{" "}
                /ay
              </Text>
            </View>

            {/* Property Features - Güncellenmiş 5 özellik */}
            <View
              style={{ paddingLeft: 20, paddingRight: 20 }}
              className="flex-row justify-between p-4 mb-6 mt-6"
            >
              <View className="items-center gap-2">
                <FontAwesomeIcon size={26} icon={faBed} />
                <Text
                  style={{ fontSize: 13 }}
                  className="font-medium text-center text-gray-500"
                >
                  {post.odaSayisi || "N/A"} Oda
                </Text>
              </View>

              <View className="items-center gap-2">
                <FontAwesomeIcon size={26} icon={faBedBunk} />
                <Text
                  style={{ fontSize: 13 }}
                  className="font-medium text-center text-gray-500"
                >
                  {post.yatakOdasiSayisi || "N/A"} Y.Odası
                </Text>
              </View>

              <View className="items-center gap-2">
                <FontAwesomeIcon size={26} icon={faShower} />
                <Text
                  style={{ fontSize: 13 }}
                  className="font-medium text-center text-gray-500"
                >
                  {post.banyoSayisi || "N/A"} Banyo
                </Text>
              </View>

              <View className="items-center gap-2">
                <FontAwesomeIcon size={26} icon={faRuler} />
                <Text
                  style={{ fontSize: 13 }}
                  className="font-medium text-center text-gray-500"
                >
                  {post.brutMetreKare ? `${post.brutMetreKare} m²` : "N/A"}
                </Text>
              </View>

              <View className="items-center gap-2">
                <FontAwesomeIcon size={26} icon={faMoneyBills} />
                <Text
                  style={{ fontSize: 13 }}
                  className="font-medium text-center text-gray-500"
                >
                  {post.aidat ? `${post.aidat} ₺` : "Yok"}
                </Text>
              </View>
            </View>

            {/* Landlord Information */}
            <View
              style={{
                borderBottomWidth: 0.4,
                borderTopWidth: 0.4,
                borderTopColor: "#dee0ea",
                borderBottomColor: "#dee0ea",
              }}
              className="mb-5 py-4"
            >
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() =>
                  navigation.navigate("LandlordProfile", {
                    userId: post.landlordId,
                  })
                }
              >
                <View
                  style={{ boxShadow: "0px 0px 12px #00000020" }}
                  className="w-14 h-14 rounded-full bg-gray-100 justify-center items-center mr-3 border-gray-200 border"
                >
                  {post.user?.profilePictureUrl ? (
                    <Image
                      source={{ uri: post.user.profilePictureUrl }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <View>
                      <Text className="text-xl font-bold text-gray-900">
                        {post.user?.name?.charAt(0) || "E"}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-1 flex-col gap-1">
                  <Text
                    style={{ fontSize: 16 }}
                    className="font-semibold text-gray-800"
                  >
                    {post.user?.name || ""} {post.user?.surname || ""}
                  </Text>
                  <View className="flex flex-row items-center gap-1">
                    <Text style={{ fontSize: 12 }} className="text-gray-500">
                      Ev Sahibi
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View
              style={{
                borderBottomWidth: 0.4,
                borderBottomColor: "#dee0ea",
              }}
              className="mb-5 pb-6"
            >
              <Text
                style={{ fontSize: 14 }}
                className=" font-medium text-center text-gray-500 mb-4 mt-1"
              >
                Ev sahibinin mesajı
              </Text>
              <Text className="text-gray-500 leading-6">
                {post.postDescription ||
                  "Bu ilan için açıklama bulunmamaktadır."}
              </Text>
            </View>

            {/* Location Section */}
            <LocationSection post={post} />

            {/* Property Details */}
            <View className="">
              <Text
                style={{ fontSize: 14 }}
                className="font-medium text-center text-gray-500 mb-4 mt-1"
              >
                İlan Detayları
              </Text>

              <View className="">
                <View className="flex-row justify-between py-2 border-gray-200 items-center">
                  <Text
                    style={{ fontSize: 16 }}
                    className="font-semibold text-gray-900"
                  >
                    İlan Durumu
                  </Text>
                  <Text style={{ fontSize: 14 }} className="text-gray-500">
                    {post.status === 0
                      ? "Aktif"
                      : post.status === 1
                      ? "Kiralandı"
                      : "Kapalı"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200 items-center">
                  <Text
                    style={{ fontSize: 16 }}
                    className="font-semibold text-gray-900"
                  >
                    İlan Tipi
                  </Text>
                  <Text style={{ fontSize: 14 }} className="text-gray-500">
                    {getPropertyTypeText(post.propertyType)}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200 items-center">
                  <Text
                    style={{ fontSize: 16 }}
                    className="font-semibold text-gray-900"
                  >
                    Kiralama Süresi
                  </Text>
                  <Text style={{ fontSize: 14 }} className="text-gray-500">
                    {getRentalPeriodText(post.rentalPeriod)}
                  </Text>
                </View>

                <View
                  style={{
                    borderBottomWidth: 0.4,
                    borderBottomColor: "#dee0ea",
                  }}
                  className="flex-row justify-between py-2 pb-6 items-center"
                >
                  <Text
                    style={{ fontSize: 16 }}
                    className="font-semibold text-gray-900"
                  >
                    İlan Tarihi
                  </Text>
                  <Text className="text-gray-500">
                    {post.postTime
                      ? new Date(post.postTime).toLocaleDateString("tr-TR")
                      : "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex flex-col items-center mt-8">
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-medium text-center text-gray-500 mb-2 mt-1"
                  >
                    Ev içi
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200 mt-4 items-center">
                  <View className="flex flex-row gap-1 items-center">
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-900 font-semibold"
                    >
                      Isınma
                    </Text>
                  </View>
                  <Text className="text-gray-500">
                    {getHeatingTypeText(post.isitmaTipi)}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200 items-center">
                  <View className="flex flex-row gap-1 items-center">
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-900 font-semibold"
                    >
                      Mutfak türü
                    </Text>
                  </View>
                  <Text className="text-gray-500">
                    {post.mutfak || "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Net Metrekare
                  </Text>
                  <Text className="text-gray-500">
                    {post.netMetreKare
                      ? `${post.netMetreKare} m²`
                      : "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Brüt Metrekare
                  </Text>
                  <Text className="text-gray-500">
                    {post.brutMetreKare
                      ? `${post.brutMetreKare} m²`
                      : "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 ">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Eşyalı mı?
                  </Text>
                  <Text className="text-gray-500">
                    {post.esyali === true ? "Evet" : "Hayır"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 ">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Balkon var mı?
                  </Text>
                  <Text className="text-gray-500">
                    {post.balkon === true ? "Var" : "Yok"}
                  </Text>
                </View>

                <View
                  style={{
                    borderTopWidth: 0.4,
                    borderTopColor: "#dee0ea",
                  }}
                  className="flex flex-col items-center mt-4 pt-4"
                >
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-medium text-center text-gray-500 mb-4 mt-1"
                  >
                    Apartman / Bina
                  </Text>
                </View>

                {/* YENİ: Bulunduğu Kat */}
                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Bulunduğu Kat
                  </Text>
                  <Text className="text-gray-500">
                    {post.bulunduguKat || "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Toplam Kat
                  </Text>
                  <Text className="text-gray-500">
                    {post.toplamKat || "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Bina Yaşı
                  </Text>
                  <Text className="text-gray-500">
                    {post.binaYasi || "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 ">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Otopark
                  </Text>
                  <Text className="text-gray-500">
                    {post.otopark === true ? "Var" : "Yok"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 ">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Asansör
                  </Text>
                  <Text className="text-gray-500">
                    {post.asansor === true ? "Var" : "Yok"}
                  </Text>
                </View>

                <View
                  style={{
                    borderBottomWidth: 0.4,
                    borderBottomColor: "#dee0ea",
                  }}
                  className="flex-row justify-between py-2 pb-6 border-gray-200"
                >
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Site İçerisinde
                  </Text>
                  <Text className="text-gray-500">
                    {post.siteIcerisinde === true ? "Evet" : "Hayır"}
                  </Text>
                </View>

                <View className="flex flex-col items-center mt-4">
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-medium text-center text-gray-500 mb-4 mt-1"
                  >
                    Ödenekler
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Aidat
                  </Text>
                  <Text className="text-gray-500">
                    {post.aidat ? `${post.aidat} ₺` : "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Depozito
                  </Text>
                  <Text className="text-gray-500">
                    {post.depozito
                      ? `${post.depozito} ${getCurrencyText(post.paraBirimi)}`
                      : "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Min. Kiralama Süresi
                  </Text>
                  <Text className="text-gray-500">
                    {post.minimumKiralamaSuresi
                      ? `${post.minimumKiralamaSuresi} Ay`
                      : "Belirtilmemiş"}
                  </Text>
                </View>

                <View
                  style={{
                    borderTopWidth: 0.4,
                    borderTopColor: "#dee0ea",
                  }}
                  className="flex flex-col items-center mt-6 pt-4"
                >
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-medium text-center text-gray-500 mb-4 mt-1"
                  >
                    Diğer
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 items-center border-gray-200">
                  <View className="flex flex-col gap-1">
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-900 font-semibold"
                    >
                      Kimden
                    </Text>
                    <Text style={{ fontSize: 12 }} className="text-gray-500">
                      Mülkün kimin tarafından kiralandığı
                    </Text>
                  </View>
                  <Text className="text-gray-500">
                    {post.kimden || "Sahibinden"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Site adı
                  </Text>
                  <Text className="text-gray-500">
                    {post.siteAdi || "Belirtilmemiş"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 ">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Takas
                  </Text>
                  <Text className="text-gray-500">
                    {post.takas === true ? "Var" : "Yok"}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 border-gray-200">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Kullanım Durumu
                  </Text>
                  <Text className="text-gray-500">
                    {post.kullanimDurumu || "Belirtilmemiş"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* YENİ: Matching Tenants Section - Sadece ilanın sahibi için */}
          {isOwner && matchingTenants.length > 0 && (
            <View
              style={{
                paddingTop: 16,
                borderTopWidth: 0.4,
                borderTopColor: "#dee0ea",
              }}
              className="mb-5"
            >
              {/* Header */}
              <View className="flex-row justify-center items-center mb-6 px-6">
                <Text
                  style={{ fontSize: 14 }}
                  className="text-gray-500 font-medium"
                >
                  Önerilen Kiracılar
                </Text>
              </View>

              {/* Matching Tenants Horizontal Scroll */}
              {isLoadingMatchingTenants ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text className="text-center text-gray-500 mt-2">
                    Uygun kiracılar yükleniyor...
                  </Text>
                </View>
              ) : (
                <FlatList
                  style={{ paddingLeft: 16 }}
                  data={matchingTenants}
                  renderItem={renderMatchingTenantCard}
                  keyExtractor={(item, index) =>
                    `tenant_${item.tenantProfileId || item.userId}_${index}`
                  }
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                  contentContainerStyle={{ paddingRight: 20 }}
                  onScrollBeginDrag={() => {
                    navigation.getParent()?.setOptions({
                      swipeEnabled: false,
                    });
                  }}
                  onScrollEndDrag={() => {
                    navigation.getParent()?.setOptions({
                      swipeEnabled: true,
                    });
                  }}
                  onMomentumScrollEnd={() => {
                    navigation.getParent()?.setOptions({
                      swipeEnabled: true,
                    });
                  }}
                />
              )}
            </View>
          )}

          {/* Similar Posts Section */}
          {similarPosts.length > 0 && (
            <View
              style={{
                paddingTop: 16,
                borderTopWidth: 0.4,
                borderTopColor: "#dee0ea",
              }}
              className="mb-5"
            >
              {/* Header */}
              <View className="flex-row justify-center items-center mb-4 px-6">
                <Text
                  style={{ fontSize: 14 }}
                  className="text-gray-500 font-medium"
                >
                  Benzer İlanlar
                </Text>
              </View>

              {/* Similar Posts Horizontal Scroll */}
              {isLoadingSimilarPosts ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text className="text-center text-gray-500 mt-2">
                    Benzer ilanlar yükleniyor...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={similarPosts}
                  renderItem={renderSimilarPostCard}
                  keyExtractor={(item, index) =>
                    `similar_${item.postId}_${index}`
                  }
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                  contentContainerStyle={{ paddingHorizontal: 6 }}
                  onScrollBeginDrag={() => {
                    navigation.getParent()?.setOptions({
                      swipeEnabled: false,
                    });
                  }}
                  onScrollEndDrag={() => {
                    navigation.getParent()?.setOptions({
                      swipeEnabled: true,
                    });
                  }}
                  onMomentumScrollEnd={() => {
                    navigation.getParent()?.setOptions({
                      swipeEnabled: true,
                    });
                  }}
                />
              )}
            </View>
          )}
        </Animated.View>

        {/* Bottom Action Bar */}
        <View className="flex-row justify-between items-center p-4 bg-white border-t border-gray-200">
          {userRole === "KIRACI" && (
            <>
              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-red-50 justify-center items-center mr-3"
                onPress={handleToggleFavorite}
                disabled={isProcessingFavorite}
              >
                <FontAwesome
                  name={isFavorite ? "heart" : "heart-o"}
                  size={20}
                  color={isFavorite ? "#ef4444" : "#9ca3af"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-green-500 py-3 rounded-lg"
                onPress={() => setIsOfferModalVisible(true)}
                disabled={post.status !== 0}
              >
                <Text className="text-white font-semibold text-center">
                  {post.status === 0 ? "Teklif Ver" : "Bu ilan kapalı"}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {userRole === "EVSAHIBI" && post.userId === currentUser?.id && (
            <>
              <TouchableOpacity
                className="flex-1 bg-green-50 py-3 rounded-lg mr-2"
                onPress={() =>
                  navigation.navigate("EditPost", { propertyData: post })
                }
              >
                <Text className="text-green-700 font-semibold text-center">
                  Düzenle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-green-500 py-3 rounded-lg"
                onPress={() =>
                  navigation.navigate("Offers", { postId: post.postId })
                }
              >
                <Text className="text-white font-semibold text-center">
                  Teklifleri Gör
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Fullscreen Image Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isFullscreenModalVisible}
          onRequestClose={closeFullscreenModal}
          statusBarTranslucent={true}
        >
          <StatusBar hidden={true} />
          <BlurView
            intensity={80}
            style={{
              flex: 1,
            }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={closeFullscreenModal}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                top: 50,
                right: 20,
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <BlurView
                intensity={80}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  ✕
                </Text>
              </BlurView>
            </TouchableOpacity>

            {/* Image Counter */}
            {images.length > 1 && (
              <BlurView
                intensity={80}
                style={{
                  position: "absolute",
                  top: 50,
                  left: 20,
                  zIndex: 10,
                  overflow: "hidden",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 100,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 14, fontWeight: "400" }}
                >
                  {fullscreenImageIndex + 1} / {images.length}
                </Text>
              </BlurView>
            )}

            {/* Fullscreen Carousel */}
            <View style={{ flex: 1, justifyContent: "center" }}>
              {images.length > 0 && (
                <Carousel
                  loop={false}
                  ref={fullscreenCarouselRef}
                  width={width}
                  height={height}
                  data={images}
                  renderItem={renderFullscreenImageItem}
                  onSnapToItem={handleFullscreenCarouselChange}
                  defaultIndex={fullscreenImageIndex}
                  pagingEnabled={true}
                  snapEnabled={true}
                  enabled={images.length > 1}
                />
              )}
            </View>

            {/* Pagination Dots for Fullscreen */}
            {images.length > 1 && (
              <View
                style={{
                  position: "absolute",
                  bottom: 50,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <BlurView
                  intensity={80}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    borderRadius: 20,
                    overflow: "hidden",
                    flexDirection: "row",
                  }}
                >
                  {images.map((_, index) => (
                    <TouchableOpacity
                      key={`fullscreen-dot-${index}`}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        marginHorizontal: 4,
                        backgroundColor:
                          index === fullscreenImageIndex ? "#fff" : "#6b7280",
                      }}
                      onPress={() => {
                        setFullscreenImageIndex(index);
                        if (fullscreenCarouselRef.current) {
                          fullscreenCarouselRef.current.scrollTo({
                            index,
                            animated: true,
                          });
                        }
                      }}
                    />
                  ))}
                </BlurView>
              </View>
            )}
          </BlurView>
        </Modal>

        {/* Offer Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isOfferModalVisible}
          onRequestClose={() => setIsOfferModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View
              className="flex-1 justify-end"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <View className="bg-white rounded-t-xl p-5">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-xl font-bold text-gray-800">
                    Teklif Ver
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsOfferModalVisible(false)}
                  >
                    <Text className="text-gray-500 text-xl">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">
                    Teklif Tutarı ({getCurrencyText(post.paraBirimi)})
                  </Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg text-base"
                    placeholder="Ör: 3500"
                    keyboardType="numeric"
                    value={offerAmount}
                    onChangeText={setOfferAmount}
                  />
                </View>

                <View className="mb-5">
                  <Text className="text-gray-600 mb-2">Mesaj (Opsiyonel)</Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg text-base h-24"
                    placeholder="Ev sahibine mesajınız..."
                    multiline
                    textAlignVertical="top"
                    value={offerMessage}
                    onChangeText={setOfferMessage}
                  />
                </View>

                <TouchableOpacity
                  className={`py-3 rounded-lg mb-3 ${
                    isCreatingOffer ? "bg-green-300" : "bg-green-500"
                  }`}
                  onPress={handleCreateOffer}
                  disabled={isCreatingOffer}
                >
                  {isCreatingOffer ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-semibold text-center">
                      Teklifi Gönder
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Animated.ScrollView>
    </View>
  );
};

export default PostDetailScreen;
