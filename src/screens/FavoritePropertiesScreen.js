import React, { useState, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Alert,
    Dimensions,
    TextInput,
    Animated,
    StatusBar as RNStatusBar,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";

const { width: screenWidth } = Dimensions.get('window');

import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { selectUserProfile } from "../redux/slices/profileSlice";
import {
    useGetTenantProfileQuery,
    useToggleFavoritePropertyMutation,
    useGetPostQuery,
    useGetSentOffersQuery,
} from "../redux/api/apiSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faArrowLeft,
    faHeartBroken,
    faMapPin,
    faHome,
    faRuler,
    faBed,
    faBath,
    faCalendar,
    faBuilding,
    faDollarSign,
    faEye,
    faShare,
    faTrash,
    faImageSlash,
} from "@fortawesome/pro-regular-svg-icons";
import { faHeart, faSearch } from "@fortawesome/pro-solid-svg-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
// OfferModal import
import OfferModal from "../modals/OfferModal";

// Favori İlan Kartı Komponenti - Modern Tasarım
const FavoritePropertyCard = ({ favoriteItem, currentUser, onRemoveFavorite, onNavigateToDetail, removingFavorite, userOffers, onOpenOfferModal, navigation }) => {
    const { data: postData, isLoading, error } = useGetPostQuery({
        postId: favoriteItem.postId,
        userId: currentUser?.id
    });

    const post = postData?.result?.post;
    const images = post?.postImages || [];

    // Bu post için kullanıcının teklifi var mı kontrol et
    const existingOffer = userOffers.find(offer =>
        offer.postId === favoriteItem.postId ||
        offer.post?.postId === favoriteItem.postId
    );

    console.log("Checking existing offer for post:", favoriteItem.postId);
    console.log("Available user offers:", userOffers.map(o => ({
        offerId: o.offerId,
        postId: o.postId || o.post?.postId,
        status: o.status,
        amount: o.offerAmount
    })));
    console.log("Found existing offer:", existingOffer);

    // 🔧 BASIT IMAGE URL ALMA - Sadece ilk geçerli resmi al
    const getFirstValidImage = (images) => {
        if (!images || images.length === 0) return null;

        // İlk resmi kontrol et
        const firstImage = images[0]?.postImageUrl;
        if (!firstImage) return null;

        // Google redirect URL'leri filtrele
        if (firstImage.includes('google.com/url')) return null;

        return firstImage;
    };

    const firstImage = getFirstValidImage(images);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR').format(price);
    };

    const getOfferStatus = () => {
        if (!existingOffer) {
            return {
                hasOffer: false,
                statusText: "Henüz bu ilana teklif vermemişsiniz",
                buttonText: "Teklif Ver",
                statusColor: "#6b7280",
                bgColor: "#f9fafb"
            };
        }

        let statusText = "";
        let statusColor = "";
        let bgColor = "";

        switch (existingOffer.status) {
            case 0:
                statusText = `Teklifiniz: ${formatPrice(existingOffer.offerAmount)} ₺`;
                statusColor = "#353535";
                bgColor = "#fef3c7";
                break;
            case 1:
                statusText = `Teklifiniz: ${formatPrice(existingOffer.offerAmount)} ₺`;
                statusColor = "#10b981";
                bgColor = "#d1fae5";
                break;
            case 2:
                statusText = `Teklifiniz: ${formatPrice(existingOffer.offerAmount)} ₺`;
                statusColor = "#ef4444";
                bgColor = "#fee2e2";
                break;
            default:
                statusText = `Teklifiniz: ${formatPrice(existingOffer.offerAmount)} ₺`;
                statusColor = "#6b7280";
                bgColor = "#f9fafb";
        }

        // Durum detayını ekle
        const getStatusDetail = () => {
            switch (existingOffer.status) {
                case 0:
                    return "Ev sahibinin onayını bekliyor";
                case 1:
                    return "Ev sahibi tarafından kabul edildi";
                case 2:
                    return "Ev sahibi tarafından reddedildi";
                default:
                    return "Durum bilinmiyor";
            }
        };

        return {
            hasOffer: true,
            statusText,
            statusDetail: getStatusDetail(),
            buttonText: existingOffer.status === 2 ? "Yeni Teklif Ver" : "Teklifi Güncelle",
            statusColor,
            bgColor
        };
    };

    const offerStatus = getOfferStatus();


    if (isLoading) {
        return (
            <View className="bg-white rounded-3xl mb-6 overflow-hidden" style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8
            }}>
                <View className="flex-row items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#6b7280" />
                    <Text className="ml-3 text-gray-500">İlan yükleniyor...</Text>
                </View>
            </View>
        );
    }

    if (error || !post) {
        return (
            <View className="bg-white rounded-3xl mb-6 p-6 overflow-hidden" style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8
            }}>
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-gray-500 text-sm">İlan #ID: {favoriteItem.postId}</Text>
                        <Text className="text-red-500 text-sm mt-1">İlan detayları yüklenemedi</Text>
                        <Text className="text-gray-400 text-xs mt-1">
                            {new Date(favoriteItem.dateAdded).toLocaleDateString('tr-TR')} tarihinde eklendi
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => onRemoveFavorite(favoriteItem.postId)}
                        disabled={removingFavorite}
                        className="bg-red-50 p-3 "
                    >
                        <FontAwesomeIcon icon={faTrash} size={16} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity
            className="bg-white rounded-3xl mb-6 overflow-hidden"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8
            }}
            onPress={() => onNavigateToDetail(favoriteItem.postId)}
            activeOpacity={0.98}
        >
            {/* Modern Header Image with blur effects */}
            <View className="relative">
                {firstImage ? (
                    <Image
                        source={{ uri: firstImage }}
                        style={{
                            width: screenWidth - 32,
                            height: 280
                        }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                    />
                ) : (
                    // Modern placeholder
                    <View
                        style={{
                            width: screenWidth - 32,
                            height: 280
                        }}
                        className="bg-gray-300 items-center justify-center"
                    >
                        <FontAwesomeIcon icon={faImageSlash} size={48} color="#9ca3af" />
                        <Text className="text-gray-500 text-sm mt-3 font-medium">Fotoğraf Yok</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16
                    }}
                    onPress={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(favoriteItem.postId);
                    }}
                    disabled={removingFavorite}
                >
                    <BlurView
                        intensity={90}
                        tint="dark"
                        style={{
                            borderRadius: 20,
                            overflow: 'hidden'
                        }}
                    >
                        <View className="px-3 py-2 flex-row items-center">
                            <FontAwesomeIcon icon={faHeart} size={12} color="#ef4444" />
                            <Text className="text-white text-sm font-semibold ml-2">
                                {new Date(favoriteItem.dateAdded).toLocaleDateString('tr-TR')}
                            </Text>
                        </View>
                    </BlurView>
                </TouchableOpacity>
            </View>

            {/* Modern Content */}
            <View className="py-6 px-2">
                {/* Price Badge - Modern blur style */}
                <View className="mb-2 px-2 ">
                    <Text
                        className="underline text-gray-900 font-medium"
                        style={{ fontSize: 24 }}
                    >
                        {formatPrice(post.kiraFiyati)} ₺
                    </Text>
                </View>

                {/* Title and Location */}
                <View className="mb-4 px-2">
                    <Text
                        className="text-xl font-bold text-gray-900 mb-2 leading-tight"
                        numberOfLines={2}
                        style={{ fontSize: 20, fontWeight: '700' }}
                    >
                        {post.ilanBasligi || `${post.il} ${post.ilce} Kiralık`}
                    </Text>

                    <View className="flex-row items-center">
                        <FontAwesomeIcon icon={faMapPin} size={14} color="#6b7280" />
                        <Text
                            className="text-gray-600 ml-2 text-sm font-medium"
                            numberOfLines={1}
                            style={{ fontSize: 14 }}
                        >
                            {post.mahalle}, {post.ilce}, {post.il}
                        </Text>
                    </View>
                </View>

                {/* Property Details Grid - Modern style */}
                <View className="mb-5 items-center">
                    <View
                        style={{ paddingHorizontal: 4 }}
                    >
                        <View className="flex-row gap-4 mt-2">
                            {/* Rooms */}
                            <View className="items-center justify-center mr-8">
                                <FontAwesomeIcon icon={faBed} size={24} color="#111827" />
                                <Text className="text-gray-900 mt-2 text-sm font-semibold">{post.odaSayisi}</Text>
                                <Text className="text-gray-500 text-xs">Oda</Text>
                            </View>

                            {/* Area */}
                            {post.brutMetreKare && (
                                <View className="items-center justify-center mr-8">
                                    <FontAwesomeIcon icon={faRuler} size={24} color="#111827" />
                                    <Text className="text-gray-900 mt-2 text-sm font-semibold">{post.brutMetreKare} m²</Text>
                                    <Text className="text-gray-500 text-xs">Alan</Text>
                                </View>
                            )}

                            {/* Floor */}
                            <View className="items-center justify-center mr-8">
                                <FontAwesomeIcon icon={faBuilding} size={24} color="#111827" />
                                <Text className="text-gray-900 mt-2 text-sm font-semibold">
                                    {post.bulunduguKat}/{post.toplamKat}
                                </Text>
                                <Text className="text-gray-500 text-xs">Kat</Text>
                            </View>

                            {/* Building Age */}
                            {post.binaYasi && (
                                <View className="items-center justify-center mr-8">
                                    <FontAwesomeIcon icon={faCalendar} size={24} color="#111827" />
                                    <Text className="text-gray-900 mt-2 text-sm font-semibold">
                                        {post.binaYasi}
                                    </Text>
                                    <Text className="text-gray-500 text-xs">Yaş</Text>
                                </View>
                            )}

                            {/* Deposit */}
                            {/* <View className="items-center justify-center">
                                <FontAwesomeIcon icon={faDollarSign} size={24} color="#111827" />
                                <Text className="text-gray-900 mt-2 text-sm font-semibold">
                                    {formatPrice(post.depozito)} ₺
                                </Text>
                                <Text className="text-gray-500 text-xs">Depozito</Text>
                            </View> */}
                        </View>
                    </View>
                </View>

                {/* Financial Info - Modern card style */}
                <View className=" py-2 px-2 mb-5 ">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-lg mb-3">Finansal Detaylar</Text>
                            <View>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-900 text-sm font-medium">
                                        Depozito: {formatPrice(post.depozito)} ₺
                                    </Text>
                                </View>
                                {post.aidat > 0 && (
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-gray-900 text-sm font-medium">
                                            Aidat: {formatPrice(post.aidat)} ₺
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View className="items-end">
                            <Text className="text-gray-900 font-bold text-xl">
                                {formatPrice(post.kiraFiyati)} ₺
                            </Text>
                            <Text className="text-gray-600 text-xs font-medium">
                                Min. {post.minimumKiralamaSuresi} ay
                            </Text>
                        </View>
                    </View>
                </View>

                {/* YENİ: Teklif Durumu Göstergesi */}
                <View
                    className="rounded-2xl p-2 mb-4"
                >
                    <View className="flex-row items-center justify-between">
                        <Text className="text-gray-900 font-bold text-lg">Teklif Durumu</Text>
                        {offerStatus.hasOffer && (
                            <View
                                className="px-3 py-2 rounded-full bg-gray-900"
                            >
                                <Text className="text-white text-s font-semibold">
                                    {existingOffer.status === 0 ? "Beklemede" :
                                        existingOffer.status === 1 ? "Kabul Edildi" :
                                            existingOffer.status === 2 ? "Reddedildi" : "Bilinmiyor"}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text
                        className="text-lg font-medium mb-1 mt-3"
                        style={{ color: offerStatus.statusColor }}
                    >
                        {offerStatus.statusText}
                    </Text>

                    {offerStatus.hasOffer && (
                        <Text className="text-xs text-gray-600">
                            {offerStatus.statusDetail}
                        </Text>
                    )}

                    {/* {offerStatus.hasOffer && existingOffer.offerTime && (
                        <Text className="text-xs text-gray-500 mt-1">
                            {new Date(existingOffer.offerTime).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })} tarihinde gönderildi
                        </Text>
                    )} */}
                </View>

                {/* Action Buttons - Modern style */}
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        className="flex-1 bg-gray-900 py-4 px-4 rounded-full flex-row items-center justify-center"
                        onPress={() => onNavigateToDetail(favoriteItem.postId)}
                    >
                        <Text className="text-white font-bold text-m">Detayları Gör</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-1 py-4 px-4 rounded-full flex-row items-center justify-center border ${offerStatus.hasOffer && existingOffer.status === 1
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-100'
                            }`}
                        onPress={(e) => {
                            e.stopPropagation();
                            // Direkt PostDetail'e git ve modal'ı aç
                            navigation.navigate("PostDetail", {
                                postId: favoriteItem.postId,
                                openOfferModal: true
                            });
                        }}
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1
                        }}
                    >
                        <Text className={`font-bold text-m ${offerStatus.hasOffer && existingOffer.status === 1
                            ? 'text-green-700'
                            : 'text-gray-900'
                            }`}>
                            {offerStatus.buttonText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const FavoritePropertiesScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const userProfile = useSelector(selectUserProfile);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // OfferModal state
    const [offerModalVisible, setOfferModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [existingOffer, setExistingOffer] = useState(null);

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
        outputRange: [0, -60], // Title + gap kadar yukarı kayar
        extrapolate: 'clamp',
    });

    // ÖNEMLİ: Arama barının genişlik animasyonu
    const searchBarWidth = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [
            screenWidth - 32, // Başta neredeyse tam genişlik (sadece padding)
            screenWidth - 32 - 60 - 8 // Scroll sonunda favori badge için yer bırak
        ],
        extrapolate: 'clamp',
    });

    // Arama barının sağdan margin/padding animasyonu
    const searchBarMarginRight = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [0, 88], // Favori badge için yer (80 + 8 margin)
        extrapolate: 'clamp',
    });

    const headerContainerHeight = scrollY.interpolate({
        inputRange: [0, SCROLL_DISTANCE],
        outputRange: [
            insets.top + 50 + 60 + 16, // Normal: SafeArea + Title + SearchBar + padding
            insets.top + 60 + 8        // Scroll: SafeArea + SearchBar + minimal padding
        ],
        extrapolate: 'clamp',
    });

    // Tenant profile'ı çek
    const {
        data: profileData,
        isLoading: profileLoading,
        refetch: refetchProfile,
    } = useGetTenantProfileQuery(currentUser?.id);

    // Kullanıcının gönderdiği teklifleri çek
    const {
        data: sentOffersData,
        isLoading: offersLoading,
        refetch: refetchOffers,
    } = useGetSentOffersQuery(currentUser?.id, {
        skip: !currentUser?.id,
    });
    // Kullanıcının tekliflerini işle
    const userOffers = React.useMemo(() => {
        if (!sentOffersData?.result) return [];

        console.log("Processing sent offers data:", sentOffersData);

        // API'den gelen veri yapısı: [{ postDto: {...}, rentalOfferDto: {...} }]
        const processedOffers = sentOffersData.result
            .map((item) => {
                if (item.rentalOfferDto && item.postDto) {
                    return {
                        // rentalOfferDto'dan teklif bilgilerini al
                        ...item.rentalOfferDto,
                        // postDto'dan post bilgilerini al
                        post: {
                            postId: item.postDto.postId,
                            ilanBasligi: item.postDto.ilanBasligi,
                            kiraFiyati: item.postDto.kiraFiyati,
                            ilce: item.postDto.ilce,
                            mahalle: item.postDto.mahalle,
                            postImages: item.postDto.postImages,
                            il: item.postDto.il,
                            paraBirimi: item.postDto.paraBirimi,
                        },
                    };
                }
                return null;
            })
            .filter(Boolean) // null değerleri filtrele
            .filter((offer) => offer.isActive === true); // Sadece aktif teklifleri al

        console.log("Processed user offers:", processedOffers);
        return processedOffers;
    }, [sentOffersData]);


    // Favori silme mutation
    const [toggleFavoriteProperty, { isLoading: removingFavorite }] =
        useToggleFavoritePropertyMutation();

    // Favori ilanları direkt userProfile'dan al ve arama filtresi uygula
    const favoriteProperties = userProfile?.favouriteProperties || [];

    // Arama filtresi
    const filteredFavorites = favoriteProperties.filter(favorite => {
        if (!searchQuery.trim()) return true;

        // Burada favoriye ait post bilgilerini almak için ayrı bir query yapılabilir
        // Şimdilik basit filtreleme yapıyoruz
        const searchLower = searchQuery.toLowerCase();
        const postId = favorite.postId?.toString().toLowerCase() || '';
        const dateAdded = new Date(favorite.dateAdded).toLocaleDateString('tr-TR');

        return postId.includes(searchLower) ||
            dateAdded.includes(searchLower);
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchProfile(), refetchOffers()]);
        setRefreshing(false);
    };

    const handleRemoveFromFavorites = (postId) => {
        Alert.alert(
            "Favorilerden Kaldır",
            "Bu ilanı favorilerinizden kaldırmak istiyor musunuz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kaldır",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const favoriteData = {
                                userId: currentUser.id,
                                postId: postId,
                                actionType: 1, // Remove action
                            };

                            await toggleFavoriteProperty(favoriteData).unwrap();
                            refetchProfile();
                        } catch (error) {
                            console.error("Error removing from favorites:", error);
                            Alert.alert("Hata", "Favorilerden kaldırılırken bir hata oluştu.");
                        }
                    },
                },
            ]
        );
    };

    const handlePostPress = (postId) => {
        navigation.navigate("PostDetail", { postId });
    };

    // OfferModal açma
    // Bu fonksiyonu FavoritePropertiesScreen.js'de ekleyin (handleOfferSuccess fonksiyonundan önce)
    const handleOpenOfferModal = (postId, post, existingOffer) => {
        // PostDetail'e git ve modal'ı aç
        navigation.navigate("PostDetail", {
            postId: postId,
            openOfferModal: true
        });
    };

    // OfferModal kapatma
    const handleCloseOfferModal = () => {
        setOfferModalVisible(false);
        setSelectedPostId(null);
        setSelectedPost(null);
        setExistingOffer(null);
    };

    // Teklif başarılı gönderildiğinde
    const handleOfferSuccess = () => {
        refetchOffers(); // Teklifleri yeniden çek
        handleCloseOfferModal();
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
                                Favori İlanlar
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Search Bar - Title'ın yerine geçer ve genişlik animasyonu */}
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
                                    placeholder="Favori ilanlarında ara..."
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
                            <FontAwesomeIcon icon={faHeart} size={20} color="#ef4444" />
                            <Text className="text-gray-900 text-l font-semibold">
                                {favoriteProperties.length}
                            </Text>
                        </View>
                    </BlurView>
                </View>

                {/* Back Button - Scroll sırasında sabit pozisyonda */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        left: 16,
                        top: insets.top + 10,
                        zIndex: 20,
                        opacity: scrollY.interpolate({
                            inputRange: [0, SCROLL_DISTANCE],
                            outputRange: [0, 1],
                            extrapolate: 'clamp',
                        }),
                    }}
                >
                    {/* <TouchableOpacity
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                        className="p-3 rounded-full bg-white"
                        onPress={() => navigation.goBack()}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
                    </TouchableOpacity> */}
                </Animated.View>
            </Animated.View>
        );
    };

    if (profileLoading || offersLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#6b7280" />
                <Text className="mt-3 text-base text-gray-500">Yükleniyor...</Text>
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
                    paddingBottom: 30,
                    paddingTop: getDynamicPaddingTop(),
                    paddingHorizontal: 16,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#A0E79E"
                        colors={["#A0E79E"]}
                        progressBackgroundColor="#fff"
                        progressViewOffset={getDynamicPaddingTop()}
                        title="Yenileniyor..."
                        titleColor="#666"
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
                        <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                            {searchQuery.trim() ? "Arama Sonucu Bulunamadı" : "Henüz Favori İlan Yok"}
                        </Text>
                        <Text className="text-base text-gray-500 text-center mb-6 px-8">
                            {searchQuery.trim()
                                ? "Arama kriterlerinize uygun favori ilan bulunamadı."
                                : "Beğendiğiniz ilanları favorilerinize ekleyerek buradan kolayca erişebilirsiniz."
                            }
                        </Text>
                        {!searchQuery.trim() && (
                            <TouchableOpacity
                                className="bg-gray-900 px-6 py-3 rounded-full"
                                onPress={() => {
                                    // Seçenek 1: Tab navigator içindeki Properties ekranına git
                                    navigation.navigate("MainTabs", {
                                        screen: "Properties"
                                    });

                                    // Seçenek 2: Eğer şu an tab navigator içindeyseniz, sadece tab değiştir
                                    // navigation.jumpTo("Properties");
                                }}
                            >
                                <Text className="text-white font-semibold">İlan Ara</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View>
                        {/* {!searchQuery.trim() && (
                            <TouchableOpacity
                                className="bg-gray-900 px-6 py-3 rounded-full"
                                onPress={() => {
                                    // Tab navigator içindeki Properties ekranına git
                                    navigation.navigate("MainTabs", {
                                        screen: "Properties"
                                    });
                                }}
                            >
                                <Text className="text-white font-semibold">İlan Ara</Text>
                            </TouchableOpacity>
                        )} */}

                        {filteredFavorites.map((favorite) => (
                            <FavoritePropertyCard
                                key={favorite.id}
                                favoriteItem={favorite}
                                currentUser={currentUser}
                                onRemoveFavorite={handleRemoveFromFavorites}
                                onNavigateToDetail={handlePostPress}
                                removingFavorite={removingFavorite}
                                userOffers={userOffers}
                                onOpenOfferModal={handleOpenOfferModal}
                                navigation={navigation}
                            />
                        ))}
                    </View>
                )}
            </Animated.ScrollView>

            {/* OfferModal */}
            <OfferModal
                visible={offerModalVisible}
                onClose={handleCloseOfferModal}
                postId={selectedPostId}
                post={selectedPost}
                onSuccess={handleOfferSuccess}
                ex2istingOffer={existingOffer}
            />
        </View>
    );
};

export default FavoritePropertiesScreen;