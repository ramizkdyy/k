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
} from "@fortawesome/pro-solid-svg-icons";
import ExploreDetailModal from "../modals/ExploreDetailModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ExploreActionButtons = memo(({ listing, safeAreaInsets }) => {
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

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

    // Text shadow stilleri (ExplorePostInfo'dan alındı)
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

    // Normal Post için detaylar
    const normalPostDetails = [
        { icon: faBed, value: details.rooms, label: "Oda" },
        { icon: faBedBunk, value: details.bedrooms, label: "Y.Odası" },
        { icon: faShower, value: details.bathrooms, label: "Banyo" },
        { icon: faRuler, value: details.area ? `${details.area}m²` : null, label: "Alan" },
        { icon: faBuilding, value: details.floor !== undefined ? `${details.floor}/${details.totalFloors}` : null, label: "Kat" },
        { icon: faCalendar, value: details.buildingAge, label: "Bina Yaşı" },
        { icon: faMoneyBills, value: details.dues ? `${details.dues}₺` : "Yok", label: "Aidat" },
        { icon: faCoins, value: details.deposit ? `${details.deposit}₺` : "Yok", label: "Depozito" },
    ];

    // Meta Post için detaylar
    const metaPostDetails = [
        { icon: faBed, value: details.rooms, label: "Oda" },
        { icon: faShower, value: details.bathrooms, label: "Banyo" },
        { icon: faUsers, value: details.capacity ? `${details.capacity} kişi` : null, label: "Kapasite" },
        { icon: faStar, value: details.rating ? details.rating.toFixed(2) : null, label: "Puan" },
        { icon: faHome, value: details.propertyType, label: "Tür" },
    ];

    const displayDetails = details.type === "normal"
        ? normalPostDetails.filter(d => d.value !== null && d.value !== undefined)
        : metaPostDetails.filter(d => d.value !== null && d.value !== undefined);

    return (
        <>
            <View
                className="absolute right-1"
                style={{
                    top: safeAreaInsets.top + 100, // Header'ın hemen altından başlasın
                    zIndex: 1000,
                    width: 60,
                    maxHeight: 600, // Yüksekliği geri artırdım
                }}
            >
                <View className="py-1">
                    {/* Property Details */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                        contentContainerStyle={{
                            alignItems: 'center',
                        }}
                    >
                        {displayDetails.map((detail, index) => (
                            <View
                                key={`detail-${index}`}
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
                        ))}

                        {/* Detail Button - En altta */}
                        <TouchableOpacity
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
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