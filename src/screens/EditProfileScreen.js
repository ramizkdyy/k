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
} from "../redux/api/apiSlice";
import {
  selectUserProfile,
  setUserProfile,
  updateProfileImageStatus,
  updateCoverImageStatus,
} from "../redux/slices/profileSlice";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Pencil } from "lucide-react-native";
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

// Image Picker Modal Component
const ImagePickerModal = ({
  isVisible,
  onClose,
  onGallery,
  onCamera,
  onRemove,
  hasCurrentImage,
  imageType, // "profile" veya "cover"
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const getModalHeight = () => {
    const headerHeight = 80;
    const itemHeight = 60;
    const bottomPadding = 40;
    const itemCount = hasCurrentImage ? 3 : 2; // Kaldır seçeneği varsa 3, yoksa 2

    return headerHeight + itemCount * itemHeight + bottomPadding;
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
    if (action === "gallery") {
      onGallery();
    } else if (action === "camera") {
      onCamera();
    } else if (action === "remove") {
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
                {imageType === "profile"
                  ? "Profil Fotoğrafı"
                  : "Kapak Fotoğrafı"}
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
              className="py-4 px-7 flex-row items-center"
              onPress={() => handleOptionSelect("gallery")}
              activeOpacity={0.7}
            >
              <Text className="text-lg text-gray-700 flex-1">
                Galeriden Seç
              </Text>
            </TouchableOpacity>

            {/* Fotoğraf Çek */}
            <TouchableOpacity
              className="py-4 px-7 flex-row items-center"
              onPress={() => handleOptionSelect("camera")}
              activeOpacity={0.7}
            >
              <Text className="text-lg text-gray-700 flex-1">Fotoğraf Çek</Text>
            </TouchableOpacity>

            {/* Fotoğrafı Kaldır - Sadece mevcut fotoğraf varsa */}
            {hasCurrentImage && (
              <TouchableOpacity
                className="py-4 px-7 flex-row items-center"
                onPress={() => handleOptionSelect("remove")}
                activeOpacity={0.7}
              >
                <Text className="text-lg flex-1">Fotoğrafı Kaldır</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// Header Component
const EditProfileHeader = ({ navigation, onSave, isLoading }) => (
  <View style={{ paddingVertical: 12 }} className="px-3 relative bg-white">
    <View className="flex-row justify-between ml-2 items-center w-full">
      {/* Sol taraf - Geri butonu */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="flex-row items-center"
      >
        <ChevronLeft size={22} color="#0d0d0d" />
      </TouchableOpacity>

      {/* Sağ taraf - Save butonu */}
      <TouchableOpacity
        className="px-1 items-center justify-center"
        onPress={onSave}
        disabled={isLoading}
      >
        <Text className="font-semibold border-2 px-4 py-2 rounded-full  text-gray-900 text-s">
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

// Custom TextInput Component for description
const CustomTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  maxLength,
}) => (
  <View className="mb-6">
    <Text style={{ fontSize: 16 }} className="font-semibold text-gray-900 mb-3">
      {label}
    </Text>
    <View
      className="border border-gray-900 rounded-xl px-4 py-4"
      style={{ height: SCREEN_HEIGHT * 0.2 }}
    >
      <TextInput
        className="text-gray-900 text-base"
        placeholder={placeholder}
        placeholderTextColor="#b0b0b0"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        style={{ fontSize: 16 }}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  </View>
);

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

  // States
  const [profileImage, setProfileImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);
  const [profileDescription, setProfileDescription] = useState("");
  const [imageRemoved, setImageRemoved] = useState(false);

  // API Queries and Mutations
  const {
    data: profileData,
    isLoading: profileLoading,
    isSuccess: profileSuccess,
  } = userRole === "EVSAHIBI"
      ? useGetLandlordProfileQuery(currentUser?.id, { skip: !currentUser?.id })
      : useGetTenantProfileQuery(currentUser?.id, { skip: !currentUser?.id });

  const [updateLandlordProfile, { isLoading: updateLandlordLoading }] =
    useUpdateLandlordProfileMutation();
  const [updateTenantProfile, { isLoading: updateTenantLoading }] =
    useUpdateTenantProfileMutation();

  const isLoading = useMemo(() => {
    return profileLoading || updateLandlordLoading || updateTenantLoading;
  }, [profileLoading, updateLandlordLoading, updateTenantLoading]);

  // Load profile data
  useEffect(() => {
    if (profileSuccess && profileData?.isSuccess && profileData?.result) {
      const profile = profileData.result;
      console.log("Loading profile data:", profile);
      dispatch(setUserProfile(profile));

      if (profile.profileImageUrl) {
        setPreviewProfileImage(profile.profileImageUrl);
      }

      // Açıklama bilgisini yükle
      if (profile.profileDescription) {
        setProfileDescription(profile.profileDescription);
      }
    }
  }, [profileSuccess, profileData, dispatch]);

  const handleImageSelection = (type) => {
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

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1], // Profil fotoğrafı için kare format
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setPreviewProfileImage(result.assets[0].uri);
        setImageRemoved(false); // Reset removal flag when new image is selected
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu");
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

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Profil fotoğrafı için kare format
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setPreviewProfileImage(result.assets[0].uri);
        setImageRemoved(false); // Reset removal flag when new image is taken
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setPreviewProfileImage(null);
    setImageRemoved(true);
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("UserId", currentUser.id);

      // Handle profile image
      if (profileImage) {
        // New image selected
        const profileImageName = profileImage.split("/").pop();
        const profileImageType = profileImageName.split(".").pop();
        formData.append("ProfileImage", {
          uri: profileImage,
          name: profileImageName,
          type: `image/${profileImageType}`,
        });
        dispatch(updateProfileImageStatus("uploading"));
      } else if (imageRemoved) {
        // Image was explicitly removed - send empty string
        formData.append("ProfileImageUrl", "");
      }

      // Add description
      formData.append("ProfileDescription", profileDescription || "");

      const response =
        userRole === "EVSAHIBI"
          ? await updateLandlordProfile(formData).unwrap()
          : await updateTenantProfile(formData).unwrap();

      console.log("Profil güncelleme yanıtı:", response);

      if (response && response.isSuccess) {
        // Reset the removal flag after successful update
        setImageRemoved(false);

        Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.", [
          { text: "Tamam", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Hata", response?.message || "Profil güncellenemedi.");
      }

      // Reset image upload status
      dispatch(updateProfileImageStatus(null));
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
    }
  };

  // Loading state
  if (profileLoading && !userProfile) {
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
          {/* Profile image section */}
          <View className="relative mb-8 mt-8 px-5">
            <TouchableOpacity
              activeOpacity={0.7}
              className="overflow-hidden justify-center items-center"
              onPress={() => handleImageSelection("profile")}
            >
              <View className="relative">
                {/* Profil resmi container - her zaman aynı boyut */}
                <View
                  className="rounded-full bg-white border-4 border-white overflow-hidden"
                  style={{
                    width: 120,
                    height: 120,
                    backgroundColor: previewProfileImage ? "white" : "#f3f4f6", // Resim yoksa gri arka plan
                    borderWidth: 3,
                    borderColor: "#111827",
                  }}
                >
                  {previewProfileImage ? (
                    /* Profil resmi varsa göster */
                    <Image
                      source={{ uri: previewProfileImage }}
                      style={{
                        width: 120,
                        height: 120,
                      }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  ) : (
                    /* Profil resmi yoksa placeholder */
                    <View className="w-full h-full bg-white justify-center items-center">
                      <Text className="text-gray-600 text-4xl font-bold">
                        {currentUser?.name?.charAt(0) || "P"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Edit butonu - her zaman aynı stil ve pozisyon */}
                <View
                  className="absolute right-[6] bottom-[6] bg-gray-900 w-8 h-8 rounded-full justify-center items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Pencil
                    size={16}
                    color="#fff"
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
          {/* Form fields */}
          <View className="px-5 py-4">
            <CustomTextInput
              label="Hakkımda"
              value={profileDescription}
              onChangeText={setProfileDescription}
              placeholder="Kendinizi tanıtın..."
              multiline
              numberOfLines={6}
              maxLength={500}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ImagePickerModal */}
      <ImagePickerModal
        isVisible={isImagePickerVisible}
        onClose={() => setIsImagePickerVisible(false)}
        onGallery={pickImageFromGallery}
        onCamera={takePhoto}
        onRemove={removeImage}
        hasCurrentImage={!!previewProfileImage}
        imageType="profile"
      />
    </View>
  );
};

// Styles
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
