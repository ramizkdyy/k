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
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faChevronRight,
  faEdit,
  faHome,
  faHeart,
  faHandshake,
  faPlus,
  faCog,
  faQuestionCircle,
  faSignOut,
} from "@fortawesome/pro-regular-svg-icons";

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

  // Navigate to edit profile screen or profile expectations based on completion status
  const handleEditProfile = () => {
    // Check if the user has completed the expectations
    if (
      currentUser?.isTenantExpectationCompleted ||
      currentUser?.isLandlordExpectationCompleted
    ) {
      navigation.navigate("EditProfile");
    } else {
      navigation.navigate("ProfileExpectation");
    }
  };

  // Render loading state
  if (isLoading && !userProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">
          Profil yükleniyor...
        </Text>
      </View>
    );
  }

  console.log("CurrentUser:", currentUser);
  console.log("userProfile:", userProfile);
  console.log("profilimage:", userProfile?.profileImageUrl);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      className="flex-1 bg-white px-5"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View
        style={{ borderRadius: 30 }}
        className="items-center  py-6 border-gray-200 mt-4"
      >
        <View
          style={{ boxShadow: "0px 0px 12px #00000014" }}
          className="w-24 h-24 rounded-full bg-white justify-center items-center mb-2 border-white"
        >
          {userProfile?.profileImageUrl !== "default_profile_image_url" ? (
            <Image
              style={{ borderRadius: 100, boxShadow: "0px 0px 12px #00000014" }}
              source={{ uri: userProfile.profileImageUrl }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View
              style={{ borderRadius: 100, boxShadow: "0px 0px 12px #00000014" }}
              className="w-full h-full rounded-full bg-gray-100 justify-center items-center"
            >
              <Text
                style={{ fontSize: 40 }}
                className="text-gray-900 font-bold"
              >
                {currentUser?.name?.charAt(0) || "P"}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 20 }} className="font-bold text-gray-900 mb-1">
          {userProfile?.user?.name || currentUser?.name || ""}{" "}
          {userProfile?.user?.surname || currentUser?.surname || ""}
        </Text>
        <Text style={{ fontSize: 12 }} className="text-gray-500">
          {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"}
        </Text>
      </View>

      {/* Profile Content */}
      <View className="">
        <Text className="mt-6 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
          Hesap
        </Text>
        {/* User Profile Card */}
        <View className="bg-white rounded-xl">
          <TouchableOpacity
            className="py-4 rounded-lg flex flex-row justify-between items-center"
            onPress={() => {
              navigation.navigate("Settings");
            }}
          >
            <View className="flex-row items-center gap-4">
              <FontAwesomeIcon icon={faCog} size={25} color="black" />
              <Text
                style={{ fontSize: 16 }}
                className="text-gray-900 font-medium"
              >
                Ayarlar
              </Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={15} color="#cfcfcf" />
          </TouchableOpacity>
          {/* Profile Expectations Button */}
          {currentUser?.isTenantExpectationCompleted &&
            currentUser?.isLandlordExpectationCompleted && (
              <TouchableOpacity
                className="py-4 rounded-lg flex flex-row justify-between items-center"
                onPress={() => {
                  navigation.navigate("ProfileExpectation");
                }}
              >
                <View className="flex-row items-center gap-4">
                  <FontAwesomeIcon icon={faEdit} size={25} color="black" />
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-medium"
                  >
                    Beklenti Profili Düzenle
                  </Text>
                </View>
                <View className="flex flex-row gap-1 items-center">
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    size={15}
                    color="#cfcfcf"
                  />
                </View>
              </TouchableOpacity>
            )}
          {/* Fix the condition check - use proper property names */}
          {currentUser?.isTenantExpectationCompleted ||
          currentUser?.isLandlordExpectationCompleted ? (
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={handleEditProfile}
            >
              <View className="flex-row items-center gap-4">
                <FontAwesomeIcon icon={faEdit} size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-semibold"
                >
                  Profili düzenle
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={20} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              className="py-3 rounded-lg flex flex-row justify-between"
              onPress={handleEditProfile}
            >
              <View className="flex flex-row gap-4 items-center">
                <FontAwesomeIcon icon={faEdit} size={25} color="black" />
                <View className="flex flex-col gap-1">
                  {" "}
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-medium"
                  >
                    Profili Tamamla
                  </Text>
                  <Text
                    style={{ fontSize: 12 }}
                    className="text-gray-500 font-medium"
                  >
                    Lütfen devam etmeden önce beklenti profilini oluştur.
                  </Text>
                </View>
              </View>

              <View className="flex flex-row gap-1 items-center">
                {currentUser?.isTenantExpectationCompleted ||
                currentUser?.isLandlordExpectationCompleted ? null : (
                  <View className="bg-red-500 w-3 h-3 rounded-full"></View>
                )}
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={15}
                  color="#cfcfcf"
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-xl">
          <Text className="mt-6 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
            İlanlar
          </Text>
          <TouchableOpacity
            className="py-4 rounded-lg flex flex-row justify-between items-center"
            onPress={() => {
              navigation.navigate(
                userRole === "EVSAHIBI" ? "MyProperties" : "FindProperties"
              );
            }}
          >
            <View className="flex-row items-center gap-4">
              <FontAwesomeIcon icon={faHome} size={25} color="black" />
              <Text
                style={{ fontSize: 16 }}
                className="text-gray-900 font-medium"
              >
                {userRole === "EVSAHIBI" ? "Mülklerim" : "İlan Ara"}
              </Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={15} color="#cfcfcf" />
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-lg flex flex-row justify-between items-center"
            onPress={() => {
              navigation.navigate(
                userRole === "EVSAHIBI" ? "ReceivedOffers" : "MySentOffers"
              );
            }}
          >
            <View className="flex-row items-center gap-4">
              <FontAwesomeIcon icon={faHandshake} size={25} color="black" />
              <Text
                style={{ fontSize: 16 }}
                className="text-gray-900 font-medium"
              >
                {userRole === "EVSAHIBI" ? "Teklifler" : "Tekliflerim"}
              </Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={15} color="#cfcfcf" />
          </TouchableOpacity>

          {userRole === "KIRACI" && (
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => {
                navigation.navigate("FavoriteProperties");
              }}
            >
              <View className="flex-row items-center gap-4">
                <FontAwesomeIcon icon={faHeart} size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  Favorilerim
                </Text>
              </View>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={15}
                color="#cfcfcf"
              />
            </TouchableOpacity>
          )}

          {userRole === "EVSAHIBI" && (
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => {
                navigation.navigate("CreatePost");
              }}
            >
              <View className="flex-row items-center gap-4">
                <FontAwesomeIcon icon={faPlus} size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  Yeni İlan Oluştur
                </Text>
              </View>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={15}
                color="#cfcfcf"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings and Logout */}
        <View className="bg-white rounded-xl">
          <Text className="mt-4 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
            Daha fazla
          </Text>
          <TouchableOpacity
            className="py-4 rounded-lg flex flex-row justify-between items-center"
            onPress={() => {
              navigation.navigate("HelpSupport");
            }}
          >
            <View className="flex-row items-center gap-4">
              <FontAwesomeIcon
                icon={faQuestionCircle}
                size={25}
                color="black"
              />
              <Text
                style={{ fontSize: 16 }}
                className="text-gray-900 font-medium"
              >
                Yardım & Destek
              </Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={15} color="#cfcfcf" />
          </TouchableOpacity>

          <TouchableOpacity
            className="py-6  mt-2 flex flex-row justify-between items-center border-t border-gray-200"
            onPress={handleLogout}
          >
            <View className="flex-row items-center gap-4">
              <FontAwesomeIcon icon={faSignOut} size={25} color="#ef4444" />
              <Text
                style={{ fontSize: 16 }}
                className="text-red-600 font-medium"
              >
                Çıkış Yap
              </Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={15} color="#cfcfcf" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
