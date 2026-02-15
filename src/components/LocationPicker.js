import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  Dimensions,
} from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { MapPin, X } from "lucide-react-native";
import { BlurView } from "expo-blur";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const LocationPicker = ({ onLocationSelect, initialLocation, onClose }) => {
  const [region, setRegion] = useState(null);
  const [centerLocation, setCenterLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [locationName, setLocationName] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // İstanbul'u varsayılan konum olarak ayarla
  const defaultRegion = {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      // İlk olarak varsayılan konumu ayarla
      setRegion(defaultRegion);
      setCenterLocation({
        latitude: defaultRegion.latitude,
        longitude: defaultRegion.longitude,
      });

      // Eğer initialLocation varsa, onu kullan
      if (initialLocation) {
        const initialRegion = {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(initialRegion);
        setCenterLocation({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
        });
        reverseGeocode(initialLocation.latitude, initialLocation.longitude);
        setLoading(false);
        return;
      }

      // Konum izni kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        reverseGeocode(defaultRegion.latitude, defaultRegion.longitude);
        return;
      }

      // Mevcut konumu al (arka planda)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(currentRegion);
      setCenterLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.log("Konum alınamadı:", error);
      // Hata durumunda varsayılan konumu kullan
      reverseGeocode(defaultRegion.latitude, defaultRegion.longitude);
    } finally {
      setLoading(false);
    }
  };

  // Koordinatları adres bilgisine çevir (debounced)
  const reverseGeocode = async (latitude, longitude) => {
    if (isLoadingLocation) return;

    setIsLoadingLocation(true);
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const addressParts = [];

        if (result.street) addressParts.push(result.street);
        if (result.district) addressParts.push(result.district);
        if (result.subregion) addressParts.push(result.subregion);
        if (result.region) addressParts.push(result.region);

        const address = addressParts.join(", ");
        setLocationName(address || "Seçilen Konum");
      }
    } catch (error) {
      console.log("Reverse geocode hatası:", error);
      setLocationName("Konum bilgisi alınamadı");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Harita bölgesi değiştiğinde
  const handleRegionChangeComplete = (newRegion) => {
    if (!isMapReady) return;

    setCenterLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });

    // Debounce reverse geocoding
    setTimeout(() => {
      reverseGeocode(newRegion.latitude, newRegion.longitude);
    }, 300);
  };

  // Konumu onayla
  const confirmLocation = () => {
    if (!centerLocation) {
      Alert.alert("Hata", "Lütfen bir konum seçin.");
      return;
    }

    onLocationSelect({
      latitude: centerLocation.latitude,
      longitude: centerLocation.longitude,
      address: locationName || "Seçilen Konum",
    });
  };

  // Arama yap
  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert("Hata", "Lütfen aranacak konumu girin.");
      return;
    }

    setIsLoadingLocation(true);
    try {
      const results = await Location.geocodeAsync(searchText);

      if (results.length > 0) {
        const result = results[0];
        const newRegion = {
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        setCenterLocation({
          latitude: result.latitude,
          longitude: result.longitude,
        });

        reverseGeocode(result.latitude, result.longitude);
      } else {
        Alert.alert("Hata", "Konum bulunamadı.");
      }
    } catch (error) {
      console.log("Geocode hatası:", error);
      Alert.alert("Hata", "Konum aranırken bir hata oluştu.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Mevcut konuma git
  const goToCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(currentRegion);
      setCenterLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert("Hata", "Mevcut konum alınamadı.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            color: "#666",
          }}
        >
          Konum yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "transparent",
          paddingTop: Platform.OS === "ios" ? 50 : 40,
          paddingHorizontal: 20,
          paddingBottom: 15,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          position: "absolute",
          top: 0,
          width: "100%",
          zIndex: 10,
        }}
      >
        {/* Search Bar - Floating */}
        <View style={{ width: "80%" }}>
          <BlurView className="overflow-hidden rounded-2xl">
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
              }}
            >
              <TextInput
                style={{
                  height: 20,
                  fontSize: 16,
                  color: "#fff",
                }}
                placeholder="Konum ara (örn: Kadıköy, İstanbul)"
                placeholderTextColor="#ccc"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={searchLocation}
              />
              <TouchableOpacity
                onPress={searchLocation}
                disabled={isLoadingLocation}
                style={{ marginLeft: "75%", padding: 8 }}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size={24} color="#fff" />
                ) : (
                  <MaterialIcons name="search" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        <TouchableOpacity onPress={onClose}>
          <BlurView
            className="overflow-hidden"
            style={{
              padding: 8,
              borderRadius: 20,
            }}
          >
            <X size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Full Screen Map */}
      <MapView
        style={{ flex: 1 }}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => setIsMapReady(true)}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
        loadingEnabled={true}
        loadingIndicatorColor="#4A90E2"
        loadingBackgroundColor="#f0f0f0"
      />

      {/* Center Marker - Fixed in screen center */}
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: -16, // Half of marker width
          marginTop: -32, // Full marker height to point at bottom
          zIndex: 5,
        }}
      >
        <MapPin size={32} color="#fff" fill="#fff" />
      </View>

      {/* Crosshair/Guide (optional) */}
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 20,
          height: 20,
          marginLeft: -10,
          marginTop: -10,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: "#fff",
          backgroundColor: "rgba(74, 144, 226, 0.2)",
          zIndex: 4,
        }}
      />

      {/* Bottom Info Panel */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          backgroundColor: "transparent",
          paddingHorizontal: 20,
          paddingVertical: 15,
          paddingBottom: Platform.OS === "ios" ? 35 : 20,
          zIndex: 5,
        }}
      >
        <BlurView className="overflow-hidden rounded-2xl">
          <View style={{ padding: 16 }}>
            {/* Selected Location Info */}
            {centerLocation && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#fff",
                    marginBottom: 4,
                  }}
                >
                  Seçilen Konum:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#ccc",
                    marginBottom: 4,
                    minHeight: 20,
                  }}
                >
                  {isLoadingLocation
                    ? "Konum bilgisi yükleniyor..."
                    : locationName || "Konum bilgisi alınamadı"}
                </Text>
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#fff",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                alignItems: "center",
                opacity: centerLocation ? 1 : 0.6,
              }}
              onPress={confirmLocation}
              disabled={!centerLocation}
            >
              <Text
                style={{
                  color: "#000",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Konumu Seç
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
};

export default LocationPicker;
