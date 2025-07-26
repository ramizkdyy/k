import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  Dimensions,
  Pressable,
  StyleSheet, // Yeni eklendi
  TouchableWithoutFeedback, // Yeni eklendi
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useCreateLandlordExpectationMutation,
  useCreateTenantExpectationMutation,
  useUpdateLandlordExpectationMutation,
  useUpdateTenantExpectationMutation,
} from "../redux/api/apiSlice";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faChevronLeft,
  faChevronDown,
  faCalendar,
  faCheck,
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
import {
  getCities,
  getDistrictsAndNeighbourhoodsByCityCode,
  isCityCode,
  getCityCodes,
} from "turkey-neighbourhoods";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ProfileExpectationHeader = ({
  navigation,
  isExpectationCompleted,
  onSubmit,
  onUpdate,
  isLoading,
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

      {/* Sağ taraf - Submit/Update butonu */}
      {isExpectationCompleted ? (
        <TouchableOpacity
          className="bg-blue-400 px-6 py-3 rounded-lg items-center justify-center"
          onPress={onUpdate}
          disabled={isLoading}
        >
          <Text
            style={{ fontSize: 14 }}
            className="text-gray-900 font-semibold"
          >
            {isLoading ? "Güncelleniyor..." : "Güncelle"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="px-1 items-center justify-center"
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text
            style={{ fontSize: 16, color: "#6aeba9", borderColor: "#6aeba9" }}
            className="font-semibold border px-4 py-2 rounded-full"
          >
            {isLoading ? "Oluşturuluyor..." : "Oluştur"}
          </Text>
        </TouchableOpacity>
      )}
    </View>

    {/* Ortalanmış başlık - Absolute positioning ile */}
    <View className="absolute inset-0 justify-center items-center pointer-events-none">
      <Text
        className="text-gray-500"
        style={{
          fontWeight: 500,
          fontSize: 14,
        }}
      >
        Beklenti Profili
      </Text>
    </View>
  </View>
);

// Form section component
const FormSection = ({ title, children }) => (
  <View className="mb-8">
    <Text
      style={{ fontSize: 12, marginBottom: 50 }}
      className=" font-semibold text-gray-500 text-center"
    >
      {title}
    </Text>
    {children}
  </View>
);

// TextInput Component
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
    <Text
      style={{ fontSize: 14 }}
      className=" font-semibold text-gray-900 mb-3"
    >
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

// Switch field component
const SwitchField = ({ label, value, setValue, description = null }) => (
  <View className="mb-6">
    <View className="flex-row justify-between items-center">
      <View className="flex-1 mr-4">
        <Text style={{ fontSize: 14 }} className=" text-gray-900 font-semibold">
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
  disabled = false, // Yeni prop
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Modal boyutları - Seçenek sayısına göre dinamik yükseklik (padding düzeltildi)
  const getModalHeight = () => {
    const headerHeight = 80; // Header + handle (padding azaltıldı)
    const itemHeight = 50; // Her seçenek için yaklaşık yükseklik
    const bottomPadding = 40; // Alt boşluk (azaltıldı)
    const minHeight = SCREEN_HEIGHT * 0.25; // Minimum %25 (azaltıldı)
    const maxHeight = SCREEN_HEIGHT * 0.6; // Maximum %75

    const calculatedHeight =
      headerHeight + options.length * itemHeight + bottomPadding;

    // Az seçenek varsa (3 veya daha az) küçük modal
    if (options.length <= 3) {
      return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.35); // %40 -> %35
    }

    // Orta seçenek sayısı (4-7) için orta boyut
    if (options.length <= 7) {
      return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.55); // %60 -> %55
    }

    // Çok seçenek varsa maksimum boyut
    return maxHeight;
  };

  const SNAP_POINTS = {
    CLOSED: SCREEN_HEIGHT,
    OPEN: SCREEN_HEIGHT - getModalHeight(),
  };

  // Animated values - PropertiesFilterModal'daki gibi
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Modal açılış/kapanış animasyonu - PropertiesFilterModal'daki gibi
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

  // Close handler - PropertiesFilterModal'daki gibi
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

  // Animated styles - PropertiesFilterModal'daki gibi
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

      {/* Modal - PropertiesFilterModal'daki gibi yapı */}
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={handleClose}
        >
          <GestureHandlerRootView style={styles.container}>
            {/* Backdrop - PropertiesFilterModal'daki gibi */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
              <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <View style={styles.backdropTouchable} />
              </TouchableWithoutFeedback>
            </Animated.View>

            {/* Modal Content - Scroll için optimize edilmiş */}
            <Animated.View style={[styles.modal, modalStyle]}>
              {/* Header - Sabit */}
              <View className="py-4 px-6 border-b border-gray-100 bg-white">
                {/* <View className="w-10 h-1 bg-gray-300 rounded-sm mb-3 self-center" /> */}
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

              {/* Scrollable Options - Dinamik scroll davranışı */}
              <ScrollView
                className="flex-1"
                style={{
                  backgroundColor: "white",
                  maxHeight:
                    options.length <= 3 ? undefined : SCREEN_HEIGHT * 0.5, // Az seçenek varsa scroll yok
                }}
                showsVerticalScrollIndicator={options.length > 5} // 5'ten fazla seçenek varsa indicator
                bounces={options.length > 3} // Az seçenek varsa bounce yok
                scrollEnabled={options.length > 3} // Az seçenek varsa scroll kapalı
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: options.length <= 3 ? 5 : 15, // Padding azaltıldı
                  justifyContent:
                    options.length <= 3 ? "flex-start" : "flex-start", // Center kaldırıldı
                  flexGrow: 0, // FlexGrow kaldırıldı - seçeneklerin gözükmesini engelliyor
                }}
              >
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`py-4 px-7 flex-row items-center justify-between ${
                      index !== options.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    } ${value === option ? "bg-gray-100" : "bg-white"}`}
                    onPress={() => handleOptionSelect(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-lg flex-1 mr-3 ${
                        value === option
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
                        color="#16a34a"
                      />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Sadece çok seçenek varsa minimal bottom spacing */}
                {options.length > 7 && <View className="h-2" />}
              </ScrollView>
            </Animated.View>
          </GestureHandlerRootView>
        </Modal>
      )}
    </View>
  );
};

