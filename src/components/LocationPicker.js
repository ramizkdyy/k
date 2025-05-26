import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";

const LocationPicker = ({ onLocationSelect, initialLocation, onClose }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [locationName, setLocationName] = useState("");

  // İstanbul'u varsayılan konum olarak ayarla
  const defaultLocation = {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    getCurrentLocation();

    // Eğer initialLocation varsa, onu seçili konum olarak ayarla
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Konum izni iste
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Konum İzni",
          "Konum izni verilmedi. Varsayılan konum kullanılacak.",
          [{ text: "Tamam" }]
        );
        setCurrentLocation(defaultLocation);
        setLoading(false);
        return;
      }

      // Mevcut konumu al
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setCurrentLocation(currentLoc);

      // Eğer seçili konum yoksa, mevcut konumu kullan
      if (!selectedLocation) {
        setSelectedLocation(currentLoc);
        reverseGeocode(currentLoc.latitude, currentLoc.longitude);
      }
    } catch (error) {
      console.log("Konum alınamadı:", error);
      setCurrentLocation(defaultLocation);
    } finally {
      setLoading(false);
    }
  };

  // Koordinatları adres bilgisine çevir
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const address = [
          result.street,
          result.district,
          result.subregion,
          result.region,
          result.country,
        ]
          .filter(Boolean)
          .join(", ");

        setLocationName(address);
      }
    } catch (error) {
      console.log("Reverse geocode hatası:", error);
    }
  };

  // Harita üzerinde bir yere tıklandığında
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = {
      latitude,
      longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    setSelectedLocation(newLocation);
    reverseGeocode(latitude, longitude);
  };

  // Konumu onayla
  const confirmLocation = () => {
    if (!selectedLocation) {
      Alert.alert("Hata", "Lütfen bir konum seçin.");
      return;
    }

    onLocationSelect({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address: locationName || "Seçilen Konum",
    });
  };

  // Arama yap
  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert("Hata", "Lütfen aranacak konumu girin.");
      return;
    }

    try {
      const results = await Location.geocodeAsync(searchText);

      if (results.length > 0) {
        const result = results[0];
        const newLocation = {
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        setSelectedLocation(newLocation);
        setCurrentLocation(newLocation);
        reverseGeocode(result.latitude, result.longitude);
      } else {
        Alert.alert("Hata", "Konum bulunamadı.");
      }
    } catch (error) {
      console.log("Geocode hatası:", error);
      Alert.alert("Hata", "Konum aranırken bir hata oluştu.");
    }
  };

  // Mevcut konuma git
  const goToCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
      reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Konum yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konum Seç</Text>
        <TouchableOpacity
          onPress={confirmLocation}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmText}>Tamam</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Konum ara (örn: Kadıköy, İstanbul)"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={searchLocation}
        />
        <TouchableOpacity onPress={searchLocation} style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={currentLocation || defaultLocation}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Seçilen Konum"
              description={locationName}
            />
          )}
        </MapView>

        {/* Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={goToCurrentLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Selected Location Info */}
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Seçilen Konum:</Text>
          <Text style={styles.locationText}>
            {locationName || "Konum bilgisi yükleniyor..."}
          </Text>
          <Text style={styles.coordinatesText}>
            {selectedLocation.latitude.toFixed(6)},{" "}
            {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#999",
  },
});

export default LocationPicker;
