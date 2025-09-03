import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHome } from "@fortawesome/pro-regular-svg-icons";
import { useGetTikTokFeedQuery } from "../redux/api/apiSlice";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useIsFocused } from "@react-navigation/native";
import PagerView from "react-native-pager-view";

// Components
import ExplorePostInfo from "../components/ExplorePostInfo";
import ExploreActionButtons from "../components/ExploreActionButtons";
import LinearGradient from "react-native-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = SCREEN_HEIGHT;

// Optimized Fast Image Component
const FastImage = memo(({ uri, style, resizeMode = "cover", blurRadius }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const isValidUrl = uri && typeof uri === "string" && uri.startsWith("http");

  if (!isValidUrl) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: "#374151",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <FontAwesomeIcon icon={faHome} size={40} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={[style, { opacity: loaded && !error ? 1 : 0.5 }]}
        contentFit={resizeMode}
        blurRadius={blurRadius}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey={uri}
      />

      {(!loaded || error) && (
        <View
          style={[
            style,
            {
              position: "absolute",
              backgroundColor: "#374151",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <FontAwesomeIcon icon={faHome} size={40} color="#9CA3AF" />
        </View>
      )}
    </View>
  );
});

// Optimized ListingCard with memo for PagerView
const ListingCard = memo(
  ({ listing, safeAreaInsets, isActive, onHorizontalScrollChange, index }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const getListingData = useCallback(() => {
      if (listing.postType === "NormalPost" && listing.post) {
        const post = listing.post;
        return {
          images:
            post.postImages?.map((img) => ({ url: img.postImageUrl })) || [],
          title: post.ilanBasligi || `${post.il} ${post.ilce}`,
          location: `${post.il}, ${post.ilce}`,
          price: post.kiraFiyati ? `${post.kiraFiyati.toLocaleString()} ₺` : "",
          postId: post.postId,
        };
      } else if (listing.postType === "MetaPost" && listing.metaPost) {
        const meta = listing.metaPost;
        let images = [];

        if (meta.imagesJson) {
          try {
            const parsedImages = JSON.parse(meta.imagesJson);
            if (Array.isArray(parsedImages)) {
              images = parsedImages
                .filter((img) => img && img.url)
                .map((img) => ({ url: img.url }));
            }
          } catch (error) {
            console.warn("Image parse error:", error);
          }
        }

        if (images.length === 0 && meta.firstImageUrl) {
          images = [{ url: meta.firstImageUrl }];
        }

        return {
          images,
          title: meta.title || "",
          location: meta.location || "",
          price:
            meta.priceInfo === "Add dates for prices"
              ? "Fiyat için tarih seçin"
              : meta.priceInfo || "",
          postId: meta.id,
        };
      }

      return {
        images: [],
        title: "Başlık yok",
        location: "",
        price: "",
        postId: null,
      };
    }, [listing]);

    const listingData = getListingData();

    // Handle horizontal scroll for images
    const handleImageScroll = useCallback((event) => {
      const slideSize = SCREEN_WIDTH;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentImageIndex(index);
    }, []);

    // Handle horizontal scroll start/end
    const handleScrollBeginDrag = useCallback(() => {
      onHorizontalScrollChange?.(true);
    }, [onHorizontalScrollChange]);

    const handleScrollEndDrag = useCallback(() => {
      setTimeout(() => {
        onHorizontalScrollChange?.(false);
      }, 100);
    }, [onHorizontalScrollChange]);

    return (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: ITEM_HEIGHT,
          position: "relative",
          backgroundColor: "#000",
        }}
        key={`listing-${listing.postId || listing.id}-${index}`}
      >
        {/* Main Image Display */}
        {listingData.images.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            bounces={false}
            directionalLockEnabled={true}
            decelerationRate="fast"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: ITEM_HEIGHT,
            }}
          >
            {listingData.images.map((image, imageIndex) => (
              <View
                key={`${listing.postId || listing.id}-image-${imageIndex}`}
                style={{
                  width: SCREEN_WIDTH,
                  height: ITEM_HEIGHT,
                  position: "relative",
                }}
              >
                {/* Blurred Background */}
                <FastImage
                  uri={image.url}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                  blurRadius={20}
                />

                {/* Dark overlay */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0.4)",
                  }}
                />

                {/* Main Image */}
                <View
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0, // ✅ left: "50%" yerine 0 kullan
                    right: 0, // ✅ Sağ tarafı da sıfırla
                    height: (SCREEN_WIDTH * 0.9) / (9 / 16),
                    transform: [
                      { translateY: -((SCREEN_WIDTH * 0.9) / (9 / 16)) / 2 },
                    ], // ✅ translateX'i kaldır
                    overflow: "hidden",
                    // paddingHorizontal: 16, // ✅ Yan boşluklar için padding ekle
                    paddingBottom: 32,
                  }}
                >
                  <FastImage
                    uri={image.url}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: "#374151",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FontAwesomeIcon icon={faHome} size={60} color="#9CA3AF" />
            <Text
              style={{
                marginTop: 16,
                color: "rgba(255,255,255,0.7)",
                fontSize: 16,
              }}
            >
              Görsel yok
            </Text>
          </View>
        )}

        {/* Bottom Gradient */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 200,
          }}
        />

        {/* Components */}
        <ExplorePostInfo listing={listing} safeAreaInsets={safeAreaInsets} />
        <ExploreActionButtons
          listing={listing}
          safeAreaInsets={safeAreaInsets}
          currentImageIndex={currentImageIndex}
          totalImages={listingData.images.length}
          onImageChange={setCurrentImageIndex}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.listing.postId === nextProps.listing.postId &&
      prevProps.listing.id === nextProps.listing.id &&
      prevProps.index === nextProps.index
    );
  }
);

