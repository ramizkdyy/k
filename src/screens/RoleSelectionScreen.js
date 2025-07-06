import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setRole } from "../redux/slices/authSlice";
import { useAssignRoleMutation, apiSlice } from "../redux/api/apiSlice";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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

      // Rol seçildikten sonra profil kontrolü yap
      try {
        const userId = user?.id;

        if (selectedRole === "EVSAHIBI") {
          // Ev sahibi profili sorgula
          const profileResponse = await dispatch(
            apiSlice.endpoints.getLandlordProfile.initiate(userId)
          ).unwrap();

          if (profileResponse?.isSuccess && profileResponse.result) {
            // Profil var, ana sayfaya yönlendir
            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
            return;
          }
        } else if (selectedRole === "KIRACI") {
          // Kiracı profili sorgula
          const profileResponse = await dispatch(
            apiSlice.endpoints.getTenantProfile.initiate(userId)
          ).unwrap();

          if (profileResponse?.isSuccess && profileResponse.result) {
            // Profil var, ana sayfaya yönlendir
            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
            return;
          }
        }

        // Profil bulunamadı veya oluşturulmamış, profil oluşturmaya yönlendir
        navigation.navigate("CreateProfile");
      } catch (profileError) {
        console.error("Profil sorgulama hatası:", profileError);
        // Hata durumunda profil oluşturmaya yönlendir
        navigation.navigate("CreateProfile");
      }
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
          }, className = "w-20 h-20"

        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-5">
      <View className="items-center mt-12 mb-6">
        <Image
          source={require("../../assets/logo-kirax.png")}
          resizeMode="contain"
          style={{ width: width * 0.5, height: width * 0.3 }}
        />
      </View>

      <View className="flex-1 justify-center pb-12">
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          Hoş Geldin, {user?.name || "Kullanıcı"}
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          Devam etmek için lütfen bir rol seç:
        </Text>

        <View className="mb-8">
          <TouchableOpacity
            className={`bg-white p-5 rounded-xl mb-4 border-2 ${selectedRole === "EVSAHIBI"
              ? "border-[#2C8700] bg-green-50"
              : "border-gray-200"
              }`}
            onPress={() => setSelectedRole("EVSAHIBI")}
          >
            <View className="w-14 h-14 rounded-full bg-green-50 justify-center items-center mb-4">
              <Image
                source={require("../../assets/ev-sahibi.png")}
                className="w-16 h-16"
                resizeMode="contain"
                style={{ tintColor: "#2C8700" }}
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
            className={`bg-white p-5 rounded-xl border-2 ${selectedRole === "KIRACI"
              ? "border-[#2C8700] bg-green-50"
              : "border-gray-200"
              }`}
            onPress={() => setSelectedRole("KIRACI")}
          >
            <View className="w-14 h-14 rounded-full  bg-green-50 justify-center items-center mb-4">
              <Image
                source={require("../../assets/kiraci.png")}
                className="w-8 h-8"
                resizeMode="contain"
                style={{ tintColor: "#2C8700" }}
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
          className={`h-14 rounded-lg justify-center items-center ${!selectedRole || isLoading ? "bg-[#39a802]" : "bg-[#2C8700]"
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
    </SafeAreaView>
  );
};

export default RoleSelectionScreen;
