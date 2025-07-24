import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Switch,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import {
  savePostFormData,
  clearPostFormData,
  selectPostFormData,
  updatePostImageStatus,
} from "../redux/slices/postSlice";
import { useCreatePostMutation } from "../redux/api/apiSlice";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faChevronLeft,
  faChevronDown,
  faCheck,
  faXmark,
  faLocationDot,
} from "@fortawesome/pro-solid-svg-icons";
import LocationPicker from "../components/LocationPicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Enum mapping functions
const mapRentalPeriodToEnum = (value) => {
  const mapping = {
    "6 Ay": 1,
    "1 Yıl": 2,
    "Uzun Vadeli (1+ Yıl)": 3,
    "Kısa Dönem Olabilir": 4,
  };
  return mapping[value] || 1;
};

const mapPropertyTypeToEnum = (value) => {
  const mapping = {
    Daire: 1,
    "Müstakil Ev": 2,
    Villa: 3,
    "Stüdyo Daire": 4,
    Rezidans: 5,
    Diğer: 6,
  };
  return mapping[value] || 1;
};

const mapHeatingTypeToEnum = (value) => {
  const mapping = {
    "Doğalgaz Kombi": 1,
    "Merkezi Sistem": 2,
    "Elektrikli Isıtma": 3,
    Soba: 4,
    "Fark Etmez": 5,
  };
  return mapping[value] || 1;
};

const mapPetPolicyToEnum = (value) => {
  const mapping = {
    "Evet, Kabul Ediyorum": 1,
    "Hayır, Kabul Etmiyorum": 2,
    "Sadece Küçük Hayvan": 3,
  };
  return mapping[value] || 2;
};

const mapStudentPolicyToEnum = (value) => {
  const mapping = {
    "Evet, Kabul Ediyorum": 1,
    "Hayır, Kabul Etmiyorum": 2,
    "Referanslı Öğrenci Olabilir": 3,
  };
  return mapping[value] || 2;
};

const mapSmokingPolicyToEnum = (value) => {
  const mapping = {
    "Evet, İzin Veriyorum": 1,
    "Hayır, İzin Vermiyorum": 2,
    "Sadece Balkonda İçilebilir": 3,
  };
  return mapping[value] || 2;
};

const mapPaymentMethodToEnum = (value) => {
  const mapping = {
    "Banka Havalesi": 1,
    "Nakit Ödeme": 2,
    Çek: 3,
    "Fark Etmez": 4,
  };
  return mapping[value] || 1;
};

const mapCurrencyTypeToEnum = (value) => {
  const mapping = {
    TL: 1,
    USD: 2,
    EUR: 3,
    GBP: 4,
  };
  return mapping[value] || 1;
};

// NEW: MaintenanceFeeResponsibility enum mapping
const mapMaintenanceFeeResponsibilityToEnum = (value) => {
  const mapping = {
    "Kiracıya Ait": 1,
    "Ev Sahibine Ait": 2,
    "Ortak Ödeme": 3,
  };
  return mapping[value] || 1;
};

// Header component matching ProfileExpectationScreen
const CreatePostHeader = ({
  navigation,
  onSubmit,
  isLoading,
  propertyData,
}) => (
  <View style={{ paddingVertical: 12 }} className="px-3 relative bg-white">
    <View className="flex-row justify-between ml-2 items-center w-full">
      {/* Sol taraf - Geri butonu */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="flex-row items-center"
      >
        <FontAwesomeIcon icon={faChevronLeft} size={22} color="#0d0d0d" />
      </TouchableOpacity>

      {/* Sağ taraf - Submit butonu */}
      <TouchableOpacity
        className="px-1 items-center justify-center"
        onPress={onSubmit}
        disabled={isLoading}
      >
        <Text
          style={{ fontSize: 16, color: "#6aeba9", borderColor: "#6aeba9" }}
          className="font-semibold border px-4 py-2 rounded-full"
        >
          {isLoading
            ? propertyData
              ? "Güncelleniyor..."
              : "Oluşturuluyor..."
            : propertyData
              ? "Güncelle"
              : "Oluştur"}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Ortalanmış başlık */}
    <View className="absolute inset-0 justify-center items-center pointer-events-none">
      <Text
        className="text-gray-500"
        style={{
          fontWeight: 500,
          fontSize: 16,
        }}
      >
        {propertyData ? "İlanı Düzenle" : "Yeni İlan"}
      </Text>
    </View>
  </View>
);

// Form section component matching ProfileExpectationScreen
const FormSection = ({ title, children }) => (
  <View className="mb-8">
    <Text
      style={{ fontSize: 12, marginBottom: 50 }}
      className="font-semibold text-gray-500 text-center"
    >
      {title}
    </Text>
    {children}
  </View>
);

// Custom TextInput Component matching ProfileExpectationScreen
const CustomTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
}) => (
  <View className="mb-6">
    <Text style={{ fontSize: 14 }} className="font-semibold text-gray-900 mb-3">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <View className="border border-gray-900 rounded-xl px-4 py-4">
      <TextInput
        className="text-gray-900 text-base"
        placeholder={placeholder}
        placeholderTextColor="#b0b0b0"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
        style={{ fontSize: 16 }}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  </View>
);

