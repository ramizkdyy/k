import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  Platform,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHome } from "@fortawesome/pro-regular-svg-icons";
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

// 🚀 SMART IMAGE PRELOADER - Optimized for performance
const ImagePreloader = () => {
  const preloadQueue = useRef(new Set()); // Avoid duplicate preloads
  const isPreloading = useRef(false);

  // URL validation helper
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;

    // Google search URL'lerini ve geçersiz URL'leri filtrele
    const invalidPatterns = [
      "google.com/url",
      "data:text/html",
      "javascript:",
      "about:blank",
    ];

    if (invalidPatterns.some((pattern) => url.includes(pattern))) {
      return false;
    }

    // Geçerli görsel uzantıları
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    // HTTP/HTTPS ile başlayan ve geçerli uzantısı olan URL'ler
    return (
      (url.startsWith("http") || url.startsWith("https")) &&
      (hasValidExtension || url.includes("image") || url.includes("photo"))
    );
  };

  const preloadImages = useCallback((imageUrls, priority = "normal") => {
    const validUrls = imageUrls.filter(isValidImageUrl);

    // Duplicate URL'leri filtrele
    const newUrls = validUrls.filter((url) => !preloadQueue.current.has(url));

    if (newUrls.length === 0) {
      return;
    }

    // Priority'ye göre batch size ayarla
    const batchSize = priority === "high" ? 3 : 5;
    const delay = priority === "high" ? 50 : 200;

    console.log(
      `🎯 Queuing ${newUrls.length} new images for preload (Priority: ${priority})`
    );

    // URL'leri queue'ya ekle
    newUrls.forEach((url) => preloadQueue.current.add(url));

    // Batch processing
    const processBatch = async (urls, startIndex = 0) => {
      if (startIndex >= urls.length) return;

      const batch = urls.slice(startIndex, startIndex + batchSize);

      // Batch'i paralel olarak işle
      const promises = batch.map(
        (url, batchIndex) =>
          new Promise((resolve) => {
            setTimeout(() => {
              Image.prefetch(url)
                .then(() => {
                  console.log(`✅ Preloaded: ${url.substring(0, 30)}...`);
                  resolve();
                })
                .catch((error) => {
                  console.warn(`❌ Failed: ${url.substring(0, 30)}...`);
                  resolve(); // Continue even if failed
                });
            }, batchIndex * 30); // Small delay between batch items
          })
      );

      await Promise.all(promises);

      // Next batch after delay
      setTimeout(() => {
        processBatch(urls, startIndex + batchSize);
      }, delay);
    };

    if (!isPreloading.current) {
      isPreloading.current = true;
      processBatch(newUrls).finally(() => {
        isPreloading.current = false;
      });
    }
  }, []);

  return { preloadImages };
};

