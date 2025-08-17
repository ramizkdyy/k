import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  faCheck,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
} from "@fortawesome/pro-solid-svg-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
const { width } = Dimensions.get("window");

const RegisterScreen = ({ navigation }) => {
  // Bottom Sheet refs
  const datePickerModalRef = useRef(null);
  const genderPickerModalRef = useRef(null);

  // Bottom Sheet snap points
  const datePickerSnapPoints = ["40%"];
  const genderPickerSnapPoints = ["35%"];

  // Bottom Sheet callbacks
  const renderDatePickerBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const renderGenderPickerBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Bottom Sheet handlers
  const handlePresentDatePicker = useCallback(() => {
    datePickerModalRef.current?.present();
  }, []);

  const handlePresentGenderPicker = useCallback(() => {
    genderPickerModalRef.current?.present();
  }, []);

  const handleDatePickerConfirm = useCallback(() => {
    const adjustedDate = new Date(
      dateValue.getTime() + dateValue.getTimezoneOffset() * 60000
    );

    const day = String(adjustedDate.getDate()).padStart(2, "0");
    const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
    const year = adjustedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    setBirthDate(formattedDate);
    datePickerModalRef.current?.dismiss();
  }, [dateValue]);

  const handleGenderPickerConfirm = useCallback(() => {
    setGender(tempGenderValue);
    genderPickerModalRef.current?.dismiss();
  }, [tempGenderValue]);

  // State for form inputs
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState(""); // Optional
  const [tempGenderValue, setTempGenderValue] = useState(gender || "");
  // Date picker states
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateValue, setDateValue] = useState(new Date(2000, 0, 1));

  // Step handling
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 3;

  // Enhanced animation values for smooth step transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Redux hooks
  const dispatch = useDispatch();
  const [register, { isLoading: registerLoading }] = useRegisterMutation();
  const [login, { isLoading: loginLoading }] = useLoginMutation();

  // Input refs for keyboard navigation
  const nameInputRef = useRef(null);
  const surnameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const genderInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Function to dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formatPhoneNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, "");

    // 0 ile başlıyorsa kaldır
    const withoutLeadingZero = cleaned.startsWith("0")
      ? cleaned.slice(1)
      : cleaned;

    // Maksimum 10 rakam
    const truncated = withoutLeadingZero.slice(0, 10);

    // Format: XXX XXX XX XX
    let formatted = "";
    for (let i = 0; i < truncated.length; i++) {
      if (i === 3 || i === 6 || i === 8) {
        formatted += " ";
      }
      formatted += truncated[i];
    }

    return formatted;
  };

  // Telefon numarası değişiklik handler'ı
  const handlePhoneNumberChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  // Basic email validation
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isPhoneValid = (phone) => {
    // Boşlukları kaldır ve sadece rakamları kontrol et
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10; // Türkiye için 10 haneli numara
  };

  const handleDatePickerChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowCalendar(false);

      if (event.type === "set" && selectedDate) {
        // Timezone offset'ini göz önünde bulundurarak tarihi düzelt
        const adjustedDate = new Date(
          selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000
        );

        const day = String(adjustedDate.getDate()).padStart(2, "0");
        const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
        const year = adjustedDate.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        setBirthDate(formattedDate);
        setDateValue(selectedDate);
      }
    } else if (selectedDate && Platform.OS === "ios") {
      setDateValue(selectedDate);
    }
  };

  // Date selection handler - Updated for native picker
  const handleDateSelect = (formattedDate, dateObject) => {
    setBirthDate(formattedDate);
    setDateValue(dateObject);
  };

  // Gender selection handler
  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
  };

  // Gender label getter
  const getGenderLabel = (genderValue) => {
    const genderOptions = [
      { value: "female", label: "Kadın" },
      { value: "male", label: "Erkek" },
      { value: "other", label: "Diğer" },
    ];
    return (
      genderOptions.find((option) => option.value === genderValue)?.label || ""
    );
  };

  // Gender Selector Modal Component
  const GenderModal = ({
    visible,
    onClose,
    onGenderSelect,
    selectedGender,
  }) => {
    const slideAnim = useRef(new Animated.Value(300)).current;

    const genderOptions = [
      { value: "female", label: "Kadın", icon: "♀" },
      { value: "male", label: "Erkek", icon: "♂" },
      { value: "other", label: "Diğer", icon: "⚥" },
    ];

    useEffect(() => {
      if (visible) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }, [visible]);

    const handleGenderSelect = (gender) => {
      onGenderSelect(gender);
      onClose();
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            className="bg-white rounded-t-3xl p-6"
            style={{
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold text-gray-800">
                Cinsiyet Seçin
              </Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Gender Options */}
            <View className="space-y-2">
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className="flex-row items-center p-4"
                  onPress={() => handleGenderSelect(option.value)}
                >
                  <Text className="text-2xl mr-4">{option.icon}</Text>
                  <Text className="flex-1 text-lg text-gray-700 font-medium">
                    {option.label}
                  </Text>
                  {selectedGender === option.value && (
                    <FontAwesomeIcon icon={faCheck} size={20} color="#2C8700" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              className="mt-6 p-4 rounded-xl items-center"
            >
              <Text className="text-green-600 font-medium text-lg">İptal</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
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

      case 2: // Şifre step'i
        if (!password.trim()) {
          Alert.alert("Hata", "Lütfen şifre giriniz.");
          return false;
        }

        const { score } = getPasswordStrength(password);
        if (score < 3) {
          Alert.alert(
            "Hata",
            "Şifreniz çok zayıf. Lütfen daha güçlü bir şifre seçin."
          );
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
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Enhanced animation function for step transitions
  const animateStepTransition = (direction, callback) => {
    // Keyboard'u kapat
    Keyboard.dismiss();

    // Step 1: Fade out and scale down current content
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -50 : 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Execute callback (change step)
      callback();

      // Step 3: Prepare next content position
      slideAnim.setValue(direction === "next" ? 50 : -50);
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);

      // Step 4: Animate in new content with bounce effect
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
    });
  };

  // Handle next step button
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        animateStepTransition("next", () => {
          setCurrentStep(currentStep + 1);
        });
      } else {
        handleRegister();
      }
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      animateStepTransition("prev", () => {
        setCurrentStep(currentStep - 1);
      });
    }
  };

  // Şifre güçlülük kontrolü
  const getPasswordStrength = (password) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Her kriter için puan ekle
    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    return { score, checks };
  };

  // Şifre güçlülük seviyesi ve rengi
  const getPasswordStrengthInfo = (password) => {
    if (!password) return { level: "empty", color: "#e5e7eb", text: "" };

    const { score } = getPasswordStrength(password);

    if (score <= 2) return { level: "weak", color: "#ef4444", text: "Zayıf" };
    if (score === 3) return { level: "medium", color: "#f7ea59", text: "Orta" };
    if (score === 4) return { level: "good", color: "#9cf0ba", text: "İyi" };
    if (score === 5)
      return { level: "strong", color: "#86efac", text: "Güçlü" };
  };

  // Şifre Güçlülük İndikatörü Component
  const PasswordStrengthIndicator = ({ password }) => {
    const { score, checks } = getPasswordStrength(password);
    const strengthInfo = getPasswordStrengthInfo(password);

    // Animasyon için useRef
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    // Score değiştiğinde debounce ile animasyonu başlat
    useEffect(() => {
      // Önceki timeout'u temizle
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Yeni timeout ayarla
      timeoutRef.current = setTimeout(() => {
        Animated.timing(progressAnim, {
          toValue: score,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }, 800);

      // Cleanup function
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [score]);

    if (!password) {
      // Şifre yoksa animasyonu hemen sıfırla
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      progressAnim.setValue(0);
      return null;
    }

    return (
      <View className="mt-3">
        {/* Güçlülük Barı */}
        <View className="flex-row items-center mb-3">
          <View className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
            <Animated.View
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 5],
                  outputRange: ["0%", "100%"],
                  extrapolate: "clamp",
                }),
                backgroundColor: strengthInfo.color,
                height: "100%",
                borderRadius: 4,
              }}
            />
          </View>
          <Text
            className="text-sm font-medium ml-2"
            style={{ color: strengthInfo.color }}
          >
            {strengthInfo.text}
          </Text>
        </View>

        {/* Şifre Kuralları */}
        <View className="flex flex-col gap-2">
          <PasswordRule met={checks.length} text="En az 8 karakter" />
          <PasswordRule met={checks.lowercase} text="Küçük harf (a-z)" />
          <PasswordRule met={checks.uppercase} text="Büyük harf (A-Z)" />
          <PasswordRule met={checks.number} text="Rakam (0-9)" />
          <PasswordRule met={checks.special} text="Özel karakter (!@#$%^&*)" />
        </View>
      </View>
    );
  };

  // Şifre Kuralı Component
  const PasswordRule = ({ met, text }) => (
    <View className="flex-row items-center">
      <View
        className="w-4 h-4 rounded-full mr-2 items-center justify-center"
        style={{ backgroundColor: met ? "black" : "#dee0ea" }}
      >
        {met && <FontAwesomeIcon icon={faCheck} size={10} color="white" />}
      </View>
      <Text style={{ fontSize: 14, color: met ? "black" : "#b8b8b8" }}>
        {text}
      </Text>
    </View>
  );

  // Handle register button press (final step)
  const handleRegister = async () => {
    try {
      console.log("Kayıt işlemi başlatılıyor...");

      const cleanedPhone = phoneNumber.replace(/\D/g, "");
      const finalPhone = "0" + cleanedPhone;

      // Prepare the birthDate in ISO format for API if it exists
      const formattedBirthDate = dateValue ? dateValue.toISOString() : null;

      // Call the register API
      const response = await register({
        name: name.trim(),
        surname: surname.trim(),
        gender: gender.trim() || null,
        userName: username.trim(),
        email: email.trim(),
        phoneNumber: finalPhone,
        password: password.trim(),
        birthDate: formattedBirthDate,
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

  // Progress Indicators fonksiyonu - Yuvarlak steplar
  const renderProgressIndicators = () => {
    return (
      <View className="mb-6 px-5 relative">
        <View className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
          <TouchableOpacity
            onPress={() => {
              // Eğer ilk adımdaysak navigation.goBack() yap
              // Değilse bir önceki adıma geri dön
              if (currentStep === 0) {
                navigation.goBack();
              } else {
                handlePreviousStep();
              }
            }}
            className="flex-row items-center"
          >
            <FontAwesomeIcon icon={faChevronLeft} size={22} color="#0d0d0d" />
          </TouchableOpacity>
        </View>
        {/* Step indicators - circular steps */}
        <View className="flex-row justify-center items-center w-full">
          {Array(totalSteps)
            .fill(0)
            .map((_, index) => {
              const isCompleted = index < currentStep;
              const isCurrentStep = index === currentStep;

              return (
                <React.Fragment key={index}>
                  {/* Step Circle */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor:
                        isCompleted || isCurrentStep ? "#000000" : "#ededed",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          isCompleted || isCurrentStep ? "#FFFFFF" : "#9CA3AF",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* Connection Line */}
                  {index < totalSteps - 1 && (
                    <View
                      style={{
                        width: 40,
                        height: 2,
                        backgroundColor: isCompleted ? "#000000" : "#ededed",
                        marginHorizontal: 8,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
        </View>
      </View>
    );
  };

  // Initialize animation on first render
  useEffect(() => {
    // İlk render'da fade in animasyonu
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.95);
    slideAnim.setValue(30);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  }, []);

  // Render step content with animations
  const renderStepContent = () => {
    const content = (() => {
      switch (currentStep) {
        case 0: // Step 1: Kişisel Bilgiler (Ad, Soyad, Email)
          return (
            <View style={{ marginTop: 15 }}>
              <Text
                className="mb-4"
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                Kişisel Bilgiler
              </Text>
              <View className="border rounded-xl">
                <View className="flex gap-4 flex-row items-center border-b px-4 w-full">
                  <TextInput
                    className="text-gray-900 flex-1 w-full h-full py-4 font-normal"
                    placeholder="Adınızı giriniz"
                    style={{
                      fontSize: 16,
                    }}
                    placeholderTextColor="#b0b0b0"
                    value={name}
                    onChangeText={setName}
                    ref={nameInputRef}
                    returnKeyType="next"
                    onSubmitEditing={() => surnameInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View className="flex gap-4 flex-row items-center  px-4 w-full">
                  <TextInput
                    style={{
                      fontSize: 16,
                    }}
                    className="text-gray-900 flex-1 py-4 font-normal"
                    placeholderTextColor="#b0b0b0"
                    placeholder="Soyadınızı giriniz"
                    value={surname}
                    onChangeText={setSurname}
                    ref={surnameInputRef}
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>
              <Text style={{ fontSize: 12 }} className="py-3 text-gray-600">
                Lütfen gerçek isminizi ve soy isminizi girin.
              </Text>
              <View className="mt-5">
                <Text
                  className="mb-4"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  E-mail
                </Text>
                <View className="flex gap-4 flex-row items-center py-1  px-4 w-full border border-gray-900 rounded-xl">
                  <TextInput
                    style={{
                      fontSize: 16,
                    }}
                    className="text-gray-900 flex-1 py-3 font-normal"
                    placeholder="E-posta adresinizi giriniz"
                    value={email}
                    placeholderTextColor="#b0b0b0"
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    ref={emailInputRef}
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>
                <Text style={{ fontSize: 12 }} className="py-3 text-gray-600">
                  Lütfen geçerli bir e-posta adresi giriniz; bilgilendirme ve
                  doğrulama bu adres üzerinden yapılacaktır.
                </Text>
              </View>

              <View style={{ marginTop: 15 }}>
                <Text
                  className="mb-4"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Doğum tarihi
                </Text>
                <TouchableOpacity
                  className="shadow-custom bg-white flex-row items-center rounded-xl border-[1px] border-gray-900 px-4 py-4 w-full"
                  onPress={
                    Platform.OS === "ios"
                      ? handlePresentDatePicker
                      : () => {
                          setShowCalendar(true);
                        }
                  }
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    size={20}
                    color="#0d0d0d"
                  />
                  <View className="flex-1 flex-row items-center justify-between ml-4">
                    <Text
                      style={{
                        fontSize: 16,
                        color: birthDate ? "#0d0d0d" : "#b0b0b0",
                      }}
                    >
                      {birthDate || "Doğum tarihi seçin (isteğe bağlı)"}
                    </Text>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      size={16}
                      color="#6b7280"
                    />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 12 }} className="py-3 text-gray-600">
                  Doğum tarihi bilgisi opsiyoneldir; ancak sizin için daha
                  kişiselleştirilmiş bir deneyim sunmamıza yardımcı olur.
                </Text>
              </View>
            </View>
          );
        case 1: // Step 2: Kullanıcı adı, telefon
          return (
            <>
              <View className="gap-1">
                <Text
                  className="mb-3"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Kullanıcı adı
                </Text>
                <View className="flex gap-4 flex-row items-center py-1  px-4 w-full border border-gray-900 rounded-xl">
                  <TextInput
                    style={{
                      fontSize: 16,
                    }}
                    className="text-gray-900 flex-1 py-3 font-normal"
                    placeholderTextColor="#b0b0b0"
                    placeholder="Kullanıcı adını gir"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    ref={usernameInputRef}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                <Text style={{ fontSize: 12 }} className="py-3 text-gray-600">
                  Kullanıcı adınız, profilinizde görünecek ve diğer kullanıcılar
                  tarafından sizi tanımak için kullanılacaktır.
                </Text>
              </View>

              <View className="gap-1 mt-6">
                <Text
                  className="mb-4"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Telefon numarası
                </Text>
                <View className="flex gap-4 flex-row items-center py-1 px-4 w-full border border-gray-900 rounded-xl">
                  <Text style={{ fontSize: 16, color: "#b0b0b0" }}>+90</Text>
                  <TextInput
                    style={{
                      fontSize: 16,
                    }}
                    className="text-gray-900 flex-1 py-3 font-normal"
                    placeholder="___ ___ __ __"
                    placeholderTextColor="#b0b0b0"
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    ref={phoneInputRef}
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                    maxLength={13}
                  />
                </View>
                <Text style={{ fontSize: 12 }} className="py-3 text-gray-600">
                  Telefon numaranız yalnızca güvenlik ve hesap doğrulama
                  amacıyla kullanılacaktır; asla üçüncü kişilerle paylaşılmaz.
                </Text>
              </View>

              <View style={{ marginTop: 15 }}>
                <Text
                  className="mb-4"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Cinsiyet
                </Text>
                <TouchableOpacity
                  className="shadow-custom bg-white flex-row items-center rounded-xl border-[1px] border-gray-900 px-4 py-4 w-full"
                  onPress={() => {
                    setTempGenderValue(gender);
                    handlePresentGenderPicker();
                  }}
                >
                  <FontAwesomeIcon
                    icon={faVenusMars}
                    size={20}
                    color="#0d0d0d"
                  />
                  <View className="flex-1 flex-row items-center justify-between ml-4">
                    <Text
                      style={{
                        fontSize: 16,
                        color: gender ? "#0d0d0d" : "#b0b0b0",
                      }}
                    >
                      {getGenderLabel(gender) ||
                        "Cinsiyet seçin (isteğe bağlı)"}
                    </Text>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      size={16}
                      color="#6b7280"
                    />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 12 }} className="py-3 text-gray-600">
                  Cinsiyet bilgisi opsiyoneldir ve sadece size daha uygun içerik
                  sunabilmemiz için kullanılır.
                </Text>
              </View>
            </>
          );

        case 2:
          return (
            <View>
              <View className="gap-1 mt-6">
                <Text
                  className="mb-4"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Şifre
                </Text>
                <View className="flex gap-4 flex-row items-center py-1 px-4 w-full border border-gray-900 rounded-xl">
                  <TextInput
                    className="text-gray-900 flex-1 py-3 font-normal"
                    placeholderTextColor="#4b5563"
                    placeholder="Şifrenizi giriniz"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    ref={passwordInputRef}
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      confirmPasswordInputRef.current?.focus()
                    }
                    blurOnSubmit={false}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesomeIcon
                      color="#0d0d0d"
                      icon={showPassword ? faEye : faEyeSlash}
                      size={20}
                    />
                  </Pressable>
                </View>

                {/* Şifre Güçlülük İndikatörü */}
                <PasswordStrengthIndicator password={password} />
              </View>

              <View className="gap-1 mt-6 mb-6">
                <Text
                  className="mb-4"
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Şifre tekrarı
                </Text>
                <View className="flex gap-4 flex-row items-center py-1 px-4 w-full border border-gray-900 rounded-xl">
                  <TextInput
                    className="text-gray-900 flex-1 py-3 font-normal"
                    placeholderTextColor="#4b5563"
                    placeholder="Şifrenizi tekrar giriniz"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    ref={confirmPasswordInputRef}
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>

                {/* Şifre Eşleşme Kontrolü */}
                {confirmPassword && (
                  <View className="flex-row items-center mt-2">
                    <View
                      className="w-4 h-4 rounded-full mr-2 items-center justify-center"
                      style={{
                        backgroundColor:
                          password === confirmPassword ? "#10b981" : "#ef4444",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={password === confirmPassword ? faCheck : faTimes}
                        size={10}
                        color="white"
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        color:
                          password === confirmPassword ? "#10b981" : "#ef4444",
                      }}
                    >
                      {password === confirmPassword
                        ? "Şifreler eşleşiyor"
                        : "Şifreler eşleşmiyor"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        default:
          return null;
      }
    })();

    // Wrap content with animation
    return (
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        }}
      >
        {content}
      </Animated.View>
    );
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView className="flex-1 bg-white">
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View className="flex-1">
              {/* Header with logo and back button */}
              <View className="flex-row items-center justify-center relative pt-6 pb-2">
                {/* Back Button - Always reserve the space but only visible after first step */}
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
                  className=" px-4"
                  contentContainerStyle={{ paddingBottom: 120 }}
                >
                  {/* Current Step Content */}
                  {renderStepContent()}
                </View>

                {/* Button Area that moves with keyboard */}
                <View className="bg-white px-5 py-4 border-gray-200">
                  {/* Continue Button */}
                  <TouchableOpacity
                    className="rounded-xl bg-green-300 items-center justify-center py-4 w-full"
                    onPress={handleNextStep}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                      }}
                      className=" text-white font-semibold"
                    >
                      {currentStep === totalSteps - 1 ? "Kaydol" : "Devam et"}
                    </Text>
                  </TouchableOpacity>

                  {/* Login Link - Only show on first step */}
                  {currentStep === 0 && (
                    <View className="flex-row justify-center mt-4 items-center">
                      <Text className="text-base text-gray-600">
                        Zaten hesabınız var mı?{" "}
                      </Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate("Login")}
                      >
                        <Text className="text-lg text-gray-900 font-semibold">
                          Giriş Yap
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>

          {/* Native Date Picker for Android */}
          {showCalendar && Platform.OS === "android" && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="default"
              onChange={handleDatePickerChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              locale="tr-TR"
            />
          )}

          {/* Date Picker Bottom Sheet (iOS) */}
          <BottomSheetModal
            ref={datePickerModalRef}
            snapPoints={datePickerSnapPoints}
            backdropComponent={renderDatePickerBackdrop}
            enablePanDownToClose={true}
            backgroundStyle={{ borderRadius: 24 }}
          >
            <BottomSheetView style={{ flex: 1 }}>
              {/* Header */}
              <View className="flex-row justify-between items-center px-6 py-4 bg-white">
                <Text style={{ fontWeight: 600, fontSize: 18 }}>
                  Doğum tarihi seç
                </Text>
                <TouchableOpacity
                  onPress={handleDatePickerConfirm}
                  className="px-2 py-2"
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: "#007AFF",
                      fontWeight: "500",
                    }}
                  >
                    Tamam
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Picker Container */}
              <View className="bg-white justify-center items-center py-2 flex-1">
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setDateValue(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  locale="tr-TR"
                  textColor="#000000"
                  style={{
                    backgroundColor: "#FFFFFF",
                    width: "100%",
                    height: 216,
                  }}
                />
              </View>
            </BottomSheetView>
          </BottomSheetModal>

          {/* Gender Picker Bottom Sheet */}
          <BottomSheetModal
            ref={genderPickerModalRef}
            snapPoints={genderPickerSnapPoints}
            backdropComponent={renderGenderPickerBackdrop}
            enablePanDownToClose={true}
            backgroundStyle={{ borderRadius: 24 }}
          >
            <BottomSheetView style={{ flex: 1 }}>
              {/* Header */}
              <View className="flex-row justify-between items-center px-6 py-4 bg-white">
                <Text style={{ fontWeight: 600, fontSize: 18 }}>
                  Cinsiyet seç
                </Text>
                <TouchableOpacity
                  onPress={handleGenderPickerConfirm}
                  className="px-2 py-2"
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: "#007AFF",
                      fontWeight: "500",
                    }}
                  >
                    Tamam
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gender Options */}
              <View className="px-4 py-2 pb-10 bg-white flex-1">
                {[
                  { label: "Seçiniz", value: "" },
                  { label: "Kadın", value: "female" },
                  { label: "Erkek", value: "male" },
                  { label: "Diğer", value: "other" },
                ].map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={1}
                    className={`py-4 px-7 ${
                      tempGenderValue === option.value
                        ? "bg-gray-50 rounded-full"
                        : ""
                    }`}
                    onPress={() => setTempGenderValue(option.value)}
                  >
                    <Text
                      className={`text-lg ${
                        tempGenderValue === option.value
                          ? "text-gray-900 font-semibold"
                          : "text-gray-500"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BottomSheetView>
          </BottomSheetModal>
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RegisterScreen;
