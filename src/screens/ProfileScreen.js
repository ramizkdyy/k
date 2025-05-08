import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  logout,
  selectCurrentUser,
  selectUserRole,
} from "../redux/slices/authSlice";
import {
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
} from "../redux/api/apiSlice";
import {
  selectUserProfile,
  setUserProfile,
} from "../redux/slices/profileSlice";

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const userProfile = useSelector(selectUserProfile);
  const [refreshing, setRefreshing] = useState(false);

  // Use the appropriate query based on user role
  const {
    data: profileData,
    isLoading,
    refetch,

  } = userRole === "EVSAHIBI"
    ? useGetLandlordProfileQuery(currentUser?.id)
    : useGetTenantProfileQuery(currentUser?.id);


  useEffect(() => {
    if (profileData && profileData.isSuccess && profileData.result) {
      dispatch(setUserProfile(profileData.result));
    }
  }, [profileData, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        onPress: () => {
          dispatch(logout());
          // Navigation is handled by AppNavigator automatically
        },
        style: "destructive",
      },
    ]);
  };

  // Navigate to edit profile screen
  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  // Render loading state
  if (isLoading && !userProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">
          Profil yükleniyor...
        </Text>
      </View>
    );
  }

  // Helper function to render field
  const renderField = (label, value, isLast = false) => (
    <View className={`mb-4 ${isLast ? "mb-0" : ""}`}>
      <Text className="text-gray-500 text-sm mb-1">{label}</Text>
      <Text className="text-gray-800 text-base">
        {value || "Belirtilmemiş"}
      </Text>
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View className="bg-blue-500 pt-12 pb-20 items-center">
        <View className="w-24 h-24 rounded-full bg-white justify-center items-center mb-3 border-4 border-white">
          {userProfile?.profileImageUrl ? (
            <Image
              source={{ uri: userProfile.profileImageUrl }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-3xl font-bold text-blue-500">
              {currentUser?.name?.charAt(0) || "K"}
            </Text>
          )}
        </View>
        <Text className="text-xl font-bold text-white mb-1">
          {userProfile?.user?.name || currentUser?.name || ""}{" "}
          {userProfile?.user?.surname || currentUser?.surname || ""}
        </Text>
        <Text className="text-white text-base opacity-80">
          {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"}
        </Text>
      </View>

      {/* Profile Content */}
      <View className="px-5 mt-[-50px]">
        {/* User Profile Card */}
        <View className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Kullanıcı Bilgileri
          </Text>

          {renderField("Kullanıcı ID", currentUser?.id)}
          {renderField("E-posta", currentUser?.email)}
          {renderField("Ad", currentUser?.name)}
          {renderField(
            "Soyad",
            userProfile?.user?.surname || currentUser?.surname || ""
          )}
          {renderField("Telefon", currentUser?.phoneNumber)}
          {renderField("Cinsiyet", currentUser?.gender)}
          {renderField("Rol", currentUser?.role)}

          <TouchableOpacity
            className="mt-5 bg-blue-50 py-3 rounded-lg"
            onPress={handleEditProfile}
          >
            <Text className="text-blue-600 font-semibold text-center">
              Profili Düzenle
            </Text>
          </TouchableOpacity>
        </View>

        {/* Landlord Profile Details */}
        {userRole === "EVSAHIBI" && userProfile && (
          <View className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Ev Sahibi Profil Detayları
            </Text>

            {renderField("Profil ID", userProfile.landlordProfileId)}
            {renderField("Konum", userProfile.rentalLocation)}
            {renderField("Profil Resmi", userProfile.profileImageUrl)}
            {renderField("Kapak Resmi", userProfile.coverProfileImageUrl)}
            {renderField(
              "Kiracı Meslek Önemli",
              userProfile.isTenantProfessionImportant ? "Evet" : "Hayır"
            )}
            {renderField(
              "Kiracı Medeni Durum Önemli",
              userProfile.isTenantMaritalStatusImportant ? "Evet" : "Hayır"
            )}
            {renderField(
              "Kiracı Sayısı Önemli",
              userProfile.isNumberOfOccupantsImportant ? "Evet" : "Hayır"
            )}
            {renderField("Kiracı Mesleği", userProfile.tenantProfession)}
            {renderField(
              "Kiracı Medeni Durumu",
              userProfile.tenantMaritalStatus
            )}
            {renderField("Kiracı Sayısı", userProfile.numberOfOccupants)}
            {renderField(
              "Kira Fiyat Beklentisi",
              userProfile.rentalPriceExpectation
            )}

            <View className="mt-4">
              <Text className="text-gray-500 text-sm mb-1">Profil Puanı</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-800 text-base mr-2">
                  {userProfile.profileRating || "0"}/5
                </Text>
                <Text className="text-gray-500 text-xs">
                  ({userProfile.ratingCount || "0"} değerlendirme)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tenant Profile Details - Add this if you have tenant-specific fields */}
        {userRole === "KIRACI" && userProfile && (
          <View className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Kiracı Profil Detayları
            </Text>

            {/* Add tenant-specific fields here */}
            {/* Similar structure to landlord profile */}
          </View>
        )}

        {/* Stats Card */}
        <View className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            İstatistikler
          </Text>

          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-2xl font-bold text-blue-500">
                {userRole === "EVSAHIBI"
                  ? userProfile?.rentalPosts?.length || "0"
                  : "0"}
              </Text>
              <Text className="text-sm text-gray-600">
                {userRole === "EVSAHIBI" ? "İlanlar" : "Favoriler"}
              </Text>
            </View>

            <View>
              <Text className="text-2xl font-bold text-green-500">
                {userRole === "EVSAHIBI"
                  ? userProfile?.rentalRequests?.length || "0"
                  : "0"}
              </Text>
              <Text className="text-sm text-gray-600">
                {userRole === "EVSAHIBI" ? "Teklifler" : "Görüntülenen"}
              </Text>
            </View>

            <View>
              <Text className="text-2xl font-bold text-purple-500">
                {userRole === "EVSAHIBI"
                  ? "0"
                  : userProfile?.rentalOffers?.length || "0"}
              </Text>
              <Text className="text-sm text-gray-600">
                {userRole === "EVSAHIBI" ? "Kiralanmış" : "Teklifler"}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100 divide-y divide-gray-100">
          <TouchableOpacity
            className="p-4 flex-row items-center"
            onPress={() => {
              navigation.navigate(
                userRole === "EVSAHIBI" ? "MyProperties" : "FindProperties"
              );
            }}
          >
            <View className="w-8 h-8 rounded-full bg-blue-100 justify-center items-center mr-3">
              <Image
                source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon
                className="w-4 h-4"
                resizeMode="contain"
              />
            </View>
            <Text className="text-gray-800 text-base">
              {userRole === "EVSAHIBI" ? "Mülklerim" : "İlan Ara"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 flex-row items-center"
            onPress={() => {
              navigation.navigate(
                userRole === "EVSAHIBI" ? "ReceivedOffers" : "MySentOffers"
              );
            }}
          >
            <View className="w-8 h-8 rounded-full bg-green-100 justify-center items-center mr-3">
              <Image

                source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon

                className="w-4 h-4"
                resizeMode="contain"
              />
            </View>
            <Text className="text-gray-800 text-base">
              {userRole === "EVSAHIBI" ? "Teklifler" : "Tekliflerim"}
            </Text>
          </TouchableOpacity>

          {userRole === "KIRACI" && (
            <TouchableOpacity
              className="p-4 flex-row items-center"
              onPress={() => {
                navigation.navigate("FavoriteProperties");
              }}
            >
              <View className="w-8 h-8 rounded-full bg-red-100 justify-center items-center mr-3">
                <Image

                  source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon

                  className="w-4 h-4"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-800 text-base">Favorilerim</Text>
            </TouchableOpacity>
          )}

          {userRole === "EVSAHIBI" && (
            <TouchableOpacity
              className="p-4 flex-row items-center"
              onPress={() => {
                navigation.navigate("CreatePost");
              }}
            >
              <View className="w-8 h-8 rounded-full bg-yellow-100 justify-center items-center mr-3">
                <Image

                  source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon

                  className="w-4 h-4"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-800 text-base">Yeni İlan Oluştur</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings and Logout */}
        <View className="bg-white rounded-xl shadow-sm mb-10 border border-gray-100 divide-y divide-gray-100">
          <TouchableOpacity
            className="p-4 flex-row items-center"
            onPress={() => {
              navigation.navigate("Settings");
            }}
          >
            <View className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center mr-3">
              <Image

                source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon

                className="w-4 h-4"
                resizeMode="contain"
              />
            </View>
            <Text className="text-gray-800 text-base">Ayarlar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 flex-row items-center"
            onPress={() => {
              navigation.navigate("HelpSupport");
            }}
          >
            <View className="w-8 h-8 rounded-full bg-purple-100 justify-center items-center mr-3">
              <Image

                source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon

                className="w-4 h-4"
                resizeMode="contain"
              />
            </View>
            <Text className="text-gray-800 text-base">Yardım & Destek</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 flex-row items-center"
            onPress={handleLogout}
          >
            <View className="w-8 h-8 rounded-full bg-red-100 justify-center items-center mr-3">
              <Image

                source={require("../../assets/logo-kirax.png")} // Replace with appropriate icon

                className="w-4 h-4"
                resizeMode="contain"
              />
            </View>
            <Text className="text-red-600 text-base">Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
