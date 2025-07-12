import React, { useState } from "react";
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
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import faExternalLink from "@fortawesome/pro-light-svg-icons";
import { faLocationDot } from "@fortawesome/pro-solid-svg-icons";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const LocationSection = ({ post }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      "Hangi harita uygulamasını kullanmak istiyorsunuz?",
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
          onPress={showMapOptions}
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
                <FontAwesomeIcon icon={faLocationDot} size={24} color="#000" />
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
            onPress={(e) => {
              e.stopPropagation();
              setIsModalVisible(true);
            }}
          >
            <FontAwesomeIcon icon={faExternalLink} size={12} color="#4b5563" />
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
        </View>
      </View>

      {/* Full Screen Map Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "white",
              paddingTop: Platform.OS === "ios" ? 50 : 20,
              paddingHorizontal: 20,
              paddingBottom: 15,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 0.5,
              borderBottomColor: "#dee0ea",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#000" }}>
                {post.ilanBasligi}
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
                {post.mahalle}, {post.ilce}, {post.il}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: "#f3f4f6",
              }}
            >
              <FontAwesomeIcon icon={faXmark} size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Full Screen Map */}
          <MapView
            style={{ flex: 1 }}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
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
              <FontAwesomeIcon icon={faLocationDot} size={32} color="#ef4444" />
            </Marker>
          </MapView>

          {/* Bottom Action Buttons */}
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 20,
              paddingVertical: 15,
              paddingBottom: Platform.OS === "ios" ? 35 : 20,
              borderTopWidth: 0.5,
              borderTopColor: "#dee0ea",
            }}
          >
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                setIsModalVisible(false);
                showMapOptions();
              }}
            >
              <FontAwesomeIcon icon={faLocationDot} size={16} color="black" />
              <Text
                style={{
                  color: "black",
                  fontSize: 22,
                  fontWeight: "600",
                  marginLeft: 8,
                }}
              >
                Yol tarifi al
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default LocationSection;
