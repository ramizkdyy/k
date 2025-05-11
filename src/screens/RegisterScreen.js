import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
  SafeAreaView,
  Pressable,
  Animated,
} from "react-native";
import { useDispatch } from "react-redux";
import { useRegisterMutation, useLoginMutation } from "../redux/api/apiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { CommonActions } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faSignature,
  faEnvelope,
  faPhone,
  faVenusMars,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faCalendar,
  faArrowLeft,
} from "@fortawesome/pro-solid-svg-icons";
const { width } = Dimensions.get("window");

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
  const [birthDate, setBirthDate] = useState(""); // Keeping the input state
  const [showPassword, setShowPassword] = useState(false);

  // Step handling
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Redux hooks
  const dispatch = useDispatch();
  const [register, { isLoading: registerLoading }] = useRegisterMutation();
  const [login, { isLoading: loginLoading }] = useLoginMutation();

  // Basic email validation
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Basic phone number validation (simple format check)
  const isPhoneValid = (phone) => {
    return /^\d{10,11}$/.test(phone.replace(/[\s()-]/g, ""));
  };

  // Validate current step
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Ad, soyad, email
        if (!name.trim()) {
          Alert.alert("Hata", "Lütfen adınızı giriniz.");
          return false;
        }
        if (!surname.trim()) {
          Alert.alert("Hata", "Lütfen soyadınızı giriniz.");
          return false;
        }
        if (!email.trim()) {
          Alert.alert("Hata", "Lütfen e-posta adresinizi giriniz.");
          return false;
        }
        if (!isEmailValid(email.trim())) {
          Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi giriniz.");
          return false;
        }
        return true;

      case 1: // Kullanıcı adı ve telefon
        if (!username.trim()) {
          Alert.alert("Hata", "Lütfen kullanıcı adı giriniz.");
          return false;
        }
        if (!phoneNumber.trim()) {
          Alert.alert("Hata", "Lütfen telefon numaranızı giriniz.");
          return false;
        }
        if (!isPhoneValid(phoneNumber.trim())) {
          Alert.alert("Hata", "Lütfen geçerli bir telefon numarası giriniz.");
          return false;
        }
        return true;

      case 2: // Doğum tarihi ve cinsiyet
        return true; // Bu alanlar opsiyonel

      case 3: // Şifre ve şifre tekrarı
        if (!password.trim()) {
          Alert.alert("Hata", "Lütfen şifre giriniz.");
          return false;
        }
        if (password.length < 6) {
          Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert("Hata", "Şifreler eşleşmiyor.");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Effect to update progress animation when step changes
  useEffect(() => {
    // Her adım değişikliğinde animasyonu sıfırla ve başlat
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 300, // Daha hızlı bir animasyon (300ms)
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Handle next step button
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        // Start slide animation
        Animated.timing(slideAnim, {
          toValue: -1, // Slide to left
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Reset position and update step after animation completes
          slideAnim.setValue(1); // Position next content off screen to right
          setCurrentStep(currentStep + 1);

          // Slide in from right
          Animated.timing(slideAnim, {
            toValue: 0, // Slide to center
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      } else {
        handleRegister();
      }
    }
  };

  // Handle register button press (final step)
  const handleRegister = async () => {
    try {
      console.log("Kayıt işlemi başlatılıyor...");

      // Call the register API
      const response = await register({
        name: name.trim(),
        surname: surname.trim(),
        gender: gender.trim() || null,
        userName: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
        // birthDate: birthDate || null, // Commented out birthDate in API request
      }).unwrap();

      console.log("API yanıtı:", response);

      // Check if registration successful
      if (response && response.isSuccess) {
        console.log("Kayıt başarılı");

        // API kayıt işlemi başarılı ama token dönmediyse, otomatik olarak login yapalım
        try {
          console.log("Otomatik giriş yapılıyor...");

          const loginResponse = await login({
            userName: username.trim(),
            password: password.trim(),
          }).unwrap();

          console.log("Giriş yanıtı:", loginResponse);

          if (
            loginResponse &&
            loginResponse.isSuccess &&
            loginResponse.result
          ) {
            // Store credentials in Redux
            dispatch(
              setCredentials({
                user: loginResponse.result.user,
                token: loginResponse.result.token,
              })
            );

            console.log("Kimlik bilgileri Redux'a kaydedildi");

            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            );

            // Başarılı mesajı gösterin
            Alert.alert(
              "Kayıt Başarılı",
              "Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.",
              [
                {
                  text: "Tamam",
                },
              ]
            );
          } else {
            // If automatic login failed, still show success message and navigate to login
            Alert.alert(
              "Kayıt Başarılı",
              "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
              [
                {
                  text: "Tamam",
                  onPress: () => {
                    navigation.navigate("Login");
                  },
                },
              ]
            );
          }
        } catch (loginError) {
          console.error("Otomatik giriş hatası:", loginError);

          // Even if auto login fails, registration was successful
          Alert.alert(
            "Kayıt Başarılı",
            "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
            [
              {
                text: "Tamam",
                onPress: () => {
                  navigation.navigate("Login");
                },
              },
            ]
          );
        }
      } else {
        // Show error if response is not successful
        console.log("Kayıt hatası:", response?.message);
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

  // Düzeltilmiş Progress Indicators fonksiyonu - Soldan sağa dolum
  const renderProgressIndicators = () => {
    return (
      <View className="mb-6 px-5">
        {/* Step indicators - separate rectangles */}
        <View className="flex-row justify-center items-center w-full space-x-2">
          {Array(totalSteps)
            .fill(0)
            .map((_, index) => {
              const isCompleted = index < currentStep;
              const isCurrentStep = index === currentStep;

              return (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    height: 4,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 6,
                    overflow: "hidden", // Animasyonu kırpmak için önemli
                  }}
                >
                  {isCompleted ? (
                    // Tamamlanmış adımlar - tamamen dolu
                    <View
                      style={{
                        height: "100%",
                        width: "100%",
                        backgroundColor: "#2C8700",
                        borderRadius: 6,
                      }}
                    />
                  ) : isCurrentStep ? (
                    // Mevcut adım - soldan sağa animasyonlu dolum
                    <Animated.View
                      style={{
                        height: "100%",
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                        backgroundColor: "#2C8700",
                        borderRadius: 6,
                      }}
                    />
                  ) : null}
                </View>
              );
            })}
        </View>
      </View>
    );
  };

  // Initialize animation on first render
  useEffect(() => {
    // Animate in the first screen
    slideAnim.setValue(1);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      // Start slide animation (to right direction)
      Animated.timing(slideAnim, {
        toValue: 1, // Slide to right
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Reset position and update step after animation completes
        slideAnim.setValue(-1); // Position next content off screen to left
        setCurrentStep(currentStep - 1);

        // Slide in from left
        Animated.timing(slideAnim, {
          toValue: 0, // Slide to center
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Step 1: Kişisel Bilgiler (Ad, Soyad, Email)
        return (
          <>
            <View className="gap-1">
              <Text className="text-gray-600 ml-1">Adınız</Text>
              <View className="flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faSignature} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholder="Adınızı giriniz"
                  placeholderTextColor={"#484848"}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">Soyadınız</Text>
              <View className="flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faSignature} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholderTextColor={"#484848"}
                  placeholder="Soyadınızı giriniz"
                  value={surname}
                  onChangeText={setSurname}
                />
              </View>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">E-posta adresiniz</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faEnvelope} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholder="E-posta adresinizi giriniz"
                  value={email}
                  placeholderTextColor={"#4b5563"}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </>
        );
      case 1: // Step 2: Kullanıcı adı, telefon
        return (
          <>
            <View className="gap-1">
              <Text className="text-gray-600 ml-1">Kullanıcı adınız</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faUser} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Kullanıcı adınızı giriniz"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">Telefon numaranız</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faPhone} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholder="Telefon numaranızı giriniz"
                  placeholderTextColor={"#4b5563"}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </>
        );
      case 2: // Step 3: Doğum tarihi, cinsiyet
        return (
          <>
            <View className="gap-1">
              <Text className="text-gray-600 ml-1">Doğum tarihiniz</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faCalendar} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholder="Doğum tarihi (isteğe bağlı)"
                  placeholderTextColor={"#4b5563"}
                  value={birthDate}
                  onChangeText={setBirthDate}
                />
              </View>
              {/* Added a small note to indicate birthDate is optional */}
              <Text className="text-xs text-gray-500 ml-1 mt-1">
                Not: Doğum tarihi şu an zorunlu değildir.
              </Text>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">
                Cinsiyetiniz (İsteğe bağlı)
              </Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faVenusMars} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Cinsiyetinizi giriniz"
                  value={gender}
                  onChangeText={setGender}
                />
              </View>
            </View>
          </>
        );
      case 3: // Step 4: Şifre, şifre tekrarı
        return (
          <>
            <View className="gap-1">
              <Text className="text-gray-600 ml-1">Şifreniz</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faLock} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 font-normal"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Şifrenizi giriniz"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <FontAwesomeIcon
                    color="#595959"
                    icon={showPassword ? faEye : faEyeSlash}
                    size={20}
                  />
                </Pressable>
              </View>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">Şifre tekrarı</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full">
                <FontAwesomeIcon icon={faLock} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 font-normal flex-1"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Şifrenizi tekrar giriniz"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return "Adınız";
      case 1:
        return "Kullanıcı adınız";
      case 2:
        return "Doğum tarihiniz";
      case 3:
        return "Şifreniz";
      default:
        return "";
    }
  };

  // While API call in progress
  if (registerLoading || loginLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-3 text-base text-gray-500">
          {registerLoading ? "Kayıt yapılıyor..." : "Giriş yapılıyor..."}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with logo and back button */}
      <View className="flex-row items-center justify-center relative pt-6 pb-2">
        {/* Back Button - Always reserve the space but only visible after first step */}
        <View className="absolute left-5 top-6 z-10">
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handlePreviousStep}
              className="flex-row items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color="#2C8700" />
              <Text className="text-[#2C8700] ml-2 font-medium">Geri</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logo */}
        <Image
          source={require("../../assets/logo-kirax.png")}
          style={{ width: width * 0.5, height: width * 0.3 }}
          resizeMode="contain"
        />
      </View>

      {/* Progress Bar */}
      {renderProgressIndicators()}

      {/* Main content with keyboard avoiding behavior */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        {/* Scrollable Content Area */}
        <View
          className="flex-grow px-5"
          contentContainerStyle={{ paddingBottom: 120 }} // Add enough padding to ensure content is visible
        >
          <Animated.View
            className="flex"
            style={{
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-(width * 0.8), 0, width * 0.8], // Slide animation values
                  }),
                },
              ],
            }}
          >
            {/* Current Step Content */}
            {renderStepContent()}
          </Animated.View>
        </View>

        {/* Button Area that moves with keyboard */}
        <View className="bg-white px-5 py-4 border-t border-gray-200">
          {/* Continue Button */}
          <TouchableOpacity
            className="rounded-xl bg-[#2C8700] items-center justify-center py-3 w-full"
            onPress={handleNextStep}
          >
            <Text className="text-[15px] text-white font-semibold">
              {currentStep === totalSteps - 1 ? "Kaydol" : "Devam et"}
            </Text>
          </TouchableOpacity>

          {/* Login Link - Only show on first step */}
          {currentStep === 0 && (
            <View className="flex-row justify-center mt-4">
              <Text className="text-base text-gray-600">
                Zaten hesabınız var mı?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-base text-[#2C8700] font-semibold">
                  Giriş Yap
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
