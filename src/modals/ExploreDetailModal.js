// ExploreDetailModal.js içindeki location kısmını PostDetailScreen'deki gibi güncellemek için
// Bu kod parçasını ExploreDetailModal.js'in uygun yerine ekleyin

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
  Platform,
  StatusBar,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import {
  X,
  Info,
  BedDouble,
  ShowerHead,
  Ruler,
  Building2,
  Calendar,
  Banknote,
  Coins,
  Users,
  Star,
  Home,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  Eye,
  ThumbsUp,
  CheckCircle,
  XCircle,
  Key,
  ParkingCircle,
  Building,
  Trees,
  DoorOpen,
  Flame,
  BedSingle,
  Utensils,
  BarChart3,
  Wifi,
  Check,
  Tv,
  Snowflake,
  ShieldCheck,
  Camera,
  Hash,
  Globe,
  Award,
  CalendarCheck,
  Database,
  Code,
  Heart,
  ArrowLeft,
  ExternalLink
} from "lucide-react-native";
import MapView, { Marker } from "react-native-maps";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";

const { height: SCREEN_HEIGHT, width } = Dimensions.get("window");

const ExploreDetailModal = ({ visible, onClose, listing }) => {
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = currentUser?.role || currentUser?.userRole;

  // Location modal state
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);

  // Bottom Sheet Ref
  const bottomSheetModalRef = useRef(null);

  // Snap points - %35 ve %90 ekran
  const snapPoints = useMemo(() => ["45%", "90%"], []);

  // Enum mapping functions (PostDetailScreen'den alındı)
  const getRentalPeriodText = (value) => {
    const mapping = {
      1: "6 Ay",
      2: "1 Yıl",
      3: "Uzun Vadeli (1+ Yıl)",
      4: "Kısa Dönem Olabilir",
    };
    return mapping[value] || "Belirtilmemiş";
  };

  const getPropertyTypeText = (value) => {
    const mapping = {
      1: "Daire",
      2: "Müstakil Ev",
      3: "Villa",
      4: "Stüdyo Daire",
      5: "Rezidans",
      6: "Diğer",
    };
    return mapping[value] || "Belirtilmemiş";
  };

  const getHeatingTypeText = (value) => {
    const mapping = {
      1: "Doğalgaz Kombi",
      2: "Merkezi Sistem",
      3: "Elektrikli Isıtma",
      4: "Soba",
      5: "Fark Etmez",
    };
    return mapping[value] || "Belirtilmemiş";
  };

  const getCurrencyText = (value) => {
    const mapping = {
      1: "₺",
      2: "USD",
      3: "EUR",
      4: "GBP",
    };
    return mapping[value] || "₺";
  };

  // Location utility functions
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const calculateTravelTime = (distanceKm) => {
    const avgSpeedKmh = 30; // Ortalama şehir içi hız
    const timeHours = distanceKm / avgSpeedKmh;
    const totalMinutes = Math.round(timeHours * 60);
    return totalMinutes;
  };

  const formatTravelTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} dk`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} saat`;
      } else {
        return `${hours} saat ${remainingMinutes} dk`;
      }
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingMinutes = minutes % 1440;
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      let result = `${days} gün`;
      if (hours > 0) result += ` ${hours} saat`;
      if (mins > 0) result += ` ${mins} dk`;
      return result;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Hata", "Konum izni verilmedi.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      return location.coords;
    } catch (error) {
      console.error("Konum alınamadı:", error);
      Alert.alert("Hata", "Konum bilgisi alınamadı.");
      return null;
    }
  };

  const calculateDistanceAndTime = async (lat, lng) => {
    if (!lat || !lng) return;

    setIsLoadingDistance(true);
    try {
      let userLocation = currentLocation;
      if (!userLocation) {
        userLocation = await getCurrentLocation();
      }
      if (userLocation) {
        const distanceKm = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          lat,
          lng
        );
        const timeMinutes = calculateTravelTime(distanceKm);
        setDistance(distanceKm);
        setTravelTime(timeMinutes);
      }
    } catch (error) {
      console.error("Mesafe hesaplanamadı:", error);
    } finally {
      setIsLoadingDistance(false);
    }
  };

  const openSpecificMap = (mapType, lat, lng, title, description) => {
    if (!lat || !lng) {
      Alert.alert("Hata", "Konum bilgisi bulunamadı.");
      return;
    }

    let url;
    if (mapType === "apple") {
      url = `maps:0,0?q=${title}@${lat},${lng}`;
    } else if (mapType === "google") {
      if (Platform.OS === "ios") {
        url = `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=16`;
      } else {
        url = `google.navigation:q=${lat},${lng}`;
      }
    }

    Linking.openURL(url).catch(() => {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(googleMapsUrl).catch(() => {
        Alert.alert("Hata", "Harita uygulaması açılamadı.");
      });
    });
  };

  const showMapOptions = (lat, lng, title, description) => {
    Alert.alert(
      "Harita Uygulaması Seç",
      "Hangi harita uygulamasını kullanmak istiyorsunuz?",
      [
        ...(Platform.OS === "ios"
          ? [
            {
              text: "Apple Maps",
              onPress: () =>
                openSpecificMap("apple", lat, lng, title, description),
            },
          ]
          : []),
        {
          text: "Google Maps",
          onPress: () =>
            openSpecificMap("google", lat, lng, title, description),
        },
        {
          text: "İptal",
          style: "cancel",
        },
      ]
    );
  };

  // Match Score gösterim fonksiyonu
  const getMatchScoreInfo = (score) => {
    const percentage = score * 100;
    if (percentage >= 80)
      return {
        level: "excellent",
        color: "#10b981",
        text: "Mükemmel",
        bgColor: "#dcfce7",
      };
    if (percentage >= 60)
      return {
        level: "good",
        color: "#3b82f6",
        text: "Çok İyi",
        bgColor: "#dbeafe",
      };
    if (percentage >= 40)
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

  // Match score işleme fonksiyonu
  const getProcessedMatchScore = (rawMatchScore) => {
    if (!rawMatchScore) return null;

    let processedScore = null;

    if (
      typeof rawMatchScore === "object" &&
      rawMatchScore.matchScore !== undefined
    ) {
      processedScore = rawMatchScore.matchScore / 100;
    } else if (typeof rawMatchScore === "number") {
      processedScore = rawMatchScore > 1 ? rawMatchScore / 100 : rawMatchScore;
    }

    return processedScore;
  };

  // Match Score Bar Component
  const MatchScoreBar = ({ matchScore, showBar = true, size = "sm" }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    const scoreInfo = getMatchScoreInfo(matchScore);

    const sizes = {
      sm: {
        barHeight: 5,
        iconSize: 12,
        textSize: 12,
        containerPadding: 2,
        barWidth: width * 0.5,
      },
    };

    const currentSize = sizes[size];

    useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        Animated.timing(progressAnim, {
          toValue: matchScore,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }, 200);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [matchScore]);

    if (showBar) {
      return (
        <View style={{ marginTop: currentSize.containerPadding * 2 }}>
          <View className="flex-row items-center">
            <View
              className="bg-gray-100 rounded-full overflow-hidden"
              style={{
                height: currentSize.barHeight,
                width: currentSize.barWidth,
              }}
            >
              <Animated.View
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                    extrapolate: "clamp",
                  }),
                  backgroundColor: scoreInfo.color,
                  height: "100%",
                  borderRadius: currentSize.barHeight / 2,
                }}
              />
            </View>
          </View>
          <View className="flex flex-row justify-between items-center">
            <Text
              className="text-xs mt-1"
              style={{
                color: scoreInfo.color,
              }}
            >
              {scoreInfo.text} Uyumluluk
            </Text>
            <Text
              className="font-medium ml-1"
              style={{
                color: scoreInfo.color,
                fontSize: currentSize.textSize,
              }}
            >
              %{Math.round(matchScore * 100)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className="flex-row items-center">
        <Heart
          color={scoreInfo.color}
          size={currentSize.iconSize}
          fill={scoreInfo.color}
        />
        <Text
          className="font-medium ml-1"
          style={{
            color: scoreInfo.color,
            fontSize: currentSize.textSize,
          }}
        >
          %{Math.round(matchScore * 100)} {scoreInfo.text}
        </Text>
      </View>
    );
  };

  // Render Location Section
  const renderLocationSection = (post) => {
    if (!post) return null;

    // Normal Post için koordinatları kontrol et
    const hasCoordinates = post.postLatitude && post.postLongitude;

    if (!hasCoordinates) {
      // Koordinat yoksa sadece metin göster
      return (
        <View
          style={{
            borderBottomWidth: 0.4,
            borderBottomColor: "#dee0ea",
          }}
          className="px-6 py-4"
        >
          {renderSectionHeader("Konum")}
          <Text style={{ fontSize: 14 }} className="text-gray-500">
            {[post.il, post.ilce, post.mahalle].filter(Boolean).join(", ") ||
              "Konum belirtilmemiş"}
          </Text>
        </View>
      );
    }

    const region = {
      latitude: post.postLatitude,
      longitude: post.postLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    // Distance hesapla
    useEffect(() => {
      if (post.postLatitude && post.postLongitude) {
        calculateDistanceAndTime(post.postLatitude, post.postLongitude);
      }
    }, [post.postLatitude, post.postLongitude]);

    return (
      <View
        style={{
          borderBottomWidth: 0.4,
          borderBottomColor: "#dee0ea",
        }}
        className="px-6 py-4"
      >
        {renderSectionHeader("Konum")}

        {/* Map Container */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setIsLocationModalVisible(true);
          }}
          activeOpacity={0.8}
          className="relative"
        >
          <View
            style={{
              height: 200,
              borderRadius: 25,
              overflow: "hidden",
              backgroundColor: "#f3f4f6",
            }}
          >
            <MapView
              style={{ flex: 1 }}
              region={region}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={false}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: post.postLatitude,
                  longitude: post.postLongitude,
                }}
                title={post.ilanBasligi || "İlan"}
                description={`${post.mahalle}, ${post.ilce}`}
              >
                <MapPin size={24} color="#000" fill="#000" />
              </Marker>
            </MapView>

            {/* Overlay to capture touches */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "transparent",
              }}
            />
          </View>

          {/* Open Maps Button Overlay */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() =>
              showMapOptions(
                post.postLatitude,
                post.postLongitude,
                post.ilanBasligi || "İlan",
                `${post.mahalle}, ${post.ilce}`
              )
            }
          >
            <ExternalLink size={12} color="#4b5563" />
            <Text
              style={{ fontSize: 12 }}
              className="ml-1 text-gray-600 font-medium"
            >
              Haritada Aç
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View className="flex-row items-center mt-3">
          <Text style={{ fontSize: 12 }} className="text-gray-500 flex-1">
            {[post.il, post.ilce, post.mahalle].filter(Boolean).join(", ") ||
              "Konum belirtilmemiş"}
          </Text>
          {travelTime && (
            <Text
              style={{ fontSize: 12 }}
              className="text-blue-600 font-medium"
            >
              ~{formatTravelTime(travelTime)}
            </Text>
          )}
        </View>

        {/* Full Screen Map Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLocationModalVisible}
          onRequestClose={() => setIsLocationModalVisible(false)}
          statusBarTranslucent={true}
        >
          <StatusBar hidden={true} />
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* Floating Back Button */}
            <View
              style={{
                position: "absolute",
                top: insets.top + 10,
                left: 16,
                zIndex: 999,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsLocationModalVisible(false)}
              >
                <View
                  className="bg-white"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 25,
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                    boxShadow: "0px 0px 12px #00000020",
                  }}
                >
                  <ArrowLeft size={18} color="black" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Full Screen Map */}
            <MapView
              style={{ flex: 1 }}
              region={region}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={true}
            >
              <Marker
                coordinate={{
                  latitude: post.postLatitude,
                  longitude: post.postLongitude,
                }}
                title={post.ilanBasligi || "İlan"}
                description={`${post.mahalle}, ${post.ilce}`}
              >
                <MapPin
                  size={32}
                  color="#ef4444"
                  fill="#ef4444"
                />
              </Marker>
            </MapView>

            {/* Bottom Action Bar */}
            <BlurView
              intensity={70}
              tint="light"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingVertical: 12,
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 12,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: -2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <View className="flex-col">
                {/* Location Info */}
                <View className="mb-3">
                  <Text
                    style={{ fontSize: 16, fontWeight: "600" }}
                    className="text-gray-900 mb-1"
                  >
                    {post.ilanBasligi || "İlan"}
                  </Text>
                  <Text style={{ fontSize: 14 }} className="text-gray-500">
                    {[post.il, post.ilce, post.mahalle]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                  {travelTime && (
                    <Text
                      style={{ fontSize: 12 }}
                      className="text-blue-600 font-medium mt-1"
                    >
                      Tahmini süre: {formatTravelTime(travelTime)}
                    </Text>
                  )}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={{ borderRadius: 20 }}
                  className="bg-gray-900 py-4"
                  onPress={() => {
                    setIsLocationModalVisible(false);
                    showMapOptions(
                      post.postLatitude,
                      post.postLongitude,
                      post.ilanBasligi || "İlan",
                      `${post.mahalle}, ${post.ilce}`
                    );
                  }}
                >
                  <Text className="text-white font-semibold text-center">
                    {isLoadingDistance ? "Hesaplanıyor..." : "Yol Tarifi Al"}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
      </View>
    );
  };

  // Modal açılış/kapanış kontrolü
  useEffect(() => {
    if (visible && listing) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, listing]);

  // Bottom Sheet dismiss handler
  const handleSheetChanges = useCallback(
    (index) => {
      console.log("BottomSheet index changed:", index);
      if (index === -1) {
        // Modal kapatıldı
        onClose();
      }
    },
    [onClose]
  );

  // Backdrop component
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Helper functions
  const formatCurrency = (amount, currency) => {
    if (!amount) return "Belirtilmemiş";
    const symbols = {
      TL: "₺",
      USD: "$",
      EUR: "€",
    };
    return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    return types[type] || "Belirtilmemiş";
  };

  const getRoomTypeName = (type) => {
    const types = {
      0: "Tüm ev/daire",
      1: "Özel oda",
      2: "Ortak oda",
    };
    return types[type] || "Belirtilmemiş";
  };

  const getPriceStatusName = (status) => {
    const statuses = {
      0: "Tarih ekleyin",
      1: "Belirtilmemiş",
    };
    return statuses[status] || "Bilinmiyor";
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: { text: "Aktif", color: "text-green-600" },
      1: { text: "Kiralandı", color: "text-blue-600" },
      2: { text: "Kapalı", color: "text-red-600" },
    };
    return statusMap[status] || { text: "Bilinmiyor", color: "text-gray-600" };
  };

  const renderDetailItem = (
    icon,
    label,
    value,
    valueColor = "text-gray-500"
  ) => (
    <View className="flex-row justify-between py-2 items-center">
      <Text style={{ fontSize: 16 }} className="font-semibold text-gray-900">
        {label}
      </Text>
      <Text className={`${valueColor}`} style={{ fontSize: 14 }}>
        {value || "Belirtilmemiş"}
      </Text>
    </View>
  );

  const renderBooleanItem = (icon, label, value) => {
    const isTrue = value === true || value === "true" || value === 1;
    return renderDetailItem(
      icon,
      label,
      isTrue ? "Evet" : "Hayır",
      isTrue ? "text-green-700" : "text-red-700"
    );
  };

  const renderSectionHeader = (title) => (
    <View className="flex flex-col items-center">
      <Text
        style={{ fontSize: 14 }}
        className="font-medium text-center text-gray-500 mb-4 mt-1"
      >
        {title}
      </Text>
    </View>
  );

  if (!listing) return null;

  const isNormalPost = listing.postType === "NormalPost";
  const post = listing.post;
  const metaPost = listing.metaPost;
  const statusInfo = isNormalPost ? getStatusText(post?.status) : null;

  // Match score'u işle
  let processedMatchScore = null;
  if (isNormalPost && post) {
    const rawMatchScore = listing.matchScore || post.matchScore;
    processedMatchScore = getProcessedMatchScore(rawMatchScore);
  } else if (listing.matchScore) {
    processedMatchScore = getProcessedMatchScore(listing.matchScore);
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      topInset={80}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      enableOverDrag={false}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/* Content */}
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isNormalPost && post ? (
          // Normal Post Details
          <>
            {/* Ev Sahibi ve Uyumluluk Skoru */}
            {(post.user || processedMatchScore) && (
              <View className="px-6 py-4 border-b border-gray-100">
                {post.user && (
                  <View className="mb-4">
                    <Text
                      style={{ fontSize: 14 }}
                      className="text-gray-500 leading-6 font-medium text-center mb-6"
                    >
                      Ev Sahibi
                    </Text>
                    <View className="flex-col items-center">
                      <View
                        style={{ boxShadow: "0px 0px 12px #00000014" }}
                        className="w-24 h-24 rounded-full bg-white justify-center items-center mb-4 border-white"
                      >
                        {post.user.profilePictureUrl !==
                          "default_profile_image_url" ? (
                          <Image
                            style={{
                              width: 96,
                              height: 96,
                              borderRadius: 100,
                              boxShadow: "0px 0px 12px #00000014",
                              width: 96,
                              height: 96
                            }}
                            source={{ uri: post.user.profilePictureUrl }}
                            className="w-full h-full rounded-full"
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={200}
                          />
                        ) : (
                          <View
                            style={{
                              borderRadius: 100,
                              boxShadow: "0px 0px 12px #00000014",
                            }}
                            className="w-full h-full rounded-full bg-gray-100 justify-center items-center"
                          >
                            <Text
                              style={{ fontSize: 40 }}
                              className="text-gray-900 font-bold"
                            >
                              {post?.user?.name?.charAt(0) || "P"}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-1 ml-3">
                        <Text
                          style={{ fontSize: 16 }}
                          className="font-semibold text-gray-900"
                        >
                          {`${post.user.name} ${post.user.surname}`}
                        </Text>
                        {post.user.age && (
                          <Text
                            style={{ fontSize: 12 }}
                            className="text-gray-500"
                          >
                            {post.user.age} yaşında
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Uyumluluk Skoru - sadece KIRACI için */}
                {userRole === "KIRACI" &&
                  processedMatchScore &&
                  processedMatchScore > 0 && (
                    <View className="flex flex-col justify-center items-center mb-4">
                      <MatchScoreBar
                        matchScore={processedMatchScore}
                        showBar={true}
                      />
                    </View>
                  )}
                {userRole === "KIRACI" &&
                  (!processedMatchScore || processedMatchScore === 0) && (
                    <View>
                      <Text
                        style={{ fontSize: 16 }}
                        className="font-semibold text-gray-900 mb-2"
                      >
                        Uyumluluk
                      </Text>
                      <Text style={{ fontSize: 12 }} className="text-gray-500">
                        Uyumluluk hesaplanıyor...
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Location Section - PostDetailScreen'deki gibi */}
            {renderLocationSection(post)}

            {/* İlan Açıklaması */}
            {post.postDescription && (
              <View
                style={{
                  borderBottomWidth: 0.4,
                  borderBottomColor: "#dee0ea",
                }}
                className="px-6 py-4"
              >
                {renderSectionHeader("İlan Açıklaması")}
                <Text
                  style={{ fontSize: 14 }}
                  className="text-gray-500 leading-6"
                >
                  {post.postDescription}
                </Text>
              </View>
            )}

            {/* İlan Detayları */}
            <View className="px-6 py-4">
              {renderSectionHeader("İlan Detayları")}
              <View className="">
                {renderDetailItem(
                  null,
                  "İlan Durumu",
                  statusInfo?.text || "Aktif",
                  statusInfo?.color || "text-green-600"
                )}
                {renderDetailItem(
                  null,
                  "İlan Tipi",
                  getPropertyTypeText(post.propertyType)
                )}
                {renderDetailItem(
                  null,
                  "Kiralama Süresi",
                  getRentalPeriodText(post.rentalPeriod)
                )}
                {renderDetailItem(
                  null,
                  "İlan Tarihi",
                  post.postTime
                    ? new Date(post.postTime).toLocaleDateString("tr-TR")
                    : "Belirtilmemiş"
                )}
              </View>
            </View>

            {/* Ev içi */}
            <View
              style={{
                borderBottomWidth: 0.4,
                borderBottomColor: "#dee0ea",
              }}
              className="px-6 py-4"
            >
              {renderSectionHeader("Ev içi")}
              <View className="">
                {renderDetailItem(null, "Oda Sayısı", post.odaSayisi)}
                {post.yatakOdasiSayisi !== undefined &&
                  renderDetailItem(
                    null,
                    "Yatak Odası",
                    post.yatakOdasiSayisi
                  )}
                {renderDetailItem(null, "Banyo Sayısı", post.banyoSayisi)}
                {renderDetailItem(
                  null,
                  "Isınma",
                  getHeatingTypeText(post.isitmaTipi)
                )}
                {renderDetailItem(null, "Mutfak türü", post.mutfak)}
                {renderDetailItem(
                  null,
                  "Net Metrekare",
                  post.netMetreKare ? `${post.netMetreKare} m²` : null
                )}
                {renderDetailItem(
                  null,
                  "Brüt Metrekare",
                  post.brutMetreKare ? `${post.brutMetreKare} m²` : null
                )}
                {renderBooleanItem(null, "Eşyalı mı?", post.esyali)}
                {renderBooleanItem(null, "Balkon var mı?", post.balkon)}
              </View>
            </View>

            {/* Apartman / Bina */}
            <View
              style={{
                borderBottomWidth: 0.4,
                borderBottomColor: "#dee0ea",
              }}
              className="px-6 py-4"
            >
              {renderSectionHeader("Apartman / Bina")}
              <View className="">
                {renderDetailItem(
                  null,
                  "Bulunduğu Kat",
                  post.bulunduguKat || "Belirtilmemiş"
                )}
                {renderDetailItem(
                  null,
                  "Toplam Kat",
                  post.toplamKat || "Belirtilmemiş"
                )}
                {renderDetailItem(
                  null,
                  "Bina Yaşı",
                  post.binaYasi ? `${post.binaYasi} yıl` : "Belirtilmemiş"
                )}
                {renderBooleanItem(null, "Otopark", post.otopark)}
                {renderBooleanItem(null, "Asansör", post.asansor)}
                {renderBooleanItem(
                  null,
                  "Site İçerisinde",
                  post.siteIcerisinde
                )}
              </View>
            </View>

            {/* Ödenekler */}
            <View
              style={{
                borderBottomWidth: 0.4,
                borderBottomColor: "#dee0ea",
              }}
              className="px-6 py-4"
            >
              {renderSectionHeader("Ödenekler")}
              <View className="">
                {renderDetailItem(
                  null,
                  "Kira",
                  post.kiraFiyati
                    ? `${post.kiraFiyati.toLocaleString()} ${getCurrencyText(
                      post.paraBirimi
                    )}`
                    : "Belirtilmemiş"
                )}
                {renderDetailItem(
                  null,
                  "Aidat",
                  post.aidat ? `${post.aidat} ₺` : "Belirtilmemiş"
                )}
                {renderDetailItem(
                  null,
                  "Depozito",
                  post.depozito
                    ? `${post.depozito} ${getCurrencyText(post.paraBirimi)}`
                    : "Belirtilmemiş"
                )}
                {renderDetailItem(
                  null,
                  "Min. Kiralama Süresi",
                  post.minimumKiralamaSuresi
                    ? `${post.minimumKiralamaSuresi} Ay`
                    : "Belirtilmemiş"
                )}
              </View>
            </View>

            {/* Diğer */}
            <View
              style={{
                borderBottomWidth: 0.4,
                borderBottomColor: "#dee0ea",
              }}
              className="px-6 py-4"
            >
              {renderSectionHeader("Diğer")}
              <View className="">
                <View className="flex-row justify-between py-2 items-center border-gray-200">
                  <View className="flex flex-col gap-1">
                    <Text
                      style={{ fontSize: 16 }}
                      className="text-gray-900 font-semibold"
                    >
                      Kimden
                    </Text>
                    <Text style={{ fontSize: 12 }} className="text-gray-500">
                      Mülkün kimin tarafından kiralandığı
                    </Text>
                  </View>
                  <Text className="text-gray-500" style={{ fontSize: 14 }}>
                    {post.kimden || "Sahibinden"}
                  </Text>
                </View>
                {post.siteAdi &&
                  renderDetailItem(null, "Site adı", post.siteAdi)}
                {renderBooleanItem(null, "Takas", post.takas)}
                {renderDetailItem(
                  null,
                  "Kullanım Durumu",
                  post.kullanimDurumu
                )}
              </View>
            </View>

            {/* İletişim Bilgileri */}
            {post.user && (
              <View
                style={{
                  borderBottomWidth: 0.4,
                  borderBottomColor: "#dee0ea",
                }}
                className="px-6 py-4"
              >
                {renderSectionHeader("İletişim Bilgileri")}
                <View className="">
                  {renderDetailItem(null, "E-posta", post.user.email)}
                  {renderDetailItem(null, "Telefon", post.user.phoneNumber)}
                  {post.user.gender &&
                    renderDetailItem(null, "Cinsiyet", post.user.gender)}
                </View>
              </View>
            )}

            {/* İstatistikler */}
            <View
              style={{
                borderBottomWidth: 0.4,
                borderBottomColor: "#dee0ea",
              }}
              className="px-6 py-4"
            >
              {renderSectionHeader("İstatistikler")}
              <View className="">
                {renderDetailItem(null, "Görüntülenme", post.viewCount || 0)}
                {renderDetailItem(
                  null,
                  "Benzersiz Görüntülenme",
                  post.uniqueViewCount || 0
                )}
                {renderDetailItem(null, "Bugün", post.todayViewCount || 0)}
                {renderDetailItem(null, "Bu Hafta", post.weekViewCount || 0)}
                {renderDetailItem(
                  null,
                  "Benzerlik Skoru",
                  post.similarityScore || 0
                )}
                {renderDetailItem(
                  null,
                  "Teklif Sayısı",
                  post.offerCount || 0
                )}
                {renderBooleanItem(
                  null,
                  "Teklif Kabul Edildi",
                  post.isOfferAccepted
                )}
              </View>
            </View>
          </>
        ) : (
          // Meta Post Details (Airbnb)
          metaPost && (
            <>
              {/* Uyumluluk Skoru - MetaPost için */}
              {userRole === "KIRACI" &&
                processedMatchScore &&
                processedMatchScore > 0 && (
                  <View className="px-6 py-4 border-b border-gray-100">
                    <Text
                      style={{ fontSize: 16 }}
                      className="font-semibold text-gray-900 mb-2"
                    >
                      Uyumluluk
                    </Text>
                    <MatchScoreBar
                      matchScore={processedMatchScore}
                      showBar={true}
                    />
                  </View>
                )}

              {/* Konaklama Bilgileri */}
              <View className="px-6 py-4">
                {renderSectionHeader("Konaklama Bilgileri")}
                <View className="">
                  {renderDetailItem(
                    null,
                    "Lokasyon",
                    `${metaPost.location}, ${metaPost.city}, ${metaPost.country}`
                  )}
                  {renderDetailItem(null, "Fiyat", metaPost.priceInfo)}
                  {renderDetailItem(
                    null,
                    "Emlak Tipi",
                    getPropertyTypeName(metaPost.propertyType)
                  )}
                  {renderDetailItem(
                    null,
                    "Yatak Odası",
                    metaPost.bedroomCount || 0
                  )}
                  {renderDetailItem(null, "Banyo", metaPost.bathroomCount)}
                  {renderDetailItem(
                    null,
                    "Kapasite",
                    `${metaPost.personCapacity} kişi`
                  )}
                </View>
              </View>

              {/* MetaPost için basit location gösterimi (koordinat yoksa) */}
              <View
                style={{
                  borderBottomWidth: 0.4,
                  borderBottomColor: "#dee0ea",
                }}
                className="px-6 py-4"
              >
                {renderSectionHeader("Konum")}
                <Text style={{ fontSize: 14 }} className="text-gray-500">
                  {`${metaPost.location}, ${metaPost.city}, ${metaPost.country}`}
                </Text>
              </View>

              {/* Ev Sahibi */}
              <View
                style={{
                  borderBottomWidth: 0.4,
                  borderBottomColor: "#dee0ea",
                }}
                className="px-6 py-4"
              >
                {renderSectionHeader("Ev Sahibi")}
                <View className="">
                  {renderDetailItem(null, "İsim", metaPost.hostName)}
                  {renderBooleanItem(
                    null,
                    "Süper Ev Sahibi",
                    metaPost.isSuperhost
                  )}
                  {renderBooleanItem(
                    null,
                    "Anında Rezervasyon",
                    metaPost.canInstantBook
                  )}
                </View>
              </View>

              {/* Açıklama */}
              {metaPost.description && (
                <View
                  style={{
                    borderBottomWidth: 0.4,
                    borderBottomColor: "#dee0ea",
                  }}
                  className="px-6 py-4"
                >
                  {renderSectionHeader("Açıklama")}
                  <Text
                    style={{ fontSize: 14 }}
                    className="text-gray-500 leading-6"
                  >
                    {metaPost.description}
                  </Text>
                </View>
              )}

              {/* Olanaklar */}
              {metaPost.amenities && metaPost.amenities.length > 0 && (
                <View
                  style={{
                    borderBottomWidth: 0.4,
                    borderBottomColor: "#dee0ea",
                  }}
                  className="px-6 py-4"
                >
                  <Text
                    style={{ fontSize: 14 }}
                    className="font-medium text-center text-gray-500 mb-4 mt-1"
                  >
                    Olanaklar (
                    {metaPost.amenityCount || metaPost.amenities.length})
                  </Text>
                  <View className="flex-row flex-wrap">
                    {metaPost.amenities.slice(0, 10).map((amenity, index) => (
                      <View
                        key={index}
                        className="flex-row items-center mr-4 mb-2"
                      >
                        <Check
                          size={10}
                          color="#10B981"
                        />
                        <Text
                          style={{ fontSize: 12 }}
                          className="text-gray-500 ml-1"
                        >
                          {amenity}
                        </Text>
                      </View>
                    ))}
                    {metaPost.amenities.length > 10 && (
                      <Text
                        style={{ fontSize: 12 }}
                        className="text-gray-500 italic mt-2"
                      >
                        +{metaPost.amenities.length - 10} daha fazla...
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* İstatistikler */}
              {(metaPost.rating || metaPost.reviewCount) && (
                <View
                  style={{
                    borderBottomWidth: 0.4,
                    borderBottomColor: "#dee0ea",
                  }}
                  className="px-6 py-4"
                >
                  {renderSectionHeader("İstatistikler")}
                  <View className="">
                    {metaPost.rating &&
                      renderDetailItem(
                        null,
                        "Puan",
                        `${metaPost.rating.toFixed(2)} ⭐`
                      )}
                    {renderDetailItem(
                      null,
                      "Yorum Sayısı",
                      metaPost.reviewCount || 0
                    )}
                    {renderDetailItem(
                      null,
                      "Görünür Yorum",
                      metaPost.visibleReviewCount || 0
                    )}
                  </View>
                </View>
              )}
            </>
          )
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handleIndicator: {
    backgroundColor: "#d1d5db",
    width: 40,
    height: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ExploreDetailModal;
