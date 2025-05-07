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
import { faApple, faGoogle } from '@fortawesome/pro-regular-svg-icons';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [errorlogin, setErrorLogin] = useState('');

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
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.00,
      elevation: 1,
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
    <SafeAreaView className="flex-1  bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: keyboardStatus ? (Platform.OS === 'ios' ? 200 : 120) : 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 items-center gap-5 px-8">
              {/* Logo - Boyutu küçültülmüş ve boşluklar azaltılmış */}
              <View className="mt-6 mb-2">
                <Image
                  source={require("../../assets/logo-kirax.png")}
                  style={{ width: width * 0.7, height: width * 0.5 }}
                  resizeMode="contain"
                />

              </View>

              {/* Form Başlangıcı - Logodan sonra küçük boşluk */}


              {/* Social Login Butonları */}
              <View className="gap-2 w-full">
                <Pressable
                  className="rounded-[12px] bg-white overflow-hidden flex-row items-center justify-center px-4 py-3 gap-2 w-full"
                  style={[Shadows.shadow1]}
                  onPress={() => console.log('Apple login')}
                >
                  <FontAwesomeIcon icon={faApple} size={20} />
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    Apple İle Devam Et
                  </Text>
                </Pressable>

                <Pressable
                  className="rounded-[12px] bg-white overflow-hidden flex-row items-center justify-center px-4 py-3 gap-2 w-full"
                  style={[Shadows.shadow1]}
                  onPress={() => console.log('Google login')}
                >
                  <FontAwesomeIcon icon={faGoogle} size={20} color="#DB4437" />
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    Google İle Devam Et
                  </Text>
                </Pressable>
              </View>

              {/* Ayırıcı */}
              <View className="flex flex-row items-center w-full my-2">
                <View className="flex-1 h-[1px] bg-gray-300"></View>
                <Text className="mx-3 text-gray-400 font-medium text-[14px]">veya</Text>
                <View className="flex-1 h-[1px] bg-gray-300"></View>
              </View>

              {/* Form Alanları - Boşluklar minimize edilmiş */}
              <View className="w-full gap-3">
                <View
                  style={[Shadows.shadow1]}
                  className="shadow-custom flex gap-4 bg-[#ECECEC] flex-row items-center rounded-[12px] border-[2px] border-[#006400] px-4 py-3 w-full"
                >
                  <FontAwesomeIcon icon={faUser} size={20} color="#595959" />
                  <TextInput
                    placeholder='Kullanıcı Adı'
                    className="text-gray-700 flex-1 font-semibold"
                    placeholderTextColor={"#484848"}
                    value={username}
                    onChangeText={setUsername}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View
                  style={[Shadows.shadow1]}
                  className="justify-between shadow-custom flex gap-4 bg-[#ECECEC] flex-row items-center rounded-[12px] border-[2px] border-[#006400] px-4 py-3 w-full"
                >
                  <View className="items-center flex flex-row gap-4 flex-1">
                    <FontAwesomeIcon icon={faLock} size={20} color="#595959" />
                    <TextInput
                      placeholder='Şifre'
                      className="text-gray-700 font-semibold flex-1"
                      placeholderTextColor={"#484848"}
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

                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  className="self-end"
                >
                  <Text className="text-gray-600 underline font-medium">Şifreni mi unuttun?</Text>
                </TouchableOpacity>
              </View>

              {/* Hata Mesajı */}
              {errorlogin ?
                <Text className="text-red-500 text-center my-2">{errorlogin}</Text>
                : null}

              {/* Giriş Yap Butonu */}
              <TouchableOpacity
                className="rounded-full border-[2px] border-[#006400] items-center justify-center py-3 w-full mt-3"
                style={[Shadows.shadow1]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#006400" />
                ) : (
                  <Text className="text-[15px] text-[#006400] font-semibold">Giriş Yap</Text>
                )}
              </TouchableOpacity>

              {/* Alt Bilgi */}
              <View className="flex-row gap-2 justify-center mt-3">
                <Text className="font-medium text-gray-600">Hesabınız yok mu?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text className="text-[#006400] font-bold">Kayıt Ol</Text>
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