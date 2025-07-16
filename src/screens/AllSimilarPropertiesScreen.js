import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Dimensions,
    ScrollView,
    Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetForYouPageQuery } from "../redux/api/apiSlice";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faBed,
    faMoneyBills,
    faRuler,
    faShower,
    faCalendar,
    faBuilding,
    faCoins,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import {
    faChevronLeft,
    faSliders,
} from "@fortawesome/pro-regular-svg-icons";

const { width } = Dimensions.get("window");

const AllSimilarPropertiesScreen = ({ navigation, route }) => {
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);

    // Route params - NearbyProperties'den gelen parametreler
    const {
        userLocation,
        similarPosts = [] // Eğer similarPosts doğrudan gönderilirse
    } = route.params || {};

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState("date"); // date, price, title



    const scrollY = useRef(new Animated.Value(0)).current;

    // Filter animasyonu için transform ve opacity kullanıyoruz (native driver için)
    const filterTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60], // Filtreyi yukarı kaydır
        extrapolate: "clamp",
    });

    const filterOpacity = scrollY.interpolate({
        inputRange: [0, 50, 100],
        outputRange: [1, 0.5, 0],
        extrapolate: "clamp",
    });

    // Container height animasyonu (JS thread'de çalışır ama gerekli)
    const containerHeight = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [45, 0], // Container yüksekliğini 60px'den 0'a küçült
        extrapolate: "clamp",
    });
    // Handle tab bar visibility
    useFocusEffect(
        React.useCallback(() => {
            // Hide tab bar when screen is focused
            navigation.getParent()?.setOptions({
                tabBarStyle: { display: 'none' }
            });

            return () => {
                // Show tab bar when screen is unfocused
                navigation.getParent()?.setOptions({
                    tabBarStyle: {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderTopColor: "rgba(224, 224, 224, 0.2)",
                        paddingTop: 5,
                        paddingBottom: 5,
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        elevation: 8,
                    }
                });
            };
        }, [navigation])
    );
    // API Query - eğer similarPosts gönderilmemişse API'den çek
    const {
        data: nearbyData,
        isLoading,
        error,
        refetch,
    } = useGetForYouPageQuery(
        {
            userId: currentUser?.id,
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude,
        },
        {
            enabled: !!userLocation && similarPosts.length === 0,
            skip: !userLocation || !currentUser?.id || similarPosts.length > 0,
        }
    );

    // Get similar properties
    const allSimilarProperties = React.useMemo(() => {
        // Eğer route params'tan similarPosts geliyorsa onu kullan
        if (similarPosts && similarPosts.length > 0) {
            return similarPosts;
        }

        // Değilse API'den gelen veriyi kullan
        return nearbyData?.result?.similarPost || [];
    }, [nearbyData, similarPosts]);

    // Filter and sort properties
    const getFilteredAndSortedProperties = () => {
        let filteredProperties = [...allSimilarProperties];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredProperties = filteredProperties.filter(
                (property) =>
                    (property.ilanBasligi &&
                        property.ilanBasligi.toLowerCase().includes(query)) ||
                    (property.il && property.il.toLowerCase().includes(query)) ||
                    (property.ilce && property.ilce.toLowerCase().includes(query)) ||
                    (property.postDescription &&
                        property.postDescription.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        switch (sortBy) {
            case "price":
                filteredProperties.sort((a, b) => {
                    const priceA = a.kiraFiyati || 0;
                    const priceB = b.kiraFiyati || 0;
                    return priceA - priceB;
                });
                break;
            case "title":
                filteredProperties.sort((a, b) => {
                    const titleA = (a.ilanBasligi || "").toLowerCase();
                    const titleB = (b.ilanBasligi || "").toLowerCase();
                    return titleA.localeCompare(titleB);
                });
                break;
            case "date":
            default:
                filteredProperties.sort((a, b) => {
                    const dateA = new Date(a.createdDate || 0);
                    const dateB = new Date(b.createdDate || 0);
                    return dateB - dateA; // Newest first
                });
                break;
        }

        return filteredProperties;
    };

    const filteredProperties = getFilteredAndSortedProperties();

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            if (refetch) {
                await refetch();
            }
        } catch (error) {
            console.log("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // Relative time function
    const getRelativeTime = (postTime) => {
        if (!postTime) return "Tarih belirtilmemiş";

        const now = new Date();
        const postDate = new Date(postTime);

        // Invalid date check
        if (isNaN(postDate.getTime())) return "Geçersiz tarih";

        // Milisaniye cinsinden fark
        const diffMs = now.getTime() - postDate.getTime();

        // Saniye cinsinden fark
        const diffSeconds = Math.floor(diffMs / 1000);

        // Dakika cinsinden fark
        const diffMinutes = Math.floor(diffSeconds / 60);

        // Saat cinsinden fark
        const diffHours = Math.floor(diffMinutes / 60);

        // Gün cinsinden fark
        const diffDays = Math.floor(diffHours / 24);

        // Hafta cinsinden fark
        const diffWeeks = Math.floor(diffDays / 7);

        // Ay cinsinden fark
        const diffMonths = Math.floor(diffDays / 30);

        // Yıl cinsinden fark
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) {
            return `${diffYears} yıl önce`;
        } else if (diffMonths > 0) {
            return `${diffMonths} ay önce`;
        } else if (diffWeeks > 0) {
            return `${diffWeeks} hafta önce`;
        } else if (diffDays > 0) {
            return `${diffDays} gün önce`;
        } else if (diffHours > 0) {
            return `${diffHours} saat önce`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} dakika önce`;
        } else {
            return "Az önce";
        }
    };

    // YENİ: Property Details Free Drag Slider Component
    const PropertyDetailsSlider = ({ item }) => {
        // Property özelliklerini array olarak hazırlıyoruz
        const propertyDetails = [
            {
                id: "rooms",
                icon: faBed,
                value: item.odaSayisi || "N/A",
                label: "Oda",
            },
            {
                id: "bathrooms",
                icon: faShower,
                value: item.banyoSayisi || "N/A",
                label: "Banyo",
            },
            {
                id: "area",
                icon: faRuler,
                value: item.brutMetreKare ? `${item.brutMetreKare} m²` : "N/A",
                label: "Alan",
            },
            {
                id: "floor",
                icon: faBuilding,
                value: item.bulunduguKat || "N/A",
                label: "Kat",
            },
            {
                id: "age",
                icon: faCalendar,
                value: item.binaYasi ? `${item.binaYasi}` : "N/A",
                label: "Bina yaşı",
            },
            {
                id: "dues",
                icon: faMoneyBills,
                value: item.aidat ? `${item.aidat}₺` : "Yok",
                label: "Aidat",
            },
            {
                id: "deposit",
                icon: faCoins,
                value: item.depozito ? `${item.depozito}₺` : "Yok",
                label: "Depozito",
            },
        ];

        return (
            <View className="mt-3">
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    decelerationRate="normal"
                    bounces={true}
                    contentContainerStyle={{}}
                >
                    {propertyDetails.map((detail, index) => (
                        <View
                            key={`${detail.id}-${index}`}
                            className="items-center justify-center rounded-2xl"
                            style={{
                                width: "fit-content",
                                marginRight: 46,
                                marginLeft: 3,
                                height: 85,
                            }}
                        >
                            <FontAwesomeIcon size={30} icon={detail.icon} color="#000" />
                            <Text
                                style={{ fontSize: 16, fontWeight: 600 }}
                                className="text-gray-800 mt-2 text-center"
                                numberOfLines={1}
                            >
                                {detail.value}
                            </Text>
                            <Text
                                style={{ fontSize: 11 }}
                                className="text-gray-500 text-center"
                                numberOfLines={1}
                            >
                                {detail.label}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Simple and reliable image slider component
    const PropertyImageSlider = ({ images, status, postId }) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const scrollViewRef = useRef(null);

        const handleScroll = (event) => {
            const slideSize = width - 32;
            const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
            setCurrentIndex(index);
        };

        const handleDotPress = (index) => {
            setCurrentIndex(index);
            const slideSize = width - 32;
            scrollViewRef.current?.scrollTo({
                x: slideSize * index,
                animated: true,
            });
        };

        if (!images || images.length === 0) {
            return (
                <View className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 justify-center items-center rounded-3xl">
                    <MaterialIcons name="home" size={32} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2 font-medium">Resim yok</Text>
                </View>
            );
        }

        return (
            <View
                className="relative bg-gray-100"
                style={{ borderRadius: 25, overflow: "hidden" }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    horizontal={true}
                    pagingEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    bounces={true}
                    style={{ width: width - 32 }}
                >
                    {images.map((item, index) => (
                        <TouchableOpacity
                            key={`image-${postId}-${index}`}
                            style={{ width: width - 32 }}
                            activeOpacity={1}
                            onPress={() =>
                                navigation.navigate("PostDetail", { postId: postId })
                            }
                        >
                            <Image
                                source={{ uri: item.postImageUrl }}
                                style={{ width: width - 32, height: 350 }}
                                contentFit="cover"
                                transition={150}
                                placeholder={{
                                    uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
                                }}
                                cachePolicy="memory-disk"
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Status badge */}
                <View className="absolute top-3 right-3">
                    <BlurView
                        intensity={90}
                        style={{ overflow: "hidden", borderRadius: 100 }}
                        className="px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-white text-xs font-semibold">
                            {status === 0 ? "Aktif" : status === 1 ? "Kiralandı" : "Kapalı"}
                        </Text>
                    </BlurView>
                </View>

                {/* Pagination dots - DÜZELTME: Güvenli conditional rendering */}
                {!!(images && images.length > 1) && (
                    <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
                        <View
                            style={{
                                borderRadius: 20,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                            }}
                        >
                            <View className="flex-row justify-center">
                                {images.map((_, index) => (
                                    <TouchableOpacity
                                        key={`dot-${index}`}
                                        onPress={() => handleDotPress(index)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            marginHorizontal: 4,
                                            backgroundColor:
                                                index === currentIndex
                                                    ? "#FFFFFF"
                                                    : "rgba(255, 255, 255, 0.5)",
                                        }}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // Render property item - AllNearbyPropertiesScreen'deki gibi tam aynı tasarım
    const renderPropertyItem = ({ item }) => (
        <View
            style={{ marginHorizontal: 16 }}
            className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
        >
            {/* Image slider - OnPress sadece burada */}
            <TouchableOpacity
                onPress={() =>
                    navigation.navigate("PostDetail", { postId: item.postId })
                }
                activeOpacity={1}
            >
                <PropertyImageSlider
                    images={item.postImages}
                    status={item.status}
                    postId={item.postId}
                />
            </TouchableOpacity>

            <View className="mt-4 px-1">
                {/* Title and Price */}
                <View className="items-start mb-1">
                    <Text
                        style={{ fontSize: 18, fontWeight: 700 }}
                        className="text-gray-800 mb-"
                        numberOfLines={2}
                    >
                        {item.ilanBasligi || "İlan başlığı yok"}
                    </Text>
                </View>
                <View className="flex-row items-center mb-2">
                    <Text style={{ fontSize: 12 }} className=" text-gray-500">
                        {item.ilce && item.il
                            ? `${item.ilce}, ${item.il}`
                            : item.il || "Konum belirtilmemiş"}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <Text
                        style={{ fontSize: 18, fontWeight: 500 }}
                        className="text-gray-900 underline"
                    >
                        {item.kiraFiyati || item.rent
                            ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${item.paraBirimi || item.currency || "₺"
                            }`
                            : "Fiyat belirtilmemiş"}
                    </Text>
                    <Text className="text-sm text-gray-400 ml-1">/ay</Text>
                </View>

                {/* Property details slider */}
                <PropertyDetailsSlider item={item} />
            </View>
            <View className="flex flex-col">
                <View className="mb-5 pl-1 mt-3">
                    <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() =>
                            navigation.navigate("LandlordProfile", {
                                userId: item.landlordId,
                            })
                        }
                    >
                        <View className="flex-1 flex-row justify-between items-center w-full">
                            <TouchableOpacity
                                className="flex-row items-center"
                                onPress={() =>
                                    navigation.navigate("LandlordProfile", {
                                        userId: item.landlordId,
                                    })
                                }
                            >
                                <View className="w-12 h-12 rounded-full justify-center items-center mr-3 border-gray-900 border">
                                    {!!item.user?.profileImageUrl ? (
                                        <Image
                                            source={{ uri: item.user.profileImageUrl }}
                                            className="w-full h-full rounded-full"
                                        />
                                    ) : (
                                        <View>
                                            <Text className="text-xl font-bold text-gray-900">
                                                {item.user?.name?.charAt(0) || "E"}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View className="flex-col gap-1">
                                    <Text
                                        style={{ fontSize: 14 }}
                                        className="font-semibold text-gray-800"
                                    >
                                        {item.user?.name} {item.user?.surname}
                                    </Text>
                                    <View className="flex flex-row items-center gap-1">
                                        <Text style={{ fontSize: 12 }} className="text-gray-500">
                                            Rating
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <Text
                                className="mb-2 pl-1 text-gray-500"
                                style={{ fontSize: 12, fontWeight: 500 }}
                            >
                                {getRelativeTime(item.postTime)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // Render empty state
    const renderEmptyState = () => (
        <View className="flex-1 justify-center items-center p-8">
            <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
                {searchQuery.trim() ? "Arama sonucu bulunamadı" : "Benzer ilan bulunamadı"}
            </Text>
            <Text className="text-base text-gray-500 text-center">
                {searchQuery.trim()
                    ? "Farklı anahtar kelimeler deneyebilirsiniz"
                    : "Henüz benzer ilan bulunmuyor"}
            </Text>
            {searchQuery.trim() && (
                <TouchableOpacity
                    className="bg-green-500 px-6 py-3 rounded-lg mt-4"
                    onPress={() => setSearchQuery("")}
                >
                    <Text className="text-white font-semibold">Aramayı Temizle</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Show loading state
    if (isLoading && allSimilarProperties.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text className="text-gray-600 mt-4">Benzer ilanlar yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error && allSimilarProperties.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center p-8">
                    <MaterialIcons name="error" size={64} color="#EF4444" />
                    <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
                        Bir hata oluştu
                    </Text>
                    <Text className="text-base text-gray-500 text-center mb-6">
                        Benzer ilanlar yüklenirken bir sorun oluştu.
                    </Text>
                    <TouchableOpacity
                        className="bg-green-500 px-6 py-3 rounded-lg"
                        onPress={onRefresh}
                    >
                        <Text className="text-white font-semibold">Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Fixed search bar - AllNearbyPropertiesScreen'deki gibi aynı tasarım */}
            <View className="bg-white border-b border-gray-200 z-10">
                <View className="flex flex-row items-center px-5">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ width: "8%" }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} color="black" size={25} />
                    </TouchableOpacity>

                    <View className="px-4 py-4" style={{ width: "84%" }}>
                        <View
                            style={{ boxShadow: "0px 0px 12px #00000014" }}
                            className="bg-white rounded-3xl gap-2 px-4 flex-row items-center"
                        >
                            <TextInput
                                className="w-full px-2 placeholder:text-gray-400 placeholder:text-[14px] py-4 text-normal"
                                placeholder="Benzer ilanlar"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery ? (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <MaterialIcons name="close" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                    <View style={{ width: "8%" }}>
                        <FontAwesomeIcon icon={faSliders} color="black" size={20} />
                    </View>
                </View>

                {/* OPTIMIZE EDİLDİ: Container height da animate ediliyor */}
                <Animated.View
                    style={{
                        height: containerHeight,
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        className="flex justify-center items-center"
                        style={{
                            paddingHorizontal: 16,
                            paddingBottom: 8,
                            height: 50,
                            opacity: filterOpacity,
                            transform: [{ translateY: filterTranslateY }],
                        }}
                    >
                        <View className="flex-row">
                            {[
                                { key: "date", label: "Tarih" },
                                { key: "price", label: "Fiyat" },
                                { key: "title", label: "Başlık" },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    className={`mr-3 px-4 py-2 rounded-full border ${sortBy === option.key
                                        ? "bg-gray-900"
                                        : "bg-white border-white"
                                        }`}
                                    onPress={() => setSortBy(option.key)}
                                >
                                    <Text
                                        className={`text-sm font-medium ${sortBy === option.key ? "text-white" : "text-gray-700"
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>

            {/* OPTIMIZE EDİLDİ: Native driver ile scroll tracking */}
            <Animated.FlatList
                data={filteredProperties}
                renderItem={renderPropertyItem}
                keyExtractor={(item, index) => `similar_${item.postId}_${index}`}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false, // Height animasyonu için false gerekli
                    }
                )}
                scrollEventThrottle={1} // Daha smooth animasyon için düşük değer
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4A90E2"]}
                        tintColor="#4A90E2"
                    />
                }
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 16,
                }}
                // Performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={100}
                initialNumToRender={8}
                windowSize={10}
            />
        </SafeAreaView>
    );
};

export default AllSimilarPropertiesScreen;