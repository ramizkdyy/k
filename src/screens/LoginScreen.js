import React, { useState, useEffect } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation } from "../redux/api/apiSlice";
import { useRegisterNotificationTokenMutation } from "../redux/api/chatApiSlice";
import {
  setCredentials,
  setHasUserProfile,
  selectCurrentUser,
  setFcmToken,
  setFcmTokenRegistered,
} from "../redux/slices/authSlice";
import { setUserProfile } from "../redux/slices/profileSlice";
import { authCleanupHelper } from "../utils/authCleanup";
import { chatApiHelpers } from "../redux/api/chatApiSlice";
import notificationService from "../services/notificationService";

const { width } = Dimensions.get("window");
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEyeSlash, faEye } from "@fortawesome/pro-solid-svg-icons";
import { faApple, faGoogle } from "@fortawesome/free-brands-svg-icons";

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
  const currentUser = useSelector(selectCurrentUser);
  const [login, { isLoading }] = useLoginMutation();
  const [registerNotificationToken] = useRegisterNotificationTokenMutation();

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

  // ✅ Enhanced FCM token registration function
  const registerFcmTokenAfterLogin = async () => {
    try {
      console.log("📱 Starting FCM token registration after login...");

      // Wait a bit for auth state to fully propagate to RTK Query
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Initialize notification service and get tokens
      const tokens = await notificationService.initialize();

      if (tokens?.fcmToken) {
        // Store FCM token in Redux
        dispatch(setFcmToken(tokens.fcmToken));
        console.log(
          "🔥 FCM token stored in Redux:",
          tokens.fcmToken.substring(0, 20) + "..."
        );

        // Wait another bit to ensure RTK Query has the auth token in its state
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Register FCM token with backend
        console.log("📝 Registering FCM token with backend...");
        const registerResult =
          await notificationService.registerTokenWithServer(
            registerNotificationToken
          );

        if (registerResult.success) {
          dispatch(setFcmTokenRegistered(true));
          console.log("✅ FCM token registered successfully after login");
        } else if (!registerResult.skipLogging) {
          console.error(
            "❌ Failed to register FCM token after login:",
            registerResult.error
          );
        }
      } else {
        console.log("⚠️ No FCM token available after login");
      }
    } catch (notificationError) {
      console.error(
        "❌ Notification setup failed after login:",
        notificationError
      );
      // Don't fail the login process for notification errors
    }
  };

  // ✅ Enhanced login handler with FCM token management
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
      console.log("🚪 Login process starting...");
      setErrorLogin(""); // Clear previous errors

      // 1. Call the login API
      const response = await login({
        userName: username.trim(),
        password: password.trim(),
      }).unwrap();

      console.log("✅ Login API response received:", response);

      // Check if login successful
      if (response && response.isSuccess) {
        // API yanıtından gelen roles dizisini kontrol et
        const userRole =
          response.result.roles && response.result.roles.length > 0
            ? response.result.roles[0]
            : null;

        console.log("👤 API roles array:", response.result.roles);
        console.log("🏷️ Selected role:", userRole);

        // Kullanıcı nesnesini güncellenmiş rolle oluştur
        const updatedUser = {
          ...response.result.user,
          role: response.result.user?.role || userRole,
        };

        console.log("👤 Updated user object:", updatedUser);

        // API'den gelen hasUserProfile değerini al
        const hasUserProfile = response.result.hasUserProfile === true;
        console.log("📋 Profile status from API:", hasUserProfile);

        // ✅ ENHANCED: Handle potential user switching with FCM cleanup
        const isUserSwitch =
          currentUser?.id &&
          updatedUser.id &&
          currentUser.id !== updatedUser.id;

        if (isUserSwitch) {
          console.log("🔄 USER SWITCH DETECTED in LoginScreen:", {
            previousUserId: currentUser.id,
            newUserId: updatedUser.id,
          });

          // Clean up previous user's FCM token
          try {
            console.log("🧹 Cleaning up previous user's FCM token...");
            await notificationService.unregisterTokenWithServer(
              registerNotificationToken
            );
            dispatch(setFcmTokenRegistered(false));
          } catch (cleanupError) {
            console.log(
              "⚠️ FCM cleanup failed for previous user:",
              cleanupError.message
            );
          }

          // Prepare for user switch - clean up old user data
          await authCleanupHelper.prepareForUserSwitch(
            currentUser.id,
            updatedUser.id
          );

          // Clear chat cache for the previous user
          chatApiHelpers.clearChatCache(dispatch);
        }

        // 2. Store credentials in Redux state
        dispatch(
          setCredentials({
            user: updatedUser,
            token: response.result.token,
            hasUserProfile: hasUserProfile,
          })
        );

        // Profil durumunu açıkça belirt (Redux persist için)
        dispatch(setHasUserProfile(hasUserProfile));

        console.log("✅ Credentials stored in Redux");
        console.log("🏷️ User role:", updatedUser.role);
        console.log("📋 Profile status:", hasUserProfile);

        // 3. ✅ Setup FCM token for new login
        await registerFcmTokenAfterLogin();

        console.log("🎉 Login process completed successfully");
        console.log("🔄 AppNavigator will handle navigation");

        // Clear form
        setUsername("");
        setPassword("");
        setErrorLogin("");
      } else {
        // Show error if response is not successful
        console.log("❌ Login error:", response?.message);
        Alert.alert(
          "Giriş Başarısız",
          response?.message || "Kullanıcı adı veya şifre hatalı."
        );
      }
    } catch (error) {
      // Handle API call errors
      console.error("❌ Login error:", error);
      const errorMessage =
        error.data?.message ||
        "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.";
      setErrorLogin(errorMessage);

      // Show user-friendly error
      Alert.alert("Giriş Hatası", errorMessage);
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

  // ✅ Enhanced loading state with better messaging
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#86efac" />
          <Text className="mt-3 text-base text-gray-500">
            Giriş yapılıyor...
          </Text>
          <Text className="mt-1 text-sm text-gray-400">
            Bildirimler ayarlanıyor...
          </Text>
        </View>
      </SafeAreaView>
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
                      editable={!isLoading} // Disable during loading
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
                        editable={!isLoading} // Disable during loading
                      />
                    </View>
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEye : faEyeSlash}
                        size={20}
                        color={isLoading ? "#ccc" : "#000"}
                      />
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row justify-between items-center w-full">
                  <View className="items-center flex-row gap-2">
                    <Checkbox
                      value={isChecked}
                      onValueChange={setChecked}
                      color={isChecked ? "#86efac" : undefined}
                      disabled={isLoading}
                      style={{
                        borderColor: isLoading ? "#ccc" : "#00000",
                        borderRadius: 4,
                        borderWidth: 1.1,
                        width: 18,
                        height: 18,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setChecked(!isChecked)}
                      disabled={isLoading}
                    >
                      <Text
                        className={`font-normal text-lg ${
                          isLoading ? "text-gray-400" : "text-gray-900"
                        }`}
                      >
                        Beni Hatırla
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                    className="self-end"
                    disabled={isLoading}
                  >
                    <Text
                      className={`underline font-normal ${
                        isLoading ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Şifreni mi unuttun?
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ✅ Enhanced login button with better loading state */}
              <TouchableOpacity
                className={`rounded-xl items-center justify-center py-3 w-full mt-3 ${
                  isLoading ? "bg-gray-300" : "bg-green-300"
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#006400" size="small" />
                    <Text className="text-lg text-gray-600 font-semibold">
                      Giriş yapılıyor...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xl text-white font-semibold">
                    Giriş yap
                  </Text>
                )}
              </TouchableOpacity>

              {/* ✅ Enhanced error display */}
              {errorlogin ? (
                <View className="w-full rounded-full">
                  <Text className="text-red-600 text-center font-medium">
                    {errorlogin}
                  </Text>
                </View>
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
                  className={`rounded-xl bg-white flex-row items-center px-4 py-3 gap-2 w-full border ${
                    isLoading ? "border-gray-300" : "border-gray-900"
                  }`}
                  onPress={() => console.log("Apple login")}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon
                    icon={faApple}
                    size={20}
                    color={isLoading ? "#ccc" : "#000"}
                  />
                  <Text
                    className="absolute"
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      color: isLoading ? "#ccc" : "#000",
                    }}
                  >
                    Apple ile devam et
                  </Text>
                </Pressable>

                <Pressable
                  className={`rounded-xl bg-white flex-row items-center px-4 py-3 gap-2 w-full border ${
                    isLoading ? "border-gray-300" : "border-gray-900"
                  }`}
                  onPress={() => console.log("Google login")}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon
                    icon={faGoogle}
                    size={20}
                    color={isLoading ? "#ccc" : "#000"}
                  />
                  <Text
                    className="absolute"
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      color: isLoading ? "#ccc" : "#000",
                    }}
                  >
                    Google ile devam et
                  </Text>
                </Pressable>
              </View>

              {/* Alt Bilgi */}
              <View className="flex-row gap-2 justify-center mt-1 items-center">
                <Text
                  className={`font-normal text-base ${
                    isLoading ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Henüz hesabın yok mu?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                  disabled={isLoading}
                >
                  <Text
                    className={`font-bold text-lg ${
                      isLoading ? "text-gray-400" : "text-gray-900"
                    }`}
                  >
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
