import React, { useState, useEffect } from 'react';
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
  StatusBar
} from "react-native";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../redux/api/apiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { CommonActions } from "@react-navigation/native";

const { width } = Dimensions.get("window");
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faLock, faEyeSlash, faEye } from '@fortawesome/pro-solid-svg-icons';
import { faApple } from '@fortawesome/free-brands-svg-icons';


import Checkbox from 'expo-checkbox';



const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [errorlogin, setErrorLogin] = useState('');
  const [isChecked, setChecked] = useState(false);

  // Redux hooks
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
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
      Alert.alert('Hata', 'Lütfen kullanıcı adı giriniz.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Hata', 'Lütfen şifre giriniz.');
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
        // Store credentials in Redux state
        dispatch(
          setCredentials({
            user: response.result.user,
            token: response.result.token,
          })
        );
        console.log("Kimlik bilgileri Redux'a kaydedildi");
        console.log("Kullanıcı rolü:", response.result.user?.role);

        // Başarılı giriş sonrası, kullanıcı rol bilgisi kontrolü
        // Navigasyon otomatik olarak AppNavigator tarafından yapılacak
        // Ekstra bir yönlendirme yapmaya gerek yok
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
      console.error('Login error:', error);
      setErrorLogin(
        error.data?.message ||
        'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.'
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

    }
  };

  // Loading indicator while API call in progress
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#006400" />
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
              paddingBottom: keyboardStatus ? (Platform.OS === 'ios' ? 250 : 150) : 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 items-center gap-5 px-8">
              {/* Logo - Boyutu küçültülmüş ve boşluklar azaltılmış */}
              <View className="mt-16 mb-10">
                <Image
                  source={require("../../assets/logo-kirax.png")}
                  style={{ width: width * 0.5, height: width * 0.3 }}
                  resizeMode="contain"
                />

              </View>



              {/* Social Login Butonları */}
              <View className="flex justify-center items-center gap-4 w-full">
                <Pressable
                  className="rounded-[12px] bg-white flex-row items-center justify-center px-4 py-3 gap-2 w-full"
                  style={[Shadows.shadow1]}
                  onPress={() => console.log('Apple login')}
                >
                  <FontAwesomeIcon icon={faApple} size={20} />
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    Apple ile devam et
                  </Text>
                </Pressable>

                <Pressable
                  className="rounded-[12px] bg-white flex-row items-center justify-center px-4 py-3 gap-2 w-full"
                  style={[Shadows.shadow1]}
                  onPress={() => console.log('Google login')}
                >
                  <Image source={require('../../assets/google-logo.svg')} className="w-6 h-6" />
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    Google ile devam et
                  </Text>
                </Pressable>
              </View>


              <View className="flex flex-row items-center w-full my-2">
                <View className="flex-1 h-[1px] bg-gray-500"></View>
                <Text className="mx-3 text-gray-500 font-medium text-[14px]">Veya</Text>
                <View className="flex-1 h-[1px] bg-gray-500"></View>
              </View>

              {/* Form Alanları - Boşluklar minimize edilmiş */}
              <View className="w-full gap-4">
                <View

                  className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full"
                >
                  <FontAwesomeIcon icon={faUser} size={20} color="#6b7280" />
                  <TextInput
                    placeholder='Kullanıcı Adı'
                    className="text-gray-600 flex-1 font-normal"
                    placeholderTextColor={"#4b5563"}
                    value={username}
                    onChangeText={setUsername}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View
                  className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full"
                >
                  <View className="items-center flex flex-row gap-4 flex-1">
                    <FontAwesomeIcon icon={faLock} size={20} color='#6b7280' />
                    <TextInput
                      placeholder='Şifre'
                      className="text-gray-600 font-normal flex-1"
                      placeholderTextColor={"#4b5563"}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesomeIcon
                      color='#595959'
                      icon={showPassword ? faEye : faEyeSlash}
                      size={20}
                    />
                  </Pressable>
                </View>
                <View className="flex-row justify-between items-center w-full">
                  <View className="items-center flex-row gap-1" >

                    <Checkbox
                      value={isChecked}
                      onValueChange={setChecked}
                      color={isChecked ? '#2C8700' : undefined}
                      style={{ borderRadius: 4, width: 16, height: 16 }}
                    />
                    <TouchableOpacity onPress={() => setChecked(!isChecked)}>
                      <Text className="text-gray-600 font-normal">Beni Hatırla</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                    className="self-end"
                  >
                    <Text className="text-gray-600 underline font-medium">Şifreni mi unuttun?</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                className="rounded-xl bg-[#2C8700] items-center justify-center py-3 w-full mt-3"
                style={[Shadows.shadow1]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#006400" />
                ) : (
                  <Text className="text-[15px] text-white font-semibold">Giriş Yap</Text>
                )}
              </TouchableOpacity>


              {/* Ayırıcı */}



              {/* Hata Mesajı */}
              {errorlogin ?
                <Text className="text-red-500 text-center my-2">{errorlogin}</Text>
                : null}

              {/* Giriş Yap Butonu */}


              {/* Alt Bilgi */}
              <View className="flex-row gap-2 justify-center mt-3">
                <Text className="font-medium text-gray-600">Henüz hesabın yok mu?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text className="text-[#2C8700] font-bold">Kayıt Ol</Text>
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