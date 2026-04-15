import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Modal,
  StatusBar,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ExternalLink, MapPin, ArrowLeft } from "lucide-react-native";
import * as Location from "expo-location";
import PlatformBlurView from "./PlatformBlurView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LocationSection = ({ post }) => {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTravelTime = (distanceKm) => {
    const avgSpeedKmh = 30;
    return Math.round((distanceKm / avgSpeedKmh) * 60);
  };

  const formatTravelTime = (minutes) => {
    if (minutes < 60) return `${minutes} dk`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remaining = minutes % 60;
      return remaining === 0 ? `${hours} saat` : `${hours} saat ${remaining} dk`;
    }
    const days = Math.floor(minutes / 1440);
    const remaining = minutes % 1440;
    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    let result = `${days} gün`;
    if (hours > 0) result += ` ${hours} saat`;
    if (mins > 0) result += ` ${mins} dk`;
    return result;
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Hata", "Konum izni verilmedi.");
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      return location.coords;
    } catch (error) {
      Alert.alert("Hata", "Konum bilgisi alınamadı.");
      return null;
    }
  };

  const calculateDistanceAndTime = async () => {
    if (!post.postLatitude || !post.postLongitude) return;
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
          post.postLatitude,
          post.postLongitude
        );
        setDistance(distanceKm);
        setTravelTime(calculateTravelTime(distanceKm));
      }
    } catch (error) {
    } finally {
      setIsLoadingDistance(false);
    }
  };

  useEffect(() => {
    if (post.postLatitude && post.postLongitude) {
      calculateDistanceAndTime();
    }
  }, [post.postLatitude, post.postLongitude]);

  const openSpecificMap = (mapType) => {
    const { postLatitude: lat, postLongitude: lng, ilanBasligi, mahalle, ilce } = post;
    if (!lat || !lng) {
      Alert.alert("Hata", "Konum bilgisi bulunamadı.");
      return;
    }
    let url;
    if (mapType === "apple") {
      url = `maps:0,0?q=${ilanBasligi}@${lat},${lng}`;
    } else if (mapType === "google") {
      url = Platform.OS === "ios"
        ? `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=16`
        : `google.navigation:q=${lat},${lng}`;
    }
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      ).catch(() => Alert.alert("Hata", "Harita uygulaması açılamadı."));
    });
  };

  const showMapOptions = () => {
    Alert.alert(
      "Harita Uygulaması Seç",
      "Hangi harita uygulamasını kullanmak istiyorsunuz?",
      [
        ...(Platform.OS === "ios"
          ? [{ text: "Apple Maps", onPress: () => openSpecificMap("apple") }]
          : []),
        { text: "Google Maps", onPress: () => openSpecificMap("google") },
        { text: "İptal", style: "cancel" },
      ]
    );
  };

  if (!post.postLatitude || !post.postLongitude) return null;

  const region = {
    latitude: post.postLatitude,
    longitude: post.postLongitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <>
      <View
        style={{ borderBottomWidth: 0.4, borderBottomColor: "#dee0ea" }}
        className="mb-5 pb-6"
      >
        <Text
          style={{ fontSize: 14 }}
          className="font-medium text-center text-gray-500 mb-4 mt-1"
        >
          Konum
        </Text>

        {/* Küçük harita - basılınca fullscreen açılıyor */}
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
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
                coordinate={{ latitude: post.postLatitude, longitude: post.postLongitude }}
                title={post.ilanBasligi}
                description={`${post.mahalle}, ${post.ilce}`}
              >
                <MapPin size={24} color="#000" fill="#000" />
              </Marker>
            </MapView>

            {/* Dokunuşu yakala */}
            <View
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "transparent",
              }}
            />
          </View>

          {/* Haritada Aç butonu */}
          <TouchableOpacity
            onPress={showMapOptions}
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
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <ExternalLink size={12} color="#4b5563" />
            <Text style={{ fontSize: 12 }} className="ml-1 text-gray-600 font-medium">
              Haritada Aç
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View className="flex-row items-center mt-3">
          <Text style={{ fontSize: 12 }} className="text-gray-500 flex-1">
            {[post.il, post.ilce, post.mahalle].filter(Boolean).join(", ")}
          </Text>
          {travelTime && (
            <Text style={{ fontSize: 12 }} className="text-blue-600 font-medium">
              ~{formatTravelTime(travelTime)}
            </Text>
          )}
        </View>
      </View>

      {/* Fullscreen Harita Modal - ExploreDetailModal ile aynı yaklaşım */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        statusBarTranslucent={true}
      >
        <StatusBar hidden={true} />
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Floating geri butonu */}
          <View
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 16,
              zIndex: 999,
            }}
          >
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
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

          {/* Fullscreen harita */}
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
              coordinate={{ latitude: post.postLatitude, longitude: post.postLongitude }}
              title={post.ilanBasligi}
              description={`${post.mahalle}, ${post.ilce}`}
            >
              <MapPin size={32} color="#ef4444" fill="#ef4444" />
            </Marker>
          </MapView>

          {/* Alt bilgi ve aksiyon barı */}
          <PlatformBlurView
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
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <View className="flex-col">
              <View className="mb-3">
                <Text
                  style={{ fontSize: 16, fontWeight: "600" }}
                  className="text-gray-900 mb-1"
                >
                  {post.ilanBasligi || "İlan"}
                </Text>
                <Text style={{ fontSize: 14 }} className="text-gray-500">
                  {[post.il, post.ilce, post.mahalle].filter(Boolean).join(", ")}
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

              <TouchableOpacity
                style={{ borderRadius: 20 }}
                className="bg-gray-900 py-4"
                onPress={() => {
                  setIsModalVisible(false);
                  showMapOptions();
                }}
              >
                <Text className="text-white font-semibold text-center">
                  {isLoadingDistance ? "Hesaplanıyor..." : "Yol Tarifi Al"}
                </Text>
              </TouchableOpacity>
            </View>
          </PlatformBlurView>
        </View>
      </Modal>
    </>
  );
};

export default LocationSection;
