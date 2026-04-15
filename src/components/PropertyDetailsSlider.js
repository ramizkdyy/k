/**
 * PropertyDetailsSlider - Mülk detay kaydırıcısı
 * 
 * Daha önce AllNearbyPropertiesScreen.js, AllSimilarPropertiesScreen.js ve PostsScreen.js
 * dosyalarında neredeyse identik şekilde tekrarlanıyordu. Tek bir kaynak haline getirildi.
 */
import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import {
  BedDouble,
  BedSingle,
  Bath,
  Ruler,
  Building,
  Calendar,
  Banknote,
  Coins,
  ShowerHead,
} from "lucide-react-native";
import { getCurrencyText } from "../utils/formatters";

const PropertyDetailsSlider = React.memo(({ item }) => {
  const propertyDetails = useMemo(
    () => [
      {
        id: "rooms",
        Icon: BedDouble,
        value: item.odaSayisi || "-",
        label: "Oda",
      },
      {
        id: "bedrooms",
        Icon: BedSingle,
        value: item.yatakOdasiSayisi || "-",
        label: "Y.Odası",
      },
      {
        id: "bathrooms",
        Icon: ShowerHead,
        value: item.banyoSayisi || "-",
        label: "Banyo",
      },
      {
        id: "area",
        Icon: Ruler,
        value: item.brutMetreKare ? `${item.brutMetreKare} m²` : "-",
        label: "Alan",
      },
      {
        id: "floor",
        Icon: Building,
        value: item.bulunduguKat || "-",
        label: "Kat",
      },
      {
        id: "age",
        Icon: Calendar,
        value: item.binaYasi ? `${item.binaYasi}` : "-",
        label: "Bina yaşı",
      },
      {
        id: "dues",
        Icon: Banknote,
        value: item.aidat ? `${item.aidat}₺` : "Yok",
        label: "Aidat",
      },
      {
        id: "deposit",
        Icon: Coins,
        value: item.depozito
          ? `${item.depozito}${getCurrencyText(item.paraBirimi)}`
          : "Yok",
        label: "Depozito",
      },
    ],
    [item]
  );

  return (
    <View className="mt-3">
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces={true}
      >
        {propertyDetails.map((detail, index) => (
          <View
            key={`${detail.id}-${index}`}
            className="items-center justify-center rounded-2xl"
            style={{
              width: "fit-content",
              marginRight: 46,
              marginLeft: 3,
              height: 85,
            }}
          >
            <detail.Icon size={30} color="#000" />
            <Text
              style={{ fontSize: 16, fontWeight: 600 }}
              className="text-gray-800 mt-2 text-center"
              numberOfLines={1}
            >
              {detail.value}
            </Text>
            <Text
              style={{ fontSize: 11 }}
              className="text-gray-500 text-center"
              numberOfLines={1}
            >
              {detail.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

export default PropertyDetailsSlider;
