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
import { useRegisterMutation } from "../redux/api/apiSlice";
import { setCredentials } from "../redux/slices/authSlice";

const RegisterScreen = ({ navigation }) => {
  // State for form inputs
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState(""); // Optional
  const [showPassword, setShowPassword] = useState(false);

  // Redux hooks
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  // Basic email validation
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Basic phone number validation (simple format check)
  const isPhoneValid = (phone) => {
    return /^\d{10,11}$/.test(phone.replace(/[\s()-]/g, ""));
  };

  // Handle register button press
  const handleRegister = async () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert("Hata", "Lütfen adınızı giriniz.");
      return;
    }
    if (!surname.trim()) {
      Alert.alert("Hata", "Lütfen soyadınızı giriniz.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen e-posta adresinizi giriniz.");
      return;
    }
    if (!isEmailValid(email.trim())) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Hata", "Lütfen telefon numaranızı giriniz.");
      return;
    }
    if (!isPhoneValid(phoneNumber.trim())) {
      Alert.alert("Hata", "Lütfen geçerli bir telefon numarası giriniz.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Hata", "Lütfen kullanıcı adı giriniz.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Hata", "Lütfen şifre giriniz.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }

    try {
      // Call the register API
      const response = await register({
        name: name.trim(),
        surname: surname.trim(),
        gender: gender.trim() || null,
        userName: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
      }).unwrap();

      // Check if registration successful
      if (response && response.isSuccess) {
        // Show success message
        Alert.alert(
          "Kayıt Başarılı",
          "Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.",
          [
            {
              text: "Tamam",
              onPress: () => {
                if (response.result && response.result.token) {
                  // If API returns user data and token, store credentials
                  dispatch(
                    setCredentials({
                      user: response.result.user,
                      token: response.result.token,
                    })
                  );

                  // Navigate to role selection
                  navigation.navigate("RoleSelection");
                } else {
                  // Navigate to login if no auto-login
                  navigation.navigate("Login");
                }
              },
            },
          ]
        );
      } else {
        // Show error if response is not successful
        Alert.alert(
          "Kayıt Hatası",
          response?.message || "Kayıt işlemi başarısız oldu."
        );
      }
    } catch (error) {
      // Handle API call errors
      console.error("Register error:", error);
      Alert.alert(
        "Kayıt Hatası",
        error.data?.message ||
        "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  // While API call in progress
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">Kayıt yapılıyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-grow">
        <View className="items-center mt-6 mb-4">
          <Image
            source={require("../../assets/logo-kirax.png")}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>

        <View className="px-5">
          <Text className="text-2xl font-bold text-center mb-5">
            Yeni Hesap Oluştur
          </Text>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">Ad</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Adınızı giriniz"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">Soyad</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Soyadınızı giriniz"
              value={surname}
              onChangeText={setSurname}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">E-posta</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="E-posta adresinizi giriniz"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">Telefon Numarası</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Telefon numaranızı giriniz"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">
              Cinsiyet (İsteğe Bağlı)
            </Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Cinsiyetinizi giriniz"
              value={gender}
              onChangeText={setGender}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">Kullanıcı Adı</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Kullanıcı adınızı giriniz"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm mb-1 text-gray-600">Şifre</Text>
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

          <View className="mb-5">
            <Text className="text-sm mb-1 text-gray-600">Şifre Tekrar</Text>
            <TextInput
              className="h-12 bg-gray-100 rounded-lg px-4 text-base border border-gray-200"
              placeholder="Şifrenizi tekrar giriniz"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            className={`bg-blue-500 rounded-lg h-12 justify-center items-center mb-4 mt-2 ${isLoading ? "opacity-70" : ""
              }`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold">Kaydol</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-1 mb-5">
            <Text className="text-base text-gray-600">
              Zaten hesabınız var mı?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-base text-blue-500 font-semibold">
                Giriş Yap
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