// Date picker component
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
      <Text className="text-lg font-semibold text-gray-800 mb-3">
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

const ProfileExpectationScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");

  // Turkey-neighbourhoods için yeni state'ler
  const [allCities, setAllCities] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [cityCodeMap, setCityCodeMap] = useState({}); // Şehir adı -> kod mapping

  // Component mount olduğunda çalışacak
  useEffect(() => {
    loadAllTurkeyCities();
  }, []);

  // Şehir seçildiğinde ilçeleri yükle
  useEffect(() => {
    if (city) {
      loadDistrictsForCity(city);
      setDistrict("");
    } else {
      setDistrictOptions([]);
      setDistrict("");
    }
  }, [city]);

  // Tüm Türkiye şehirlerini yükle
  const loadAllTurkeyCities = () => {
    try {
      // turkey-neighbourhoods paketinden şehirleri al
      const cities = getCities(); // [{code: "01", name: "Adana"}, ...]

      if (cities && Array.isArray(cities)) {
        const cityNames = cities
          .map((city) => city.name)
          .sort((a, b) => a.localeCompare(b, "tr"));
        setAllCities(cityNames);

        // Şehir adı -> kod mapping oluştur
        const codeMap = {};
        cities.forEach((city) => {
          codeMap[city.name] = city.code;
        });
        setCityCodeMap(codeMap);

        console.log(`Toplam ${cityNames.length} şehir yüklendi`);
      } else {
        throw new Error("Cities array not found");
      }
    } catch (error) {
      console.error("Şehirler yüklenirken hata:", error);
      // Hata durumunda fallback liste kullan
      loadFallbackCities();
    }
  };

  // Fallback şehir listesi
  const loadFallbackCities = () => {
    const fallbackCities = [
      "Adana",
      "Adıyaman",
      "Afyonkarahisar",
      "Ağrı",
      "Aksaray",
      "Amasya",
      "Ankara",
      "Antalya",
      "Ardahan",
      "Artvin",
      "Aydın",
      "Balıkesir",
      "Bartın",
      "Batman",
      "Bayburt",
      "Bilecik",
      "Bingöl",
      "Bitlis",
      "Bolu",
      "Burdur",
      "Bursa",
      "Çanakkale",
      "Çankırı",
      "Çorum",
      "Denizli",
      "Diyarbakır",
      "Düzce",
      "Edirne",
      "Elazığ",
      "Erzincan",
      "Erzurum",
      "Eskişehir",
      "Gaziantep",
      "Giresun",
      "Gümüşhane",
      "Hakkâri",
      "Hatay",
      "Iğdır",
      "Isparta",
      "İstanbul",
      "İzmir",
      "Kahramanmaraş",
      "Karabük",
      "Karaman",
      "Kars",
      "Kastamonu",
      "Kayseri",
      "Kırıkkale",
      "Kırklareli",
      "Kırşehir",
      "Kilis",
      "Kocaeli",
      "Konya",
      "Kütahya",
      "Malatya",
      "Manisa",
      "Mardin",
      "Mersin",
      "Muğla",
      "Muş",
      "Nevşehir",
      "Niğde",
      "Ordu",
      "Osmaniye",
      "Rize",
      "Sakarya",
      "Samsun",
      "Siirt",
      "Sinop",
      "Sivas",
      "Şanlıurfa",
      "Şırnak",
      "Tekirdağ",
      "Tokat",
      "Trabzon",
      "Tunceli",
      "Uşak",
      "Van",
      "Yalova",
      "Yozgat",
      "Zonguldak",
    ];
    setAllCities(fallbackCities);
  };

  // Seçilen şehrin ilçelerini yükle
  const loadDistrictsForCity = (selectedCity) => {
    try {
      // Şehir kodunu bul
      const cityCode = cityCodeMap[selectedCity];

      if (!cityCode) {
        console.log(`${selectedCity} için şehir kodu bulunamadı`);
        setDistrictOptions([]);
        return;
      }

      // turkey-neighbourhoods paketinden ilçeleri al
      const districtsData = getDistrictsAndNeighbourhoodsByCityCode(cityCode);

      if (districtsData && typeof districtsData === "object") {
        const districtNames = Object.keys(districtsData).sort((a, b) =>
          a.localeCompare(b, "tr")
        );
        setDistrictOptions(districtNames);
        console.log(
          `${selectedCity} için ${districtNames.length} ilçe yüklendi`
        );
      } else {
        setDistrictOptions([]);
        console.log(`${selectedCity} için ilçe bulunamadı`);
      }
    } catch (error) {
      console.error("İlçeler yüklenirken hata:", error);
      setDistrictOptions([]);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: "none" },
        });
      }

      // Show tabs when leaving this screen
      return () => {
        if (parent) {
          // Restore the appropriate tab bar style based on user role
          if (userRole === "EVSAHIBI") {
            // Landlord tab bar style
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
            // Tenant tab bar style
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

  // Check if expectation is completed based on user role
  const isExpectationCompleted =
    Boolean(currentUser?.isTenantExpectationCompleted) ||
    Boolean(currentUser?.isLandlordExpectationCompleted);

  console.log("isExpectationCompleted:", isExpectationCompleted);

  // Common state

  // State for Landlord Expectations (EVSAHIBI)
  const [rentAmount, setRentAmount] = useState("5000");
  const [isMaintenanceFeeIncluded, setIsMaintenanceFeeIncluded] =
    useState(false);
  const [maintenanceFee, setMaintenanceFee] = useState("0");
  const [maintenanceFeeResponsibility, setMaintenanceFeeResponsibility] =
    useState(1);
  const [isDepositRequired, setIsDepositRequired] = useState(true);
  const [depositAmount, setDepositAmount] = useState("5000");
  const [minimumRentalPeriod, setMinimumRentalPeriod] = useState(1);
  const [isShortTermRentalAvailable, setIsShortTermRentalAvailable] =
    useState(false);
  const [isForeignCurrencyAccepted, setIsForeignCurrencyAccepted] =
    useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState(1);
  const [isBankTransferRequired, setIsBankTransferRequired] = useState(false);
  const [maximumOccupants, setMaximumOccupants] = useState("2");
  const [petPolicy, setPetPolicy] = useState(1);
  const [acceptedPetTypes, setAcceptedPetTypes] = useState("");
  const [studentPolicy, setStudentPolicy] = useState(1);
  const [familyOnly, setFamilyOnly] = useState(false);
  const [acceptChildrenFamily, setAcceptChildrenFamily] = useState(true);
  const [preferGovernmentEmployee, setPreferGovernmentEmployee] =
    useState(false);
  const [isIncomeProofRequired, setIsIncomeProofRequired] = useState(false);
  const [minimumMonthlyIncome, setMinimumMonthlyIncome] = useState("0");
  const [isGuarantorRequired, setIsGuarantorRequired] = useState(false);
  const [smokingPolicy, setSmokingPolicy] = useState(1);
  const [isReferenceRequired, setIsReferenceRequired] = useState(false);
  const [isInsuredJobRequired, setIsInsuredJobRequired] = useState(false);
  const [buildingApprovalPolicy, setBuildingApprovalPolicy] = useState(1);

  // State for Tenant Expectations (KIRACI)
  const [alternativeDistricts, setAlternativeDistricts] = useState("");
  const [preferredNeighborhoods, setPreferredNeighborhoods] = useState("");
  const [minRentBudget, setMinRentBudget] = useState("3000");
  const [maxRentBudget, setMaxRentBudget] = useState("8000");
  const [tenantMaintenancePreference, setTenantMaintenancePreference] =
    useState(1);
  const [maxMaintenanceFee, setMaxMaintenanceFee] = useState("0");
  const [canPayDeposit, setCanPayDeposit] = useState(true);
  const [maxDepositAmount, setMaxDepositAmount] = useState("6000");
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(1);
  const [minRoomCount, setMinRoomCount] = useState("1");
  const [minSquareMeters, setMinSquareMeters] = useState("60");
  const [furnishedPreference, setFurnishedPreference] = useState(1);
  const [preferredHeatingType, setPreferredHeatingType] = useState(1);
  const [maxBuildingAge, setMaxBuildingAge] = useState("10");
  const [preferredFloorRange, setPreferredFloorRange] = useState("");
  const [requiresElevator, setRequiresElevator] = useState(false);
  const [requiresBalcony, setRequiresBalcony] = useState(false);
  const [requiresParking, setRequiresParking] = useState(false);
  const [requiresInternet, setRequiresInternet] = useState(true);
  const [requiresGarden, setRequiresGarden] = useState(false);
  const [preferredRentalPeriod, setPreferredRentalPeriod] = useState(1);
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
    useState(1);
  const [noisePreference, setNoisePreference] = useState(1);
  const [securityPreferences, setSecurityPreferences] = useState("");
  const [requiresPublicTransport, setRequiresPublicTransport] = useState(true);
  const [requiresShoppingAccess, setRequiresShoppingAccess] = useState(true);
  const [requiresSchoolAccess, setRequiresSchoolAccess] = useState(false);
  const [requiresHospitalAccess, setRequiresHospitalAccess] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Mutations - Import update mutations from API
  const [createLandlordExpectation, { isLoading: landlordIsLoading }] =
    useCreateLandlordExpectationMutation();
  const [createTenantExpectation, { isLoading: tenantIsLoading }] =
    useCreateTenantExpectationMutation();
  const [updateLandlordExpectation, { isLoading: updateLandlordIsLoading }] =
    useUpdateLandlordExpectationMutation();
  const [updateTenantExpectation, { isLoading: updateTenantIsLoading }] =
    useUpdateTenantExpectationMutation();

  const isLoading =
    landlordIsLoading ||
    tenantIsLoading ||
    updateLandlordIsLoading ||
    updateTenantIsLoading;
  // Tüm Türkiye şehirlerini yükle

  const cityOptions = allCities;

  const maintenanceFeeResponsibilityOptions = [
    "Kiracıya Ait", // 1
    "Ev Sahibine Ait", // 2
    "Ortak Ödeme", // 3
  ];

  const rentalPeriodOptions = [
    "6 Ay", // 1
    "1 Yıl", // 2
    "Uzun Vadeli (1+ Yıl)", // 3
    "Kısa Dönem Olabilir", // 4
  ];

  const petPolicyOptions = [
    "Evet, Kabul Ediyorum", // 1
    "Hayır, Kabul Etmiyorum", // 2
    "Sadece Küçük Hayvan", // 3
  ];

  const studentPolicyOptions = [
    "Evet, Kabul Ediyorum", // 1
    "Hayır, Kabul Etmiyorum", // 2
    "Referanslı Öğrenci Olabilir", // 3
  ];

  const smokingPolicyOptions = [
    "Evet, İzin Veriyorum", // 1
    "Hayır, İzin Vermiyorum", // 2
    "Sadece Balkonda İçilebilir", // 3
  ];

  const buildingApprovalPolicyOptions = [
    "Evet, Önemli", // 1
    "Hayır, Önemli Değil", // 2
    "Ortak Karar Alınacak", // 3
  ];

  const currencyOptions = [
    "TL", // 1
    "USD (Amerikan Doları)", // 2
    "EUR (Euro)", // 3
    "GBP (İngiliz Sterlini)", // 4
  ];

  const paymentMethodOptions = [
    "Banka Havalesi", // 1
    "Nakit Ödeme", // 2
    "Çek", // 3
    "Fark Etmez", // 4
  ];

  const furnishedPreferenceOptions = [
    "Mobilyalı Olmalı", // 1
    "Mobilyasız Olmalı", // 2
    "Kısmen Mobilyalı Olabilir", // 3
    "Fark Etmez", // 4
  ];

  const heatingTypeOptions = [
    "Doğalgaz Kombi", // 1
    "Merkezi Sistem", // 2
    "Elektrikli Isıtma", // 3
    "Soba", // 4
    "Fark Etmez", // 5
  ];

  const neighborRelationOptions = [
    "Yakın İlişki", // 1
    "Mesafeli İlişki", // 2
    "Fark Etmez", // 3
  ];

  const noisePreferenceOptions = [
    "Sessiz Olmalı", // 1
    "Normal Seviyede Olabilir", // 2
    "Fark Etmez", // 3
  ];

  const renderLandlordForm = () => (
    <View>
      <FormSection title="Temel Bilgiler">
        <CustomDropdown
          label="Şehir"
          value={city}
          setValue={setCity}
          options={cityOptions}
          placeholder="Şehir seçiniz"
          required
        />

        <CustomDropdown
          label="İlçe"
          value={district}
          setValue={setDistrict}
          options={districtOptions}
          placeholder={city ? "İlçe seçiniz" : "Önce şehir seçiniz"}
          disabled={!city || districtOptions.length === 0}
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
          value={
            maintenanceFeeResponsibilityOptions[
              maintenanceFeeResponsibility - 1
            ]
          }
          setValue={(value) => {
            const index = maintenanceFeeResponsibilityOptions.indexOf(value);
            setMaintenanceFeeResponsibility(index !== -1 ? index + 1 : 1);
          }}
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
          value={rentalPeriodOptions[minimumRentalPeriod - 1]}
          setValue={(value) => {
            const index = rentalPeriodOptions.indexOf(value);
            setMinimumRentalPeriod(index !== -1 ? index + 1 : 1);
          }}
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
            value={currencyOptions[preferredCurrency - 1]}
            setValue={(value) => {
              const index = currencyOptions.indexOf(value);
              setPreferredCurrency(index !== -1 ? index + 1 : 1);
            }}
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
          value={petPolicyOptions[petPolicy - 1]}
          setValue={(value) => {
            const index = petPolicyOptions.indexOf(value);
            setPetPolicy(index !== -1 ? index + 1 : 1);
          }}
          options={petPolicyOptions}
          placeholder="Evcil hayvan politikası seçin"
        />

        {petPolicy === 2 && (
          <CustomTextInput
            label="İzin Verilen Evcil Hayvan Türleri"
            value={acceptedPetTypes}
            onChangeText={setAcceptedPetTypes}
            placeholder="Örn: Kedi, küçük köpekler"
          />
        )}

        <CustomDropdown
          label="Öğrenci Politikası"
          value={studentPolicyOptions[studentPolicy - 1]}
          setValue={(value) => {
            const index = studentPolicyOptions.indexOf(value);
            setStudentPolicy(index !== -1 ? index + 1 : 1);
          }}
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
          value={smokingPolicyOptions[smokingPolicy - 1]}
          setValue={(value) => {
            const index = smokingPolicyOptions.indexOf(value);
            setSmokingPolicy(index !== -1 ? index + 1 : 1);
          }}
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
          value={buildingApprovalPolicyOptions[buildingApprovalPolicy - 1]}
          setValue={(value) => {
            const index = buildingApprovalPolicyOptions.indexOf(value);
            setBuildingApprovalPolicy(index !== -1 ? index + 1 : 1);
          }}
          options={buildingApprovalPolicyOptions}
          placeholder="Bina yönetimi politikası seçin"
        />
      </FormSection>
    </View>
  );

  const renderTenantForm = () => (
    <View>
      <FormSection title="Konum Tercihleri">
        <CustomDropdown
          label="Şehir"
          value={city}
          setValue={setCity}
          options={cityOptions} // Artık tüm Türkiye şehirleri
          placeholder="Şehir seçiniz"
          required
        />

        <CustomDropdown
          label="Tercih Edilen İlçe"
          value={district}
          setValue={setDistrict}
          options={districtOptions} // Seçilen şehrin ilçeleri
          placeholder={city ? "İlçe seçiniz" : "Önce şehir seçiniz"}
          disabled={!city || districtOptions.length === 0}
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
          value={
            maintenanceFeeResponsibilityOptions[tenantMaintenancePreference - 1]
          }
          setValue={(value) => {
            const index = maintenanceFeeResponsibilityOptions.indexOf(value);
            setTenantMaintenancePreference(index !== -1 ? index + 1 : 1);
          }}
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
          value={paymentMethodOptions[preferredPaymentMethod - 1]}
          setValue={(value) => {
            const index = paymentMethodOptions.indexOf(value);
            setPreferredPaymentMethod(index !== -1 ? index + 1 : 1);
          }}
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
          value={furnishedPreferenceOptions[furnishedPreference - 1]}
          setValue={(value) => {
            const index = furnishedPreferenceOptions.indexOf(value);
            setFurnishedPreference(index !== -1 ? index + 1 : 1);
          }}
          options={furnishedPreferenceOptions}
          placeholder="Eşya durumu seçin"
        />

        <CustomDropdown
          label="Tercih Edilen Isıtma Tipi"
          value={heatingTypeOptions[preferredHeatingType - 1]}
          setValue={(value) => {
            const index = heatingTypeOptions.indexOf(value);
            setPreferredHeatingType(index !== -1 ? index + 1 : 1);
          }}
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
          value={rentalPeriodOptions[preferredRentalPeriod - 1]}
          setValue={(value) => {
            const index = rentalPeriodOptions.indexOf(value);
            setPreferredRentalPeriod(index !== -1 ? index + 1 : 1);
          }}
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
          value={neighborRelationOptions[neighborRelationPreference - 1]}
          setValue={(value) => {
            const index = neighborRelationOptions.indexOf(value);
            setNeighborRelationPreference(index !== -1 ? index + 1 : 1);
          }}
          options={neighborRelationOptions}
          placeholder="Komşuluk ilişkisi seçin"
        />

        <CustomDropdown
          label="Gürültü Tercihi"
          value={noisePreferenceOptions[noisePreference - 1]}
          setValue={(value) => {
            const index = noisePreferenceOptions.indexOf(value);
            setNoisePreference(index !== -1 ? index + 1 : 1);
          }}
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

  // Add this to your ProfileExpectationScreen component
  // Replace the existing handleSubmit function

  const handleSubmit = async () => {
    // VALIDATION: Ensure we have current user data
    if (!currentUser || !currentUser.id) {
      console.error("No current user found in Redux state:", currentUser);
      Alert.alert(
        "Hata",
        "Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.",
        [
          {
            text: "Tamam",
            onPress: () => {
              // Navigate back to login or role selection
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" }],
              });
            },
          },
        ]
      );
      return;
    }

    // VALIDATION: Ensure we have user role
    if (!userRole) {
      console.error("No user role found:", { userRole, currentUser });
      Alert.alert(
        "Hata",
        "Kullanıcı rolü bulunamadı. Lütfen rol seçimini tekrar yapın."
      );
      return;
    }

    console.log("Starting expectation submission:", {
      userId: currentUser.id,
      userRole,
      userName: currentUser.userName || currentUser.email,
      currentUserData: currentUser,
    });

    try {
      if (userRole === "EVSAHIBI") {
        // Create landlord expectations
        const expectationData = {
          userId: currentUser.id, // Use the current user ID explicitly
          city,
          district,
          rentAmount: parseFloat(rentAmount) || 0,
          isMaintenanceFeeIncluded,
          maintenanceFee: parseFloat(maintenanceFee) || 0,
          maintenanceFeeResponsibility,
          isDepositRequired,
          depositAmount: parseFloat(depositAmount) || 0,
          minimumRentalPeriod,
          isShortTermRentalAvailable,
          isForeignCurrencyAccepted,
          preferredCurrency,
          isBankTransferRequired,
          maximumOccupants: parseInt(maximumOccupants) || 0,
          petPolicy,
          acceptedPetTypes,
          studentPolicy,
          familyOnly,
          acceptChildrenFamily,
          preferGovernmentEmployee,
          isIncomeProofRequired,
          minimumMonthlyIncome: parseFloat(minimumMonthlyIncome) || 0,
          isGuarantorRequired,
          smokingPolicy,
          isReferenceRequired,
          isInsuredJobRequired,
          buildingApprovalPolicy,
        };

        console.log("Sending landlord expectation data:", expectationData);

        const response = await createLandlordExpectation(
          expectationData
        ).unwrap();

        console.log("Landlord expectation response:", response);

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Beklenti profili başarıyla oluşturuldu", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          console.error("Landlord expectation creation failed:", response);
          Alert.alert(
            "Hata",
            response?.message || "Beklenti profili oluşturulamadı"
          );
        }
      } else if (userRole === "KIRACI") {
        // Create tenant expectations
        const expectationData = {
          userId: currentUser.id, // Use the current user ID explicitly
          city,
          district,
          alternativeDistricts,
          preferredNeighborhoods,
          minRentBudget: parseFloat(minRentBudget) || 0,
          maxRentBudget: parseFloat(maxRentBudget) || 0,
          maintenanceFeePreference: tenantMaintenancePreference,
          maxMaintenanceFee: parseFloat(maxMaintenanceFee) || 0,
          canPayDeposit,
          maxDepositAmount: parseFloat(maxDepositAmount) || 0,
          preferredPaymentMethod,
          minRoomCount: parseInt(minRoomCount) || 0,
          minSquareMeters: parseInt(minSquareMeters) || 0,
          furnishedPreference,
          preferredHeatingType,
          maxBuildingAge: parseInt(maxBuildingAge) || 0,
          preferredFloorRange,
          requiresElevator,
          requiresBalcony,
          requiresParking,
          requiresInternet,
          requiresGarden,
          preferredRentalPeriod,
          earliestMoveInDate: earliestMoveInDate.toISOString(),
          preferShortTerm,
          occupantCount: parseInt(occupantCount) || 0,
          hasPets,
          petTypes,
          isStudent,
          occupation,
          isFamily,
          hasChildren,
          childrenCount: parseInt(childrenCount) || 0,
          isSmoker,
          hasInsuredJob,
          canProvideGuarantor,
          monthlyIncome: parseFloat(monthlyIncome) || 0,
          canProvideReference,
          neighborRelationPreference,
          noisePreference,
          securityPreferences,
          requiresPublicTransport,
          requiresShoppingAccess,
          requiresSchoolAccess,
          requiresHospitalAccess,
          additionalNotes,
        };

        console.log("Sending tenant expectation data:", expectationData);

        const response = await createTenantExpectation(
          expectationData
        ).unwrap();

        console.log("Tenant expectation response:", response);

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Beklenti profili başarıyla oluşturuldu", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          console.error("Tenant expectation creation failed:", response);
          Alert.alert(
            "Hata",
            response?.message || "Beklenti profili oluşturulamadı"
          );
        }
      }
    } catch (error) {
      console.error("Beklenti profili oluşturma hatası:", {
        error,
        errorData: error?.data,
        currentUser,
        userRole,
      });

      Alert.alert(
        "Hata",
        error?.data?.message ||
          error?.message ||
          "Beklenti profili oluşturulurken bir hata oluştu"
      );
    }
  };

  const handleUpdate = async () => {
    try {
      if (userRole === "EVSAHIBI") {
        // Update landlord expectations
        const expectationData = {
          userId: currentUser.id,
          city,
          district,
          rentAmount: parseFloat(rentAmount) || 0,
          isMaintenanceFeeIncluded,
          maintenanceFee: parseFloat(maintenanceFee) || 0,
          maintenanceFeeResponsibility,
          isDepositRequired,
          depositAmount: parseFloat(depositAmount) || 0,
          minimumRentalPeriod,
          isShortTermRentalAvailable,
          isForeignCurrencyAccepted,
          preferredCurrency,
          isBankTransferRequired,
          maximumOccupants: parseInt(maximumOccupants) || 0,
          petPolicy,
          acceptedPetTypes,
          studentPolicy,
          familyOnly,
          acceptChildrenFamily,
          preferGovernmentEmployee,
          isIncomeProofRequired,
          minimumMonthlyIncome: parseFloat(minimumMonthlyIncome) || 0,
          isGuarantorRequired,
          smokingPolicy,
          isReferenceRequired,
          isInsuredJobRequired,
          buildingApprovalPolicy,
        };

        const response = await updateLandlordExpectation(
          expectationData
        ).unwrap();

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Beklenti profili başarıyla güncellendi", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert(
            "Hata",
            response?.message || "Beklenti profili güncellenemedi"
          );
        }
      } else if (userRole === "KIRACI") {
        // Update tenant expectations
        const expectationData = {
          userId: currentUser.id,
          city,
          district,
          alternativeDistricts,
          preferredNeighborhoods,
          minRentBudget: parseFloat(minRentBudget) || 0,
          maxRentBudget: parseFloat(maxRentBudget) || 0,
          maintenanceFeePreference: tenantMaintenancePreference,
          maxMaintenanceFee: parseFloat(maxMaintenanceFee) || 0,
          canPayDeposit,
          maxDepositAmount: parseFloat(maxDepositAmount) || 0,
          preferredPaymentMethod,
          minRoomCount: parseInt(minRoomCount) || 0,
          minSquareMeters: parseInt(minSquareMeters) || 0,
          furnishedPreference,
          preferredHeatingType,
          maxBuildingAge: parseInt(maxBuildingAge) || 0,
          preferredFloorRange,
          requiresElevator,
          requiresBalcony,
          requiresParking,
          requiresInternet,
          requiresGarden,
          preferredRentalPeriod,
          earliestMoveInDate: earliestMoveInDate.toISOString(),
          preferShortTerm,
          occupantCount: parseInt(occupantCount) || 0,
          hasPets,
          petTypes,
          isStudent,
          occupation,
          isFamily,
          hasChildren,
          childrenCount: parseInt(childrenCount) || 0,
          isSmoker,
          hasInsuredJob,
          canProvideGuarantor,
          monthlyIncome: parseFloat(monthlyIncome) || 0,
          canProvideReference,
          neighborRelationPreference,
          noisePreference,
          securityPreferences,
          requiresPublicTransport,
          requiresShoppingAccess,
          requiresSchoolAccess,
          requiresHospitalAccess,
          additionalNotes,
        };

        const response = await updateTenantExpectation(
          expectationData
        ).unwrap();

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Beklenti profili başarıyla güncellendi", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert(
            "Hata",
            response?.message || "Beklenti profili güncellenemedi"
          );
        }
      }
    } catch (error) {
      console.error("Beklenti profili güncelleme hatası:", error);
      Alert.alert(
        "Hata",
        error?.data?.message ||
          "Beklenti profili güncellenirken bir hata oluştu"
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-base text-gray-500">
          {isExpectationCompleted ? "Güncelleniyor..." : "Oluşturuluyor..."}
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
        <ProfileExpectationHeader
          navigation={navigation}
          isExpectationCompleted={isExpectationCompleted}
          onSubmit={handleSubmit}
          onUpdate={handleUpdate}
          isLoading={isLoading}
        />

        {/* Content - flex-1 ile büyümesini sağla */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 py-4">
            {/* Render appropriate form based on user role */}
            {userRole === "EVSAHIBI"
              ? renderLandlordForm()
              : renderTenantForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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

export default ProfileExpectationScreen;
