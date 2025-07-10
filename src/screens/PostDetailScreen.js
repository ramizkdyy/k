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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useGetPostQuery,
  useCreateOfferMutation,
  useToggleFavoritePropertyMutation,
} from "../redux/api/apiSlice";
import { setCurrentPost } from "../redux/slices/postSlice";
import {
  selectFavoriteProperties,
  addFavoriteProperty,
  removeFavoriteProperty,
} from "../redux/slices/profileSlice";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  faBuilding,
  faElevator,
  faFireFlameCurved,
  faGrid2,
  faHouseBlank,
  faLocationDot,
  faMoneyBills,
  faOven,
  faQuestion,
  faRuler,
  faShower,
} from "@fortawesome/pro-light-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronRight } from "@fortawesome/pro-regular-svg-icons";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const favoriteProperties = useSelector(selectFavoriteProperties);

  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

  // Initialize as empty array, will be populated when images are available
  const [thumbnailScales, setThumbnailScales] = useState([]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const flatListRef = useRef(null);

  // Get post details
  const { data, isLoading, refetch } = useGetPostQuery(postId);

  // Mutations
  const [createOffer, { isLoading: isCreatingOffer }] =
    useCreateOfferMutation();
  const [toggleFavoriteProperty] = useToggleFavoritePropertyMutation();

  // Extract post and images safely at the top level
  const post = data?.result;
  const images = Array.isArray(post?.postImages) ? post.postImages : [];

  useEffect(() => {
    if (data && data.isSuccess && data.result) {
      dispatch(setCurrentPost(data.result));
    }
  }, [data, dispatch]);

  // Initialize animation values when images are available - DÜZELTME
  useEffect(() => {
    if (images.length > 0) {
      // Thumbnail'lar için gereken toplam sayı (ilk 3 + "+X more" butonu)
      const totalThumbnails =
        Math.min(images.length, 3) + (images.length > 3 ? 1 : 0);

      // Only initialize if not already initialized or if count changed
      if (thumbnailScales.length !== totalThumbnails) {
        const newScales = Array(totalThumbnails)
          .fill(null)
          .map(() => new Animated.Value(1));
        setThumbnailScales(newScales);
      }
    }
  }, [images.length]);

  // Check if post is favorited
  useEffect(() => {
    if (favoriteProperties?.length > 0 && postId) {
      const isFav = favoriteProperties.some((fav) => fav.postId === postId);
      setIsFavorite(isFav);
    }
  }, [favoriteProperties, postId]);

  const handleCreateOffer = async () => {
    if (!offerAmount.trim()) {
      Alert.alert("Hata", "Lütfen bir teklif tutarı giriniz.");
      return;
    }

    try {
      // Validate amount is a number
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
    // Prevent multiple rapid clicks
    if (isProcessingFavorite) return;

    setIsProcessingFavorite(true);

    // Store the previous state for rollback
    const previousIsFavorite = isFavorite;
    const previousFavorites = [...favoriteProperties];

    try {
      // Determine action type: 0 for like (add to favorites), 1 for unlike (remove from favorites)
      const actionType = isFavorite ? 1 : 0;

      // Optimistic update
      if (isFavorite) {
        // Remove from favorites immediately
        setIsFavorite(false);
        const favoriteProperty = favoriteProperties.find(
          (fav) => fav.postId === postId
        );
        if (favoriteProperty) {
          dispatch(removeFavoriteProperty(favoriteProperty.id));
        }
      } else {
        // Add to favorites immediately
        setIsFavorite(true);
        const tempFavorite = {
          id: `temp-${Date.now()}`, // Temporary ID
          userId: currentUser.id,
          actionType: 0,
          postId: postId,
          post: data?.result || {}, // Include post data if available
          createdDate: new Date().toISOString(),
        };
        dispatch(addFavoriteProperty(tempFavorite));
      }

      // Make API call with the toggle endpoint
      const favoriteData = {
        userId: currentUser.id,
        postId: postId,
        actionType: actionType, // 0 = like, 1 = unlike
      };

      const response = await toggleFavoriteProperty(favoriteData).unwrap();

      if (response && response.isSuccess) {
        // Handle successful response
        if (actionType === 0) {
          // Was adding to favorites - replace temp with real data
          const tempFavorites = favoriteProperties.filter(
            (fav) => !fav.id.toString().startsWith("temp-")
          );
          dispatch(removeFavoriteProperty(`temp-${Date.now()}`));

          if (response.result) {
            dispatch(addFavoriteProperty(response.result));
          }
        }
        // For remove action (actionType === 1), optimistic update already handled it
      } else {
        throw new Error(response?.message || "İşlem başarısız");
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);

      // Rollback on error
      setIsFavorite(previousIsFavorite);

      // Rollback Redux store
      if (previousIsFavorite) {
        // Was favorited, tried to remove but failed - restore it
        const favoriteToRestore = previousFavorites.find(
          (fav) => fav.postId === postId
        );
        if (favoriteToRestore) {
          dispatch(addFavoriteProperty(favoriteToRestore));
        }
      } else {
        // Wasn't favorited, tried to add but failed - remove the temp one
        const tempFavorites = favoriteProperties.filter(
          (fav) =>
            fav.postId !== postId || !fav.id.toString().startsWith("temp-")
        );
        // Reset to previous state
        favoriteProperties.forEach((fav) => {
          if (fav.id.toString().startsWith("temp-")) {
            dispatch(removeFavoriteProperty(fav.id));
          }
        });
      }

      // Show error message
      let errorMessage =
        "Favorilere ekleme/çıkarma işlemi sırasında bir hata oluştu.";

      if (error?.data?.errors) {
        // Handle validation errors
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

  const goToImage = (index) => {
    if (flatListRef.current && index >= 0 && index < images.length) {
      try {
        // Update state immediately for responsive UI
        setCurrentImageIndex(index);

        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0, // Changed from 0.5 to 0 for better alignment
        });
      } catch (error) {
        console.warn("Error scrolling to image:", error);
        // Fallback: try scrolling to offset
        try {
          setCurrentImageIndex(index);
          flatListRef.current.scrollToOffset({
            offset: index * width,
            animated: true,
          });
        } catch (offsetError) {
          console.warn("Error scrolling to offset:", offsetError);
        }
      }
    }
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Reduced from 80 to 50 for better detection
    minimumViewTime: 50, // Reduced from 100 to 50 for faster response
  }).current;

  // Enhanced handleViewableItemsChanged
  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const visibleItem = viewableItems[0];
      if (
        visibleItem?.index !== null &&
        visibleItem.index !== currentImageIndex
      ) {
        setCurrentImageIndex(visibleItem.index);
      }
    }
  }).current;

  // Enhanced animatePress function with safety check - DÜZELTME
  const animatePress = (index) => {
    if (thumbnailScales[index]) {
      Animated.timing(thumbnailScales[index], {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const animateRelease = (index) => {
    if (thumbnailScales[index]) {
      Animated.timing(thumbnailScales[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

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

  // Render image item for slider
  const renderImageItem = ({ item, index }) => (
    <View style={{ width, height: 350 }}>
      <Image
        source={{ uri: item.postImageUrl }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Image Gallery Slider */}
        <View className="w-full relative">
          {images.length > 0 ? (
            <View className="p-6 bg-transparent">
              {/* Main Image Slider */}
              <View
                style={{
                  borderRadius: 30,
                  overflow: "hidden",
                  boxShadow: "0px 0px 12px #00000050",
                }}
              >
                <FlatList
                  ref={flatListRef}
                  data={images}
                  renderItem={renderImageItem}
                  keyExtractor={(item, index) => `image-${index}`}
                  horizontal
                  pagingEnabled
                  snapToAlignment="center"
                  snapToInterval={width}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  getItemLayout={(data, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                  removeClippedSubviews={false}
                  initialNumToRender={Math.min(images.length, 3)}
                  maxToRenderPerBatch={2}
                  windowSize={5}
                  bounces={false}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={(event) => {
                    // Additional scroll end detection
                    const newIndex = Math.round(
                      event.nativeEvent.contentOffset.x / width
                    );
                    if (
                      newIndex !== currentImageIndex &&
                      newIndex >= 0 &&
                      newIndex < images.length
                    ) {
                      setCurrentImageIndex(newIndex);
                    }
                  }}
                />
              </View>

              {/* Fixed Pagination Dots */}
              {images.length > 1 && (
                <View
                  className="absolute left-0 right-0 flex-row justify-center"
                  style={{ bottom: 110 }}
                >
                  <BlurView
                    intensity={60}
                    tint="dark"
                    className="rounded-full overflow-hidden"
                  >
                    <View className="flex-row justify-center px-2 py-2">
                      {images.map((_, index) => (
                        <TouchableOpacity
                          key={`dot-${index}`}
                          className={`mx-1 h-2 w-2 rounded-full ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-gray-400"
                          }`}
                          onPress={() => goToImage(index)}
                        />
                      ))}
                    </View>
                  </BlurView>
                </View>
              )}

              {/* Image Thumbnails with Animation - DÜZELTME */}
              {images.length > 1 && (
                <View className="flex-row mt-4 gap-2">
                  {images.slice(0, 3).map((image, index) => (
                    <Animated.View
                      key={`thumbnail-${index}`}
                      style={{
                        transform: [
                          {
                            scale: thumbnailScales[index] || 1, // Fallback to 1
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={1}
                        onPressIn={() => {
                          handlePress(); // titreşim
                          animatePress(index); // küçülme başla
                        }}
                        onPressOut={() => {
                          animateRelease(index); // küçülmeyi bitir
                        }}
                        onPress={() => {
                          goToImage(index); // resmi aç
                        }}
                        className={`overflow-hidden ${
                          index === currentImageIndex ? "" : ""
                        }`}
                        style={{
                          boxShadow: "0px 0px 12px #00000030",
                          width: (width - 80) / 4,
                          height: 60,
                          borderRadius: 17,
                          opacity: index === currentImageIndex ? 1 : 0.7,
                        }}
                      >
                        <Image
                          source={{ uri: image.postImageUrl }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}

                  {/* "+X more" butonu için de düzeltme */}
                  {images.length > 3 && (
                    <Animated.View
                      style={{
                        transform: [
                          {
                            scale: thumbnailScales[3] || 1, // Fallback to 1
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={1}
                        onPressIn={() => {
                          handlePress();
                          animatePress(3);
                        }}
                        onPressOut={() => {
                          animateRelease(3);
                        }}
                        onPress={() => {
                          goToImage(3);
                        }}
                        className={`rounded-lg overflow-hidden justify-center items-center ${
                          currentImageIndex >= 3 ? "" : ""
                        }`}
                        style={{
                          boxShadow:
                            currentImageIndex >= 3 && "0px 0px 12px #00000020",
                          width: (width - 80) / 4,
                          height: 60,
                          borderRadius: 17,
                        }}
                      >
                        <Text
                          className={`font-semibold text-xl ${
                            currentImageIndex >= 3 ? "" : "text-gray-900"
                          }`}
                        >
                          +{images.length - 3}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View className="w-full h-96 justify-center items-center">
              <Text className="text-gray-500">Resim bulunamadı</Text>
            </View>
          )}
        </View>

        {/* Post Details */}
        <View className="p-6 pt-2">
          <View className="flex-col">
            <Text style={{ fontSize: 25 }} className="font-bold text-gray-900">
              {post.ilanBasligi}
            </Text>
          </View>
          <View className="flex flex-row justify-between items-center">
            <View className="flex flex-row items-center">
              <Text style={{ fontSize: 12 }} className="text-gray-500">
                {post.il}, {post.ilce}, {post.mahalle}
              </Text>
            </View>
            <Text style={{ fontSize: 14 }} className=" text-gray-500">
              <Text
                className="underline text-gray-900 font-semibold"
                style={{ fontSize: 22 }}
              >
                {post.kiraFiyati} <Text>{post.paraBirimi || "₺"}</Text>
              </Text>{" "}
              /ay
            </Text>
          </View>

          {/* Property Features */}
          <View className="flex-row justify-between p-3 px-6 mb-5 mt-5">
            <View className="items-center gap-2">
              <FontAwesomeIcon size={30} icon={faGrid2} />
              <Text className="text-base font-bold text-gray-800 text-center">
                {post.odaSayisi || "N/A"} Oda
              </Text>
            </View>

            <View className="items-center gap-2">
              <FontAwesomeIcon size={30} icon={faShower} />
              <Text className="text-base font-bold text-gray-800">
                {post.banyoSayisi || "N/A"} Banyo
              </Text>
            </View>
            <View className="items-center gap-2">
              <FontAwesomeIcon size={30} icon={faRuler} />
              <Text className="text-base font-bold text-gray-800">
                {post.brutMetreKare ? `${post.brutMetreKare} m²` : "N/A"}
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
                {post.user?.profileImageUrl ? (
                  <Image
                    source={{ uri: post.user.profileImageUrl }}
                    className="w-full h-full rounded-full "
                  />
                ) : (
                  <View>
                    <Text className="text-xl font-bold text-gray-900">
                      {post.user?.name?.charAt(0) || "E"}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1 flex-col gap-1 ">
                <Text
                  style={{ fontSize: 16 }}
                  className="font-semibold text-gray-800"
                >
                  {post.user?.name} {post.user?.surname}
                </Text>
                <View className="flex flex-row items-center gap-1">
                  <Text style={{ fontSize: 12 }} className=" text-gray-500">
                    Ev Sahibi
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View
            style={{
              borderBottomWidth: 0.4,
              borderBottomColor: "#dee0ea",
            }}
            className="mb-5 pb-6"
          >
            <Text
              style={{ fontSize: 20 }}
              className="font-semibold text-gray-900 mb-4 text-center"
            >
              Ev sahibinin mesajı
            </Text>
            <Text style={{}} className=" text-gray-500 leading-6">
              {post.postDescription || "Bu ilan için açıklama bulunmamaktadır."}
            </Text>
          </View>

          {/* Property Details */}
          <View className="mb-5">
            <Text
              style={{ fontSize: 14 }}
              className="font-medium text-center text-gray-500 mb-4 mt-1"
            >
              İlan Detayları
            </Text>

            <View className="">
              <View
                key="detail-status"
                className="flex-row justify-between py-2  border-gray-200 items-center"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="font-semibold text-gray-900"
                >
                  İlan Durumu
                </Text>
                <Text style={{ fontSize: 14 }} className=" text-gray-500">
                  {post.status === 0
                    ? "Aktif"
                    : post.status === 1
                    ? "Kiralandı"
                    : "Kapalı"}
                </Text>
              </View>

              <View
                key="detail-type"
                className="flex-row justify-between py-2  border-gray-200 items-center"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="font-semibold text-gray-900"
                >
                  İlan Tipi
                </Text>
                <Text style={{ fontSize: 14 }} className=" text-gray-500">
                  {post.propertyType || "Belirtilmemiş"}
                </Text>
              </View>

              <View
                style={{
                  borderBottomWidth: 0.4,
                  borderBottomColor: "#dee0ea",
                }}
                key="detail-created-date"
                className="flex-row justify-between py-2 pb-6 items-center"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="font-semibold text-gray-900"
                >
                  İlan Tarihi
                </Text>
                <Text className=" text-gray-500">
                  {post.createdDate
                    ? new Date(post.createdDate).toLocaleDateString("tr-TR")
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

              <View
                key="detail-heating"
                className="flex-row justify-between py-2  border-gray-200 mt-4 items-center"
              >
                <View className="flex flex-row gap-1 items-center">
                  <FontAwesomeIcon icon={faFireFlameCurved} />
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-semibold"
                  >
                    Isınma
                  </Text>
                </View>

                <Text className=" text-gray-500">
                  {post.isitmaTipi || "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-kitchen"
                className="flex-row justify-between py-2  border-gray-200 items-center"
              >
                <View className="flex flex-row gap-1 items-center">
                  <FontAwesomeIcon icon={faOven} />
                  <View className="flex flex-col gap-1">
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-900 font-semibold"
                    >
                      Mutfak türü
                    </Text>
                  </View>
                </View>
                <Text className=" text-gray-500">
                  {post.mutfak || "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-net-area"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Brüt Metrekare
                </Text>
                <Text className=" text-gray-500">
                  {post.netMetreKare
                    ? `${post.brutMetreKare} m²`
                    : "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-net-area"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Net Metrekare
                </Text>
                <Text className=" text-gray-500">
                  {post.netMetreKare
                    ? `${post.netMetreKare} m²`
                    : "Belirtilmemiş"}
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

              <View
                key="detail-building-age"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Bina Yaşı
                </Text>
                <Text className=" text-gray-500">
                  {post.binaYasi || "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-total-floors"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Toplam Kat
                </Text>
                <Text className=" text-gray-500">
                  {post.toplamKat || "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-total-floors"
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
                  Otopark
                </Text>
                <Text className=" text-gray-500">
                  {post.otopark === true ? "Var" : "Yok"}
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

              <View
                key="detail-dues"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Aidat
                </Text>
                <Text className=" text-gray-500">
                  {post.aidat ? `${post.aidat} ₺` : "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-deposit"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Depozito
                </Text>
                <Text className=" text-gray-500">
                  {post.depozito
                    ? `${post.depozito} ${post.paraBirimi || "₺"}`
                    : "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-min-rental"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Min. Kiralama Süresi
                </Text>
                <Text className=" text-gray-500">
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

              <View
                key="detail-from"
                className="flex-row justify-between py-2 items-center border-gray-200"
              >
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

                <Text className=" text-gray-500">
                  {post.kimden || "Sahibinden"}
                </Text>
              </View>

              <View
                key="detail-site"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Site adı
                </Text>
                <Text className=" text-gray-500">
                  {post.siteAdi || "Belirtilmemiş"}
                </Text>
              </View>

              <View
                key="detail-usage"
                className="flex-row justify-between py-2  border-gray-200"
              >
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Kullanım Durumu
                </Text>
                <Text className=" text-gray-500">
                  {post.kullanimDurumu || "Belirtilmemiş"}
                </Text>
              </View>
            </View>
          </View>

          {/* Property Features */}
          <View className="mb-5">
            <Text
              style={{ fontSize: 20 }}
              className="font-semibold text-gray-900 mb-4"
            >
              Özellikler
            </Text>

            <View className="flex-row flex-wrap">
              {(() => {
                const features = [
                  {
                    key: "balkon",
                    value: post.balkon,
                    label: "Balkon",
                  },
                  {
                    key: "asansor",
                    value: post.asansor,
                    label: "Asansör",
                    icon: <FontAwesome icon={faElevator} />,
                  },
                  { key: "otopark", value: post.otopark, label: "Otopark" },
                  { key: "esyali", value: post.esyali, label: "Eşyalı" },
                  {
                    key: "siteIcerisinde",
                    value: post.siteIcerisinde,
                    label: "Site İçerisinde",
                  },
                  { key: "takas", value: post.takas, label: "Takas" },
                ];

                return features
                  .filter((feature) => feature.value === true)
                  .map((feature) => (
                    <View
                      key={`feature-${feature.key}`}
                      className="bg-white rounded-full border border-gray-900 px-3 py-2 mr-2 mb-2"
                    >
                      <Text
                        style={{ fontSize: 12 }}
                        className="text-gray-900 font-bold"
                      >
                        {feature.label}
                      </Text>
                    </View>
                  ));
              })()}
            </View>
          </View>
        </View>
      </ScrollView>

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

        {userRole === "EVSAHIBI" && post.landlordId === currentUser?.id && (
          <>
            <TouchableOpacity
              className="flex-1 bg-green-50 py-3 rounded-lg mr-2"
              onPress={() =>
                navigation.navigate("EditPost", { postId: post.id })
              }
            >
              <Text className="text-green-700 font-semibold text-center">
                Düzenle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-green-500 py-3 rounded-lg"
              onPress={() => navigation.navigate("Offers", { postId: post.id })}
            >
              <Text className="text-white font-semibold text-center">
                Teklifleri Gör
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
                <TouchableOpacity onPress={() => setIsOfferModalVisible(false)}>
                  <Text className="text-gray-500 text-xl">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 mb-2">Teklif Tutarı (₺)</Text>
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
    </View>
  );
};

export default PostDetailScreen;
