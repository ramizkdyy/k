import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Dimensions,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faTimes,
    faInfo,
    faBed,
    faShower,
    faRuler,
    faBuilding,
    faCalendar,
    faMoneyBills,
    faCoins,
    faUsers,
    faStar,
    faHome,
    faLocationDot,
    faUser,
    faEnvelope,
    faPhone,
    faClock,
    faEye,
    faThumbsUp,
    faCheckCircle,
    faXCircle,
    faKey,
    faParking,
    faElevator,
    faTreeCity,
    faDoorOpen,
    faFire,
    faBedBunk,
    faUtensils,
    faBarsProgress,
    faWifi,
    faCheck,
    faTv,
    faSnowflake,
    faShieldCheck,
    faCamera,
    faHashtag,
    faGlobe,
    faAward,
    faCalendarCheck,
    faDatabase,
    faCode,
} from "@fortawesome/pro-solid-svg-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ExploreDetailModal = ({
    visible,
    onClose,
    listing
}) => {
    const insets = useSafeAreaInsets();

    // Modal boyutları
    const SNAP_POINTS = {
        CLOSED: SCREEN_HEIGHT,
        OPEN: SCREEN_HEIGHT * 0.15, // %85 ekran yüksekliği
    };

    // Animated values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // Modal açılış/kapanış animasyonu
    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(SNAP_POINTS.OPEN, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0.5, { duration: 300 });
        } else if (visible === false && translateY.value !== SCREEN_HEIGHT) {
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

    // Close handler
    const handleClose = () => {
        translateY.value = withSpring(SCREEN_HEIGHT, {
            damping: 80,
            stiffness: 400,
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        setTimeout(() => onClose(), 300);
    };

    // Backdrop press handler
    const handleBackdropPress = () => {
        handleClose();
    };

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const modalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Helper functions
    const formatCurrency = (amount, currency) => {
        if (!amount) return "Belirtilmemiş";
        const symbols = {
            'TL': '₺',
            'USD': '$',
            'EUR': '€'
        };
        return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Belirtilmemiş";
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPropertyTypeName = (type) => {
        const types = {
            0: "Daire",
            1: "Butik Otel",
            2: "Otel",
            3: "Konaklama",
            5: "B&B",
            6: "Apart",
            8: "Ev",
            16: "Mağara",
        };
        return types[type] || "Belirtilmemiş";
    };

    const getRoomTypeName = (type) => {
        const types = {
            0: "Tüm ev/daire",
            1: "Özel oda",
            2: "Ortak oda"
        };
        return types[type] || "Belirtilmemiş";
    };

    const getPriceStatusName = (status) => {
        const statuses = {
            0: "Tarih ekleyin",
            1: "Belirtilmemiş"
        };
        return statuses[status] || "Bilinmiyor";
    };

    const getStatusText = (status) => {
        const statusMap = {
            0: { text: "Aktif", color: "text-green-600" },
            1: { text: "Kiralandı", color: "text-blue-600" },
            2: { text: "Kapalı", color: "text-red-600" }
        };
        return statusMap[status] || { text: "Bilinmiyor", color: "text-gray-600" };
    };

    const renderDetailItem = (icon, label, value, valueColor = "text-gray-900") => (
        <View className="flex-row items-center py-2">
            <View className="w-8 items-center">
                <FontAwesomeIcon icon={icon} size={16} color="#6B7280" />
            </View>
            <Text className="text-gray-600 text-sm flex-1 ml-2">{label}:</Text>
            <Text className={`${valueColor} text-sm font-medium ml-2 flex-1 text-right`}>
                {value || "Belirtilmemiş"}
            </Text>
        </View>
    );

    const renderBooleanItem = (icon, label, value) => {
        const isTrue = value === true || value === "true" || value === 1;
        return renderDetailItem(
            icon,
            label,
            isTrue ? "Evet" : "Hayır",
            isTrue ? "text-green-600" : "text-red-600"
        );
    };

    if (!visible || !listing) return null;

    const isNormalPost = listing.postType === "NormalPost";
    const post = listing.post;
    const metaPost = listing.metaPost;
    const statusInfo = isNormalPost ? getStatusText(post?.status) : null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <GestureHandlerRootView style={styles.container}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <TouchableWithoutFeedback onPress={handleBackdropPress}>
                        <View style={styles.backdropTouchable} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                {/* Modal Content */}
                <Animated.View style={[styles.modal, modalStyle]}>
                    {/* Header */}
                    <View className="items-center py-4 px-6 border-b border-gray-100 bg-white">
                        <View className="w-10 h-1 bg-gray-300 rounded-sm mb-3" />
                        <View className="flex-row justify-between items-center w-full">
                            <View className="flex-row items-center">
                                <FontAwesomeIcon icon={faInfo} size={20} color="#374151" />
                                <Text className="text-lg font-bold text-gray-900 ml-2">
                                    İlan Detayları
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleClose}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            >
                                <FontAwesomeIcon icon={faTimes} size={16} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        {/* Post Type & Match Score */}
                        <View className="px-6 py-4 bg-gray-50">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-sm font-semibold text-gray-700">
                                    İlan Tipi: {isNormalPost ? "Normal Post" : "Meta Post (Airbnb)"}
                                </Text>
                                {listing.matchScore && (
                                    <View className="bg-blue-100 px-3 py-1 rounded-full">
                                        <Text className="text-blue-800 text-xs font-medium">
                                            Eşleşme: %{(listing.matchScore * 100).toFixed(1)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {statusInfo && (
                                <Text className={`text-sm font-medium ${statusInfo.color}`}>
                                    Durum: {statusInfo.text}
                                </Text>
                            )}
                            {listing.sortOrder && (
                                <Text className="text-sm text-gray-600 mt-1">
                                    Sıralama: {listing.sortOrder}
                                </Text>
                            )}
                        </View>

                        {isNormalPost && post ? (
                            // Normal Post Details
                            <>
                                {/* Basic Info */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-lg font-bold text-gray-900 mb-3">
                                        {post.ilanBasligi || "Başlık Yok"}
                                    </Text>
                                    {post.postDescription && (
                                        <Text className="text-sm text-gray-600 mb-4 leading-5">
                                            {post.postDescription}
                                        </Text>
                                    )}
                                </View>

                                {/* User Info */}
                                {post.user && (
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            İlan Sahibi
                                        </Text>
                                        {renderDetailItem(faUser, "İsim", `${post.user.name} ${post.user.surname}`)}
                                        {renderDetailItem(faEnvelope, "E-posta", post.user.email)}
                                        {renderDetailItem(faPhone, "Telefon", post.user.phoneNumber)}
                                        {post.user.gender && renderDetailItem(faUser, "Cinsiyet", post.user.gender)}
                                        {post.user.age && renderDetailItem(faCalendar, "Yaş", post.user.age)}
                                        {post.user.id && renderDetailItem(faHashtag, "Kullanıcı ID", post.user.id)}
                                    </View>
                                )}

                                {/* Property Details */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Emlak Bilgileri
                                    </Text>
                                    {renderDetailItem(faLocationDot, "Lokasyon", `${post.mahalle}, ${post.ilce}, ${post.il}`)}
                                    {renderDetailItem(faMoneyBills, "Kira", formatCurrency(post.kiraFiyati, post.paraBirimi))}
                                    {renderDetailItem(faCoins, "Depozito", formatCurrency(post.depozito, post.paraBirimi))}
                                    {renderDetailItem(faBed, "Oda Sayısı", post.odaSayisi)}
                                    {post.yatakOdasiSayisi !== undefined && renderDetailItem(faBedBunk, "Yatak Odası", post.yatakOdasiSayisi)}
                                    {renderDetailItem(faShower, "Banyo Sayısı", post.banyoSayisi)}
                                    {renderDetailItem(faRuler, "Brüt Alan", post.brutMetreKare ? `${post.brutMetreKare} m²` : null)}
                                    {renderDetailItem(faRuler, "Net Alan", post.netMetreKare ? `${post.netMetreKare} m²` : null)}
                                    {renderDetailItem(faBuilding, "Kat", `${post.bulunduguKat}/${post.toplamKat}`)}
                                    {renderDetailItem(faCalendar, "Bina Yaşı", `${post.binaYasi} yıl`)}
                                    {renderDetailItem(faFire, "Isıtma", post.isitmaTipi)}
                                    {renderDetailItem(faUtensils, "Mutfak", post.mutfak)}
                                    {renderDetailItem(faKey, "Kullanım Durumu", post.kullanimDurumu)}
                                    {renderDetailItem(faUser, "Kimden", post.kimden)}
                                </View>

                                {/* Property Features */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Özellikler
                                    </Text>
                                    {renderBooleanItem(faCheckCircle, "Eşyalı", post.esyali)}
                                    {renderBooleanItem(faParking, "Otopark", post.otopark)}
                                    {renderBooleanItem(faElevator, "Asansör", post.asansor)}
                                    {renderBooleanItem(faTreeCity, "Balkon", post.balkon)}
                                    {renderBooleanItem(faBuilding, "Site İçerisinde", post.siteIcerisinde)}
                                    {post.siteAdi && renderDetailItem(faHome, "Site Adı", post.siteAdi)}
                                    {renderBooleanItem(faCheckCircle, "Takas", post.takas)}
                                </View>

                                {/* Financial Info */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Mali Bilgiler
                                    </Text>
                                    {renderDetailItem(faMoneyBills, "Aidat", post.aidat ? `${post.aidat} ₺` : "Yok")}
                                    {renderDetailItem(faCalendar, "Kiralama Süresi", `${post.rentalPeriod} ay`)}
                                    {renderDetailItem(faCalendar, "Min. Kiralama", `${post.minimumKiralamaSuresi} ay`)}
                                </View>

                                {/* Statistics */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        İstatistikler
                                    </Text>
                                    {renderDetailItem(faEye, "Görüntülenme", post.viewCount || 0)}
                                    {renderDetailItem(faEye, "Benzersiz Görüntülenme", post.uniqueViewCount || 0)}
                                    {renderDetailItem(faEye, "Bugün", post.todayViewCount || 0)}
                                    {renderDetailItem(faEye, "Bu Hafta", post.weekViewCount || 0)}
                                    {renderDetailItem(faBarsProgress, "Benzerlik Skoru", post.similarityScore || 0)}
                                    {renderDetailItem(faThumbsUp, "Teklif Sayısı", post.offerCount || 0)}
                                    {renderBooleanItem(faCheckCircle, "Teklif Kabul Edildi", post.isOfferAccepted)}
                                </View>

                                {/* Dates */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Tarihler
                                    </Text>
                                    {renderDetailItem(faClock, "İlan Tarihi", formatDate(post.postTime))}
                                    {renderDetailItem(faClock, "Güncelleme", formatDate(post.updatedDate))}
                                    {post.lastViewDate && renderDetailItem(faEye, "Son Görüntüleme", formatDate(post.lastViewDate))}
                                </View>

                                {/* Technical Info */}
                                <View className="px-6 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Teknik Bilgiler
                                    </Text>
                                    {renderDetailItem(faLocationDot, "Enlem", post.postLatitude?.toFixed(6))}
                                    {renderDetailItem(faLocationDot, "Boylam", post.postLongitude?.toFixed(6))}
                                    {renderDetailItem(faHashtag, "Post ID", post.postId)}
                                    {renderDetailItem(faUser, "Kullanıcı ID", post.userId)}
                                    {post.propertyType !== undefined && renderDetailItem(faHome, "Property Type", post.propertyType)}
                                </View>
                            </>
                        ) : (
                            // Meta Post Details (Airbnb)
                            metaPost && (
                                <>
                                    {/* Basic Info */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-lg font-bold text-gray-900 mb-3">
                                            {metaPost.title || "Başlık Yok"}
                                        </Text>
                                        {metaPost.description && (
                                            <Text className="text-sm text-gray-600 mb-4 leading-5">
                                                {metaPost.description}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Property Details */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Konaklama Bilgileri
                                        </Text>
                                        {renderDetailItem(faLocationDot, "Lokasyon", `${metaPost.location}, ${metaPost.city}, ${metaPost.country}`)}
                                        {renderDetailItem(faMoneyBills, "Fiyat", metaPost.priceInfo)}
                                        {renderDetailItem(faInfo, "Fiyat Durumu", getPriceStatusName(metaPost.priceStatus))}
                                        {renderDetailItem(faHome, "Emlak Tipi", getPropertyTypeName(metaPost.propertyType))}
                                        {renderDetailItem(faDoorOpen, "Oda Tipi", getRoomTypeName(metaPost.roomType))}
                                        {renderDetailItem(faBed, "Yatak Odası", metaPost.bedroomCount || 0)}
                                        {renderDetailItem(faShower, "Banyo", metaPost.bathroomCount)}
                                        {renderDetailItem(faUsers, "Kapasite", `${metaPost.personCapacity} kişi`)}
                                    </View>

                                    {/* Rating & Reviews */}
                                    {(metaPost.rating || metaPost.reviewCount) && (
                                        <View className="px-6 py-4 border-t border-gray-100">
                                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                                Değerlendirmeler
                                            </Text>
                                            {metaPost.rating && renderDetailItem(faStar, "Puan", `${metaPost.rating.toFixed(2)} ⭐`)}
                                            {renderDetailItem(faThumbsUp, "Yorum Sayısı", metaPost.reviewCount || 0)}
                                            {renderDetailItem(faEye, "Görünür Yorum", metaPost.visibleReviewCount || 0)}
                                        </View>
                                    )}

                                    {/* Host Info */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Ev Sahibi
                                        </Text>
                                        {renderDetailItem(faUser, "İsim", metaPost.hostName)}
                                        {renderDetailItem(faHashtag, "Host ID", metaPost.hostId)}
                                        {renderBooleanItem(faAward, "Süper Ev Sahibi", metaPost.isSuperhost)}
                                        {renderBooleanItem(faCheckCircle, "Anında Rezervasyon", metaPost.canInstantBook)}
                                    </View>

                                    {/* Images Info */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Görseller
                                        </Text>
                                        {renderDetailItem(faCamera, "Görsel Sayısı", metaPost.imageCount)}
                                        {renderDetailItem(faCamera, "Resim Sayısı", metaPost.pictureCount)}
                                        {metaPost.firstImageUrl && (
                                            <Text className="text-xs text-gray-500 mt-2">
                                                İlk Görsel: {metaPost.firstImageUrl.substring(0, 50)}...
                                            </Text>
                                        )}
                                    </View>

                                    {/* Amenities */}
                                    {metaPost.amenities && metaPost.amenities.length > 0 && (
                                        <View className="px-6 py-4 border-t border-gray-100">
                                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                                Olanaklar ({metaPost.amenityCount || metaPost.amenities.length})
                                            </Text>
                                            <View className="flex-row flex-wrap">
                                                {metaPost.amenities.slice(0, 10).map((amenity, index) => (
                                                    <View key={index} className="flex-row items-center mr-4 mb-2">
                                                        <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                                                        <Text className="text-xs text-gray-700 ml-1">{amenity}</Text>
                                                    </View>
                                                ))}
                                                {metaPost.amenities.length > 10 && (
                                                    <Text className="text-xs text-gray-500 italic mt-2">
                                                        +{metaPost.amenities.length - 10} daha fazla...
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* Location Details */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Konum Detayları
                                        </Text>
                                        {renderDetailItem(faLocationDot, "Enlem", metaPost.latitude?.toFixed(6))}
                                        {renderDetailItem(faLocationDot, "Boylam", metaPost.longitude?.toFixed(6))}
                                    </View>

                                    {/* Technical Info */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Teknik Bilgiler
                                        </Text>
                                        {renderDetailItem(faHashtag, "Airbnb ID", metaPost.airbnbIlanId)}
                                        {renderDetailItem(faHashtag, "Meta Post ID", metaPost.id)}
                                        {renderDetailItem(faDatabase, "Veri Kaynağı", metaPost.dataSource)}
                                        {renderDetailItem(faCode, "Crawl Versiyon", metaPost.crawlVersion)}
                                        {renderBooleanItem(faCheckCircle, "Aktif", metaPost.isActive)}
                                        {renderBooleanItem(faXCircle, "Silinmiş", metaPost.isDeleted)}
                                    </View>

                                    {/* Dates */}
                                    <View className="px-6 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Tarihler
                                        </Text>
                                        {renderDetailItem(faCalendarCheck, "Oluşturma", formatDate(metaPost.createdDate))}
                                        {metaPost.updatedDate && renderDetailItem(faClock, "Güncelleme", formatDate(metaPost.updatedDate))}
                                        {renderDetailItem(faDatabase, "Veri Çekme", formatDate(metaPost.dataFetchTime))}
                                    </View>
                                </>
                            )
                        )}

                        {/* Processing Info - Common for both */}
                        {listing.processedAt && (
                            <View className="px-6 py-4 border-t border-gray-100">
                                <Text className="text-base font-semibold text-gray-900 mb-3">
                                    İşlem Bilgileri
                                </Text>
                                {renderDetailItem(faClock, "İşlenme Zamanı", formatDate(listing.processedAt))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Actions */}
                    <View
                        className="px-6 py-4 border-t border-gray-100 bg-white"
                        style={{ paddingBottom: insets.bottom + 20 }}
                    >
                        <TouchableOpacity
                            className="bg-gray-900 py-4 rounded-xl"
                            onPress={handleClose}
                        >
                            <Text className="text-white font-bold text-center text-base">
                                Kapat
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </GestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdropTouchable: {
        flex: 1,
    },
    modal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
});

export default ExploreDetailModal;