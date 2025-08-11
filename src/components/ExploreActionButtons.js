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
    const [isExpanded, setIsExpanded] = useState(false);

    // Animation values
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

    // Toggle function
    const toggleExpanded = () => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        if (newExpanded) {
            // Açılıyor - Height animasyonu
            expandedHeight.value = withTiming(250, { // Yaklaşık height değeri
                duration: 400,
            });
            chevronRotation.value = withTiming(180, { duration: 300 });
        } else {
            // Kapanıyor
            expandedHeight.value = withTiming(0, {
                duration: 250,
            });
            chevronRotation.value = withTiming(0, { duration: 300 });
        }
    };

    // Animated styles
    const expandedAnimatedStyle = useAnimatedStyle(() => ({
        height: expandedHeight.value,
        opacity: expandedHeight.value > 0 ? 1 : 0,
        // overflow: 'hidden',
    }));

    const chevronAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${chevronRotation.value}deg` }],
    }));

    // Text shadow stilleri
    const textShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    };

    const subtitleShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    };

    const iconShadowStyle = {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
    };

    // Temel detaylar (her zaman görünür)
    const basicDetails = [];
    if (details.type === "normal") {
        if (details.rooms) basicDetails.push({ icon: faBed, value: details.rooms, label: "Oda" });
        if (details.bedrooms) basicDetails.push({ icon: faBedBunk, value: details.bedrooms, label: "Y.Odası" });
        if (details.bathrooms) basicDetails.push({ icon: faShower, value: details.bathrooms, label: "Banyo" });
        if (details.area) basicDetails.push({ icon: faRuler, value: `${details.area}m²`, label: "Alan" });
    } else {
        if (details.rooms) basicDetails.push({ icon: faBed, value: details.rooms, label: "Oda" });
        if (details.bathrooms) basicDetails.push({ icon: faShower, value: details.bathrooms, label: "Banyo" });
        if (details.capacity) basicDetails.push({ icon: faUsers, value: `${details.capacity} kişi`, label: "Kapasite" });
        if (details.rating) basicDetails.push({ icon: faStar, value: details.rating.toFixed(2), label: "Puan" });
    }

    // Ek detaylar (açılınca görünür)
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
    } else {
        if (details.propertyType) additionalDetails.push({
            icon: faHome,
            value: details.propertyType,
            label: "Tür"
        });
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
                    size={18}
                    color="white"
                />
            </View>
            <Text
                style={{
                    color: 'white',
                    marginTop: 3,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                    ...textShadowStyle,
                }}
                numberOfLines={1}
            >
                {detail.value}
            </Text>
            <Text
                style={{
                    color: 'rgba(255,255,255,0.9)',
                    textAlign: 'center',
                    fontSize: 10,
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
            {/* Ana container - Orijinal pozisyon */}
            <View
                className="absolute right-1"
                style={{
                    top: safeAreaInsets.top + 60,
                    zIndex: 1000,
                    width: 60,
                    maxHeight: 600,
                }}
            >
                <View className="py-1">
                    {/* 1. RESİM SAYACI - İlk sırada */}
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
                                        ...textShadowStyle,
                                    }}
                                >
                                    {currentImageIndex + 1}/{totalImages}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 2. DETAYLAR BUTONU - İkinci sırada, sabit */}
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

                    {/* 3. SCROLL VIEW - Temel bilgiler ve dinamik içerik */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        scrollEnabled={!isHorizontalScrollActive}
                        contentContainerStyle={{
                            alignItems: 'center',
                        }}
                    >
                        {/* Temel detaylar - Her zaman görünür */}
                        {basicDetails.map((detail, index) => (
                            <DetailItem key={`basic-${index}`} detail={detail} />
                        ))}

                        {/* KAPALI durumdayken "Daha Fazla" butonu temel bilgilerin altında */}
                        {additionalDetails.length > 0 && !isExpanded && (
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
                                        size={16}
                                        color="white"
                                    />
                                </Animated.View>
                                <Text
                                    style={{
                                        color: 'rgba(255,255,255,0.9)',
                                        marginTop: 2,
                                        textAlign: 'center',
                                        fontWeight: '500',
                                        fontSize: 10,
                                        ...subtitleShadowStyle,
                                    }}
                                >
                                    Daha Fazla
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Ek detaylar - Açılınca "Daha Fazla" butonunun yerinde renderlanır */}
                        {additionalDetails.length > 0 && (
                            <Animated.View style={[expandedAnimatedStyle, { width: '100%' }]}>
                                {additionalDetails.map((detail, index) => (
                                    <DetailItem key={`additional-${index}`} detail={detail} />
                                ))}
                            </Animated.View>
                        )}

                        {/* AÇIK durumdayken "Daha Az" butonu en altta */}
                        {additionalDetails.length > 0 && isExpanded && (
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
                                        size={16}
                                        color="white"
                                    />
                                </Animated.View>
                                <Text
                                    style={{
                                        color: 'rgba(255,255,255,0.9)',
                                        marginTop: 2,
                                        textAlign: 'center',
                                        fontWeight: '500',
                                        fontSize: 10,
                                        ...subtitleShadowStyle,
                                    }}
                                >
                                    Daha Az
                                </Text>
                            </TouchableOpacity>
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