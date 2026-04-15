import React, { useState, useEffect } from "react";
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
import { Pencil, ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Image Picker Modal - EditProfileScreen ile aynı
const ImagePickerModal = ({
  isVisible,
  onClose,
  onGallery,
  onCamera,
  onRemove,
  hasCurrentImage,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const getModalHeight = () => {
    const headerHeight = 80;
    const itemHeight = 60;
    const bottomPadding = 40;
    const itemCount = hasCurrentImage ? 3 : 2;
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

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleOptionSelect = (action) => {
    translateY.value = SCREEN_HEIGHT;
    backdropOpacity.value = 0;
    onClose();

    if (action === "gallery") onGallery();
    else if (action === "camera") onCamera();
    else if (action === "remove") onRemove();
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
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View style={[styles.modal, modalStyle]}>
          <View className="py-4 px-6 border-b border-gray-100 bg-white">
            <View className="flex-row justify-between items-center">
              <Text style={{ fontWeight: 600, fontSize: 18 }} className="text-gray-800">
                Profil Fotoğrafı
              </Text>
              <TouchableOpacity onPress={handleClose} className="px-2 py-2">
                <Text style={{ fontSize: 15, color: "#007AFF", fontWeight: "500" }}>
                  Kapat
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white">
            <TouchableOpacity
              className="py-4 px-7 flex-row items-center"
              onPress={() => handleOptionSelect("gallery")}
              activeOpacity={0.7}
            >
              <Text className="text-lg text-gray-700 flex-1">Galeriden Seç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 px-7 flex-row items-center"
              onPress={() => handleOptionSelect("camera")}
              activeOpacity={0.7}
            >
              <Text className="text-lg text-gray-700 flex-1">Fotoğraf Çek</Text>
            </TouchableOpacity>

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

// Header - EditProfileScreen ile aynı stil
const CreateProfileHeader = ({ navigation, userRole }) => (
  <View style={{ paddingVertical: 12 }} className="px-3 relative bg-white">
    <View className="flex-row justify-between ml-2 items-center w-full">
      <TouchableOpacity
        onPress={() => navigation.navigate("RoleSelection")}
        className="flex-row items-center"
      >
        <ChevronLeft size={22} color="#0d0d0d" />
      </TouchableOpacity>

      <Text className="text-gray-900 mr-2 font-medium">
        {userRole === "EVSAHIBI" ? "Ev sahibi" : "Kiracı"}
      </Text>
    </View>

    <View className="absolute inset-0 justify-center items-center pointer-events-none">
      <Text className="text-gray-500" style={{ fontWeight: 500, fontSize: 14 }}>
        Profil oluştur
      </Text>
    </View>
  </View>
);

// Description Input - EditProfileScreen ile aynı stil
const DescriptionInput = ({ value, onChangeText, placeholder }) => (
  <View className="mb-6">
    <Text style={{ fontSize: 16 }} className="font-semibold text-gray-900 mb-3">
      Hakkımda
    </Text>
    <View
      className="border border-gray-400 rounded-xl px-4 py-4"
      style={{ height: SCREEN_HEIGHT * 0.2 }}
    >
      <TextInput
        className="text-gray-900 text-base"
        placeholder={placeholder}
        placeholderTextColor="#b0b0b0"
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={6}
        maxLength={500}
        style={{ fontSize: 16 }}
        textAlignVertical="top"
      />
    </View>
  </View>
);

const CreateProfileScreen = (props) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const insets = useSafeAreaInsets();

  const [profileImage, setProfileImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [description, setDescription] = useState("");

  const [createLandlordProfile, { isLoading: createLandlordLoading }] =
    useCreateLandlordProfileMutation();
  const [createTenantProfile, { isLoading: createTenantLoading }] =
    useCreateTenantProfileMutation();

  const isLoading = createLandlordLoading || createTenantLoading;

  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === "EVSAHIBI") {
        setDescription(
          `Merhaba, ben ${currentUser.name || ""} ${currentUser.surname || ""}. Kiralayanlar için buradayım.`
        );
      } else {
        setDescription(
          `Merhaba, ben ${currentUser.name || ""} ${currentUser.surname || ""}. Kiralık ev arıyorum.`
        );
      }
    }
  }, [currentUser, userRole]);

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni gereklidir.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setPreviewProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
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
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setPreviewProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setPreviewProfileImage(null);
  };

  const handleCreateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("UserId", currentUser.id);

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

      formData.append("ProfileDescription", description || "");

      let response;
      if (userRole === "EVSAHIBI") {
        response = await createLandlordProfile(formData).unwrap();
      } else {
        response = await createTenantProfile(formData).unwrap();
      }

      if (response && response.isSuccess) {
        if (response.result) {
          dispatch(setUserProfile(response.result));
        }

        Alert.alert("Başarılı", "Profiliniz başarıyla oluşturuldu.", [
          { text: "Tamam" },
        ]);
      } else {
        Alert.alert("Hata", (response && response.message) || "Profil oluşturulamadı.");
      }

      dispatch(updateProfileImageStatus(null));
    } catch (error) {
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

      dispatch(updateProfileImageStatus(null));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="small" color="#000" />
        <Text className="mt-3 text-base text-gray-500">Profil oluşturuluyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <CreateProfileHeader navigation={navigation} userRole={userRole} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profil fotoğrafı - EditProfileScreen ile aynı */}
          <View className="relative mb-8 mt-8 px-5">
            <TouchableOpacity
              activeOpacity={0.7}
              className="overflow-hidden justify-center items-center"
              onPress={() => setIsImagePickerVisible(true)}
            >
              <View className="relative">
                <View
                  className="rounded-full overflow-hidden"
                  style={{
                    width: 120,
                    height: 120,
                    backgroundColor: previewProfileImage ? "white" : "#f3f4f6",
                    borderWidth: 3,
                    borderColor: "#111827",
                  }}
                >
                  {previewProfileImage ? (
                    <Image
                      source={{ uri: previewProfileImage }}
                      style={{ width: 120, height: 120 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  ) : (
                    <View className="w-full h-full bg-white justify-center items-center">
                      <Text className="text-gray-600 text-4xl font-bold">
                        {currentUser?.name?.charAt(0) || "P"}
                      </Text>
                    </View>
                  )}
                </View>

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
                  <Pencil size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="px-5 py-4 flex-1">
            <DescriptionInput
              value={description}
              onChangeText={setDescription}
              placeholder={
                userRole === "EVSAHIBI"
                  ? "Kendinizi ve kiracınızdan beklentilerinizi yazın..."
                  : "Kendinizi kısaca tanıtın..."
              }
            />
          </View>

          {/* Buton */}
          <View className="px-5 pb-8">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCreateProfile}
              disabled={isLoading}
              className="rounded-full border-2 border-gray-900 items-center justify-center py-3"
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                Devam Et
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ImagePickerModal
        isVisible={isImagePickerVisible}
        onClose={() => setIsImagePickerVisible(false)}
        onGallery={pickImageFromGallery}
        onCamera={takePhoto}
        onRemove={removeImage}
        hasCurrentImage={!!previewProfileImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: { flex: 1 },
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

export default CreateProfileScreen;
