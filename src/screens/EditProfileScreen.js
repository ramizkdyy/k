import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Switch,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useUpdateLandlordProfileMutation,
  useUpdateTenantProfileMutation,
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
  useUpdateLandlordExpectationMutation,
  useUpdateTenantExpectationMutation,
  useGetLandlordExpectationByIdQuery,
  useGetTenantExpectationByIdQuery,
} from "../redux/api/apiSlice";
import {
  selectUserProfile,
  setUserProfile,
  updateProfileImageStatus,
  updateCoverImageStatus,
} from "../redux/slices/profileSlice";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faPlus,
  faChevronLeft,
  faChevronDown,
  faCalendar,
  faCheck,
  faImage,
  faCamera,
  faTrash
} from "@fortawesome/pro-solid-svg-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// CustomDropdown tarzında hem profil hem kapak fotoğrafı seçici modal
const ImagePickerModal = ({
  isVisible,
  onClose,
  onGallery,
  onCamera,
  onRemove,
  hasCurrentImage,
  imageType // "profile" veya "cover"
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const getModalHeight = () => {
    const headerHeight = 80;
    const itemHeight = 60;
    const bottomPadding = 40;
    const itemCount = hasCurrentImage ? 3 : 2; // Kaldır seçeneği varsa 3, yoksa 2

    return headerHeight + (itemCount * itemHeight) + bottomPadding;
  };

  const SNAP_POINTS = {
    CLOSED: SCREEN_HEIGHT,
    OPEN: SCREEN_HEIGHT - getModalHeight(),
  };

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(SNAP_POINTS.OPEN, {
        damping: 80,
        stiffness: 400,
      });
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
    } else if (isVisible === false && translateY.value !== SCREEN_HEIGHT) {
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 80,
        stiffness: 400,
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isVisible]);

  const handleClose = () => {
    translateY.value = withSpring(SCREEN_HEIGHT, {
      damping: 80,
      stiffness: 400,
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => onClose(), 300);
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleOptionSelect = (action) => {
    // Modal'ı anında kapat
    translateY.value = SCREEN_HEIGHT;
    backdropOpacity.value = 0;
    onClose(); // Anında state'i güncelle

    // Action'ı hemen çalıştır
    if (action === 'gallery') {
      onGallery();
    } else if (action === 'camera') {
      onCamera();
    } else if (action === 'remove') {
      onRemove();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View style={[styles.modal, modalStyle]}>
          {/* Header */}
          <View className="py-4 px-6 border-b border-gray-100 bg-white">
            <View className="flex-row justify-between items-center">
              <Text
                style={{ fontWeight: 600, fontSize: 18 }}
                className="text-gray-800"
              >
                {imageType === "profile" ? "Profil Fotoğrafı" : "Kapak Fotoğrafı"}
              </Text>
              <TouchableOpacity onPress={handleClose} className="px-2 py-2">
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

          {/* Options */}
          <View className="bg-white">
            {/* Galeriden Seç */}
            <TouchableOpacity
              className="py-4 px-7 flex-row items-center border-b border-gray-50"
              onPress={() => handleOptionSelect('gallery')}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10  rounded-full items-center justify-center mr-4">
                <FontAwesomeIcon icon={faImage} size={18} color="#111827" />
              </View>
              <Text className="text-lg text-gray-700 flex-1">
                Galeriden Seç
              </Text>
            </TouchableOpacity>

            {/* Fotoğraf Çek */}
            <TouchableOpacity
              className={`py-4 px-7 flex-row items-center ${hasCurrentImage ? 'border-b border-gray-50' : ''}`}
              onPress={() => handleOptionSelect('camera')}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10  rounded-full items-center justify-center mr-4">
                <FontAwesomeIcon icon={faCamera} size={18} color="#111827" />
              </View>
              <Text className="text-lg text-gray-700 flex-1">
                Fotoğraf Çek
              </Text>
            </TouchableOpacity>

            {/* Fotoğrafı Kaldır - Sadece mevcut fotoğraf varsa */}
            {hasCurrentImage && (
              <TouchableOpacity
                className="py-4 px-7 flex-row items-center"
                onPress={() => handleOptionSelect('remove')}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10  rounded-full items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faTrash} size={18} color="#111827" />
                </View>
                <Text className="text-lg flex-1">
                  Fotoğrafı Kaldır
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};


// Header Component similar to ProfileExpectation
const EditProfileHeader = ({ navigation, onSave, isLoading }) => (
  <View style={{ paddingVertical: 12 }} className="px-3 relative bg-white">
    <View className="flex-row justify-between ml-2 items-center w-full">
      {/* Sol taraf - Geri butonu */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="flex-row items-center"
      >
        <FontAwesomeIcon icon={faChevronLeft} size={22} color="#0d0d0d" />
      </TouchableOpacity>

      {/* Sağ taraf - Save butonu */}
      <TouchableOpacity
        className="px-1 items-center justify-center"
        onPress={onSave}
        disabled={isLoading}
      >
        <Text
          style={{ fontSize: 16, color: "#6aeba9", borderColor: "#6aeba9" }}
          className="font-semibold border px-4 py-2 rounded-full"
        >
          {isLoading ? "Kaydediliyor..." : "Kaydet"}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Ortalanmış başlık */}
    <View className="absolute inset-0 justify-center items-center pointer-events-none">
      <Text
        className="text-gray-500"
        style={{
          fontWeight: 500,
          fontSize: 14,
        }}
      >
        Profili Düzenle
      </Text>
    </View>
  </View>
);

// Form section component similar to ProfileExpectation
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

// Custom TextInput Component similar to ProfileExpectation
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
        style={{ fontSize: 16 }}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  </View>
);

// Switch field component similar to ProfileExpectation
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
        trackColor={{ false: "#e5e7eb", true: "#111827" }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    </View>
  </View>
);

// Custom Dropdown exactly like ProfileExpectation
const CustomDropdown = ({
  label,
  value,
  setValue,
  options,
  placeholder,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getModalHeight = () => {
    const headerHeight = 80;
    const itemHeight = 50;
    const bottomPadding = 40;
    const minHeight = SCREEN_HEIGHT * 0.25;
    const maxHeight = SCREEN_HEIGHT * 0.6;

    const calculatedHeight =
      headerHeight + options.length * itemHeight + bottomPadding;

    if (options.length <= 3) {
      return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.35);
    }

    if (options.length <= 7) {
      return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.55);
    }

    return maxHeight;
  };

  const SNAP_POINTS = {
    CLOSED: SCREEN_HEIGHT,
    OPEN: SCREEN_HEIGHT - getModalHeight(),
  };

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

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

  const handleClose = () => {
    translateY.value = withSpring(SCREEN_HEIGHT, {
      damping: 80,
      stiffness: 400,
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleOptionSelect = (option) => {
    setValue(option);
    handleClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

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

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={handleClose}
        >
          <GestureHandlerRootView style={styles.container}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
              <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <View style={styles.backdropTouchable} />
              </TouchableWithoutFeedback>
            </Animated.View>

            <Animated.View style={[styles.modal, modalStyle]}>
              <View className="py-4 px-6 border-b border-gray-100 bg-white">
                <View className="flex-row justify-between items-center">
                  <Text
                    style={{ fontWeight: 600, fontSize: 18 }}
                    className="text-gray-800"
                  >
                    {label}
                  </Text>
                  <TouchableOpacity onPress={handleClose} className="px-2 py-2">
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

              <ScrollView
                className="flex-1"
                style={{
                  backgroundColor: "white",
                  maxHeight:
                    options.length <= 3 ? undefined : SCREEN_HEIGHT * 0.5,
                }}
                showsVerticalScrollIndicator={options.length > 5}
                bounces={options.length > 3}
                scrollEnabled={options.length > 3}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: options.length <= 3 ? 5 : 15,
                  justifyContent: "flex-start",
                  flexGrow: 0,
                }}
              >
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`py-4 px-7 flex-row items-center justify-between ${index !== options.length - 1
                      ? "border-b border-gray-50"
                      : ""
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
                      <FontAwesomeIcon
                        icon={faCheck}
                        size={16}
                        color="#86efac"
                      />
                    )}
                  </TouchableOpacity>
                ))}

                {options.length > 7 && <View className="h-2" />}
              </ScrollView>
            </Animated.View>
          </GestureHandlerRootView>
        </Modal>
      )}
    </View>
  );
};

// Custom Date Picker similar to ProfileExpectation
const CustomDatePicker = ({ label, value, setValue, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || value;
    setIsOpen(Platform.OS === "ios");
    setSelectedDate(currentDate);
    setValue(currentDate);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

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
        <View className="flex-row items-center">
          <FontAwesomeIcon icon={faCalendar} size={20} color="#0d0d0d" />
          <Text
            className={value ? "text-gray-900 ml-3" : "text-gray-500 ml-3"}
            style={{ fontSize: 16 }}
          >
            {value ? formatDate(value) : "Tarih seçin"}
          </Text>
        </View>
        <FontAwesomeIcon icon={faChevronDown} size={16} color="#6b7280" />
      </TouchableOpacity>

      {isOpen && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const userProfile = useSelector(selectUserProfile);

  // Tab Management for hiding bottom tabs
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: "none" },
        });
      }

      return () => {
        if (parent) {
          if (userRole === "EVSAHIBI") {
            parent.setOptions({
              tabBarStyle: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderTopColor: "rgba(224, 224, 224, 0.2)",
                paddingTop: 5,
                paddingBottom: 5,
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 8,
              },
            });
          } else if (userRole === "KIRACI") {
            parent.setOptions({
              tabBarStyle: {
                backgroundColor: "#fff",
                borderTopColor: "#e0e0e0",
                paddingTop: 5,
                paddingBottom: 5,
              },
            });
          }
        }
      };
    }, [navigation, userRole])
  );

  // Image states
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);


  // Landlord Expectations states
  const [landlordCity, setLandlordCity] = useState("İstanbul");
  const [landlordDistrict, setLandlordDistrict] = useState("");
  const [rentAmount, setRentAmount] = useState("5000");
  const [isMaintenanceFeeIncluded, setIsMaintenanceFeeIncluded] =
    useState(false);
  const [maintenanceFee, setMaintenanceFee] = useState("0");
  const [maintenanceFeeResponsibility, setMaintenanceFeeResponsibility] =
    useState("Kiracıya Ait");
  const [isDepositRequired, setIsDepositRequired] = useState(true);
  const [depositAmount, setDepositAmount] = useState("5000");
  const [minimumRentalPeriod, setMinimumRentalPeriod] = useState("6 Ay");
  const [isShortTermRentalAvailable, setIsShortTermRentalAvailable] =
    useState(false);
  const [isForeignCurrencyAccepted, setIsForeignCurrencyAccepted] =
    useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("TL");
  const [isBankTransferRequired, setIsBankTransferRequired] = useState(false);
  const [maximumOccupants, setMaximumOccupants] = useState("2");
  const [petPolicy, setPetPolicy] = useState("Evet, Kabul Ediyorum");
  const [acceptedPetTypes, setAcceptedPetTypes] = useState("");
  const [studentPolicy, setStudentPolicy] = useState("Evet, Kabul Ediyorum");
  const [familyOnly, setFamilyOnly] = useState(false);
  const [acceptChildrenFamily, setAcceptChildrenFamily] = useState(true);
  const [preferGovernmentEmployee, setPreferGovernmentEmployee] =
    useState(false);
  const [isIncomeProofRequired, setIsIncomeProofRequired] = useState(false);
  const [minimumMonthlyIncome, setMinimumMonthlyIncome] = useState("0");
  const [isGuarantorRequired, setIsGuarantorRequired] = useState(false);
  const [smokingPolicy, setSmokingPolicy] = useState("Evet, İzin Veriyorum");
  const [isReferenceRequired, setIsReferenceRequired] = useState(false);
  const [isInsuredJobRequired, setIsInsuredJobRequired] = useState(false);
  const [buildingApprovalPolicy, setBuildingApprovalPolicy] =
    useState("Evet, Önemli");

  // Tenant Expectations states
  const [tenantCity, setTenantCity] = useState("İstanbul");
  const [tenantDistrict, setTenantDistrict] = useState("");
  const [alternativeDistricts, setAlternativeDistricts] = useState("");
  const [preferredNeighborhoods, setPreferredNeighborhoods] = useState("");
  const [minRentBudget, setMinRentBudget] = useState("3000");
  const [maxRentBudget, setMaxRentBudget] = useState("8000");
  const [maintenanceFeePreference, setMaintenanceFeePreference] =
    useState("Kiracıya Ait");
  const [maxMaintenanceFee, setMaxMaintenanceFee] = useState("0");
  const [canPayDeposit, setCanPayDeposit] = useState(true);
  const [maxDepositAmount, setMaxDepositAmount] = useState("6000");
  const [preferredPaymentMethod, setPreferredPaymentMethod] =
    useState("Banka Havalesi");
  const [minRoomCount, setMinRoomCount] = useState("1");
  const [minSquareMeters, setMinSquareMeters] = useState("60");
  const [furnishedPreference, setFurnishedPreference] =
    useState("Mobilyalı Olmalı");
  const [preferredHeatingType, setPreferredHeatingType] =
    useState("Doğalgaz Kombi");
  const [maxBuildingAge, setMaxBuildingAge] = useState("10");
  const [preferredFloorRange, setPreferredFloorRange] = useState("");
  const [requiresElevator, setRequiresElevator] = useState(false);
  const [requiresBalcony, setRequiresBalcony] = useState(false);
  const [requiresParking, setRequiresParking] = useState(false);
  const [requiresInternet, setRequiresInternet] = useState(true);
  const [requiresGarden, setRequiresGarden] = useState(false);
  const [preferredRentalPeriod, setPreferredRentalPeriod] = useState("6 Ay");
  const [earliestMoveInDate, setEarliestMoveInDate] = useState(new Date());
  const [preferShortTerm, setPreferShortTerm] = useState(false);
  const [occupantCount, setOccupantCount] = useState("1");
  const [hasPets, setHasPets] = useState(false);
  const [petTypes, setPetTypes] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [isFamily, setIsFamily] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenCount, setChildrenCount] = useState("0");
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasInsuredJob, setHasInsuredJob] = useState(false);
  const [canProvideGuarantor, setCanProvideGuarantor] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [canProvideReference, setCanProvideReference] = useState(false);
  const [neighborRelationPreference, setNeighborRelationPreference] =
    useState("Yakın İlişki");
  const [noisePreference, setNoisePreference] = useState("Sessiz Olmalı");
  const [securityPreferences, setSecurityPreferences] = useState("");
  const [requiresPublicTransport, setRequiresPublicTransport] = useState(true);
  const [requiresShoppingAccess, setRequiresShoppingAccess] = useState(true);
  const [requiresSchoolAccess, setRequiresSchoolAccess] = useState(false);
  const [requiresHospitalAccess, setRequiresHospitalAccess] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Options arrays
  const cities = [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Antalya",
    "Adana",
    "Konya",
    "Gaziantep",
    "Diğer",
  ];

  const maintenanceFeeResponsibilityOptions = [
    "Kiracıya Ait",
    "Ev Sahibine Ait",
    "Ortak Ödeme",
  ];

  const rentalPeriodOptions = [
    "6 Ay",
    "1 Yıl",
    "Uzun Vadeli (1+ Yıl)",
    "Kısa Dönem Olabilir",
  ];

  const petPolicyOptions = [
    "Evet, Kabul Ediyorum",
    "Hayır, Kabul Etmiyorum",
    "Sadece Küçük Hayvan",
  ];

  const studentPolicyOptions = [
    "Evet, Kabul Ediyorum",
    "Hayır, Kabul Etmiyorum",
    "Referanslı Öğrenci Olabilir",
  ];

  const smokingPolicyOptions = [
    "Evet, İzin Veriyorum",
    "Hayır, İzin Vermiyorum",
    "Sadece Balkonda İçilebilir",
  ];

  const buildingApprovalPolicyOptions = [
    "Evet, Önemli",
    "Hayır, Önemli Değil",
    "Ortak Karar Alınacak",
  ];

  const currencyOptions = [
    "TL",
    "USD (Amerikan Doları)",
    "EUR (Euro)",
    "GBP (İngiliz Sterlini)",
  ];

  const paymentMethodOptions = [
    "Banka Havalesi",
    "Nakit Ödeme",
    "Çek",
    "Fark Etmez",
  ];

  const furnishedPreferenceOptions = [
    "Mobilyalı Olmalı",
    "Mobilyasız Olmalı",
    "Kısmen Mobilyalı Olabilir",
    "Fark Etmez",
  ];

  const heatingTypeOptions = [
    "Doğalgaz Kombi",
    "Merkezi Sistem",
    "Elektrikli Isıtma",
    "Soba",
    "Fark Etmez",
  ];

  const neighborRelationOptions = [
    "Yakın İlişki",
    "Mesafeli İlişki",
    "Fark Etmez",
  ];

  const noisePreferenceOptions = [
    "Sessiz Olmalı",
    "Normal Seviyede Olabilir",
    "Fark Etmez",
  ];

  // API Queries and Mutations
  const {
    data: profileData,
    isLoading: profileLoading,
    isSuccess: profileSuccess,
  } = userRole === "EVSAHIBI"
      ? useGetLandlordProfileQuery(currentUser?.id, { skip: !currentUser?.id })
      : useGetTenantProfileQuery(currentUser?.id, { skip: !currentUser?.id });

  const {
    data: expectationsData,
    isLoading: expectationsLoading,
    isSuccess: expectationsSuccess,
  } = userRole === "EVSAHIBI"
      ? useGetLandlordExpectationByIdQuery(currentUser?.id, {
        skip: !currentUser?.id,
      })
      : useGetTenantExpectationByIdQuery(currentUser?.id, {
        skip: !currentUser?.id,
      });

  const [updateLandlordProfile, { isLoading: updateLandlordLoading }] =
    useUpdateLandlordProfileMutation();
  const [updateTenantProfile, { isLoading: updateTenantLoading }] =
    useUpdateTenantProfileMutation();

  const isLoading = useMemo(() => {
    return (
      profileLoading ||
      expectationsLoading ||
      updateLandlordLoading ||
      updateTenantLoading
    );
  }, [
    profileLoading,
    expectationsLoading,
    updateLandlordLoading,
    updateTenantLoading,
  ]);

  // Helper function for safe state setting
  const safeSetState = (setter, value, fallback = "") => {
    setter(value !== null && value !== undefined ? value : fallback);
  };

  // Load profile data
  useEffect(() => {
    if (profileSuccess && profileData?.isSuccess && profileData?.result) {
      const profile = profileData.result;
      console.log("Loading profile data:", profile);
      dispatch(setUserProfile(profile));

      if (profile.profileImageUrl) {
        setPreviewProfileImage(profile.profileImageUrl);
      }
      if (profile.coverProfileImageUrl) {
        setPreviewCoverImage(profile.coverProfileImageUrl);
      }
    }
  }, [profileSuccess, profileData, dispatch]);

  // Load expectations data
  useEffect(() => {
    if (
      expectationsSuccess &&
      expectationsData?.isSuccess &&
      expectationsData?.result
    ) {
      const expectations = expectationsData.result;
      console.log("Loading expectations data:", expectations);

      if (userRole === "EVSAHIBI") {
        // Load landlord expectations with string values for dropdowns
        safeSetState(setLandlordCity, expectations.city, "İstanbul");
        safeSetState(setLandlordDistrict, expectations.district);
        safeSetState(
          setRentAmount,
          expectations.rentAmount?.toString(),
          "5000"
        );
        setIsMaintenanceFeeIncluded(!!expectations.isMaintenanceFeeIncluded);
        safeSetState(
          setMaintenanceFee,
          expectations.maintenanceFee?.toString(),
          "0"
        );

        // Convert numeric values to string options
        const responsibilityIndex =
          expectations.maintenanceFeeResponsibility - 1;
        if (
          responsibilityIndex >= 0 &&
          responsibilityIndex < maintenanceFeeResponsibilityOptions.length
        ) {
          setMaintenanceFeeResponsibility(
            maintenanceFeeResponsibilityOptions[responsibilityIndex]
          );
        }

        setIsDepositRequired(!!expectations.isDepositRequired);
        safeSetState(
          setDepositAmount,
          expectations.depositAmount?.toString(),
          "5000"
        );

        const rentalPeriodIndex = expectations.minimumRentalPeriod - 1;
        if (
          rentalPeriodIndex >= 0 &&
          rentalPeriodIndex < rentalPeriodOptions.length
        ) {
          setMinimumRentalPeriod(rentalPeriodOptions[rentalPeriodIndex]);
        }

        setIsShortTermRentalAvailable(
          !!expectations.isShortTermRentalAvailable
        );
        setIsForeignCurrencyAccepted(!!expectations.isForeignCurrencyAccepted);

        const currencyIndex = expectations.preferredCurrency - 1;
        if (currencyIndex >= 0 && currencyIndex < currencyOptions.length) {
          setPreferredCurrency(currencyOptions[currencyIndex]);
        }

        setIsBankTransferRequired(!!expectations.isBankTransferRequired);
        safeSetState(
          setMaximumOccupants,
          expectations.maximumOccupants?.toString(),
          "2"
        );

        const petPolicyIndex = expectations.petPolicy - 1;
        if (petPolicyIndex >= 0 && petPolicyIndex < petPolicyOptions.length) {
          setPetPolicy(petPolicyOptions[petPolicyIndex]);
        }
        safeSetState(setAcceptedPetTypes, expectations.acceptedPetTypes);

        const studentPolicyIndex = expectations.studentPolicy - 1;
        if (
          studentPolicyIndex >= 0 &&
          studentPolicyIndex < studentPolicyOptions.length
        ) {
          setStudentPolicy(studentPolicyOptions[studentPolicyIndex]);
        }

        setFamilyOnly(!!expectations.familyOnly);
        setAcceptChildrenFamily(!!expectations.acceptChildrenFamily);
        setPreferGovernmentEmployee(!!expectations.preferGovernmentEmployee);
        setIsIncomeProofRequired(!!expectations.isIncomeProofRequired);
        safeSetState(
          setMinimumMonthlyIncome,
          expectations.minimumMonthlyIncome?.toString(),
          "0"
        );
        setIsGuarantorRequired(!!expectations.isGuarantorRequired);

        const smokingPolicyIndex = expectations.smokingPolicy - 1;
        if (
          smokingPolicyIndex >= 0 &&
          smokingPolicyIndex < smokingPolicyOptions.length
        ) {
          setSmokingPolicy(smokingPolicyOptions[smokingPolicyIndex]);
        }

        setIsReferenceRequired(!!expectations.isReferenceRequired);
        setIsInsuredJobRequired(!!expectations.isInsuredJobRequired);

        const buildingApprovalIndex = expectations.buildingApprovalPolicy - 1;
        if (
          buildingApprovalIndex >= 0 &&
          buildingApprovalIndex < buildingApprovalPolicyOptions.length
        ) {
          setBuildingApprovalPolicy(
            buildingApprovalPolicyOptions[buildingApprovalIndex]
          );
        }
      } else {
        // Load tenant expectations with string values for dropdowns
        safeSetState(setTenantCity, expectations.city, "İstanbul");
        safeSetState(setTenantDistrict, expectations.district);
        safeSetState(
          setAlternativeDistricts,
          expectations.alternativeDistricts
        );
        safeSetState(
          setPreferredNeighborhoods,
          expectations.preferredNeighborhoods
        );
        safeSetState(
          setMinRentBudget,
          expectations.minRentBudget?.toString(),
          "3000"
        );
        safeSetState(
          setMaxRentBudget,
          expectations.maxRentBudget?.toString(),
          "8000"
        );

        const maintenancePreferenceIndex =
          expectations.maintenanceFeePreference - 1;
        if (
          maintenancePreferenceIndex >= 0 &&
          maintenancePreferenceIndex <
          maintenanceFeeResponsibilityOptions.length
        ) {
          setMaintenanceFeePreference(
            maintenanceFeeResponsibilityOptions[maintenancePreferenceIndex]
          );
        }

        safeSetState(
          setMaxMaintenanceFee,
          expectations.maxMaintenanceFee?.toString(),
          "0"
        );
        setCanPayDeposit(expectations.canPayDeposit !== false);
        safeSetState(
          setMaxDepositAmount,
          expectations.maxDepositAmount?.toString(),
          "6000"
        );

        const paymentMethodIndex = expectations.preferredPaymentMethod - 1;
        if (
          paymentMethodIndex >= 0 &&
          paymentMethodIndex < paymentMethodOptions.length
        ) {
          setPreferredPaymentMethod(paymentMethodOptions[paymentMethodIndex]);
        }

        safeSetState(
          setMinRoomCount,
          expectations.minRoomCount?.toString(),
          "1"
        );
        safeSetState(
          setMinSquareMeters,
          expectations.minSquareMeters?.toString(),
          "60"
        );

        const furnishedIndex = expectations.furnishedPreference - 1;
        if (
          furnishedIndex >= 0 &&
          furnishedIndex < furnishedPreferenceOptions.length
        ) {
          setFurnishedPreference(furnishedPreferenceOptions[furnishedIndex]);
        }

        const heatingIndex = expectations.preferredHeatingType - 1;
        if (heatingIndex >= 0 && heatingIndex < heatingTypeOptions.length) {
          setPreferredHeatingType(heatingTypeOptions[heatingIndex]);
        }

        safeSetState(
          setMaxBuildingAge,
          expectations.maxBuildingAge?.toString(),
          "10"
        );
        safeSetState(setPreferredFloorRange, expectations.preferredFloorRange);
        setRequiresElevator(!!expectations.requiresElevator);
        setRequiresBalcony(!!expectations.requiresBalcony);
        setRequiresParking(!!expectations.requiresParking);
        setRequiresInternet(!!expectations.requiresInternet);
        setRequiresGarden(!!expectations.requiresGarden);

        const preferredRentalIndex = expectations.preferredRentalPeriod - 1;
        if (
          preferredRentalIndex >= 0 &&
          preferredRentalIndex < rentalPeriodOptions.length
        ) {
          setPreferredRentalPeriod(rentalPeriodOptions[preferredRentalIndex]);
        }

        if (expectations.earliestMoveInDate) {
          setEarliestMoveInDate(new Date(expectations.earliestMoveInDate));
        }

        setPreferShortTerm(!!expectations.preferShortTerm);
        safeSetState(
          setOccupantCount,
          expectations.occupantCount?.toString(),
          "1"
        );
        setHasPets(!!expectations.hasPets);
        safeSetState(setPetTypes, expectations.petTypes);
        setIsStudent(!!expectations.isStudent);
        safeSetState(setOccupation, expectations.occupation);
        setIsFamily(!!expectations.isFamily);
        setHasChildren(!!expectations.hasChildren);
        safeSetState(
          setChildrenCount,
          expectations.childrenCount?.toString(),
          "0"
        );
        setIsSmoker(!!expectations.isSmoker);
        setHasInsuredJob(!!expectations.hasInsuredJob);
        setCanProvideGuarantor(!!expectations.canProvideGuarantor);
        safeSetState(
          setMonthlyIncome,
          expectations.monthlyIncome?.toString(),
          "0"
        );
        setCanProvideReference(!!expectations.canProvideReference);

        const neighborIndex = expectations.neighborRelationPreference - 1;
        if (
          neighborIndex >= 0 &&
          neighborIndex < neighborRelationOptions.length
        ) {
          setNeighborRelationPreference(neighborRelationOptions[neighborIndex]);
        }

        const noiseIndex = expectations.noisePreference - 1;
        if (noiseIndex >= 0 && noiseIndex < noisePreferenceOptions.length) {
          setNoisePreference(noisePreferenceOptions[noiseIndex]);
        }

        safeSetState(setSecurityPreferences, expectations.securityPreferences);
        setRequiresPublicTransport(!!expectations.requiresPublicTransport);
        setRequiresShoppingAccess(!!expectations.requiresShoppingAccess);
        setRequiresSchoolAccess(!!expectations.requiresSchoolAccess);
        setRequiresHospitalAccess(!!expectations.requiresHospitalAccess);
        safeSetState(setAdditionalNotes, expectations.additionalNotes);
      }
    }
  }, [expectationsSuccess, expectationsData, userRole]);

  const handleImageSelection = (type) => {
    setActiveImageType(type);
    setIsImagePickerVisible(true);
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni gereklidir.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: activeImageType === "profile" ? [1, 1] : [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (activeImageType === "profile") {
          setProfileImage(result.assets[0].uri);
          setPreviewProfileImage(result.assets[0].uri);
        } else {
          setCoverImage(result.assets[0].uri);
          setPreviewCoverImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Kamera erişim izni gereklidir.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: activeImageType === "profile" ? [1, 1] : [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (activeImageType === "profile") {
          setProfileImage(result.assets[0].uri);
          setPreviewProfileImage(result.assets[0].uri);
        } else {
          setCoverImage(result.assets[0].uri);
          setPreviewCoverImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
    }
  };

  const removeImage = () => {
    if (activeImageType === "profile") {
      setProfileImage(null);
      setPreviewProfileImage(null);
    } else {
      setCoverImage(null);
      setPreviewCoverImage(null);
    }
  };

  // Helper function to convert string option back to numeric value
  const getOptionIndex = (options, value) => {
    const index = options.indexOf(value);
    return index !== -1 ? index + 1 : 1;
  };

  // Form validation
  const validateForm = () => {
    if (userRole === "EVSAHIBI") {
      if (!landlordCity) {
        Alert.alert("Hata", "Şehir alanı zorunludur.");
        return false;
      }
    } else {
      if (!tenantCity) {
        Alert.alert("Hata", "Şehir alanı zorunludur.");
        return false;
      }
      if (
        parseInt(minRentBudget) > parseInt(maxRentBudget) &&
        maxRentBudget !== "0"
      ) {
        Alert.alert(
          "Hata",
          "Minimum kira bütçesi maximum bütçeden büyük olamaz."
        );
        return false;
      }
    }
    return true;
  };

  // Save profile function
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("UserId", currentUser.id);

      // Add profile image if changed
      if (profileImage) {
        const profileImageName = profileImage.split("/").pop();
        const profileImageType = profileImageName.split(".").pop();
        formData.append("ProfileImage", {
          uri: profileImage,
          name: profileImageName,
          type: `image/${profileImageType}`,
        });
        dispatch(updateProfileImageStatus("uploading"));
      }

      // Add cover image if changed
      if (coverImage) {
        const coverImageName = coverImage.split("/").pop();
        const coverImageType = coverImageName.split(".").pop();
        formData.append("CoverProfileImage", {
          uri: coverImage,
          name: coverImageName,
          type: `image/${coverImageType}`,
        });
        dispatch(updateCoverImageStatus("uploading"));
      }

      // Add expectation fields based on user role
      if (userRole === "EVSAHIBI") {
        // Landlord expectation fields
        formData.append("TenantExpectation.City", landlordCity);
        formData.append("TenantExpectation.District", landlordDistrict);
        formData.append("TenantExpectation.RentAmount", rentAmount);
        formData.append(
          "TenantExpectation.IsMaintenanceFeeIncluded",
          isMaintenanceFeeIncluded
        );
        formData.append("TenantExpectation.MaintenanceFee", maintenanceFee);
        formData.append(
          "TenantExpectation.MaintenanceFeeResponsibility",
          getOptionIndex(
            maintenanceFeeResponsibilityOptions,
            maintenanceFeeResponsibility
          )
        );
        formData.append(
          "TenantExpectation.IsDepositRequired",
          isDepositRequired
        );
        formData.append("TenantExpectation.DepositAmount", depositAmount);
        formData.append(
          "TenantExpectation.MinimumRentalPeriod",
          getOptionIndex(rentalPeriodOptions, minimumRentalPeriod)
        );
        formData.append(
          "TenantExpectation.IsShortTermRentalAvailable",
          isShortTermRentalAvailable
        );
        formData.append(
          "TenantExpectation.IsForeignCurrencyAccepted",
          isForeignCurrencyAccepted
        );
        formData.append(
          "TenantExpectation.PreferredCurrency",
          getOptionIndex(currencyOptions, preferredCurrency)
        );
        formData.append(
          "TenantExpectation.IsBankTransferRequired",
          isBankTransferRequired
        );
        formData.append("TenantExpectation.MaximumOccupants", maximumOccupants);
        formData.append(
          "TenantExpectation.PetPolicy",
          getOptionIndex(petPolicyOptions, petPolicy)
        );
        formData.append(
          "TenantExpectation.AcceptedPetTypes",
          acceptedPetTypes || ""
        );
        formData.append(
          "TenantExpectation.StudentPolicy",
          getOptionIndex(studentPolicyOptions, studentPolicy)
        );
        formData.append("TenantExpectation.FamilyOnly", familyOnly);
        formData.append(
          "TenantExpectation.AcceptChildrenFamily",
          acceptChildrenFamily
        );
        formData.append(
          "TenantExpectation.PreferGovernmentEmployee",
          preferGovernmentEmployee
        );
        formData.append(
          "TenantExpectation.IsIncomeProofRequired",
          isIncomeProofRequired
        );
        formData.append(
          "TenantExpectation.MinimumMonthlyIncome",
          minimumMonthlyIncome
        );
        formData.append(
          "TenantExpectation.IsGuarantorRequired",
          isGuarantorRequired
        );
        formData.append(
          "TenantExpectation.SmokingPolicy",
          getOptionIndex(smokingPolicyOptions, smokingPolicy)
        );
        formData.append(
          "TenantExpectation.IsReferenceRequired",
          isReferenceRequired
        );
        formData.append(
          "TenantExpectation.IsInsuredJobRequired",
          isInsuredJobRequired
        );
        formData.append(
          "TenantExpectation.BuildingApprovalPolicy",
          getOptionIndex(buildingApprovalPolicyOptions, buildingApprovalPolicy)
        );

        const response = await updateLandlordProfile(formData).unwrap();
        console.log("Landlord profil güncelleme yanıtı:", response);

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert("Hata", response?.message || "Profil güncellenemedi.");
        }
      } else {
        // Tenant expectation fields
        const formattedDate = earliestMoveInDate.toISOString();

        formData.append("LandlordExpectation.City", tenantCity);
        formData.append("LandlordExpectation.District", tenantDistrict);
        formData.append(
          "LandlordExpectation.AlternativeDistricts",
          alternativeDistricts || ""
        );
        formData.append(
          "LandlordExpectation.PreferredNeighborhoods",
          preferredNeighborhoods || ""
        );
        formData.append("LandlordExpectation.MinRentBudget", minRentBudget);
        formData.append("LandlordExpectation.MaxRentBudget", maxRentBudget);
        formData.append(
          "LandlordExpectation.MaintenanceFeePreference",
          getOptionIndex(
            maintenanceFeeResponsibilityOptions,
            maintenanceFeePreference
          )
        );
        formData.append(
          "LandlordExpectation.MaxMaintenanceFee",
          maxMaintenanceFee
        );
        formData.append("LandlordExpectation.CanPayDeposit", canPayDeposit);
        formData.append(
          "LandlordExpectation.MaxDepositAmount",
          maxDepositAmount
        );
        formData.append(
          "LandlordExpectation.PreferredPaymentMethod",
          getOptionIndex(paymentMethodOptions, preferredPaymentMethod)
        );
        formData.append("LandlordExpectation.MinRoomCount", minRoomCount);
        formData.append("LandlordExpectation.MinSquareMeters", minSquareMeters);
        formData.append(
          "LandlordExpectation.FurnishedPreference",
          getOptionIndex(furnishedPreferenceOptions, furnishedPreference)
        );
        formData.append(
          "LandlordExpectation.PreferredHeatingType",
          getOptionIndex(heatingTypeOptions, preferredHeatingType)
        );
        formData.append("LandlordExpectation.MaxBuildingAge", maxBuildingAge);
        formData.append(
          "LandlordExpectation.PreferredFloorRange",
          preferredFloorRange || ""
        );
        formData.append(
          "LandlordExpectation.RequiresElevator",
          requiresElevator
        );
        formData.append("LandlordExpectation.RequiresBalcony", requiresBalcony);
        formData.append("LandlordExpectation.RequiresParking", requiresParking);
        formData.append(
          "LandlordExpectation.RequiresInternet",
          requiresInternet
        );
        formData.append("LandlordExpectation.RequiresGarden", requiresGarden);
        formData.append(
          "LandlordExpectation.PreferredRentalPeriod",
          getOptionIndex(rentalPeriodOptions, preferredRentalPeriod)
        );
        formData.append(
          "LandlordExpectation.EarliestMoveInDate",
          formattedDate
        );
        formData.append("LandlordExpectation.PreferShortTerm", preferShortTerm);
        formData.append("LandlordExpectation.OccupantCount", occupantCount);
        formData.append("LandlordExpectation.HasPets", hasPets);
        formData.append("LandlordExpectation.PetTypes", petTypes || "");
        formData.append("LandlordExpectation.IsStudent", isStudent);
        formData.append("LandlordExpectation.Occupation", occupation || "");
        formData.append("LandlordExpectation.IsFamily", isFamily);
        formData.append("LandlordExpectation.HasChildren", hasChildren);
        formData.append("LandlordExpectation.ChildrenCount", childrenCount);
        formData.append("LandlordExpectation.IsSmoker", isSmoker);
        formData.append("LandlordExpectation.HasInsuredJob", hasInsuredJob);
        formData.append(
          "LandlordExpectation.CanProvideGuarantor",
          canProvideGuarantor
        );
        formData.append("LandlordExpectation.MonthlyIncome", monthlyIncome);
        formData.append(
          "LandlordExpectation.CanProvideReference",
          canProvideReference
        );
        formData.append(
          "LandlordExpectation.NeighborRelationPreference",
          getOptionIndex(neighborRelationOptions, neighborRelationPreference)
        );
        formData.append(
          "LandlordExpectation.NoisePreference",
          getOptionIndex(noisePreferenceOptions, noisePreference)
        );
        formData.append(
          "LandlordExpectation.SecurityPreferences",
          securityPreferences || ""
        );
        formData.append(
          "LandlordExpectation.RequiresPublicTransport",
          requiresPublicTransport
        );
        formData.append(
          "LandlordExpectation.RequiresShoppingAccess",
          requiresShoppingAccess
        );
        formData.append(
          "LandlordExpectation.RequiresSchoolAccess",
          requiresSchoolAccess
        );
        formData.append(
          "LandlordExpectation.RequiresHospitalAccess",
          requiresHospitalAccess
        );
        formData.append(
          "LandlordExpectation.AdditionalNotes",
          additionalNotes || ""
        );

        const response = await updateTenantProfile(formData).unwrap();
        console.log("Tenant profil güncelleme yanıtı:", response);

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert("Hata", response?.message || "Profil güncellenemedi.");
        }
      }

      // Reset image upload statuses
      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    } catch (error) {
      console.error("Profile update error:", error);

      if (error && error.data && error.data.errors) {
        let errorMessage = "API şu hataları döndürdü:\n";
        Object.entries(error.data.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            errorMessage += `• ${field}: ${messages.join(", ")}\n`;
          } else {
            errorMessage += `• ${field}: Geçersiz değer\n`;
          }
        });
        Alert.alert("Doğrulama Hatası", errorMessage);
      } else {
        Alert.alert(
          "Güncelleme Hatası",
          error?.data?.message ||
          "Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }

      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    }
  };

  // Render landlord form
  const renderLandlordForm = () => (
    <View>
      <FormSection title="Temel Bilgiler">
        <CustomDropdown
          label="Şehir"
          value={landlordCity}
          setValue={setLandlordCity}
          options={cities}
          placeholder="Şehir seçiniz"
          required
        />

        <CustomTextInput
          label="İlçe"
          value={landlordDistrict}
          onChangeText={setLandlordDistrict}
          placeholder="İlçe girin"
        />

        <CustomTextInput
          label="Kira Miktarı (₺)"
          value={rentAmount}
          onChangeText={setRentAmount}
          placeholder="Kira miktarı girin"
          keyboardType="numeric"
          required
        />
      </FormSection>

      <FormSection title="Aidat ve Depozito">
        <SwitchField
          label="Aidat Kiraya Dahil mi?"
          value={isMaintenanceFeeIncluded}
          setValue={setIsMaintenanceFeeIncluded}
        />

        {!isMaintenanceFeeIncluded && (
          <CustomTextInput
            label="Aidat Miktarı (₺)"
            value={maintenanceFee}
            onChangeText={setMaintenanceFee}
            placeholder="Aidat miktarı girin"
            keyboardType="numeric"
          />
        )}

        <CustomDropdown
          label="Aidat Sorumluluğu"
          value={maintenanceFeeResponsibility}
          setValue={setMaintenanceFeeResponsibility}
          options={maintenanceFeeResponsibilityOptions}
          placeholder="Aidat sorumluluğu seçin"
        />

        <SwitchField
          label="Depozito Gerekli mi?"
          value={isDepositRequired}
          setValue={setIsDepositRequired}
        />

        {isDepositRequired && (
          <CustomTextInput
            label="Depozito Miktarı (₺)"
            value={depositAmount}
            onChangeText={setDepositAmount}
            placeholder="Depozito miktarı girin"
            keyboardType="numeric"
          />
        )}
      </FormSection>

      <FormSection title="Kiralama Koşulları">
        <CustomDropdown
          label="Minimum Kiralama Süresi"
          value={minimumRentalPeriod}
          setValue={setMinimumRentalPeriod}
          options={rentalPeriodOptions}
          placeholder="Kiralama süresi seçin"
        />

        <SwitchField
          label="Kısa Dönem Kiralamaya Uygun mu?"
          value={isShortTermRentalAvailable}
          setValue={setIsShortTermRentalAvailable}
          description="1-2 aylık kısa dönem kiralama taleplerine açık mısınız?"
        />

        <SwitchField
          label="Yabancı Para Biriminde Ödeme Kabul Edilir mi?"
          value={isForeignCurrencyAccepted}
          setValue={setIsForeignCurrencyAccepted}
        />

        {isForeignCurrencyAccepted && (
          <CustomDropdown
            label="Tercih Edilen Para Birimi"
            value={preferredCurrency}
            setValue={setPreferredCurrency}
            options={currencyOptions}
            placeholder="Para birimi seçin"
          />
        )}

        <SwitchField
          label="Banka Havalesi Zorunlu mu?"
          value={isBankTransferRequired}
          setValue={setIsBankTransferRequired}
        />

        <CustomTextInput
          label="Maksimum Kiracı Sayısı"
          value={maximumOccupants}
          onChangeText={setMaximumOccupants}
          placeholder="Kişi sayısı girin"
          keyboardType="numeric"
        />
      </FormSection>

      <FormSection title="Kiracı Tercihleri">
        <CustomDropdown
          label="Evcil Hayvan Politikası"
          value={petPolicy}
          setValue={setPetPolicy}
          options={petPolicyOptions}
          placeholder="Evcil hayvan politikası seçin"
        />

        {petPolicy === "Sadece Küçük Hayvan" && (
          <CustomTextInput
            label="İzin Verilen Evcil Hayvan Türleri"
            value={acceptedPetTypes}
            onChangeText={setAcceptedPetTypes}
            placeholder="Örn: Kedi, küçük köpekler"
          />
        )}

        <CustomDropdown
          label="Öğrenci Politikası"
          value={studentPolicy}
          setValue={setStudentPolicy}
          options={studentPolicyOptions}
          placeholder="Öğrenci politikası seçin"
        />

        <SwitchField
          label="Sadece Aileler mi?"
          value={familyOnly}
          setValue={setFamilyOnly}
        />

        <SwitchField
          label="Çocuklu Aileler Kabul Edilir mi?"
          value={acceptChildrenFamily}
          setValue={setAcceptChildrenFamily}
        />

        <SwitchField
          label="Devlet Çalışanı Tercih Edilir mi?"
          value={preferGovernmentEmployee}
          setValue={setPreferGovernmentEmployee}
        />

        <SwitchField
          label="Gelir Belgesi İsteniyor mu?"
          value={isIncomeProofRequired}
          setValue={setIsIncomeProofRequired}
        />

        {isIncomeProofRequired && (
          <CustomTextInput
            label="Minimum Aylık Gelir (₺)"
            value={minimumMonthlyIncome}
            onChangeText={setMinimumMonthlyIncome}
            placeholder="Minimum gelir miktarı"
            keyboardType="numeric"
          />
        )}

        <SwitchField
          label="Kefil İsteniyor mu?"
          value={isGuarantorRequired}
          setValue={setIsGuarantorRequired}
        />

        <CustomDropdown
          label="Sigara Kullanımı Politikası"
          value={smokingPolicy}
          setValue={setSmokingPolicy}
          options={smokingPolicyOptions}
          placeholder="Sigara politikası seçin"
        />

        <SwitchField
          label="Referans İsteniyor mu?"
          value={isReferenceRequired}
          setValue={setIsReferenceRequired}
        />

        <SwitchField
          label="Sigortalı İş Gerekli mi?"
          value={isInsuredJobRequired}
          setValue={setIsInsuredJobRequired}
        />

        <CustomDropdown
          label="Bina Yönetimi Onay Politikası"
          value={buildingApprovalPolicy}
          setValue={setBuildingApprovalPolicy}
          options={buildingApprovalPolicyOptions}
          placeholder="Bina yönetimi politikası seçin"
        />
      </FormSection>
    </View>
  );

  // Render tenant form
  const renderTenantForm = () => (
    <View>
      <FormSection title="Konum Tercihleri">
        <CustomDropdown
          label="Şehir"
          value={tenantCity}
          setValue={setTenantCity}
          options={cities}
          placeholder="Şehir seçiniz"
          required
        />

        <CustomTextInput
          label="Tercih Edilen İlçe"
          value={tenantDistrict}
          onChangeText={setTenantDistrict}
          placeholder="Örn: Kadıköy"
        />

        <CustomTextInput
          label="Alternatif İlçeler"
          value={alternativeDistricts}
          onChangeText={setAlternativeDistricts}
          placeholder="Örn: Beşiktaş, Şişli"
        />

        <CustomTextInput
          label="Tercih Edilen Mahalleler"
          value={preferredNeighborhoods}
          onChangeText={setPreferredNeighborhoods}
          placeholder="Örn: Caferağa, Moda"
        />
      </FormSection>

      <FormSection title="Bütçe ve Ödeme">
        <CustomTextInput
          label="Minimum Kira Bütçesi (₺)"
          value={minRentBudget}
          onChangeText={setMinRentBudget}
          placeholder="Minimum kira bütçesi"
          keyboardType="numeric"
          required
        />
        <CustomTextInput
          label="Maksimum Kira Bütçesi (₺)"
          value={maxRentBudget}
          onChangeText={setMaxRentBudget}
          placeholder="Maksimum kira bütçesi"
          keyboardType="numeric"
          required
        />

        <CustomDropdown
          label="Aidat Sorumluluğu Tercihi"
          value={maintenanceFeePreference}
          setValue={setMaintenanceFeePreference}
          options={maintenanceFeeResponsibilityOptions}
          placeholder="Aidat sorumluluğu seçin"
        />

        <CustomTextInput
          label="Maksimum Aidat Miktarı (₺)"
          value={maxMaintenanceFee}
          onChangeText={setMaxMaintenanceFee}
          placeholder="Maksimum aidat miktarı"
          keyboardType="numeric"
        />

        <SwitchField
          label="Depozit Ödeyebilir misiniz?"
          value={canPayDeposit}
          setValue={setCanPayDeposit}
        />

        {canPayDeposit && (
          <CustomTextInput
            label="Maksimum Ödeyebileceğiniz Depozit (₺)"
            value={maxDepositAmount}
            onChangeText={setMaxDepositAmount}
            placeholder="Maksimum depozit miktarı"
            keyboardType="numeric"
          />
        )}

        <CustomDropdown
          label="Tercih Edilen Ödeme Yöntemi"
          value={preferredPaymentMethod}
          setValue={setPreferredPaymentMethod}
          options={paymentMethodOptions}
          placeholder="Ödeme yöntemi seçin"
        />
      </FormSection>

      <FormSection title="Emlak Özellikleri">
        <CustomTextInput
          label="Minimum Oda Sayısı"
          value={minRoomCount}
          onChangeText={setMinRoomCount}
          placeholder="Minimum oda sayısı"
          keyboardType="numeric"
        />

        <CustomTextInput
          label="Minimum Metrekare"
          value={minSquareMeters}
          onChangeText={setMinSquareMeters}
          placeholder="Minimum metrekare"
          keyboardType="numeric"
        />

        <CustomDropdown
          label="Eşya Durumu Tercihi"
          value={furnishedPreference}
          setValue={setFurnishedPreference}
          options={furnishedPreferenceOptions}
          placeholder="Eşya durumu seçin"
        />

        <CustomDropdown
          label="Tercih Edilen Isıtma Tipi"
          value={preferredHeatingType}
          setValue={setPreferredHeatingType}
          options={heatingTypeOptions}
          placeholder="Isıtma tipi seçin"
        />

        <CustomTextInput
          label="Maksimum Bina Yaşı"
          value={maxBuildingAge}
          onChangeText={setMaxBuildingAge}
          placeholder="Maksimum bina yaşı"
          keyboardType="numeric"
        />

        <CustomTextInput
          label="Tercih Edilen Kat Aralığı"
          value={preferredFloorRange}
          onChangeText={setPreferredFloorRange}
          placeholder="Örn: 2-5"
        />

        <SwitchField
          label="Asansör Gerekli mi?"
          value={requiresElevator}
          setValue={setRequiresElevator}
        />

        <SwitchField
          label="Balkon Gerekli mi?"
          value={requiresBalcony}
          setValue={setRequiresBalcony}
        />

        <SwitchField
          label="Otopark Gerekli mi?"
          value={requiresParking}
          setValue={setRequiresParking}
        />

        <SwitchField
          label="İnternet Bağlantısı Gerekli mi?"
          value={requiresInternet}
          setValue={setRequiresInternet}
        />

        <SwitchField
          label="Bahçe Gerekli mi?"
          value={requiresGarden}
          setValue={setRequiresGarden}
        />
      </FormSection>

      <FormSection title="Kiralama Süresi">
        <CustomDropdown
          label="Tercih Edilen Kiralama Süresi"
          value={preferredRentalPeriod}
          setValue={setPreferredRentalPeriod}
          options={rentalPeriodOptions}
          placeholder="Kiralama süresi seçin"
        />

        <CustomDatePicker
          label="En Erken Taşınma Tarihi"
          value={earliestMoveInDate}
          setValue={setEarliestMoveInDate}
        />

        <SwitchField
          label="Kısa Dönem Kiralama Tercih Edilir mi?"
          value={preferShortTerm}
          setValue={setPreferShortTerm}
          description="1-2 aylık kısa dönem kiralamayı tercih eder misiniz?"
        />
      </FormSection>

      <FormSection title="Kişisel Bilgiler">
        <CustomTextInput
          label="Kiralayacak Kişi Sayısı"
          value={occupantCount}
          onChangeText={setOccupantCount}
          placeholder="Kişi sayısı"
          keyboardType="numeric"
        />

        <SwitchField
          label="Evcil Hayvanınız Var mı?"
          value={hasPets}
          setValue={setHasPets}
        />

        {hasPets && (
          <CustomTextInput
            label="Evcil Hayvan Türleri"
            value={petTypes}
            onChangeText={setPetTypes}
            placeholder="Örn: Kedi, küçük köpek"
          />
        )}

        <SwitchField
          label="Öğrenci misiniz?"
          value={isStudent}
          setValue={setIsStudent}
        />

        <CustomTextInput
          label="Meslek"
          value={occupation}
          onChangeText={setOccupation}
          placeholder="Mesleğinizi belirtin"
        />

        <SwitchField
          label="Aile misiniz?"
          value={isFamily}
          setValue={setIsFamily}
        />

        {isFamily && (
          <>
            <SwitchField
              label="Çocuğunuz Var mı?"
              value={hasChildren}
              setValue={setHasChildren}
            />

            {hasChildren && (
              <CustomTextInput
                label="Çocuk Sayısı"
                value={childrenCount}
                onChangeText={setChildrenCount}
                placeholder="Çocuk sayısı"
                keyboardType="numeric"
              />
            )}
          </>
        )}

        <SwitchField
          label="Sigara Kullanıyor musunuz?"
          value={isSmoker}
          setValue={setIsSmoker}
        />

        <SwitchField
          label="Sigortalı Bir İşiniz Var mı?"
          value={hasInsuredJob}
          setValue={setHasInsuredJob}
        />

        <SwitchField
          label="Kefil Sağlayabilir misiniz?"
          value={canProvideGuarantor}
          setValue={setCanProvideGuarantor}
        />

        <CustomTextInput
          label="Aylık Gelir (₺)"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          placeholder="Aylık geliriniz"
          keyboardType="numeric"
        />

        <SwitchField
          label="Referans Sağlayabilir misiniz?"
          value={canProvideReference}
          setValue={setCanProvideReference}
        />
      </FormSection>

      <FormSection title="Tercihler ve Beklentiler">
        <CustomDropdown
          label="Komşuluk İlişkisi Tercihi"
          value={neighborRelationPreference}
          setValue={setNeighborRelationPreference}
          options={neighborRelationOptions}
          placeholder="Komşuluk ilişkisi seçin"
        />

        <CustomDropdown
          label="Gürültü Tercihi"
          value={noisePreference}
          setValue={setNoisePreference}
          options={noisePreferenceOptions}
          placeholder="Gürültü tercihi seçin"
        />

        <CustomTextInput
          label="Güvenlik Tercihleri"
          value={securityPreferences}
          onChangeText={setSecurityPreferences}
          placeholder="Örn: 7/24 güvenlik, kamera sistemi"
        />

        <SwitchField
          label="Toplu Taşıma Erişimi Gerekli mi?"
          value={requiresPublicTransport}
          setValue={setRequiresPublicTransport}
        />

        <SwitchField
          label="Alışveriş Merkezi Erişimi Gerekli mi?"
          value={requiresShoppingAccess}
          setValue={setRequiresShoppingAccess}
        />

        <SwitchField
          label="Okul/Eğitim Kurumu Erişimi Gerekli mi?"
          value={requiresSchoolAccess}
          setValue={setRequiresSchoolAccess}
        />

        <SwitchField
          label="Hastane Erişimi Gerekli mi?"
          value={requiresHospitalAccess}
          setValue={setRequiresHospitalAccess}
        />

        <CustomTextInput
          label="Ek Notlar"
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          placeholder="Belirtmek istediğiniz diğer tercihler"
          multiline
          numberOfLines={4}
        />
      </FormSection>
    </View>
  );

  // Loading state
  if ((profileLoading || expectationsLoading) && !userProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-base text-gray-500">
          Profil yükleniyor...
        </Text>
      </View>
    );
  }

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <EditProfileHeader
          navigation={navigation}
          onSave={handleSaveProfile}
          isLoading={isLoading}
        />

        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile image and cover photo section */}
          <View className="relative mb-6 mt-4 px-5">
            {/* Profile picture container - ortalanmış */}
            <TouchableOpacity
              activeOpacity={1}
              className="overflow-hidden justify-center items-center"
              onPress={() => handleImageSelection("profile")}
            >
              {previewProfileImage ? (
                <View className="w-36 h-36 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                  <Image
                    source={{ uri: previewProfileImage }}
                    className="w-full h-full"
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                  {/* Profile photo edit button */}
                  <View
                    style={{ boxShadow: "0px 0px 12px #00000014" }}
                    className="absolute right-[-12] bottom-[-12] bg-green-600 w-8 h-8 rounded-full justify-center items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                  </View>
                </View>
              ) : (
                <View className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md justify-center items-center">
                  <Text className="text-gray-600 text-3xl font-bold">
                    {currentUser?.name?.charAt(0) || "P"}
                  </Text>
                  {/* Add profile photo button */}
                  <View
                    style={{ boxShadow: "0px 0px 12px #00000014" }}
                    className="absolute right-[-12] bottom-[-12] bg-green-600 w-8 h-8 rounded-full justify-center items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <View className="px-5 py-4">
            {/* Render appropriate form based on user role */}
            {userRole === "EVSAHIBI"
              ? renderLandlordForm()
              : renderTenantForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      // 4. Eski modal kodunu değiştir:
      {/* ImagePickerModal */}
      <ImagePickerModal
        isVisible={isImagePickerVisible}
        onClose={() => setIsImagePickerVisible(false)}
        onGallery={pickImageFromGallery}
        onCamera={takePhoto}
        onRemove={removeImage}
        hasCurrentImage={activeImageType === "profile" ? !!previewProfileImage : !!previewCoverImage}
        imageType={activeImageType}
      />

    </View>
  );
};

// Styles similar to ProfileExpectation
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
});

export default EditProfileScreen;
