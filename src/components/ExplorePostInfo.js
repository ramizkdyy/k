import React, { memo, useRef, useEffect } from "react";
import {
    View,
    Text,
    Animated,
    Image,
    TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native"; // Hook eklendi
import { selectCurrentUser } from "../redux/slices/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faLocationDot,
} from "@fortawesome/pro-solid-svg-icons";
import { faHeart } from "@fortawesome/pro-solid-svg-icons";

const ExplorePostInfo = memo(({ listing, safeAreaInsets }) => { // navigation prop'u kaldırıldı
    const navigation = useNavigation(); // Hook ile navigation al
    const currentUser = useSelector(selectCurrentUser);
    // Kullanıcı rolünü al
    const userRole = currentUser?.role || currentUser?.userRole;

    // Match Score gösterim fonksiyonu
    const getMatchScoreInfo = (score) => {
        // Score zaten 0-1 aralığında olmalı, yüzdeye çevir
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
                    toValue: matchScore, // Score zaten 0-1 aralığında
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
                            className="bg-white rounded-full overflow-hidden"
                            style={{
                                height: currentSize.barHeight,
                                width: currentSize.barWidth,
                                marginRight: 6,
                            }}
                        >
                            <Animated.View
                                style={{
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
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

            // Match score'u doğru formatta al
            let matchScore = null;
            const rawMatchScore = listing.matchScore || post.matchScore;

            if (rawMatchScore) {
                // Eğer obje formatında geliyorsa, içindeki matchScore field'ını kullan
                if (typeof rawMatchScore === 'object' && rawMatchScore.matchScore !== undefined) {
                    matchScore = rawMatchScore.matchScore / 100; // 0-100 aralığından 0-1'e çevir
                } else if (typeof rawMatchScore === 'number') {
                    // Eğer direkt sayı geliyorsa
                    matchScore = rawMatchScore > 1 ? rawMatchScore / 100 : rawMatchScore; // 0-1 aralığına getir
                }
            }

            return {
                title: post.ilanBasligi || `${post.il} ${post.ilce} ${post.odaSayisi} Kiralık`,
                description: post.postDescription || "",
                location: `${post.il}, ${post.ilce}`,
                price: post.kiraFiyati ? `${post.kiraFiyati.toLocaleString()} ₺` : "",
                rooms: post.odaSayisi || "",
                area: post.brutMetreKare ? `${post.brutMetreKare} m²` : "",
                landlord: post.user ? `${post.user.name} ${post.user.surname}` : "",
                landlordProfilePicture: post.user?.profilePictureUrl || null,
                landlordUserId: post.user?.id || null, // Kullanıcı ID'sini ekle
                landlordUserRole: "EVSAHIBI", // Ev sahibi rolünü ekle
                matchScore: matchScore, // İşlenmiş match score
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
                landlordProfilePicture: null,
                landlordUserId: null,
                landlordUserRole: null,
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
            landlordProfilePicture: null,
            landlordUserId: null,
            landlordUserRole: null,
            matchScore: null,
            postId: null,
            type: "unknown"
        };
    };

    const listingData = getListingData();

    // Kullanıcı profiline git fonksiyonu
    const handleUserProfilePress = () => {
        console.log('handleUserProfilePress called');
        console.log('navigation object:', navigation);
        console.log('landlordUserId:', listingData.landlordUserId);
        console.log('landlordUserRole:', listingData.landlordUserRole);

        if (listingData.landlordUserId && listingData.landlordUserRole) {
            console.log('Attempting to navigate to UserProfile with params:', {
                userId: listingData.landlordUserId,
                userRole: listingData.landlordUserRole
            });

            // AppNavigator'da gördüğümüz gibi ekran adı "UserProfile" olmalı
            navigation.navigate('UserProfile', {
                userId: listingData.landlordUserId,
                userRole: listingData.landlordUserRole
            });
        } else {
            console.log('Navigation failed - missing user data');
        }
    };

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
                right: 96,
                bottom: safeAreaInsets.bottom + 60
            }}
        // pointerEvents="none" kaldırıldı - artık görünecek
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

                {/* Ev sahibi bilgisi - sadece Normal Post için */}
                {listingData.type === "normal" && listingData.landlord && (
                    <View className="mt-1">
                        {/* Ev sahibi profil resmi ve ismi - TouchableOpacity ile sarıldı */}
                        <TouchableOpacity
                            className="flex-row items-center mb-2"
                            onPress={handleUserProfilePress}
                            activeOpacity={0.7}
                        >
                            {/* Profil Resmi */}
                            <View
                                className="mr-2"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 3,
                                }}
                            >
                                <Image
                                    source={{
                                        uri: listingData.landlordProfilePicture || "https://via.placeholder.com/32x32/cccccc/666666?text=U"
                                    }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        borderWidth: 2,
                                        borderColor: 'rgba(255, 255, 255, 0.8)'
                                    }}
                                    resizeMode="cover"
                                />
                            </View>

                            {/* İsim */}
                            <Text
                                className="text-white text-sm font-medium"
                                style={subtitleShadowStyle}
                            >
                                {listingData.landlord}
                            </Text>
                        </TouchableOpacity>

                        {/* Match Score bar - sadece KIRACI için ve score varsa göster */}
                        {userRole === "KIRACI" && listingData.matchScore && listingData.matchScore > 0 ? (
                            <MatchScoreBar
                                matchScore={listingData.matchScore}
                                showBar={true}
                                size="xs"
                            />
                        ) : userRole === "KIRACI" ? (
                            <Text
                                className="text-white text-xs"
                                style={subtitleShadowStyle}
                            >
                                Uyumluluk hesaplanıyor...
                            </Text>
                        ) : null}
                    </View>
                )}
            </View>
        </View>
    );
});

export default ExplorePostInfo;