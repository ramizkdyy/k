import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ExternalLink, MapPin, X } from "lucide-react-native";
import * as Location from "expo-location";
import { BlurView } from "expo-blur";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const LocationSection = ({ post }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);

  // Haversine formula ile iki nokta arasındaki mesafeyi hesapla
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

  // Mesafeyi dakikaya çevir ve formatla (ortalama şehir içi hız 30 km/h)
  const calculateTravelTime = (distanceKm) => {
    const avgSpeedKmh = 30; // Ortalama şehir içi hız
    const timeHours = distanceKm / avgSpeedKmh;
    const totalMinutes = Math.round(timeHours * 60);

    return totalMinutes;
  };

  // Süreyi formatla (dakika, saat, gün)
  const formatTravelTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} dk`;
    } else if (minutes < 1440) {
      // 24 saat = 1440 dakika
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} saat`;
      } else {
        return `${hours} saat ${remainingMinutes} dk`;
      }
    } else {
      // 1 gün veya daha fazla
      const days = Math.floor(minutes / 1440);
      const remainingMinutes = minutes % 1440;
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;

      let result = `${days} gün`;

      if (hours > 0) {
        result += ` ${hours} saat`;
      }

      if (mins > 0) {
        result += ` ${mins} dk`;
      }

      return result;
    }
  };

  // Kullanıcının mevcut konumunu al
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

  // Mesafe ve süre hesapla
  const calculateDistanceAndTime = async () => {
    if (!post.postLatitude || !post.postLongitude) {
      Alert.alert("Hata", "Hedef konum bilgisi bulunamadı.");
      return;
    }

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

        const timeMinutes = calculateTravelTime(distanceKm);

        setDistance(distanceKm);
        setTravelTime(timeMinutes);
      }
    } catch (error) {
      console.error("Mesafe hesaplanamadı:", error);
      Alert.alert("Hata", "Mesafe hesaplanamadı.");
    } finally {
      setIsLoadingDistance(false);
    }
  };

  // Komponent yüklendiğinde mesafe hesapla
  useEffect(() => {
    if (post.postLatitude && post.postLongitude) {
      calculateDistanceAndTime();
    }
  }, [post.postLatitude, post.postLongitude]);

  // Handle opening specific maps app
  const openSpecificMap = (mapType) => {
    const latitude = post.postLatitude;
    const longitude = post.postLongitude;
    const label = `${post.ilanBasligi} - ${post.mahalle}, ${post.ilce}`;

    if (!latitude || !longitude) {
      Alert.alert("Hata", "Konum bilgisi bulunamadı.");
      return;
    }

    let url;

    if (mapType === "apple") {
      // Apple Maps
      url = `maps:0,0?q=${label}@${latitude},${longitude}`;
    } else if (mapType === "google") {
      // Google Maps
      if (Platform.OS === "ios") {
        url = `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=16`;
      } else {
        url = `google.navigation:q=${latitude},${longitude}`;
      }
    }

    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(googleMapsUrl).catch(() => {
        Alert.alert("Hata", "Harita uygulaması açılamadı.");
      });
    });
  };

  // Handle map selection dialog
  const showMapOptions = () => {
    const options =
      Platform.OS === "ios"
        ? ["Apple Maps", "Google Maps", "İptal"]
        : ["Google Maps", "İptal"];

    Alert.alert(
      "Harita Uygulaması Seç",
      "Hangi harita uygulamasını kullanmak istiyorsun?",
      [
        ...(Platform.OS === "ios"
          ? [
              {
                text: "Apple Maps",
                onPress: () => openSpecificMap("apple"),
              },
            ]
          : []),
        {
          text: "Google Maps",
          onPress: () => openSpecificMap("google"),
        },
        {
          text: "İptal",
          style: "cancel",
        },
      ]
    );
  };

  // Don't render if no coordinates
  if (!post.postLatitude || !post.postLongitude) {
    return null;
  }

  const region = {
    latitude: post.postLatitude,
    longitude: post.postLongitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <>
      <View
        style={{
          borderBottomWidth: 0.4,
          borderBottomColor: "#dee0ea",
        }}
        className="mb-5 pb-6"
      >
        <Text
          style={{ fontSize: 14 }}
          className="font-medium text-center text-gray-500 mb-4 mt-1"
        >
          Konum
        </Text>

        {/* Map Container */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setIsModalVisible(true);
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
                title={post.ilanBasligi}
                description={`${post.mahalle}, ${post.ilce}`}
              >
                <MapPin size={24} color="#000" />
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
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
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
            {post.mahalle}, {post.ilce}, {post.il}
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
      </View>

      {/* Full Screen Map Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="relative" style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Header */}
          <View
            className="absolute top-0"
            style={{
              backgroundColor: "transparent",
              paddingTop: Platform.OS === "ios" ? 50 : 20,
              paddingHorizontal: 20,
              paddingBottom: 15,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              zIndex: 10,
            }}
          >
            <BlurView
              intensity={50}
              tint="dark"
              className="px-4 py-1.5 rounded-full overflow-hidden"
            >
              <Text style={{ fontSize: 14, color: "#dee0ea", marginTop: 2 }}>
                {post.mahalle}, {post.ilce}, {post.il}
              </Text>
            </BlurView>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <BlurView
                intensity={50}
                tint="dark"
                className="overflow-hidden"
                style={{
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                {" "}
                <X size={20} color="#dee0ea" />
              </BlurView>
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
              title={post.ilanBasligi}
              description={`${post.mahalle}, ${post.ilce}`}
            >
              <MapPin size={32} color="#fff" />
            </Marker>
          </MapView>

          {/* Bottom Action Buttons */}
          <View
            className="bottom-0 w-full"
            style={{
              position: "absolute",
              backgroundColor: "transparent",
              paddingHorizontal: 20,
              paddingVertical: 15,
              paddingBottom: Platform.OS === "ios" ? 35 : 20,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                showMapOptions();
              }}
            >
              <BlurView
                intensity={50}
                tint="dark"
                className="flex flex-row px-5 py-3 overflow-hidden rounded-full items-center bg-black bg-opacity-50"
              >
                <MapPin size={16} color="white" />
                <Text
                  style={{
                    color: "#dee0ea",
                    fontSize: 14,
                    fontWeight: "400",
                    marginLeft: 8,
                  }}
                >
                  {isLoadingDistance
                    ? "Hesaplanıyor..."
                    : travelTime
                    ? `Yol tarifi al (~${formatTravelTime(travelTime)})`
                    : "Yol tarifi al"}
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default LocationSection;
