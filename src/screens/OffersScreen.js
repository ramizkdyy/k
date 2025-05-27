import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useGetSentOffersQuery,
  useGetReceivedOffersQuery,
  useLandlordOfferActionMutation,
} from "../redux/api/apiSlice";
import Icon from "react-native-vector-icons/MaterialIcons";

const OffersScreen = () => {
  const navigation = useNavigation();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("pending");

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
      offers = offersData.result.map((item) => {
        // rentalOfferDto ve postDto yapısını kontrol et
        if (item.rentalOfferDto && item.postDto) {
          return {
            // Teklif bilgilerini al
            ...item.rentalOfferDto,
            // Post bilgilerini ekle
            post: {
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
      });

      console.log("Processed offers:", offers.length);
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
          post.offers.forEach((offer, offerIndex) => {
            const offerWithPost = {
              ...offer,
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
              `  - Offer ${offerIndex}: ID ${offer.offerId}, Amount: ${offer.offerAmount}, Status: ${offer.status}`
            );
          });
        }
      });

      offers = allOffers;
      console.log("Total offers extracted:", offers.length);
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
        return { text: "Beklemede", color: "#FFA500" };
      case 1:
        return { text: "Kabul Edildi", color: "#4CAF50" };
      case 2:
        return { text: "Reddedildi", color: "#F44336" };
      default:
        return { text: "Bilinmiyor", color: "#666" };
    }
  };

  const renderOfferItem = ({ item }) => {
    console.log("Rendering offer item:", {
      offerId: item.offerId,
      status: item.status,
      offerAmount: item.offerAmount,
      postTitle: item.post?.ilanBasligi || "No title",
    });

    const statusInfo = getStatusText(item.status);
    const post = item.post || {};

    return (
      <TouchableOpacity
        className="bg-white mx-4 my-2 rounded-lg shadow-md overflow-hidden"
        onPress={() =>
          navigation.navigate("PostDetail", {
            postId: item.postId || post.postId,
          })
        }
      >
        <View className="flex-row">
          {/* Post Image */}
          <View className="w-24 h-24 bg-gray-200">
            {post.postImages && post.postImages.length > 0 ? (
              <Image
                source={{ uri: post.postImages[0].postImageUrl }}
                className="w-full h-full"
                resizeMode="cover"
                onError={(e) =>
                  console.log("Image load error:", e.nativeEvent.error)
                }
              />
            ) : (
              <View className="w-full h-full justify-center items-center">
                <Icon name="image" size={30} color="#999" />
              </View>
            )}
          </View>

          {/* Offer Details */}
          <View className="flex-1 p-3">
            <Text className="font-bold text-base mb-1" numberOfLines={1}>
              {post.ilanBasligi || "İlan Başlığı Yok"}
            </Text>

            <View className="flex-row items-center mb-1">
              <Icon name="location-on" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                {post.il && post.il !== "Türkiye" ? post.il : ""}
                {post.ilce ? `, ${post.ilce}` : ""}
                {post.mahalle ? `, ${post.mahalle}` : ""}
              </Text>
            </View>

            <View className="flex-row items-center mb-2">
              <Text className="font-bold text-lg text-blue-600">
                {post.paraBirimi === "USD"
                  ? "$"
                  : post.paraBirimi === "EUR"
                  ? "€"
                  : "₺"}
                {item.offerAmount?.toLocaleString() || "0"}
              </Text>
              {post.kiraFiyati && (
                <Text className="text-sm text-gray-500 ml-2">
                  (İlan:{" "}
                  {post.paraBirimi === "USD"
                    ? "$"
                    : post.paraBirimi === "EUR"
                    ? "€"
                    : "₺"}
                  {post.kiraFiyati.toLocaleString()})
                </Text>
              )}
            </View>

            <View className="flex-row items-center justify-between">
              <View
                className={`px-2 py-1 rounded-full`}
                style={{ backgroundColor: statusInfo.color + "20" }}
              >
                <Text
                  style={{ color: statusInfo.color }}
                  className="text-xs font-semibold"
                >
                  {statusInfo.text}
                </Text>
              </View>

              <Text className="text-xs text-gray-500">
                {item.offerTime
                  ? new Date(item.offerTime).toLocaleDateString("tr-TR")
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Offer Description */}
        {item.offerDescription && (
          <View className="px-3 pb-3 pt-2 border-t border-gray-100">
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {item.offerDescription}
            </Text>
          </View>
        )}

        {/* Action Buttons for Landlords */}
        {isLandlord && item.status === 0 && (
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              className="flex-1 py-3 bg-green-50"
              onPress={() => handleAcceptOffer(item.offerId)}
            >
              <Text className="text-green-600 text-center font-semibold">
                Kabul Et
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 bg-red-50"
              onPress={() => handleRejectOffer(item.offerId)}
            >
              <Text className="text-red-600 text-center font-semibold">
                Reddet
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Info for Landlords */}
        {isLandlord && item.offeringUser && (
          <View className="px-3 pb-3 pt-2 border-t border-gray-100">
            <Text className="text-xs text-gray-500">
              Teklif Veren: {item.offeringUser.name} {item.offeringUser.surname}
            </Text>
          </View>
        )}
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
      <View className="flex-row bg-white shadow-sm">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-3 relative ${
              selectedTab === tab.key ? "border-b-2 border-blue-500" : ""
            }`}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text
              className={`text-center font-semibold ${
                selectedTab === tab.key ? "text-blue-500" : "text-gray-600"
              }`}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View className="absolute -top-1 right-4 bg-blue-500 rounded-full px-2 py-0.5 min-w-[20px]">
                <Text className="text-white text-xs text-center">
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-20">
      {" "}
      <Icon name="inbox" size={80} color="#ddd" />{" "}
      <Text className="text-gray-500 text-lg mt-4 text-center">
        {" "}
        {selectedTab === "pending" && "Bekleyen teklif bulunmuyor"}{" "}
        {selectedTab === "accepted" && "Kabul edilen teklif bulunmuyor"}{" "}
        {selectedTab === "rejected" && "Reddedilen teklif bulunmuyor"}{" "}
      </Text>{" "}
      <Text className="text-gray-400 text-sm mt-2 text-center px-8">
        {" "}
        {isTenant
          ? "Henüz hiç teklif göndermediniz. İlanları inceleyin ve teklif verin."
          : "Henüz size hiç teklif gelmedi. İlanlarınızı kontrol edin."}{" "}
      </Text>{" "}
    </View>
  );
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        {" "}
        <ActivityIndicator size="large" color="#4A90E2" />{" "}
        <Text className="mt-3 text-gray-500">Teklifler yükleniyor...</Text>{" "}
      </View>
    );
  }
  if (error) {
    console.log("API Error:", error);
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        {" "}
        <Icon name="error-outline" size={60} color="#F44336" />{" "}
        <Text className="text-gray-700 text-lg font-semibold mt-4">
          {" "}
          Bir hata oluştu{" "}
        </Text>{" "}
        <Text className="text-gray-500 text-center mt-2">
          {" "}
          Teklifler yüklenirken bir problem oluştu. Lütfen daha sonra tekrar
          deneyin.{" "}
        </Text>{" "}
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
          onPress={handleRefresh}
        >
          {" "}
          <Text className="text-white font-semibold">Tekrar Dene</Text>{" "}
        </TouchableOpacity>{" "}
      </View>
    );
  }
  return (
    <View className="flex-1 bg-gray-50">
      {" "}
      {/* Header */}{" "}
      <View className="bg-white shadow-sm px-4 py-3">
        {" "}
        <Text className="text-xl font-bold text-gray-800">
          {" "}
          {isTenant ? "Gönderdiğim Teklifler" : "Gelen Teklifler"}{" "}
        </Text>{" "}
        <Text className="text-sm text-gray-500 mt-1">
          {" "}
          Toplam {offers.length} teklif{" "}
        </Text>{" "}
      </View>{" "}
      {/* Tabs */} {renderTabs()} {/* Offers List */}{" "}
      <FlatList
        data={filteredOffers}
        renderItem={renderOfferItem}
        keyExtractor={(item) =>
          item.offerId?.toString() || Math.random().toString()
        }
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState()}
      />{" "}
    </View>
  );
};
export default OffersScreen;
