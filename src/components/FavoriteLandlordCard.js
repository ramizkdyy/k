// components/FavoriteLandlordCard.js
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Star, Heart } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../redux/slices/authSlice';

const { width: screenWidth } = Dimensions.get('window');

// Match Score gösterim fonksiyonu - API'den gelen değer 0-100 arası
const getMatchScoreInfo = (score) => {
    // Score zaten 0-100 arası geliyor, tekrar *100 yapmaya gerek yok
    const percentage = score;
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

// Match Score Bar Component
const MatchScoreBar = ({ matchScore, showBar = true, size = "sm" }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    const scoreInfo = getMatchScoreInfo(matchScore);

    const sizes = {
        sm: {
            barHeight: 5,
            iconSize: 12,
            textSize: 12,
            containerPadding: 2,
            barWidth: screenWidth * 0.5,
        },
    };

    const currentSize = sizes[size];

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            Animated.timing(progressAnim, {
                toValue: matchScore / 100, // 0-1 arası normalize et
                duration: 800,
                useNativeDriver: false,
            }).start();
        }, 200);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [matchScore]);

    if (showBar) {
        return (
            <View style={{ marginTop: currentSize.containerPadding * 2 }}>
                <View className="flex-row items-center">
                    <View
                        className="bg-gray-100 rounded-full overflow-hidden"
                        style={{
                            height: currentSize.barHeight,
                            width: currentSize.barWidth,
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
                </View>
                <View className="flex flex-row justify-between items-center">
                    <Text
                        className="text-xs mt-1"
                        style={{
                            color: scoreInfo.color,
                        }}
                    >
                        {scoreInfo.text} Uyumluluk
                    </Text>
                    <Text
                        className="font-medium ml-1"
                        style={{
                            color: scoreInfo.color,
                            fontSize: currentSize.textSize,
                        }}
                    >
                        %{Math.round(matchScore)}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-row items-center">
            <Heart
                color={scoreInfo.color}
                size={currentSize.iconSize}
            />
            <Text
                className="font-medium ml-1"
                style={{
                    color: scoreInfo.color,
                    fontSize: currentSize.textSize,
                }}
            >
                %{Math.round(matchScore)} {scoreInfo.text}
            </Text>
        </View>
    );
};

const FavoriteLandlordCard = ({
    landlord,
    onRemoveFavorite,
    onProfilePress,
    removingFavorite,
    navigation,
    matchingScore = 0
}) => {
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR').format(price);
    };

    const renderStarRating = (rating, ratingCount) => {
        if (!rating || rating === 0) {
            return (
                <View className="flex-row items-center">
                    <Text className="text-sm text-gray-500">Henüz değerlendirilmemiş</Text>
                </View>
            );
        }

        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Star
                        key={i}
                        size={12}
                        color="#fbbf24"
                        fill="#fbbf24"
                        style={{ marginRight: 2 }}
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Star
                        key={i}
                        size={12}
                        color="#fbbf24"
                        fill="#fbbf24"
                        style={{ marginRight: 2, opacity: 0.5 }}
                    />
                );
            } else {
                stars.push(
                    <Star
                        key={i}
                        size={12}
                        color="#d1d5db"
                        fill="#d1d5db"
                        style={{ marginRight: 2 }}
                    />
                );
            }
        }

        return (
            <View className="flex-row items-center">
                <View className="flex-row">{stars}</View>
                <Text className="text-sm text-gray-600 ml-2">
                    {rating.toFixed(1)} ({ratingCount})
                </Text>
            </View>
        );
    };

    // Doğru matching score'u al
    const matchScore = matchingScore || landlord.matchingScore || landlord.matchScore || 0;

    console.log("🔍 FavoriteLandlordCard Debug:", {
        directMatchScore: matchingScore,
        landlordMatchScore: landlord.matchingScore,
        landlordMatchScore2: landlord.matchScore,
        finalMatchScore: matchScore
    });

    return (
        <TouchableOpacity
            style={{ marginHorizontal: 10 }}
            className="mb-4 pt-4"
            onPress={() => onProfilePress(landlord, "landlord")}
            activeOpacity={0.98}
        >
            <View
                className="bg-white p-6 border-gray-200"
                style={{
                    borderRadius: 30,
                    borderWidth: 0.5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4
                }}
            >
                {/* Header with Profile Image and Basic Info */}
                <View className="flex-col items-center mb-4">
                    <Image
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                        }}
                        className="border border-gray-100"
                        source={{
                            uri: landlord.profileImageUrl && landlord.profileImageUrl !== "default_profile_image_url"
                                ? landlord.profileImageUrl
                                : "https://ui-avatars.com/api/?name=E&background=f3f4f6&color=374151&size=80",
                        }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                    />

                    <View className="flex-1 mt-3 items-center">
                        <Text
                            style={{ fontSize: 18, fontWeight: 700 }}
                            className="text-gray-800 mb-1 text-center"
                            numberOfLines={1}
                        >
                            {landlord.user ?
                                `${landlord.user.name} ${landlord.user.surname}` :
                                "Ev Sahibi"
                            }
                        </Text>
                        <View className="px-3 py-1 rounded-full">
                            <Text className="text-sm text-gray-600 font-medium">Ev Sahibi</Text>
                        </View>
                    </View>

                    {/* Rating */}
                    <View className="mt-3">
                        {renderStarRating(landlord.profileRating || 0, landlord.ratingCount || 0)}
                    </View>

                    {/* Match Score - sadece KIRACI için */}
                    {userRole === "KIRACI" && matchScore > 0 && (
                        <View className="mt-3 w-full items-center justify-center">
                            <MatchScoreBar
                                matchScore={matchScore}
                                showBar={true}
                                size="sm"
                            />
                        </View>
                    )}
                </View>

                {/* Details Grid */}
                <View className="gap-3 mb-4">
                    {/* Properties Count */}
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <Text className="text-gray-600 text-s font-semibold">İlan Sayısı:</Text>
                        </View>
                        <Text
                            style={{ fontSize: 13 }}
                            className="text-gray-900 font-semibold"
                        >
                            {landlord.rentalPosts?.length || 0} ilan
                        </Text>
                    </View>

                    {/* Tenant Expectations */}
                    {landlord.tenantExpectation && (
                        <>
                            {/* Rent Amount */}
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Text className="text-gray-600 text-s font-semibold">Kira Beklentisi:</Text>
                                </View>
                                <Text
                                    style={{ fontSize: 13 }}
                                    className="text-gray-900 font-semibold"
                                >
                                    {formatPrice(landlord.tenantExpectation.rentAmount)} ₺
                                </Text>
                            </View>

                            {/* Deposit */}
                            {landlord.tenantExpectation.isDepositRequired && (
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-600 text-s font-semibold">Depozito:</Text>
                                    </View>
                                    <Text
                                        style={{ fontSize: 13 }}
                                        className="text-gray-900 font-semibold"
                                    >
                                        {formatPrice(landlord.tenantExpectation.depositAmount)} ₺
                                    </Text>
                                </View>
                            )}

                            {/* Max Occupants */}
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Text className="text-gray-600 text-s font-semibold">Max Kişi:</Text>
                                </View>
                                <Text
                                    style={{ fontSize: 13 }}
                                    className="text-gray-900 font-semibold"
                                >
                                    {landlord.tenantExpectation.maximumOccupants} kişi
                                </Text>
                            </View>
                        </>
                    )}

                    {/* Location */}
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <Text className="text-gray-600 text-s font-semibold">Bölge:</Text>
                        </View>
                        <Text
                            style={{ fontSize: 13 }}
                            className="text-gray-900 font-semibold"
                            numberOfLines={1}
                        >
                            {landlord.tenantExpectation?.city && landlord.tenantExpectation?.district
                                ? `${landlord.tenantExpectation.district}, ${landlord.tenantExpectation.city}`
                                : "İstanbul"
                            }
                        </Text>
                    </View>

                    {/* Phone Number */}
                    {landlord.user?.phoneNumber && (
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-s font-semibold">Telefon:</Text>
                            </View>
                            <Text
                                style={{ fontSize: 13 }}
                                className="text-gray-900 font-semibold"
                                numberOfLines={1}
                            >
                                {landlord.user.phoneNumber}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {landlord.profileDescription && (
                    <View className="mb-4 p-3 bg-gray-50 rounded-xl">
                        <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
                            {landlord.profileDescription}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        className="flex-1 bg-gray-900 py-4 px-6 rounded-full flex-row items-center justify-center"
                        onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate("ChatDetail", {
                                partnerId: landlord.userId,
                                partnerName: landlord.user ?
                                    `${landlord.user.name} ${landlord.user.surname}` :
                                    "Ev Sahibi",
                                partner: {
                                    id: landlord.userId,
                                    name: landlord.user?.name,
                                    surname: landlord.user?.surname,
                                    userName: landlord.user?.userName,
                                    profileImageUrl: landlord.profileImageUrl,
                                    ...landlord.user
                                }
                            });
                        }}
                    >
                        <Text className="text-white font-semibold ml-2">Mesaj Gönder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white flex-1 py-3 px-6 rounded-full items-center justify-center border-2 border-gray-100"
                        onPress={(e) => {
                            e.stopPropagation();
                            onRemoveFavorite(landlord.landlordProfileId, "landlord");
                        }}
                        disabled={removingFavorite}
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1
                        }}
                    >
                        <Text className="text-gray-900 font-semibold ml-2">Favoriden Kaldır</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default FavoriteLandlordCard;