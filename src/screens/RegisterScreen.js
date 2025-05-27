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
  Modal,
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
  faCheck,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faChevronDown
} from "@fortawesome/pro-solid-svg-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
const { width } = Dimensions.get("window");


// Custom Calendar Modal Component


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
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Date picker states
  const [birthDate, setBirthDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dateValue, setDateValue] = useState(new Date(2000, 0, 1)); // Varsayılan olarak 1 Ocak 2000

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

  // Input refs for keyboard navigation
  const nameInputRef = useRef(null);
  const surnameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const genderInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Basic email validation
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Basic phone number validation (simple format check)
  const isPhoneValid = (phone) => {
    return /^\d{10,11}$/.test(phone.replace(/[\s()-]/g, ""));
  };
  // Date selection handler
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
      { value: 'female', label: 'Kadın' },
      { value: 'male', label: 'Erkek' },
      { value: 'other', label: 'Diğer' },
    ];
    return genderOptions.find(option => option.value === genderValue)?.label || '';
  };



  const CalendarModal = ({ visible, onClose, onDateSelect, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(selectedDate ? new Date(selectedDate) : null);

    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

      const days = [];

      // Add empty cells for days before the first day of month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      return days;
    };

    const navigateMonth = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + direction);
      setCurrentDate(newDate);
    };

    const navigateYear = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setFullYear(currentDate.getFullYear() + direction);
      setCurrentDate(newDate);
    };

    const handleDateSelect = (date) => {
      if (!date || isFutureDate(date)) return;

      setSelectedDay(date);
      // Tarih formatını ayarla (GG/MM/YYYY)
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Parent component'e tarihi gönder
      onDateSelect(formattedDate, date);
      onClose();
    };
    const formatDisplayDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString.split('/').reverse().join('-'));
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };
    const isSelectedDate = (date) => {
      if (!selectedDay || !date) return false;
      return date.toDateString() === selectedDay.toDateString();
    };

    const isToday = (date) => {
      if (!date) return false;
      return date.toDateString() === new Date().toDateString();
    };

    const isFutureDate = (date) => {
      if (!date) return false;
      return date > new Date();
    };

    const days = getDaysInMonth(currentDate);

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl mx-4 p-6 shadow-lg" style={{ width: width - 32 }}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-800">Doğum Tarihi Seçin</Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Month/Year Navigation */}
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={() => navigateYear(-1)} className="p-2">
                <Text className="text-blue-600 font-medium">‹‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateMonth(-1)} className="p-2">
                <FontAwesomeIcon icon={faChevronLeft} size={16} color="#3b82f6" />
              </TouchableOpacity>

              <Text className="text-lg font-semibold text-gray-800">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>

              <TouchableOpacity onPress={() => navigateMonth(1)} className="p-2">
                <FontAwesomeIcon icon={faChevronRight} size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateYear(1)} className="p-2">
                <Text className="text-blue-600 font-medium">››</Text>
              </TouchableOpacity>
            </View>

            {/* Week Days Header */}
            <View className="flex-row mb-2">
              {weekDays.map((day) => (
                <View key={day} className="flex-1 items-center py-2">
                  <Text className="text-sm font-medium text-gray-500">{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="flex-row flex-wrap">
              {days.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  className={`w-[14.28%] h-12 justify-center items-center ${date && !isFutureDate(date) ? '' : 'opacity-30'
                    }`}
                  onPress={() => handleDateSelect(date)}
                  disabled={!date || isFutureDate(date)}
                >
                  <View
                    className={`w-10 h-10 rounded-full justify-center items-center ${isSelectedDate(date)
                      ? 'bg-blue-600'
                      : isToday(date)
                        ? 'bg-blue-100'
                        : ''
                      }`}
                  >
                    <Text
                      className={`text-sm ${isSelectedDate(date)
                        ? 'text-white font-semibold'
                        : isToday(date)
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-700'
                        }`}
                    >
                      {date ? date.getDate() : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View className="flex-row justify-end mt-4 pt-4 border-t border-gray-200">
              <TouchableOpacity onPress={onClose} className="px-4 py-2 mr-2">
                <Text className="text-gray-600">İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  // Gender Selector Modal Component
  const GenderModal = ({ visible, onClose, onGenderSelect, selectedGender }) => {
    const slideAnim = useRef(new Animated.Value(300)).current;

    const genderOptions = [
      { value: 'female', label: 'Kadın', icon: '♀' },
      { value: 'male', label: 'Erkek', icon: '♂' },
      { value: 'other', label: 'Diğer', icon: '⚥' },
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
              <Text className="text-xl font-semibold text-gray-800">Cinsiyet Seçin</Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Gender Options */}
            <View className="space-y-2">
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className="flex-row items-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                  onPress={() => handleGenderSelect(option.value)}
                >
                  <Text className="text-2xl mr-4">{option.icon}</Text>
                  <Text className="flex-1 text-lg text-gray-700 font-medium">{option.label}</Text>
                  {selectedGender === option.value && (
                    <FontAwesomeIcon icon={faCheck} size={20} color="#2C8700" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              className="mt-6 p-4 bg-gray-100 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-medium text-lg">İptal</Text>
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

      // Prepare the birthDate in ISO format for API if it exists
      const formattedBirthDate = dateValue ? dateValue.toISOString() : null;

      // Call the register API
      const response = await register({
        name: name.trim(),
        surname: surname.trim(),
        gender: gender.trim() || null,
        userName: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
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
              <View className="flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 w-full">
                <FontAwesomeIcon icon={faSignature} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 w-full h-full py-3 font-normal"
                  placeholder="Adınızı giriniz"
                  placeholderTextColor={"#484848"}
                  value={name}
                  onChangeText={setName}
                  ref={nameInputRef}
                  returnKeyType="next"
                  onSubmitEditing={() => surnameInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">Soyadınız</Text>
              <View className="flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4  w-full">
                <FontAwesomeIcon icon={faSignature} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 py-3 font-normal"
                  placeholderTextColor={"#484848"}
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

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">E-posta adresiniz</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4  w-full">
                <FontAwesomeIcon icon={faEnvelope} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 py-3 font-normal"
                  placeholder="E-posta adresinizi giriniz"
                  value={email}
                  placeholderTextColor={"#4b5563"}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  ref={emailInputRef}
                  returnKeyType="done"
                  onSubmitEditing={handleNextStep}
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
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4  w-full">
                <FontAwesomeIcon icon={faUser} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 py-3 font-normal"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Kullanıcı adınızı giriniz"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  ref={usernameInputRef}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">Telefon numaranız</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4  w-full">
                <FontAwesomeIcon icon={faPhone} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 py-3 font-normal"
                  placeholder="Telefon numaranızı giriniz"
                  placeholderTextColor={"#4b5563"}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  ref={phoneInputRef}
                  returnKeyType="done"
                  onSubmitEditing={handleNextStep}
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
              <TouchableOpacity
                className="shadow-custom bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full"
                onPress={() => setShowCalendar(true)}
              >
                <FontAwesomeIcon icon={faCalendar} size={20} color="#6b7280" />
                <View className="flex-1 flex-row items-center justify-between ml-4">
                  <Text
                    className={`${birthDate ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    {birthDate || "Doğum tarihi seçin (isteğe bağlı)"}
                  </Text>
                  <FontAwesomeIcon icon={faChevronDown} size={16} color="#6b7280" />
                </View>
              </TouchableOpacity>
              {/* Added a small note to indicate birthDate is optional */}
              <Text className="text-xs text-gray-500 ml-1 mt-1">
                Not: Doğum tarihi şu an zorunlu değildir.
              </Text>
            </View>

            <View className="gap-1 mt-4">
              <Text className="text-gray-600 ml-1">
                Cinsiyetiniz (İsteğe bağlı)
              </Text>
              <TouchableOpacity
                className="shadow-custom bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4 py-3 w-full"
                onPress={() => setShowGenderModal(true)}
              >
                <FontAwesomeIcon icon={faVenusMars} size={20} color="#6b7280" />
                <View className="flex-1 flex-row items-center justify-between ml-4">
                  <Text
                    className={`${gender ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    {gender ? getGenderLabel(gender) : "Cinsiyetinizi seçin (isteğe bağlı)"}
                  </Text>
                  <FontAwesomeIcon icon={faChevronDown} size={16} color="#6b7280" />
                </View>
              </TouchableOpacity>
            </View>
          </>
        );
      case 3: // Step 4: Şifre, şifre tekrarı
        return (
          <>
            <View className="gap-1">
              <Text className="text-gray-600 ml-1">Şifreniz</Text>
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4  w-full">
                <FontAwesomeIcon icon={faLock} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 flex-1 py-3 font-normal"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Şifrenizi giriniz"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  ref={passwordInputRef}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  blurOnSubmit={false}
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
              <View className="shadow-custom flex gap-4 bg-white flex-row items-center rounded-xl border-[1px] border-gray-200 px-4  w-full">
                <FontAwesomeIcon icon={faLock} size={20} color="#6b7280" />
                <TextInput
                  className="text-gray-600 font-normal flex-1 py-3"
                  placeholderTextColor={"#4b5563"}
                  placeholder="Şifrenizi tekrar giriniz"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  ref={confirmPasswordInputRef}
                  returnKeyType="done"
                  onSubmitEditing={handleNextStep}
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
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleDateSelect}
        selectedDate={dateValue}
      />

      {/* Gender Modal */}
      <GenderModal
        visible={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        onGenderSelect={handleGenderSelect}
        selectedGender={gender}
      />
    </SafeAreaView>

  );
};

export default RegisterScreen;