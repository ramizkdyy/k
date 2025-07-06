import React, { useState, useEffect } from "react";
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
  Pressable,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import {
  useCreateLandlordExpectationMutation,
  useCreateTenantExpectationMutation,
} from "../redux/api/apiSlice";
import DateTimePicker from "@react-native-community/datetimepicker";

// Dropdown component for better UI
const CustomDropdown = ({
  label,
  value,
  setValue,
  options,
  placeholder,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  return (
    <View className="mb-4">
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
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)' // Saydam siyah arka plan
          }}
        >
          <View className="bg-white rounded-t-lg max-h-[50%]">
            {/* Modal içeriği aynı kalıyor */}
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text className="text-green-500 font-bold">Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  className={`p-4 border-b border-gray-100 ${value === option ? "bg-green-50" : ""}`}
                  onPress={() => {
                    setValue(option);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    className={`text-base ${value === option ? "text-green-500 font-semibold" : "text-gray-700"}`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    <View className="mb-4">
      <Text className="text-gray-600 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity
        className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200 flex-row justify-between items-center"
        onPress={() => setIsOpen(true)}
      >
        <Text className={value ? "text-black" : "text-gray-500"}>
          {value ? formatDate(value) : "Tarih seçin"}
        </Text>
        <Text>📅</Text>
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

// Form section component for better organization
const FormSection = ({ title, children }) => (
  <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
    <Text className="text-lg font-bold text-gray-800 mb-4">{title}</Text>
    {children}
  </View>
);

// Switch field component
const SwitchField = ({ label, value, setValue, description = null }) => (
  <View className="flex-row justify-between items-center mb-4">
    <View className="flex-1 mr-4">
      <Text className="text-gray-700">{label}</Text>
      {description && (
        <Text className="text-xs text-gray-500 mt-1">{description}</Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={setValue}
      trackColor={{ false: "#767577", true: "#4A90E2" }}
      thumbColor={value ? "#fff" : "#f4f3f4"}
    />
  </View>
);

const ProfileExpectationScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Common state
  const [city, setCity] = useState("İstanbul");
  const [district, setDistrict] = useState("");

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

  // Mutations
  const [createLandlordExpectation, { isLoading: landlordIsLoading }] =
    useCreateLandlordExpectationMutation();
  const [createTenantExpectation, { isLoading: tenantIsLoading }] =
    useCreateTenantExpectationMutation();

  const isLoading = landlordIsLoading || tenantIsLoading;

  // Enum options
  const cityOptions = [
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
    "Kiracıya Ait", // 1
    "Ev Sahibine Ait", // 2
    "Ortak Ödeme", // 3
  ];

  const rentalPeriodOptions = [
    "6 Ay", // 1
    "1 Yıl", // 2
    "Uzun Vadeli (1+ Yıl)", // 3
    "Kısa Dönem Olabilir" // 4
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

  const numericOptions = Array.from({ length: 30 }, (_, i) =>
    (i + 1).toString()
  );

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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">İlçe</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={district}
              onChangeText={setDistrict}
              placeholder="İlçe girin"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">
            Kira Miktarı (₺)<Text className="text-red-500">*</Text>
          </Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={rentAmount}
              onChangeText={setRentAmount}
              placeholder="Kira miktarı girin"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>
      </FormSection>

      <FormSection title="Aidat ve Depozito">
        <SwitchField
          label="Aidat Kiraya Dahil mi?"
          value={isMaintenanceFeeIncluded}
          setValue={setIsMaintenanceFeeIncluded}
        />

        {!isMaintenanceFeeIncluded && (
          <View className="mb-3">
            <Text className="text-gray-600 mb-2">Aidat Miktarı (₺)</Text>
            <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 py-3"
                value={maintenanceFee}
                onChangeText={setMaintenanceFee}
                placeholder="Aidat miktarı girin"
                placeholderTextColor={'#000'}
                keyboardType="numeric"
              />
            </View>
          </View>
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
          <View className="mb-3">
            <Text className="text-gray-600 mb-2">Depozito Miktarı (₺)</Text>
            <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 py-3"
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="Depozito miktarı girin"
                placeholderTextColor={'#000'}
                keyboardType="numeric"
              />
            </View>
          </View>
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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Maksimum Kiracı Sayısı</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={maximumOccupants}
              onChangeText={setMaximumOccupants}
              placeholder="Kişi sayısı girin"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>
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
          <View className="mb-3">
            <Text className="text-gray-600 mb-2">
              İzin Verilen Evcil Hayvan Türleri
            </Text>
            <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 py-3"
                value={acceptedPetTypes}
                onChangeText={setAcceptedPetTypes}
                placeholder="Örn: Kedi, küçük köpekler"
                placeholderTextColor={'#000'}
              />
            </View>
          </View>
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
          <View className="mb-3">
            <Text className="text-gray-600 mb-2">Minimum Aylık Gelir (₺)</Text>
            <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 py-3"
                value={minimumMonthlyIncome}
                onChangeText={setMinimumMonthlyIncome}
                placeholder="Minimum gelir miktarı"
                placeholderTextColor={'#000'}
                keyboardType="numeric"
              />
            </View>
          </View>
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
          options={cityOptions}
          placeholder="Şehir seçiniz"
          required
        />

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Tercih Edilen İlçe</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={district}
              onChangeText={setDistrict}
              placeholder="Örn: Kadıköy"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Alternatif İlçeler</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={alternativeDistricts}
              onChangeText={setAlternativeDistricts}
              placeholder="Örn: Beşiktaş, Şişli"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Tercih Edilen Mahalleler</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={preferredNeighborhoods}
              onChangeText={setPreferredNeighborhoods}
              placeholder="Örn: Caferağa, Moda"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>
      </FormSection>

      <FormSection title="Bütçe ve Ödeme">
        <View className="mb-3">
          <Text className="text-gray-600 mb-2">
            Minimum Kira Bütçesi (₺)<Text className="text-red-500">*</Text>
          </Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={minRentBudget}
              onChangeText={setMinRentBudget}
              placeholder="Minimum kira bütçesi"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">
            Maksimum Kira Bütçesi (₺)<Text className="text-red-500">*</Text>
          </Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={maxRentBudget}
              onChangeText={setMaxRentBudget}
              placeholder="Maksimum kira bütçesi"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Maksimum Aidat Miktarı (₺)</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={maxMaintenanceFee}
              onChangeText={setMaxMaintenanceFee}
              placeholder="Maksimum aidat miktarı"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <SwitchField
          label="Depozit Ödeyebilir misiniz?"
          value={canPayDeposit}
          setValue={setCanPayDeposit}
        />

        {canPayDeposit && (
          <View className="mb-3">
            <Text className="text-gray-600 mb-2">
              Maksimum Ödeyebileceğiniz Depozit (₺)
            </Text>
            <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 py-3"
                value={maxDepositAmount}
                onChangeText={setMaxDepositAmount}
                placeholder="Maksimum depozit miktarı"
                placeholderTextColor={'#000'}
                keyboardType="numeric"
              />
            </View>
          </View>
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
        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Minimum Oda Sayısı</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={minRoomCount}
              onChangeText={setMinRoomCount}
              placeholder="Minimum oda sayısı"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Minimum Metrekare</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={minSquareMeters}
              onChangeText={setMinSquareMeters}
              placeholder="Minimum metrekare"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Maksimum Bina Yaşı</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={maxBuildingAge}
              onChangeText={setMaxBuildingAge}
              placeholder="Maksimum bina yaşı"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Tercih Edilen Kat Aralığı</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={preferredFloorRange}
              onChangeText={setPreferredFloorRange}
              placeholder="Örn: 2-5"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>

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
        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Kiralayacak Kişi Sayısı</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={occupantCount}
              onChangeText={setOccupantCount}
              placeholder="Kişi sayısı"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <SwitchField
          label="Evcil Hayvanınız Var mı?"
          value={hasPets}
          setValue={setHasPets}
        />

        {hasPets && (
          <View className="mb-3">
            <Text className="text-gray-600 mb-2">Evcil Hayvan Türleri</Text>
            <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 py-3"
                value={petTypes}
                onChangeText={setPetTypes}
                placeholder="Örn: Kedi, küçük köpek"
                placeholderTextColor={'#000'}
              />
            </View>
          </View>
        )}

        <SwitchField
          label="Öğrenci misiniz?"
          value={isStudent}
          setValue={setIsStudent}
        />

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Meslek</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={occupation}
              onChangeText={setOccupation}
              placeholder="Mesleğinizi belirtin"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>

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
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">Çocuk Sayısı</Text>
                <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
                  <TextInput
                    className="flex-1 py-3"
                    value={childrenCount}
                    onChangeText={setChildrenCount}
                    placeholder="Çocuk sayısı"
                    placeholderTextColor={'#000'}
                    keyboardType="numeric"
                  />
                </View>
              </View>
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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Aylık Gelir (₺)</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              placeholder="Aylık geliriniz"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
            />
          </View>
        </View>

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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Güvenlik Tercihleri</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={securityPreferences}
              onChangeText={setSecurityPreferences}
              placeholder="Örn: 7/24 güvenlik, kamera sistemi"
              placeholderTextColor={'#000'}
            />
          </View>
        </View>

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

        <View className="mb-3">
          <Text className="text-gray-600 mb-2">Ek Notlar</Text>
          <View className="bg-gray-100 px-3 rounded-lg border border-gray-200">
            <TextInput
              className="flex-1 py-3"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Belirtmek istediğiniz diğer tercihler"
              placeholderTextColor={'#000'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </FormSection>
    </View>
  );

  const handleSubmit = async () => {
    try {
      if (userRole === "EVSAHIBI") {
        // Create landlord expectations
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

        const response = await createLandlordExpectation(
          expectationData
        ).unwrap();

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Beklenti profili başarıyla oluşturuldu", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert(
            "Hata",
            response?.message || "Beklenti profili oluşturulamadı"
          );
        }
      } else {
        // Create tenant expectations
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

        const response = await createTenantExpectation(
          expectationData
        ).unwrap();

        if (response && response.isSuccess) {
          Alert.alert("Başarılı", "Beklenti profili başarıyla oluşturuldu", [
            { text: "Tamam", onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert(
            "Hata",
            response?.message || "Beklenti profili oluşturulamadı"
          );
        }
      }
    } catch (error) {
      console.error("Beklenti profili oluşturma hatası:", error);
      Alert.alert(
        "Hata",
        error?.data?.message ||
        "Beklenti profili oluşturulurken bir hata oluştu"
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">
          Beklenti profili oluşturuluyor...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ paddingTop: Platform.OS === "android" ? 25 : 0 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-800">
                Beklenti Profili Oluştur
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text className="text-green-500">İptal</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-6">
              Bu bilgiler, size en uygun eşleşmelerin sunulmasında yardımcı
              olacaktır. Daha fazla bilgi sağlamanız, daha doğru sonuçlar
              almanızı sağlar.
            </Text>

            {/* Render appropriate form based on user role */}
            {userRole === "EVSAHIBI"
              ? renderLandlordForm()
              : renderTenantForm()}

            <TouchableOpacity
              className="bg-green-500 py-3 rounded-lg mb-10 mt-6"
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text className="text-white font-bold text-center text-lg">
                {isLoading ? "Oluşturuluyor..." : "Beklenti Profilini Oluştur"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileExpectationScreen;
