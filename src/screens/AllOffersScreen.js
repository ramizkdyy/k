import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Platform,
    Animated,
    Dimensions,
    StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import { selectCurrentUser } from "../redux/slices/authSlice";
import {
    useGetOffersByPostIdQuery,
    useLandlordOfferActionMutation,
    useRentOfferMutation
} from "../redux/api/apiSlice";
import Icon from "react-native-vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { ChevronLeft, Mail, Check, X, Clock, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const AllOffersScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { postId } = route.params;
    const currentUser = useSelector(selectCurrentUser);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    // Debug logs
    console.log("🔵 AllOffersScreen RENDERED");
    console.log("🔵 PostId:", postId);
    console.log("🔵 CurrentUser:", currentUser?.id);

    // Animation for header
    const scrollY = useRef(new Animated.Value(0)).current;

    // API Query
    const {
        data: offersData,
        isLoading,
        refetch,
        error,
    } = useGetOffersByPostIdQuery(postId, {
        skip: !postId,
    });

    // ADD THIS LINE: Missing mutation hook
    const [landlordOfferAction] = useLandlordOfferActionMutation();
    const [rentOffer] = useRentOfferMutation(); // YENI EKLEME

    // Debug API response
    useEffect(() => {
        console.log("🟢 API Response - Loading:", isLoading);
        console.log("🟢 API Response - Error:", error);
        console.log("🟢 API Response - Data:", offersData);
    }, [isLoading, error, offersData]);

    // Process and sort offers
    const processOffers = () => {
        if (!offersData?.result || !Array.isArray(offersData.result)) {
            return [];
        }

        // Teklifleri sırala: Önce kabul edilenler, sonra bekleyenler, sonra reddedilenler
        const sortedOffers = [...offersData.result].sort((a, b) => {
            // Status önceliği: 1 (kabul) > 0 (beklemede) > 2 (red)
            const statusOrder = { 1: 0, 0: 1, 2: 2 };
            const orderA = statusOrder[a.status] ?? 3;
            const orderB = statusOrder[b.status] ?? 3;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // Aynı status içinde tarihe göre sırala (yeniden eskiye)
            return new Date(b.offerTime) - new Date(a.offerTime);
        });

        return sortedOffers;
    };

    const offers = processOffers();

    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleAcceptOffer = async (offerId) => {
        Alert.alert(
            "Teklifi Kabul Et",
            "Bu teklifi kabul etmek istediğinizden emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kabul Et",
                    onPress: async () => {
                        try {
                            console.log("Accepting offer:", {
                                userId: currentUser?.id,
                                offerId: offerId,
                                actionType: 0, // Accept action
                            });

                            const response = await landlordOfferAction({
                                userId: currentUser?.id,
                                offerId: Number(offerId),
                                actionType: 0, // Accept action
                            }).unwrap();

                            console.log("Accept response:", response);

                            if (response.isSuccess) {
                                Alert.alert("Başarılı", "Teklif kabul edildi.");
                                await refetch();
                            } else {
                                Alert.alert(
                                    "Hata",
                                    response.message || "Teklif kabul edilemedi."
                                );
                            }
                        } catch (error) {
                            console.log("Accept offer error:", error);
                            Alert.alert(
                                "Hata",
                                error?.data?.message ||
                                "Teklif kabul edilirken bir hata oluştu."
                            );
                        }
                    },
                },
            ]
        );
    };


    // 3. YENI FONKSİYON: Kiraya verme işlemi
    const handleRentOffer = async (offerId, tenantName) => {
        Alert.alert(
            "Kiraya Ver",
            `Bu evi ${tenantName} adlı kiracıya kiraya vermek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ilanınız pasif hale gelecektir.`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kiraya Ver",
                    style: "default",
                    onPress: async () => {
                        try {
                            console.log("Renting property:", {
                                userId: currentUser?.id,
                                offerId: offerId,
                                actionType: 2, // Rent action
                            });

                            const response = await rentOffer({
                                userId: currentUser?.id,
                                offerId: Number(offerId),
                            }).unwrap();

                            console.log("Rent response:", response);

                            if (response.isSuccess) {
                                Alert.alert(
                                    "Başarılı",
                                    "Ev başarıyla kiraya verildi! İlan artık aktif değil.",
                                    [
                                        {
                                            text: "Tamam",
                                            onPress: async () => {
                                                await refetch();
                                                // Ana sayfaya geri dön
                                                navigation.goBack();
                                            }
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert(
                                    "Hata",
                                    response.message || "Ev kiraya verilemedi."
                                );
                            }
                        } catch (error) {
                            console.log("Rent offer error:", error);
                            Alert.alert(
                                "Hata",
                                error?.data?.message || "Ev kiraya verilirken bir hata oluştu."
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleRejectOffer = async (offerId) => {
        Alert.alert(
            "Teklifi Reddet",
            "Bu teklifi reddetmek istediğinizden emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Reddet",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log("Rejecting offer:", {
                                userId: currentUser?.id,
                                offerId: offerId,
                                actionType: 1, // Reject action
                            });

                            const response = await landlordOfferAction({
                                userId: currentUser?.id,
                                offerId: Number(offerId),
                                actionType: 1, // Reject action
                            }).unwrap();

                            console.log("Reject response:", response);

                            if (response.isSuccess) {
                                Alert.alert("Başarılı", "Teklif reddedildi.");
                                await refetch();
                            } else {
                                Alert.alert(
                                    "Hata",
                                    response.message || "Teklif reddedilemedi."
                                );
                            }
                        } catch (error) {
                            console.log("Reject offer error:", error);
                            Alert.alert(
                                "Hata",
                                error?.data?.message || "Teklif reddedilirken bir hata oluştu."
                            );
                        }
                    },
                },
            ]
        );
    };

    const getStatusText = (status) => {
        switch (status) {
            case 0:
                return { text: "Beklemede", color: "#f59e0b", Icon: Clock };
            case 1:
                return { text: "Kabul Edildi", color: "#22c55e", Icon: Check };
            case 2:
                return { text: "Reddedildi", color: "#ef4444", Icon: X };
            case 3: // YENI: Kiraya verildi durumu
                return { text: "Kiraya Verildi", color: "#8b5cf6", Icon: Check };
            default:
                return { text: "Bilinmiyor", color: "#6b7280", Icon: Clock };
        }
    };

    const renderOfferItem = (item, index) => {
        const statusInfo = getStatusText(item.status);
        const offeringUser = item.offeringUser || {};
        const user = offeringUser.user || {};

        return (
            <TouchableOpacity
                key={item.offerId?.toString() || index.toString()}
                className="px-4 mb-4"
                onPress={() => {
                    navigation.navigate("UserProfile", {
                        userId: item.userId || offeringUser.userId,
                        userRole: "KIRACI",
                    });
                }}
                activeOpacity={0.98}
            >
                <View
                    className="bg-white border border-gray-100"
                    style={{
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2
                    }}
                >
                    {/* Status Header */}
                    <View className="px-4 py-3">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <statusInfo.Icon
                                    size={14}
                                    color="#111827"
                                />
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: '600'
                                    }}
                                    className="ml-2 text-gray-900"
                                >
                                    {statusInfo.text}
                                </Text>
                            </View>
                            <Text className="text-gray-500 text-xs">
                                {item.offerTime
                                    ? new Date(item.offerTime).toLocaleDateString("tr-TR", {
                                        day: "numeric",
                                        month: "short",
                                    })
                                    : ""}
                            </Text>
                        </View>
                    </View>

                    {/* Main Content */}
                    <View className="p-4">
                        {/* User Info Row */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center flex-1">
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full justify-center items-center mr-3 bg-gray-100 border border-gray-200"
                                    onPress={() => {
                                        navigation.navigate("UserProfile", {
                                            userId: item.userId || offeringUser.userId,
                                            userRole: "KIRACI",
                                        });
                                    }}
                                    activeOpacity={0.8}
                                >
                                    {offeringUser.profileImageUrl ? (
                                        <Image
                                            source={{ uri: offeringUser.profileImageUrl }}
                                            style={{ width: 48, height: 48, borderRadius: 24 }}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <Text className="text-lg font-semibold text-gray-600">
                                            {user.name?.charAt(0) || "K"}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <View className="flex-1">
                                    <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
                                        {user.name} {user.surname}
                                    </Text>

                                    {offeringUser.profileRating > 0 && (
                                        <View className="flex-row items-center mt-1">
                                            <Star
                                                size={12}
                                                color="#f59e0b"
                                                fill="#f59e0b"
                                            />
                                            <Text className="text-gray-500 text-xs ml-1">
                                                {offeringUser.profileRating.toFixed(1)}
                                                ({offeringUser.ratingCount})
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Offer Amount */}
                            <View className="items-end">
                                <Text className="text-2xl font-bold text-gray-900">
                                    ₺{item.offerAmount?.toLocaleString() || "0"}
                                </Text>
                                <Text className="text-xs text-gray-500">Teklif</Text>
                            </View>
                        </View>

                        {/* Offer Description */}
                        {item.offerDescription && (
                            <View className="rounded-xl mb-4">
                                <Text className="text-gray-700 text-s" numberOfLines={3}>
                                    {item.offerDescription}
                                </Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        {item.status === 0 && (
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    className="flex-1 bg-gray-900 rounded-full justify-center items-center py-3"
                                    onPress={() => handleAcceptOffer(item.offerId)}
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white font-semibold text-base">
                                        Kabul Et
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-white border border-gray-900 rounded-full justify-center items-center py-3"
                                    onPress={() => handleRejectOffer(item.offerId)}
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-gray-900 font-semibold text-base">
                                        Reddet
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Kabul edilen teklifler için Kiraya Ver butonu - sadece status 1 ise */}
                        {item.status === 1 && (
                            <TouchableOpacity
                                className="bg-gray-900 rounded-full justify-center items-center py-3"
                                onPress={() => handleRentOffer(
                                    item.offerId,
                                    `${user.name} ${user.surname}`
                                )}
                                activeOpacity={0.8}
                            >
                                <Text className="text-white font-semibold text-base">
                                    Kiraya Ver
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Kiraya verilmiş teklifler için bilgi metni - status 3 ise */}
                        {item.status === 3 && (
                            <View className="bg-purple-50 border border-purple-200 rounded-full py-3 px-4">
                                <Text className="text-purple-700 font-semibold text-base text-center">
                                    Bu ev kiraya verildi
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View className="flex-1 justify-center items-center px-8 py-20">
            <Mail size={60} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg font-semibold mt-4 text-center">
                Bu ilana henüz teklif gelmemiş
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
                İlanınıza teklif geldiğinde burada görüntülenecektir.
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text className="mt-3 text-gray-500">Teklifler yükleniyor...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center p-8">
                    <Text className="text-xl font-semibold text-gray-900 mt-2 mb-2 text-center">
                        Bir hata oluştu
                    </Text>
                    <Text className="text-base text-gray-500 text-center mb-4">
                        Teklifler yüklenirken bir problem oluştu. Lütfen daha sonra tekrar
                        deneyin.
                    </Text>
                    <TouchableOpacity
                        className="border border-gray-900 px-6 py-3 rounded-full"
                        onPress={handleRefresh}
                    >
                        <Text className="text-gray-900 font-medium">Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
            />

            {/* Header */}
            <View
                style={{
                    paddingTop: insets.top,
                    backgroundColor: "white",
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                }}
            >
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ChevronLeft size={20} color="#111827" />
                    </TouchableOpacity>

                    <View className="flex-1 px-4">
                        <Text className="text-lg font-bold text-gray-800 text-center">
                            İlan Teklifleri
                        </Text>
                        <Text className="text-sm text-gray-500 text-center">
                            {offers.length} teklif
                        </Text>
                    </View>

                    <View style={{ width: 36 }} />
                </View>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: 100,
                    flexGrow: 1
                }}
            >
                {offers.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View>
                        {/* YENI: Rented Offers Section - EN ÜSTTE */}
                        {offers.filter(o => o.status === 3).length > 0 && (
                            <View className="mb-6">
                                <Text className="text-lg font-semibold text-gray-900 px-4 mb-3">
                                    Kiralanan Ev
                                </Text>
                                {offers.filter(o => o.status === 3).map((item, index) =>
                                    renderOfferItem(item, `rented-${index}`)
                                )}
                            </View>
                        )}
                        {/* Accepted Offers Section */}
                        {/* Accepted Offers Section */}
                        {offers.filter(o => o.status === 1).length > 0 && (
                            <View className="mb-6">
                                <Text className="text-lg font-semibold text-gray-900 px-4 mb-3">
                                    Kabul Edilen Teklifler
                                </Text>
                                {offers.filter(o => o.status === 1).map((item, index) =>
                                    renderOfferItem(item, `accepted-${index}`)
                                )}
                            </View>
                        )}

                        {/* Pending Offers Section */}
                        {offers.filter(o => o.status === 0).length > 0 && (
                            <View className="mb-6">
                                <Text className="text-lg font-semibold text-gray-900 px-4 mb-3">
                                    Bekleyen Teklifler
                                </Text>
                                {offers.filter(o => o.status === 0).map((item, index) =>
                                    renderOfferItem(item, `pending-${index}`)
                                )}
                            </View>
                        )}

                        {/* Rejected Offers Section */}
                        {offers.filter(o => o.status === 2).length > 0 && (
                            <View className="mb-6">
                                <Text className="text-lg font-semibold text-gray-900 px-4 mb-3">
                                    Reddedilen Teklifler
                                </Text>
                                {offers.filter(o => o.status === 2).map((item, index) =>
                                    renderOfferItem(item, `rejected-${index}`)
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default AllOffersScreen;