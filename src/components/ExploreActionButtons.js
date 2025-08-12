import React, { memo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faShare,
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
    faBedBunk,
    faEllipsis,
    faChevronDown,
    faChevronUp,
} from "@fortawesome/pro-solid-svg-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import ExploreDetailModal from "../modals/ExploreDetailModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ExploreActionButtons = memo(({
    listing,
    safeAreaInsets,
    isHorizontalScrollActive,
    currentImageIndex = 0,
    totalImages = 0
}) => {
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    // Animasyon state'leri sadece normal post için
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Animation values (sadece normal post için kullanılacak)
    const expandedHeight = useSharedValue(0);
    const chevronRotation = useSharedValue(0);

    // Listing verilerini çıkar
    const getListingDetails = () => {
        if (listing.postType === "NormalPost" && listing.post) {
            const post = listing.post;
            return {
                type: "normal",
                rooms: post.odaSayisi,
                bedrooms: post.yatakOdasiSayisi,
                bathrooms: post.banyoSayisi,
                area: post.brutMetreKare,
                floor: post.bulunduguKat,
                totalFloors: post.toplamKat,
                buildingAge: post.binaYasi,
                dues: post.aidat,
                deposit: post.depozito,
                heating: post.isitmaTipi,
                furnished: post.esyali,
                inSite: post.siteIcerisinde,
                parking: post.otopark,
                elevator: post.asansor,
                balcony: post.balkon,
                price: post.kiraFiyati,
                currency: post.paraBirimi,
            };
        } else if (listing.postType === "MetaPost" && listing.metaPost) {
            const meta = listing.metaPost;
            return {
                type: "meta",
                rooms: meta.bedroomCount,
                bathrooms: meta.bathroomCount,
                capacity: meta.personCapacity,
                rating: meta.rating,
                reviewCount: meta.reviewCount,
                propertyType: getPropertyTypeName(meta.propertyType),
                isSuperhost: meta.isSuperhost,
                instantBook: meta.canInstantBook,
                amenityCount: meta.amenityCount,
            };
        }
        return null;
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
        return types[type] || "Konaklama";
    };

    const details = getListingDetails();
    if (!details) return null;

    // ANIMASYON BİTİŞ CALLBACK'İ (sadece normal post için)
    const onAnimationComplete = (expanded) => {
        'worklet';
        runOnJS(setIsAnimating)(false);
        runOnJS(setIsExpanded)(expanded);
    };

    // TOGGLE FUNCTION (sadece normal post için)
    const toggleExpanded = () => {
        if (isAnimating || details.type !== "normal") return;

        setIsAnimating(true);
        const newExpanded = !isExpanded;

        if (newExpanded) {
            expandedHeight.value = withTiming(250, {
                duration: 200
            }, (finished) => {
                if (finished) onAnimationComplete(true);
            });
            chevronRotation.value = withTiming(180, { duration: 300 });
        } else {
            expandedHeight.value = withTiming(0, {
                duration: 200
            }, (finished) => {
                if (finished) onAnimationComplete(false);
            });
            chevronRotation.value = withTiming(0, { duration: 300 });
        }
    };

    // Animated styles (sadece normal post için)
    const expandedAnimatedStyle = useAnimatedStyle(() => ({
        height: expandedHeight.value,
        opacity: expandedHeight.value > 0 ? 1 : 0,
    }));

    const chevronAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${chevronRotation.value}deg` }],
    }));

    // INSTAGRAM REELS STİLİ SHADOW EFEKTLERİ
    const textShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
    };

    const subtitleShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    };

    const iconShadowStyle = {
        shadowColor: 'rgba(0, 0, 0, 0.8)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 8,
    };

    const counterShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
    };

    // Temel detaylar (her zaman görünür - normal post için)
    const basicDetails = [];
    if (details.type === "normal") {
        if (details.rooms) basicDetails.push({ icon: faBed, value: details.rooms, label: "Oda" });
        if (details.bedrooms) basicDetails.push({ icon: faBedBunk, value: details.bedrooms, label: "Y.Odası" });
        if (details.bathrooms) basicDetails.push({ icon: faShower, value: details.bathrooms, label: "Banyo" });
        if (details.area) basicDetails.push({ icon: faRuler, value: `${details.area}m²`, label: "Alan" });
    }

    // Ek detaylar (animasyonla açılır - sadece normal post için)
    const additionalDetails = [];
    if (details.type === "normal") {
        if (details.floor !== undefined) additionalDetails.push({
            icon: faBuilding,
            value: `${details.floor}/${details.totalFloors}`,
            label: "Kat"
        });
        if (details.buildingAge) additionalDetails.push({
            icon: faCalendar,
            value: details.buildingAge,
            label: "Bina Yaşı"
        });
        if (details.dues) additionalDetails.push({
            icon: faMoneyBills,
            value: `${details.dues}₺`,
            label: "Aidat"
        });
        if (details.deposit) additionalDetails.push({
            icon: faCoins,
            value: `${details.deposit}₺`,
            label: "Depozito"
        });
    }

    // Meta post için tüm detaylar (animasyon yok, hep görünür)
    const metaPostDetails = [];
    if (details.type === "meta") {
        if (details.rooms) metaPostDetails.push({ icon: faBed, value: details.rooms, label: "Oda" });
        if (details.bathrooms) metaPostDetails.push({ icon: faShower, value: details.bathrooms, label: "Banyo" });
        if (details.capacity) metaPostDetails.push({ icon: faUsers, value: `${details.capacity} kişi`, label: "Kapasite" });
        if (details.rating) metaPostDetails.push({ icon: faStar, value: details.rating.toFixed(2), label: "Puan" });
        if (details.propertyType) metaPostDetails.push({ icon: faHome, value: details.propertyType, label: "Tür" });
    }

    const DetailItem = ({ detail }) => (
        <View
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 6,
                minHeight: 50,
                width: '100%',
            }}
        >
            <View style={iconShadowStyle}>
                <FontAwesomeIcon
                    icon={detail.icon}
                    size={22}
                    color="white"
                />
            </View>
            <Text
                style={{
                    color: 'white',
                    marginTop: 4,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 13,
                    ...textShadowStyle,
                }}
                numberOfLines={1}
            >
                {detail.value}
            </Text>
            <Text
                style={{
                    color: 'rgba(255,255,255,0.95)',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: '500',
                    ...subtitleShadowStyle,
                }}
                numberOfLines={1}
            >
                {detail.label}
            </Text>
        </View>
    );

    return (
        <>
            <View
                className="absolute right-1"
                style={{
                    top: safeAreaInsets.top + 20,
                    zIndex: 1000,
                    width: 60,
                    maxHeight: 600,
                }}
            >
                <View className="py-1">
                    {/* 1. RESİM SAYACI */}
                    {totalImages > 1 && (
                        <View
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 6,
                                minHeight: 50,
                                width: '100%',
                                marginBottom: 4,
                            }}
                        >
                            <View style={iconShadowStyle}>
                                <Text
                                    style={{
                                        color: 'white',
                                        fontSize: 16,
                                        fontWeight: '700',
                                        textAlign: 'center',
                                        ...counterShadowStyle,
                                    }}
                                >
                                    {currentImageIndex + 1}/{totalImages}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 2. DETAYLAR BUTONU */}
                    <TouchableOpacity
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            paddingVertical: 6,
                            minHeight: 50,
                            marginBottom: 4,
                        }}
                        onPress={() => setIsDetailModalVisible(true)}
                    >
                        <View style={iconShadowStyle}>
                            <FontAwesomeIcon
                                icon={faEllipsis}
                                size={20}
                                color="white"
                            />
                        </View>
                        <Text
                            style={{
                                color: 'white',
                                marginTop: 3,
                                textAlign: 'center',
                                fontWeight: '600',
                                fontSize: 11,
                                ...textShadowStyle,
                            }}
                        >
                            Detaylar
                        </Text>
                    </TouchableOpacity>

                    {/* 3. SCROLL VIEW - İçerik türüne göre farklı render */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        scrollEnabled={!isHorizontalScrollActive}
                        contentContainerStyle={{
                            alignItems: 'center',
                        }}
                    >
                        {/* META POST İÇİN - Tüm detaylar direkt görünür */}
                        {details.type === "meta" && (
                            <>
                                {metaPostDetails.map((detail, index) => (
                                    <DetailItem key={`meta-${index}`} detail={detail} />
                                ))}
                            </>
                        )}

                        {/* NORMAL POST İÇİN - Animasyonlu yapı */}
                        {details.type === "normal" && (
                            <>
                                {/* Temel detaylar - Her zaman görünür */}
                                {basicDetails.map((detail, index) => (
                                    <DetailItem key={`basic-${index}`} detail={detail} />
                                ))}

                                {/* KAPALI durumdayken "Daha Fazla" butonu */}
                                {additionalDetails.length > 0 && !isExpanded && !isAnimating && (
                                    <TouchableOpacity
                                        style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            paddingVertical: 8,
                                        }}
                                        onPress={toggleExpanded}
                                    >
                                        <Animated.View style={[iconShadowStyle, chevronAnimatedStyle]}>
                                            <FontAwesomeIcon
                                                icon={faChevronDown}
                                                size={22}
                                                color="white"
                                            />
                                        </Animated.View>
                                        <Text
                                            style={{
                                                color: 'rgba(255,255,255,0.95)',
                                                marginTop: 2,
                                                textAlign: 'center',
                                                fontWeight: '500',
                                                fontSize: 11,
                                                ...subtitleShadowStyle,
                                            }}
                                        >
                                            Daha Fazla
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Ek detaylar - Animasyonla açılır/kapanır */}
                                {additionalDetails.length > 0 && (
                                    <Animated.View style={[expandedAnimatedStyle, { width: '100%' }]}>
                                        {additionalDetails.map((detail, index) => (
                                            <DetailItem key={`additional-${index}`} detail={detail} />
                                        ))}
                                    </Animated.View>
                                )}

                                {/* AÇIK durumdayken "Daha Az" butonu */}
                                {additionalDetails.length > 0 && isExpanded && !isAnimating && (
                                    <TouchableOpacity
                                        style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            paddingVertical: 8,
                                            marginTop: 16,
                                        }}
                                        onPress={toggleExpanded}
                                    >
                                        <Animated.View style={[iconShadowStyle, chevronAnimatedStyle]}>
                                            <FontAwesomeIcon
                                                icon={faChevronDown}
                                                size={22}
                                                color="white"
                                            />
                                        </Animated.View>
                                        <Text
                                            style={{
                                                color: 'rgba(255,255,255,0.95)',
                                                marginTop: 2,
                                                textAlign: 'center',
                                                fontWeight: '500',
                                                fontSize: 11,
                                                ...subtitleShadowStyle,
                                            }}
                                        >
                                            Daha Az
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* Detail Modal */}
            <ExploreDetailModal
                visible={isDetailModalVisible}
                onClose={() => setIsDetailModalVisible(false)}
                listing={listing}
            />
        </>
    );
});

export default ExploreActionButtons;