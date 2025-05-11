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
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useGetPostQuery,
  useCreateOfferMutation,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
} from "../redux/api/apiSlice";
import { setCurrentPost } from "../redux/slices/postSlice";
import { selectFavoriteProperties } from "../redux/slices/profileSlice";
import { MaterialIcons } from "@expo/vector-icons";

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

  const flatListRef = useRef(null);

  // Get post details
  const { data, isLoading, refetch } = useGetPostQuery(postId);

  // Mutations
  const [createOffer, { isLoading: isCreatingOffer }] =
    useCreateOfferMutation();
  const [addFavorite, { isLoading: isAddingFavorite }] =
    useAddFavoritePropertyMutation();
  const [removeFavorite, { isLoading: isRemovingFavorite }] =
    useRemoveFavoritePropertyMutation();

  useEffect(() => {
    if (data && data.isSuccess && data.result) {
      dispatch(setCurrentPost(data.result));
    }
  }, [data, dispatch]);

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
        tenantId: currentUser.id,
        offerAmount: amount,
        message: offerMessage.trim() || null,
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

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        // Remove from favorites
        await removeFavorite({
          userId: currentUser.id,
          postId,
        }).unwrap();
        setIsFavorite(false);
      } else {
        // Add to favorites
        await addFavorite({
          userId: currentUser.id,
          postId,
        }).unwrap();
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
      Alert.alert(
        "Hata",
        "Favorilere ekleme/çıkarma işlemi sırasında bir hata oluştu."
      );
    }
  };

  // Function to navigate to specific image
  const goToImage = (index) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  // Handle scroll end on image slider
  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

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
  if (!data?.result) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-700">İlan bulunamadı</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-semibold">Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const post = data.result;
  const images = post.postImages || [];

  // Render image item for slider
  const renderImageItem = ({ item }) => (
    <View style={{ width, height: 300 }}>
      <Image
        source={{ uri: item.postImageUrl }}
        style={{ width, height: 300 }}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Image Gallery Slider */}
        <View className="w-full h-80 bg-gray-200">
          {images.length > 0 ? (
            <View>
              <FlatList
                ref={flatListRef}
                data={images}
                renderItem={renderImageItem}
                keyExtractor={(item, index) =>
                  `image-${index}-${item.postImageId || item.id}`
                }
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <TouchableOpacity
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 rounded-full p-2"
                    onPress={() => {
                      const prevIndex = Math.max(0, currentImageIndex - 1);
                      goToImage(prevIndex);
                    }}
                    disabled={currentImageIndex === 0}
                  >
                    <MaterialIcons
                      name="chevron-left"
                      size={28}
                      color="white"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 rounded-full p-2"
                    onPress={() => {
                      const nextIndex = Math.min(
                        images.length - 1,
                        currentImageIndex + 1
                      );
                      goToImage(nextIndex);
                    }}
                    disabled={currentImageIndex === images.length - 1}
                  >
                    <MaterialIcons
                      name="chevron-right"
                      size={28}
                      color="white"
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* Pagination dots */}
              {images.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                  {images.map((_, index) => (
                    <TouchableOpacity
                      key={`dot-${index}`}
                      className={`mx-1 h-2 w-2 rounded-full ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white bg-opacity-50"
                      }`}
                      onPress={() => goToImage(index)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="w-full h-full justify-center items-center">
              <Text className="text-gray-500">Resim bulunamadı</Text>
            </View>
          )}
        </View>

        {/* Post Details */}
        <View className="p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-2xl font-bold text-gray-800">
              {post.ilanBasligi}
            </Text>
            <Text className="text-xl font-bold text-blue-600">
              {post.kiraFiyati} {post.paraBirimi || "₺"}
            </Text>
          </View>

          <Text className="text-gray-500 mb-4">
            {post.il}, {post.ilce}, {post.mahalle}
          </Text>

          {/* Property Features */}
          <View className="flex-row justify-between bg-gray-50 p-3 rounded-lg mb-5">
            <View className="items-center">
              <Text className="text-sm text-gray-500">Oda Sayısı</Text>
              <Text className="text-base font-bold text-gray-800">
                {post.odaSayisi || "N/A"}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">Banyo</Text>
              <Text className="text-base font-bold text-gray-800">
                {post.banyoSayisi || "N/A"}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">Metrekare</Text>
              <Text className="text-base font-bold text-gray-800">
                {post.brutMetreKare ? `${post.brutMetreKare} m²` : "N/A"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Açıklama
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              {post.postDescription || "Bu ilan için açıklama bulunmamaktadır."}
            </Text>
          </View>

          {/* Property Details */}
          <View className="mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Detaylar
            </Text>

            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">İlan Durumu</Text>
                <Text className="font-semibold text-gray-800">
                  {post.status === 0
                    ? "Aktif"
                    : post.status === 1
                    ? "Kiralandı"
                    : "Kapalı"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">İlan Tipi</Text>
                <Text className="font-semibold text-gray-800">
                  {post.propertyType || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Isınma</Text>
                <Text className="font-semibold text-gray-800">
                  {post.isitmaTipi || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Depozito</Text>
                <Text className="font-semibold text-gray-800">
                  {post.depozito
                    ? `${post.depozito} ${post.paraBirimi || "₺"}`
                    : "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Kimden</Text>
                <Text className="font-semibold text-gray-800">
                  {post.kimden || "Sahibinden"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Site Adı</Text>
                <Text className="font-semibold text-gray-800">
                  {post.siteAdi || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Net Metrekare</Text>
                <Text className="font-semibold text-gray-800">
                  {post.netMetreKare
                    ? `${post.netMetreKare} m²`
                    : "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Kullanım Durumu</Text>
                <Text className="font-semibold text-gray-800">
                  {post.kullanimDurumu || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Mutfak</Text>
                <Text className="font-semibold text-gray-800">
                  {post.mutfak || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Bina Yaşı</Text>
                <Text className="font-semibold text-gray-800">
                  {post.binaYasi || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Toplam Kat</Text>
                <Text className="font-semibold text-gray-800">
                  {post.toplamKat || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Aidat</Text>
                <Text className="font-semibold text-gray-800">
                  {post.aidat ? `${post.aidat} ₺` : "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Min. Kiralama Süresi</Text>
                <Text className="font-semibold text-gray-800">
                  {post.minimumKiralamaSuresi
                    ? `${post.minimumKiralamaSuresi} Ay`
                    : "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">İlan Tarihi</Text>
                <Text className="font-semibold text-gray-800">
                  {post.createdDate
                    ? new Date(post.createdDate).toLocaleDateString("tr-TR")
                    : "Belirtilmemiş"}
                </Text>
              </View>
            </View>
          </View>

          {/* Property Features */}
          <View className="mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Özellikler
            </Text>

            <View className="flex-row flex-wrap">
              {post.balkon === true && (
                <View className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-blue-700">Balkon</Text>
                </View>
              )}
              {post.asansor === true && (
                <View className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-blue-700">Asansör</Text>
                </View>
              )}
              {post.otopark === true && (
                <View className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-blue-700">Otopark</Text>
                </View>
              )}
              {post.esyali === true && (
                <View className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-blue-700">Eşyalı</Text>
                </View>
              )}
              {post.siteIcerisinde === true && (
                <View className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-blue-700">Site İçerisinde</Text>
                </View>
              )}
              {post.takas === true && (
                <View className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-blue-700">Takas</Text>
                </View>
              )}
            </View>
          </View>

          {/* Landlord Information */}
          <View className="mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Ev Sahibi
            </Text>

            <TouchableOpacity
              className="flex-row items-center bg-gray-50 p-4 rounded-lg"
              onPress={() =>
                navigation.navigate("LandlordProfile", {
                  userId: post.landlordId,
                })
              }
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center mr-3">
                {post.user?.profileImageUrl ? (
                  <Image
                    source={{ uri: post.user.profileImageUrl }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text className="text-xl font-bold text-blue-500">
                    {post.user?.name?.charAt(0) || "E"}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  {post.user?.name} {post.user?.surname}
                </Text>
                <Text className="text-sm text-gray-500">Ev sahibi</Text>
              </View>

              <View className="bg-blue-500 px-3 py-1 rounded">
                <Text className="text-white">Profili Gör</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row justify-between items-center p-4 bg-white border-t border-gray-200">
        {userRole === "KIRACI" && (
          <>
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-red-50 justify-center items-center mr-3"
              onPress={toggleFavorite}
              disabled={isAddingFavorite || isRemovingFavorite}
            >
              <Text
                className={`text-2xl ${
                  isFavorite ? "text-red-500" : "text-gray-400"
                }`}
              >
                ♥
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3 rounded-lg"
              onPress={() => setIsOfferModalVisible(true)}
              disabled={post.status !== 0} // Only allow offers for active listings
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
              className="flex-1 bg-blue-50 py-3 rounded-lg mr-2"
              onPress={() =>
                navigation.navigate("EditPost", { postId: post.id })
              }
            >
              <Text className="text-blue-700 font-semibold text-center">
                Düzenle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3 rounded-lg"
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
        <View className="flex-1 justify-end bg-black bg-opacity-50">
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
                isCreatingOffer ? "bg-blue-300" : "bg-blue-500"
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
      </Modal>
    </View>
  );
};

export default PostDetailScreen;
