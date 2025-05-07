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

const RoleSelectionScreen = () => {
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
      // Call the assignRole API
      const response = await assignRole({
        userName: user?.userName || "",
        role: selectedRole,
      }).unwrap();

      // Check for successful response
      if (response && response.isSuccess) {
        // Store selected role in Redux
        dispatch(setRole(selectedRole));

        Alert.alert(
          "Başarılı",
          `${selectedRole === "landlord" ? "Ev Sahibi" : "Kiracı"
          } rolü başarıyla seçildi`,
          [
            {
              text: "Tamam",
              onPress: () => {
                // Navigate based on role - handled by AppNavigator
              },
            },
          ]
        );
      } else {
        // Show error from API
        Alert.alert("Hata", response?.message || "Rol seçimi başarısız oldu");
      }
    } catch (error) {
      console.error("Role selection error:", error);
      Alert.alert(
        "Hata",
        error.data?.message ||
        "Rol seçimi sırasında bir hata oluştu. Lütfen tekrar deneyin."
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
            className={`bg-white p-5 rounded-xl mb-4 border-2 ${selectedRole === "landlord"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
              }`}
            onPress={() => setSelectedRole("landlord")}
          >
            <View className="w-14 h-14 rounded-full bg-blue-50 justify-center items-center mb-4">
              <Image
                source={require("../../assets/logo-kirax.png")}
                className="w-8 h-8 tint-blue-500"
                resizeMode="contain"
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
            className={`bg-white p-5 rounded-xl border-2 ${selectedRole === "tenant"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
              }`}
            onPress={() => setSelectedRole("tenant")}
          >
            <View className="w-14 h-14 rounded-full bg-blue-50 justify-center items-center mb-4">
              <Image
                source={require("../../assets/logo-kirax.png")}
                className="w-8 h-8 tint-blue-500"
                resizeMode="contain"
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
