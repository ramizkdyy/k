import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../redux/api/apiSlice";
import { setCredentials, setHasUserProfile } from "../redux/slices/authSlice";
import { setUserProfile } from "../redux/slices/profileSlice";

const { width } = Dimensions.get("window");
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEyeSlash, faEye } from "@fortawesome/pro-solid-svg-icons";
import { faApple } from "@fortawesome/free-brands-svg-icons";

import Checkbox from "expo-checkbox";
import { faLock, faUser } from "@fortawesome/pro-light-svg-icons";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [errorlogin, setErrorLogin] = useState("");
  const [isChecked, setChecked] = useState(false);

  // Redux hooks
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
      setErrorLogin(
        error.data?.message ||
          "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  const Shadows = {
    shadow1: {
      // iOS için gölge özellikleri
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 3,

      // Android için
      elevation: 3,
    },
  };

  // Loading indicator while API call in progress
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="small" color="#00000" />
        <Text className="mt-3 text-base text-gray-500">Giriş yapılıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1  bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 60}
        enableOnAndroid={true} // Android'de de etkinleştir
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingBottom: keyboardStatus
                ? Platform.OS === "ios"
                  ? 250
                  : 150
                : 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 items-center gap-5 px-8">
              {/* Logo - Boyutu küçültülmüş ve boşluklar azaltılmış */}
              <View className="">
                <Image
                  source={require("../../assets/logo-kirax.png")}
                  style={{ width: width * 1, height: width * 0.5 }}
                  resizeMode="contain"
                />
              </View>

              {/* Form Alanları - Boşluklar minimize edilmiş */}
              <View className="w-full gap-4">
                <View className="flex flex-col border rounded-xl">
                  <View className="flex gap-4 flex-row items-center px-4 py-4 w-full border-b">
                    <FontAwesomeIcon icon={faUser} size={20} />
                    <TextInput
                      placeholder="Kullanıcı Adı"
                      fontSize={16}
                      className="text-gray-900 flex-1 font-normal"
                      placeholderTextColor="#b0b0b0"
                      value={username}
                      onChangeText={setUsername}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="flex gap-4 flex-row items-center px-4 py-4 w-full">
                    <View className="items-center flex flex-row gap-4 flex-1">
                      <FontAwesomeIcon icon={faLock} size={20} />
                      <TextInput
                        placeholder="Şifre"
                        fontSize={16}
                        className="text-gray-900 font-normal flex-1"
                        placeholderTextColor="#b0b0b0"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <FontAwesomeIcon
                        icon={showPassword ? faEye : faEyeSlash}
                        size={20}
                      />
                    </Pressable>
                  </View>
                </View>{" "}
                <View className="flex-row justify-between items-center w-full">
                  <View className="items-center flex-row gap-2">
                    <Checkbox
                      value={isChecked}
                      onValueChange={setChecked}
                      color={isChecked ? "#86efac" : undefined}
                      style={{
                        borderColor: "#00000",
                        borderRadius: 4,
                        borderWidth: 1.1,
                        width: 18,
                        height: 18,
                      }}
                    />
                    <TouchableOpacity onPress={() => setChecked(!isChecked)}>
                      <Text className="text-gray-900 font-normal text-lg">
                        Beni Hatırla
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                    className="self-end"
                  >
                    <Text className="text-gray-500 underline font-normal">
                      Şifreni mi unuttun?
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                className="rounded-xl bg-green-300 items-center justify-center py-3 w-full mt-3"
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#006400" />
                ) : (
                  <Text className="text-xl text-white font-semibold">
                    Giriş yap
                  </Text>
                )}
              </TouchableOpacity>

              {/* Hata Mesajı */}
              {errorlogin ? (
                <Text className="text-red-500 text-center">{errorlogin}</Text>
              ) : null}

              <View className="flex flex-row items-center w-full my-2">
                <View className="flex-1 h-[1px] bg-gray-200"></View>
                <Text className="mx-3 text-gray-500 font-medium text-[14px]">
                  veya
                </Text>
                <View className="flex-1 h-[1px] bg-gray-200"></View>
              </View>

              {/* Social Login Butonları */}
              <View className="flex justify-center items-center gap-4 w-full">
                <Pressable
                  className="rounded-xl bg-white flex-row items-center px-4 py-3 gap-2 w-full border border-gray-900"
                  onPress={() => console.log("Apple login")}
                >
                  <FontAwesomeIcon icon={faApple} size={20} />
                  <Text
                    className="absolute"
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                    }}
                  >
                    Apple ile devam et
                  </Text>
                </Pressable>

                <Pressable
                  className="rounded-xl bg-white flex-row items-center px-4 py-3 gap-2 w-full border border-gray-900"
                  onPress={() => console.log("Google login")}
                >
                  <Image
                    source={require("../../assets/google-logo.svg")}
                    className="w-6 h-6"
                  />
                  <Text
                    className="absolute"
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                    }}
                  >
                    Google ile devam et
                  </Text>
                </Pressable>
              </View>
              {/* Ayırıcı */}

              {/* Giriş Yap Butonu */}

              {/* Alt Bilgi */}
              <View className="flex-row gap-2 justify-center mt-1 items-center">
                <Text className="font-normal text-gray-500 text-base">
                  Henüz hesabın yok mu?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text className="text-gray-900 font-bold text-lg">
                    Kayıt Ol
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
