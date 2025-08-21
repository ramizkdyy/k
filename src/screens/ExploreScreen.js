import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  Platform,
  FlatList,
  RefreshControl,
  ScrollView,
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

// Components
import ExplorePostInfo from "../components/ExplorePostInfo";
import ExploreActionButtons from "../components/ExploreActionButtons";
import LinearGradient from "react-native-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = SCREEN_HEIGHT - 83;

// Simple Fast Image Component
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

// Simplified ListingCard
const ListingCard = memo(
  ({ listing, safeAreaInsets, isActive, onHorizontalScrollChange }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const getListingData = () => {
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
    };

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
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: ITEM_HEIGHT,
            }}
          >
            {listingData.images.map((image, index) => (
              <View
                key={index}
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
                    left: "50%",
                    width: SCREEN_WIDTH * 0.9,
                    height: (SCREEN_WIDTH * 0.9) / (9 / 16),
                    transform: [
                      { translateX: -(SCREEN_WIDTH * 0.9) / 2 },
                      { translateY: -((SCREEN_WIDTH * 0.9) / (9 / 16)) / 2 },
                    ],
                    borderRadius: 12,
                    overflow: "hidden",
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

        {/* Image Counter - Show only if multiple images */}
        {listingData.images.length > 1 && (
          <View
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {currentImageIndex + 1}/{listingData.images.length}
            </Text>
          </View>
        )}

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
  }
);

// Main ExploreScreen Component
const ExploreScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectCurrentUser);
  const isFocused = useIsFocused();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] =
    useState(false);
  const flatListRef = useRef(null);

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
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [feedParams.userId, refetchFeed]);

  // Viewability handler
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index || 0;
      setCurrentIndex(visibleIndex);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  };

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

        <FlatList
          ref={flatListRef}
          data={feedData.result.posts}
          renderItem={({ item, index }) => (
            <ListingCard
              listing={item}
              safeAreaInsets={insets}
              isActive={index === currentIndex}
              onHorizontalScrollChange={setIsHorizontalScrollActive}
            />
          )}
          keyExtractor={(item, index) =>
            `${item.postType}-${
              item.post?.postId || item.metaPost?.id || index
            }`
          }
          // Scroll Settings - Fast uniform vertical scrolling
          scrollEnabled={!isHorizontalScrollActive}
          pagingEnabled={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate={0.98}
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={1}
          // Refresh Control
          refreshControl={
            <RefreshControl
              refreshing={feedLoading}
              onRefresh={handleRefresh}
              colors={["#4A90E2"]}
              tintColor="#4A90E2"
            />
          }
          // Viewability
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // Performance - Conservative settings
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          // Content settings
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default ExploreScreen;
