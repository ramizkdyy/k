import React, { useState, useEffect } from "react";
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

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Image Gallery */}
        <View className="w-full h-64 bg-gray-200">
          {post.images && post.images.length > 0 ? (
            <Image
              source={{ uri: post.images[0].imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full justify-center items-center">
              <Text className="text-gray-500">Resim bulunamadı</Text>
            </View>
          )}

          {/* Image navigation controls would go here */}
        </View>

        {/* Post Details */}
        <View className="p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-2xl font-bold text-gray-800">
              {post.title}
            </Text>
            <Text className="text-xl font-bold text-blue-600">
              {post.price} ₺
            </Text>
          </View>

          <Text className="text-gray-500 mb-4">{post.location}</Text>

          {/* Property Features */}
          <View className="flex-row justify-between bg-gray-50 p-3 rounded-lg mb-5">
            <View className="items-center">
              <Text className="text-sm text-gray-500">Oda Sayısı</Text>
              <Text className="text-base font-bold text-gray-800">
                {post.bedroom || "N/A"}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">Banyo</Text>
              <Text className="text-base font-bold text-gray-800">
                {post.bathroom || "N/A"}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">Metrekare</Text>
              <Text className="text-base font-bold text-gray-800">
                {post.area ? `${post.area} m²` : "N/A"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Açıklama
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              {post.description || "Bu ilan için açıklama bulunmamaktadır."}
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
                  {post.heatingType || "Belirtilmemiş"}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Depozito</Text>
                <Text className="font-semibold text-gray-800">
                  {post.depositAmount
                    ? `${post.depositAmount} ₺`
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
                {post.landlord?.profileImageUrl ? (
                  <Image
                    source={{ uri: post.landlord.profileImageUrl }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text className="text-xl font-bold text-blue-500">
                    {post.landlord?.name?.charAt(0) || "E"}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  {post.landlord?.fullName || "İsim belirtilmemiş"}
                </Text>
                <Text className="text-sm text-gray-500">
                  {post.landlord
                    ? `${post.landlord.totalProperties || 0} ilan`
                    : ""}
                </Text>
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
        {userRole === "tenant" && (
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

        {userRole === "landlord" && post.landlordId === currentUser?.id && (
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
