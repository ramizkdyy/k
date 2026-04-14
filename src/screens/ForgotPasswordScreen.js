import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mail, Check } from "lucide-react-native";

const { width } = Dimensions.get("window");

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState(false);

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

  // Email validation
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen e-posta adresinizi giriniz.");
      return;
    }
    if (!isEmailValid(email.trim())) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Backend API entegrasyonu yapılacak
      // const response = await forgotPassword({ email: email.trim() }).unwrap();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSent(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert(
        "Hata",
        error?.data?.message ||
          "Şifre sıfırlama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  // Success state
  if (isSent) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View className="flex-1 justify-center items-center px-8">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#86efac",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Check size={40} color="#fff" strokeWidth={3} />
          </View>

          <Text
            style={{ fontSize: 24, fontWeight: "600" }}
            className="text-gray-900 mb-3 text-center"
          >
            E-posta Gönderildi
          </Text>
          <Text className="text-gray-500 text-base text-center mb-8 leading-6">
            Şifre sıfırlama bağlantısı{" "}
            <Text className="font-semibold text-gray-700">{email}</Text>{" "}
            adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.
          </Text>

          <TouchableOpacity
            className="rounded-xl items-center justify-center py-3 w-full bg-green-300 mb-4"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-xl text-white font-semibold">
              Giriş Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsSent(false);
              setEmail("");
            }}
          >
            <Text className="text-gray-500 underline text-base">
              Tekrar dene
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 60}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: keyboardStatus
                ? Platform.OS === "ios"
                  ? 250
                  : 150
                : 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-8">
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mt-4 mb-8"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>

              {/* Title */}
              <View className="mb-8">
                <Text
                  style={{ fontSize: 28, fontWeight: "700" }}
                  className="text-gray-900 mb-2"
                >
                  Şifrenizi mi unuttunuz?
                </Text>
                <Text
                  className="text-gray-500 text-base leading-6"
                >
                  Endişelenmeyin! Hesabınıza kayıtlı e-posta adresinizi girin,
                  size şifre sıfırlama bağlantısı gönderelim.
                </Text>
              </View>

              {/* Email Input */}
              <View className="w-full gap-4">
                <View className="flex flex-col border rounded-xl">
                  <View
                    className={`flex gap-4 flex-row items-center px-4 ${
                      Platform.OS === "android" ? "py-2" : "py-4"
                    } w-full`}
                  >
                    <Mail size={20} color="#000" />
                    <TextInput
                      placeholder="E-posta adresiniz"
                      fontSize={16}
                      className="text-gray-900 flex-1 font-normal"
                      placeholderTextColor="#b0b0b0"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                      autoFocus={true}
                    />
                  </View>
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                className={`rounded-xl items-center justify-center py-3 w-full mt-6 ${
                  isLoading ? "bg-gray-300" : "bg-green-300"
                }`}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#006400" size="small" />
                    <Text className="text-lg text-gray-600 font-semibold">
                      Gönderiliyor...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xl text-white font-semibold">
                    Sıfırlama bağlantısı gönder
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <View className="flex-row gap-2 justify-center mt-6 items-center">
                <Text className="font-normal text-base text-gray-500">
                  Şifrenizi hatırladınız mı?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  disabled={isLoading}
                >
                  <Text
                    className={`font-bold text-lg ${
                      isLoading ? "text-gray-400" : "text-gray-900"
                    }`}
                  >
                    Giriş Yap
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

export default ForgotPasswordScreen;
