import React, { memo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable, // 🚀 TouchableOpacity yerine Pressable
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faShare,
  faBed,
  faShower,
  faRuler,
  faBuilding,
  faCalendar,
  faMoneyBills,
  faCoins,
  faUsers,
  faUser,
  faStar,
  faHome,
  faLocationDot,
  faBedBunk,
  faEllipsis,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/pro-regular-svg-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import ExploreDetailModal from "../modals/ExploreDetailModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ExploreActionButtons = memo(
  ({
    listing,
    safeAreaInsets,
    isHorizontalScrollActive,
    currentImageIndex = 0,
    totalImages = 0,
  }) => {
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Animation values
    const expandedHeight = useSharedValue(0);
    const chevronRotation = useSharedValue(0);

    // 🚀 MODAL AÇMA - Kesinlikle çalışan versiyon
    const handleModalOpen = () => {
      console.log('🚀 Modal Opening Triggered'); // Debug
      setIsDetailModalVisible(true);
    };

    const handleModalClose = () => {
      console.log('🚀 Modal Closing Triggered'); // Debug
      setIsDetailModalVisible(false);
    };

    // Listing verilerini çıkar
    const getListingDetails = () => {
      if (listing.postType === "NormalPost" && listing.post) {
        const post = listing.post;
        return {
          type: "normal",
          rooms: post.odaSayisi,
          bedrooms: post.yatakOdasiSayisi,
          bathrooms: post.banyoSayisi,
          area: post.brutMetreKare,
          floor: post.bulunduguKat,
          totalFloors: post.toplamKat,
          buildingAge: post.binaYasi,
          dues: post.aidat,
          deposit: post.depozito,
          heating: post.isitmaTipi,
          furnished: post.esyali,
          inSite: post.siteIcerisinde,
          parking: post.otopark,
          elevator: post.asansor,
          balcony: post.balkon,
          price: post.kiraFiyati,
          currency: post.paraBirimi,
        };
      } else if (listing.postType === "MetaPost" && listing.metaPost) {
        const meta = listing.metaPost;
        return {
          type: "meta",
          rooms: meta.bedroomCount,
          bathrooms: meta.bathroomCount,
          capacity: meta.personCapacity,
          rating: meta.rating,
          reviewCount: meta.reviewCount,
          propertyType: getPropertyTypeName(meta.propertyType),
          isSuperhost: meta.isSuperhost,
          instantBook: meta.canInstantBook,
          amenityCount: meta.amenityCount,
        };
      }
      return null;
    };

    const getPropertyTypeName = (type) => {
      const types = {
        0: "Daire",
        1: "Butik Otel",
        2: "Otel",
        3: "Konaklama",
        5: "B&B",
        6: "Apart",
        8: "Ev",
        16: "Mağara",
      };
      return types[type] || "Konaklama";
    };

    const details = getListingDetails();
    if (!details) return null;

    // Animation callback
    const onAnimationComplete = (expanded) => {
      "worklet";
      runOnJS(setIsAnimating)(false);
      runOnJS(setIsExpanded)(expanded);
    };

    // Toggle function
    const toggleExpanded = () => {
      if (isAnimating || details.type !== "normal") return;

      setIsAnimating(true);
      const newExpanded = !isExpanded;

      if (newExpanded) {
        expandedHeight.value = withTiming(
          250,
          { duration: 200 },
          (finished) => {
            if (finished) onAnimationComplete(true);
          }
        );
        chevronRotation.value = withTiming(180, { duration: 300 });
      } else {
        expandedHeight.value = withTiming(
          0,
          { duration: 200 },
          (finished) => {
            if (finished) onAnimationComplete(false);
          }
        );
        chevronRotation.value = withTiming(0, { duration: 300 });
      }
    };

    // Page Indicator dots logic
    const renderPageIndicator = () => {
      if (totalImages <= 1) return null;

      const maxDots = 5;
      let startIndex = 0;
      let endIndex = totalImages - 1;

      if (totalImages > maxDots) {
        const half = Math.floor(maxDots / 2);

        if (currentImageIndex <= half) {
          endIndex = maxDots - 1;
        } else if (currentImageIndex >= totalImages - half - 1) {
          startIndex = totalImages - maxDots;
        } else {
          startIndex = currentImageIndex - half;
          endIndex = currentImageIndex + half;
        }
      }

      const dotsToShow = [];
      for (let i = startIndex; i <= endIndex; i++) {
        dotsToShow.push(i);
      }

      return (
        <View
          style={{
            position: "absolute",
            bottom: 110,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          {dotsToShow.map((index) => (
            <View
              key={index}
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor:
                  index === currentImageIndex
                    ? "white"
                    : "rgba(255, 255, 255, 0.4)",
                marginHorizontal: 3,
                shadowRadius: 4,
                elevation: 5,
              }}
            />
          ))}
        </View>
      );
    };

    // Animated styles
    const expandedAnimatedStyle = useAnimatedStyle(() => ({
      height: expandedHeight.value,
      opacity: expandedHeight.value > 0 ? 1 : 0,
    }));

    const chevronAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${chevronRotation.value}deg` }],
    }));

    // Shadow styles
    const textShadowStyle = {
      textShadowColor: "rgba(0, 0, 0, 0.8)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    };

    const subtitleShadowStyle = {
      textShadowColor: "rgba(0, 0, 0, 0.7)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    };

    const iconShadowStyle = {
      shadowColor: "rgba(0, 0, 0, 0.8)",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 8,
    };

    // Basic details for normal posts
    const basicDetails = [];
    if (details.type === "normal") {
      if (details.rooms)
        basicDetails.push({ icon: faBed, value: details.rooms, label: "Oda" });
      if (details.bedrooms)
        basicDetails.push({
          icon: faBedBunk,
          value: details.bedrooms,
          label: "Y.Odası",
        });
      if (details.area)
        basicDetails.push({
          icon: faRuler,
          value: `${details.area}m²`,
          label: "Alan",
        });
      if (details.buildingAge)
        basicDetails.push({
          icon: faCalendar,
          value: details.buildingAge + " Yaş",
          label: "Bina Yaşı",
        });
      if (details.floor !== undefined)
        basicDetails.push({
          icon: faBuilding,
          value: `${details.floor}. Kat`,
          label: "Kat",
        });
    }

    // Meta post details
    const metaPostDetails = [];
    if (details.type === "meta") {
      if (details.rooms)
        metaPostDetails.push({
          icon: faBed,
          value: details.rooms + " Oda",
          label: "Oda",
        });
      if (details.bathrooms)
        metaPostDetails.push({
          icon: faShower,
          value: details.bathrooms + " Banyo",
          label: "Banyo",
        });
      if (details.capacity)
        metaPostDetails.push({
          icon: faUser,
          value: `${details.capacity} kişi`,
          label: "Kapasite",
        });
      if (details.rating)
        metaPostDetails.push({
          icon: faStar,
          value: details.rating.toFixed(2),
          label: "Puan",
        });
      if (details.propertyType)
        metaPostDetails.push({
          icon: faHome,
          value: details.propertyType,
          label: "Tür",
        });
    }

    const DetailItem = ({ detail }) => (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          minHeight: 50,
          width: "100%",
        }}
      >
        <View style={iconShadowStyle}>
          <FontAwesomeIcon icon={detail.icon} size={22} color="white" />
        </View>
        <Text
          style={{
            ...subtitleShadowStyle,
            color: "white",
            marginTop: 10,
            textAlign: "center",
            fontWeight: "500",
            fontSize: 13,
          }}
          numberOfLines={1}
        >
          {detail.value}
        </Text>
      </View>
    );

    return (
      <>
        {/* 🚀 ACTION BUTTONS CONTAINER - YENİDEN TASARLANDI */}
        <View
          style={{
            position: "absolute",
            right: 4, // Biraz sağa kaydırıldı
            top: safeAreaInsets.top,
            zIndex: 9999, // 🚀 Çok yüksek z-index
            width: 60,
            maxHeight: 600,
            elevation: 9999, // Android için
          }}
          // 🚀 Container'ın kendisi touch olaylarını engellemeyecek
          pointerEvents="box-none"
        >
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            {/* 🚀 MODAL AÇMA BUTONU - KESINLIKLE ÇALIŞAN VERSİYON */}
            <Pressable
              onPress={handleModalOpen}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: pressed
                    ? "rgba(0,0,0,0.6)"
                    : "rgba(0,0,0,0.4)",
                  marginBottom: 8,
                  // 🚀 Çok güçlü shadow
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 20,
                },
              ]}
              // 🚀 Pressable için ek özellikler
              android_ripple={{
                color: "rgba(255,255,255,0.3)",
                borderless: true,
                radius: 25,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              pressRetentionOffset={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={iconShadowStyle}>
                <FontAwesomeIcon icon={faEllipsis} size={22} color="white" />
              </View>
            </Pressable>

            {/* 🚀 DETAYLAR - SCROLL VIEW */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              scrollEnabled={!isHorizontalScrollActive}
              contentContainerStyle={{
                alignItems: "center",
              }}
              // 🚀 ScrollView'un touch olayları geçsin
              pointerEvents="box-none"
            >
              {/* META POST İÇİN - Tüm detaylar direkt görünür */}
              {details.type === "meta" && (
                <>
                  {metaPostDetails.map((detail, index) => (
                    <DetailItem key={`meta-${index}`} detail={detail} />
                  ))}
                </>
              )}

              {/* NORMAL POST İÇİN - Animasyonlu yapı */}
              {details.type === "normal" && (
                <>
                  {/* Temel detaylar - Her zaman görünür */}
                  {basicDetails.map((detail, index) => (
                    <DetailItem key={`basic-${index}`} detail={detail} />
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Page Indicator Dots */}
        {renderPageIndicator()}

        {/* 🚀 DETAIL MODAL - DEBUG VE İYİLEŞTİRME */}
        {isDetailModalVisible && (
          <ExploreDetailModal
            visible={isDetailModalVisible}
            onClose={handleModalClose}
            listing={listing}
          />
        )}
      </>
    );
  }
);

export default ExploreActionButtons;