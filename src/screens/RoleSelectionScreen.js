import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setRole } from "../redux/slices/authSlice";
import { useAssignRoleMutation } from "../redux/api/apiSlice";
import { selectCurrentUser } from "../redux/slices/authSlice";

const RoleSelectionScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Use the assign role mutation
  const [assignRole, { isLoading }] = useAssignRoleMutation();

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert("Hata", "Lütfen bir rol seçin");
      return;
    }

    try {
      console.log("Rol atama isteği gönderiliyor:", {
        userName: user?.userName || user?.email || "",
        role: selectedRole,
      });

      // Manuel olarak Redux'ta rolü güncelle (API başarısız olsa bile)
      dispatch(setRole(selectedRole));
      console.log("Rol Redux'a kaydedildi:", selectedRole);

      // Call the assignRole API
      const response = await assignRole({
        userName: user?.userName || user?.email || "",
        role: selectedRole,
        email: user?.email || "",
      }).unwrap();

      console.log("API yanıtı:", response);

      // Check for successful response
      if (response && response.isSuccess) {
        console.log("API rol ataması başarılı");
      } else {
        // API hatası olsa bile devam et, sadece log at
        console.log("API hata mesajı (ama devam ediyoruz):", response?.message);
      }

      // Rol seçimi başarılı olduğunda hemen profil oluşturma ekranına yönlendir
      // (API başarısız olsa bile, Redux'ta rol güncellendiği için devam edebiliriz)
      navigation.navigate("CreateProfile");
    } catch (error) {
      console.error("Role selection error:", error);

      // Hata olsa bile profil oluşturmaya yönlendir çünkü Redux'ta rol ayarlandı
      console.log(
        "API hatası olmasına rağmen devam ediliyor - Redux'ta rol güncellendi"
      );

      // Kullanıcıya bilgi ver ama işlemi kesme
      Alert.alert(
        "Uyarı",
        "Rol seçimi kaydedildi ancak sunucuyla iletişimde bir hata oluştu. İşleminize devam edebilirsiniz.",
        [
          {
            text: "Devam Et",
            onPress: () => navigation.navigate("CreateProfile"),
          },
        ]
      );
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-5">
      <View className="items-center mt-12 mb-6">
        <Image
          source={require("../../assets/logo-kirax.png")}
          className="w-20 h-20"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-blue-500 mt-1">KiraX</Text>
      </View>

      <View className="flex-1 justify-center pb-12">
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          Hoş Geldiniz, {user?.name || "Kullanıcı"}
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          Devam etmek için lütfen rol seçin:
        </Text>

        <View className="mb-8">
          <TouchableOpacity
            className={`bg-white p-5 rounded-xl mb-4 border-2 ${
              selectedRole === "EVSAHIBI"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
            onPress={() => setSelectedRole("EVSAHIBI")}
          >
            <View className="w-14 h-14 rounded-full bg-blue-50 justify-center items-center mb-4">
              <Image
                source={require("../../assets/logo_kirax.jpg")}
                className="w-8 h-8"
                resizeMode="contain"
                style={{ tintColor: "#4A90E2" }}
              />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Ev Sahibi
            </Text>
            <Text className="text-sm text-gray-600 leading-5">
              Mülk sahipleri için - ilan oluşturabilir ve kiralık mülklerinizi
              yönetebilirsiniz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`bg-white p-5 rounded-xl border-2 ${
              selectedRole === "KIRACI"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
            onPress={() => setSelectedRole("KIRACI")}
          >
            <View className="w-14 h-14 rounded-full bg-blue-50 justify-center items-center mb-4">
              <Image
                source={require("../../assets/logo_kirax.jpg")}
                className="w-8 h-8"
                resizeMode="contain"
                style={{ tintColor: "#4A90E2" }}
              />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">Kiracı</Text>
            <Text className="text-sm text-gray-600 leading-5">
              Kiracılar için - mülk arayabilir, ilanlara göz atabilir ve
              teklifler gönderebilirsiniz
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`h-14 rounded-lg justify-center items-center ${!selectedRole || isLoading ? "bg-blue-300" : "bg-blue-500"
            }`}
          onPress={handleRoleSelection}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-semibold">Devam Et</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RoleSelectionScreen;
