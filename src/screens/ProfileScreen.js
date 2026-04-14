import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
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
  forceLogout,
  selectCurrentUser,
  selectUserRole,
} from "../redux/slices/authSlice";
import {
  useGetOwnTenantProfileQuery,
  useGetOwnLandlordProfileQuery,
} from "../redux/api/apiSlice";
import { chatApiHelpers } from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { authCleanupHelper } from "../utils/authCleanup";
import { useFocusEffect } from "@react-navigation/native";
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
  const [refreshing, setRefreshing] = useState(false);

  const { stopConnection } = useSignalR();
  const { manualUnregister: unregisterFcmToken } = useNotificationToken();

  const scrollY = useRef(new Animated.Value(0)).current;

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

  const {
    data: landlordData,
    isLoading: isLandlordLoading,
    refetch: refetchLandlord,
  } = useGetOwnLandlordProfileQuery(currentUser?.id, {
    skip: userRole !== "EVSAHIBI",
  });

  const {
    data: tenantData,
    isLoading: isTenantLoading,
    refetch: refetchTenant,
  } = useGetOwnTenantProfileQuery(currentUser?.id, {
    skip: userRole !== "KIRACI",
  });

  const profileData = userRole === "EVSAHIBI" ? landlordData : tenantData;
  const isLoading = userRole === "EVSAHIBI" ? isLandlordLoading : isTenantLoading;
  const refetch = userRole === "EVSAHIBI" ? refetchLandlord : refetchTenant;

  const profile = profileData?.result ?? null;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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
        onPress: async () => {
          try {
            try {
              await unregisterFcmToken();
            } catch (_) {}

            await stopConnection();
            chatApiHelpers.clearChatCache(dispatch);
            await authCleanupHelper.clearUserStorage();
            dispatch(forceLogout());
          } catch (_) {
            dispatch(forceLogout());
          }
        },
        style: "destructive",
      },
    ]);
  };

  const isExpectationCompleted =
    userRole === "KIRACI"
      ? !!(profile?.landLordExpectation || profile?.landlordExpectation)
      : !!(profile?.tenantExpectation);

  if (isLoading && !profile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">Profil yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Animated Header */}
      <View className="bg-white z-10">
        <Animated.View style={{ height: headerContainerHeight, overflow: "hidden" }}>
          <Animated.View
            className="flex justify-center items-center px-5"
            style={{
              height: 50,
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 600 }} className="text-gray-900">
              Profil
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-white px-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#303030"]}
            tintColor="#303030"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={{ borderRadius: 30 }} className="items-center py-6 border-gray-200 mt-4">
          <View
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className="w-24 h-24 rounded-full bg-white justify-center items-center mb-2 border-white"
          >
            {profile?.profileImageUrl && profile.profileImageUrl !== "default_profile_image_url" ? (
              <Image
                style={{
                  borderRadius: 100,
                  boxShadow: "0px 0px 12px #00000014",
                  width: 96,
                  height: 96,
                }}
                source={{ uri: profile.profileImageUrl }}
                className="w-full h-full rounded-full"
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <View
                style={{ borderRadius: 100, boxShadow: "0px 0px 12px #00000014" }}
                className="w-full h-full rounded-full bg-gray-100 justify-center items-center"
              >
                <Text style={{ fontSize: 40 }} className="text-gray-900 font-bold">
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
            {profile?.user?.name ?? currentUser?.name ?? ""}{" "}
            {profile?.user?.surname ?? currentUser?.surname ?? ""}
          </Text>
          <Text style={{ fontSize: 12 }} className="text-gray-500">
            {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"}
          </Text>
        </View>

        {/* Hesap */}
        <View>
          <Text className="mt-6 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
            Hesap
          </Text>

          <View className="bg-white rounded-xl">
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("Settings")}
            >
              <View className="flex-row items-center gap-4">
                <Settings size={25} color="black" />
                <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                  Ayarlar
                </Text>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View className="flex-row items-center gap-4">
                <UserCog size={25} color="black" />
                <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                  Profili Düzenle
                </Text>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("ProfileExpectation")}
            >
              <View className="flex-row items-center gap-4">
                <Edit size={25} color="black" />
                <View className="flex flex-col gap-1">
                  <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                    {isExpectationCompleted ? "Beklenti Profilini Güncelle" : "Beklenti Profili Oluştur"}
                  </Text>
                  {!isExpectationCompleted && (
                    <Text style={{ fontSize: 12 }} className="text-gray-500 font-medium">
                      Lütfen devam etmeden önce beklenti profilini oluştur.
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex flex-row gap-1 items-center">
                {!isExpectationCompleted ? (
                  <View className="bg-red-500 w-3 h-3 rounded-full mr-2" />
                ) : (
                  <ChevronRight size={15} color="#cfcfcf" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* İlanlar */}
          <View className="bg-white rounded-xl">
            <Text className="mt-6 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
              İlanlar
            </Text>
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("Properties")}
            >
              <View className="flex-row items-center gap-4">
                <Home size={25} color="black" />
                <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                  {userRole === "EVSAHIBI" ? "Mülklerim" : "İlan Ara"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("Offers")}
            >
              <View className="flex-row items-center gap-4">
                <Handshake size={25} color="black" />
                <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                  {userRole === "EVSAHIBI" ? "Teklifler" : "Tekliflerim"}
                </Text>
              </View>
            </TouchableOpacity>

            {userRole === "EVSAHIBI" && (
              <TouchableOpacity
                className="py-4 rounded-lg flex flex-row justify-between items-center"
                onPress={() => navigation.navigate("CreatePost")}
              >
                <View className="flex-row items-center gap-4">
                  <Plus size={25} color="black" />
                  <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                    Yeni İlan Oluştur
                  </Text>
                </View>
                <ChevronRight size={15} color="#cfcfcf" />
              </TouchableOpacity>
            )}
          </View>

          {/* Favoriler */}
          <Text className="mt-6 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
            Favoriler
          </Text>

          <View className="bg-white rounded-xl">
            {userRole === "KIRACI" && (
              <TouchableOpacity
                className="py-4 rounded-lg flex flex-row justify-between items-center"
                onPress={() => navigation.navigate("FavoriteProperties")}
              >
                <View className="flex-row items-center gap-4">
                  <Heart size={25} color="black" />
                  <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                    Favori İlanlar
                  </Text>
                </View>
                <ChevronRight size={15} color="#cfcfcf" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("FavoriteProfiles")}
            >
              <View className="flex-row items-center gap-4">
                <Heart size={25} color="black" />
                <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
                  {userRole === "KIRACI" ? "Favori Ev Sahipleri" : "Favori Kiracılar"}
                </Text>
              </View>
              <ChevronRight size={15} color="#cfcfcf" />
            </TouchableOpacity>
          </View>

          {/* Daha Fazla */}
          <View className="bg-white rounded-xl">
            <Text className="mt-4 mb-4" style={{ fontSize: 20, fontWeight: 600 }}>
              Daha fazla
            </Text>
            <TouchableOpacity
              className="py-4 rounded-lg flex flex-row justify-between items-center"
              onPress={() => navigation.navigate("HelpSupport")}
            >
              <View className="flex-row items-center gap-4">
                <HelpCircle size={25} color="black" />
                <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
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
                <Text style={{ fontSize: 16 }} className="text-red-600 font-medium">
                  Çıkış Yap
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
