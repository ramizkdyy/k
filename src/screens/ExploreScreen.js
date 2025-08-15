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
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHome } from "@fortawesome/pro-solid-svg-icons";
import { useGetTikTokFeedQuery } from "../redux/api/apiSlice";

// Gesture ve Animation imports
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

// Components
import ExplorePostInfo from "../components/ExplorePostInfo";
import ExploreActionButtons from "../components/ExploreActionButtons";
import LinearGradient from "react-native-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = SCREEN_HEIGHT - 83;

// Optimize edilmiş ListingCard component - AYNI KALDI
const ListingCard = memo(({ listing, safeAreaInsets, isActive }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] =
    useState(false);

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
        type: "normal",
      };
    } else if (listing.postType === "MetaPost" && listing.metaPost) {
      const meta = listing.metaPost;

      let images = [];

      if (meta.imagesJson) {
        try {
          const parsedImages = JSON.parse(meta.imagesJson);
          if (Array.isArray(parsedImages)) {
            const validImages = parsedImages.filter(
              (img) => img && img.url && img.url !== null
            );
            images = validImages.map((img) => ({ url: img.url }));
          }
        } catch (error) {
          console.error("❌ ImagesJson parse hatası:", error.message);
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
        type: "meta",
      };
    }

    return {
      images: [],
      title: "Başlık yok",
      location: "",
      price: "",
      postId: null,
      type: "unknown",
    };
  };

  const listingData = getListingData();

  // Yatay scroll handler - AYNI KALDI
  const handleImageScroll = useCallback((event) => {
    const slideSize = SCREEN_WIDTH;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
  }, []);

  // Yatay scroll başlangıç/bitiş kontrolü - AYNI KALDI
  const handleScrollBeginDrag = useCallback(() => {
    setIsHorizontalScrollActive(true);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => {
      setIsHorizontalScrollActive(false);
    }, 100);
  }, []);

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: ITEM_HEIGHT,
        position: "relative",
      }}
    >
      {/* Background Images Container */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        {listingData.images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            directionalLockEnabled={true}
            bounces={false}
            decelerationRate={0.9}
            style={{ flex: 1 }}
            contentContainerStyle={{ alignItems: "start" }}
          >
            {listingData.images.map((image, index) => (
              <View
                key={`image-${index}`}
                style={{
                  width: SCREEN_WIDTH,
                  height: ITEM_HEIGHT,
                }}
              >
                {/* Blurred Background Image */}
                <Image
                  source={{ uri: image.postImageUrl || image.url }}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                  blurRadius={25}
                />

                {/* Main Image (Original) */}
                <Image
                  source={{ uri: image.postImageUrl || image.url }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="contain"
                  fadeDuration={200}
                />

                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0.2)", // opacity: 0.5 siyah
                  }}
                />
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
      </View>

      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.0)", // En alt (daha koyu)
          "rgba(0, 0, 0, 0.02)", // Ortalara doğru
          "rgba(0, 0, 0, 0.03)", // Ortalara doğru
          "rgba(0, 0, 0, 0.04)", // Ortalara doğru
          "rgba(0, 0, 0, 0.04)", // Ortalara doğru
          "rgba(0, 0, 0, 0.04)", // Ortalara doğru
          "rgba(0, 0, 0, 0.03)", // Ortalara doğru
          "rgba(0, 0, 0, 0.02)", // Daha da açık
          "rgba(0, 0, 0, 0)", // En üst (tam şeffaf)
        ]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 170,
        }}
      />

      {/* Post Info Component */}
      <ExplorePostInfo listing={listing} safeAreaInsets={safeAreaInsets} />

      {/* Action Buttons Component */}
      <ExploreActionButtons
        listing={listing}
        safeAreaInsets={safeAreaInsets}
        isHorizontalScrollActive={isHorizontalScrollActive}
        currentImageIndex={currentImageIndex}
        totalImages={listingData.images.length}
      />
    </View>
  );
});

// Ana ExploreScreen Component
const ExploreScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const isFocused = useIsFocused(); // 🎯 Bu hook ekran odakta mı kontrol eder

  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollY = useSharedValue(0);
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] =
    useState(false);

  // TikTok Feed API çağrısı - AYNI KALDI
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

  // Status bar ayarları - AYNI KALDI
  useEffect(() => {
    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent", true);
      StatusBar.setTranslucent(true);
    }
  }, []);

  // 🎯 AKILLI TAB REFRESH - Sadece zaten ekrandayken tetiklenir
  useEffect(() => {
    const unsubscribe = navigation?.addListener("tabPress", (e) => {
      // 🚨 KRITIK: Sadece ekran zaten odaktayken yenile
      if (isFocused) {
        console.log("🔄 Tab pressed while already on Explore - Refreshing!");
        handleManualRefresh();
      } else {
        console.log(
          "⏭️ Tab pressed but coming from another screen - No refresh"
        );
      }
    });

    return unsubscribe;
  }, [navigation, isFocused]);

  // 🔧 DEBUG - Screen focus durumunu takip et
  useEffect(() => {
    console.log(
      "🎯 ExploreScreen focus changed:",
      isFocused ? "FOCUSED" : "UNFOCUSED"
    );
  }, [isFocused]);

  // 🔄 MANUEL YENİLEME - Pull to refresh tarzı
  const handleManualRefresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");

    if (feedParams.userId) {
      refetchFeed();
      setCurrentListingIndex(0);

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated: true, // Manuel olunca smooth
        });
      }, 100);
    }
  }, [feedParams.userId, refetchFeed]);

  // ⚡ SADECE DİKEY SCROLL HIZLANDIRILDI - Ana değişiklik burada!
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      runOnJS(setCurrentListingIndex)(index);
    },
  });

  // Viewability ayarları - AYNI KALDI
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      setCurrentListingIndex(visibleIndex || 0);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40, // 40% - TikTok benzeri hassas algılama
    minimumViewTime: 100,
  };

  // Loading states - AYNI KALDI
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
            TikTok Feed yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (!feedData?.result?.posts || feedData.result.posts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
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
            `listing-${item.postType}-${
              item.post?.postId || item.metaPost?.id || index
            }`
          }
          // 🚀 TikTok TARZINDA INSTANT SNAP - Custom interval
          pagingEnabled={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate={0.9} // 0.9 = hızlı ama smooth durma
          showsVerticalScrollIndicator={false}
          bounces={false}
          // ⚡ HIZLI RESPONSE
          scrollEventThrottle={8} // 8ms'de bir tetikle
          // 🔒 YATAY SCROLL ÇAKIŞMASI ENGELLEMESİ - AYNI KALDI
          scrollEnabled={!isHorizontalScrollActive}
          // 🔄 PULL TO REFRESH - Manuel yenileme ekle
          refreshControl={
            <RefreshControl
              refreshing={feedLoading}
              onRefresh={handleManualRefresh}
              colors={["#4A90E2"]}
              tintColor="#4A90E2"
            />
          }
          // 📱 PLATFORM-SPESİFİK OPTİMİZASYONLAR
          {...(Platform.OS === "android" && {
            persistentScrollbar: false,
            fadingEdgeLength: 0,
            nestedScrollEnabled: false,
            overScrollMode: "never",
          })}
          {...(Platform.OS === "ios" && {
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: "never",
          })}
          // Scroll Handler - AYNI KALDI
          onScroll={scrollHandler}
          // Viewability Ayarları - AYNI KALDI
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // Performance Optimizasyonları - AYNI KALDI
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          updateCellsBatchingPeriod={50}
          // Content Ayarları - AYNI KALDI
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default ExploreScreen;
