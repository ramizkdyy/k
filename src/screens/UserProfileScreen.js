import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MapPin,
  User,
  Calendar,
  Phone,
  Mail,
  Heart,
  MessageCircle,
  ShieldUser,
  Star,
  Home,
  DollarSign,
  Users,
  PawPrint,
  GraduationCap,
  Cigarette,
  Shield,
  CircleCheck,
  CircleX,
  BedDouble,
  Ruler,
  Thermometer,
  CircleParking,
  Building,
  Wifi,
  TreePine,
  Car,
  Hospital,
  School,
  ShoppingCart,
  TrainFront,
  Scale,
  CreditCard,
  Handshake,
  FileCheck,
  Clock,
  Banknote,
} from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import {
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
  useGetLandlordPropertyListingsQuery,
  apiSlice,
} from "../redux/api/apiSlice";
import { useFocusEffect } from "@react-navigation/native";
import {
  selectProfileActionLoading,
  selectProfileActionError,
  clearProfileActionError,
} from "../redux/slices/profileSlice";
import { LinearGradient } from "expo-linear-gradient";
import ProfileRateModal from "../modals/ProfileRateModal";
import UserProfileSkeleton from "../components/UserProfileSkeleton";

const { width: screenWidth } = Dimensions.get("window");

const UserProfileScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  const { userId, userRole } = route.params;
  const [activeTab, setActiveTab] = useState("general");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);

  const currentUserProfile = useSelector(selectCurrentUser);
  const profileActionLoading = useSelector(selectProfileActionLoading);
  const profileActionError = useSelector(selectProfileActionError);
  const insets = useSafeAreaInsets();


  // ✅ FIX: Koşullu hook ihlali düzeltildi — tüm hook'lar her render'da çağrılır
  // Mevcut kullanıcının kendi profili (favoriler için)
  const {
    data: myLandlordProfileData,
    isLoading: myLandlordLoading,
    refetch: refetchMyLandlordProfile,
  } = useGetLandlordProfileQuery(currentUserProfile?.id, {
    skip: !currentUserProfile?.id || currentUserProfile?.role !== "EVSAHIBI",
  });

  const {
    data: myTenantProfileData,
    isLoading: myTenantLoading,
    refetch: refetchMyTenantProfile,
  } = useGetTenantProfileQuery(currentUserProfile?.id, {
    skip: !currentUserProfile?.id || currentUserProfile?.role !== "KIRACI",
  });

  const myProfileData = currentUserProfile?.role === "EVSAHIBI" ? myLandlordProfileData : myTenantProfileData;
  const myProfileLoading = currentUserProfile?.role === "EVSAHIBI" ? myLandlordLoading : myTenantLoading;
  const refetchMyProfile = currentUserProfile?.role === "EVSAHIBI" ? refetchMyLandlordProfile : refetchMyTenantProfile;

  // Ziyaret edilen kullanıcının profili
  const {
    data: landlordProfileData,
    isLoading: landlordProfileLoading,
    error: landlordProfileError,
    refetch: refetchLandlordProfile,
  } = useGetLandlordProfileQuery(userId, {
    skip: !userId || userRole !== "EVSAHIBI",
  });

  const {
    data: tenantProfileData,
    isLoading: tenantProfileLoading,
    error: tenantProfileError,
    refetch: refetchTenantProfile,
  } = useGetTenantProfileQuery(userId, {
    skip: !userId || userRole !== "KIRACI",
  });

  const profileData = userRole === "EVSAHIBI" ? landlordProfileData : tenantProfileData;
  const profileLoading = userRole === "EVSAHIBI" ? landlordProfileLoading : tenantProfileLoading;
  const profileError = userRole === "EVSAHIBI" ? landlordProfileError : tenantProfileError;
  const refetchProfile = userRole === "EVSAHIBI" ? refetchLandlordProfile : refetchTenantProfile;

  const isOwnProfile = currentUserProfile?.id === userId;
  const userProfile = profileData?.isSuccess ? profileData.result : null;
  const myProfile = myProfileData?.isSuccess ? myProfileData.result : null;

  // Ev sahibinin ilanlarını çek
  const {
    data: landlordListingsData,
    isLoading: landlordListingsLoading,
  } = useGetLandlordPropertyListingsQuery(userId, {
    skip: userRole !== "EVSAHIBI",
  });
  const landlordListings = landlordListingsData?.isSuccess ? landlordListingsData.result : null;


  const [profileAction] = apiSlice.endpoints.profileAction.useMutation();


  const handleRateProfile = async (ratingData) => {
    if (hasUserRated) {
      Alert.alert(
        "Değerlendirme Yapıldı",
        "Bu kullanıcıyı zaten değerlendirdiniz."
      );
      return;
    }
    try {

      // 1. Önce Rating Gönder
      const ratingResult = await profileAction({
        SenderUserId: currentUserProfile?.id,
        ReceiverUserId: userId,
        profileAction: 2, // RateProfile
        RatingValue: ratingData.rating,
      }).unwrap();


      // 2. Eğer mesaj varsa, ayrı olarak MessageProfile gönder
      if (ratingData.message?.trim()) {

        const messageResult = await profileAction({
          SenderUserId: currentUserProfile?.id,
          ReceiverUserId: userId,
          profileAction: 3, // MessageProfile
          Message: ratingData.message.trim(),
        }).unwrap();

      }

      // İşlemler başarılı olduysa modal'ı kapat ve profili yenile
      if (ratingResult.isSuccess) {
        setShowRatingModal(false);
        setHasUserRated(true); // YENİ: State'i güncelle

        Alert.alert(
          "Başarılı",
          ratingData.message?.trim()
            ? "Değerlendirmeniz ve mesajınız gönderildi!"
            : "Değerlendirmeniz gönderildi!"
        );
        refetchProfile();
      }
    } catch (error) {
      setShowRatingModal(false);
      Alert.alert(
        "Hata",
        error?.data?.message || "Değerlendirme gönderilirken bir hata oluştu."
      );
    }
  };

  useEffect(() => {
    if (profileActionError) {
      Alert.alert("Hata", profileActionError, [
        { text: "Tamam", onPress: () => dispatch(clearProfileActionError()) },
      ]);
    }
  }, [profileActionError, dispatch]);

  // YENİ: Favori durumunu kontrol et - DÜZELTME
  useEffect(() => {
    if (myProfile && userId && userRole) {
      let isUserFavorited = false;


      // Görüntülenen profil türüne göre kontrol et
      if (userRole === "EVSAHIBI" && myProfile.favoriteLandlordProfile) {
        // Ev sahibi profiline bakıyoruz, myProfile'ın favoriteLandlordProfile'ında var mı?
        isUserFavorited = myProfile.favoriteLandlordProfile.some(
          (favProfile) => favProfile.userId === userId
        );
      } else if (userRole === "KIRACI" && myProfile.favoriteTenantProfile) {
        // Kiracı profiline bakıyoruz, myProfile'ın favoriteTenantProfile'ında var mı?
        isUserFavorited = myProfile.favoriteTenantProfile.some(
          (favProfile) => favProfile.userId === userId
        );
      }

      setIsFavorite(isUserFavorited);

    }
  }, [myProfile, userId, userRole]);

  // Mevcut useEffect'lerin yanına ekle:
  useEffect(() => {
    if (userProfile?.ratedByUserIds && currentUserProfile?.id) {
      const hasRated = userProfile.ratedByUserIds.includes(
        currentUserProfile.id.toString()
      );
      setHasUserRated(hasRated);

    }
  }, [userProfile?.ratedByUserIds, currentUserProfile?.id]);



  const expectation =
    userRole === "EVSAHIBI"
      ? userProfile?.tenantExpectation
      : userProfile?.landLordExpectation;

  const getCompatibilityColor = (level) => {
    switch (level?.toLowerCase()) {
      case "yüksek":
      case "high":
        return "bg-green-500";
      case "orta":
      case "medium":
        return "bg-yellow-500";
      case "düşük":
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleFavoriteToggle = async () => {
    try {

      const actionType = isFavorite ? 1 : 0; // 1: RemoveFavorite, 0: AddFavorite

      const result = await profileAction({
        SenderUserId: currentUserProfile?.id,
        ReceiverUserId: userId,
        profileAction: actionType, // ProfileAction enum'ından AddFavorite (0) veya RemoveFavorite (1)
      }).unwrap();


      if (result.isSuccess) {
        // Local state'i güncelle
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      Alert.alert(
        "Hata",
        error?.data?.message || "Favori işlemi sırasında bir hata oluştu."
      );
    }
  };

  const handleSendMessage = () => {
    navigation.navigate("ChatDetail", {
      partnerId: userId,
      partnerName: userProfile?.user?.name + " " + userProfile?.user?.surname,
      partner: {
        name: userProfile?.user?.name,
        surname: userProfile?.user?.surname,
        profileImageUrl: userProfile?.profileImageUrl,
      },
    });
  };

  // Tab Management for hiding bottom tabs
  // Tab Management for hiding bottom tabs
  useFocusEffect(
    useCallback(() => {

      const parent = navigation.getParent();

      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: "none" },
        });
      }

      return () => {

        const parent = navigation.getParent();
        if (parent) {
          if (userRole === "EVSAHIBI") {
            parent.setOptions({
              tabBarStyle: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderTopColor: "rgba(224, 224, 224, 0.2)",
                paddingTop: 5,
                paddingBottom: 5,
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 8,
              },
            });
          } else if (userRole === "KIRACI") {
            parent.setOptions({
              tabBarStyle: {
                backgroundColor: "#fff",
                borderTopColor: "#e0e0e0",
                paddingTop: 5,
                paddingBottom: 5,
              },
            });
          }
        }
      };
    }, [navigation, userRole])
  );

  const handleReport = () => {
    Alert.alert(
      "Kullanıcıyı Bildir",
      "Bu kullanıcıyı bildirmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Bildir",
          style: "destructive",
          onPress: () => {
            Alert.alert("Başarılı", "Kullanıcı bildirildi.");
          },
        },
      ]
    );
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const renderStarRating = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} size={size} fill="#fbbf24" color="#fbbf24" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            size={size}
            fill="#fbbf24"
            color="#fbbf24"
            style={{ opacity: 0.5 }}
          />
        );
      } else {
        stars.push(
          <Star key={i} size={size} color="#e5e7eb" />
        );
      }
    }
    return stars;
  };

  const getPolicyText = (policyValue, type) => {
    switch (type) {
      case "pet":
        return policyValue === 1
          ? "İzin verilmiyor"
          : policyValue === 2
          ? "Kısıtlı izin"
          : policyValue === 3
          ? "İzin veriliyor"
          : "Belirtilmemiş";
      case "smoking":
        return policyValue === 1
          ? "İçilemiyor"
          : policyValue === 2
          ? "Kısıtlı"
          : policyValue === 3
          ? "İçilebilir"
          : "Belirtilmemiş";
      case "student":
        return policyValue === 1
          ? "Öğrenci alınmıyor"
          : policyValue === 2
          ? "Kısıtlı"
          : policyValue === 3
          ? "Öğrenci alınıyor"
          : "Belirtilmemiş";
      case "building":
        return policyValue === 1
          ? "Yönetim onayı gerekli değil"
          : policyValue === 2
          ? "Yönetim onayı gerekli"
          : "Belirtilmemiş";
      case "maintenance":
        return policyValue === 1
          ? "Kiracı ödeyecek"
          : policyValue === 2
          ? "Ev sahibi ödeyecek"
          : "Belirtilmemiş";
      case "currency":
        return policyValue === 1
          ? "TRY"
          : policyValue === 2
          ? "USD"
          : policyValue === 3
          ? "EUR"
          : "Diğer";
      default:
        return "Belirtilmemiş";
    }
  };

  if (profileLoading || myProfileLoading) {
    return <UserProfileSkeleton />;
  }

  if (profileError || !userProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <User size={64} color="#d1d5db" />
        <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
          Profil Bulunamadı
        </Text>
        <Text className="text-base text-gray-500 text-center mb-6">
          Aradığınız kullanıcının profili bulunamadı veya erişilemiyor.
        </Text>
        <TouchableOpacity
          className="bg-gray-900 px-8 py-3 rounded-xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-semibold">Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const user = userProfile?.user;
  const details = userProfile?.details;

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
    >
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 py-2" style={{ minHeight: 44 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <ChevronLeft size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReport} className="p-2">
          <ShieldUser size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="items-center py-6">
          <View
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className="w-24 h-24 rounded-full bg-white justify-center items-center mb-4 overflow-hidden"
          >
            {userProfile?.profileImageUrl &&
            userProfile?.profileImageUrl !== "default_profile_image_url" ? (
              <Image
                style={{
                  width: 96,
                  height: 96,
                }}
                source={{ uri: userProfile.profileImageUrl }}
                className="w-full h-full"
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <Text
                style={{ fontSize: 40 }}
                className="text-gray-900 font-bold"
              >
                {user?.name?.charAt(0) || "P"}
              </Text>
            )}
          </View>

          <Text
            style={{ fontSize: 20 }}
            className="font-bold text-gray-900 mb-1"
          >
            {user?.name} {user?.surname}
          </Text>

          <Text style={{ fontSize: 12 }} className="text-gray-500 mb-3">
            {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"}
          </Text>

          {/* Rating */}
          {userProfile?.profileRating && (
            <View className="flex-row items-center mb-3">
              <View className="flex-row mr-2">
                {renderStarRating(userProfile.profileRating)}
              </View>
              <Text className="text-sm font-medium text-gray-700">
                {userProfile.profileRating.toFixed(1)}
              </Text>
              <Text className="text-sm text-gray-500 ml-1">
                ({userProfile?.ratingCount || 0} değerlendirme)
              </Text>
            </View>
          )}

          {/* Match Score */}
          {!!route.params?.matchScore && (
            <View className="mb-4">
              <View
                className={`px-4 py-2 rounded-full ${getCompatibilityColor(
                  route.params.compatibilityLevel
                )}`}
              >
                <Text className="text-white text-sm font-semibold">
                  %{route.params.matchScore} Uyumlu
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View className="flex-row gap-3">
              {/* Favori Butonu */}
              <TouchableOpacity
                onPress={handleFavoriteToggle}
                disabled={profileActionLoading}
                className={`px-6 py-3 rounded-xl flex-row items-center ${
                  isFavorite ? "bg-red-500" : "bg-gray-100"
                }`}
              >
                <Heart
                  size={16}
                  color={isFavorite ? "white" : "#6b7280"}
                  fill={isFavorite ? "white" : "none"}
                />
              </TouchableOpacity>

              {/* Mesaj Butonu */}
              <TouchableOpacity
                onPress={handleSendMessage}
                style={{ borderRadius: 12, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#0A8C66', '#20604C']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}
                >
                  <MessageCircle size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              {/* YENİ: Değerlendir Butonu */}
              <TouchableOpacity
                onPress={() => {
                  if (hasUserRated) {
                    Alert.alert(
                      "Değerlendirme Yapıldı",
                      "Bu kullanıcıyı zaten değerlendirdiniz."
                    );
                    return;
                  }
                  setShowRatingModal(true);
                }}
                disabled={profileActionLoading}
                className={`px-6 py-3 rounded-xl flex-row items-center ${
                  hasUserRated ? "bg-gray-300" : "bg-yellow-500"
                }`}
              >
                <Star
                  size={16}
                  color={hasUserRated ? "#9ca3af" : "white"}
                  fill={hasUserRated ? "#9ca3af" : "white"}
                />
              </TouchableOpacity>

              {/* İlanlar Butonu - sadece ev sahibi için */}
              {userRole === "EVSAHIBI" && (
                <TouchableOpacity
                  onPress={() => setActiveTab("listings")}
                  className={`px-6 py-3 rounded-xl flex-row items-center ${
                    activeTab === "listings" ? "bg-gray-900" : "bg-gray-100"
                  }`}
                >
                  <Home
                    size={16}
                    color={activeTab === "listings" ? "white" : "#6b7280"}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {/* Tab Navigation */}
        <View className="mb-6">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab("general")}
              className={`flex-1 py-3 px-3 rounded-full ${
                activeTab === "general" ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-medium text-xs ${
                  activeTab === "general" ? "text-white" : "text-gray-700"
                }`}
              >
                Genel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("preferences")}
              className={`flex-1 py-3 px-3 rounded-full ${
                activeTab === "preferences" ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-medium text-xs ${
                  activeTab === "preferences" ? "text-white" : "text-gray-700"
                }`}
              >
                {userRole === "EVSAHIBI" ? "Beklenti" : "Tercih"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("requirements")}
              className={`flex-1 py-3 px-3 rounded-full ${
                activeTab === "requirements" ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-medium text-xs ${
                  activeTab === "requirements" ? "text-white" : "text-gray-700"
                }`}
              >
                {userRole === "EVSAHIBI" ? "Koşul" : "Gerek"}
              </Text>
            </TouchableOpacity>

            {/* YENİ 4. TAB */}
            <TouchableOpacity
              onPress={() => setActiveTab("reviews")}
              className={`flex-1 py-3 px-3 rounded-full ${
                activeTab === "reviews" ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-medium text-xs ${
                  activeTab === "reviews" ? "text-white" : "text-gray-700"
                }`}
              >
                Değerlen.
              </Text>
            </TouchableOpacity>

            {/* İlanlar TAB - sadece ev sahibi için */}
            {userRole === "EVSAHIBI" && (
              <TouchableOpacity
                onPress={() => setActiveTab("listings")}
                className={`flex-1 py-3 px-3 rounded-full ${
                  activeTab === "listings" ? "bg-gray-900" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-medium text-xs ${
                    activeTab === "listings" ? "text-white" : "text-gray-700"
                  }`}
                >
                  İlanlar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <View className="gap-4" style={{ minHeight: 600 }}>
            {/* Kişisel Bilgiler */}
            <View className="py-2">
              <Text
                style={{ fontSize: 18 }}
                className="font-semibold text-gray-900 mb-4"
              >
                Kişisel Bilgiler
              </Text>

              <View className="gap-3">
                <View className="flex-row items-center">
                  <Mail
                    size={16}
                    color="#6b7280"
                  />
                  <Text className="ml-3 text-gray-700 flex-1">
                    {user?.email}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Phone size={16} color="#6b7280" />
                  <Text className="ml-3 text-gray-700 flex-1">
                    {user?.phoneNumber}
                  </Text>
                </View>

                {user?.gender && (
                  <View className="flex-row items-center">
                    <User size={16} color="#6b7280" />
                    <Text className="ml-3 text-gray-700 flex-1">
                      {user.gender === "Man" ? "Erkek" : "Kadın"}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* İlan Sayısı (Ev Sahibi için) */}
            {userRole === "EVSAHIBI" && (landlordListings || userProfile?.rentalPosts) && (
              <View className="py-2">
                <Text
                  style={{ fontSize: 18 }}
                  className="font-semibold text-gray-900 mb-4"
                >
                  İlan Bilgileri
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Building
                      size={20}
                      color="#6b7280"
                    />
                    <Text className="ml-3 text-gray-700">
                      Aktif İlan Sayısı
                    </Text>
                  </View>
                  <View className=" px-3 py-1 rounded-full">
                    <Text className="text-gray-900 font-semibold">
                      {(landlordListings ?? userProfile?.rentalPosts)?.length ?? 0}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Profil Açıklaması */}
            {!!userProfile?.profileDescription && (
              <View className="py-2">
                <Text
                  style={{ fontSize: 18 }}
                  className="font-semibold text-gray-900 mb-3"
                >
                  Hakkında
                </Text>
                <Text className="text-gray-700 leading-6">
                  {userProfile.profileDescription}
                </Text>
              </View>
            )}
          </View>
        )}
        {/* PREFERENCES TAB */}
        {activeTab === "preferences" && expectation && (
          <View className="gap-4">
            {userRole === "EVSAHIBI" ? (
              // EV SAHİBİ BEKLENTI PROFİLİ
              <>
                {/* Kiracı Beklentileri */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Kiracı Beklentileri
                  </Text>

                  <View className="gap-2">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Tercih edilen konum</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.district}, {expectation.city}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Kira tutarı</Text>
                      <Text className="font-semibold text-gray-900">
                        {formatCurrency(expectation.rentAmount)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Para birimi</Text>
                      <Text className="font-medium text-gray-900">
                        {getPolicyText(
                          expectation.preferredCurrency,
                          "currency"
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Min. kiralama süresi
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.minimumRentalPeriod} ay
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Maksimum yaşayacak kişi
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.maximumOccupants} kişi
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Min. aylık gelir</Text>
                      <Text className="font-semibold text-gray-900">
                        {formatCurrency(expectation.minimumMonthlyIncome)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Finansal Koşullar */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Finansal Koşullar
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Depozito gerekli</Text>
                      {expectation.isDepositRequired ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    {expectation.isDepositRequired && (
                      <View className="flex-row items-center justify-between py-2">
                        <Text className="text-gray-700">Depozito tutarı</Text>
                        <Text className="font-medium text-gray-900">
                          {formatCurrency(expectation.depositAmount)}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Aidat dahil</Text>
                      {expectation.isMaintenanceFeeIncluded ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    {!expectation.isMaintenanceFeeIncluded && (
                      <>
                        <View className="flex-row items-center justify-between py-2">
                          <Text className="text-gray-700">Aidat tutarı</Text>
                          <Text className="font-medium text-gray-900">
                            {formatCurrency(expectation.maintenanceFee)}
                          </Text>
                        </View>

                        <View className="flex-row items-center justify-between py-2">
                          <Text className="text-gray-700">Aidat sorumlusu</Text>
                          <Text className="font-medium text-gray-900">
                            {getPolicyText(
                              expectation.maintenanceFeeResponsibility,
                              "maintenance"
                            )}
                          </Text>
                        </View>
                      </>
                    )}

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Banka transferi gerekli
                      </Text>
                      {expectation.isBankTransferRequired ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Yabancı para kabul</Text>
                      {expectation.isForeignCurrencyAccepted ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>
                  </View>
                </View>

                {/* Politikalar */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Ev Kuralları
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <PawPrint
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Evcil hayvan politikası
                        </Text>
                      </View>
                      <Text className="font-medium text-gray-900">
                        {getPolicyText(expectation.petPolicy, "pet")}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Cigarette
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Sigara politikası
                        </Text>
                      </View>
                      <Text className="font-medium text-gray-900">
                        {getPolicyText(expectation.smokingPolicy, "smoking")}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <GraduationCap
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Öğrenci politikası
                        </Text>
                      </View>
                      <Text className="font-medium text-gray-900">
                        {getPolicyText(expectation.studentPolicy, "student")}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Building
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Yönetim onayı
                        </Text>
                      </View>
                      <Text className="font-medium text-gray-900">
                        {getPolicyText(
                          expectation.buildingApprovalPolicy,
                          "building"
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Sadece aile</Text>
                      {expectation.familyOnly ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Çocuklu aile kabul</Text>
                      {expectation.acceptChildrenFamily ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Devlet memuru tercihi
                      </Text>
                      {expectation.preferGovernmentEmployee ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Kısa süreli kiralama
                      </Text>
                      {expectation.isShortTermRentalAvailable ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>
                  </View>
                </View>
              </>
            ) : (
              // KİRACI TERCİH PROFİLİ
              <>
                {/* Konum Tercihleri */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Konum Tercihleri
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center py-2">
                      <MapPin
                        size={16}
                        color="#ef4444"
                      />
                      <Text className="ml-3 text-gray-700 flex-1">
                        {expectation.district}, {expectation.city}
                      </Text>
                    </View>

                    {!!expectation.alternativeDistricts && (
                      <View className="py-2">
                        <Text className="text-gray-500 text-sm mb-1">
                          Alternatif bölgeler:
                        </Text>
                        <Text className="text-gray-700">
                          {expectation.alternativeDistricts}
                        </Text>
                      </View>
                    )}

                    {!!expectation.preferredNeighborhoods && (
                      <View className="py-2">
                        <Text className="text-gray-500 text-sm mb-1">
                          Tercih edilen mahalleler:
                        </Text>
                        <Text className="text-gray-700">
                          {expectation.preferredNeighborhoods}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Ev Özellikleri */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Ev Özellikleri
                  </Text>

                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1 bg-gray-50 rounded-xl p-4 mr-2 items-center">
                      <BedDouble size={24} color="#6b7280" />
                      <Text className="text-sm text-gray-500 mt-2">
                        Min. Oda
                      </Text>
                      <Text className="text-gray-900 font-bold">
                        {expectation.minRoomCount}
                      </Text>
                    </View>

                    <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2 items-center">
                      <Ruler
                        size={24}
                        color="#6b7280"
                      />
                      <Text className="text-sm text-gray-500 mt-2">
                        Min. m²
                      </Text>
                      <Text className="text-gray-900 font-bold">
                        {expectation.minSquareMeters}
                      </Text>
                    </View>
                  </View>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Maksimum bina yaşı</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.maxBuildingAge} yıl
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Tercih edilen kat</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.preferredFloorRange}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Isıtma tipi</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.preferredHeatingType === 1
                          ? "Doğalgaz"
                          : expectation.preferredHeatingType === 2
                          ? "Elektrik"
                          : expectation.preferredHeatingType === 3
                          ? "Merkezi"
                          : "Diğer"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Eşyalı ev tercihi</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.furnishedPreference === 1
                          ? "Eşyalı"
                          : expectation.furnishedPreference === 2
                          ? "Eşyasız"
                          : "Fark etmez"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bütçe Detayları */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Bütçe Detayları
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Min. kira bütçesi</Text>
                      <Text className="font-semibold text-gray-900">
                        {formatCurrency(expectation.minRentBudget)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Maks. kira bütçesi</Text>
                      <Text className="font-semibold text-gray-900">
                        {formatCurrency(expectation.maxRentBudget)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Maks. depozito</Text>
                      <Text className="font-medium text-gray-900">
                        {formatCurrency(expectation.maxDepositAmount)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Maks. aidat</Text>
                      <Text className="font-medium text-gray-900">
                        {formatCurrency(expectation.maxMaintenanceFee)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Aidat tercihi</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.maintenanceFeePreference === 1
                          ? "Düşük"
                          : expectation.maintenanceFeePreference === 2
                          ? "Orta"
                          : "Yüksek"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Tercih edilen ödeme yöntemi
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.preferredPaymentMethod === 1
                          ? "Nakit"
                          : expectation.preferredPaymentMethod === 2
                          ? "Banka Transferi"
                          : expectation.preferredPaymentMethod === 3
                          ? "Kredi Kartı"
                          : "Diğer"}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        {/* REQUIREMENTS TAB */}
        {activeTab === "requirements" && expectation && (
          <View className="gap-4">
            {userRole === "EVSAHIBI" ? (
              // EV SAHİBİ GEREKSİNİMLERİ
              <>
                {/* Kiracıdan Beklenenler */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Kiracıdan Beklenenler
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <FileCheck
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Gelir belgesi gerekli
                        </Text>
                      </View>
                      {expectation.isIncomeProofRequired ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Handshake
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Kefil gerekli
                        </Text>
                      </View>
                      {expectation.isGuarantorRequired ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <FileCheck
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Referans gerekli
                        </Text>
                      </View>
                      {expectation.isReferenceRequired ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Shield
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Sigortalı iş gerekli
                        </Text>
                      </View>
                      {expectation.isInsuredJobRequired ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>
                  </View>
                </View>

                {/* Kabul Edilen Evcil Hayvan Türleri */}
                {!!expectation.acceptedPetTypes && (
                  <View className="py-2">
                    <Text
                      style={{ fontSize: 18 }}
                      className="font-semibold text-gray-900 mb-3"
                    >
                      Kabul Edilen Evcil Hayvan Türleri
                    </Text>
                    <Text className="text-gray-700 leading-6">
                      {expectation.acceptedPetTypes}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // KİRACI GEREKSİNİMLERİ
              <>
                {/* Gerekli Özellikler */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Gerekli Özellikler
                  </Text>

                  <View className="space-y-3">
                    {[
                      {
                        key: "requiresElevator",
                        label: "Asansör",
                        Icon: Building,
                      },
                      {
                        key: "requiresParking",
                        label: "Otopark",
                        Icon: CircleParking,
                      },
                      { key: "requiresBalcony", label: "Balkon", Icon: Home },
                      { key: "requiresGarden", label: "Bahçe", Icon: TreePine },
                      {
                        key: "requiresInternet",
                        label: "İnternet",
                        Icon: Wifi,
                      },
                    ].map(({ key, label, Icon }) => (
                      <View
                        key={key}
                        className="flex-row items-center justify-between py-2"
                      >
                        <View className="flex-row items-center">
                          <Icon
                            size={16}
                            color="#6b7280"
                          />
                          <Text className="ml-3 text-gray-700">{label}</Text>
                        </View>
                        {expectation[key] ? (
                          <CircleCheck size={16} color="#10b981" />
                        ) : (
                          <CircleX size={16} color="#ef4444" />
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Erişim Gereksinimleri */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Erişim Gereksinimleri
                  </Text>

                  <View className="space-y-3">
                    {[
                      {
                        key: "requiresHospitalAccess",
                        label: "Hastane Erişimi",
                        Icon: Hospital,
                      },
                      {
                        key: "requiresSchoolAccess",
                        label: "Okul Erişimi",
                        Icon: School,
                      },
                      {
                        key: "requiresShoppingAccess",
                        label: "Alışveriş Merkezi",
                        Icon: ShoppingCart,
                      },
                      {
                        key: "requiresPublicTransport",
                        label: "Toplu Taşıma",
                        Icon: TrainFront,
                      },
                    ].map(({ key, label, Icon }) => (
                      <View
                        key={key}
                        className="flex-row items-center justify-between py-2"
                      >
                        <View className="flex-row items-center">
                          <Icon
                            size={16}
                            color="#6b7280"
                          />
                          <Text className="ml-3 text-gray-700">{label}</Text>
                        </View>
                        {expectation[key] ? (
                          <CircleCheck size={16} color="#10b981" />
                        ) : (
                          <CircleX size={16} color="#ef4444" />
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Kişisel Bilgiler */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Kişisel Bilgiler
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Meslek</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.occupation}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Aylık gelir</Text>
                      <Text className="font-semibold text-gray-900">
                        {formatCurrency(expectation.monthlyIncome)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Yaşayacak kişi sayısı
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.occupantCount}
                      </Text>
                    </View>

                    {expectation.hasChildren && (
                      <View className="flex-row items-center justify-between py-2">
                        <Text className="text-gray-700">Çocuk sayısı</Text>
                        <Text className="font-medium text-gray-900">
                          {expectation.childrenCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Kişisel Özellikler Badge'leri */}
                  <View className="flex-row flex-wrap gap-2 mt-4">
                    {expectation.isFamily && (
                      <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-700 text-sm font-medium">
                          Aile
                        </Text>
                      </View>
                    )}

                    {expectation.isStudent && (
                      <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-700 text-sm font-medium">
                          Öğrenci
                        </Text>
                      </View>
                    )}

                    {expectation.isSmoker && (
                      <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-700 text-sm font-medium">
                          Sigara İçiyor
                        </Text>
                      </View>
                    )}

                    {expectation.hasInsuredJob && (
                      <View className="bg-green-300 px-3 py-1 rounded-full">
                        <Text className="text-gray-900 text-sm font-medium">
                          Sigortalı İş
                        </Text>
                      </View>
                    )}

                    {expectation.hasPets && !!expectation.petTypes && (
                      <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-700 text-sm font-medium">
                          Evcil Hayvan: {expectation.petTypes}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Ödeme ve Garanti */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Ödeme ve Garanti
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <CreditCard
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Depozito ödeyebilir
                        </Text>
                      </View>
                      {expectation.canPayDeposit ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Handshake
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Kefil gösterebilir
                        </Text>
                      </View>
                      {expectation.canProvideGuarantor ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <FileCheck
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="ml-3 text-gray-700">
                          Referans verebilir
                        </Text>
                      </View>
                      {expectation.canProvideReference ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>
                  </View>
                </View>

                {/* Kiralama Tercihleri */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Kiralama Tercihleri
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Kısa süreli kiraya açık
                      </Text>
                      {expectation.preferShortTerm ? (
                        <CircleCheck size={16} color="#10b981" />
                      ) : (
                        <CircleX size={16} color="#ef4444" />
                      )}
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Tercih edilen kiralama süresi
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.preferredRentalPeriod === 1
                          ? "6 ay"
                          : expectation.preferredRentalPeriod === 2
                          ? "1 yıl"
                          : expectation.preferredRentalPeriod === 3
                          ? "2 yıl"
                          : "Uzun vadeli"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        En erken taşınma tarihi
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {formatDate(expectation.earliestMoveInDate)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Yaşam Tarzı Tercihleri */}
                <View className="py-2">
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Yaşam Tarzı Tercihleri
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">
                        Komşu ilişkisi tercihi
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.neighborRelationPreference === 1
                          ? "Samimi"
                          : expectation.neighborRelationPreference === 2
                          ? "Mesafeli"
                          : "Normal"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700">Gürültü toleransı</Text>
                      <Text className="font-medium text-gray-900">
                        {expectation.noisePreference === 1
                          ? "Düşük"
                          : expectation.noisePreference === 2
                          ? "Orta"
                          : "Yüksek"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Güvenlik Tercihleri */}
                {!!expectation.securityPreferences && (
                  <View className="py-2">
                    <Text
                      style={{ fontSize: 18 }}
                      className="font-semibold text-gray-900 mb-3"
                    >
                      Güvenlik Tercihleri
                    </Text>
                    <Text className="text-gray-700 leading-6">
                      {expectation.securityPreferences}
                    </Text>
                  </View>
                )}

                {/* Ek Notlar */}
                {!!expectation.additionalNotes && (
                  <View className="py-2">
                    <Text
                      style={{ fontSize: 18 }}
                      className="font-semibold text-gray-900 mb-3"
                    >
                      Ek Notlar
                    </Text>
                    <Text className="text-gray-700 leading-6">
                      {expectation.additionalNotes}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
        {/* REVIEWS TAB - DÜZELTİLMİŞ */}
        {activeTab === "reviews" && (
          <View className="gap-4">
            {/* Rating Özeti */}
            <View className="py-2 items-center">
              <Text
                style={{ fontSize: 22 }}
                className="font-semibold text-gray-900 mb-4"
              >
                Değerlendirme Özeti
              </Text>

              <View className="items-center mb-4">
                <View className="flex-row items-center mb-2">
                  {renderStarRating(userProfile?.profileRating || 0, 24)}
                </View>
                <Text
                  style={{ fontSize: 32 }}
                  className="font-bold text-gray-900"
                >
                  {userProfile?.profileRating
                    ? userProfile.profileRating.toFixed(1)
                    : "0.0"}
                </Text>
                <Text className="text-gray-500">
                  {userProfile?.ratingCount || 0} değerlendirme
                </Text>
              </View>
            </View>

            {/* Son Değerlendirmeler - DÜZELTİLMİŞ */}
            {userProfile?.profileMessages?.length > 0 ? (
              <View className="py-2">
                <View className="items-center">
                  <Text
                    style={{ fontSize: 22 }}
                    className="font-semibold text-gray-900 mb-4"
                  >
                    Son Değerlendirmeler
                  </Text>
                </View>
                {userProfile.profileMessages.map((message, index) => (
                  <View
                    key={message.id}
                    className={`py-4 ${
                      index < userProfile.profileMessages.length - 1 ? "" : ""
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-gray-200 rounded-full justify-center items-center overflow-hidden">
                          {message.senderProfile?.profileImageUrl ? (
                            <Image
                              source={{
                                uri: message.senderProfile.profileImageUrl,
                              }}
                              style={{ width: 32, height: 32 }}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                              transition={200}
                            />
                          ) : (
                            <Text className="text-gray-600 font-semibold text-sm">
                              A
                            </Text>
                          )}
                        </View>
                        <Text className="ml-3 font-medium text-gray-900">
                          {message.senderProfile?.user?.name
                            ? `${message.senderProfile.user.name} ${
                                message.senderProfile.user.surname || ""
                              }`.trim()
                            : "Anonim Kullanıcı"}
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-sm">
                        {new Date(message.sentAt).toLocaleDateString("tr-TR")}
                      </Text>
                    </View>

                    <Text className="text-gray-700 text-sm leading-5">
                      {message.content}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              /* Değerlendirme Yoksa */
              <View className="py-4">
                <View className="items-center">
                  <Star size={48} color="#d1d5db" />
                  <Text
                    style={{ fontSize: 18 }}
                    className="font-semibold text-gray-900 mt-4 mb-2 text-center"
                  >
                    Henüz Değerlendirme Yok
                  </Text>
                  <Text className="text-base text-gray-500 text-center">
                    Bu kullanıcı henüz hiç değerlendirme almamış.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        {/* İLANLAR TAB */}
        {activeTab === "listings" && userRole === "EVSAHIBI" && (
          <View style={{ minHeight: 400 }}>
            {landlordListingsLoading ? (
              <View className="items-center py-16">
                <Home size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-4">İlanlar yükleniyor...</Text>
              </View>
            ) : landlordListings && landlordListings.length > 0 ? (
              landlordListings.map((post) => (
                <TouchableOpacity
                  key={post.postId}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("PostDetail", { postId: post.postId })}
                  className="mb-4 border-b border-gray-100 pb-4"
                >
                  {/* Resim */}
                  <View className="rounded-2xl overflow-hidden bg-gray-100 mb-3" style={{ height: 200 }}>
                    {post.postImages && post.postImages.length > 0 ? (
                      <Image
                        source={{ uri: post.postImages[0].postImageUrl }}
                        style={{ width: "100%", height: 200 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="flex-1 justify-center items-center">
                        <Home size={40} color="#cbd5e1" />
                      </View>
                    )}
                    {/* Status badge */}
                    <View className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-lg">
                      <Text className="text-white text-xs font-semibold">
                        {post.status === 0 ? "Aktif" : post.status === 1 ? "Kiralandı" : "Kapalı"}
                      </Text>
                    </View>
                  </View>

                  {/* Bilgiler */}
                  <Text
                    style={{ fontSize: 16, fontWeight: "600" }}
                    className="text-gray-900 mb-1"
                    numberOfLines={2}
                  >
                    {post.ilanBasligi || "İlan başlığı yok"}
                  </Text>

                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">
                      {post.mahalle ? `${post.mahalle}, ` : ""}{post.ilce}, {post.il}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text style={{ fontSize: 17, fontWeight: "700" }} className="text-gray-900">
                      {post.kiraFiyati
                        ? `${post.kiraFiyati.toLocaleString("tr-TR")} ${post.paraBirimi || "TRY"}`
                        : "Fiyat belirtilmemiş"}
                      <Text style={{ fontSize: 13, fontWeight: "400" }} className="text-gray-400"> /ay</Text>
                    </Text>

                    <View className="flex-row gap-3">
                      {post.odaSayisi && (
                        <View className="flex-row items-center gap-1">
                          <BedDouble size={13} color="#6b7280" />
                          <Text className="text-gray-500 text-xs">{post.odaSayisi}</Text>
                        </View>
                      )}
                      {post.brutMetreKare && (
                        <View className="flex-row items-center gap-1">
                          <Ruler size={13} color="#6b7280" />
                          <Text className="text-gray-500 text-xs">{post.brutMetreKare} m²</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center py-16">
                <Home size={48} color="#d1d5db" />
                <Text
                  style={{ fontSize: 18 }}
                  className="font-semibold text-gray-900 mt-4 mb-2 text-center"
                >
                  Aktif İlan Yok
                </Text>
                <Text className="text-base text-gray-500 text-center">
                  Bu ev sahibinin aktif ilanı bulunmuyor.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Expectation yoksa gösterilecek mesaj */}
        {(activeTab === "preferences" || activeTab === "requirements") &&
          !expectation && (
            <View className="py-4">
              <View className="items-center">
                <FileCheck
                  size={48}
                  color="#d1d5db"
                />
                <Text
                  style={{ fontSize: 18 }}
                  className="font-semibold text-gray-900 mt-4 mb-2 text-center"
                >
                  {userRole === "EVSAHIBI"
                    ? "Henüz Beklenti Profili Yok"
                    : "Henüz Tercih Profili Yok"}
                </Text>
                <Text className="text-base text-gray-500 text-center">
                  {userRole === "EVSAHIBI"
                    ? "Bu ev sahibi henüz kiracı beklenti profilini oluşturmamış."
                    : "Bu kiracı henüz tercih profilini oluşturmamış."}
                </Text>
              </View>
            </View>
          )}
        {/* Alt Boşluk */}
        <View className="h-8"></View>
      </ScrollView>
      <ProfileRateModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRateProfile}
        isLoading={profileActionLoading}
        profileData={userProfile}
      />
    </SafeAreaView>
  );
};

export default UserProfileScreen;

const ProfileAction = {
  AddFavorite: 0,
  RemoveFavorite: 1,
  RateProfile: 2,
  MessageProfile: 3,
};
