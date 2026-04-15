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
import { Home, Key } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const RoleSelectionScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Use the assign role mutation
  const [assignRole, { isLoading }] = useAssignRoleMutation();

  // Replace the handleRoleSelection function in RoleSelectionScreen

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert("Hata", "Lütfen bir rol seçin");
      return;
    }

    if (!user || !user.id) {
      Alert.alert(
        "Hata",
        "Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }


    try {
      // First, update Redux state immediately
      dispatch(setRole(selectedRole));

      // Prepare role assignment data
      const roleAssignmentData = {
        userName: user.userName || user.email || "",
        role: selectedRole,
        email: user.email || "",
      };


      // Call the assignRole API
      const response = await assignRole(roleAssignmentData).unwrap();


      // After successful role assignment, check for existing profile
      try {
        const userId = user.id;

        if (selectedRole === "EVSAHIBI") {

          try {
            const profileResponse = await dispatch(
              apiSlice.endpoints.getLandlordProfile.initiate(userId)
            ).unwrap();


            if (profileResponse?.isSuccess && profileResponse.result) {
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });
              return;
            }
          } catch (profileError) {
            // This is expected if no profile exists
          }
        } else if (selectedRole === "KIRACI") {

          try {
            const profileResponse = await dispatch(
              apiSlice.endpoints.getTenantProfile.initiate(userId)
            ).unwrap();


            if (profileResponse?.isSuccess && profileResponse.result) {
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });
              return;
            }
          } catch (profileError) {
            // This is expected if no profile exists
          }
        }

        // No existing profile found, navigate to profile creation
        navigation.navigate("CreateProfile");
      } catch (profileError) {
        // Continue to profile creation even if check fails
        navigation.navigate("CreateProfile");
      }
    } catch (error) {

      // Even if API fails, continue to profile creation since Redux state is updated

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
            <Home size={50} color="#1f2937" />
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
            <Key size={50} color="#1f2937" />
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
          activeOpacity={0.8}
          onPress={handleRoleSelection}
          disabled={!selectedRole || isLoading}
        >
          <LinearGradient
            colors={
              !selectedRole || isLoading
                ? ["#d1d5db", "#d1d5db"]
                : ["#20604C", "#20604C"]
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ borderRadius: 999, padding: 2 }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 999,
                height: 50,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#20604C" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: !selectedRole ? "#d1d5db" : "#20604C",
                  }}
                >
                  Devam Et
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RoleSelectionScreen;
