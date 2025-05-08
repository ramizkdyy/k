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
  SafeAreaView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectUserRole,
  logout,
} from "../redux/slices/authSlice";
import {
  useCreateLandlordProfileMutation,
  useCreateTenantProfileMutation,
} from "../redux/api/apiSlice";
import {
  setUserProfile,
  updateProfileImageStatus,
  updateCoverImageStatus,
} from "../redux/slices/profileSlice";
import * as ImagePicker from "expo-image-picker";

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

const CreateProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Ortak state değişkenleri
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null); // 'profile' or 'cover'

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

  // UseCreateXXXProfileMutation hooks
  const [createLandlordProfile, { isLoading: createLandlordLoading }] =
    useCreateLandlordProfileMutation();
  const [createTenantProfile, { isLoading: createTenantLoading }] =
    useCreateTenantProfileMutation();

  const isLoading = createLandlordLoading || createTenantLoading;

  useEffect(() => {
    // Profil oluşturma sayfasını açıldığında kullanıcı adı/soyad bilgisini dolduralım
    if (currentUser && userRole) {
      if (userRole === "EVSAHIBI") {
        setDescription(
          `Merhaba, ben ${currentUser.name || ""} ${
            currentUser.surname || ""
          }. Kiralayanlar için buradayım.`
        );
      } else {
        setProfileDescription(
          `Merhaba, ben ${currentUser.name || ""} ${
            currentUser.surname || ""
          }. Kiralık ev arıyorum.`
        );
      }
    }
  }, [currentUser, userRole]);

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

  // Veri doğrulama
  const validateForm = () => {
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

  const handleGoBack = () => {
    // Rol seçimi ekranına geri dön
    navigation.navigate("RoleSelection");
  };

  // Çıkış yapma işlevi
  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Çıkış Yap",
          onPress: () => {
            dispatch(logout());
            // Giriş ekranına yönlendirme
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
          style: "destructive",
        },
      ]
    );
  };

  // Handle form submission
  const handleCreateProfile = async () => {
    // Form doğrulama
    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();

      // Add common fields
      formData.append("UserId", currentUser.id);

      // Add profile image if selected
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

      // Add cover image if selected
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

      // Add role-specific fields
      if (userRole === "EVSAHIBI") {
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

        // Alanları logla
        console.log("Formda bulunan alanlar:");
        for (let [key, value] of formData.entries()) {
          console.log(`- ${key}: ${value}`);
        }

        // Create landlord profile
        const response = await createLandlordProfile(formData).unwrap();
        console.log("EVSAHIBI profil oluşturma yanıtı:", response);

        if (response && response.isSuccess) {
          // Redux'a profil bilgisini kaydet
          if (response.result) {
            dispatch(setUserProfile(response.result));
          }

          Alert.alert("Başarılı", "Profiliniz başarıyla oluşturuldu.", [
            {
              text: "Tamam",
              onPress: () => {
                // App navigator otomatik olarak ana sayfaya yönlendirecek
              },
            },
          ]);
        } else {
          Alert.alert(
            "Hata",
            (response && response.message) || "Profil oluşturulamadı."
          );
        }
      } else {
        formData.append("Location", location);
        formData.append("PriceRange", priceRange);
        formData.append("NumberOfPeople", numberOfPeople);
        formData.append("Profession", profession);
        formData.append("MaritalStatus", maritalStatus);
        formData.append("ProfileDescription", profileDescription || "");

        // Alanları logla
        console.log("Formda bulunan alanlar:");
        for (let [key, value] of formData.entries()) {
          console.log(`- ${key}: ${value}`);
        }

        // Create tenant profile
        const response = await createTenantProfile(formData).unwrap();
        console.log("Tenant profil oluşturma yanıtı:", response);

        if (response && response.isSuccess) {
          // Redux'a profil bilgisini kaydet
          if (response.result) {
            dispatch(setUserProfile(response.result));
          }

          Alert.alert("Başarılı", "Profiliniz başarıyla oluşturuldu.", [
            {
              text: "Tamam",
              onPress: () => {
                // App navigator otomatik olarak ana sayfaya yönlendirecek
              },
            },
          ]);
        } else {
          Alert.alert(
            "Hata",
            (response && response.message) || "Profil oluşturulamadı."
          );
        }
      }

      // Reset image upload statuses
      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    } catch (error) {
      console.error("Profile creation error:", error);

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
          "Oluşturma Hatası",
          (error && error.data && error.data.message) ||
            "Profil oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }

      // Reset image upload statuses on error
      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">
          Profil oluşturuluyor...
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
        {/* Header - Üst kısımda çıkış yapma tuşunu ekledik */}
        <View className="px-5 py-6 flex-row items-center justify-between bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            Profil Oluştur
          </Text>
          <View className="flex-row items-center">
            <Text className="text-blue-500 mr-4">
              {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"}
            </Text>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-500 px-3 py-1 rounded-md"
            >
              <Text className="text-white font-medium">Çıkış</Text>
            </TouchableOpacity>
          </View>
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

        {/* Form fields */}
        <View className="px-5">
          <TouchableOpacity
            className="rounded-lg h-12 justify-center items-center bg-gray-500 flex-1 mr-2 mb-4"
            onPress={handleGoBack}
          >
            <Text className="text-white text-base font-semibold">Geri Dön</Text>
          </TouchableOpacity>
          {/* Role-specific fields */}
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

          {/* Create button */}
          <TouchableOpacity
            className={`rounded-lg h-12 justify-center items-center mb-10 ${
              isLoading ? "bg-blue-300" : "bg-blue-500"
            }`}
            onPress={handleCreateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Profili Oluştur
              </Text>
            )}
          </TouchableOpacity>
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

export default CreateProfileScreen;
