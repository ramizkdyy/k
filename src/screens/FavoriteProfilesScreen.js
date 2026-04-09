// FavoriteProfilesScreen.js - GetOwnTenantProfile/GetOwnLandlordProfile ile güncellenmiş VE matchingScore düzeltilmiş
import React, { useState, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Dimensions,
    TextInput,
    Animated,
    StatusBar as RNStatusBar,
} from "react-native";
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
    useGetOwnTenantProfileQuery,
    useGetOwnLandlordProfileQuery,
    apiSlice,
} from "../redux/api/apiSlice";
import { ChevronLeft, Heart, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlatformBlurView from "../components/PlatformBlurView";

// ✅ Component import'ları
import FavoriteLandlordCard from "../components/FavoriteLandlordCard";
import FavoriteTenantCard from "../components/FavoriteTenantCard";

const { width: screenWidth } = Dimensions.get("window");

const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
    const opacity = useSharedValue(1);
    React.useEffect(() => {
        opacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
    }, []);
    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <Reanimated.View
            style={[{ width, height, borderRadius, backgroundColor: "#e5e7eb" }, animStyle, style]}
        />
    );
};

const FavoriteProfileCardSkeleton = () => (
    <View style={{ marginHorizontal: 10 }} className="mb-4 pt-4">
        <View
            className="bg-white p-6"
            style={{
                borderRadius: 30,
                borderWidth: 0.5,
                borderColor: "#e5e7eb",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
            }}
        >
            {/* Avatar + isim merkezi */}
            <View className="items-center mb-4">
                <SkeletonBox width={80} height={80} borderRadius={40} />
                <SkeletonBox width={140} height={18} borderRadius={6} style={{ marginTop: 12 }} />
                <SkeletonBox width={70} height={14} borderRadius={10} style={{ marginTop: 8 }} />
                {/* Yıldızlar */}
                <SkeletonBox width={100} height={12} borderRadius={6} style={{ marginTop: 10 }} />
                {/* Match bar */}
                <SkeletonBox width={screenWidth * 0.5} height={6} borderRadius={3} style={{ marginTop: 12 }} />
                <View className="flex-row justify-between w-full" style={{ width: screenWidth * 0.5, marginTop: 4 }}>
                    <SkeletonBox width={80} height={10} borderRadius={4} />
                    <SkeletonBox width={30} height={10} borderRadius={4} />
                </View>
            </View>

            {/* Detay satırları */}
            {[0, 1, 2, 3].map((i) => (
                <View key={i} className="flex-row justify-between items-center mb-3">
                    <SkeletonBox width={90} height={13} borderRadius={4} />
                    <SkeletonBox width={70} height={13} borderRadius={4} />
                </View>
            ))}

            {/* Açıklama */}
            <SkeletonBox width="100%" height={48} borderRadius={12} style={{ marginBottom: 16, marginTop: 4 }} />

            {/* Butonlar */}
            <View className="flex-row gap-3">
                <SkeletonBox height={52} borderRadius={26} style={{ flex: 1 }} />
                <SkeletonBox height={52} borderRadius={26} style={{ flex: 1 }} />
            </View>
        </View>
    </View>
);

const FavoriteProfilesScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const [refreshing, setRefreshing] = useState(false);
    const [removingFavorite, setRemovingFavorite] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // ===== ANIMATION SETUP =====
    const scrollY = useRef(new Animated.Value(0)).current;
    const SCROLL_DISTANCE = 50;

    // Header animasyonları
    const titleOpacity = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const titleScale = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
    });

    const searchBarTranslateY = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [0, -60],
        extrapolate: 'clamp',
    });

    const searchBarWidth = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [
            screenWidth - 32,
            screenWidth - 32 - 60 - 8
        ],
        extrapolate: 'clamp',
    });

    const searchBarMarginRight = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [0, 88],
        extrapolate: 'clamp',
    });

    const headerContainerHeight = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [
            insets.top + 50 + 60 + 16,
            insets.top + 60 + 8
        ],
        extrapolate: 'clamp',
    });

    // YENİ: Role göre doğru endpoint'i kullan
    const {
        data: ownTenantProfileData,
        isLoading: tenantProfileLoading,
        refetch: refetchTenantProfile,
    } = useGetOwnTenantProfileQuery(currentUser?.id, {
        skip: !currentUser?.id || userRole !== "KIRACI",
    });

    const {
        data: ownLandlordProfileData,
        isLoading: landlordProfileLoading,
        refetch: refetchLandlordProfile,
    } = useGetOwnLandlordProfileQuery(currentUser?.id, {
        skip: !currentUser?.id || userRole !== "EVSAHIBI",
    });

    // Role göre doğru data'yı seç
    const profileLoading = userRole === "KIRACI" ? tenantProfileLoading : landlordProfileLoading;
    const ownProfileData = userRole === "KIRACI" ? ownTenantProfileData : ownLandlordProfileData;
    const refetchProfile = userRole === "KIRACI" ? refetchTenantProfile : refetchLandlordProfile;

    // Favori silme mutation
    const [profileAction] = apiSlice.endpoints.profileAction.useMutation();

    // Response'dan verileri çıkar
    const tenantProfile = ownProfileData?.result?.tenantProfile;
    const landlordProfile = ownProfileData?.result?.landlordProfile;

    // Role göre favori profilleri al
    const favoriteProfiles = userRole === "KIRACI"
        ? tenantProfile?.favoriteLandlordProfile || []
        : landlordProfile?.favoriteTenantProfile || [];

    // Matching skorları al
    const matchingScores = userRole === "KIRACI"
        ? ownProfileData?.result?.matchingScoreWithFavoriteLandLordProfiles || {}
        : ownProfileData?.result?.matchingScoreWithFavoriteTenantProfiles || {};

    // Favori profilleri zenginleştir (matching score ekle)
    const enrichedFavorites = favoriteProfiles.map(profile => ({
        ...profile,
        matchingScore: matchingScores[profile.userId] || matchingScores[profile.landlordProfileId] || matchingScores[profile.tenantProfileId] || 0
    }));

    // 🔍 DEBUG: Matching score verilerini kontrol et

    // Arama filtresi
    const filteredFavorites = enrichedFavorites.filter(profile => {
        if (!searchQuery.trim()) return true;

        const searchLower = searchQuery.toLowerCase();
        const userName = profile.user ?
            `${profile.user.name} ${profile.user.surname}`.toLowerCase() : '';
        const email = profile.user?.email?.toLowerCase() || '';
        const description = profile.profileDescription?.toLowerCase() || '';

        return userName.includes(searchLower) ||
            email.includes(searchLower) ||
            description.includes(searchLower);
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetchProfile();
        setRefreshing(false);
    };

    const handleRemoveFromFavorites = (profileId, profileType) => {
        const profileName = profileType === "landlord" ? "ev sahibini" : "kiracıyı";

        Alert.alert(
            "Favorilerden Kaldır",
            `Bu ${profileName} favorilerinizden kaldırmak istiyor musunuz?`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kaldır",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setRemovingFavorite(true);

                            const targetProfile = favoriteProfiles.find(p =>
                                profileType === "landlord"
                                    ? p.landlordProfileId === profileId
                                    : p.tenantProfileId === profileId
                            );

                            if (!targetProfile?.userId) {
                                Alert.alert("Hata", "Profil bilgisi bulunamadı.");
                                return;
                            }

                            await profileAction({
                                SenderUserId: currentUser.id,
                                ReceiverUserId: targetProfile.userId,
                                profileAction: 1, // RemoveFavorite
                            }).unwrap();

                            // Profile'ı yenile
                            refetchProfile();
                        } catch (error) {
                            Alert.alert("Hata", "Favorilerden kaldırılırken bir hata oluştu.");
                        } finally {
                            setRemovingFavorite(false);
                        }
                    },
                },
            ]
        );
    };

    const handleProfilePress = (profile, profileType) => {
        navigation.navigate("UserProfile", {
            userId: profile.userId,
            userRole: profileType === "landlord" ? "EVSAHIBI" : "KIRACI",
        });
    };

    // Dynamic padding helper
    const getDynamicPaddingTop = () => {
        const normalPadding = insets.top + 50 + 60 + 32;
        return normalPadding;
    };

    // Profile type text'leri
    const profileType = userRole === "KIRACI" ? "Ev Sahipleri" : "Kiracılar";
    const emptyMessage = userRole === "KIRACI"
        ? "Henüz Favori Ev Sahibi Yok"
        : "Henüz Favori Kiracı Yok";

    const emptyDescription = userRole === "KIRACI"
        ? "Beğendiğiniz ev sahiplerini favorilerinize ekleyerek buradan kolayca erişebilirsiniz."
        : "Beğendiğiniz kiracıları favorilerinize ekleyerek buradan kolayca erişebilirsiniz.";

    // Animated Header Component
    const renderAnimatedHeader = () => {
        return (
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    height: headerContainerHeight,
                }}
            >
                {/* BlurView Background */}
                <PlatformBlurView
                    intensity={80}
                    tint="light"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                />

                {/* Semi-transparent overlay */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    }}
                />

                {/* Content Container */}
                <View style={{
                    paddingTop: insets.top,
                    paddingHorizontal: 16,
                    flex: 1,
                    zIndex: 10,
                }}>

                    {/* Title Section - Kaybolur */}
                    <Animated.View
                        style={{
                            opacity: titleOpacity,
                            transform: [{ scale: titleScale }],
                            height: 50,
                            justifyContent: 'center',
                        }}
                    >
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                className="p-1 mr-3"
                            >
                                <ChevronLeft size={24} color="black" />
                            </TouchableOpacity>
                            <Text className="text-xl font-semibold text-gray-900 flex-1">
                                Favori {profileType}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Search Bar */}
                    <Animated.View
                        style={{
                            marginTop: 10,
                            transform: [{ translateY: searchBarTranslateY }],
                            width: searchBarWidth,
                            marginRight: searchBarMarginRight,
                        }}
                    >
                        <PlatformBlurView
                            intensity={60}
                            tint="light"
                            style={{
                                borderRadius: 24,
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 5,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    paddingHorizontal: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                                className="border border-gray-100 border-[1px] rounded-full"
                            >
                                <Search size={20} color="#000" />
                                <TextInput
                                    className="flex-1 placeholder:text-gray-500 py-4 text-normal"
                                    style={{
                                        textAlignVertical: "center",
                                        includeFontPadding: false,
                                    }}
                                    placeholder="Favori profillerde ara..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                        </PlatformBlurView>
                    </Animated.View>
                </View>

                {/* Favori Badge - Sağ üstte sabit */}
                <View
                    style={{
                        position: 'absolute',
                        right: 16,
                        top: insets.top + 3,
                        zIndex: 20,
                    }}
                >
                    <PlatformBlurView
                        intensity={60}
                        tint="light"
                        style={{
                            borderRadius: 30,
                            overflow: 'hidden',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 5,
                            marginTop: 3,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                paddingHorizontal: 8,
                                paddingVertical: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                            }}
                        >
                            <Heart fill="#ef4444" color="#ef4444" size={20} />
                            <Text className="text-gray-900 text-l font-semibold">
                                {favoriteProfiles.length}
                            </Text>
                        </View>
                    </PlatformBlurView>
                </View>
            </Animated.View>
        );
    };

    if (profileLoading) {
        return (
            <View className="flex-1 bg-gray-50">
                <RNStatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                {renderAnimatedHeader()}
                <ScrollView
                    contentContainerStyle={{
                        paddingTop: getDynamicPaddingTop(),
                        paddingHorizontal: 0,
                        paddingBottom: 30,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <FavoriteProfileCardSkeleton />
                    <FavoriteProfileCardSkeleton />
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <RNStatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
            />
            <StatusBar style="dark" backgroundColor="transparent" />

            {/* Animated Header */}
            {renderAnimatedHeader()}

            {/* Main ScrollView */}
            <Animated.ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: getDynamicPaddingTop(),
                    paddingHorizontal: 0,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#6b7280"
                        colors={["#6b7280"]}
                        progressViewOffset={getDynamicPaddingTop()}
                    />
                }
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {filteredFavorites.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Heart size={64} color="#d1d5db" />
                        <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2 text-center">
                            {searchQuery.trim() ? "Arama Sonucu Bulunamadı" : emptyMessage}
                        </Text>
                        <Text className="text-base text-gray-500 text-center mb-6 px-8 leading-6">
                            {searchQuery.trim()
                                ? "Arama kriterlerinize uygun profil bulunamadı."
                                : emptyDescription
                            }
                        </Text>

                        <TouchableOpacity
                            className="bg-gray-900 px-6 py-3 rounded-full"
                            onPress={() => navigation.navigate("AllMatchingUsers")}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                        >
                            <Text className="text-white font-semibold">
                                {userRole === "KIRACI" ? "Ev sahibi ara" : "Kiracı Ara"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>


                        {/* ✅ Component'leri kullan - Role göre doğru component'i seç VE matchingScore'u geçir */}
                        {filteredFavorites.map((profile) =>
                            userRole === "KIRACI" ? (
                                <FavoriteLandlordCard
                                    key={profile.landlordProfileId}
                                    landlord={profile}
                                    onRemoveFavorite={handleRemoveFromFavorites}
                                    onProfilePress={handleProfilePress}
                                    removingFavorite={removingFavorite}
                                    navigation={navigation}
                                    matchingScore={profile.matchingScore} // ✅ BU EKLENDİ!
                                />
                            ) : (
                                <FavoriteTenantCard
                                    key={profile.tenantProfileId}
                                    tenant={profile}
                                    onRemoveFavorite={handleRemoveFromFavorites}
                                    onProfilePress={handleProfilePress}
                                    removingFavorite={removingFavorite}
                                    navigation={navigation}
                                    matchingScore={profile.matchingScore} // ✅ BU EKLENDİ!
                                />
                            )
                        )}
                        {/* Bottom spacing */}
                        <View className="h-20" />
                    </View>
                )}
            </Animated.ScrollView>
        </View>
    );
};

export default FavoriteProfilesScreen;