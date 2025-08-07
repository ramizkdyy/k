import React, { memo, useRef, useEffect } from "react";
import {
    View,
    Text,
    Animated,
} from "react-native";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faLocationDot,
} from "@fortawesome/pro-solid-svg-icons";
import { faHeart } from "@fortawesome/pro-solid-svg-icons";

const ExplorePostInfo = memo(({ listing, safeAreaInsets }) => {
    const currentUser = useSelector(selectCurrentUser);

    // Match Score gösterim fonksiyonu (API'den 0-1 değeri geliyor, yüzdeye çevir)
    const getMatchScoreInfo = (score) => {
        // API'den 0-1 aralığında geliyor, yüzdeye çevir
        const percentage = score * 100;

        if (percentage >= 80)
            return {
                level: "excellent",
                color: "#10b981",
                text: "Mükemmel",
                bgColor: "#dcfce7",
            };
        if (percentage >= 60)
            return {
                level: "good",
                color: "#3b82f6",
                text: "Çok İyi",
                bgColor: "#dbeafe",
            };
        if (percentage >= 40)
            return {
                level: "medium",
                color: "#f59e0b",
                text: "İyi",
                bgColor: "#fef3c7",
            };
        return {
            level: "weak",
            color: "#ef4444",
            text: "Orta",
            bgColor: "#fee2e2",
        };
    };

    // Match Score Bar Component (OffersScreen'den uyarlandı)
    const MatchScoreBar = ({ matchScore, showBar = false, size = "xs" }) => {
        const progressAnim = useRef(new Animated.Value(0)).current;
        const timeoutRef = useRef(null);

        const scoreInfo = getMatchScoreInfo(matchScore);

        // Boyut ayarları
        const sizes = {
            xs: {
                barHeight: 3,
                iconSize: 10,
                textSize: 10,
                containerPadding: 1,
                barWidth: 80,
            },
            sm: {
                barHeight: 4,
                iconSize: 12,
                textSize: 11,
                containerPadding: 2,
                barWidth: 100,
            },
            md: {
                barHeight: 5,
                iconSize: 14,
                textSize: 12,
                containerPadding: 3,
                barWidth: 120,
            },
        };

        const currentSize = sizes[size];

        // Score değiştiğinde debounce ile animasyonu başlat
        useEffect(() => {
            // Önceki timeout'u temizle
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Yeni timeout ayarla
            timeoutRef.current = setTimeout(() => {
                Animated.timing(progressAnim, {
                    toValue: matchScore * 100, // 0-1 değerini 0-100'e çevir
                    duration: 800,
                    useNativeDriver: false,
                }).start();
            }, 150);

            // Cleanup function
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }, [matchScore]);

        if (showBar) {
            return (
                <View style={{ marginTop: currentSize.containerPadding }}>
                    {/* Match Score Barı */}
                    <View className="flex-row items-center">
                        <View
                            className="bg-white/30 rounded-full overflow-hidden"
                            style={{
                                height: currentSize.barHeight,
                                width: currentSize.barWidth,
                                marginRight: 6,
                            }}
                        >
                            <Animated.View
                                style={{
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ["0%", "100%"],
                                        extrapolate: "clamp",
                                    }),
                                    backgroundColor: scoreInfo.color,
                                    height: "100%",
                                    borderRadius: currentSize.barHeight / 2,
                                }}
                            />
                        </View>
                        <Text
                            className="font-medium text-white"
                            style={{
                                fontSize: currentSize.textSize,
                                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                            }}
                        >
                            %{Math.round(matchScore * 100)} {scoreInfo.text}
                        </Text>
                    </View>
                </View>
            );
        }

        // Sadece skor gösterimi (bar olmadan)
        return (
            <View className="flex-row items-center">
                <FontAwesomeIcon
                    color={scoreInfo.color}
                    icon={faHeart}
                    size={currentSize.iconSize}
                />
                <Text
                    className="font-medium ml-1"
                    style={{
                        color: scoreInfo.color,
                        fontSize: currentSize.textSize,
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                    }}
                >
                    %{Math.round(matchScore * 100)} {scoreInfo.text}
                </Text>
            </View>
        );
    };

    // İlan verilerini düzenle
    const getListingData = () => {
        if (listing.postType === "NormalPost" && listing.post) {
            const post = listing.post;

            // DEBUG: Post verilerini console'a yazdır
            console.log("🔍 ExplorePostInfo - Post data:", {
                postType: listing.postType,
                postId: post.postId,
                userId: post.user?.id,
                userName: post.user?.name,
                userSurname: post.user?.surname,
                matchScore: listing.matchScore || post.matchScore || null, // Match score'u ara
                rawListing: listing,
                rawPost: post
            });

            return {
                title: post.ilanBasligi || `${post.il} ${post.ilce} ${post.odaSayisi} Kiralık`,
                description: post.postDescription || "",
                location: `${post.il}, ${post.ilce}`,
                price: post.kiraFiyati ? `${post.kiraFiyati.toLocaleString()} ₺` : "",
                rooms: post.odaSayisi || "",
                area: post.brutMetreKare ? `${post.brutMetreKare} m²` : "",
                landlord: post.user ? `${post.user.name} ${post.user.surname}` : "",
                matchScore: listing.matchScore || post.matchScore || null, // Uyumluluk oranı
                postId: post.postId,
                type: "normal"
            };
        } else if (listing.postType === "MetaPost" && listing.metaPost) {
            const meta = listing.metaPost;
            return {
                title: meta.title || "",
                description: meta.description || "",
                location: meta.location || "",
                price: meta.priceInfo === "Add dates for prices" ? "Fiyat için tarih seçin" : meta.priceInfo || "",
                rooms: meta.bedroomCount ? `${meta.bedroomCount} oda` : "",
                area: "",
                landlord: meta.hostName || "",
                rating: meta.rating || null,
                postId: meta.id,
                type: "meta"
            };
        }
        return {
            title: "Başlık yok",
            description: "",
            location: "",
            price: "",
            rooms: "",
            area: "",
            landlord: "",
            matchScore: null,
            postId: null,
            type: "unknown"
        };
    };

    const listingData = getListingData();

    // DEBUG: Processed listing data'yı console'a yazdır
    console.log("🎯 ExplorePostInfo - Processed listing data:", {
        type: listingData.type,
        landlord: listingData.landlord,
        matchScore: listingData.matchScore,
        hasMatchScore: !!(listingData.matchScore && listingData.matchScore > 0)
    });

    // Güçlü text shadow stil objesi
    const textShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    };

    // Daha güçlü shadow için fiyat
    const priceTextShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.95)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 6,
    };

    // Subtitle için hafif shadow
    const subtitleShadowStyle = {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    };

    return (
        <View
            className="absolute left-1 z-10"
            style={{
                right: 96, // Sağdaki panel için yer bırak
                bottom: safeAreaInsets.bottom + 85
            }}
        >
            <View className="px-3 py-3">
                {/* Fiyat */}
                {listingData.price && (
                    <View className="mb-4" >
                        <Text
                            className="text-white font-bold text-3xl"
                            style={priceTextShadowStyle}
                        >
                            {listingData.price}
                            {listingData.price !== "Fiyat için tarih seçin" && "/ay"}
                        </Text>
                    </View>
                )}

                {/* İlan Başlığı */}
                <Text
                    className="text-white text-2xl font-bold mb-2"
                    style={textShadowStyle}
                    numberOfLines={2}
                >
                    {listingData.title}
                </Text>

                {/* Konum */}
                <View className="flex-row items-center mb-2 ">
                    <View style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.9,
                        shadowRadius: 4,
                    }}>
                        <FontAwesomeIcon icon={faLocationDot} size={14} color="white" />
                    </View>
                    <Text
                        className="text-white text-sm ml-2"
                        style={textShadowStyle}
                    >
                        {listingData.location}
                    </Text>
                </View>

                {/* Ev sahibi bilgisi ve match score - sadece Normal Post için */}
                {listingData.type === "normal" && listingData.landlord && (
                    <View className="mt-1">
                        <Text
                            className="text-white/90 text-xs mb-1"
                            style={subtitleShadowStyle}
                        >
                            👤 {listingData.landlord}
                        </Text>

                        {/* Match Score bar - sadece score varsa göster */}
                        {listingData.matchScore && listingData.matchScore > 0 ? (
                            <MatchScoreBar
                                matchScore={listingData.matchScore}
                                showBar={true}
                                size="xs"
                            />
                        ) : (
                            <Text
                                className="text-white/70 text-xs"
                                style={subtitleShadowStyle}
                            >
                                Uyumluluk hesaplanıyor...
                            </Text>
                        )}
                    </View>
                )}

                {/* Rating - sadece MetaPost için (değişiklik yok) */}
                {listingData.type === "meta" && listingData.rating && (
                    <Text
                        className="text-yellow-400 text-xs mt-1 font-medium"
                        style={subtitleShadowStyle}
                    >
                        ⭐ {listingData.rating}
                    </Text>
                )}
            </View>
        </View>
    );
});

export default ExplorePostInfo;