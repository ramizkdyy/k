import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    StatusBar,
    Image,
    Dimensions,
    StyleSheet,
    ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { useGetTikTokFeedQuery } from "../redux/api/apiSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faChevronLeft,
    faHeart,
    faComment,
    faShare,
    faLocationDot,
    faHome
} from "@fortawesome/pro-solid-svg-icons";
import * as Location from "expo-location";
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    runOnJS,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExplorePostInfo from "../components/ExplorePostInfo";
import ExploreActionButtons from "../components/ExploreActionButtons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// StyleSheet
const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        position: 'relative',
    },
    imageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 2,
    },
    uiLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        pointerEvents: 'box-none',
    },
    dotsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 12,
    },
    headerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        zIndex: 20,
    }
});

// Tek ilan komponenti - BASIT YAKLAŞIM
const ListingCard = ({ listing, safeAreaInsets }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const getListingData = () => {
        if (listing.postType === "NormalPost" && listing.post) {
            const images = listing.post.postImages || [];
            return {
                images: images.map(img => ({ url: img.postImageUrl })),
                title: listing.post.ilanBasligi || `${listing.post.il} ${listing.post.ilce} ${listing.post.odaSayisi} Kiralık`,
                description: listing.post.postDescription || "",
                location: `${listing.post.il}, ${listing.post.ilce}`,
                price: listing.post.kiraFiyati ? `${listing.post.kiraFiyati.toLocaleString()} ₺` : "",
                rooms: listing.post.odaSayisi || "",
                area: listing.post.brutMetreKare ? `${listing.post.brutMetreKare} m²` : "",
                landlord: listing.post.user ? `${listing.post.user.name} ${listing.post.user.surname}` : "",
                postId: listing.post.postId,
                bathrooms: listing.post.banyoSayisi,
                floor: listing.post.bulunduguKat,
                buildingAge: listing.post.binaYasi,
                furnished: listing.post.esyali,
                parking: listing.post.otopark,
            };
        } else if (listing.postType === "MetaPost" && listing.metaPost) {
            let images = [];

            // Önce imagesJson'u parse et
            if (listing.metaPost.imagesJson) {
                try {
                    const parsedImages = JSON.parse(listing.metaPost.imagesJson);
                    if (Array.isArray(parsedImages)) {
                        images = parsedImages
                            .filter(img => img.url && img.url !== null) // null olan url'leri filtrele
                            .map(img => ({ url: img.url }));
                    }
                } catch (error) {
                    console.log("ImagesJson parse edilemedi:", error);
                }
            }

            // Eğer imagesJson'dan resim çıkmadıysa firstImageUrl'i kullan
            if (images.length === 0 && listing.metaPost.firstImageUrl) {
                images = [{ url: listing.metaPost.firstImageUrl }];
            }

            return {
                images,
                title: listing.metaPost.title || "",
                description: listing.metaPost.description || "",
                location: listing.metaPost.location || "",
                price: listing.metaPost.priceInfo === "Add dates for prices" ? "Fiyat için tarih seçin" : listing.metaPost.priceInfo || "",
                rooms: listing.metaPost.bedroomCount ? `${listing.metaPost.bedroomCount} oda` : "",
                area: "",
                landlord: listing.metaPost.hostName || "",
                rating: listing.metaPost.rating || null,
                postId: listing.metaPost.id,
                bathrooms: listing.metaPost.bathroomCount,
                capacity: listing.metaPost.personCapacity,
                isSuperhost: listing.metaPost.isSuperhost,
            };
        }
        return {
            images: [],
            title: "Başlık yok",
            description: "",
            location: "",
            price: "",
            rooms: "",
            area: "",
            landlord: "",
            postId: null
        };
    };

    const listingData = getListingData();

    // Scroll handler for horizontal images
    const handleImageScroll = useCallback((event) => {
        const slideSize = SCREEN_WIDTH;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentImageIndex(index);
    }, []);

    // Dot press handler
    const handleDotPress = useCallback((index) => {
        setCurrentImageIndex(index);
        // ScrollView ref ile kontrol edebiliriz
    }, []);

    return (
        <View style={styles.container}>
            {/* Background Images - BASIT SCROLLVIEW */}
            <View style={styles.imageContainer}>
                {listingData.images.length > 0 ? (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleImageScroll}
                        scrollEventThrottle={16}
                        directionalLockEnabled={true} // MAGIC: Yön kilidi
                        bounces={false} // iOS bounce kapat
                        style={{ flex: 1 }}
                    >
                        {listingData.images.map((image, index) => (
                            <View key={index} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                                <Image
                                    source={{ uri: image.url }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={{
                        flex: 1,
                        backgroundColor: '#374151',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <FontAwesomeIcon icon={faHome} size={60} color="#9CA3AF" />
                        <Text style={{ marginTop: 16, color: 'rgba(255,255,255,0.7)' }}>
                            Görsel yok
                        </Text>
                    </View>
                )}
            </View>

            {/* Overlay */}
            <View style={styles.overlay} />

            {/* UI Layer */}
            <View style={styles.uiLayer}>
                {/* Dots navigation */}
                {listingData.images.length > 1 && (
                    <View style={[styles.dotsContainer, { top: safeAreaInsets.top + 60 }]}>
                        <BlurView
                            intensity={60}
                            tint="dark"
                            style={{ borderRadius: 20, overflow: 'hidden' }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 8
                            }}>
                                {listingData.images.map((_, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => handleDotPress(idx)}
                                        style={{
                                            height: 4,
                                            marginHorizontal: 4,
                                            borderRadius: 2,
                                            backgroundColor: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                            width: idx === currentImageIndex ? 32 : 16,
                                        }}
                                    />
                                ))}
                            </View>
                        </BlurView>
                    </View>
                )}

                {/* İlan Bilgileri Component'i */}
                <ExplorePostInfo
                    listing={listing}
                    safeAreaInsets={safeAreaInsets}
                />

                {/* Action Buttons Component'i */}
                <ExploreActionButtons
                    listing={listing}
                    safeAreaInsets={safeAreaInsets}
                />
            </View>
        </View>
    );
};

const ExploreScreen = ({ navigation }) => {
    const user = useSelector(selectCurrentUser);
    const [location, setLocation] = useState(null);
    const [feedParams, setFeedParams] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const insets = useSafeAreaInsets();

    const scrollY = useSharedValue(0);
    const flatListRef = useRef(null);

    // Lokasyon setup
    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        "Konum İzni",
                        "TikTok benzeri feed için konum izni gereklidir.",
                        [
                            { text: "İptal", onPress: () => navigation.goBack() },
                            { text: "Tekrar Dene", onPress: () => { } }
                        ]
                    );
                    return;
                }

                let currentLocation = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = currentLocation.coords;

                setLocation({ latitude, longitude });
                setFeedParams({
                    userId: user?.id,
                    latitude,
                    longitude,
                    radiusKm: 50,
                    normalPostLimit: 15,
                    metaPostLimit: 15,
                    page: 1
                });
            } catch (error) {
                console.error("Konum alınamadı:", error);
                Alert.alert("Hata", "Konum bilgisi alınamadı.");
            }
        })();
    }, [user?.id, navigation]);

    // API çağrısı
    const {
        data: feedData,
        error: feedError,
        isLoading: feedLoading,
        refetch: refetchFeed
    } = useGetTikTokFeedQuery(feedParams, {
        skip: !feedParams,
    });

    useEffect(() => {
        if (feedData?.result?.posts) {
            console.log("🎯 TikTok Feed Match Scores:");
            feedData.result.posts.forEach((item, index) => {
                const postId = item.post?.postId || item.metaPost?.id;
                const title = item.post?.ilanBasligi || item.metaPost?.title;
                const matchScore = item.matchScore;

                console.log(`${index + 1}. ${title?.substring(0, 30)}... - Score: ${matchScore ? (matchScore * 100).toFixed(1) + '%' : 'null'}`);
            });

            // Normal postların match score dağılımı
            const normalPosts = feedData.result.posts.filter(p => p.postType === "NormalPost" && p.matchScore);
            const avgScore = normalPosts.reduce((sum, p) => sum + p.matchScore, 0) / normalPosts.length;
            console.log(`📊 Ortalama Match Score: ${(avgScore * 100).toFixed(1)}%`);
        }
    }, [feedData]);

    useEffect(() => {
        if (feedError) {
            console.error("TikTok Feed Hatası:", feedError);
        }
    }, [feedError]);

    useEffect(() => {
        // Tab bar'ı şeffaf yap
        navigation.getParent()?.setOptions({
            tabBarStyle: {
                display: 'flex',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
            }
        });

        return () => {
            navigation.getParent()?.setOptions({
                tabBarStyle: undefined
            });
        };
    }, [navigation]);

    // Scroll handler - Index tracking
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
            const index = Math.round(event.contentOffset.y / SCREEN_HEIGHT);
            runOnJS(setCurrentIndex)(index);
        },
    });

    if (feedLoading || !location) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={{ marginTop: 16, fontSize: 18, color: 'white' }}>
                        TikTok Feed yükleniyor...
                    </Text>
                </View>
            </View>
        );
    }

    if (!feedData?.result?.posts || feedData.result.posts.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <FontAwesomeIcon icon={faHome} size={80} color="#374151" />
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>
                        Henüz ilan bulunamadı
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                {/* Header */}
                {/* <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 40,
                            height: 40,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} size={20} color="white" />
                    </TouchableOpacity>

                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
                        Keşfet
                    </Text>

                    <TouchableOpacity
                        onPress={refetchFeed}
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 20,
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 14 }}>Yenile</Text>
                    </TouchableOpacity>
                </View> */}

                {/* Ana FlatList - SADECE DİKEY SCROLL */}
                <Animated.FlatList
                    ref={flatListRef}
                    data={feedData.result.posts}
                    renderItem={({ item }) => (
                        <ListingCard
                            listing={item}
                            safeAreaInsets={insets}
                        />
                    )}
                    keyExtractor={(item, index) =>
                        `listing-${item.postType}-${item.post?.postId || item.metaPost?.id || index}`
                    }
                    showsVerticalScrollIndicator={false}
                    pagingEnabled={true} // MAGIC 1: Sayfa bazlı geçiş
                    snapToInterval={SCREEN_HEIGHT} // MAGIC 2: Tam ekran snap
                    decelerationRate="fast" // MAGIC 3: Hızlı durma
                    scrollEventThrottle={16}
                    bounces={false} // MAGIC 4: Bounce yok
                    onScroll={scrollHandler}
                    getItemLayout={(data, index) => ({
                        length: SCREEN_HEIGHT,
                        offset: SCREEN_HEIGHT * index,
                        index,
                    })}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    initialNumToRender={1}
                    contentInsetAdjustmentBehavior="never"
                />
            </View>
        </GestureHandlerRootView>
    );
};

export default ExploreScreen;