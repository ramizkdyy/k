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
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHome, faKey } from "@fortawesome/pro-regular-svg-icons";

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
          },
          (className = "w-20 h-20"),
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      <View style={{ paddingTop: 30 }} className="flex-1 justify-start">
        <Text
          style={{ fontSize: 20 }}
          className="text-2xl font-bold text-gray-900 mb-1"
        >
          Hoş Geldin, {user?.name || "Kullanıcı"}
        </Text>
        <Text style={{ fontSize: 12 }} className=" text-gray-500 mb-8">
          Devam etmek için lütfen bir rol seç:
        </Text>

        <View className="mb-8">
          <TouchableOpacity
            activeOpacity={1}
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className={`bg-white p-5 py-10  rounded-3xl flex flex-col gap-2 justify-center items-center mb-4 border transition duration-300 ${
              selectedRole === "EVSAHIBI"
                ? "border-gray-400"
                : "border-gray-100"
            }`}
            onPress={() => setSelectedRole("EVSAHIBI")}
          >
            <FontAwesomeIcon size={50} icon={faHome} />
            <Text className="text-xl font-bold text-gray-800">Ev Sahibi</Text>
            <Text
              style={{ fontSize: 12 }}
              className="text-gray-600 text-center leading-5"
            >
              Mülk sahipleri için - ilan oluşturabilir ve kiralık mülklerinizi
              yönetebilirsiniz.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            style={{ boxShadow: "0px 0px 12px #00000014" }}
            className={`bg-white p-5 py-10  rounded-3xl flex flex-col gap-2 justify-center items-center mb-4 border transition duration-300 ${
              selectedRole === "KIRACI" ? "border-gray-400" : "border-gray-100"
            }`}
            onPress={() => setSelectedRole("KIRACI")}
          >
            <FontAwesomeIcon size={50} icon={faKey} />
            <Text className="text-xl font-bold text-gray-800">Kiracı</Text>
            <Text
              style={{ fontSize: 12 }}
              className="text-gray-600 text-center leading-5"
            >
              Kiracılar için - mülk arayabilir, ilanlara göz atabilir ve
              teklifler gönderebilirsiniz
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`h-14 rounded-lg justify-center items-center ${
            !selectedRole || isLoading ? "bg-[#dee0ea]" : "bg-green-300"
          }`}
          onPress={handleRoleSelection}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              style={{ fontSize: 16, fontWeight: 500 }}
              className="text-white"
            >
              Devam Et
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RoleSelectionScreen;
