// FavoriteProfilesScreen.js - Component'ler ile güncellenmiş
import React, { useState, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
    TextInput,
    Animated,
    StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { selectUserProfile } from "../redux/slices/profileSlice";
import {
    useGetTenantProfileQuery,
    useGetLandlordProfileQuery,
    apiSlice,
} from "../redux/api/apiSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faArrowLeft,
    faHeart,
} from "@fortawesome/pro-regular-svg-icons";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { faHeart as faHeartSolid } from "@fortawesome/pro-solid-svg-icons";

// ✅ Component import'ları
import FavoriteLandlordCard from "../components/FavoriteLandlordCard";
import FavoriteTenantCard from "../components/FavoriteTenantCard";

const { width: screenWidth } = Dimensions.get("window");

const FavoriteProfilesScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const userProfile = useSelector(selectUserProfile);
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

    // Profile'ı kullanıcı rolüne göre çek
    const {
        data: profileData,
        isLoading: profileLoading,
        refetch: refetchProfile,
    } = userRole === "EVSAHIBI"
            ? useGetLandlordProfileQuery(currentUser?.id)
            : useGetTenantProfileQuery(currentUser?.id);

    // Favori silme mutation
    const [profileAction] = apiSlice.endpoints.profileAction.useMutation();

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

                            const favoriteProfiles = userRole === "KIRACI"
                                ? userProfile?.favoriteLandlordProfile || []
                                : userProfile?.favoriteTenantProfile || [];

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
                            console.error("Error removing from favorites:", error);
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
                <BlurView
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
                                className="mr-4"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
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
                        <BlurView
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
                                <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
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
                        </BlurView>
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
                    <BlurView
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
                            <FontAwesomeIcon icon={faHeartSolid} size={20} color="#ef4444" />
                            <Text className="text-gray-900 text-l font-semibold">
                                {favoriteProfiles.length}
                            </Text>
                        </View>
                    </BlurView>
                </View>
            </Animated.View>
        );
    };

    if (profileLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#6b7280" />
                <Text className="mt-3 text-base text-gray-500">Yükleniyor...</Text>
            </View>
        );
    }

    // Kullanıcı rolüne göre favori profilleri belirle
    const favoriteProfiles = userRole === "KIRACI"
        ? userProfile?.favoriteLandlordProfile || []
        : userProfile?.favoriteTenantProfile || [];

    // Arama filtresi
    const filteredFavorites = favoriteProfiles.filter(profile => {
        if (!searchQuery.trim()) return true;

        const searchLower = searchQuery.toLowerCase();
        const userName = profile.user ?
            `${profile.user.name} ${profile.user.surname}`.toLowerCase() : '';
        const email = profile.user?.email?.toLowerCase() || '';

        return userName.includes(searchLower) || email.includes(searchLower);
    });

    const profileType = userRole === "KIRACI" ? "Ev Sahipleri" : "Kiracılar";
    const emptyMessage = userRole === "KIRACI"
        ? "Henüz Favori Ev Sahibi Yok"
        : "Henüz Favori Kiracı Yok";

    const emptyDescription = userRole === "KIRACI"
        ? "Beğendiğiniz ev sahiplerini favorilerinize ekleyerek buradan kolayca erişebilirsiniz."
        : "Beğendiğiniz kiracıları favorilerinize ekleyerek buradan kolayca erişebilirsiniz.";

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
                        <FontAwesomeIcon icon={faHeart} size={64} color="#d1d5db" />
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
                        {/* ✅ Component'leri kullan - Hook sorunu çözüldü! */}
                        {filteredFavorites.map((profile) =>
                            userRole === "KIRACI" ? (
                                <FavoriteLandlordCard
                                    key={profile.landlordProfileId}
                                    landlord={profile}
                                    onRemoveFavorite={handleRemoveFromFavorites}
                                    onProfilePress={handleProfilePress}
                                    removingFavorite={removingFavorite}
                                    navigation={navigation}
                                />
                            ) : (
                                <FavoriteTenantCard
                                    key={profile.tenantProfileId}
                                    tenant={profile}
                                    onRemoveFavorite={handleRemoveFromFavorites}
                                    onProfilePress={handleProfilePress}
                                    removingFavorite={removingFavorite}
                                    navigation={navigation}
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