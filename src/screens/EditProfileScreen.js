import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Switch,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useUpdateLandlordProfileMutation,
  useUpdateTenantProfileMutation,
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
  useUpdateLandlordExpectationMutation, // Note: singular "Expectation" not plural "Expectations"
  useUpdateTenantExpectationMutation, // Note: singular "Expectation" not plural "Expectations"
  useGetLandlordExpectationQuery, // Note: singular "Expectation" not plural "Expectations"
  useGetTenantExpectationQuery, // Note: singular "Expectation" not plural "Expectations"
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

const CustomDropdown = ({
  label,
  value,
  setValue,
  options,
  placeholder,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Text className="text-gray-600 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity
        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200 flex-row justify-between items-center"
        onPress={() => setIsOpen(true)}
      >
        <Text className={value ? "text-black" : "text-gray-500"}>
          {value || placeholder}
        </Text>
        <Text>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-lg max-h-1/2">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text className="text-blue-500 font-bold">Kapat</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 border-b border-gray-100 ${
                    value === item ? "bg-blue-50" : ""
                  }`}
                  onPress={() => {
                    setValue(item);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    className={`text-base ${
                      value === item
                        ? "text-blue-500 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// New number input component
const NumberInput = ({
  label,
  value,
  setValue,
  placeholder,
  required = false,
  min = 0,
  max = null,
}) => {
  const handleChange = (text) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, "");

    if (numericValue === "") {
      setValue("");
      return;
    }

    let numberValue = parseInt(numericValue, 10);

    // Apply min/max constraints
    if (min !== null && numberValue < min) {
      numberValue = min;
    }
    if (max !== null && numberValue > max) {
      numberValue = max;
    }

    setValue(numberValue.toString());
  };

  return (
    <View className="mb-4">
      <Text className="text-gray-600 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TextInput
        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
        value={value?.toString()}
        onChangeText={handleChange}
        placeholder={placeholder}
        keyboardType="numeric"
      />
    </View>
  );
};

