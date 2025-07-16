import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    SafeAreaView,
    Dimensions,
    ScrollView,
    Animated,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetForYouPageQuery } from "../redux/api/apiSlice";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faGrid2,
    faRuler,
    faShower,
    faCar,
    faCalendar,
    faBuilding,
    faUsers,
    faHeart,
    faPercentage,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import {
    faChevronLeft,
    faFilter,
    faSliders,
    faChevronRight,
    faPaw,
    faMoneyBills,
    faCoins,
    faMapMarked,
    faBed,
    faGraduationCap
} from "@fortawesome/pro-regular-svg-icons";
import { useFocusEffect } from "@react-navigation/native";



const { width } = Dimensions.get("window");

const AllMatchingUsers = ({ navigation, route }) => {


    // Match Score gösterim fonksiyonu
    const getMatchScoreInfo = (score) => {
        if (score >= 80)
            return {
                level: "excellent",
                color: "#86efac",
                text: "Mükemmel",
                bgColor: "#dcfce7",
            };
        if (score >= 60)
            return {
                level: "good",
                color: "#9cf0ba",
                text: "Çok İyi",
                bgColor: "#dbeafe",
            };
        if (score >= 40)
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
    const MatchScoreBar = ({ matchScore, showBar = false, size = "sm" }) => {
        const progressAnim = useRef(new Animated.Value(0)).current;
        const timeoutRef = useRef(null);

        const scoreInfo = getMatchScoreInfo(matchScore);

        // Boyut ayarları
        const sizes = {
            xs: {
                barHeight: 2,
                iconSize: 10,
                textSize: 11,
                containerPadding: 1,
                barWidth: 180,
            },
            sm: {
                barHeight: 5,
                iconSize: 12,
                textSize: 12,
                containerPadding: 2,
                barWidth: 180,
            },
            md: {
                barHeight: 4,
                iconSize: 14,
                textSize: 14,
                containerPadding: 3,
                barWidth: 180,
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
                    toValue: matchScore,
                    duration: 800,
                    useNativeDriver: false,
                }).start();
            }, 200);

            // Cleanup function
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }, [matchScore]);

        if (showBar) {
            return (
                <View style={{ marginTop: currentSize.containerPadding * 2 }}>
                    {/* Uyum Barı */}
                    <View className="flex-row items-center">
                        <View
                            className="bg-gray-100 rounded-full overflow-hidden"
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
                            className="font-medium ml-1"
                            style={{
                                color: scoreInfo.color,
                                fontSize: currentSize.textSize,
                            }}
                        >
                            {matchScore}%
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
                    }}
                >
                    {matchScore}% {scoreInfo.text}
                </Text>
            </View>
        );
    };
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);

    // Get initial location from route params if available
    const initialLocation = route.params?.initialLocation;

    const [userLocation, setUserLocation] = useState(initialLocation || null);
    const [locationLoading, setLocationLoading] = useState(!initialLocation);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("compatibility"); // compatibility, budget, date
    const [isMapView, setIsMapView] = useState(false);

    // OPTIMIZE EDİLDİ: Native driver ile animated değerler
    const scrollY = useRef(new Animated.Value(0)).current;

    // Filter animasyonu için transform ve opacity kullanıyoruz (native driver için)
    const filterTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60], // Filter bar yukarı kayar
        extrapolate: "clamp",
    });

    const filterOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0], // Filter bar kaybolur
        extrapolate: "clamp",
    });

    const containerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [50, 0], // Container yüksekliği küçülür
        extrapolate: "clamp",
    });

    // Get user location on mount if not provided
    useEffect(() => {
        if (initialLocation) return;

        const getCurrentLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        "Konum İzni",
                        "Yakındaki kiracıları görebilmek için konum izni gerekli."
                    );
                    setUserLocation({
                        latitude: 41.0082,
                        longitude: 28.9784,
                    });
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            } catch (error) {
                console.error("Error getting location:", error);
                setUserLocation({
                    latitude: 41.0082,
                    longitude: 28.9784,
                });
            } finally {
                setLocationLoading(false);
            }
        };

        getCurrentLocation();
    }, [initialLocation]);
    // Component içinde, diğer useEffect'lerden sonra ekle:
    useFocusEffect(
        React.useCallback(() => {
            const parent = navigation.getParent();
            if (parent) {
                parent.setOptions({
                    tabBarStyle: { display: "none" },
                });
            }

            // Show tabs when leaving this screen
            return () => {
                if (parent) {
                    // Restore the appropriate tab bar style based on user role
                    if (userRole === "EVSAHIBI") {
                        // Landlord tab bar style
                        parent.setOptions({
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
                            },
                        });
                    } else if (userRole === "KIRACI") {
                        // Tenant tab bar style
                        parent.setOptions({
                            tabBarStyle: {
                                backgroundColor: "#fff",
                                borderTopColor: "#e0e0e0",
                                paddingTop: 5,
                                paddingBottom: 5,
                            },
                        });
                    }
                }
            };
        }, [navigation, userRole])
    );
    // Fetch tenant data using FYP API
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
            skip: !userLocation || !currentUser?.id,
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
        }
    );

    // Get all tenants data
    const getAllTenants = React.useMemo(() => {
        if (!nearbyData?.result) return [];

        // Get bestTenantMatch data for landlords
        const bestTenants = nearbyData.result.bestTenantMatch || [];

        // TODO: Add more tenant sources if available
        // const nearbyTenants = nearbyData.result.nearbyTenants || [];

        const combined = [...bestTenants];

        // Remove duplicates based on tenantProfileId
        const uniqueTenants = combined.reduce((acc, current) => {
            const isDuplicate = acc.find((item) => item.tenantProfileId === current.tenantProfileId);
            if (!isDuplicate) {
                acc.push(current);
            }
            return acc;
        }, []);

        return uniqueTenants;
    }, [nearbyData]);

    // Filter and sort tenants
    const getFilteredAndSortedTenants = () => {
        let filteredTenants = [...getAllTenants];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredTenants = filteredTenants.filter(
                (tenant) =>
                    (tenant.tenantName &&
                        tenant.tenantName.toLowerCase().includes(query)) ||
                    (tenant.details?.preferredLocation &&
                        tenant.details.preferredLocation.toLowerCase().includes(query)) ||
                    (tenant.details?.description &&
                        tenant.details.description.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        switch (sortBy) {
            case "compatibility":
                filteredTenants.sort((a, b) => {
                    const scoreA = a.matchScore || 0;
                    const scoreB = b.matchScore || 0;
                    return scoreB - scoreA; // Higher compatibility first
                });
                break;
            case "budget":
                filteredTenants.sort((a, b) => {
                    const budgetA = a.details?.budget || 0;
                    const budgetB = b.details?.budget || 0;
                    return budgetB - budgetA; // Higher budget first
                });
                break;
            case "date":
                filteredTenants.sort((a, b) => {
                    const dateA = new Date(a.createdDate || 0);
                    const dateB = new Date(b.createdDate || 0);
                    return dateB - dateA; // Newest first
                });
                break;
            default:
                break;
        }

        return filteredTenants;
    };

    const filteredTenants = getFilteredAndSortedTenants();

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refetch();
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // Render empty state
    const renderEmptyState = () => (
        <View className="flex-1 justify-center items-center p-8">
            <FontAwesome name="users" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
                {searchQuery.trim() ? "Arama sonucu bulunamadı" : "Henüz uygun kiracı bulunmuyor"}
            </Text>
            <Text className="text-base text-gray-500 text-center">
                {searchQuery.trim()
                    ? "Farklı anahtar kelimeler deneyin"
                    : "Profilinizi güncelleyerek daha fazla eşleşme elde edebilirsiniz"}
            </Text>
            {searchQuery.trim() && (
                <TouchableOpacity
                    className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
                    onPress={() => setSearchQuery("")}
                >
                    <Text className="text-white font-semibold">Aramayı Temizle</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Render tenant item
    const renderTenantItem = ({ item }) => (
        <View
            style={{ marginHorizontal: 16 }}
            className="mb-4 pt-4 border-gray-200"
        >
            <TouchableOpacity

                onPress={() => {
                    // Navigate to tenant profile or contact screen
                    navigation.navigate("TenantProfile", {
                        tenantId: item.tenantProfileId,
                    });
                }}
                activeOpacity={1}
            >
                {/* Tenant Profile Section */}
                <View className="bg-white border border-gray-200 p-4" style={{ boxShadow: "0px 0px 12px #00000014", borderRadius: 25 }}>
                    {/* Header with Profile Image and Basic Info */}
                    <View className="flex-row  items-center mb-4">
                        <Image
                            className="border border-gray-100"
                            style={{ width: 60, height: 60, boxShadow: "0px 0px 12px #00000020", borderRadius: 30 }}
                            source={{
                                uri: item.tenantURL || "https://via.placeholder.com/60x60",
                            }}
                            contentFit="cover"
                        />

                        <View className="flex-1 ml-4">
                            <Text
                                style={{ fontSize: 18, fontWeight: 700 }}
                                className="text-gray-800 mb-1"
                                numberOfLines={1}
                            >
                                {item.tenantName || "Kiracı"}
                            </Text>
                            <View className="flex flex-row items-center gap-1">
                                <Text className="text-gray-500" style={{ fontSize: 12 }}>
                                    Profili görüntüle
                                </Text>
                                <FontAwesomeIcon size={12} color="#dee0ea" icon={faChevronRight} />
                            </View>
                        </View>


                    </View>

                    {/* Tenant Details Grid */}
                    <View className="space-y-3 gap-1">
                        {/* Budget */}
                        {item.details?.budget && (
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faMoneyBills} color="#6B7280" size={18} />
                                    <Text className="text-gray-600 text-sm ml-2">Bütçe:</Text>
                                </View>
                                <Text className="text-gray-800 text-sm font-semibold">
                                    {item.details.budget.toLocaleString()} ₺
                                </Text>
                            </View>
                        )}

                        {/* Monthly Income */}
                        {item.details?.monthlyIncome && (
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faCoins} color="#6B7280" size={18} />
                                    <Text className="text-gray-600 text-sm ml-2">Aylık Gelir:</Text>
                                </View>
                                <Text className="text-gray-800 text-sm font-semibold">
                                    {item.details.monthlyIncome.toLocaleString()} ₺
                                </Text>
                            </View>
                        )}

                        {/* Preferred Location */}
                        {item.details?.preferredLocation && (
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faMapMarked} color="#6B7280" size={18} />
                                    <Text className="text-gray-600 text-sm ml-2">Tercih Edilen Bölge:</Text>
                                </View>
                                <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>
                                    {item.details.preferredLocation}
                                </Text>
                            </View>
                        )}

                        {/* Room Preference */}
                        {item.details?.minRooms && (
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faBed} color="#6B7280" size={18} />
                                    <Text className="text-gray-600 text-sm ml-2">Min. Oda Sayısı:</Text>
                                </View>
                                <Text className="text-gray-800 text-sm font-medium">
                                    {item.details.minRooms} oda
                                </Text>
                            </View>
                        )}

                        {/* Student Status */}
                        {item.details?.isStudent !== undefined && (
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faGraduationCap} color="#6B7280" size={18} />
                                    <Text className="text-gray-600 text-sm ml-2">Öğrenci:</Text>
                                </View>
                                <Text className="text-gray-800 text-sm font-medium">
                                    {item.details.isStudent ? "Evet" : "Hayır"}
                                </Text>
                            </View>
                        )}

                        {/* Pet Status */}
                        {item.details?.hasPets !== undefined && (
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <FontAwesomeIcon icon={faPaw} color="#6B7280" size={18} />
                                    <Text className="text-gray-600 text-sm ml-2">Evcil Hayvan:</Text>
                                </View>
                                <Text className="text-gray-800 text-sm font-medium">
                                    {item.details.hasPets ? "Var" : "Yok"}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Compatibility Level */}
                    {item.matchScore && (
                        <View className="mt-4 pt-3 border-t border-gray-100">
                            <MatchScoreBar
                                matchScore={item.matchScore}
                                showBar={true}
                                size="sm"
                            />

                            {/* Match Reasons */}
                            {item.matchReasons && item.matchReasons.length > 0 && (
                                <Text className="text-xs text-gray-500 mt-2">
                                    {item.matchReasons[0]}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    // Show loading state
    if (locationLoading || isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text className="text-gray-600 mt-4 text-center">
                        {locationLoading
                            ? "Konum alınıyor..."
                            : "Uygun kiracılar yükleniyor..."}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center p-8">
                    <MaterialIcons name="error" size={64} color="#EF4444" />
                    <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
                        Bir hata oluştu
                    </Text>
                    <Text className="text-base text-gray-500 text-center mb-6">
                        Uygun kiracılar yüklenirken bir sorun oluştu.
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
        <SafeAreaView className="flex-1 bg-white"
            contentContainerStyle={{ paddingVertical: 20 }}
        >
            {/* Fixed search bar */}
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
                                placeholder="Size uygun kiracılar"
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
                        height: containerHeight, // Container yüksekliği de küçülür
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        className="flex justify-center items-center"
                        style={{
                            paddingHorizontal: 18,
                            paddingBottom: 8,
                            height: 50,
                            opacity: filterOpacity,
                            transform: [{ translateY: filterTranslateY }],
                        }}
                    >
                        <View className="flex-row">
                            {[
                                { key: "compatibility", label: "Uyumluluk" },
                                { key: "budget", label: "Bütçe" },
                                { key: "date", label: "Tarih" },
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
                data={filteredTenants}
                renderItem={renderTenantItem}
                keyExtractor={(item, index) => `tenant_${item.tenantProfileId}_${index}`}
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

export default AllMatchingUsers;