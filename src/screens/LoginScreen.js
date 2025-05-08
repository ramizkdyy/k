import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../redux/api/apiSlice";
import { setCredentials, setHasUserProfile } from "../redux/slices/authSlice";
import { setUserProfile } from "../redux/slices/profileSlice";

const LoginScreen = ({ navigation }) => {
  // State for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redux hooks
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  // Handle login button press
  const handleLogin = async () => {
    // Validate inputs
    if (!username.trim()) {
      Alert.alert("Hata", "Lütfen kullanıcı adı giriniz.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Hata", "Lütfen şifre giriniz.");
      return;
    }

    try {
      console.log("Giriş işlemi başlatılıyor...");

      // Call the login API
      const response = await login({
        userName: username.trim(),
        password: password.trim(),
      }).unwrap();

      console.log("Login API yanıtı:", response);

      // Check if login successful
      if (response && response.isSuccess) {
        // API yanıtından gelen roles dizisini kontrol et
        const userRole =
          response.result.roles && response.result.roles.length > 0
            ? response.result.roles[0]
            : null;

        console.log("API'den gelen rol dizisi:", response.result.roles);
        console.log("Seçilen rol:", userRole);

        // Kullanıcı nesnesini güncellenmiş rolle oluştur
        const updatedUser = {
          ...response.result.user,
          role: response.result.user?.role || userRole,
        };

        console.log("Güncellenmiş kullanıcı nesnesi:", updatedUser);

        // API'den gelen hasUserProfile değerini al
        const hasUserProfile = response.result.hasUserProfile === true;
        console.log("API'den gelen profil durumu:", hasUserProfile);

        // Store credentials in Redux state
        dispatch(
          setCredentials({
            user: updatedUser,
            token: response.result.token,
            hasUserProfile: hasUserProfile,
          })
        );

        // Profil durumunu açıkça belirt (Redux persist için)
        dispatch(setHasUserProfile(hasUserProfile));

        // Eğer kullanıcının profili varsa API'den profil bilgilerini çekeceğiz
        // Bu işlem AppNavigator'daki ProfileLoader bileşeni tarafından yapılacak
        // Geçici profil kullanmıyoruz artık

        console.log("Kimlik bilgileri Redux'a kaydedildi");
        console.log("Kullanıcı rolü:", updatedUser.role);
        console.log("Profil durumu:", hasUserProfile);

        // Kullanıcı AppNavigator tarafından yönlendirilecek
        console.log(
          "Redux state güncellendi, AppNavigator tarafından yönlendirilecek"
        );
      } else {
        // Show error if response is not successful
        console.log("Giriş hatası:", response?.message);
        Alert.alert(
          "Giriş Başarısız",
          response?.message || "Kullanıcı adı veya şifre hatalı."
        );
      }
    } catch (error) {
      // Handle API call errors
      console.error("Login error:", error);
      Alert.alert(
        "Giriş Hatası",
        error.data?.message ||
          "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  // While API call in progress
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">Giriş yapılıyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-grow">
        <View className="items-center mt-12 mb-8">
          {/* App logo */}
          <Image
            source={require("../../assets/logo_kirax.jpg")}
            className="w-40 h-40 mb-3"
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-blue-500">Kirax</Text>
          <Text className="text-base text-gray-600 mt-1">
            Kiralama Uygulaması
          </Text>
        </View>

        <View className="px-5">
          <View className="mb-5">
            <Text className="text-base mb-2 text-gray-600">Kullanıcı Adı</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Kullanıcı adınızı giriniz"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-5">
            <Text className="text-base mb-2 text-gray-600">Şifre</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg border border-gray-200">
              <TextInput
                className="flex-1 h-12 px-4 text-base"
                placeholder="Şifrenizi giriniz"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                className="px-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text className="text-blue-500 text-sm">
                  {showPassword ? "Gizle" : "Göster"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity className="self-end mb-6">
            <Text className="text-blue-500 text-sm">Şifremi Unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`bg-blue-500 rounded-lg h-12 justify-center items-center mb-5 ${
              isLoading ? "opacity-70" : ""
            }`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold">Giriş Yap</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-2">
            <Text className="text-base text-gray-600">Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-base text-blue-500 font-semibold">
                Kayıt Ol
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
