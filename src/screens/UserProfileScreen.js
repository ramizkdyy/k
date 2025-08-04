import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    Animated
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faChevronLeft,
    faMapMarkerAlt,
    faUser,
    faCalendar,
    faPhone,
    faEnvelope,
    faHeart,
    faMessage,
    faUserShield,
    faStar,
    faHome,
    faDollarSign,
    faUsers,
    faPaw,
    faGraduationCap,
    faSmoking,
    faShield,
    faCheckCircle,
    faTimesCircle,
    faBed,
    faRulerCombined,
    faTemperatureHigh,
    faParking,
    faElevator,
    faWifi,
    faTree,
    faCar,
    faHospital,
    faSchool,
    faShoppingCart,
    faSubway,
    faBalanceScale,
    faCreditCard,
    faHandshake,
    faFileContract,
    faBuilding,
    faClock,
    faMoneyBillWave,
} from "@fortawesome/pro-solid-svg-icons";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import {
    useGetLandlordProfileQuery,
    useGetTenantProfileQuery,
    apiSlice
} from "../redux/api/apiSlice";
import { useFocusEffect } from "@react-navigation/native";
import {
    selectProfileActionLoading,
    selectProfileActionError,
    clearProfileActionError,
} from "../redux/slices/profileSlice";
import ProfileRateModal from "../modals/ProfileRateModal";



const { width: screenWidth } = Dimensions.get('window');

const UserProfileScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();

    const { userId, userRole } = route.params;
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
    const [activeTab, setActiveTab] = useState('general');
    const [isFavorite, setIsFavorite] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);

    const currentUserProfile = useSelector(selectCurrentUser);
    const profileActionLoading = useSelector(selectProfileActionLoading);
    const profileActionError = useSelector(selectProfileActionError);
    const insets = useSafeAreaInsets();



    console.log("UserProfileScreen params:", { userId, userRole });

    const {
        data: profileData,
        isLoading: profileLoading,
        error: profileError,
        refetch: refetchProfile,
    } = userRole === "EVSAHIBI"
            ? useGetLandlordProfileQuery(userId)
            : useGetTenantProfileQuery(userId);

    const isOwnProfile = currentUserProfile?.id === userId;

    console.log("🔍 Current Redux State:", {
        profileActionLoading: profileActionLoading,
        profileActionError: profileActionError,
        showRatingModal: showRatingModal
    });

    const [profileAction] = apiSlice.endpoints.profileAction.useMutation();
    const handleRateProfile = async (ratingData) => {
        try {
            console.log("🎯 Rating başlatılıyor:", {
                senderUserId: currentUserProfile?.id,
                receiverUserId: userId,
                ratingValue: ratingData.rating,
                message: ratingData.message
            });

            // 1. Önce Rating Gönder
            const ratingResult = await profileAction({
                SenderUserId: currentUserProfile?.id,
                ReceiverUserId: userId,
                profileAction: 2, // RateProfile
                RatingValue: ratingData.rating,
            }).unwrap();

            console.log("✅ Rating gönderildi:", ratingResult);

            // 2. Eğer mesaj varsa, ayrı olarak MessageProfile gönder
            if (ratingData.message?.trim()) {
                console.log("📝 Mesaj gönderiliyor:", ratingData.message);

                const messageResult = await profileAction({
                    SenderUserId: currentUserProfile?.id,
                    ReceiverUserId: userId,
                    profileAction: 3, // MessageProfile
                    Message: ratingData.message.trim(),
                }).unwrap();

                console.log("✅ Mesaj gönderildi:", messageResult);
            }

            // İşlemler başarılı olduysa modal'ı kapat ve profili yenile
            if (ratingResult.isSuccess) {
                setShowRatingModal(false);
                Alert.alert(
                    "Başarılı",
                    ratingData.message?.trim()
                        ? "Değerlendirmeniz ve mesajınız gönderildi!"
                        : "Değerlendirmeniz gönderildi!"
                );
                refetchProfile();
            }

        } catch (error) {
            console.error('❌ Rating/Message hatası:', error);
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
                { text: "Tamam", onPress: () => dispatch(clearProfileActionError()) }
            ]);
        }
    }, [profileActionError, dispatch]);



    console.log("API Response:", { profileData, profileError, profileLoading });

    const userProfile = profileData?.isSuccess ? profileData.result : null;
    console.log("Parsed userProfile:", userProfile);

    const expectation = userRole === "EVSAHIBI"
        ? userProfile?.tenantExpectation
        : userProfile?.landLordExpectation;

    const getCompatibilityColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'yüksek':
            case 'high':
                return 'bg-green-500';
            case 'orta':
            case 'medium':
                return 'bg-yellow-500';
            case 'düşük':
            case 'low':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const handleFavoriteToggle = () => {
        setIsFavorite(!isFavorite);
    };

    const handleSendMessage = () => {
        navigation.navigate("Messages", {
            recipientId: userId,
            recipientName: userProfile?.user?.name + " " + userProfile?.user?.surname,
        });
    };

    // Tab Management for hiding bottom tabs
    // Tab Management for hiding bottom tabs
    useFocusEffect(
        useCallback(() => {
            console.log('🔍 UserProfile focused, userRole:', userRole);

            const parent = navigation.getParent();
            console.log('👨‍👦 Parent exists:', !!parent);

            if (parent) {
                parent.setOptions({
                    tabBarStyle: { display: "none" },
                });
                console.log('✅ Tab bar hidden');
            }

            return () => {
                console.log('👋 UserProfile cleanup, userRole:', userRole);

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
                        console.log('✅ Landlord tab bar restored');
                    } else if (userRole === "KIRACI") {
                        parent.setOptions({
                            tabBarStyle: {
                                backgroundColor: "#fff",
                                borderTopColor: "#e0e0e0",
                                paddingTop: 5,
                                paddingBottom: 5,
                            },
                        });
                        console.log('✅ Tenant tab bar restored');
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
                    text: "Bildir", style: "destructive", onPress: () => {
                        Alert.alert("Başarılı", "Kullanıcı bildirildi.");
                    }
                },
            ]
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const renderStarRating = (rating, size = 16) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        size={size}
                        color="#fbbf24"
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        size={size}
                        color="#fbbf24"
                        style={{ opacity: 0.5 }}
                    />
                );
            } else {
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        size={size}
                        color="#e5e7eb"
                    />
                );
            }
        }
        return stars;
    };

    const getPolicyText = (policyValue, type) => {
        switch (type) {
            case 'pet':
                return policyValue === 1 ? 'İzin verilmiyor' :
                    policyValue === 2 ? 'Kısıtlı izin' :
                        policyValue === 3 ? 'İzin veriliyor' : 'Belirtilmemiş';
            case 'smoking':
                return policyValue === 1 ? 'İçilemiyor' :
                    policyValue === 2 ? 'Kısıtlı' :
                        policyValue === 3 ? 'İçilebilir' : 'Belirtilmemiş';
            case 'student':
                return policyValue === 1 ? 'Öğrenci alınmıyor' :
                    policyValue === 2 ? 'Kısıtlı' :
                        policyValue === 3 ? 'Öğrenci alınıyor' : 'Belirtilmemiş';
            case 'building':
                return policyValue === 1 ? 'Yönetim onayı gerekli değil' :
                    policyValue === 2 ? 'Yönetim onayı gerekli' : 'Belirtilmemiş';
            case 'maintenance':
                return policyValue === 1 ? 'Kiracı ödeyecek' :
                    policyValue === 2 ? 'Ev sahibi ödeyecek' : 'Belirtilmemiş';
            case 'currency':
                return policyValue === 1 ? 'TRY' :
                    policyValue === 2 ? 'USD' :
                        policyValue === 3 ? 'EUR' : 'Diğer';
            default:
                return 'Belirtilmemiş';
        }
    };

    if (profileLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#6b7280" />
                <Text className="mt-3 text-base text-gray-500">Profil yükleniyor...</Text>
            </View>
        );
    }

    if (profileError || !userProfile) {
        return (
            <View className="flex-1 justify-center items-center bg-white px-6">
                <FontAwesomeIcon icon={faUser} size={64} color="#d1d5db" />
                <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">Profil Bulunamadı</Text>
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
        <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            {/* Header */}
            {/* Animated Header - ProfileScreen'den eklendi */}
            <View className="bg-white z-10">
                <Animated.View
                    style={{
                        height: headerContainerHeight,
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        className="bg-white px-5 py-4 flex-row items-center justify-center relative"
                        style={{
                            height: 50,
                            opacity: headerOpacity,
                            transform: [{ translateY: headerTranslateY }],
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="absolute left-5 w-10 h-10 rounded-full justify-center items-center"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} size={20} color="#374151" />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 20, fontWeight: 600 }} className="text-gray-900">
                            Profil
                        </Text>

                        <TouchableOpacity
                            onPress={handleReport}
                            className="absolute right-5 w-10 h-10 rounded-full justify-center items-center"
                        >
                            <FontAwesomeIcon icon={faUserShield} size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>

            <Animated.ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false,
                    }
                )}
                scrollEventThrottle={1}
            >                {/* Profile Header */}
                <View className="items-center py-6">
                    <View
                        style={{ boxShadow: "0px 0px 12px #00000014" }}
                        className="w-24 h-24 rounded-full bg-white justify-center items-center mb-4 overflow-hidden"
                    >
                        {userProfile?.profileImageUrl && userProfile?.profileImageUrl !== "default_profile_image_url" ? (
                            <Image
                                source={{ uri: userProfile.profileImageUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ fontSize: 40 }} className="text-gray-900 font-bold">
                                {user?.name?.charAt(0) || "P"}
                            </Text>
                        )}
                    </View>

                    <Text style={{ fontSize: 20 }} className="font-bold text-gray-900 mb-1">
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
                    {route.params?.matchScore && (
                        <View className="mb-4">
                            <View className={`px-4 py-2 rounded-full ${getCompatibilityColor(route.params.compatibilityLevel)}`}>
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
                                className={`px-6 py-3 rounded-xl flex-row items-center ${isFavorite ? "bg-red-500" : "bg-gray-100"
                                    }`}
                            >
                                <FontAwesomeIcon
                                    icon={faHeart}
                                    size={16}
                                    color={isFavorite ? "white" : "#6b7280"}
                                />
                            </TouchableOpacity>

                            {/* Mesaj Butonu */}
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                className="bg-gray-900 px-6 py-3 rounded-xl flex-row items-center"
                            >
                                <FontAwesomeIcon icon={faMessage} size={16} color="white" />
                            </TouchableOpacity>

                            {/* YENİ: Değerlendir Butonu */}
                            <TouchableOpacity
                                onPress={() => setShowRatingModal(true)}
                                disabled={profileActionLoading}
                                className="bg-yellow-500 px-6 py-3 rounded-xl flex-row items-center"
                            >
                                {profileActionLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <FontAwesomeIcon icon={faStar} size={16} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Tab Navigation */}
                <View className="mb-6">
                    <View className="flex-row gap-2"> {/* gap-3'ü gap-2 yap, 4 buton sığsın */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('general')}
                            className={`flex-1 py-3 px-3 rounded-full ${activeTab === 'general' ? 'bg-gray-900' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-center font-medium text-xs ${activeTab === 'general' ? 'text-white' : 'text-gray-700'}`}>
                                Genel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setActiveTab('preferences')}
                            className={`flex-1 py-3 px-3 rounded-full ${activeTab === 'preferences' ? 'bg-gray-900' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-center font-medium text-xs ${activeTab === 'preferences' ? 'text-white' : 'text-gray-700'}`}>
                                {userRole === "EVSAHIBI" ? "Beklenti" : "Tercih"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setActiveTab('requirements')}
                            className={`flex-1 py-3 px-3 rounded-full ${activeTab === 'requirements' ? 'bg-gray-900' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-center font-medium text-xs ${activeTab === 'requirements' ? 'text-white' : 'text-gray-700'}`}>
                                {userRole === "EVSAHIBI" ? "Koşul" : "Gerek"}
                            </Text>
                        </TouchableOpacity>

                        {/* YENİ 4. TAB */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('reviews')}
                            className={`flex-1 py-3 px-3 rounded-full ${activeTab === 'reviews' ? 'bg-gray-900' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-center font-medium text-xs ${activeTab === 'reviews' ? 'text-white' : 'text-gray-700'}`}>
                                Değerlen.
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <View className="gap-4" style={{ minHeight: 600 }}>
                        {/* Kişisel Bilgiler */}
                        <View className="bg-white rounded-xl p-4 border border-gray-100">
                            <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                Kişisel Bilgiler
                            </Text>

                            <View className="gap-3">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faEnvelope} size={16} color="#6b7280" />
                                    <Text className="ml-3 text-gray-700 flex-1">{user?.email}</Text>
                                </View>

                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faPhone} size={16} color="#6b7280" />
                                    <Text className="ml-3 text-gray-700 flex-1">{user?.phoneNumber}</Text>
                                </View>

                                {user?.gender && (
                                    <View className="flex-row items-center">
                                        <FontAwesomeIcon icon={faUser} size={16} color="#6b7280" />
                                        <Text className="ml-3 text-gray-700 flex-1">
                                            {user.gender === 'Man' ? 'Erkek' : 'Kadın'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* İlan Sayısı (Ev Sahibi için) */}
                        {userRole === "EVSAHIBI" && userProfile?.rentalPosts && (
                            <View className="bg-white rounded-xl p-4 border border-gray-100">
                                <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                    İlan Bilgileri
                                </Text>

                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <FontAwesomeIcon icon={faBuilding} size={20} color="#6b7280" />
                                        <Text className="ml-3 text-gray-700">Aktif İlan Sayısı</Text>
                                    </View>
                                    <View className=" px-3 py-1 rounded-full">
                                        <Text className="text-gray-900 font-semibold">
                                            {userProfile.rentalPosts.length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Profil Açıklaması */}
                        {userProfile?.profileDescription && (
                            <View className="bg-white rounded-xl p-4 border border-gray-100">
                                <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-3">
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
                {activeTab === 'preferences' && expectation && (
                    <View className="gap-4">
                        {userRole === "EVSAHIBI" ? (
                            // EV SAHİBİ BEKLENTI PROFİLİ
                            <>
                                {/* Kiracı Beklentileri */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
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
                                                {getPolicyText(expectation.preferredCurrency, 'currency')}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Min. kiralama süresi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.minimumRentalPeriod} ay
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Maksimum yaşayacak kişi</Text>
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
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Finansal Koşullar
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Depozito gerekli</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.isDepositRequired ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isDepositRequired ? "#10b981" : "#ef4444"}
                                            />
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
                                            <FontAwesomeIcon
                                                icon={expectation.isMaintenanceFeeIncluded ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isMaintenanceFeeIncluded ? "#10b981" : "#ef4444"}
                                            />
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
                                                        {getPolicyText(expectation.maintenanceFeeResponsibility, 'maintenance')}
                                                    </Text>
                                                </View>
                                            </>
                                        )}

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Banka transferi gerekli</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.isBankTransferRequired ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isBankTransferRequired ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Yabancı para kabul</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.isForeignCurrencyAccepted ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isForeignCurrencyAccepted ? "#10b981" : "#ef4444"}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Politikalar */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Ev Kuralları
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faPaw} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Evcil hayvan politikası</Text>
                                            </View>
                                            <Text className="font-medium text-gray-900">
                                                {getPolicyText(expectation.petPolicy, 'pet')}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faSmoking} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Sigara politikası</Text>
                                            </View>
                                            <Text className="font-medium text-gray-900">
                                                {getPolicyText(expectation.smokingPolicy, 'smoking')}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faGraduationCap} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Öğrenci politikası</Text>
                                            </View>
                                            <Text className="font-medium text-gray-900">
                                                {getPolicyText(expectation.studentPolicy, 'student')}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faBuilding} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Yönetim onayı</Text>
                                            </View>
                                            <Text className="font-medium text-gray-900">
                                                {getPolicyText(expectation.buildingApprovalPolicy, 'building')}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Sadece aile</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.familyOnly ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.familyOnly ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Çocuklu aile kabul</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.acceptChildrenFamily ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.acceptChildrenFamily ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Devlet memuru tercihi</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.preferGovernmentEmployee ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.preferGovernmentEmployee ? "#10b981" : "#ef4444"}
                                            />
                                        </View>
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Kısa süreli kiralama</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.isShortTermRentalAvailable ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isShortTermRentalAvailable ? "#10b981" : "#ef4444"}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </>
                        ) : (
                            // KİRACI TERCİH PROFİLİ
                            <>
                                {/* Konum Tercihleri */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Konum Tercihleri
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center py-2">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} size={16} color="#ef4444" />
                                            <Text className="ml-3 text-gray-700 flex-1">
                                                {expectation.district}, {expectation.city}
                                            </Text>
                                        </View>

                                        {expectation.alternativeDistricts && (
                                            <View className="py-2">
                                                <Text className="text-gray-500 text-sm mb-1">Alternatif bölgeler:</Text>
                                                <Text className="text-gray-700">{expectation.alternativeDistricts}</Text>
                                            </View>
                                        )}

                                        {expectation.preferredNeighborhoods && (
                                            <View className="py-2">
                                                <Text className="text-gray-500 text-sm mb-1">Tercih edilen mahalleler:</Text>
                                                <Text className="text-gray-700">{expectation.preferredNeighborhoods}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Ev Özellikleri */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Ev Özellikleri
                                    </Text>

                                    <View className="flex-row justify-between mb-4">
                                        <View className="flex-1 bg-gray-50 rounded-xl p-4 mr-2 items-center">
                                            <FontAwesomeIcon icon={faBed} size={24} color="#6b7280" />
                                            <Text className="text-sm text-gray-500 mt-2">Min. Oda</Text>
                                            <Text className="text-gray-900 font-bold">
                                                {expectation.minRoomCount}
                                            </Text>
                                        </View>

                                        <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2 items-center">
                                            <FontAwesomeIcon icon={faRulerCombined} size={24} color="#6b7280" />
                                            <Text className="text-sm text-gray-500 mt-2">Min. m²</Text>
                                            <Text className="text-gray-900 font-bold">
                                                {expectation.minSquareMeters}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Maksimum bina yaşı</Text>
                                            <Text className="font-medium text-gray-900">{expectation.maxBuildingAge} yıl</Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Tercih edilen kat</Text>
                                            <Text className="font-medium text-gray-900">{expectation.preferredFloorRange}</Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Isıtma tipi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.preferredHeatingType === 1 ? 'Doğalgaz' :
                                                    expectation.preferredHeatingType === 2 ? 'Elektrik' :
                                                        expectation.preferredHeatingType === 3 ? 'Merkezi' : 'Diğer'}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Eşyalı ev tercihi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.furnishedPreference === 1 ? 'Eşyalı' :
                                                    expectation.furnishedPreference === 2 ? 'Eşyasız' : 'Fark etmez'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Bütçe Detayları */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
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
                                                {expectation.maintenanceFeePreference === 1 ? 'Düşük' :
                                                    expectation.maintenanceFeePreference === 2 ? 'Orta' : 'Yüksek'}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Tercih edilen ödeme yöntemi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.preferredPaymentMethod === 1 ? 'Nakit' :
                                                    expectation.preferredPaymentMethod === 2 ? 'Banka Transferi' :
                                                        expectation.preferredPaymentMethod === 3 ? 'Kredi Kartı' : 'Diğer'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* REQUIREMENTS TAB */}
                {activeTab === 'requirements' && expectation && (
                    <View className="gap-4">
                        {userRole === "EVSAHIBI" ? (
                            // EV SAHİBİ GEREKSİNİMLERİ
                            <>
                                {/* Kiracıdan Beklenenler */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Kiracıdan Beklenenler
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faFileContract} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Gelir belgesi gerekli</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.isIncomeProofRequired ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isIncomeProofRequired ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faHandshake} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Kefil gerekli</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.isGuarantorRequired ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isGuarantorRequired ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faFileContract} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Referans gerekli</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.isReferenceRequired ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isReferenceRequired ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faShield} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Sigortalı iş gerekli</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.isInsuredJobRequired ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.isInsuredJobRequired ? "#10b981" : "#ef4444"}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Kabul Edilen Evcil Hayvan Türleri */}
                                {expectation.acceptedPetTypes && (
                                    <View className="bg-white rounded-xl p-4 border border-gray-100">
                                        <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-3">
                                            Kabul Edilen Evcil Hayvan Türleri
                                        </Text>
                                        <Text className="text-gray-700 leading-6">{expectation.acceptedPetTypes}</Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            // KİRACI GEREKSİNİMLERİ
                            <>
                                {/* Gerekli Özellikler */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Gerekli Özellikler
                                    </Text>

                                    <View className="space-y-3">
                                        {[
                                            { key: 'requiresElevator', label: 'Asansör', icon: faElevator },
                                            { key: 'requiresParking', label: 'Otopark', icon: faParking },
                                            { key: 'requiresBalcony', label: 'Balkon', icon: faHome },
                                            { key: 'requiresGarden', label: 'Bahçe', icon: faTree },
                                            { key: 'requiresInternet', label: 'İnternet', icon: faWifi },
                                        ].map(({ key, label, icon }) => (
                                            <View key={key} className="flex-row items-center justify-between py-2">
                                                <View className="flex-row items-center">
                                                    <FontAwesomeIcon icon={icon} size={16} color="#6b7280" />
                                                    <Text className="ml-3 text-gray-700">{label}</Text>
                                                </View>
                                                <FontAwesomeIcon
                                                    icon={expectation[key] ? faCheckCircle : faTimesCircle}
                                                    size={16}
                                                    color={expectation[key] ? "#10b981" : "#ef4444"}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Erişim Gereksinimleri */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Erişim Gereksinimleri
                                    </Text>

                                    <View className="space-y-3">
                                        {[
                                            { key: 'requiresHospitalAccess', label: 'Hastane Erişimi', icon: faHospital },
                                            { key: 'requiresSchoolAccess', label: 'Okul Erişimi', icon: faSchool },
                                            { key: 'requiresShoppingAccess', label: 'Alışveriş Merkezi', icon: faShoppingCart },
                                            { key: 'requiresPublicTransport', label: 'Toplu Taşıma', icon: faSubway },
                                        ].map(({ key, label, icon }) => (
                                            <View key={key} className="flex-row items-center justify-between py-2">
                                                <View className="flex-row items-center">
                                                    <FontAwesomeIcon icon={icon} size={16} color="#6b7280" />
                                                    <Text className="ml-3 text-gray-700">{label}</Text>
                                                </View>
                                                <FontAwesomeIcon
                                                    icon={expectation[key] ? faCheckCircle : faTimesCircle}
                                                    size={16}
                                                    color={expectation[key] ? "#10b981" : "#ef4444"}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Kişisel Bilgiler */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Kişisel Bilgiler
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Meslek</Text>
                                            <Text className="font-medium text-gray-900">{expectation.occupation}</Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Aylık gelir</Text>
                                            <Text className="font-semibold text-gray-900">
                                                {formatCurrency(expectation.monthlyIncome)}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Yaşayacak kişi sayısı</Text>
                                            <Text className="font-medium text-gray-900">{expectation.occupantCount}</Text>
                                        </View>

                                        {expectation.hasChildren && (
                                            <View className="flex-row items-center justify-between py-2">
                                                <Text className="text-gray-700">Çocuk sayısı</Text>
                                                <Text className="font-medium text-gray-900">{expectation.childrenCount}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Kişisel Özellikler Badge'leri */}
                                    <View className="flex-row flex-wrap gap-2 mt-4">
                                        {expectation.isFamily && (
                                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                                <Text className="text-gray-700 text-sm font-medium">Aile</Text>
                                            </View>
                                        )}

                                        {expectation.isStudent && (
                                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                                <Text className="text-gray-700 text-sm font-medium">Öğrenci</Text>
                                            </View>
                                        )}

                                        {expectation.isSmoker && (
                                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                                <Text className="text-gray-700 text-sm font-medium">Sigara İçiyor</Text>
                                            </View>
                                        )}

                                        {expectation.hasInsuredJob && (
                                            <View className="bg-green-300 px-3 py-1 rounded-full">
                                                <Text className="text-gray-900 text-sm font-medium">Sigortalı İş</Text>
                                            </View>
                                        )}

                                        {expectation.hasPets && expectation.petTypes && (
                                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                                <Text className="text-gray-700 text-sm font-medium">
                                                    Evcil Hayvan: {expectation.petTypes}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Ödeme ve Garanti */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Ödeme ve Garanti
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faCreditCard} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Depozito ödeyebilir</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.canPayDeposit ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.canPayDeposit ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faHandshake} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Kefil gösterebilir</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.canProvideGuarantor ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.canProvideGuarantor ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center">
                                                <FontAwesomeIcon icon={faFileContract} size={16} color="#6b7280" />
                                                <Text className="ml-3 text-gray-700">Referans verebilir</Text>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={expectation.canProvideReference ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.canProvideReference ? "#10b981" : "#ef4444"}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Kiralama Tercihleri */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Kiralama Tercihleri
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Kısa süreli kiraya açık</Text>
                                            <FontAwesomeIcon
                                                icon={expectation.preferShortTerm ? faCheckCircle : faTimesCircle}
                                                size={16}
                                                color={expectation.preferShortTerm ? "#10b981" : "#ef4444"}
                                            />
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Tercih edilen kiralama süresi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.preferredRentalPeriod === 1 ? '6 ay' :
                                                    expectation.preferredRentalPeriod === 2 ? '1 yıl' :
                                                        expectation.preferredRentalPeriod === 3 ? '2 yıl' : 'Uzun vadeli'}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">En erken taşınma tarihi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {formatDate(expectation.earliestMoveInDate)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Yaşam Tarzı Tercihleri */}
                                <View className="bg-white rounded-xl p-4 border border-gray-100">
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-4">
                                        Yaşam Tarzı Tercihleri
                                    </Text>

                                    <View className="space-y-3">
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Komşu ilişkisi tercihi</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.neighborRelationPreference === 1 ? 'Samimi' :
                                                    expectation.neighborRelationPreference === 2 ? 'Mesafeli' : 'Normal'}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700">Gürültü toleransı</Text>
                                            <Text className="font-medium text-gray-900">
                                                {expectation.noisePreference === 1 ? 'Düşük' :
                                                    expectation.noisePreference === 2 ? 'Orta' : 'Yüksek'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Güvenlik Tercihleri */}
                                {expectation.securityPreferences && (
                                    <View className="bg-white rounded-xl p-4 border border-gray-100">
                                        <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-3">
                                            Güvenlik Tercihleri
                                        </Text>
                                        <Text className="text-gray-700 leading-6">{expectation.securityPreferences}</Text>
                                    </View>
                                )}

                                {/* Ek Notlar */}
                                {expectation.additionalNotes && (
                                    <View className="bg-white rounded-xl p-4 border border-gray-100">
                                        <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mb-3">
                                            Ek Notlar
                                        </Text>
                                        <Text className="text-gray-700 leading-6">{expectation.additionalNotes}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* REVIEWS TAB - DÜZELTİLMİŞ */}
                {activeTab === 'reviews' && (
                    <View className="gap-4">
                        {/* Rating Özeti */}
                        <View className="bg-white rounded-xl p-4 items-center">
                            <Text style={{ fontSize: 22 }} className="font-semibold text-gray-900 mb-4">
                                Değerlendirme Özeti
                            </Text>

                            <View className="items-center mb-4">
                                <View className="flex-row items-center mb-2">
                                    {renderStarRating(userProfile?.profileRating || 0, 24)}
                                </View>
                                <Text style={{ fontSize: 32 }} className="font-bold text-gray-900">
                                    {userProfile?.profileRating ? userProfile.profileRating.toFixed(1) : '0.0'}
                                </Text>
                                <Text className="text-gray-500">
                                    {userProfile?.ratingCount || 0} değerlendirme
                                </Text>
                            </View>
                        </View>

                        {/* Son Değerlendirmeler - DÜZELTİLMİŞ */}
                        {userProfile?.profileMessages?.length > 0 ? (
                            <View className="bg-white rounded-xl py-4 px-2">
                                <View className="items-center" >
                                    <Text style={{ fontSize: 22 }} className="font-semibold text-gray-900 mb-4">
                                        Son Değerlendirmeler
                                    </Text>
                                </View>
                                {userProfile.profileMessages.map((message, index) => (
                                    <View
                                        key={message.id}
                                        className={`py-4 ${index < userProfile.profileMessages.length - 1 ? '' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between mb-2">
                                            <View className="flex-row items-center">
                                                <View className="w-8 h-8 bg-gray-200 rounded-full justify-center items-center overflow-hidden">
                                                    {message.senderProfile?.profileImageUrl ? (
                                                        <Image
                                                            source={{ uri: message.senderProfile.profileImageUrl }}
                                                            style={{ width: '100%', height: '100%' }}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <Text className="text-gray-600 font-semibold text-sm">
                                                            A
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text className="ml-3 font-medium text-gray-900">
                                                    {message.senderProfile?.user?.name
                                                        ? `${message.senderProfile.user.name} ${message.senderProfile.user.surname || ''}`.trim()
                                                        : 'Anonim Kullanıcı'
                                                    }
                                                </Text>
                                            </View>
                                            <Text className="text-gray-500 text-sm">
                                                {new Date(message.sentAt).toLocaleDateString('tr-TR')}
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
                            <View className="bg-white rounded-xl p-6 border border-gray-100">
                                <View className="items-center">
                                    <FontAwesomeIcon icon={faStar} size={48} color="#d1d5db" />
                                    <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mt-4 mb-2 text-center">
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

                {/* Expectation yoksa gösterilecek mesaj */}
                {(activeTab === 'preferences' || activeTab === 'requirements') && !expectation && (
                    <View className="bg-white rounded-xl p-6 border border-gray-100">
                        <View className="items-center">
                            <FontAwesomeIcon icon={faFileContract} size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 18 }} className="font-semibold text-gray-900 mt-4 mb-2 text-center">
                                {userRole === "EVSAHIBI" ? "Henüz Beklenti Profili Yok" : "Henüz Tercih Profili Yok"}
                            </Text>
                            <Text className="text-base text-gray-500 text-center">
                                {userRole === "EVSAHIBI"
                                    ? "Bu ev sahibi henüz kiracı beklenti profilini oluşturmamış."
                                    : "Bu kiracı henüz tercih profilini oluşturmamış."
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* Alt Boşluk */}
                <View className="h-8"></View>
            </Animated.ScrollView>
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