import React, { useState, useEffect } from "react";
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
import LocationPicker from "../components/LocationPicker";

const CreatePostScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const savedFormData = useSelector(selectPostFormData);
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();

  // Get property data from route params if exists (for editing)
  const propertyData = route.params?.propertyData;

  // Form state
  const [ilanBasligi, setIlanBasligi] = useState("");
  const [kiraFiyati, setKiraFiyati] = useState("");
  const [location, setLocation] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [odaSayisi, setOdaSayisi] = useState("");
  const [banyoSayisi, setBanyoSayisi] = useState("");
  const [brutMetreKare, setBrutMetreKare] = useState("");
  const [netMetreKare, setNetMetreKare] = useState("");
  const [images, setImages] = useState([]);
  const [propertyType, setPropertyType] = useState("");
  const [isitmaTipi, setIsitmaTipi] = useState("");
  const [depozito, setDepozito] = useState("");
  const [binaYasi, setBinaYasi] = useState("");
  const [toplamKat, setToplamKat] = useState("");
  const [balkon, setBalkon] = useState("");
  const [asansor, setAsansor] = useState("");
  const [otopark, setOtopark] = useState("");
  const [esyali, setEsyali] = useState("");
  const [siteIcerisinde, setSiteIcerisinde] = useState("");
  const [aidat, setAidat] = useState("");
  const [takas, setTakas] = useState("");
  const [minimumKiralamaSuresi, setMinimumKiralamaSuresi] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [kimden, setKimden] = useState("Sahibinden");
  const [mutfak, setMutfak] = useState("");
  const [mahalle, setMahalle] = useState("");
  const [siteAdi, setSiteAdi] = useState("");
  const [paraBirimi, setParaBirimi] = useState("TL");
  const [kullanimDurumu, setKullanimDurumu] = useState("");

  // Location picker states
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

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
    "Merkezi Isıtma",
    "Kombi",
    "Soba",
    "Yerden Isıtma",
    "Klima",
    "Diğer",
  ];

  // Usage status options
  const usageStatusOptions = ["Boş", "Kiracılı", "Mülk Sahibi Oturuyor"];

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

  // Initialize form with property data if editing
  useEffect(() => {
    if (propertyData) {
      setIlanBasligi(propertyData.ilanBasligi || "");
      setKiraFiyati(propertyData.kiraFiyati?.toString() || "");
      setLocation(`${propertyData.ilce}, ${propertyData.il}` || "");
      setPostDescription(propertyData.postDescription || "");
      setOdaSayisi(propertyData.odaSayisi || "");
      setBanyoSayisi(propertyData.banyoSayisi?.toString() || "");
      setBrutMetreKare(propertyData.brutMetreKare?.toString() || "");
      setNetMetreKare(propertyData.netMetreKare?.toString() || "");
      setIsitmaTipi(propertyData.isitmaTipi || "");
      setDepozito(propertyData.depozito?.toString() || "");
      setBinaYasi(propertyData.binaYasi?.toString() || "");
      setToplamKat(propertyData.toplamKat?.toString() || "");
      setBalkon(propertyData.balkon?.toString() || "");
      setAsansor(propertyData.asansor?.toString() || "");
      setOtopark(propertyData.otopark?.toString() || "");
      setEsyali(propertyData.esyali?.toString() || "");
      setSiteIcerisinde(propertyData.siteIcerisinde?.toString() || "");
      setAidat(propertyData.aidat?.toString() || "");
      setTakas(propertyData.takas?.toString() || "");
      setMinimumKiralamaSuresi(
        propertyData.minimumKiralamaSuresi?.toString() || ""
      );
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
      setBrutMetreKare(savedFormData.brutMetreKare || "");
      setNetMetreKare(savedFormData.netMetreKare || "");
      setImages(savedFormData.images || []);
      setPropertyType(savedFormData.propertyType || "");
      setIsitmaTipi(savedFormData.isitmaTipi || "");
      setDepozito(savedFormData.depozito || "");

      // Load saved data for new fields if available
      setIl(savedFormData.il || "");
      setIlce(savedFormData.ilce || "");
      setKimden(savedFormData.kimden || "Sahibinden");
      setMutfak(savedFormData.mutfak || "");
      setMahalle(savedFormData.mahalle || "");
      setSiteAdi(savedFormData.siteAdi || "");
      setParaBirimi(savedFormData.paraBirimi || "TL");
      setKullanimDurumu(savedFormData.kullanimDurumu || "");

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
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add selected image to the array
        const newImage = result.assets[0];
        setImages([
          ...images,
          { uri: newImage.uri, id: Date.now().toString() },
        ]);
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

  // Form validation
  const validateForm = () => {
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
    if (images.length === 0) {
      Alert.alert("Hata", "Lütfen en az bir fotoğraf ekleyiniz.");
      return false;
    }
    // Validate the new required fields
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
      formData.append("IsitmaTipi", isitmaTipi);
      formData.append("ParaBirimi", paraBirimi);
      formData.append("KullanimDurumu", kullanimDurumu);

      // Optional fields
      if (banyoSayisi) formData.append("BanyoSayisi", banyoSayisi);
      if (brutMetreKare) formData.append("BrutMetreKare", brutMetreKare);
      if (netMetreKare) formData.append("NetMetreKare", netMetreKare);
      if (propertyType) formData.append("PropertyType", propertyType);
      if (depozito) formData.append("Depozito", depozito);
      if (binaYasi) formData.append("BinaYasi", binaYasi);
      if (toplamKat) formData.append("ToplamKat", toplamKat);
      if (balkon) formData.append("Balkon", balkon);
      if (asansor) formData.append("Asansor", asansor);
      if (otopark) formData.append("Otopark", otopark);
      if (esyali) formData.append("Esyali", esyali);
      if (siteIcerisinde) formData.append("SiteIcerisinde", siteIcerisinde);
      if (aidat) formData.append("Aidat", aidat);
      if (takas) formData.append("Takas", takas);
      if (minimumKiralamaSuresi)
        formData.append("MinimumKiralamaSuresi", minimumKiralamaSuresi);

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
      console.log("Total images being sent:", newImages.length);
      console.log("Selected coordinates:", selectedCoordinates);
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
        brutMetreKare,
        netMetreKare,
        images,
        propertyType,
        isitmaTipi,
        depozito,
        // Save new fields
        il,
        ilce,
        kimden,
        mutfak,
        mahalle,
        siteAdi,
        paraBirimi,
        kullanimDurumu,
        // Save coordinates
        latitude: selectedCoordinates?.latitude,
        longitude: selectedCoordinates?.longitude,
      })
    );
    Alert.alert("Bilgi", "Form bilgileri kaydedildi.");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-5">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            {propertyData ? "İlanı Düzenle" : "Yeni İlan Oluştur"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Main Form */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          {/* Title */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">
              İlan Başlığı *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base"
              placeholder="Modern 2+1 Daire"
              value={ilanBasligi}
              onChangeText={setIlanBasligi}
            />
          </View>

          {/* Price */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">
              Kira Tutarı (₺) *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base"
              placeholder="3500"
              keyboardType="numeric"
              value={kiraFiyati}
              onChangeText={setKiraFiyati}
            />
          </View>

          {/* Deposit Amount */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">
              Depozito Tutarı (₺)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base"
              placeholder="7000"
              keyboardType="numeric"
              value={depozito}
              onChangeText={setDepozito}
            />
          </View>

          {/* Location with Map Integration */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">Konum *</Text>

            {/* Location Input with Map Button */}
            <View className="flex-row items-center mb-3">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg p-3 text-base mr-2"
                placeholder="Haritadan konum seçin"
                value={location}
                onChangeText={setLocation}
                editable={false}
              />
              <TouchableOpacity
                className="bg-blue-500 rounded-lg p-3"
                onPress={() => setShowLocationPicker(true)}
              >
                <MaterialIcons name="location-on" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Show coordinates if selected */}
            {selectedCoordinates && (
              <View className="bg-gray-100 rounded-lg p-3 mb-3">
                <Text className="text-sm text-gray-600">
                  Koordinatlar: {selectedCoordinates.latitude.toFixed(6)},{" "}
                  {selectedCoordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Manual Location Fields */}
            <View className="flex-row justify-between mb-3">
              <View className="w-[48%]">
                <Text className="text-gray-600 mb-1 text-sm">İl *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="İstanbul"
                  value={il}
                  onChangeText={setIl}
                />
              </View>
              <View className="w-[48%]">
                <Text className="text-gray-600 mb-1 text-sm">İlçe *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="Kadıköy"
                  value={ilce}
                  onChangeText={setIlce}
                />
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="w-[48%]">
                <Text className="text-gray-600 mb-1 text-sm">Mahalle *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="Caferağa"
                  value={mahalle}
                  onChangeText={setMahalle}
                />
              </View>
              <View className="w-[48%]">
                <Text className="text-gray-600 mb-1 text-sm">Site Adı *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="Örnek Site"
                  value={siteAdi}
                  onChangeText={setSiteAdi}
                />
              </View>
            </View>
          </View>

          {/* Property Features */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-3 font-medium">Özellikler</Text>
            <View className="flex-row justify-between">
              <View className="w-[30%]">
                <Text className="text-gray-600 mb-1 text-sm">Oda Sayısı</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="2+1"
                  value={odaSayisi}
                  onChangeText={setOdaSayisi}
                />
              </View>

              <View className="w-[30%]">
                <Text className="text-gray-600 mb-1 text-sm">Banyo</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="1"
                  keyboardType="numeric"
                  value={banyoSayisi}
                  onChangeText={setBanyoSayisi}
                />
              </View>

              <View className="w-[30%]">
                <Text className="text-gray-600 mb-1 text-sm">Alan (m²)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="90"
                  keyboardType="numeric"
                  value={brutMetreKare}
                  onChangeText={setBrutMetreKare}
                />
              </View>
            </View>
          </View>

          {/* Additional required fields */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-3">
              <View className="w-[48%]">
                <Text className="text-gray-600 mb-1 text-sm">
                  Net M² (Alan)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="85"
                  keyboardType="numeric"
                  value={netMetreKare}
                  onChangeText={setNetMetreKare}
                />
              </View>
              <View className="w-[48%]">
                <Text className="text-gray-600 mb-1 text-sm">Mutfak *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="Amerikan Mutfak"
                  value={mutfak}
                  onChangeText={setMutfak}
                />
              </View>
            </View>
          </View>

          {/* Property Type */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">Mülk Tipi</Text>
            <View className="flex-row flex-wrap mt-1">
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                    propertyType === type ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  onPress={() => setPropertyType(type)}
                >
                  <Text
                    className={`${
                      propertyType === type ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Heating Type */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">
              Isınma Tipi *
            </Text>
            <View className="flex-row flex-wrap mt-1">
              {heatingTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                    isitmaTipi === type ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  onPress={() => setIsitmaTipi(type)}
                >
                  <Text
                    className={`${
                      isitmaTipi === type ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Usage Status */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">
              Kullanım Durumu *
            </Text>
            <View className="flex-row flex-wrap mt-1">
              {usageStatusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                    kullanimDurumu === status ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  onPress={() => setKullanimDurumu(status)}
                >
                  <Text
                    className={`${
                      kullanimDurumu === status ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* From Whom (Kimden) */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">Kimden *</Text>
            <View className="flex-row flex-wrap mt-1">
              {["Sahibinden", "Emlakçıdan"].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                    kimden === type ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  onPress={() => setKimden(type)}
                >
                  <Text
                    className={`${
                      kimden === type ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">Açıklama *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base h-32"
              placeholder="İlanınız hakkında detaylı bilgi verin..."
              multiline
              textAlignVertical="top"
              value={postDescription}
              onChangeText={setPostDescription}
            />
          </View>
        </View>

        {/* Images Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <Text className="text-gray-700 mb-3 font-medium">Fotoğraflar *</Text>

          {/* Selected Images */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {images.map((img) => (
              <View key={img.id} className="mr-3 relative">
                <Image
                  source={{ uri: img.uri }}
                  className="w-24 h-24 rounded-lg"
                />
                <TouchableOpacity
                  className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                  onPress={() => removeImage(img.id)}
                >
                  <MaterialIcons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Image Buttons */}
            <View className="flex-row">
              <TouchableOpacity
                className="w-24 h-24 bg-gray-100 rounded-lg justify-center items-center mr-3"
                onPress={() => pickImage(false)}
              >
                <MaterialIcons name="photo-library" size={28} color="#4A90E2" />
                <Text className="text-sm text-gray-600 mt-1">Galeri</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-24 h-24 bg-gray-100 rounded-lg justify-center items-center"
                onPress={() => pickImage(true)}
              >
                <MaterialIcons name="camera-alt" size={28} color="#4A90E2" />
                <Text className="text-sm text-gray-600 mt-1">Kamera</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <Text className="text-sm text-gray-500 mb-2">
            En az 1 fotoğraf ekleyin. En iyi sonuç için farklı açılardan
            çekilmiş net fotoğraflar kullanın.
          </Text>
        </View>

        {/* Additional Property Features Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <Text className="text-gray-700 mb-3 font-medium">Ek Özellikler</Text>

          <View className="flex-row justify-between mb-3">
            <View className="w-[48%]">
              <Text className="text-gray-600 mb-1 text-sm">Bina Yaşı</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base"
                placeholder="5"
                keyboardType="numeric"
                value={binaYasi}
                onChangeText={setBinaYasi}
              />
            </View>
            <View className="w-[48%]">
              <Text className="text-gray-600 mb-1 text-sm">Toplam Kat</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base"
                placeholder="8"
                keyboardType="numeric"
                value={toplamKat}
                onChangeText={setToplamKat}
              />
            </View>
          </View>

          <View className="flex-row justify-between mb-3">
            <View className="w-[48%]">
              <Text className="text-gray-600 mb-1 text-sm">Aidat (TL)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base"
                placeholder="350"
                keyboardType="numeric"
                value={aidat}
                onChangeText={setAidat}
              />
            </View>
            <View className="w-[48%]">
              <Text className="text-gray-600 mb-1 text-sm">
                Min. Kiralama Süresi (Ay)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base"
                placeholder="12"
                keyboardType="numeric"
                value={minimumKiralamaSuresi}
                onChangeText={setMinimumKiralamaSuresi}
              />
            </View>
          </View>

          {/* Toggle Options */}
          <Text className="text-gray-700 mb-2 mt-4 font-medium">
            Ek Seçenekler
          </Text>
          <View className="flex-row flex-wrap">
            {[
              { label: "Balkon", state: balkon, setState: setBalkon },
              { label: "Asansör", state: asansor, setState: setAsansor },
              { label: "Otopark", state: otopark, setState: setOtopark },
              { label: "Eşyalı", state: esyali, setState: setEsyali },
              {
                label: "Site İçerisinde",
                state: siteIcerisinde,
                setState: setSiteIcerisinde,
              },
              { label: "Takas", state: takas, setState: setTakas },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                  option.state === "true" ? "bg-blue-500" : "bg-gray-200"
                }`}
                onPress={() =>
                  option.setState(option.state === "true" ? "false" : "true")
                }
              >
                <Text
                  className={`${
                    option.state === "true" ? "text-white" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Para Birimi Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <Text className="text-gray-700 mb-3 font-medium">Para Birimi</Text>
          <View className="flex-row flex-wrap mt-1">
            {["TL", "USD", "EUR"].map((currency) => (
              <TouchableOpacity
                key={currency}
                className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                  paraBirimi === currency ? "bg-blue-500" : "bg-gray-200"
                }`}
                onPress={() => setParaBirimi(currency)}
              >
                <Text
                  className={`${
                    paraBirimi === currency ? "text-white" : "text-gray-700"
                  }`}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`py-3 rounded-lg mb-10 ${
            isCreating || uploadStatus === "uploading"
              ? "bg-blue-300"
              : "bg-blue-500"
          }`}
          onPress={handleSubmit}
          disabled={isCreating || uploadStatus === "uploading"}
        >
          {isCreating || uploadStatus === "uploading" ? (
            <View className="flex-row justify-center items-center">
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-white font-semibold ml-2">
                {propertyData
                  ? "İlan Güncelleniyor..."
                  : "İlan Oluşturuluyor..."}
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center text-lg">
              {propertyData ? "İlanı Güncelle" : "İlanı Yayınla"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
};

export default CreatePostScreen;