// Switch field component matching ProfileExpectationScreen
const SwitchField = ({ label, value, setValue, description = null }) => (
  <View className="mb-6">
    <View className="flex-row justify-between items-center">
      <View className="flex-1 mr-4">
        <Text style={{ fontSize: 14 }} className="text-gray-900 font-semibold">
          {label}
        </Text>
        {description && (
          <Text className="text-sm text-gray-500 mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: "#e5e7eb", true: "#97e8bc" }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    </View>
  </View>
);

const CustomDropdown = ({
  label,
  value,
  setValue,
  options,
  placeholder,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Modal boyutları - Seçenek sayısına göre dinamik yükseklik
  const getModalHeight = () => {
    const headerHeight = 80; // Header + handle
    const itemHeight = 50; // Her seçenek için yaklaşık yükseklik
    const bottomPadding = 40; // Alt boşluk
    const minHeight = SCREEN_HEIGHT * 0.25; // Minimum %25
    const maxHeight = SCREEN_HEIGHT * 0.6; // Maximum %60

    const calculatedHeight = headerHeight + (options.length * itemHeight) + bottomPadding;

    // Az seçenek varsa (3 veya daha az) küçük modal
    if (options.length <= 3) {
      return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.35);
    }

    // Orta seçenek sayısı (4-7) için orta boyut
    if (options.length <= 7) {
      return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.55);
    }

    // Çok seçenek varsa maksimum boyut
    return maxHeight;
  };

  const SNAP_POINTS = {
    CLOSED: SCREEN_HEIGHT,
    OPEN: SCREEN_HEIGHT - getModalHeight(),
  };

  // Animated values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Modal açılış/kapanış animasyonu
  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(SNAP_POINTS.OPEN, {
        damping: 80,
        stiffness: 400,
      });
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
    } else if (isOpen === false && translateY.value !== SCREEN_HEIGHT) {
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 80,
        stiffness: 400,
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isOpen]);

  // Close handler
  const handleClose = () => {
    translateY.value = withSpring(SCREEN_HEIGHT, {
      damping: 80,
      stiffness: 400,
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => setIsOpen(false), 300);
  };

  // Option select handler
  const handleOptionSelect = (option) => {
    setValue(option);
    handleClose();
  };

  // Backdrop press handler
  const handleBackdropPress = () => {
    handleClose();
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className="mb-6">
      <Text
        style={{ fontSize: 14 }}
        className="text-gray-900 font-semibold mb-3"
      >
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>

      <TouchableOpacity
        className="border border-gray-900 rounded-xl px-4 py-4 flex-row justify-between items-center"
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={value ? "text-gray-900" : "text-gray-500"}
          style={{ fontSize: 16 }}
        >
          {value || placeholder}
        </Text>
        <FontAwesomeIcon icon={faChevronDown} size={16} color="#6b7280" />
      </TouchableOpacity>

      {/* Modal */}
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={handleClose}
        >
          <GestureHandlerRootView style={styles.container}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
              <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <View style={styles.backdropTouchable} />
              </TouchableWithoutFeedback>
            </Animated.View>

            {/* Modal Content */}
            <Animated.View style={[styles.modal, modalStyle]}>
              {/* Header */}
              <View className="py-4 px-6 border-b border-gray-100 bg-white">
                <View className="flex-row justify-between items-center">
                  <Text
                    style={{ fontWeight: 600, fontSize: 18 }}
                    className="text-gray-800"
                  >
                    {label}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    className="px-2 py-2"
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: "#007AFF",
                        fontWeight: "500",
                      }}
                    >
                      Kapat
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable Options */}
              <ScrollView
                className="flex-1"
                style={{
                  backgroundColor: 'white',
                  maxHeight: options.length <= 3 ? undefined : SCREEN_HEIGHT * 0.5
                }}
                showsVerticalScrollIndicator={options.length > 5}
                bounces={options.length > 3}
                scrollEnabled={options.length > 3}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: options.length <= 3 ? 5 : 15,
                  justifyContent: options.length <= 3 ? 'flex-start' : 'flex-start',
                  flexGrow: 0
                }}
              >
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`py-4 px-7 flex-row items-center justify-between ${index !== options.length - 1 ? "border-b border-gray-50" : ""
                      } ${value === option ? "bg-gray-100" : "bg-white"}`}
                    onPress={() => handleOptionSelect(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-lg flex-1 mr-3 ${value === option
                        ? "text-gray-900 font-medium"
                        : "text-gray-600"
                        }`}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {option}
                    </Text>
                    {value === option && (
                      <FontAwesomeIcon icon={faCheck} size={16} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Bottom spacing for many options */}
                {options.length > 7 && <View className="h-2" />}
              </ScrollView>
            </Animated.View>
          </GestureHandlerRootView>
        </Modal>
      )}
    </View>
  );
};

const CreatePostScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const savedFormData = useSelector(selectPostFormData);
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const insets = useSafeAreaInsets();

  // Get property data from route params if exists (for editing)
  const propertyData = route.params?.propertyData;

  // Form state - Temel Bilgiler
  const [ilanBasligi, setIlanBasligi] = useState("");
  const [kiraFiyati, setKiraFiyati] = useState("");
  const [depozito, setDepozito] = useState("");
  const [RentalPeriod, setRentalPeriod] = useState("");
  const [paraBirimi, setParaBirimi] = useState("TL");
  const [paymentMethod, setPaymentMethod] = useState("");

  // NEW: MaintenanceFeeResponsibility state
  const [maintenanceFeeResponsibility, setMaintenanceFeeResponsibility] =
    useState("");

  // Konum Bilgileri
  const [location, setLocation] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [mahalle, setMahalle] = useState("");
  const [siteAdi, setSiteAdi] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  // Emlak Özellikleri
  const [postDescription, setPostDescription] = useState("");
  const [odaSayisi, setOdaSayisi] = useState("");
  const [banyoSayisi, setBanyoSayisi] = useState("");
  const [yatakOdasiSayisi, setYatakOdasiSayisi] = useState(""); // YENİ ALAN
  const [brutMetreKare, setBrutMetreKare] = useState("");
  const [netMetreKare, setNetMetreKare] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [isitmaTipi, setIsitmaTipi] = useState("");
  const [kullanimDurumu, setKullanimDurumu] = useState("");
  const [kimden, setKimden] = useState("Sahibinden");
  const [mutfak, setMutfak] = useState("");

  // Bina Bilgileri
  const [binaYasi, setBinaYasi] = useState("");
  const [bulunduguKat, setBulunduguKat] = useState(""); // YENİ ALAN
  const [toplamKat, setToplamKat] = useState("");
  const [aidat, setAidat] = useState("");
  const [minimumKiralamaSuresi, setMinimumKiralamaSuresi] = useState("");

  // Boolean Özellikler
  const [balkon, setBalkon] = useState(false);
  const [asansor, setAsansor] = useState(false);
  const [otopark, setOtopark] = useState(false);
  const [esyali, setEsyali] = useState(false);
  const [siteIcerisinde, setSiteIcerisinde] = useState(false);
  const [takas, setTakas] = useState(false);

  // Yeni Politika Alanları
  const [petPolicy, setPetPolicy] = useState("");
  const [studentPolicy, setStudentPolicy] = useState("");
  const [smokingPolicy, setSmokingPolicy] = useState("");

  // Diğer
  const [images, setImages] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Property type options
  const propertyTypes = [
    "Daire",
    "Müstakil Ev",
    "Villa",
    "Stüdyo Daire",
    "Rezidans",
    "Diğer",
  ];

  // Heating type options
  const heatingTypes = [
    "Doğalgaz Kombi",
    "Merkezi Sistem",
    "Elektrikli Isıtma",
    "Soba",
    "Fark Etmez",
  ];

  // Usage status options
  const usageStatusOptions = ["Boş", "Kiracılı", "Mülk Sahibi Oturuyor"];

  // Rental Period options
  const rentalPeriodOptions = [
    "6 Ay",
    "1 Yıl",
    "Uzun Vadeli (1+ Yıl)",
    "Kısa Dönem Olabilir",
  ];

  // Currency options
  const currencyOptions = ["TL", "USD", "EUR", "GBP"];

  // Payment method options
  const paymentMethodOptions = [
    "Banka Havalesi",
    "Nakit Ödeme",
    "Çek",
    "Fark Etmez",
  ];

  // Pet policy options
  const petPolicyOptions = [
    "Evet, Kabul Ediyorum",
    "Hayır, Kabul Etmiyorum",
    "Sadece Küçük Hayvan",
  ];

  // Student policy options
  const studentPolicyOptions = [
    "Evet, Kabul Ediyorum",
    "Hayır, Kabul Etmiyorum",
    "Referanslı Öğrenci Olabilir",
  ];

  // Smoking policy options
  const smokingPolicyOptions = [
    "Evet, İzin Veriyorum",
    "Hayır, İzin Vermiyorum",
    "Sadece Balkonda İçilebilir",
  ];

  // NEW: MaintenanceFeeResponsibility options
  const maintenanceFeeResponsibilityOptions = [
    "Kiracıya Ait",
    "Ev Sahibine Ait",
    "Ortak Ödeme",
  ];

  // Parse location string to extract il, ilce, and mahalle if available
  const parseLocation = (locationString) => {
    if (!locationString) return;

    // Try to extract components from a string like "Kadıköy, İstanbul"
    const parts = locationString.split(",").map((part) => part.trim());

    if (parts.length >= 2) {
      setIl(parts[parts.length - 1]); // Son kısım genellikle il
      setIlce(parts[0]); // İlk kısım genellikle ilçe

      // Eğer 3 parça varsa, ortadaki mahalle olabilir
      if (parts.length >= 3) {
        setMahalle(parts[1]);
      }
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (locationData) => {
    setSelectedCoordinates({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
    setLocation(locationData.address);
    parseLocation(locationData.address);
    setShowLocationPicker(false);
  };

  // Numeric validation function
  const validateNumericFields = () => {
    const numericFields = [
      { value: kiraFiyati, name: "Kira Tutarı", required: true },
      { value: depozito, name: "Depozito", required: false },
      { value: banyoSayisi, name: "Banyo Sayısı", required: false },
      { value: yatakOdasiSayisi, name: "Yatak Odası Sayısı", required: false },
      { value: brutMetreKare, name: "Brüt Metrekare", required: false },
      { value: netMetreKare, name: "Net Metrekare", required: false },
      { value: binaYasi, name: "Bina Yaşı", required: false },
      { value: bulunduguKat, name: "Bulunduğu Kat", required: false },
      { value: toplamKat, name: "Toplam Kat", required: false },
      { value: aidat, name: "Aidat", required: false },
      {
        value: minimumKiralamaSuresi,
        name: "Minimum Kiralama Süresi",
        required: false,
      },
    ];

    for (const field of numericFields) {
      if (field.value && field.value.trim() !== "") {
        const numValue = Number(field.value);
        if (isNaN(numValue) || numValue < 0) {
          Alert.alert(
            "Hata",
            `${field.name} geçerli bir pozitif sayı olmalıdır.`
          );
          return false;
        }
      } else if (field.required) {
        Alert.alert("Hata", `${field.name} zorunludur.`);
        return false;
      }
    }
    return true;
  };

  // Initialize form with property data if editing
  useEffect(() => {
    if (propertyData) {
      setIlanBasligi(propertyData.ilanBasligi || "");
      setKiraFiyati(propertyData.kiraFiyati?.toString() || "");
      setLocation(`${propertyData.ilce}, ${propertyData.il}` || "");
      setPostDescription(propertyData.postDescription || "");
      setOdaSayisi(propertyData.odaSayisi || "");
      setBanyoSayisi(propertyData.banyoSayisi?.toString() || "");
      setYatakOdasiSayisi(propertyData.yatakOdasiSayisi?.toString() || "");
      setBrutMetreKare(propertyData.brutMetreKare?.toString() || "");
      setNetMetreKare(propertyData.netMetreKare?.toString() || "");
      setIsitmaTipi(propertyData.isitmaTipi || "");
      setDepozito(propertyData.depozito?.toString() || "");
      setBinaYasi(propertyData.binaYasi?.toString() || "");
      setBulunduguKat(propertyData.bulunduguKat?.toString() || "");
      setToplamKat(propertyData.toplamKat?.toString() || "");
      setBalkon(propertyData.balkon === "true" || false);
      setAsansor(propertyData.asansor === "true" || false);
      setOtopark(propertyData.otopark === "true" || false);
      setEsyali(propertyData.esyali === "true" || false);
      setSiteIcerisinde(propertyData.siteIcerisinde === "true" || false);
      setAidat(propertyData.aidat?.toString() || "");
      setTakas(propertyData.takas === "true" || false);
      setMinimumKiralamaSuresi(
        propertyData.minimumKiralamaSuresi?.toString() || ""
      );
      setRentalPeriod(propertyData.rentalPeriod?.toString() || "");
      setIl(propertyData.il || "");
      setIlce(propertyData.ilce || "");
      setKimden(propertyData.kimden || "Sahibinden");
      setMutfak(propertyData.mutfak || "");
      setMahalle(propertyData.mahalle || "");
      setSiteAdi(propertyData.siteAdi || "");
      setParaBirimi(propertyData.paraBirimi || "TL");
      setKullanimDurumu(propertyData.kullanimDurumu || "");

      // Set coordinates if available
      if (propertyData.latitude && propertyData.longitude) {
        setSelectedCoordinates({
          latitude: parseFloat(propertyData.latitude),
          longitude: parseFloat(propertyData.longitude),
        });
      }

      // Handle images if available
      if (propertyData.postImages && propertyData.postImages.length > 0) {
        const formattedImages = propertyData.postImages.map((img, index) => ({
          uri: img.postImageUrl,
          id: `existing_${index}`,
        }));
        setImages(formattedImages);
      }
    }
    // If no property data but saved form data exists, load that instead
    else if (savedFormData) {
      setIlanBasligi(savedFormData.ilanBasligi || "");
      setKiraFiyati(savedFormData.kiraFiyati || "");
      setLocation(savedFormData.location || "");
      setPostDescription(savedFormData.postDescription || "");
      setOdaSayisi(savedFormData.odaSayisi || "");
      setBanyoSayisi(savedFormData.banyoSayisi || "");
      setYatakOdasiSayisi(savedFormData.yatakOdasiSayisi || "");
      setBrutMetreKare(savedFormData.brutMetreKare || "");
      setNetMetreKare(savedFormData.netMetreKare || "");
      setImages(savedFormData.images || []);
      setPropertyType(savedFormData.propertyType || "");
      setIsitmaTipi(savedFormData.isitmaTipi || "");
      setDepozito(savedFormData.depozito || "");
      setRentalPeriod(savedFormData.rentalPeriod || "");

      // Load saved data for new fields if available
      setIl(savedFormData.il || "");
      setIlce(savedFormData.ilce || "");
      setKimden(savedFormData.kimden || "Sahibinden");
      setMutfak(savedFormData.mutfak || "");
      setMahalle(savedFormData.mahalle || "");
      setSiteAdi(savedFormData.siteAdi || "");
      setParaBirimi(savedFormData.paraBirimi || "TL");
      setKullanimDurumu(savedFormData.kullanimDurumu || "");
      setBulunduguKat(savedFormData.bulunduguKat || "");

      // Load coordinates if available
      if (savedFormData.latitude && savedFormData.longitude) {
        setSelectedCoordinates({
          latitude: savedFormData.latitude,
          longitude: savedFormData.longitude,
        });
      }

      // Parse location if il and ilce are not already set
      if (
        savedFormData.location &&
        (!savedFormData.il || !savedFormData.ilce)
      ) {
        parseLocation(savedFormData.location);
      }
    }
  }, [propertyData, savedFormData]);

  // Request camera/gallery permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== "granted") {
          Alert.alert(
            "Kamera İzni Gerekli",
            "Fotoğraf çekmek için kamera izni vermeniz gerekmektedir."
          );
        }

        const { status: galleryStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus !== "granted") {
          Alert.alert(
            "Galeri İzni Gerekli",
            "Galeriden fotoğraf seçmek için izin vermeniz gerekmektedir."
          );
        }
      }
    })();
  }, []);

  // Extract location components when location is updated
  useEffect(() => {
    parseLocation(location);
  }, [location]);

  // Pick image from camera or gallery
  const pickImage = async (useCamera = false) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        orderedSelection: true,
        selectionLimit: 10,
      };

      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          ...options,
          allowsMultipleSelection: false,
          allowsEditing: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          id: `${Date.now()}_${index}`,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
        }));

        const totalImages = images.length + newImages.length;
        const maxImages = 15;

        if (totalImages > maxImages) {
          Alert.alert(
            "Fotoğraf Limiti",
            `En fazla ${maxImages} fotoğraf ekleyebilirsiniz. ${newImages.length
            } fotoğraf seçtiniz, ancak sadece ${maxImages - images.length
            } tanesi eklenecek.`
          );
          const allowedImages = newImages.slice(0, maxImages - images.length);
          setImages([...images, ...allowedImages]);
        } else {
          setImages([...images, ...newImages]);
          Alert.alert(
            "Başarılı",
            `${newImages.length} fotoğraf başarıyla eklendi.`
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Hata",
        "Fotoğraf seçme sırasında bir hata oluştu: " + error.message
      );
    }
  };

  // Remove selected image
  const removeImage = (id) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const renderImageGallery = () => {
    return (
      <FormSection title="Fotoğraflar">
        <View className="mb-6">
          <Text
            style={{ fontSize: 14 }}
            className="font-semibold text-gray-900 mb-3"
          >
            Fotoğraflar ({images.length}
            /15) <Text className="text-red-500">*</Text>
          </Text>

          {/* Seçilen Fotoğraflar */}
          {images.length > 0 && (
            <>
              <ScrollView
                horizontal
                bounces={true}
                showsHorizontalScrollIndicator={false}
                className="mb-4 p-2"
              >
                {images.map((img, index) => (
                  <View
                    style={{ boxShadow: "0px 0px 12px #00000014" }}
                    key={img.id}
                    className="mr-3 relative rounded-2xl"
                  >
                    <Image
                      source={{ uri: img.uri }}
                      className="w-24 h-24 rounded-2xl"
                      resizeMode="cover"
                    />

                    {/* Silme butonu */}
                    <View className="absolute top-1 right-1">
                      <BlurView
                        intensity={50}
                        tint="dark"
                        className="overflow-hidden rounded-full"
                      >
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => removeImage(img.id)}
                        >
                          <FontAwesomeIcon icon={faXmark} color="white" />
                        </TouchableOpacity>
                      </BlurView>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* Fotoğraf Ekleme Butonları */}
          <View className="flex-row justify-center mb-4">
            <TouchableOpacity
              style={{ paddingVertical: 30 }}
              className="flex-1 border border-gray-900 rounded-3xl mr-2 justify-center items-center"
              onPress={() => pickImage(false)}
              disabled={images.length >= 15}
            >
              <MaterialIcons name="photo-library" size={28} color="#000" />
              <Text className="font-medium mt-1">Galeriden Seç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 border border-gray-900 rounded-3xl py-4 ml-2 justify-center items-center"
              onPress={() => pickImage(true)}
              disabled={images.length >= 15}
            >
              <MaterialIcons name="camera-alt" size={28} color="#000" />
              <Text className=" font-medium mt-1">Kamera</Text>
            </TouchableOpacity>
          </View>

          {/* Fotoğraf ipuçları */}
          <View className="">
            <Text className="text-gray-500 text-sm">
              • Galeriden birden fazla fotoğraf seçebilirsiniz{"\n"}• En az 1,
              en fazla 15 fotoğraf ekleyebilirsiniz{"\n"}• Farklı açılardan
              çekilmiş net fotoğraflar kullanın{"\n"}• Fotoğraflar otomatik
              olarak sıkıştırılır
            </Text>
          </View>
        </View>
      </FormSection>
    );
  };

  // Form validation
  const validateForm = () => {
    // Temel zorunlu alanlar
    if (!ilanBasligi.trim()) {
      Alert.alert("Hata", "Lütfen ilan başlığı giriniz.");
      return false;
    }
    if (!kiraFiyati.trim()) {
      Alert.alert("Hata", "Lütfen kira tutarı giriniz.");
      return false;
    }
    if (!location.trim()) {
      Alert.alert("Hata", "Lütfen konum bilgisi giriniz.");
      return false;
    }
    if (!postDescription.trim()) {
      Alert.alert("Hata", "Lütfen ilan açıklaması giriniz.");
      return false;
    }
    if (!il.trim()) {
      Alert.alert("Hata", "Lütfen il bilgisi giriniz.");
      return false;
    }
    if (!ilce.trim()) {
      Alert.alert("Hata", "Lütfen ilçe bilgisi giriniz.");
      return false;
    }
    if (!mahalle.trim()) {
      Alert.alert("Hata", "Lütfen mahalle bilgisi giriniz.");
      return false;
    }
    if (!mutfak.trim()) {
      Alert.alert("Hata", "Lütfen mutfak bilgisi giriniz.");
      return false;
    }
    if (!siteAdi.trim()) {
      Alert.alert("Hata", "Lütfen site adı giriniz.");
      return false;
    }
    if (!odaSayisi.trim()) {
      Alert.alert("Hata", "Lütfen oda sayısı giriniz.");
      return false;
    }
    if (!kullanimDurumu.trim()) {
      Alert.alert("Hata", "Lütfen kullanım durumu seçiniz.");
      return false;
    }
    if (!RentalPeriod.trim()) {
      Alert.alert("Hata", "Lütfen kiralama süresi seçiniz.");
      return false;
    }
    if (!isitmaTipi.trim()) {
      Alert.alert("Hata", "Lütfen ısıtma tipi seçiniz.");
      return false;
    }

    // Numeric validation
    if (!validateNumericFields()) {
      return false;
    }

    // Fotoğraf kontrolü
    if (images.length === 0) {
      Alert.alert("Hata", "Lütfen en az bir fotoğraf ekleyiniz.");
      return false;
    }

    if (images.length > 15) {
      Alert.alert("Hata", "En fazla 15 fotoğraf ekleyebilirsiniz.");
      return false;
    }

    const oversizedImages = images.filter(
      (img) => img.fileSize && img.fileSize > 10 * 1024 * 1024
    );

    if (oversizedImages.length > 0) {
      Alert.alert(
        "Dosya Boyutu Hatası",
        "Bazı fotoğraflar çok büyük (>10MB). Lütfen daha küçük fotoğraflar seçin."
      );
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setUploadStatus("uploading");

      // Prepare form data
      const formData = new FormData();
      formData.append("UserId", currentUser.id);
      formData.append("PostDescription", postDescription);
      formData.append("IlanBasligi", ilanBasligi);
      formData.append("KiraFiyati", kiraFiyati);
      formData.append("Location", location);

      // Add coordinates if available
      if (selectedCoordinates) {
        formData.append(
          "PostLatitude",
          selectedCoordinates.latitude.toString()
        );
        formData.append(
          "PostLongitude",
          selectedCoordinates.longitude.toString()
        );
      }

      // Required fields
      formData.append("Il", il);
      formData.append("Ilce", ilce);
      formData.append("Kimden", kimden);
      formData.append("Mutfak", mutfak);
      formData.append("Mahalle", mahalle);
      formData.append("SiteAdi", siteAdi);
      formData.append("OdaSayisi", odaSayisi);
      formData.append("KullanimDurumu", kullanimDurumu);

      // Enum mappings
      formData.append("RentalPeriod", mapRentalPeriodToEnum(RentalPeriod));
      formData.append("ParaBirimi", mapCurrencyTypeToEnum(paraBirimi));
      formData.append("IsitmaTipi", mapHeatingTypeToEnum(isitmaTipi));

      // NEW: Add MaintenanceFeeResponsibility if selected
      if (maintenanceFeeResponsibility) {
        formData.append(
          "MaintenanceFeeResponsibility",
          mapMaintenanceFeeResponsibilityToEnum(maintenanceFeeResponsibility)
        );
      }

      // Optional enum mappings
      if (propertyType) {
        formData.append("PropertyType", mapPropertyTypeToEnum(propertyType));
      }
      if (paymentMethod) {
        formData.append("PaymentMethod", mapPaymentMethodToEnum(paymentMethod));
      }
      if (petPolicy) {
        formData.append("PetPolicy", mapPetPolicyToEnum(petPolicy));
      }
      if (studentPolicy) {
        formData.append("StudentPolicy", mapStudentPolicyToEnum(studentPolicy));
      }
      if (smokingPolicy) {
        formData.append("SmokingPolicy", mapSmokingPolicyToEnum(smokingPolicy));
      }

      // Optional numeric fields
      if (depozito) formData.append("Depozito", depozito);
      if (banyoSayisi) formData.append("BanyoSayisi", banyoSayisi);
      if (yatakOdasiSayisi)
        formData.append("YatakOdasiSayisi", yatakOdasiSayisi);
      if (brutMetreKare) formData.append("BrutMetreKare", brutMetreKare);
      if (netMetreKare) formData.append("NetMetreKare", netMetreKare);
      if (binaYasi) formData.append("BinaYasi", binaYasi);
      if (bulunduguKat) formData.append("BulunduguKat", bulunduguKat);
      if (toplamKat) formData.append("ToplamKat", toplamKat);
      if (aidat) formData.append("Aidat", aidat);
      if (minimumKiralamaSuresi)
        formData.append("MinimumKiralamaSuresi", minimumKiralamaSuresi);

      // Boolean fields
      formData.append("Balkon", balkon ? "true" : "false");
      formData.append("Asansor", asansor ? "true" : "false");
      formData.append("Otopark", otopark ? "true" : "false");
      formData.append("Esyali", esyali ? "true" : "false");
      formData.append("SiteIcerisinde", siteIcerisinde ? "true" : "false");
      formData.append("Takas", takas ? "true" : "false");

      // If editing, include the postId
      if (propertyData && propertyData.postId) {
        formData.append("PostId", propertyData.postId);
      }

      // Add only new images (not existing ones)
      const newImages = images.filter((img) => !img.id.startsWith("existing_"));
      newImages.forEach((image, index) => {
        // Get file name from URI
        const uriParts = image.uri.split("/");
        const fileName = uriParts[uriParts.length - 1];

        // Get file extension
        const fileExt = fileName.split(".").pop();

        // Prepare file object for form data
        formData.append("Files", {
          uri: image.uri,
          name: `photo_${index}.${fileExt}`,
          type: `image/${fileExt}`,
        });

        // Add image status
        formData.append("PostImageStatus", "pending");
      });

      // Log the form data being sent
      console.log("===== SENDING POST DATA =====");
      console.log("UserId:", currentUser.id);
      console.log("RentalPeriod enum:", mapRentalPeriodToEnum(RentalPeriod));
      console.log(
        "PropertyType enum:",
        propertyType ? mapPropertyTypeToEnum(propertyType) : "Not set"
      );
      console.log(
        "MaintenanceFeeResponsibility enum:",
        maintenanceFeeResponsibility
          ? mapMaintenanceFeeResponsibilityToEnum(maintenanceFeeResponsibility)
          : "Not set"
      );
      console.log("Total images being sent:", newImages.length);
      console.log("Selected coordinates:", selectedCoordinates);
      console.log("BulunduguKat:", bulunduguKat);
      console.log("YatakOdasiSayisi:", yatakOdasiSayisi);
      console.log("=============================");

      // Submit post
      const response = await createPost(formData).unwrap();

      // Log the response
      console.log("===== POST RESPONSE =====");
      console.log(JSON.stringify(response, null, 2));
      console.log("=========================");

      if (response && response.isSuccess) {
        setUploadStatus("success");
        dispatch(clearPostFormData());
        Alert.alert(
          "Başarılı",
          propertyData
            ? "İlanınız başarıyla güncellendi."
            : "İlanınız başarıyla oluşturuldu.",
          [
            {
              text: "Tamam",
              onPress: () => navigation.navigate("MyPropertiesList"),
            },
          ]
        );
      } else {
        setUploadStatus("error");
        Alert.alert(
          "Hata",
          response?.message || "İşlem sırasında bir hata oluştu."
        );
      }
    } catch (error) {
      setUploadStatus("error");
      console.error("Create/Update post error:", error);
      console.log("===== POST ERROR =====");
      console.log("Error data:", JSON.stringify(error.data, null, 2));
      console.log("Error status:", error.status);
      console.log("Error message:", error.message);
      console.log("======================");

      Alert.alert(
        "Hata",
        error.data?.message ||
        "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  // Optional: Manual save button for form state
  const handleSaveFormState = () => {
    dispatch(
      savePostFormData({
        ilanBasligi,
        kiraFiyati,
        location,
        postDescription,
        odaSayisi,
        banyoSayisi,
        yatakOdasiSayisi,
        brutMetreKare,
        netMetreKare,
        images,
        propertyType,
        isitmaTipi,
        depozito,
        rentalPeriod: RentalPeriod,
        // Save new fields
        il,
        ilce,
        kimden,
        mutfak,
        mahalle,
        siteAdi,
        paraBirimi,
        kullanimDurumu,
        bulunduguKat,
        maintenanceFeeResponsibility, // NEW: Save MaintenanceFeeResponsibility
        // Save coordinates
        latitude: selectedCoordinates?.latitude,
        longitude: selectedCoordinates?.longitude,
      })
    );
    Alert.alert("Bilgi", "Form bilgileri kaydedildi.");
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <CreatePostHeader
          navigation={navigation}
          onSubmit={handleSubmit}
          isLoading={isCreating || uploadStatus === "uploading"}
          propertyData={propertyData}
        />

        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 py-4">
            {/* Basic Information */}
            <FormSection title="Temel Bilgiler">
              <CustomTextInput
                label="İlan Başlığı"
                value={ilanBasligi}
                onChangeText={setIlanBasligi}
                placeholder="Modern 2+1 Daire"
                required
              />

              <CustomTextInput
                label="Kira Tutarı (₺)"
                value={kiraFiyati}
                onChangeText={setKiraFiyati}
                placeholder="3500"
                keyboardType="numeric"
                required
              />

              <CustomTextInput
                label="Depozito Tutarı (₺)"
                value={depozito}
                onChangeText={setDepozito}
                placeholder="7000"
                keyboardType="numeric"
              />

              <CustomDropdown
                label="Kiralama Süresi"
                value={RentalPeriod}
                setValue={setRentalPeriod}
                options={rentalPeriodOptions}
                placeholder="Kiralama süresi seçin"
                required
              />

              <View className="flex-row justify-between">
                <View className="w-[48%]">
                  <CustomDropdown
                    label="Para Birimi"
                    value={paraBirimi}
                    setValue={setParaBirimi}
                    options={currencyOptions}
                    placeholder="Para birimi seçin"
                    required
                  />
                </View>
                <View className="w-[48%]">
                  <CustomDropdown
                    label="Ödeme Yöntemi"
                    value={paymentMethod}
                    setValue={setPaymentMethod}
                    options={paymentMethodOptions}
                    placeholder="Ödeme yöntemi"
                  />
                </View>
              </View>
            </FormSection>

            {/* Location Information */}
            <FormSection title="Konum Bilgileri">
              {/* Location Input with Map Button */}
              <View className="mb-2">
                <Text
                  style={{ fontSize: 14 }}
                  className="font-semibold text-gray-900 mb-3"
                >
                  Konum <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center mb-3">
                  <View className="flex-1 border border-gray-900 rounded-xl px-4 py-4 mr-2">
                    <TextInput
                      className="text-gray-900 text-base"
                      placeholder="Haritadan konum seçin"
                      placeholderTextColor="#b0b0b0"
                      value={location}
                      onChangeText={setLocation}
                      editable={false}
                      style={{ fontSize: 16 }}
                    />
                  </View>
                  <TouchableOpacity
                    style={{ padding: 16 }}
                    className="bg-gray-900 rounded-2xl"
                    onPress={() => setShowLocationPicker(true)}
                  >
                    <FontAwesomeIcon icon={faLocationDot} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Show coordinates if selected */}
                {selectedCoordinates && (
                  <View className=" mb-3">
                    <Text className="text-sm text-gray-600">
                      Koordinatlar: {selectedCoordinates.latitude.toFixed(6)},{" "}
                      {selectedCoordinates.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between mb-2">
                <View className="w-[48%]">
                  <CustomTextInput
                    label="İl"
                    value={il}
                    onChangeText={setIl}
                    placeholder="İstanbul"
                    required
                  />
                </View>
                <View className="w-[48%]">
                  <CustomTextInput
                    label="İlçe"
                    value={ilce}
                    onChangeText={setIlce}
                    placeholder="Kadıköy"
                    required
                  />
                </View>
              </View>

              <View className="flex-row justify-between">
                <View className="w-[48%]">
                  <CustomTextInput
                    label="Mahalle"
                    value={mahalle}
                    onChangeText={setMahalle}
                    placeholder="Caferağa"
                    required
                  />
                </View>
                <View className="w-[48%]">
                  <CustomTextInput
                    label="Site Adı"
                    value={siteAdi}
                    onChangeText={setSiteAdi}
                    placeholder="Örnek Site"
                    required
                  />
                </View>
              </View>
            </FormSection>

            {/* Property Features */}
            <FormSection title="Emlak Özellikleri">
              <View className="flex-row justify-between mb-2">
                <View className="w-[30%]">
                  <CustomTextInput
                    label="Oda Sayısı"
                    value={odaSayisi}
                    onChangeText={setOdaSayisi}
                    placeholder="2+1"
                    required
                  />
                </View>
                <View className="w-[30%]">
                  <CustomTextInput
                    label="Banyo"
                    value={banyoSayisi}
                    onChangeText={setBanyoSayisi}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-[30%]">
                  <CustomTextInput
                    label="Yatak Odası"
                    value={yatakOdasiSayisi}
                    onChangeText={setYatakOdasiSayisi}
                    placeholder="2"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-2">
                <View className="w-[48%]">
                  <CustomTextInput
                    label="Brüt Alan (m²)"
                    value={brutMetreKare}
                    onChangeText={setBrutMetreKare}
                    placeholder="90"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-[48%]">
                  <CustomTextInput
                    label="Net Alan (m²)"
                    value={netMetreKare}
                    onChangeText={setNetMetreKare}
                    placeholder="85"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <CustomTextInput
                label="Mutfak"
                value={mutfak}
                onChangeText={setMutfak}
                placeholder="Amerikan Mutfak"
                required
              />

              <CustomDropdown
                label="Mülk Tipi"
                value={propertyType}
                setValue={setPropertyType}
                options={propertyTypes}
                placeholder="Mülk tipi seçin"
              />

              <CustomDropdown
                label="Isınma Tipi"
                value={isitmaTipi}
                setValue={setIsitmaTipi}
                options={heatingTypes}
                placeholder="Isınma tipi seçin"
                required
              />

              <CustomDropdown
                label="Kullanım Durumu"
                value={kullanimDurumu}
                setValue={setKullanimDurumu}
                options={usageStatusOptions}
                placeholder="Kullanım durumu seçin"
                required
              />

              <CustomDropdown
                label="Kimden"
                value={kimden}
                setValue={setKimden}
                options={["Sahibinden", "Emlakçıdan"]}
                placeholder="Kimden seçin"
                required
              />

              <CustomTextInput
                label="Açıklama"
                value={postDescription}
                onChangeText={setPostDescription}
                placeholder="İlanınız hakkında detaylı bilgi verin..."
                multiline
                numberOfLines={4}
                required
              />
            </FormSection>

            {/* Images Section */}
            {renderImageGallery()}

            {/* Building Information */}
            <FormSection title="Bina Bilgileri">
              <View className="flex-row justify-between mb-2">
                <View className="w-[30%]">
                  <CustomTextInput
                    label="Bina Yaşı"
                    value={binaYasi}
                    onChangeText={setBinaYasi}
                    placeholder="5"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-[30%]">
                  <CustomTextInput
                    label="Bulunduğu Kat"
                    value={bulunduguKat}
                    onChangeText={setBulunduguKat}
                    placeholder="3"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-[30%]">
                  <CustomTextInput
                    label="Toplam Kat"
                    value={toplamKat}
                    onChangeText={setToplamKat}
                    placeholder="8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-2">
                <View className="w-[48%]">
                  <CustomTextInput
                    label="Aidat (TL)"
                    value={aidat}
                    onChangeText={setAidat}
                    placeholder="350"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-[48%]">
                  <CustomTextInput
                    label="Min. Kiralama Süresi (Ay)"
                    value={minimumKiralamaSuresi}
                    onChangeText={setMinimumKiralamaSuresi}
                    placeholder="12"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Switch Options */}
              <SwitchField label="Balkon" value={balkon} setValue={setBalkon} />
              <SwitchField
                label="Asansör"
                value={asansor}
                setValue={setAsansor}
              />
              <SwitchField
                label="Otopark"
                value={otopark}
                setValue={setOtopark}
              />
              <SwitchField label="Eşyalı" value={esyali} setValue={setEsyali} />
              <SwitchField
                label="Site İçerisinde"
                value={siteIcerisinde}
                setValue={setSiteIcerisinde}
              />
              <SwitchField label="Takas" value={takas} setValue={setTakas} />
            </FormSection>

            {/* Rental Policies */}
            <FormSection title="Kiralama Politikaları">
              <CustomDropdown
                label="Evcil Hayvan Politikası"
                value={petPolicy}
                setValue={setPetPolicy}
                options={petPolicyOptions}
                placeholder="Evcil hayvan politikası seçin"
              />

              <CustomDropdown
                label="Öğrenci Kabulü"
                value={studentPolicy}
                setValue={setStudentPolicy}
                options={studentPolicyOptions}
                placeholder="Öğrenci politikası seçin"
              />

              <CustomDropdown
                label="Sigara Politikası"
                value={smokingPolicy}
                setValue={setSmokingPolicy}
                options={smokingPolicyOptions}
                placeholder="Sigara politikası seçin"
              />
              {/* NEW: MaintenanceFeeResponsibility Dropdown */}
              <CustomDropdown
                label="Aidat Ödeme Sorumluluğu"
                value={maintenanceFeeResponsibility}
                setValue={setMaintenanceFeeResponsibility}
                options={maintenanceFeeResponsibilityOptions}
                placeholder="Aidat sorumluluğu seçin"
              />
            </FormSection>
          </View>
        </ScrollView>

        {/* Location Picker Modal */}
        <Modal
          visible={showLocationPicker}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={selectedCoordinates}
            onClose={() => setShowLocationPicker(false)}
          />
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
});
export default CreatePostScreen;