// 🔥 FAST LOADING IMAGE COMPONENT
const FastImage = memo(
  ({ uri, style, resizeMode = "cover", blurRadius, fadeDuration = 0 }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // URL validation
    const isValidUrl = useCallback((url) => {
      if (!url || typeof url !== "string") return false;

      const invalidPatterns = [
        "google.com/url",
        "data:text/html",
        "javascript:",
        "about:blank",
      ];

      return (
        !invalidPatterns.some((pattern) => url.includes(pattern)) &&
        (url.startsWith("http") || url.startsWith("https"))
      );
    }, []);

    const validUri = isValidUrl(uri) ? uri : null;

    return (
      <View style={style}>
        {validUri ? (
          <Image
            source={{ uri: validUri }}
            style={[style, { opacity: loaded && !error ? 1 : 0.3 }]}
            contentFit={resizeMode}
            blurRadius={blurRadius}
            fadeDuration={fadeDuration}
            onLoad={() => setLoaded(true)}
            onError={(err) => {
              console.warn(
                "Image load error:",
                validUri.substring(0, 50) + "...",
                err.nativeEvent.error
              );
              setError(true);
            }}
            // 🚀 PERFORMANCE OPTIMIZATIONS
            cache="force-cache" // Aggressive caching
          />
        ) : null}

        {/* Loading/Error placeholder */}
        {(!loaded || error || !validUri) && (
          <View
            style={[
              style,
              {
                position: "absolute",
                backgroundColor: "#dee0ea",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <FontAwesomeIcon icon={faHome} size={80} color="#fff" />
          </View>
        )}
      </View>
    );
  }
);

// Optimize edilmiş ListingCard component
const ListingCard = memo(
  ({
    listing,
    safeAreaInsets,
    isActive,
    index,
    totalItems,
    onImagePreload,
  }) => {
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

    // 🚀 PRELOAD UPCOMING IMAGES when this item becomes active
    useEffect(() => {
      if (isActive && onImagePreload) {
        onImagePreload(index);
      }
    }, [isActive, index, onImagePreload]);

    // Yatay scroll handler
    const handleImageScroll = useCallback((event) => {
      const slideSize = SCREEN_WIDTH;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentImageIndex(index);
    }, []);

    // Yatay scroll başlangıç/bitiş kontrolü
    const handleScrollBeginDrag = useCallback(() => {
      setIsHorizontalScrollActive(true);
    }, []);

    const handleScrollEndDrag = useCallback(() => {
      setTimeout(() => {
        setIsHorizontalScrollActive(false);
      }, 50); // Reduced from 100ms to 50ms
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
            backgroundColor: "#000", // Changed to black for better loading experience
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
              scrollEventThrottle={8} // Reduced from 16 for faster response
              directionalLockEnabled={true}
              bounces={false}
              decelerationRate={0.95} // Faster deceleration
              style={{ flex: 1 }}
              contentContainerStyle={{ alignItems: "start" }}
              // 🚀 PRELOAD ALL IMAGES IN HORIZONTAL SCROLL
              removeClippedSubviews={false} // Keep all images in memory
            >
              {listingData.images.map((image, imgIndex) => (
                <View
                  key={`image-${imgIndex}`}
                  style={{
                    width: SCREEN_WIDTH,
                    height: ITEM_HEIGHT,
                  }}
                >
                  {/* Blurred Background Image */}
                  <FastImage
                    uri={image.postImageUrl || image.url}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    blurRadius={25}
                  />

                  {/* Main Image (Original) */}
                  <FastImage
                    uri={image.postImageUrl || image.url}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    transition={200}
                    fadeDuration={100} // Faster fade
                  />

                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0,0,0,0.2)",
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
            "rgba(0, 0, 0, 0.0)",
            "rgba(0, 0, 0, 0.02)",
            "rgba(0, 0, 0, 0.03)",
            "rgba(0, 0, 0, 0.04)",
            "rgba(0, 0, 0, 0.04)",
            "rgba(0, 0, 0, 0.04)",
            "rgba(0, 0, 0, 0.03)",
            "rgba(0, 0, 0, 0.02)",
            "rgba(0, 0, 0, 0)",
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
  }
);

// Ana ExploreScreen Component
const ExploreScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const isFocused = useIsFocused();

  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollY = useSharedValue(0);
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] =
    useState(false);

  // 🚀 IMAGE PRELOADER HOOK
  const { preloadImages } = ImagePreloader();

  // TikTok Feed API çağrısı
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

  // 🔥 OPTIMIZED IMAGE PRELOADING - Smarter queue management
  const handleImagePreload = useCallback(
    (currentIndex) => {
      if (!feedData?.result?.posts) return;

      const posts = feedData.result.posts;
      const preloadCount = 3; // Reduced from 5 to 3 for better performance
      const imagesToPreload = [];

      // Current post images (high priority)
      const currentPost = posts[currentIndex];
      if (currentPost) {
        if (
          currentPost.postType === "NormalPost" &&
          currentPost.post?.postImages
        ) {
          currentPost.post.postImages.forEach((img) => {
            if (img.postImageUrl && typeof img.postImageUrl === "string") {
              imagesToPreload.push({ url: img.postImageUrl, priority: "high" });
            }
          });
        } else if (
          currentPost.postType === "MetaPost" &&
          currentPost.metaPost
        ) {
          const meta = currentPost.metaPost;
          if (meta.imagesJson) {
            try {
              const parsedImages = JSON.parse(meta.imagesJson);
              if (Array.isArray(parsedImages)) {
                parsedImages.slice(0, 3).forEach((img) => {
                  // Limit to first 3 images
                  if (img?.url && typeof img.url === "string") {
                    imagesToPreload.push({ url: img.url, priority: "high" });
                  }
                });
              }
            } catch (error) {
              console.warn("JSON parse error:", error.message);
            }
          }
          if (meta.firstImageUrl && typeof meta.firstImageUrl === "string") {
            imagesToPreload.push({ url: meta.firstImageUrl, priority: "high" });
          }
        }
      }

      // Next posts images (normal priority)
      const nextPostImages = [];
      for (
        let i = currentIndex + 1;
        i <= Math.min(currentIndex + preloadCount, posts.length - 1);
        i++
      ) {
        const post = posts[i];
        if (post) {
          if (post.postType === "NormalPost" && post.post?.postImages) {
            // Only preload first image of upcoming posts
            const firstImg = post.post.postImages[0];
            if (
              firstImg?.postImageUrl &&
              typeof firstImg.postImageUrl === "string"
            ) {
              nextPostImages.push(firstImg.postImageUrl);
            }
          } else if (post.postType === "MetaPost" && post.metaPost) {
            const meta = post.metaPost;
            if (meta.firstImageUrl && typeof meta.firstImageUrl === "string") {
              nextPostImages.push(meta.firstImageUrl);
            } else if (meta.imagesJson) {
              try {
                const parsedImages = JSON.parse(meta.imagesJson);
                if (Array.isArray(parsedImages) && parsedImages[0]?.url) {
                  nextPostImages.push(parsedImages[0].url);
                }
              } catch (error) {
                console.warn(
                  "JSON parse error for upcoming post:",
                  error.message
                );
              }
            }
          }
        }
      }

      // Preload current post images first (high priority)
      const currentPostUrls = imagesToPreload
        .filter((item) => item.priority === "high")
        .map((item) => item.url);
      if (currentPostUrls.length > 0) {
        console.log(
          `🚀 Preloading ${currentPostUrls.length} current post images (High Priority)`
        );
        preloadImages(currentPostUrls, "high");
      }

      // Then preload upcoming post first images (normal priority)
      if (nextPostImages.length > 0) {
        console.log(
          `📋 Preloading ${nextPostImages.length} upcoming post images (Normal Priority)`
        );
        setTimeout(() => {
          preloadImages(nextPostImages, "normal");
        }, 500); // Delay for current post images to load first
      }
    },
    [feedData?.result?.posts, preloadImages]
  );

  // Status bar ayarları
  useEffect(() => {
    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent", true);
      StatusBar.setTranslucent(true);
    }
  }, []);

  // 🚀 SMART INITIAL PRELOAD - Only preload essential images
  useEffect(() => {
    if (feedData?.result?.posts && feedData.result.posts.length > 0) {
      console.log("🎯 Smart initial preload triggered");

      // Only preload first 2 posts on initial load
      const firstTwoPosts = feedData.result.posts.slice(0, 2);
      const essentialImages = [];

      firstTwoPosts.forEach((post, index) => {
        if (post.postType === "NormalPost" && post.post?.postImages?.[0]) {
          essentialImages.push(post.post.postImages[0].postImageUrl);
        } else if (
          post.postType === "MetaPost" &&
          post.metaPost?.firstImageUrl
        ) {
          essentialImages.push(post.metaPost.firstImageUrl);
        }
      });

      if (essentialImages.length > 0) {
        console.log(`🎯 Preloading ${essentialImages.length} essential images`);
        preloadImages(essentialImages, "high");
      }
    }
  }, [feedData?.result?.posts, preloadImages]);

  // AKILLI TAB REFRESH - Sadece zaten ekrandayken tetiklenir
  useEffect(() => {
    const unsubscribe = navigation?.addListener("tabPress", (e) => {
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

  // DEBUG - Screen focus durumunu takip et
  useEffect(() => {
    console.log(
      "🎯 ExploreScreen focus changed:",
      isFocused ? "FOCUSED" : "UNFOCUSED"
    );
  }, [isFocused]);

  // MANUEL YENİLEME - Pull to refresh tarzı
  const handleManualRefresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");

    if (feedParams.userId) {
      refetchFeed();
      setCurrentListingIndex(0);

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
      }, 100);
    }
  }, [feedParams.userId, refetchFeed]);

  // ⚡ HIZLI DİKEY SCROLL HANDLER
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      runOnJS(setCurrentListingIndex)(index);
    },
  });

  // Viewability ayarları - Daha agresif preloading için
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      setCurrentListingIndex(visibleIndex || 0);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 30, // Reduced from 40% for earlier preloading
    minimumViewTime: 50, // Reduced from 100ms
  };

  // Loading states
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
              index={index}
              totalItems={feedData.result.posts.length}
              onImagePreload={handleImagePreload}
            />
          )}
          keyExtractor={(item, index) =>
            `listing-${item.postType}-${
              item.post?.postId || item.metaPost?.id || index
            }`
          }
          // 🚀 TikTok TARZINDA INSTANT SNAP - Custom interval ile hızlandırılmış
          pagingEnabled={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate={0.99} // 0.99 = çok hızlı durma (0.9'dan daha hızlı)
          disableIntervalMomentum={true} // iOS'ta momentum'u azaltır
          showsVerticalScrollIndicator={false}
          bounces={false}
          // ⚡ ULTRA HIZLI RESPONSE
          scrollEventThrottle={1} // 1ms'de bir tetikle (maksimum hız)
          // 🔒 YATAY SCROLL ÇAKIŞMASI ENGELLEMESİ
          scrollEnabled={!isHorizontalScrollActive}
          // 🔄 PULL TO REFRESH
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
            snapToStart: true, // Android'de daha hızlı snap
          })}
          {...(Platform.OS === "ios" && {
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: "never",
            disableIntervalMomentum: true, // iOS momentum azaltma
          })}
          // Scroll Handler
          onScroll={scrollHandler}
          // Viewability Ayarları
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // 🚀 PERFORMANCE OPTIMIZATIONS FOR FASTER IMAGE LOADING
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          removeClippedSubviews={false} // Keep images in memory for faster access
          maxToRenderPerBatch={2} // Reduced back to 2 for better memory usage
          windowSize={5} // Reduced from 7 to 5 for better performance
          initialNumToRender={1} // Back to 1 for faster initial load
          updateCellsBatchingPeriod={50} // Increased back to 50ms for stability
          // Content Ayarları
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default ExploreScreen;
