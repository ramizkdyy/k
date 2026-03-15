import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useSelector, useDispatch } from "react-redux";
import {
  logout,
  forceLogout,
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
import { chatApiHelpers } from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { authCleanupHelper } from "../utils/authCleanup";
import { useNotificationToken } from "../hooks/useNotificationToken";
import {
  ChevronRight,
  Edit,
  Home,
  Heart,
  Handshake,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  UserCog,
} from "lucide-react-native";

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const userProfile = useSelector(selectUserProfile);
  const [refreshing, setRefreshing] = useState(false);

  // SignalR context for proper cleanup
  const { stopConnection } = useSignalR();

  // Notification token hook for manual FCM cleanup
  const { manualUnregister: unregisterFcmToken } = useNotificationToken();

  // Animation setup
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animation transforms
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -70],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const headerContainerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [50, 0],
    extrapolate: "clamp",
  });

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

  // ENHANCED: Comprehensive logout with complete cleanup
  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        onPress: async () => {

          try {
            // 1. ✅ FIXED: Unregister FCM token BEFORE clearing auth token
            try {
              const unregisterResult = await unregisterFcmToken();
              if (unregisterResult.success) {
              } else if (!unregisterResult.skipLogging) {
              }
            } catch (fcmError) {
              // Continue with logout even if FCM unregistration fails
            }

            // 2. Stop SignalR connection to prevent message sending with stale token
            await stopConnection();

            // 3. Clear chat cache to remove old user's messages
            chatApiHelpers.clearChatCache(dispatch);

            // 4. Comprehensive storage cleanup
            await authCleanupHelper.clearUserStorage();

            // 5. Force logout to ensure complete state reset
            dispatch(forceLogout());

          } catch (error) {
            // Even if cleanup fails, still logout
            dispatch(forceLogout());
          }
        },
        style: "destructive",
      },
    ]);
  };

  // Check if expectations are completed
  const isExpectationCompleted =
    userRole === "KIRACI"
      ? userProfile.isLandLordExpectationCompleted // Fixed: was isTenantExpectationCompleted
      : userProfile.isTenantExpectationCompleted;

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Animated Header */}
      <View className="bg-white z-10">
        <Animated.View
          style={{
            height: headerContainerHeight,
            overflow: "hidden",
          }}
        >
          <Animated.View
            className="flex justify-center items-center px-5"
            style={{
              height: 50,
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: 600 }}
              className="text-gray-900"
            >
              Profil
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Animated ScrollView */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-white px-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={["#303030"]}
            tintColor="#303030"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
          }
        )}
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View
          style={{ borderRadius: 30 }}
          className="items-center py-6 border-gray-200 mt-4"
        >
          <View
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className="w-24 h-24 rounded-full bg-white justify-center items-center mb-2 border-white"
          >
            {userProfile?.profileImageUrl !== "default_profile_image_url" ? (
              <Image
                style={{
                  borderRadius: 100,
                  boxShadow: "0px 0px 12px #00000014",
                  width: 96,
                  height: 96,
                }}
                source={{ uri: userProfile.profileImageUrl }}
                className="w-full h-full rounded-full"
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <View
                style={{
                  borderRadius: 100,
                  boxShadow: "0px 0px 12px #00000014",
                }}
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

          <Text
            style={{ fontSize: 20 }}
            className="font-bold text-gray-900 mb-1 text-center px-4"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
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
            {/* Settings Button */}
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => {
                navigation.navigate("Settings");
              }}
            >
              <View className="flex-row items-center gap-4">
                <Settings size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  Ayarlar
                </Text>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>

            {/* Profile Edit Button - Always visible */}
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View className="flex-row items-center gap-4">
                <UserCog size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  Profili Düzenle
                </Text>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>

            {/* Expectation Profile Button - Always visible with conditional warning */}
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("ProfileExpectation")}
            >
              <View className="flex-row items-center gap-4">
                <Edit size={25} color="black" />
                <View className="flex flex-col gap-1">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-medium"
                  >
                    {isExpectationCompleted
                      ? "Beklenti Profili Düzenle"
                      : "Beklenti Profili Oluştur"}
                  </Text>
                  {!isExpectationCompleted && (
                    <Text
                      style={{ fontSize: 12 }}
                      className="text-gray-500 font-medium"
                    >
                      Lütfen devam etmeden önce beklenti profilini oluştur.
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex flex-row gap-1 items-center">
                {/* Red warning dot - only visible if expectations not completed */}
                {!isExpectationCompleted && (
                  <View className="bg-red-500 w-3 h-3 rounded-full mr-2"></View>
                )}
                <ChevronRight size={15} color="#cfcfcf" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View className="bg-white rounded-xl">
            <Text
              className="mt-6 mb-4"
              style={{ fontSize: 20, fontWeight: 600 }}
            >
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
                <Home size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  {userRole === "EVSAHIBI" ? "Mülklerim" : "İlan Ara"}
                </Text>
              </View>
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
                <Handshake size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  {userRole === "EVSAHIBI" ? "Teklifler" : "Tekliflerim"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* {userRole === "KIRACI" && (
              <TouchableOpacity
                className="py-4 rounded-lg flex flex-row justify-between items-center"
                onPress={() => {
                  navigation.navigate("FavoriteProperties");
                }}
              >
                <View className="flex-row items-center gap-4">
                  <Heart size={25} color="black" />
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-medium"
                  >
                    Favorilerim
                  </Text>
                </View>
                <ChevronRight
                  icon={faChevronRight}
                  size={15}
                  color="#cfcfcf"
                />
              </TouchableOpacity>
            )} */}

            {userRole === "EVSAHIBI" && (
              <TouchableOpacity
                className="py-4 rounded-lg flex flex-row justify-between items-center"
                onPress={() => {
                  navigation.navigate("CreatePost");
                }}
              >
                <View className="flex-row items-center gap-4">
                  <Plus size={25} color="black" />
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-medium"
                  >
                    Yeni İlan Oluştur
                  </Text>
                </View>
                <ChevronRight size={15} color="#cfcfcf" />
              </TouchableOpacity>
            )}
          </View>

          {/* Favoriler Section - YENİ EKLENDİ */}
          <Text className="mt-6 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
            Favoriler
          </Text>

          <View className="bg-white rounded-xl">
            {/* Favori İlanlar Button - Sadece kiracılar için */}
            {userRole === "KIRACI" && (
              <TouchableOpacity
                className="py-4 rounded-lg flex flex-row justify-between items-center"
                onPress={() => navigation.navigate("FavoriteProperties")}
              >
                <View className="flex-row items-center gap-4">
                  <Heart size={25} color="black" />
                  <View className="flex-col">
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-900 font-medium"
                    >
                      Favori İlanlar
                    </Text>
                  </View>
                </View>
                <ChevronRight size={15} color="#cfcfcf" />
              </TouchableOpacity>
            )}

            {/* Favori Profiller Button - Kiracılar için ev sahipleri, ev sahipleri için kiracılar */}
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("FavoriteProfiles")}
            >
              <View className="flex-row items-center gap-4">
                <Heart size={25} color="black" />
                <View className="flex-col">
                  <Text
                    style={{ fontSize: 16 }}
                    className="text-gray-900 font-medium"
                  >
                    {userRole === "KIRACI"
                      ? "Favori Ev Sahipleri"
                      : "Favori Kiracılar"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>
          </View>

          {/* Settings and Logout */}
          <View className="bg-white rounded-xl">
            <Text
              className="mt-4 mb-4"
              style={{ fontSize: 20, fontWeight: 600 }}
            >
              Daha fazla
            </Text>
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => {
                navigation.navigate("HelpSupport");
              }}
            >
              <View className="flex-row items-center gap-4">
                <HelpCircle size={25} color="black" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-gray-900 font-medium"
                >
                  Yardım & Destek
                </Text>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>

            <TouchableOpacity
              className="py-6 mt-2 flex flex-row justify-between items-center border-t border-gray-200"
              onPress={handleLogout}
            >
              <View className="flex-row items-center gap-4">
                <LogOut size={25} color="#ef4444" />
                <Text
                  style={{ fontSize: 16 }}
                  className="text-red-600 font-medium"
                >
                  Çıkış Yap
                </Text>
              </View>
              {/* <ChevronRight
                icon={faChevronRight}
                size={15}
                color="#cfcfcf"
              /> */}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
