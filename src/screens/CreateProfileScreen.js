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
  FlatList,
  Switch,
  SafeAreaView,
  ActionSheetIOS,
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
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";

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
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-lg max-h-1/2">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text className="text-green-500 font-bold">Kapat</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 border-b border-gray-100 ${
                    value === item ? "bg-green-50" : ""
                  }`}
                  onPress={() => {
                    setValue(item);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    className={`text-base ${
                      value === item
                        ? "text-green-500 font-semibold"
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

import { useNavigation } from "@react-navigation/native";

const CreateProfileScreen = (props) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Ortak state değişkenleri
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);
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

  // Image picker functions - Native Action Sheet kullan
  const handleImageSelection = async (type) => {
    setActiveImageType(type);

    // Mevcut fotoğraf var mı kontrol et
    const hasCurrentImage =
      type === "profile" ? previewProfileImage : previewCoverImage;

    if (Platform.OS === "ios") {
      // iOS Native Action Sheet (alttan çıkar)
      const options = hasCurrentImage
        ? ["İptal", "Galeriden Seç", "Fotoğraf Çek", "Fotoğrafı Kaldır"]
        : ["İptal", "Galeriden Seç", "Fotoğraf Çek"];

      const destructiveButtonIndex = hasCurrentImage ? 3 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: type === "profile" ? "Profil Fotoğrafı" : "Kapak Fotoğrafı",
          options: options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromGallery();
          } else if (buttonIndex === 2) {
            takePhoto();
          } else if (buttonIndex === 3 && hasCurrentImage) {
            removeImage();
          }
        }
      );
    } else {
      // Android için Alert dialog (alttan çıkar)
      const buttons = [
        {
          text: "Galeriden Seç",
          onPress: () => pickImageFromGallery(),
        },
        {
          text: "Fotoğraf Çek",
          onPress: () => takePhoto(),
        },
      ];

      if (hasCurrentImage) {
        buttons.push({
          text: "Fotoğrafı Kaldır",
          onPress: () => removeImage(),
          style: "destructive",
        });
      }

      buttons.push({
        text: "İptal",
        style: "cancel",
      });

      Alert.alert(
        type === "profile" ? "Profil Fotoğrafı" : "Kapak Fotoğrafı",
        "Fotoğraf seçin",
        buttons,
        { cancelable: true }
      );
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
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
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
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
    }
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

  // Handle form submission - MODIFIED TO ONLY SEND REQUIRED FIELDS
  const handleCreateProfile = async () => {
    try {
      const formData = new FormData();

      // Add user ID (required for association)
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

      // Add ProfileDescription field (using the appropriate field based on role)
      if (userRole === "EVSAHIBI") {
        formData.append("ProfileDescription", description || "");
      } else {
        formData.append("ProfileDescription", profileDescription || "");
      }

      // Log the fields in the form
      console.log("Formda bulunan alanlar:");
      for (let [key, value] of formData.entries()) {
        console.log(`- ${key}: ${value}`);
      }

      // Create profile based on user role
      let response;
      if (userRole === "EVSAHIBI") {
        response = await createLandlordProfile(formData).unwrap();
        console.log("EVSAHIBI profil oluşturma yanıtı:", response);
      } else {
        response = await createTenantProfile(formData).unwrap();
        console.log("Tenant profil oluşturma yanıtı:", response);
      }

      if (response && response.isSuccess) {
        // Save profile information to Redux
        if (response.result) {
          dispatch(setUserProfile(response.result));
        }

        Alert.alert("Başarılı", "Profiliniz başarıyla oluşturuldu.", [
          {
            text: "Tamam",
            onPress: () => {
              // App navigator will automatically redirect to the main page
            },
          },
        ]);
      } else {
        Alert.alert(
          "Hata",
          (response && response.message) || "Profil oluşturulamadı."
        );
      }

      // Reset image upload statuses
      dispatch(updateProfileImageStatus(null));
      dispatch(updateCoverImageStatus(null));
    } catch (error) {
      console.error("Profile creation error:", error);

      // Show detailed error messages
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
        <ActivityIndicator size="small" color="#000" />
        <Text className="mt-3 text-base text-gray-500">
          Profil oluşturuluyor...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View className="px-5 py-6 flex-row items-center justify-between bg-white">
          <Text style={{ fontSize: 20 }} className="font-bold text-gray-900">
            Profil oluştur
          </Text>
          <View className="flex-row gap-2 items-center">
            <Text className="text-gray-900 mr-2">
              {userRole === "EVSAHIBI" ? "Ev sahibi" : "Kiracı"}
            </Text>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile image and cover photo section */}
          <View className="relative mb-6 mt-4 px-5">
            {/* Cover photo */}
            <TouchableOpacity
              activeOpacity={1}
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              className="w-full h-40 bg-white rounded-3xl overflow-hidden"
              onPress={() => handleImageSelection("cover")}
            >
              {previewCoverImage ? (
                <View className="w-full h-full relative">
                  <Image
                    source={{ uri: previewCoverImage }}
                    className="w-full h-full"
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                  {/* Cover photo edit button */}
                  <View
                    style={{ boxShadow: "0px 0px 12px #00000014" }}
                    className="absolute right-4 bottom-4 bg-white p-2 rounded-full"
                  >
                    <FontAwesomeIcon icon={faPlus} size={16} color="#000" />
                  </View>
                </View>
              ) : (
                <View className="w-full h-full justify-center items-center bg-white">
                  {/* Add cover photo placeholder */}
                  <View
                    style={{ boxShadow: "0px 0px 12px #00000014" }}
                    className="absolute right-4 bottom-4 bg-white p-2 rounded-full"
                  >
                    <FontAwesomeIcon icon={faPlus} size={16} color="#000" />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile picture - positioned over cover photo */}
            <View className="absolute inset-0 justify-center items-center">
              <TouchableOpacity onPress={() => handleImageSelection("profile")}>
                <View className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                  {previewProfileImage ? (
                    <Image
                      source={{ uri: previewProfileImage }}
                      className="w-full h-full"
                      contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    />
                  ) : (
                    <View className="w-full h-full bg-gray-100 justify-center items-center">
                      <Text
                        style={{ fontSize: 40 }}
                        className="text-gray-900 font-bold"
                      >
                        {currentUser?.name?.charAt(0) || "P"}
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  style={{ boxShadow: "0px 0px 12px #00000014" }}
                  className="absolute right-0 bottom-0 bg-white w-8 h-8 rounded-full justify-center items-center"
                >
                  <FontAwesomeIcon icon={faPlus} size={16} color="#000" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form fields */}
          <View className="px-5 pb-10">
            {/* Description field */}
            <View className="rounded-xl mb-6">
              <View className="mb-2">
                <Text
                  style={{ fontSize: 20 }}
                  className="font-bold text-gray-800 mb-2"
                >
                  Açıklama
                </Text>
                <Text className="mb-4">
                  {
                    <Text style={{ fontSize: 12 }} className="text-gray-500">
                      {userRole === "EVSAHIBI"
                        ? "Kendinizi kısaca tanıtın ve ev sahibi olarak kiracınızdan beklentilerinizi paylaşın. (Örn: Evi uzun süreli ve sorumluluk sahibi bir kiracıya vermek istiyorum.)"
                        : "Lütfen kendinizi tanıtın: kim olduğunuzu, mesleğinizi ve ev arama amacınızı yazın. (Örn: 25 yaşında bir yazılım mühendisiyim, işe yakın ve sessiz bir ev arıyorum.)"}
                    </Text>
                  }
                </Text>
                <TextInput
                  style={{ fontSize: 16 }}
                  className=" p-3 rounded-lg border border-gray-900 min-h-[100px]"
                  value={
                    userRole === "EVSAHIBI" ? description : profileDescription
                  }
                  onChangeText={
                    userRole === "EVSAHIBI"
                      ? setDescription
                      : setProfileDescription
                  }
                  placeholder={
                    userRole === "EVSAHIBI"
                      ? "Eklemek istediğiniz bilgileri yazınız"
                      : "Kendinizi kısaca tanıtın"
                  }
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Create button */}
            <TouchableOpacity
              activeOpacity={0.7}
              className={`rounded-lg h-12 justify-center items-center
bg-green-300`}
              onPress={handleCreateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{ fontSize: 16 }}
                  className="text-white font-semibold"
                >
                  Devam et
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateProfileScreen;
