import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
    View,
    Text,
    Dimensions,
    StatusBar,
    Platform,
    Image,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHome } from "@fortawesome/pro-solid-svg-icons";
import { useGetTikTokFeedQuery } from "../redux/api/apiSlice";

// Gesture ve Animation imports - Rehberdeki paketler
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    useAnimatedScrollHandler,
    useSharedValue,
    runOnJS,
} from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";

// Components
import ExplorePostInfo from "../components/ExplorePostInfo";
import ExploreActionButtons from "../components/ExploreActionButtons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Optimize edilmiş ListingCard component
const ListingCard = memo(({ listing, safeAreaInsets, isActive }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHorizontalScrollActive, setIsHorizontalScrollActive] = useState(false);

    const getListingData = () => {
        if (listing.postType === "NormalPost" && listing.post) {
            const post = listing.post;
            return {
                images: post.postImages?.map(img => ({ url: img.postImageUrl })) || [],
                title: post.ilanBasligi || `${post.il} ${post.ilce}`,
                location: `${post.il}, ${post.ilce}`,
                price: post.kiraFiyati ? `${post.kiraFiyati.toLocaleString()} ₺` : "",
                postId: post.postId,
                type: "normal"
            };
        }
        else if (listing.postType === "MetaPost" && listing.metaPost) {
            const meta = listing.metaPost;

            // 🔍 DEBUG: MetaPost resim bilgilerini logla
            console.log("=== MetaPost Debug ===");
            console.log("PostId:", meta.id);
            console.log("Title:", meta.title?.substring(0, 50));
            console.log("ImagesJson exists:", !!meta.imagesJson);
            console.log("FirstImageUrl:", meta.firstImageUrl?.substring(0, 80));

            let images = [];

            // Önce imagesJson'u parse et
            if (meta.imagesJson) {
                try {
                    console.log("🔄 ImagesJson parse ediliyor...");
                    const parsedImages = JSON.parse(meta.imagesJson);
                    console.log("✅ Parse başarılı, array uzunluğu:", parsedImages?.length);

                    if (Array.isArray(parsedImages)) {
                        // Null olmayan URL'leri filtrele
                        const validImages = parsedImages.filter(img => img && img.url && img.url !== null);
                        console.log("📷 Valid resim sayısı:", validImages.length);

                        if (validImages.length > 0) {
                            console.log("🖼️ İlk valid resim URL:", validImages[0].url?.substring(0, 80));
                        }

                        images = validImages.map(img => ({ url: img.url }));
                    }
                } catch (error) {
                    console.error("❌ ImagesJson parse hatası:", error.message);
                    console.log("📝 Raw imagesJson ilk 200 karakter:", meta.imagesJson?.substring(0, 200));
                }
            }

            // Eğer imagesJson'dan resim çıkmadıysa firstImageUrl'i kullan
            if (images.length === 0 && meta.firstImageUrl) {
                console.log("🔄 FirstImageUrl fallback kullanılıyor");
                images = [{ url: meta.firstImageUrl }];
            }

            console.log("🎯 Final images array length:", images.length);
            if (images.length > 0) {
                console.log("🎯 İlk resim URL:", images[0].url?.substring(0, 80));
            }
            console.log("=====================");

            return {
                images,
                title: meta.title || "",
                location: meta.location || "",
                price: meta.priceInfo === "Add dates for prices"
                    ? "Fiyat için tarih seçin"
                    : meta.priceInfo || "",
                postId: meta.id,
                type: "meta"
            };
        }

        // Fallback
        return {
            images: [],
            title: "Başlık yok",
            location: "",
            price: "",
            postId: null,
            type: "unknown"
        };
    };
    const listingData = getListingData();

    // Yatay scroll handler (mevcut yapı korundu, optimize edildi)
    const handleImageScroll = useCallback((event) => {
        const slideSize = SCREEN_WIDTH;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentImageIndex(index);
    }, []);

    // Yatay scroll başlangıç/bitiş kontrolü - YENİ EKLENEN
    const handleScrollBeginDrag = useCallback(() => {
        setIsHorizontalScrollActive(true);
    }, []);

    const handleScrollEndDrag = useCallback(() => {
        // Biraz gecikme ile false yapıyoruz
        setTimeout(() => {
            setIsHorizontalScrollActive(false);
        }, 100);
    }, []);

    // Dot press handler (mevcut yapı korundu)
    const handleDotPress = useCallback((index) => {
        setCurrentImageIndex(index);
        // ScrollView ref ile kontrol edebiliriz
    }, []);

    return (
        <View style={{
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            position: 'relative'
        }}>
            {/* Background Images Container */}
            <View style={{
                flex: 1,
                backgroundColor: '#374151'
            }}>
                {listingData.images.length > 0 ? (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleImageScroll}
                        onScrollBeginDrag={handleScrollBeginDrag} // YENİ EKLENEN
                        onScrollEndDrag={handleScrollEndDrag} // YENİ EKLENEN
                        scrollEventThrottle={16}
                        directionalLockEnabled={true} // MAGIC: Yön kilidi
                        bounces={false} // iOS bounce kapat
                        decelerationRate="fast" // Hızlı durma
                        style={{ flex: 1 }}
                        contentContainerStyle={{ alignItems: 'center' }}
                    >
                        {listingData.images.map((image, index) => (
                            <View key={`image-${index}`} style={{
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT
                            }}>
                                <Image
                                    source={{ uri: image.postImageUrl || image.url }}
                                    style={{
                                        width: '100%',
                                        height: '100%'
                                    }}
                                    resizeMode="cover"
                                    fadeDuration={200}
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
                        <Text style={{
                            marginTop: 16,
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 16
                        }}>
                            Görsel yok
                        </Text>
                    </View>
                )}
            </View>

            {/* Sayfa Numarası - Sadece birden fazla resim varsa */}
            {listingData.images.length > 1 && (
                <View style={{
                    position: 'absolute',
                    top: safeAreaInsets.top,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <View style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 6
                    }}>
                        <Text style={{
                            color: 'white',
                            fontSize: 14,
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {currentImageIndex + 1}/{listingData.images.length}
                        </Text>
                    </View>
                </View>
            )}

            {/* Post Info Component */}
            <ExplorePostInfo
                listing={listing}
                safeAreaInsets={safeAreaInsets}
            />

            {/* Action Buttons Component - YENİ PROP EKLENDİ */}
            <ExploreActionButtons
                listing={listing}
                safeAreaInsets={safeAreaInsets}
                isHorizontalScrollActive={isHorizontalScrollActive}
            />
        </View>
    );
});

// Ana ExploreScreen Component
const ExploreScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);

    const [currentListingIndex, setCurrentListingIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollY = useSharedValue(0);

    // TikTok Feed API çağrısı (mevcut yapı korundu)
    const feedParams = {
        userId: currentUser?.id,
        latitude: 41.0082, // Istanbul koordinatları (örnek)
        longitude: 28.9784,
        radius: 50000, // 50km
    };

    const {
        data: feedData,
        error: feedError,
        isLoading: feedLoading,
        refetch: refetchFeed
    } = useGetTikTokFeedQuery(feedParams, {
        skip: !feedParams.userId,
    });



    // Status bar ayarları (mevcut yapı korundu)
    useEffect(() => {
        StatusBar.setBarStyle('light-content', true);
        if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor('transparent', true);
            StatusBar.setTranslucent(true);
        }
    }, []);




    // Ana dikey scroll handler - YENİ EKLENEN
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
            const index = Math.round(event.contentOffset.y / SCREEN_HEIGHT);
            runOnJS(setCurrentListingIndex)(index);
        },
    });

    const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const visibleIndex = viewableItems[0].index;
            setCurrentListingIndex(visibleIndex || 0);
        }
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 51,
        minimumViewTime: 100,
    };

    // Loading state (mevcut yapı korundu)
    if (feedLoading || !currentUser?.id) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ marginTop: 16, fontSize: 18, color: 'white' }}>
                        TikTok Feed yükleniyor...
                    </Text>
                </View>
            </View>
        );
    }

    // Empty state (mevcut yapı korundu)
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

                {/* Ana Dikey FlatList - OPTİMİZE EDİLDİ */}
                <Animated.FlatList
                    ref={flatListRef}
                    data={feedData.result.posts}
                    renderItem={({ item, index }) => (
                        <ListingCard
                            listing={item}
                            safeAreaInsets={insets}
                            isActive={index === currentListingIndex}
                        />
                    )}
                    keyExtractor={(item, index) =>
                        `listing-${item.postType}-${item.post?.postId || item.metaPost?.id || index}`
                    }

                    // Dikey Scroll Optimizasyonları (MAGIC NUMBERS)
                    pagingEnabled={true} // MAGIC 1: Sayfa bazlı geçiş
                    snapToInterval={SCREEN_HEIGHT} // MAGIC 2: Tam ekran snap
                    snapToAlignment="start"
                    decelerationRate="fast" // MAGIC 3: Hızlı durma
                    showsVerticalScrollIndicator={false}
                    bounces={false} // MAGIC 4: Bounce yok

                    // Scroll Handler - YENİ EKLENEN
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}

                    // Viewability Ayarları - YENİ EKLENEN
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}

                    // Performance Optimizasyonları (REHBERDEKİ ÖNERİLER)
                    getItemLayout={(data, index) => ({
                        length: SCREEN_HEIGHT,
                        offset: SCREEN_HEIGHT * index,
                        index,
                    })}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    initialNumToRender={1}
                    updateCellsBatchingPeriod={50}

                    // Content Ayarları
                    contentInsetAdjustmentBehavior="never"
                    automaticallyAdjustContentInsets={false}

                    // Android için ek optimizasyonlar
                    {...(Platform.OS === 'android' && {
                        persistentScrollbar: false,
                        fadingEdgeLength: 0,
                    })}
                />
            </View>
        </GestureHandlerRootView>
    );
};

export default ExploreScreen;