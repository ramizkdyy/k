import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useGetSentOffersQuery,
  useGetReceivedOffersQuery,
  useLandlordOfferActionMutation,
  useRentOfferMutation, // YENI EKLEME
} from "../redux/api/apiSlice";
import Icon from "react-native-vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faEnvelope, faExclamationCircle } from "@fortawesome/pro-regular-svg-icons";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const OffersScreen = () => {
  const navigation = useNavigation();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("pending");

  // ADDED: Animation for header
  const scrollY = useRef(new Animated.Value(0)).current;

  // ADDED: Header animation transforms (only for tabs section)
  const tabsTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -60], // Move tabs up
    extrapolate: "clamp",
  });

  const tabsOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const tabsContainerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [50, 0], // Tabs container height animation
    extrapolate: "clamp",
  });

  const insets = useSafeAreaInsets();

  // Rating Score gösterim fonksiyonu
  const getRatingScoreInfo = (rating) => {
    if (rating >= 4.5)
      return {
        level: "excellent",
        color: "#22c55e",
        text: "Mükemmel",
        bgColor: "#dcfce7",
      };
    if (rating >= 3.5)
      return {
        level: "good",
        color: "#3b82f6",
        text: "İyi",
        bgColor: "#dbeafe",
      };
    if (rating >= 2.5)
      return {
        level: "medium",
        color: "#f59e0b",
        text: "Orta",
        bgColor: "#fef3c7",
      };
    return {
      level: "weak",
      color: "#ef4444",
      text: "Düşük",
      bgColor: "#fee2e2",
    };
  };

  // Rating Score Bar Component
  const RatingScoreBar = ({ ratingScore, showBar = false, size = "xs" }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    const scoreInfo = getRatingScoreInfo(ratingScore);

    // Boyut ayarları
    const sizes = {
      xs: {
        barHeight: 2,
        iconSize: 8,
        textSize: 10,
        containerPadding: 1,
        barWidth: 40,
      },
      sm: {
        barHeight: 3,
        iconSize: 10,
        textSize: 11,
        containerPadding: 2,
        barWidth: 50,
      },
      md: {
        barHeight: 4,
        iconSize: 12,
        textSize: 12,
        containerPadding: 3,
        barWidth: 60,
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
          toValue: (ratingScore / 5) * 100, // 5 üzerinden puana göre yüzde hesapla
          duration: 600,
          useNativeDriver: false,
        }).start();
      }, 100);

      // Cleanup function
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [ratingScore]);

    if (showBar) {
      return (
        <View style={{ marginTop: currentSize.containerPadding }}>
          {/* Rating Barı */}
          <View className="flex-row items-center">
            <View
              className="bg-gray-200 rounded-full overflow-hidden"
              style={{
                height: 4,
                width: 100,
                marginRight: 4,
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
              className="font-medium"
              style={{
                color: scoreInfo.color,
                fontSize: currentSize.textSize,
              }}
            >
              {ratingScore.toFixed(2) * 20}%
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
          icon={faStar}
          size={currentSize.iconSize}
        />
        <Text
          className="font-medium ml-1"
          style={{
            color: scoreInfo.color,
            fontSize: currentSize.textSize,
          }}
        >
          {ratingScore.toFixed(1)}
        </Text>
      </View>
    );
  };

  // Conditional query based on user role
  const isTenant = userRole === "KIRACI";
  const isLandlord = userRole === "EVSAHIBI";



  // Fetch offers based on user role
  const {
    data: offersData,
    isLoading,
    refetch,
    error,
  } = isTenant
    ? useGetSentOffersQuery(currentUser?.id, {
        skip: !currentUser?.id,
      })
    : useGetReceivedOffersQuery(currentUser?.id, {
        skip: !currentUser?.id,
      });

  // DÜZELTME: Yeni landlord action mutation'ı kullan

  const [landlordOfferAction] = useLandlordOfferActionMutation();
  const [rentOffer] = useRentOfferMutation(); // YENI EKLEME

  // Log the raw API response for debugging
  useEffect(() => {
    if (offersData) {
      console.log("========== OFFERS API RESPONSE ==========");
      console.log("User Role:", userRole);
      console.log("Is Tenant:", isTenant);
      console.log("Is Landlord:", isLandlord);
      console.log("Raw API Response:", JSON.stringify(offersData, null, 2));
      console.log("Result field:", offersData.result);
      console.log("========================================");
    }
  }, [offersData, userRole, isTenant, isLandlord]);

  // DÜZELTME: Veri yapısını doğru şekilde işle
  let offers = [];

  if (offersData?.result) {
    if (Array.isArray(offersData.result)) {
      // API'den gelen veri yapısına göre işle
      const processedOffers = offersData.result
        .map((item) => {
          // rentalOfferDto ve postDto yapısını kontrol et
          if (item.rentalOfferDto && item.postDto) {
            return {
              // Teklif bilgilerini al
              ...item.rentalOfferDto,
              // Post bilgilerini ekle
              post: {
                userName: item?.postDto?.user?.name,
                userId: item?.postDto?.user?.id,
                profilePictureUrl: item?.postDto?.user?.profilePictureUrl,
                postId: item.postDto.postId,
                ilanBasligi: item.postDto.ilanBasligi,
                kiraFiyati: item.postDto.kiraFiyati,
                ilce: item.postDto.ilce,
                mahalle: item.postDto.mahalle,
                postImages: item.postDto.postImages,
                il: item.postDto.il,
                paraBirimi: item.postDto.paraBirimi,
              },
            };
          }
          // Eğer direkt teklif objesi ise
          else if (item.offerId) {
            return item;
          }
          // Diğer durumlar için fallback
          else {
            return item;
          }
        })
        .filter((offer) => {
          // EKLEME: Sadece aktif teklifleri göster
          return offer && offer.isActive === true;
        });

      // EKLEME: Aynı postId için sadece en son teklifi göster
      const uniqueOffers = new Map();

      processedOffers.forEach((offer) => {
        const postId = offer.postId || offer.post?.postId;
        if (postId) {
          const existingOffer = uniqueOffers.get(postId);

          // Eğer bu post için daha önce teklif yoksa veya mevcut teklif daha yeniyse
          if (
            !existingOffer ||
            new Date(offer.offerTime) > new Date(existingOffer.offerTime)
          ) {
            uniqueOffers.set(postId, offer);
            console.log(
              `Updated offer for postId ${postId}: offerId ${offer.offerId}, time: ${offer.offerTime}`
            );
          } else {
            console.log(
              `Skipped older offer for postId ${postId}: offerId ${offer.offerId}, time: ${offer.offerTime}`
            );
          }
        }
      });

      offers = Array.from(uniqueOffers.values());
      console.log("Processed offers after deduplication:", offers.length);
      console.log("Sample processed offer:", offers[0] || "No offers");
    } else if (isLandlord && offersData.result.rentalPosts) {
      // Landlord için rentalPosts yapısından teklifleri çıkar
      console.log("Extracting offers from rentalPosts...");
      const allOffers = [];

      offersData.result.rentalPosts.forEach((post, postIndex) => {
        console.log(
          `Post ${postIndex}: ${post.ilanBasligi}, has ${
            post.offers?.length || 0
          } offers`
        );

        if (post.offers && Array.isArray(post.offers)) {
          // EKLEME: Her post için sadece en son aktif teklifi al
          const activeOffers = post.offers.filter(
            (offer) => offer.isActive === true
          );

          if (activeOffers.length > 0) {
            // En son tarihteki teklifi bul
            const latestOffer = activeOffers.reduce((latest, current) => {
              return new Date(current.offerTime) > new Date(latest.offerTime)
                ? current
                : latest;
            });

            const offerWithPost = {
              ...latestOffer,
              post: {
                postId: post.postId,
                ilanBasligi: post.ilanBasligi,
                kiraFiyati: post.kiraFiyati,
                ilce: post.ilce,
                mahalle: post.mahalle,
                postImages: post.postImages,
                il: post.il,
                paraBirimi: post.paraBirimi,
              },
            };
            allOffers.push(offerWithPost);
            console.log(
              `  - Latest Active Offer: ID ${latestOffer.offerId}, Amount: ${latestOffer.offerAmount}, Status: ${latestOffer.status}, Time: ${latestOffer.offerTime}`
            );

            // Diğer teklifleri logla
            activeOffers.forEach((offer, offerIndex) => {
              if (offer.offerId !== latestOffer.offerId) {
                console.log(
                  `  - Skipped Older Offer ${offerIndex}: ID ${offer.offerId}, Time: ${offer.offerTime}`
                );
              }
            });
          }
        }
      });

      offers = allOffers;
      console.log("Total latest active offers extracted:", offers.length);
    }
  }

  console.log("Final offers array:", offers);

  // Filter offers based on selected tab
  const filteredOffers = offers.filter((offer) => {
    switch (selectedTab) {
      case "pending":
        return offer.status === 0;
      case "accepted":
        return offer.status === 1;
      case "rejected":
        return offer.status === 2;
      default:
        return true;
    }
  });

  console.log(
    "Filtered offers for tab",
    selectedTab,
    ":",
    filteredOffers.length
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // 3. YENI FONKSİYON: Kiraya verme işlemi
  const handleRentOffer = async (offerId, postTitle) => {
    Alert.alert(
      "Kiraya Ver",
      `Bu evi "${postTitle}" ilanı için kiraya vermek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kiraya Ver",
          style: "default",
          onPress: async () => {
            try {
              console.log("Renting property:", {
                userId: currentUser?.id,
                offerId: offerId,
                actionType: 2, // Rent action
              });

              const response = await rentOffer({
                userId: currentUser?.id,
                offerId: Number(offerId),
              }).unwrap();

              console.log("Rent response:", response);

              if (response.isSuccess) {
                Alert.alert(
                  "Başarılı",
                  "Ev başarıyla kiraya verildi! İlan artık aktif değil.",
                  [
                    {
                      text: "Tamam",
                      onPress: async () => {
                        await refetch();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Hata",
                  response.message || "Ev kiraya verilemedi."
                );
              }
            } catch (error) {
              console.log("Rent offer error:", error);
              Alert.alert(
                "Hata",
                error?.data?.message || "Ev kiraya verilirken bir hata oluştu."
              );
            }
          },
        },
      ]
    );
  };

  // DÜZELTME: Teklif kabul etme fonksiyonu
  const handleAcceptOffer = async (offerId) => {
    Alert.alert(
      "Teklifi Kabul Et",
      "Bu teklifi kabul etmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kabul Et",
          onPress: async () => {
            try {
              console.log("Accepting offer:", {
                userId: currentUser?.id,
                offerId: offerId,
                actionType: 0, // 1 = Accept (sizin verdiğiniz bilgiye göre)
              });

              const response = await landlordOfferAction({
                userId: currentUser?.id,
                offerId: Number(offerId),
                actionType: 0, // Accept action
              }).unwrap();

              console.log("Accept response:", response);

              if (response.isSuccess) {
                Alert.alert("Başarılı", "Teklif kabul edildi.");
                await refetch();
              } else {
                Alert.alert(
                  "Hata",
                  response.message || "Teklif kabul edilemedi."
                );
              }
            } catch (error) {
              console.log("Accept offer error:", error);
              Alert.alert(
                "Hata",
                error?.data?.message ||
                  "Teklif kabul edilirken bir hata oluştu."
              );
            }
          },
        },
      ]
    );
  };

  // DÜZELTME: Teklif reddetme fonksiyonu
  const handleRejectOffer = async (offerId) => {
    Alert.alert(
      "Teklifi Reddet",
      "Bu teklifi reddetmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Reddet",
          onPress: async () => {
            try {
              console.log("Rejecting offer:", {
                userId: currentUser?.id,
                offerId: offerId,
                actionType: 1, // 0 = Reject (sizin verdiğiniz bilgiye göre)
              });

              const response = await landlordOfferAction({
                userId: currentUser?.id,
                offerId: Number(offerId),
                actionType: 1, // Reject action
              }).unwrap();

              console.log("Reject response:", response);

              if (response.isSuccess) {
                Alert.alert("Başarılı", "Teklif reddedildi.");
                await refetch();
              } else {
                Alert.alert(
                  "Hata",
                  response.message || "Teklif reddedilemedi."
                );
              }
            } catch (error) {
              console.log("Reject offer error:", error);
              Alert.alert(
                "Hata",
                error?.data?.message || "Teklif reddedilirken bir hata oluştu."
              );
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return { text: "Beklemede", color: "#fff" };
      case 1:
        return { text: "Kabul Edildi", color: "#fff" };
      case 2:
        return { text: "Reddedildi", color: "#fff" };
      default:
        return { text: "Bilinmiyor", color: "#fff" };
    }
  };

  const getCurrencySymbol = (currencyType) => {
    // Backend'den gelen CurrencyType enum değerlerine göre mapping
    const mapping = {
      1: "₺",  // TRY
      2: "$",  // USD  
      3: "€",  // EUR
      4: "£",  // GBP
    };
    return mapping[currencyType] || "₺";
  };
  const renderOfferItem = (item, index) => {
    console.log("Rendering offer item:", {
      offerId: item.offerId,
      status: item.status,
      offerAmount: item.offerAmount,
      postTitle: item.post?.ilanBasligi || "No title",
    });


    const statusInfo = getStatusText(item.status);
    const post = item.post || {};

    // Rating score hesaplama - eğer ratingCount varsa, örnek bir rating skoru oluştur
    const ratingScore = item.offeringUser?.ratingCount
      ? Math.min(5, Math.max(1, item.offeringUser.ratingCount / 10)) // 1-5 arası bir değer
      : 0;

    console.log("itemitem", item);

    return (
      <TouchableOpacity
        key={item.offerId?.toString() || index.toString()}
        className="px-4 mb-4"
        onPress={() =>
          navigation.navigate("PostDetail", {
            postId: item.postId || post.postId,
          })
        }
        activeOpacity={1}
      >
        <View className="bg-white">
          {/* Main Content Container */}
          <View className="relative">
            {/* Post Image */}
            <View className="relative">
              {post.postImages && post.postImages.length > 0 ? (
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: post.postImages[0].postImageUrl }}
                    style={{
                      width: "100%",
                      height: 280,
                      borderRadius: 24,
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    onError={(e) =>
                      console.log("Image load error:", e.nativeEvent.error)
                    }
                  />

                  {/* Full Image Blur Overlay */}
                  {Platform.OS === "ios" ? (
                    <BlurView
                      intensity={30}
                      tint="dark"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 24,
                        overflow: "hidden",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        borderRadius: 24,
                      }}
                    />
                  )}
                </View>
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 200,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                  }}
                  className="bg-gray-100 justify-center items-center"
                >
                  <Icon name="image" size={40} color="#9CA3AF" />
                  <Text className="text-gray-400 text-sm mt-2">Resim yok</Text>
                </View>
              )}

              {Platform.OS === "ios" ? (
                <BlurView
                  intensity={50}
                  tint="dark"
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    borderRadius: 16,
                    overflow: "hidden",
                    zIndex: 2,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: statusInfo.color,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {statusInfo.text}
                    </Text>
                  </View>
                </BlurView>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    backgroundColor: statusInfo.color + "20",
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    zIndex: 2,
                  }}
                >
                  <Text
                    style={{
                      color: statusInfo.color,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {statusInfo.text}
                  </Text>
                </View>
              )}

              {Platform.OS === "ios" ? (
                <BlurView
                  intensity={0}
                  tint="dark"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: -100 }, { translateY: -50 }],
                    borderRadius: 16,
                    overflow: "hidden",
                    zIndex: 2,
                    width: 200, // yazı uzunluğuna göre ayarlanabilir
                    height: 100, // padding yerine sabit yükseklik daha iyi kontrol sağlar
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 45,
                      fontWeight: "400",
                    }}
                  >
                    {getCurrencySymbol(post.paraBirimi)}
                    {item.offerAmount?.toLocaleString() || "0"}
                  </Text>
                  <Text
                    className="text-gray-300"
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    {userRole === "KIRACI"
                      ? "Gönderilen teklif"
                      : "Gelen teklif"}
                  </Text>
                  {/* YENI: Kabul edilen teklifler için Kiraya Ver butonu */}
                  {item.status === 1 && (
                    <TouchableOpacity
                      className="rounded-full mt-3 justify-center items-center"
                      onPress={() =>
                        handleRentOffer(item.offerId, post.ilanBasligi)
                      }
                      activeOpacity={0.8}
                    >
                      <BlurView
                        tint="dark"
                        className="py-2 px-4 rounded-full overflow-hidden"
                      >
                        {" "}
                        <Text
                          className="text-white text-center font-medium"
                          style={{ fontSize: 16 }}
                        >
                          Kiraya Ver
                        </Text>
                      </BlurView>
                    </TouchableOpacity>
                  )}
                </BlurView>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: -75 }, { translateY: -25 }],
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    borderRadius: 16,
                    zIndex: 2,
                    width: 150,
                    height: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {getCurrencySymbol(post.paraBirimi)}
                    {item.offerAmount?.toLocaleString() || "0"}
                  </Text>
                </View>
              )}

              {/* Date Badge */}
              {Platform.OS === "ios" ? (
                <BlurView
                  intensity={50}
                  tint="dark"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    borderRadius: 16,
                    overflow: "hidden",
                    zIndex: 2,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, fontWeight: 500 }}
                      className="text-white"
                    >
                      {item.offerTime
                        ? new Date(item.offerTime).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : ""}
                    </Text>
                  </View>
                </BlurView>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    zIndex: 2,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {getCurrencySymbol(post.paraBirimi)}
                    {item.offerAmount?.toLocaleString() || "0"}
                  </Text>
                </View>
              )}
              <View
                style={{ bottom: 10, left: 10 }}
                className="items-center flex flex-row gap-1 mt-1 absolute"
              >
                {" "}
                <TouchableOpacity
                  style={{ borderWidth: 1.5 }}
                  className="w-10 h-10 rounded-full justify-center items-center mr-2 border border-white"
                  onPress={() => {
                    const targetUserId =
                      userRole === "KIRACI"
                        ? post?.userId
                        : item?.offeringUser?.userId;
                    const targetUserRole =
                      userRole === "KIRACI" ? "EVSAHIBI" : "KIRACI";

                    if (targetUserId) {
                      navigation.navigate("UserProfile", {
                        userId: targetUserId,
                        userRole: targetUserRole,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {!!item.offeringUser?.profileImageUrl ||
                  post?.profilePictureUrl ? (
                    <Image
                      style={{ width: 40, height: 40, borderRadius: 100 }}
                      source={{
                        uri:
                          userRole === "KIRACI"
                            ? post?.profilePictureUrl
                            : item?.offeringUser?.profileImageUrl,
                      }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <View>
                      <Text className="text-xl font-bold text-gray-900">
                        {item.offeringUser?.user?.name?.charAt(0) ||
                          post?.userName?.charAt(0) ||
                          "E"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {/* Content Section */}
                <View className="w-full">
                  {/* Title */}
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-bold text-white"
                    numberOfLines={2}
                  >
                    {post.ilanBasligi || "İlan Başlığı Yok"}
                  </Text>

                  {/* Location */}
                  <View className="flex-row items-center">
                    <Text
                      className="text-gray-300 flex-1"
                      style={{ fontSize: 12 }}
                      numberOfLines={1}
                    >
                      {post.il && post.il !== "Türkiye" ? post.il : ""}
                      {post.ilce ? `, ${post.ilce}` : ""}
                      {post.mahalle ? `, ${post.mahalle}` : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons for Landlords */}
            {isLandlord && (
              <View className="gap-3">
                {/* Bekleyen teklifler için Kabul Et/Reddet butonları */}
                {item.status === 0 && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-black rounded-2xl justify-center items-center"
                      style={{ height: 40 }}
                      onPress={() => handleAcceptOffer(item.offerId)}
                      activeOpacity={0.8}
                    >
                      <Text
                        className="text-white text-center font-semibold"
                        style={{ fontSize: 16, lineHeight: 20 }}
                      >
                        Kabul Et
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-white border-gray-900 border rounded-2xl justify-center items-center"
                      style={{ height: 40 }}
                      onPress={() => handleRejectOffer(item.offerId)}
                      activeOpacity={0.8}
                    >
                      <Text
                        className="text-gray-900 text-center"
                        style={{ fontSize: 16, lineHeight: 20 }}
                      >
                        Reddet
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => {
    const tabs = [
      {
        key: "pending",
        label: "Beklemede",
        count: offers.filter((o) => o.status === 0).length,
      },
      {
        key: "accepted",
        label: "Kabul Edildi",
        count: offers.filter((o) => o.status === 1).length,
      },
      {
        key: "rejected",
        label: "Reddedildi",
        count: offers.filter((o) => o.status === 2).length,
      },
    ];

    return (
      <View className="flex-row bg-white gap-2 px-8">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1  rounded-full py-3 ${
              selectedTab === tab.key ? "bg-black " : ""
            }`}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text
              style={{ fontSize: 12 }}
              className={`text-center ${
                selectedTab === tab.key ? "text-white" : "text-gray-900"
              }`}
            >
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View
      style={{
        height: Dimensions.get("window").height / 2,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 20,
      }}
      className="bg-white" // varsa zemin rengi vs.
    >
      <FontAwesomeIcon icon={faEnvelope} size={60} />
      <Text className="text-gray-500 text-lg font-semibold mt-2 text-center">
        {selectedTab === "pending" && "Bekleyen teklif bulunmuyor"}
        {selectedTab === "accepted" && "Kabul edilen teklif bulunmuyor"}
        {selectedTab === "rejected" && "Reddedilen teklif bulunmuyor"}
      </Text>
      <Text className="text-gray-400 text-sm mt-1 text-center px-8">
        {isTenant
          ? "Henüz hiç teklif göndermediniz. İlanları inceleyin ve teklif verin."
          : "Henüz size hiç teklif gelmedi. İlanlarınızı kontrol edin."}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-gray-500">Teklifler yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    console.log("API Error:", error);
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <FontAwesomeIcon size={50} icon={faExclamationCircle} />
          <Text className="text-xl font-semibold text-gray-900 mt-2 mb-2 text-center">
            Bir hata oluştu
          </Text>
          <Text className="text-base text-gray-500 text-center mb-4">
            Teklifler yüklenirken bir problem oluştu. Lütfen daha sonra tekrar
            deneyin.
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
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Animated Blurred Header - Sadece başlık */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: insets.top + 70, // Sadece başlık kısmı
        }}
      >
        <BlurView
          intensity={50}
          tint="extralight"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Sadece başlık - blur içinde */}
        <View style={{ paddingTop: insets.top, flex: 1 }}>
          <View className="flex flex-row items-center px-5 mt-1">
            <View className="px-4 items-center" style={{ width: "100%" }}>
              <View className="gap-2 px-4 flex-row items-center justify-center">
                <View className="py-4">
                  <Text className="text-lg font-bold text-gray-800 text-center">
                    {isTenant ? "Gönderdiğim Teklifler" : "Gelen Teklifler"}
                  </Text>
                  <Text className="text-sm text-gray-500 text-center">
                    {offers.length} teklif
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ width: "8%" }}></View>
          </View>
        </View>
      </Animated.View>

      {/* Mevcut animasyonlu tablar - header dışında */}
      <View
        style={{ marginTop: insets.top + 70 }}
        className="bg-white border-b border-gray-200"
      >
        <Animated.View
          style={{
            height: tabsContainerHeight,
            overflow: "hidden",
          }}
        >
          <Animated.View
            className="flex justify-center items-center"
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              height: 50,
              opacity: tabsOpacity,
              transform: [{ translateY: tabsTranslateY }],
            }}
          >
            <View
              className="flex-row bg-white gap-2 px-8"
              style={{ width: "100%" }}
            >
              {[
                {
                  key: "pending",
                  label: "Beklemede",
                  count: offers.filter((o) => o.status === 0).length,
                },
                {
                  key: "accepted",
                  label: "Kabul Edildi",
                  count: offers.filter((o) => o.status === 1).length,
                },
                {
                  key: "rejected",
                  label: "Reddedildi",
                  count: offers.filter((o) => o.status === 2).length,
                },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  className={`flex-1 rounded-full py-3 ${
                    selectedTab === tab.key ? "bg-black" : ""
                  }`}
                  onPress={() => setSelectedTab(tab.key)}
                >
                  <Text
                    style={{ fontSize: 12 }}
                    className={`text-center ${
                      selectedTab === tab.key ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ScrollView - padding yok, tablar zaten kaybolacak */}
      <Animated.ScrollView
        className="flex-1 py-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 85 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Offers List */}
        {filteredOffers.length === 0 ? (
          renderEmptyState()
        ) : (
          <View>
            {filteredOffers.map((item, index) => renderOfferItem(item, index))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

export default OffersScreen;
