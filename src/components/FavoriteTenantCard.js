// components/FavoriteTenantCard.js
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/pro-solid-svg-icons';
import { faHeart } from '@fortawesome/pro-regular-svg-icons';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../redux/slices/authSlice';
import { useGetMatchingScoreQuery } from '../redux/api/apiSlice';

const { width: screenWidth } = Dimensions.get('window');

// Match Score gösterim fonksiyonu
const getMatchScoreInfo = (score) => {
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
                toValue: matchScore,
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
                        %{Math.round(matchScore * 100)}
                    </Text>
                </View>
            </View>
        );
    }

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
                }}
            >
                %{Math.round(matchScore * 100)} {scoreInfo.text}
            </Text>
        </View>
    );
};

const FavoriteTenantCard = ({
    tenant,
    onRemoveFavorite,
    onProfilePress,
    removingFavorite,
    navigation
}) => {
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const expectation = tenant.landLordExpectation;

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
                    <FontAwesomeIcon
                        key={i}
                        icon={faStarSolid}
                        size={12}
                        color="#fbbf24"
                        style={{ marginRight: 2 }}
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={faStarSolid}
                        size={12}
                        color="#fbbf24"
                        style={{ marginRight: 2, opacity: 0.5 }}
                    />
                );
            } else {
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={faStarSolid}
                        size={12}
                        color="#d1d5db"
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

    // ✅ Direkt tenant objesi içindeki matchScore'u kullan - Ayrı query gereksiz!
    const matchScore = tenant.matchScore || 0;

    // Debug logging
    console.log("🔍 FavoriteTenantCard Debug:", {
        tenantUserId: tenant.userId,
        tenantObject: tenant,
        directMatchScore: tenant.matchScore,
        finalMatchScore: matchScore
    });

    return (
        <TouchableOpacity
            style={{ marginHorizontal: 10 }}
            className="mb-4 pt-4"
            onPress={() => onProfilePress(tenant, "tenant")}
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
                            uri: tenant.profileImageUrl && tenant.profileImageUrl !== "default_profile_image_url"
                                ? tenant.profileImageUrl
                                : "https://ui-avatars.com/api/?name=K&background=f3f4f6&color=374151&size=80",
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
                            {tenant.user ?
                                `${tenant.user.name} ${tenant.user.surname}` :
                                "Kiracı"
                            }
                        </Text>
                        <View className="px-3 py-1 rounded-full">
                            <Text className="text-sm text-gray-600 font-medium">Kiracı</Text>
                        </View>
                    </View>

                    {/* Rating */}
                    <View className="mt-3">
                        {renderStarRating(tenant.profileRating || 0, tenant.ratingCount || 0)}
                    </View>

                    {/* Match Score - sadece EVSAHIBI için */}
                    {userRole === "EVSAHIBI" && (
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
                    {/* Budget */}
                    {expectation?.minRentBudget && expectation?.maxRentBudget && (
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-s font-semibold">Bütçe:</Text>
                            </View>
                            <Text
                                style={{ fontSize: 13 }}
                                className="text-gray-900 font-semibold"
                            >
                                {formatPrice(expectation.minRentBudget)} - {formatPrice(expectation.maxRentBudget)} ₺
                            </Text>
                        </View>
                    )}

                    {/* Monthly Income */}
                    {expectation?.monthlyIncome && (
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-s font-semibold">Aylık Gelir:</Text>
                            </View>
                            <Text
                                style={{ fontSize: 13 }}
                                className="text-gray-900 font-semibold"
                            >
                                {formatPrice(expectation.monthlyIncome)} ₺
                            </Text>
                        </View>
                    )}

                    {/* Occupants */}
                    {expectation?.occupantCount && (
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-s font-semibold">Kişi Sayısı:</Text>
                            </View>
                            <Text
                                style={{ fontSize: 13 }}
                                className="text-gray-900 font-semibold"
                            >
                                {expectation.occupantCount} kişi
                            </Text>
                        </View>
                    )}

                    {/* Location */}
                    {expectation?.city && expectation?.district && (
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-s font-semibold">Tercih Edilen Bölge:</Text>
                            </View>
                            <Text
                                style={{ fontSize: 13 }}
                                className="text-gray-900 font-semibold"
                                numberOfLines={1}
                            >
                                {expectation.district}, {expectation.city}
                            </Text>
                        </View>
                    )}

                    {/* Phone Number */}
                    {tenant.user?.phoneNumber && (
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-s font-semibold">Telefon:</Text>
                            </View>
                            <Text
                                style={{ fontSize: 13 }}
                                className="text-gray-900 font-semibold"
                                numberOfLines={1}
                            >
                                {tenant.user.phoneNumber}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {tenant.profileDescription && (
                    <View className="mb-4 py-3 bg-white rounded-xl gap-2">
                        <Text className="mt-2 text-xl ">Hakkında</Text>
                        <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
                            {tenant.profileDescription}
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
                                partnerId: tenant.userId,
                                partnerName: tenant.user ?
                                    `${tenant.user.name} ${tenant.user.surname}` :
                                    "Kiracı",
                                partner: {
                                    id: tenant.userId,
                                    name: tenant.user?.name,
                                    surname: tenant.user?.surname,
                                    userName: tenant.user?.userName,
                                    profileImageUrl: tenant.profileImageUrl,
                                    ...tenant.user
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
                            onRemoveFavorite(tenant.tenantProfileId, "tenant");
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

export default FavoriteTenantCard;