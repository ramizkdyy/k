import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageCircle,
  Handshake,
  Users,
  Shield,
  EyeOff,
  MapPin,
  Globe,
  FileText,
  Info,
  Lock,
  Trash2,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { selectUserRole } from "../redux/slices/authSlice";

const SettingsScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);

  // Bildirim ayarları
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);

  // Gizlilik ayarları
  const [profileVisible, setProfileVisible] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

  const renderSectionHeader = (title) => (
    <Text
      className="mt-8 mb-3 text-gray-900"
      style={{ fontSize: 20, fontWeight: "600" }}
    >
      {title}
    </Text>
  );

  const renderNavRow = (icon, label, onPress, sublabel) => (
    <TouchableOpacity
      className="py-4 flex-row justify-between items-center border-b border-gray-100"
      activeOpacity={0.6}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <View>
          <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
            {label}
          </Text>
          {sublabel ? (
            <Text style={{ fontSize: 12 }} className="text-gray-400 mt-0.5">
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={15} color="#cfcfcf" />
    </TouchableOpacity>
  );

  const renderToggleRow = (icon, label, value, onValueChange, sublabel) => (
    <View className="py-4 flex-row justify-between items-center border-b border-gray-100">
      <View className="flex-row items-center gap-4 flex-1 mr-4">
        {icon}
        <View className="flex-1">
          <Text style={{ fontSize: 16 }} className="text-gray-900 font-medium">
            {label}
          </Text>
          {sublabel ? (
            <Text style={{ fontSize: 12 }} className="text-gray-400 mt-0.5">
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e5e7eb", true: "#111827" }}
        thumbColor="#ffffff"
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {},
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-2 border-b border-gray-100"
        style={{ minHeight: 44 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <ChevronLeft size={24} color="black" />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 17, fontWeight: "600" }}
          className="text-gray-900 ml-2"
        >
          Ayarlar
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Bildirimler */}
        {renderSectionHeader("Bildirimler")}
        <View>
          {renderToggleRow(
            <MessageCircle size={22} color="black" />,
            "Mesajlar",
            notifMessages,
            setNotifMessages,
            "Yeni mesaj bildirimlerini al"
          )}
          {renderToggleRow(
            <Handshake size={22} color="black" />,
            "Teklifler",
            notifOffers,
            setNotifOffers,
            "Yeni teklif bildirimlerini al"
          )}
          {renderToggleRow(
            <Users size={22} color="black" />,
            userRole === "EVSAHIBI" ? "Yeni Eşleşmeler" : "Yeni İlanlar",
            notifMatches,
            setNotifMatches,
            userRole === "EVSAHIBI"
              ? "Uyumlu kiracı bildirimleri"
              : "Uyumlu ilan bildirimleri"
          )}
        </View>

        {/* Gizlilik */}
        {renderSectionHeader("Gizlilik")}
        <View>
          {renderToggleRow(
            <EyeOff size={22} color="black" />,
            "Profilimi Göster",
            profileVisible,
            setProfileVisible,
            "Diğer kullanıcılar profilini görebilir"
          )}
          {renderToggleRow(
            <MapPin size={22} color="black" />,
            "Konum Bilgisini Göster",
            showLocation,
            setShowLocation,
            "İlçe bazlı konum paylaşımı"
          )}
          {renderNavRow(
            <Shield size={22} color="black" />,
            "Engellenen Kullanıcılar",
            () => {},
          )}
        </View>

        {/* Uygulama */}
        {renderSectionHeader("Uygulama")}
        <View>
          {renderNavRow(
            <Globe size={22} color="black" />,
            "Dil",
            () => {},
            "Türkçe"
          )}
          {renderNavRow(
            <FileText size={22} color="black" />,
            "Kullanım Koşulları",
            () => {},
          )}
          {renderNavRow(
            <Lock size={22} color="black" />,
            "Gizlilik Politikası",
            () => {},
          )}
          {renderNavRow(
            <Info size={22} color="black" />,
            "Hakkımızda",
            () => {},
            "Sürüm 1.0.0"
          )}
        </View>

        {/* Tehlike Bölgesi */}
        {renderSectionHeader("Hesap")}
        <View>
          <TouchableOpacity
            className="py-4 flex-row items-center gap-4"
            activeOpacity={0.6}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={22} color="#ef4444" />
            <Text style={{ fontSize: 16 }} className="text-red-500 font-medium">
              Hesabı Sil
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