// Section header component
const SectionHeader = ({ title }) => (
  <View className="mt-6 mb-4">
    <Text className="text-lg font-bold text-gray-800">{title}</Text>
    <View className="h-0.5 bg-gray-200 mt-2" />
  </View>
);

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const userProfile = useSelector(selectUserProfile);

  // Ortak state değişkenleri
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null); // 'profile' or 'cover'
  const [activeTab, setActiveTab] = useState("basicInfo"); // "basicInfo" or "expectations"
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Ev Sahibi (Landlord) için state değişkenleri
  const [rentalLocation, setRentalLocation] = useState("İstanbul"); // Zorunlu
  const [rentalPriceExpectation, setRentalPriceExpectation] =
    useState("0-5000"); // Zorunlu
  const [numberOfOccupants, setNumberOfOccupants] = useState("1-2"); // Zorunlu
  const [isNumberOfOccupantsImportant, setIsNumberOfOccupantsImportant] =
    useState(false);
  const [isTenantProfessionImportant, setIsTenantProfessionImportant] =
    useState(false);
  const [isTenantMaritalStatusImportant, setIsTenantMaritalStatusImportant] =
    useState(false);
  const [tenantProfession, setTenantProfession] = useState("Belirtilmemiş");
  const [tenantMaritalStatus, setTenantMaritalStatus] =
    useState("Belirtilmemiş");
  const [description, setDescription] = useState("");

  // Kiracı (Tenant) için state değişkenleri
  const [location, setLocation] = useState("İstanbul"); // Zorunlu
  const [priceRange, setPriceRange] = useState("0-5000"); // Zorunlu
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [profession, setProfession] = useState("Belirtilmemiş"); // Zorunlu
  const [maritalStatus, setMaritalStatus] = useState("Belirtilmemiş"); // Zorunlu
  const [profileDescription, setProfileDescription] = useState("");

  // Landlord Expectations için state değişkenleri
  const [landlordCity, setLandlordCity] = useState("İstanbul");
  const [landlordDistrict, setLandlordDistrict] = useState("");
  const [rentAmount, setRentAmount] = useState("0");
  const [isMaintenanceFeeIncluded, setIsMaintenanceFeeIncluded] =
    useState(false);
  const [maintenanceFee, setMaintenanceFee] = useState("0");
  const [maintenanceFeeResponsibility, setMaintenanceFeeResponsibility] =
    useState("1");
  const [isDepositRequired, setIsDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("0");
  const [minimumRentalPeriod, setMinimumRentalPeriod] = useState("1");
  const [isShortTermRentalAvailable, setIsShortTermRentalAvailable] =
    useState(false);
  const [isForeignCurrencyAccepted, setIsForeignCurrencyAccepted] =
    useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("1");
  const [isBankTransferRequired, setIsBankTransferRequired] = useState(false);
  const [maximumOccupants, setMaximumOccupants] = useState("0");
  const [petPolicy, setPetPolicy] = useState("1");
  const [acceptedPetTypes, setAcceptedPetTypes] = useState("");
  const [studentPolicy, setStudentPolicy] = useState("1");
  const [familyOnly, setFamilyOnly] = useState(false);
  const [acceptChildrenFamily, setAcceptChildrenFamily] = useState(false);
  const [preferGovernmentEmployee, setPreferGovernmentEmployee] =
    useState(false);
  const [isIncomeProofRequired, setIsIncomeProofRequired] = useState(false);
  const [minimumMonthlyIncome, setMinimumMonthlyIncome] = useState("0");
  const [isGuarantorRequired, setIsGuarantorRequired] = useState(false);
  const [smokingPolicy, setSmokingPolicy] = useState("1");
  const [isReferenceRequired, setIsReferenceRequired] = useState(false);
  const [isInsuredJobRequired, setIsInsuredJobRequired] = useState(false);
  const [buildingApprovalPolicy, setBuildingApprovalPolicy] = useState("1");

  // Tenant Expectations için state değişkenleri
  const [tenantCity, setTenantCity] = useState("İstanbul");
  const [tenantDistrict, setTenantDistrict] = useState("");
  const [alternativeDistricts, setAlternativeDistricts] = useState("");
  const [preferredNeighborhoods, setPreferredNeighborhoods] = useState("");
  const [minRentBudget, setMinRentBudget] = useState("0");
  const [maxRentBudget, setMaxRentBudget] = useState("0");
  const [maintenanceFeePreference, setMaintenanceFeePreference] = useState("1");
  const [maxMaintenanceFee, setMaxMaintenanceFee] = useState("0");
  const [canPayDeposit, setCanPayDeposit] = useState(true);
  const [maxDepositAmount, setMaxDepositAmount] = useState("0");
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState("1");
  const [minRoomCount, setMinRoomCount] = useState("0");
  const [minSquareMeters, setMinSquareMeters] = useState("0");
  const [furnishedPreference, setFurnishedPreference] = useState("1");
  const [preferredHeatingType, setPreferredHeatingType] = useState("1");
  const [maxBuildingAge, setMaxBuildingAge] = useState("0");
  const [preferredFloorRange, setPreferredFloorRange] = useState("");
  const [requiresElevator, setRequiresElevator] = useState(false);
  const [requiresBalcony, setRequiresBalcony] = useState(false);
  const [requiresParking, setRequiresParking] = useState(false);
  const [requiresInternet, setRequiresInternet] = useState(false);
  const [requiresGarden, setRequiresGarden] = useState(false);
  const [preferredRentalPeriod, setPreferredRentalPeriod] = useState("1");
  const [earliestMoveInDate, setEarliestMoveInDate] = useState(new Date());
  const [preferShortTerm, setPreferShortTerm] = useState(false);
  const [occupantCount, setOccupantCount] = useState("0");
  const [hasPets, setHasPets] = useState(false);
  const [petTypes, setPetTypes] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [isFamily, setIsFamily] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenCount, setChildrenCount] = useState("0");
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasInsuredJob, setHasInsuredJob] = useState(false);
  const [canProvideGuarantor, setCanProvideGuarantor] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [canProvideReference, setCanProvideReference] = useState(false);
  const [neighborRelationPreference, setNeighborRelationPreference] =
    useState("1");
  const [noisePreference, setNoisePreference] = useState("1");
  const [securityPreferences, setSecurityPreferences] = useState("");
  const [requiresPublicTransport, setRequiresPublicTransport] = useState(false);
  const [requiresShoppingAccess, setRequiresShoppingAccess] = useState(false);
  const [requiresSchoolAccess, setRequiresSchoolAccess] = useState(false);
  const [requiresHospitalAccess, setRequiresHospitalAccess] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Şehir listesi
  const cities = [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Adana",
    "Adıyaman",
    "Afyonkarahisar",
    "Ağrı",
    "Aksaray",
    "Amasya",
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

  // İlçe listesi (sadece İstanbul için - gerçek uygulamada API'den gelmeli)
  const districts = [
    "Adalar",
    "Arnavutköy",
    "Ataşehir",
    "Avcılar",
    "Bağcılar",
    "Bahçelievler",
    "Bakırköy",
    "Başakşehir",
    "Bayrampaşa",
    "Beşiktaş",
    "Beykoz",
    "Beylikdüzü",
    "Beyoğlu",
    "Büyükçekmece",
    "Çatalca",
    "Çekmeköy",
    "Esenler",
    "Esenyurt",
    "Eyüpsultan",
    "Fatih",
    "Gaziosmanpaşa",
    "Güngören",
    "Kadıköy",
    "Kağıthane",
    "Kartal",
    "Küçükçekmece",
    "Maltepe",
    "Pendik",
    "Sancaktepe",
    "Sarıyer",
    "Silivri",
    "Sultanbeyli",
    "Sultangazi",
    "Şile",
    "Şişli",
    "Tuzla",
    "Ümraniye",
    "Üsküdar",
    "Zeytinburnu",
  ];

  // Fiyat aralığı listesi
  const priceRanges = [
    "0-5000",
    "5001-10000",
    "10001-15000",
    "15001-20000",
    "20001-25000",
    "25001-30000",
    "30001-40000",
    "40001-50000",
    "50001+",
  ];

  // Meslek listesi
  const professions = [
    "Belirtilmemiş",
    "Öğrenci",
    "Öğretmen",
    "Mühendis",
    "Doktor",
    "Avukat",
    "Mimar",
    "Akademisyen",
    "Memur",
    "İşçi",
    "Esnaf",
    "Serbest Meslek",
    "Emekli",
    "Diğer",
  ];

  // Medeni durum listesi
  const maritalStatuses = ["Belirtilmemiş", "Bekar", "Evli", "Boşanmış", "Dul"];

  // Kişi sayısı listesi (kiracı için)
  const peopleNumbers = ["1", "2", "3", "4", "5", "6+"];

  // Kiracı sayısı listesi (ev sahibi için)
  const occupantOptions = ["1-2", "3-4", "5-6", "6+", "Fark etmez"];

  // Aidat/Bakım ücreti sorumluluk listesi
  const maintenanceFeeResponsibilityOptions = [
    "1",
    "2",
    "3", // Bu değerler enum'a karşılık gelecek şekilde ayarlanmalı
  ];

  // Kira süresi listesi
  const rentalPeriodOptions = [
    "1",
    "3",
    "6",
    "12",
    "24",
    "36+", // Ay cinsinden
  ];

  // Para birimi listesi
  const currencyOptions = [
    "1",
    "2",
    "3",
    "4", // TL, USD, EUR, GBP gibi değerler
  ];

  // Evcil hayvan politikası
  const petPolicyOptions = [
    "1",
    "2",
    "3", // İzin Verilmez, Bazı Türlere İzin Verilir, Tümüne İzin Verilir
  ];

  // Öğrenci politikası
  const studentPolicyOptions = [
    "1",
    "2",
    "3", // İzin Verilmez, Tercih Edilmez, Tercih Edilir
  ];

  // Sigara politikası
  const smokingPolicyOptions = [
    "1",
    "2",
    "3", // İzin Verilmez, Sadece Balkonda, İzin Verilir
  ];

  // Bina yönetimi onay politikası
  const buildingApprovalPolicyOptions = [
    "1",
    "2",
    "3", // Gerekli Değil, Bilgilendirilecek, Onay Alınacak
  ];

  // Tercih edilen ödeme yöntemi
  const paymentMethodOptions = [
    "1",
    "2",
    "3",
    "4", // Nakit, Banka Havalesi, Kredi Kartı, Diğer
  ];

  // Eşya durumu
  const furnishedPreferenceOptions = [
    "1",
    "2",
    "3", // Boş, Yarı Eşyalı, Tam Eşyalı
  ];

  // Isıtma tipi
  const heatingTypeOptions = [
    "1",
    "2",
    "3",
    "4",
    "5", // Doğalgaz Kombi, Merkezi Sistem, Klima, Soba, Diğer
  ];

  // Komşu ilişki tercihi
  const neighborRelationOptions = [
    "1",
    "2",
    "3", // Mesafeli, Normal, Sıcak ve Samimi
  ];

  // Gürültü tercihi
  const noisePreferenceOptions = [
    "1",
    "2",
    "3", // Sessiz, Orta, Önemli Değil
  ];

  // Use appropriate queries and mutations based on user role
  const { data: profileData, isLoading: profileLoading } =
    userRole === "EVSAHIBI"
      ? useGetLandlordProfileQuery(currentUser?.id)
      : useGetTenantProfileQuery(currentUser?.id);

  const { data: expectationsData, isLoading: expectationsLoading } =
    userRole === "EVSAHIBI"
      ? useGetLandlordExpectationQuery(currentUser?.id) // Note: singular "Expectation" not plural "Expectations"
      : useGetTenantExpectationQuery(currentUser?.id);

  const [updateLandlordProfile, { isLoading: updateLandlordLoading }] =
    useUpdateLandlordProfileMutation();
  const [updateTenantProfile, { isLoading: updateTenantLoading }] =
    useUpdateTenantProfileMutation();
  const [
    updateLandlordExpectation,
    { isLoading: updateLandlordExpectationLoading },
  ] = useUpdateLandlordExpectationMutation();

  const [
    updateTenantExpectation,
    { isLoading: updateTenantExpectationLoading },
  ] = useUpdateTenantExpectationMutation();

  const isLoading =
    profileLoading ||
    updateLandlordLoading ||
    updateTenantLoading ||
    expectationsLoading ||
    updateLandlordExpectationLoading ||
    updateTenantExpectationLoading;

  // Profil verilerini başlangıçta doldurmak için
  useEffect(() => {
    // Eğer zaten userProfile var ise, Redux store'dan al
    if (userProfile) {
      console.log("Profil bilgileri Redux store'dan yükleniyor:", userProfile);

      if (userProfile.profileImageUrl) {
        setPreviewProfileImage(userProfile.profileImageUrl);
      }

      if (userProfile.coverProfileImageUrl) {
        setPreviewCoverImage(userProfile.coverProfileImageUrl);
      }

      // Rol bazlı alanları doldur
      if (userRole === "EVSAHIBI") {
        setRentalLocation(userProfile.rentalLocation || "İstanbul");
        setRentalPriceExpectation(
          userProfile.rentalPriceExpectation || "0-5000"
        );
        setNumberOfOccupants(userProfile.numberOfOccupants || "1-2");
        setIsNumberOfOccupantsImportant(
          userProfile.isNumberOfOccupantsImportant || false
        );
        setIsTenantProfessionImportant(
          userProfile.isTenantProfessionImportant || false
        );
        setIsTenantMaritalStatusImportant(
          userProfile.isTenantMaritalStatusImportant || false
        );
        setTenantProfession(userProfile.tenantProfession || "Belirtilmemiş");
        setTenantMaritalStatus(
          userProfile.tenantMaritalStatus || "Belirtilmemiş"
        );
        setDescription(userProfile.description || "");
      } else {
        setLocation(userProfile.location || "İstanbul");
        setPriceRange(userProfile.priceRange || "0-5000");
        setNumberOfPeople(userProfile.numberOfPeople?.toString() || "1");
        setProfession(userProfile.profession || "Belirtilmemiş");
        setMaritalStatus(userProfile.maritalStatus || "Belirtilmemiş");
        setProfileDescription(userProfile.profileDescription || "");
      }
    }
  }, [userProfile, currentUser]);

  // API'den profil verilerini yükle
  useEffect(() => {
    if (profileData?.isSuccess && profileData?.result) {
      const profile = profileData.result;
      console.log("Profil bilgileri API'den yükleniyor:", profile);

      dispatch(setUserProfile(profile));

      if (profile.profileImageUrl) {
        setPreviewProfileImage(profile.profileImageUrl);
      }

      if (profile.coverProfileImageUrl) {
        setPreviewCoverImage(profile.coverProfileImageUrl);
      }

      // Rol bazlı alanları doldur
      if (userRole === "EVSAHIBI") {
        setRentalLocation(profile.rentalLocation || "İstanbul");
        setRentalPriceExpectation(profile.rentalPriceExpectation || "0-5000");
        setNumberOfOccupants(profile.numberOfOccupants || "1-2");
        setIsNumberOfOccupantsImportant(
          profile.isNumberOfOccupantsImportant || false
        );
        setIsTenantProfessionImportant(
          profile.isTenantProfessionImportant || false
        );
        setIsTenantMaritalStatusImportant(
          profile.isTenantMaritalStatusImportant || false
        );
        setTenantProfession(profile.tenantProfession || "Belirtilmemiş");
        setTenantMaritalStatus(profile.tenantMaritalStatus || "Belirtilmemiş");
        setDescription(profile.description || "");
      } else {
        setLocation(profile.location || "İstanbul");
        setPriceRange(profile.priceRange || "0-5000");
        setNumberOfPeople(profile.numberOfPeople?.toString() || "1");
        setProfession(profile.profession || "Belirtilmemiş");
        setMaritalStatus(profile.maritalStatus || "Belirtilmemiş");
        setProfileDescription(profile.profileDescription || "");
      }
    }
  }, [profileData, dispatch, currentUser]);

  // API'den beklentiler verilerini yükle
  useEffect(() => {
    if (expectationsData?.isSuccess && expectationsData?.result) {
      const expectations = expectationsData.result;
      console.log("Beklenti bilgileri API'den yükleniyor:", expectations);

      // Rol bazlı beklenti alanlarını doldur
      if (userRole === "EVSAHIBI") {
        setLandlordCity(expectations.city || "İstanbul");
        setLandlordDistrict(expectations.district || "");
        setRentAmount(expectations.rentAmount?.toString() || "0");
        setIsMaintenanceFeeIncluded(
          expectations.isMaintenanceFeeIncluded || false
        );
        setMaintenanceFee(expectations.maintenanceFee?.toString() || "0");
        setMaintenanceFeeResponsibility(
          expectations.maintenanceFeeResponsibility?.toString() || "1"
        );
        setIsDepositRequired(expectations.isDepositRequired || false);
        setDepositAmount(expectations.depositAmount?.toString() || "0");
        setMinimumRentalPeriod(
          expectations.minimumRentalPeriod?.toString() || "1"
        );
        setIsShortTermRentalAvailable(
          expectations.isShortTermRentalAvailable || false
        );
        setIsForeignCurrencyAccepted(
          expectations.isForeignCurrencyAccepted || false
        );
        setPreferredCurrency(expectations.preferredCurrency?.toString() || "1");
        setIsBankTransferRequired(expectations.isBankTransferRequired || false);
        setMaximumOccupants(expectations.maximumOccupants?.toString() || "0");
        setPetPolicy(expectations.petPolicy?.toString() || "1");
        setAcceptedPetTypes(expectations.acceptedPetTypes || "");
        setStudentPolicy(expectations.studentPolicy?.toString() || "1");
        setFamilyOnly(expectations.familyOnly || false);
        setAcceptChildrenFamily(expectations.acceptChildrenFamily || false);
        setPreferGovernmentEmployee(
          expectations.preferGovernmentEmployee || false
        );
        setIsIncomeProofRequired(expectations.isIncomeProofRequired || false);
        setMinimumMonthlyIncome(
          expectations.minimumMonthlyIncome?.toString() || "0"
        );
        setIsGuarantorRequired(expectations.isGuarantorRequired || false);
        setSmokingPolicy(expectations.smokingPolicy?.toString() || "1");
        setIsReferenceRequired(expectations.isReferenceRequired || false);
        setIsInsuredJobRequired(expectations.isInsuredJobRequired || false);
        setBuildingApprovalPolicy(
          expectations.buildingApprovalPolicy?.toString() || "1"
        );
      } else {
        setTenantCity(expectations.city || "İstanbul");
        setTenantDistrict(expectations.district || "");
        setAlternativeDistricts(expectations.alternativeDistricts || "");
        setPreferredNeighborhoods(expectations.preferredNeighborhoods || "");
        setMinRentBudget(expectations.minRentBudget?.toString() || "0");
        setMaxRentBudget(expectations.maxRentBudget?.toString() || "0");
        setMaintenanceFeePreference(
          expectations.maintenanceFeePreference?.toString() || "1"
        );
        setMaxMaintenanceFee(expectations.maxMaintenanceFee?.toString() || "0");
        setCanPayDeposit(expectations.canPayDeposit || true);
        setMaxDepositAmount(expectations.maxDepositAmount?.toString() || "0");
        setPreferredPaymentMethod(
          expectations.preferredPaymentMethod?.toString() || "1"
        );
        setMinRoomCount(expectations.minRoomCount?.toString() || "0");
        setMinSquareMeters(expectations.minSquareMeters?.toString() || "0");
        setFurnishedPreference(
          expectations.furnishedPreference?.toString() || "1"
        );
        setPreferredHeatingType(
          expectations.preferredHeatingType?.toString() || "1"
        );
        setMaxBuildingAge(expectations.maxBuildingAge?.toString() || "0");
        setPreferredFloorRange(expectations.preferredFloorRange || "");
        setRequiresElevator(expectations.requiresElevator || false);
        setRequiresBalcony(expectations.requiresBalcony || false);
        setRequiresParking(expectations.requiresParking || false);
        setRequiresInternet(expectations.requiresInternet || false);
        setRequiresGarden(expectations.requiresGarden || false);
        setPreferredRentalPeriod(
          expectations.preferredRentalPeriod?.toString() || "1"
        );

        if (expectations.earliestMoveInDate) {
          setEarliestMoveInDate(new Date(expectations.earliestMoveInDate));
        }

        setPreferShortTerm(expectations.preferShortTerm || false);
        setOccupantCount(expectations.occupantCount?.toString() || "0");
        setHasPets(expectations.hasPets || false);
        setPetTypes(expectations.petTypes || "");
        setIsStudent(expectations.isStudent || false);
        setOccupation(expectations.occupation || "");
        setIsFamily(expectations.isFamily || false);
        setHasChildren(expectations.hasChildren || false);
        setChildrenCount(expectations.childrenCount?.toString() || "0");
        setIsSmoker(expectations.isSmoker || false);
        setHasInsuredJob(expectations.hasInsuredJob || false);
        setCanProvideGuarantor(expectations.canProvideGuarantor || false);
        setMonthlyIncome(expectations.monthlyIncome?.toString() || "0");
        setCanProvideReference(expectations.canProvideReference || false);
        setNeighborRelationPreference(
          expectations.neighborRelationPreference?.toString() || "1"
        );
        setNoisePreference(expectations.noisePreference?.toString() || "1");
        setSecurityPreferences(expectations.securityPreferences || "");
        setRequiresPublicTransport(
          expectations.requiresPublicTransport || false
        );
        setRequiresShoppingAccess(expectations.requiresShoppingAccess || false);
        setRequiresSchoolAccess(expectations.requiresSchoolAccess || false);
        setRequiresHospitalAccess(expectations.requiresHospitalAccess || false);
        setAdditionalNotes(expectations.additionalNotes || "");
      }
    }
  }, [expectationsData, currentUser, userRole]);

  // Image picker functions
  const handleImageSelection = async (type) => {
    setActiveImageType(type);
    setIsImagePickerVisible(true);
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni gereklidir.");
        return;
      }

      // Eski versiyonlarda bile çalışacak basit yapı
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

      setIsImagePickerVisible(false);
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
      setIsImagePickerVisible(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Kamera erişim izni gereklidir.");
        return;
      }

      // Eski versiyonlarda bile çalışacak basit yapı
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

      setIsImagePickerVisible(false);
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
      setIsImagePickerVisible(false);
    }
  };

  // Date picker handling
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || earliestMoveInDate;
    setShowDatePicker(false);
    setEarliestMoveInDate(currentDate);
  };

  // Veri doğrulama
  const validateBasicInfo = () => {
    if (userRole === "EVSAHIBI") {
      // Ev sahibi doğrulaması
      if (!rentalLocation) {
        Alert.alert("Hata", "Kiralama konumu zorunludur.");
        return false;
      }

      if (!rentalPriceExpectation) {
        Alert.alert("Hata", "Kira beklentisi zorunludur.");
        return false;
      }

      if (!numberOfOccupants) {
        Alert.alert("Hata", "Kiracı sayısı zorunludur.");
        return false;
      }
    } else {
      // Kiracı doğrulaması
      if (!location) {
        Alert.alert("Hata", "Konum alanı zorunludur.");
        return false;
      }

      if (!priceRange) {
        Alert.alert("Hata", "Fiyat aralığı alanı zorunludur.");
        return false;
      }

      if (!profession) {
        Alert.alert("Hata", "Meslek alanı zorunludur.");
        return false;
      }

      if (!maritalStatus) {
        Alert.alert("Hata", "Medeni durum alanı zorunludur.");
        return false;
      }
    }

    return true;
  };

  const validateExpectations = () => {
    if (userRole === "EVSAHIBI") {
      // Landlord beklentilerinin doğrulaması
      if (!landlordCity) {
        Alert.alert("Hata", "Şehir alanı zorunludur.");
        return false;
      }
    } else {
      // Tenant beklentilerinin doğrulaması
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

  const handleSaveProfile = async () => {
    // Form validation
    if (activeTab === "basicInfo" && !validateBasicInfo()) {
      return;
    } else if (activeTab === "expectations" && !validateExpectations()) {
      return;
    }

    try {
      const formData = new FormData();

      // Add common fields
      formData.append("UserId", currentUser.id);

      // Add profile image if changed
      if (profileImage) {
        // Get file name from URI
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
        // Get file name from URI
        const coverImageName = coverImage.split("/").pop();
        const coverImageType = coverImageName.split(".").pop();

        formData.append("CoverProfileImage", {
          uri: coverImage,
          name: coverImageName,
          type: `image/${coverImageType}`,
        });

        dispatch(updateCoverImageStatus("uploading"));
      }

      // Add basic info fields
      if (userRole === "EVSAHIBI") {
        // Landlord basic info fields
        formData.append("RentalLocation", rentalLocation);
        formData.append("RentalPriceExpectation", rentalPriceExpectation);
        formData.append("NumberOfOccupants", numberOfOccupants);
        formData.append(
          "IsNumberOfOccupantsImportant",
          isNumberOfOccupantsImportant
        );
        formData.append(
          "IsTenantProfessionImportant",
          isTenantProfessionImportant
        );
        formData.append(
          "IsTenantMaritalStatusImportant",
          isTenantMaritalStatusImportant
        );
        formData.append("TenantProfession", tenantProfession || "");
        formData.append("TenantMaritalStatus", tenantMaritalStatus || "");
        formData.append("Description", description || "");

        // Add landlord expectation fields
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
          maintenanceFeeResponsibility
        );
        formData.append(
          "TenantExpectation.IsDepositRequired",
          isDepositRequired
        );
        formData.append("TenantExpectation.DepositAmount", depositAmount);
        formData.append(
          "TenantExpectation.MinimumRentalPeriod",
          minimumRentalPeriod
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
          preferredCurrency
        );
        formData.append(
          "TenantExpectation.IsBankTransferRequired",
          isBankTransferRequired
        );
        formData.append("TenantExpectation.MaximumOccupants", maximumOccupants);
        formData.append("TenantExpectation.PetPolicy", petPolicy);
        formData.append(
          "TenantExpectation.AcceptedPetTypes",
          acceptedPetTypes || ""
        );
        formData.append("TenantExpectation.StudentPolicy", studentPolicy);
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
        formData.append("TenantExpectation.SmokingPolicy", smokingPolicy);
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
          buildingApprovalPolicy
        );

        // Log the form fields
        console.log("Formda bulunan alanlar:");
        for (let [key, value] of formData.entries()) {
          console.log(`- ${key}: ${value}`);
        }

        // Update landlord profile with all data
        const response = await updateLandlordProfile(formData).unwrap();
        console.log("Landlord profil güncelleme yanıtı:", response);

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
          if (activeTab === "basicInfo") {
            setActiveTab("expectations");
          } else {
            navigation.goBack();
          }
        } else {
          Alert.alert(
            "Hata",
            (response && response.message) || "Profil güncellenemedi."
          );
        }
      } else {
        // Tenant basic info fields
        formData.append("Location", location);
        formData.append("PriceRange", priceRange);
        formData.append("NumberOfPeople", numberOfPeople);
        formData.append("Profession", profession);
        formData.append("MaritalStatus", maritalStatus);
        formData.append("ProfileDescription", profileDescription || "");

        // Format date for API
        const formattedDate = earliestMoveInDate.toISOString();

        // Add tenant expectation fields
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
          maintenanceFeePreference
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
          preferredPaymentMethod
        );
        formData.append("LandlordExpectation.MinRoomCount", minRoomCount);
        formData.append("LandlordExpectation.MinSquareMeters", minSquareMeters);
        formData.append(
          "LandlordExpectation.FurnishedPreference",
          furnishedPreference
        );
        formData.append(
          "LandlordExpectation.PreferredHeatingType",
          preferredHeatingType
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
          preferredRentalPeriod
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
          neighborRelationPreference
        );
        formData.append("LandlordExpectation.NoisePreference", noisePreference);
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

        // Log the form fields
        console.log("Formda bulunan alanlar:");
        for (let [key, value] of formData.entries()) {
          console.log(`- ${key}: ${value}`);
        }

        // Update tenant profile with all data
        const response = await updateTenantProfile(formData).unwrap();
        console.log("Tenant profil güncelleme yanıtı:", response);

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
          if (activeTab === "basicInfo") {
            setActiveTab("expectations");
          } else {
            navigation.goBack();
          }
        } else {
          Alert.alert(
            "Hata",
            (response && response.message) || "Profil güncellenemedi."
          );
        }
      }

      // Reset image upload statuses
      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    } catch (error) {
      console.error("Profile update error:", error);

      // Detaylı hata mesajlarını göster
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
          (error && error.data && error.data.message) ||
            "Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }

      // Reset image upload statuses on error
      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    }
  };

  if (isLoading && !userProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">
          Profil yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1">
        {/* Header with back button */}
        <View className="px-5 py-6 flex-row items-center bg-white border-b border-gray-200">
          <TouchableOpacity
            className="mr-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-blue-500 text-base">Geri</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Profili Düzenle
          </Text>
        </View>

        {/* Profile image and cover photo section */}
        <View className="relative mb-16">
          {/* Cover photo */}
          <TouchableOpacity
            className="w-full h-40 bg-gray-200"
            onPress={() => handleImageSelection("cover")}
          >
            {previewCoverImage ? (
              <Image
                source={{ uri: previewCoverImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full justify-center items-center">
                <Text className="text-gray-500">Kapak Fotoğrafı Ekle</Text>
              </View>
            )}
            <View className="absolute right-4 bottom-4 bg-white p-2 rounded-full shadow">
              <Text className="text-blue-500 font-bold">Düzenle</Text>
            </View>
          </TouchableOpacity>

          {/* Profile picture */}
          <TouchableOpacity
            className="absolute bottom-[-50] left-5"
            onPress={() => handleImageSelection("profile")}
          >
            <View className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
              {previewProfileImage ? (
                <Image
                  source={{ uri: previewProfileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-200 justify-center items-center">
                  <Text className="text-gray-500 text-3xl font-bold">
                    {currentUser?.name?.charAt(0) || "P"}
                  </Text>
                </View>
              )}
            </View>
            <View className="absolute right-0 bottom-0 bg-blue-500 w-8 h-8 rounded-full justify-center items-center">
              <Text className="text-white text-xl">+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-gray-200 mb-4">
          <TouchableOpacity
            className={`flex-1 py-3 ${
              activeTab === "basicInfo" ? "border-b-2 border-blue-500" : ""
            }`}
            onPress={() => setActiveTab("basicInfo")}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "basicInfo" ? "text-blue-500" : "text-gray-600"
              }`}
            >
              Temel Bilgiler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 ${
              activeTab === "expectations" ? "border-b-2 border-blue-500" : ""
            }`}
            onPress={() => setActiveTab("expectations")}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "expectations" ? "text-blue-500" : "text-gray-600"
              }`}
            >
              Beklentiler
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form fields */}
        <View className="px-5">
          {activeTab === "basicInfo" ? (
            <>
              {/* Temel Bilgiler Tab */}
              {userRole === "EVSAHIBI" ? (
                <>
                  {/* Ev Sahibi Bilgileri */}
                  <View className="bg-white rounded-xl shadow-sm p-5 mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-4">
                      Kiralama Tercihleri
                    </Text>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Kiralama Konumu"
                        value={rentalLocation}
                        setValue={setRentalLocation}
                        options={cities}
                        placeholder="Konum seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Kira Beklentisi"
                        value={rentalPriceExpectation}
                        setValue={setRentalPriceExpectation}
                        options={priceRanges}
                        placeholder="Fiyat aralığı seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Tercih Edilen Kiracı Sayısı"
                        value={numberOfOccupants}
                        setValue={setNumberOfOccupants}
                        options={occupantOptions}
                        placeholder="Kiracı sayısı seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Kiracı Sayısı Önemli mi?
                      </Text>
                      <Switch
                        value={isNumberOfOccupantsImportant}
                        onValueChange={setIsNumberOfOccupantsImportant}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isNumberOfOccupantsImportant ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Kiracı Mesleği Önemli mi?
                      </Text>
                      <Switch
                        value={isTenantProfessionImportant}
                        onValueChange={setIsTenantProfessionImportant}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isTenantProfessionImportant ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Kiracı Medeni Durumu Önemli mi?
                      </Text>
                      <Switch
                        value={isTenantMaritalStatusImportant}
                        onValueChange={setIsTenantMaritalStatusImportant}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isTenantMaritalStatusImportant ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    {isTenantProfessionImportant && (
                      <View className="mb-4">
                        <CustomDropdown
                          label="Tercih Edilen Kiracı Mesleği"
                          value={tenantProfession}
                          setValue={setTenantProfession}
                          options={professions}
                          placeholder="Meslek seçiniz"
                        />
                      </View>
                    )}

                    {isTenantMaritalStatusImportant && (
                      <View className="mb-4">
                        <CustomDropdown
                          label="Tercih Edilen Kiracı Medeni Durumu"
                          value={tenantMaritalStatus}
                          setValue={setTenantMaritalStatus}
                          options={maritalStatuses}
                          placeholder="Medeni durum seçiniz"
                        />
                      </View>
                    )}

                    <View className="mb-2">
                      <Text className="text-gray-600 mb-2">Açıklama</Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200 min-h-[100px]"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Eklemek istediğiniz bilgileri yazınız"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Kiracı Bilgileri */}
                  <View className="bg-white rounded-xl shadow-sm p-5 mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-4">
                      Kiracı Bilgileri
                    </Text>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Konum"
                        value={location}
                        setValue={setLocation}
                        options={cities}
                        placeholder="Konum seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Fiyat Aralığı"
                        value={priceRange}
                        setValue={setPriceRange}
                        options={priceRanges}
                        placeholder="Fiyat aralığı seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Kişi Sayısı"
                        value={numberOfPeople}
                        setValue={setNumberOfPeople}
                        options={peopleNumbers}
                        placeholder="Kişi sayısı seçiniz"
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Meslek"
                        value={profession}
                        setValue={setProfession}
                        options={professions}
                        placeholder="Meslek seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Medeni Durum"
                        value={maritalStatus}
                        setValue={setMaritalStatus}
                        options={maritalStatuses}
                        placeholder="Medeni durum seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-2">
                      <Text className="text-gray-600 mb-2">Hakkımda</Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200 min-h-[100px]"
                        value={profileDescription}
                        onChangeText={setProfileDescription}
                        placeholder="Kendinizi kısaca tanıtın"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                className={`rounded-lg h-12 justify-center items-center mb-10 ${
                  isLoading ? "bg-blue-300" : "bg-blue-500"
                }`}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    {activeTab === "basicInfo"
                      ? "Bilgileri Kaydet ve Devam Et"
                      : "Değişiklikleri Kaydet"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Beklentiler Tab */}
              {userRole === "EVSAHIBI" ? (
                <>
                  {/* Ev Sahibi Beklentileri */}
                  <View className="bg-white rounded-xl shadow-sm p-5 mb-6">
                    <SectionHeader title="Konum ve Ücret Bilgileri" />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Şehir"
                        value={landlordCity}
                        setValue={setLandlordCity}
                        options={cities}
                        placeholder="Şehir seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">İlçe</Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={landlordDistrict}
                        onChangeText={setLandlordDistrict}
                        placeholder="İlçe giriniz"
                      />
                    </View>

                    <NumberInput
                      label="Kira Miktarı (TL)"
                      value={rentAmount}
                      setValue={setRentAmount}
                      placeholder="Aylık kira miktarını giriniz"
                      min={0}
                    />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Aidat Fiyata Dahil mi?
                      </Text>
                      <Switch
                        value={isMaintenanceFeeIncluded}
                        onValueChange={setIsMaintenanceFeeIncluded}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isMaintenanceFeeIncluded ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    {!isMaintenanceFeeIncluded && (
                      <>
                        <NumberInput
                          label="Aidat Miktarı (TL)"
                          value={maintenanceFee}
                          setValue={setMaintenanceFee}
                          placeholder="Aylık aidat miktarını giriniz"
                          min={0}
                        />

                        <View className="mb-4">
                          <CustomDropdown
                            label="Aidat Sorumluluğu"
                            value={maintenanceFeeResponsibility}
                            setValue={setMaintenanceFeeResponsibility}
                            options={maintenanceFeeResponsibilityOptions}
                            placeholder="Aidat sorumluluğunu seçiniz"
                          />
                        </View>
                      </>
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Depozito İsteniyor mu?
                      </Text>
                      <Switch
                        value={isDepositRequired}
                        onValueChange={setIsDepositRequired}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={isDepositRequired ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    {isDepositRequired && (
                      <NumberInput
                        label="Depozito Miktarı (TL)"
                        value={depositAmount}
                        setValue={setDepositAmount}
                        placeholder="Depozito miktarını giriniz"
                        min={0}
                      />
                    )}

                    <SectionHeader title="Kiralama Koşulları" />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Minimum Kiralama Süresi (Ay)"
                        value={minimumRentalPeriod}
                        setValue={setMinimumRentalPeriod}
                        options={rentalPeriodOptions}
                        placeholder="Minimum kiralama süresini seçiniz"
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Kısa Dönem Kiralamaya Uygun mu?
                      </Text>
                      <Switch
                        value={isShortTermRentalAvailable}
                        onValueChange={setIsShortTermRentalAvailable}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isShortTermRentalAvailable ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Yabancı Para Kabul Edilir mi?
                      </Text>
                      <Switch
                        value={isForeignCurrencyAccepted}
                        onValueChange={setIsForeignCurrencyAccepted}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isForeignCurrencyAccepted ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    {isForeignCurrencyAccepted && (
                      <View className="mb-4">
                        <CustomDropdown
                          label="Tercih Edilen Para Birimi"
                          value={preferredCurrency}
                          setValue={setPreferredCurrency}
                          options={currencyOptions}
                          placeholder="Para birimini seçiniz"
                        />
                      </View>
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Banka Havalesi Zorunlu mu?
                      </Text>
                      <Switch
                        value={isBankTransferRequired}
                        onValueChange={setIsBankTransferRequired}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isBankTransferRequired ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <SectionHeader title="Kiracı Tercihleri" />

                    <NumberInput
                      label="Maksimum Kiracı Sayısı"
                      value={maximumOccupants}
                      setValue={setMaximumOccupants}
                      placeholder="Maksimum kiracı sayısını giriniz"
                      min={0}
                    />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Evcil Hayvan Politikası"
                        value={petPolicy}
                        setValue={setPetPolicy}
                        options={petPolicyOptions}
                        placeholder="Evcil hayvan politikasını seçiniz"
                      />
                    </View>

                    {petPolicy === "2" && (
                      <View className="mb-4">
                        <Text className="text-gray-600 mb-2">
                          İzin Verilen Evcil Hayvanlar
                        </Text>
                        <TextInput
                          className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                          value={acceptedPetTypes}
                          onChangeText={setAcceptedPetTypes}
                          placeholder="Örn: Kedi, küçük köpek"
                        />
                      </View>
                    )}

                    <View className="mb-4">
                      <CustomDropdown
                        label="Öğrenci Politikası"
                        value={studentPolicy}
                        setValue={setStudentPolicy}
                        options={studentPolicyOptions}
                        placeholder="Öğrenci politikasını seçiniz"
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Sadece Aile mi?</Text>
                      <Switch
                        value={familyOnly}
                        onValueChange={setFamilyOnly}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={familyOnly ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    {familyOnly && (
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-gray-600">
                          Çocuklu Aile Kabul Edilir mi?
                        </Text>
                        <Switch
                          value={acceptChildrenFamily}
                          onValueChange={setAcceptChildrenFamily}
                          trackColor={{ false: "#767577", true: "#4A90E2" }}
                          thumbColor={
                            acceptChildrenFamily ? "#f4f3f4" : "#f4f3f4"
                          }
                        />
                      </View>
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Devlet Memuru Tercih Edilir mi?
                      </Text>
                      <Switch
                        value={preferGovernmentEmployee}
                        onValueChange={setPreferGovernmentEmployee}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          preferGovernmentEmployee ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <SectionHeader title="Güvence ve Doğrulama" />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Gelir Belgesi İsteniyor mu?
                      </Text>
                      <Switch
                        value={isIncomeProofRequired}
                        onValueChange={setIsIncomeProofRequired}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isIncomeProofRequired ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    {isIncomeProofRequired && (
                      <NumberInput
                        label="Minimum Aylık Gelir (TL)"
                        value={minimumMonthlyIncome}
                        setValue={setMinimumMonthlyIncome}
                        placeholder="Minimum aylık geliri giriniz"
                        min={0}
                      />
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Kefil İsteniyor mu?</Text>
                      <Switch
                        value={isGuarantorRequired}
                        onValueChange={setIsGuarantorRequired}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={isGuarantorRequired ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Sigara Politikası"
                        value={smokingPolicy}
                        setValue={setSmokingPolicy}
                        options={smokingPolicyOptions}
                        placeholder="Sigara politikasını seçiniz"
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Referans İsteniyor mu?
                      </Text>
                      <Switch
                        value={isReferenceRequired}
                        onValueChange={setIsReferenceRequired}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={isReferenceRequired ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Sigortalı İş İsteniyor mu?
                      </Text>
                      <Switch
                        value={isInsuredJobRequired}
                        onValueChange={setIsInsuredJobRequired}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          isInsuredJobRequired ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Bina Yönetimi Onay Politikası"
                        value={buildingApprovalPolicy}
                        setValue={setBuildingApprovalPolicy}
                        options={buildingApprovalPolicyOptions}
                        placeholder="Bina yönetimi onay politikasını seçiniz"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Kiracı Beklentileri */}
                  <View className="bg-white rounded-xl shadow-sm p-5 mb-6">
                    <SectionHeader title="Konum Tercihleri" />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Şehir"
                        value={tenantCity}
                        setValue={setTenantCity}
                        options={cities}
                        placeholder="Şehir seçiniz"
                        required={true}
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">İlçe</Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={tenantDistrict}
                        onChangeText={setTenantDistrict}
                        placeholder="İlçe giriniz"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">
                        Alternatif İlçeler
                      </Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={alternativeDistricts}
                        onChangeText={setAlternativeDistricts}
                        placeholder="Alternatif ilçeleri virgülle ayırarak giriniz"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">
                        Tercih Edilen Mahalleler
                      </Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={preferredNeighborhoods}
                        onChangeText={setPreferredNeighborhoods}
                        placeholder="Tercih ettiğiniz mahalleleri virgülle ayırarak giriniz"
                      />
                    </View>

                    <SectionHeader title="Bütçe Bilgileri" />

                    <NumberInput
                      label="Minimum Kira Bütçesi (TL)"
                      value={minRentBudget}
                      setValue={setMinRentBudget}
                      placeholder="Minimum kira bütçenizi giriniz"
                      min={0}
                    />

                    <NumberInput
                      label="Maksimum Kira Bütçesi (TL)"
                      value={maxRentBudget}
                      setValue={setMaxRentBudget}
                      placeholder="Maksimum kira bütçenizi giriniz"
                      min={0}
                    />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Aidat Tercihi"
                        value={maintenanceFeePreference}
                        setValue={setMaintenanceFeePreference}
                        options={maintenanceFeeResponsibilityOptions}
                        placeholder="Aidat tercihini seçiniz"
                      />
                    </View>

                    <NumberInput
                      label="Maksimum Aidat (TL)"
                      value={maxMaintenanceFee}
                      setValue={setMaxMaintenanceFee}
                      placeholder="Maksimum aidat miktarını giriniz"
                      min={0}
                    />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Depozito Ödeyebilir misiniz?
                      </Text>
                      <Switch
                        value={canPayDeposit}
                        onValueChange={setCanPayDeposit}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={canPayDeposit ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    {canPayDeposit && (
                      <NumberInput
                        label="Maksimum Depozito Miktarı (TL)"
                        value={maxDepositAmount}
                        setValue={setMaxDepositAmount}
                        placeholder="Maksimum depozito miktarını giriniz"
                        min={0}
                      />
                    )}

                    <View className="mb-4">
                      <CustomDropdown
                        label="Tercih Edilen Ödeme Yöntemi"
                        value={preferredPaymentMethod}
                        setValue={setPreferredPaymentMethod}
                        options={paymentMethodOptions}
                        placeholder="Ödeme yöntemini seçiniz"
                      />
                    </View>

                    <SectionHeader title="Ev Özellikleri" />

                    <NumberInput
                      label="Minimum Oda Sayısı"
                      value={minRoomCount}
                      setValue={setMinRoomCount}
                      placeholder="Minimum oda sayısını giriniz"
                      min={0}
                    />

                    <NumberInput
                      label="Minimum Metrekare"
                      value={minSquareMeters}
                      setValue={setMinSquareMeters}
                      placeholder="Minimum metrekareyi giriniz"
                      min={0}
                    />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Eşya Durumu Tercihi"
                        value={furnishedPreference}
                        setValue={setFurnishedPreference}
                        options={furnishedPreferenceOptions}
                        placeholder="Eşya durumu tercihini seçiniz"
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Tercih Edilen Isıtma Tipi"
                        value={preferredHeatingType}
                        setValue={setPreferredHeatingType}
                        options={heatingTypeOptions}
                        placeholder="Isıtma tipi tercihini seçiniz"
                      />
                    </View>

                    <NumberInput
                      label="Maksimum Bina Yaşı"
                      value={maxBuildingAge}
                      setValue={setMaxBuildingAge}
                      placeholder="Maksimum bina yaşını giriniz"
                      min={0}
                    />

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">
                        Tercih Edilen Kat Aralığı
                      </Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={preferredFloorRange}
                        onChangeText={setPreferredFloorRange}
                        placeholder="Örn: 2-5"
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Asansör Şart mı?</Text>
                      <Switch
                        value={requiresElevator}
                        onValueChange={setRequiresElevator}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={requiresElevator ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Balkon Şart mı?</Text>
                      <Switch
                        value={requiresBalcony}
                        onValueChange={setRequiresBalcony}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={requiresBalcony ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Otopark Şart mı?</Text>
                      <Switch
                        value={requiresParking}
                        onValueChange={setRequiresParking}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={requiresParking ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">İnternet Şart mı?</Text>
                      <Switch
                        value={requiresInternet}
                        onValueChange={setRequiresInternet}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={requiresInternet ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Bahçe Şart mı?</Text>
                      <Switch
                        value={requiresGarden}
                        onValueChange={setRequiresGarden}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={requiresGarden ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <SectionHeader title="Kiralama Bilgileri" />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Tercih Edilen Kiralama Süresi (Ay)"
                        value={preferredRentalPeriod}
                        setValue={setPreferredRentalPeriod}
                        options={rentalPeriodOptions}
                        placeholder="Kiralama süresini seçiniz"
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200 mb-4"
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text
                        className={
                          earliestMoveInDate ? "text-black" : "text-gray-500"
                        }
                      >
                        {earliestMoveInDate
                          ? earliestMoveInDate.toLocaleDateString()
                          : "Taşınma tarihi seçiniz"}
                      </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={earliestMoveInDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                      />
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Kısa Dönem Kiralama Tercih Edilir mi?
                      </Text>
                      <Switch
                        value={preferShortTerm}
                        onValueChange={setPreferShortTerm}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={preferShortTerm ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <SectionHeader title="Kişisel Bilgiler" />

                    <NumberInput
                      label="Kişi Sayısı"
                      value={occupantCount}
                      setValue={setOccupantCount}
                      placeholder="Kişi sayısını giriniz"
                      min={0}
                    />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Evcil Hayvanınız Var mı?
                      </Text>
                      <Switch
                        value={hasPets}
                        onValueChange={setHasPets}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={hasPets ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    {hasPets && (
                      <View className="mb-4">
                        <Text className="text-gray-600 mb-2">
                          Evcil Hayvan Türleri
                        </Text>
                        <TextInput
                          className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                          value={petTypes}
                          onChangeText={setPetTypes}
                          placeholder="Örn: Kedi, küçük köpek"
                        />
                      </View>
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Öğrenci misiniz?</Text>
                      <Switch
                        value={isStudent}
                        onValueChange={setIsStudent}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={isStudent ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">Meslek</Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={occupation}
                        onChangeText={setOccupation}
                        placeholder="Mesleğinizi giriniz"
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">Aile misiniz?</Text>
                      <Switch
                        value={isFamily}
                        onValueChange={setIsFamily}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={isFamily ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    {isFamily && (
                      <>
                        <View className="flex-row justify-between items-center mb-4">
                          <Text className="text-gray-600">
                            Çocuğunuz Var mı?
                          </Text>
                          <Switch
                            value={hasChildren}
                            onValueChange={setHasChildren}
                            trackColor={{ false: "#767577", true: "#4A90E2" }}
                            thumbColor={hasChildren ? "#f4f3f4" : "#f4f3f4"}
                          />
                        </View>

                        {hasChildren && (
                          <NumberInput
                            label="Çocuk Sayısı"
                            value={childrenCount}
                            setValue={setChildrenCount}
                            placeholder="Çocuk sayısını giriniz"
                            min={0}
                          />
                        )}
                      </>
                    )}

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Sigara Kullanıyor musunuz?
                      </Text>
                      <Switch
                        value={isSmoker}
                        onValueChange={setIsSmoker}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={isSmoker ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <SectionHeader title="Güvence ve Doğrulama" />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Sigortalı İşiniz Var mı?
                      </Text>
                      <Switch
                        value={hasInsuredJob}
                        onValueChange={setHasInsuredJob}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={hasInsuredJob ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Kefil Sağlayabilir misiniz?
                      </Text>
                      <Switch
                        value={canProvideGuarantor}
                        onValueChange={setCanProvideGuarantor}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={canProvideGuarantor ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <NumberInput
                      label="Aylık Gelir (TL)"
                      value={monthlyIncome}
                      setValue={setMonthlyIncome}
                      placeholder="Aylık gelirinizi giriniz"
                      min={0}
                    />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Referans Sağlayabilir misiniz?
                      </Text>
                      <Switch
                        value={canProvideReference}
                        onValueChange={setCanProvideReference}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={canProvideReference ? "#f4f3f4" : "#f4f3f4"}
                      />
                    </View>

                    <SectionHeader title="Yaşam Tarzı Tercihleri" />

                    <View className="mb-4">
                      <CustomDropdown
                        label="Komşuluk İlişkisi Tercihi"
                        value={neighborRelationPreference}
                        setValue={setNeighborRelationPreference}
                        options={neighborRelationOptions}
                        placeholder="Komşuluk ilişkisi tercihini seçiniz"
                      />
                    </View>

                    <View className="mb-4">
                      <CustomDropdown
                        label="Gürültü Tercihi"
                        value={noisePreference}
                        setValue={setNoisePreference}
                        options={noisePreferenceOptions}
                        placeholder="Gürültü tercihini seçiniz"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">
                        Güvenlik Tercihleri
                      </Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
                        value={securityPreferences}
                        onChangeText={setSecurityPreferences}
                        placeholder="Güvenlik tercihlerinizi giriniz"
                      />
                    </View>

                    <SectionHeader title="Çevre Özellikleri" />

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Toplu Taşıma Yakınlığı Önemli mi?
                      </Text>
                      <Switch
                        value={requiresPublicTransport}
                        onValueChange={setRequiresPublicTransport}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          requiresPublicTransport ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Alışveriş Merkezi Yakınlığı Önemli mi?
                      </Text>
                      <Switch
                        value={requiresShoppingAccess}
                        onValueChange={setRequiresShoppingAccess}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          requiresShoppingAccess ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Okul Yakınlığı Önemli mi?
                      </Text>
                      <Switch
                        value={requiresSchoolAccess}
                        onValueChange={setRequiresSchoolAccess}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          requiresSchoolAccess ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-600">
                        Hastane Yakınlığı Önemli mi?
                      </Text>
                      <Switch
                        value={requiresHospitalAccess}
                        onValueChange={setRequiresHospitalAccess}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={
                          requiresHospitalAccess ? "#f4f3f4" : "#f4f3f4"
                        }
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">Ek Notlar</Text>
                      <TextInput
                        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200 min-h-[100px]"
                        value={additionalNotes}
                        onChangeText={setAdditionalNotes}
                        placeholder="Eklemek istediğiniz diğer bilgileri yazınız"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                className={`rounded-lg h-12 justify-center items-center mb-10 ${
                  isLoading ? "bg-blue-300" : "bg-blue-500"
                }`}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    {activeTab === "basicInfo"
                      ? "Bilgileri Kaydet ve Devam Et"
                      : "Değişiklikleri Kaydet"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Image picker modal */}
      <Modal
        visible={isImagePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsImagePickerVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-xl">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800 text-center">
                {activeImageType === "profile"
                  ? "Profil Fotoğrafı"
                  : "Kapak Fotoğrafı"}
              </Text>
            </View>

            <TouchableOpacity
              className="p-4 border-b border-gray-200"
              onPress={pickImageFromGallery}
            >
              <Text className="text-lg text-blue-500 text-center">
                Galeriden Seç
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 border-b border-gray-200"
              onPress={takePhoto}
            >
              <Text className="text-lg text-blue-500 text-center">
                Fotoğraf Çek
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 mb-6"
              onPress={() => setIsImagePickerVisible(false)}
            >
              <Text className="text-lg text-red-500 text-center">İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