// 🚀 SORUN ÇÖZÜMÜ: RefreshablePagerView - Action buttons ile çakışmayı önler
const RefreshablePagerView = memo(({ children, onRefresh, refreshing }) => {
  const [pullRefreshEnabled, setPullRefreshEnabled] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      {refreshing && (
        <View
          style={{
            position: "absolute",
            top: 100,
            left: 0,
            right: 0,
            zIndex: 1000,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              padding: 12,
              borderRadius: 25,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ActivityIndicator color="#4A90E2" size="small" />
            <Text style={{ color: "white", marginLeft: 8, fontSize: 14 }}>
              Yenileniyor...
            </Text>
          </View>
        </View>
      )}

      {/* 🚀 PULL TO REFRESH - SAĞ ALAN HARİÇ */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 100, // 🚀 Sağdan 100px alan hariç - action buttons için
          height: 60,  // 🚀 Sadece çok üst kısım
          zIndex: 500, // 🚀 Action buttons'tan daha düşük z-index
        }}
        onTouchStart={(e) => {
          const startY = e.nativeEvent.pageY;
          setPullStartY(startY);

          // Sadece çok üst alanda başlayan touch'lar
          if (startY < 60) {
            setPullRefreshEnabled(true);
          }
        }}
        onTouchMove={(e) => {
          if (pullRefreshEnabled) {
            const currentY = e.nativeEvent.pageY;
            const pullDistance = currentY - pullStartY;

            // Yetersiz pull distance ise iptal et
            if (pullDistance < 50) {
              setPullRefreshEnabled(false);
            }
          }
        }}
        onTouchEnd={(e) => {
          const endY = e.nativeEvent.pageY;
          const pullDistance = endY - pullStartY;

          // Yeterli mesafe çekilmiş ve pull aktif ise refresh
          if (pullRefreshEnabled && pullDistance > 50) {
            onRefresh();
          }

          setPullRefreshEnabled(false);
          setPullStartY(0);
        }}
      />

      {children}
    </View>
  );
});

// Main ExploreScreen Component with PagerView
const ExploreScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectCurrentUser);
  const isFocused = useIsFocused();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] = useState(false);
  const pagerViewRef = useRef(null);

  // API call
  const feedParams = {
    userId: currentUser?.id,
    latitude: 41.0082,
    longitude: 28.9784,
    radius: 50000,
  };

  const {
    data: feedData,
    error: feedError,
    isLoading: feedLoading,
    refetch: refetchFeed,
  } = useGetTikTokFeedQuery(feedParams, {
    skip: !feedParams.userId,
  });

  // Status bar setup
  useEffect(() => {
    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent", true);
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Tab refresh handler
  useEffect(() => {
    const unsubscribe = navigation?.addListener("tabPress", (e) => {
      if (isFocused) {
        handleRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, isFocused]);

  const handleRefresh = useCallback(() => {
    if (feedParams.userId) {
      refetchFeed();
      setCurrentIndex(0);
      setTimeout(() => {
        pagerViewRef.current?.setPage(0);
      }, 100);
    }
  }, [feedParams.userId, refetchFeed]);

  // Handle page selection change
  const handlePageSelected = useCallback((event) => {
    const selectedPageIndex = event.nativeEvent.position;
    setCurrentIndex(selectedPageIndex);
  }, []);

  // Handle page scroll state change
  const handlePageScrollStateChanged = useCallback((state) => {
    // State optimization can be added here if needed
  }, []);

  // Loading state
  if (feedLoading || !currentUser?.id) {
    return (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ marginTop: 16, fontSize: 18, color: "white" }}>
            Yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!feedData?.result?.posts || feedData.result.posts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <FontAwesomeIcon icon={faHome} size={80} color="#374151" />
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 16,
            }}
          >
            Henüz ilan bulunamadı
          </Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <RefreshablePagerView
          onRefresh={handleRefresh}
          refreshing={feedLoading}
        >
          <PagerView
            ref={pagerViewRef}
            style={{ flex: 1 }}
            orientation="vertical"
            initialPage={0}
            scrollEnabled={!isHorizontalScrollActive}
            onPageSelected={handlePageSelected}
            onPageScrollStateChanged={handlePageScrollStateChanged}
            overdrag={false}
            pageMargin={0}
            offscreenPageLimit={1}
            // 🚀 MODAL UYUMLULUĞU
            keyboardShouldPersistTaps="handled"
          >
            {feedData.result.posts.map((item, index) => (
              <View
                key={`page-${item.postType}-${item.post?.postId || item.metaPost?.id || index}`}
                style={{
                  width: SCREEN_WIDTH,
                  height: ITEM_HEIGHT,
                }}
                pointerEvents="box-none" // 🚀 Touch geçişkenliği
              >
                <ListingCard
                  listing={item}
                  safeAreaInsets={insets}
                  isActive={index === currentIndex}
                  onHorizontalScrollChange={setIsHorizontalScrollActive}
                  index={index}
                />
              </View>
            ))}
          </PagerView>
        </RefreshablePagerView>

      </View>
    </GestureHandlerRootView>
  );
};

export default ExploreScreen;