import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useSelector } from "react-redux";
import { selectUserRole, selectCurrentUser } from "../redux/slices/authSlice";
import { selectUserProfile } from "../redux/slices/profileSlice";
import NearbyProperties from "../components/NearbyProperties";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faBarsFilter, faSearch } from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";
import { faEdit } from "@fortawesome/pro-regular-svg-icons";

const HomeScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const userProfile = useSelector(selectUserProfile);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("house"); // varsayılan olarak 'house' seçili

  // Check if profile needs to be completed
  const needsProfileCompletion =
    currentUser &&
    ((userRole === "EVSAHIBI" && !currentUser.isLandlordExpectationCompleted) ||
      (userRole === "KIRACI" && !currentUser.isTenantExpectationCompleted));

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call or actual refresh logic
    try {
      // Add your refresh logic here (API calls, data fetching, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulated delay
      console.log("Page refreshed successfully");
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompleteProfile = () => {
    navigation.navigate("ProfileExpectation");
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView style={{ flex: 0, backgroundColor: "#fff" }} />
      <StatusBar style="dark" backgroundColor="#fff" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 0 }} // Tab bar için alan
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A0E79E"
            colors={["#A0E79E"]}
            progressBackgroundColor="#fff"
            title="Yenileniyor..."
            titleColor="#666"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="bg-white px-5 gap-4 pt-4">
          <View className="flex-row flex- w-full justify-between items-center">
            <View className="flex flex-col gap-1">
              <Text
                style={{ fontSize: 20 }}
                className="text-gray-900 font-semibold"
              >
                Merhaba, {currentUser?.name || "Kullanıcı"}
              </Text>
              <Text
                style={{ fontSize: 12 }}
                className="text-gray-500 opacity-80"
              >
                {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"} hesabı
              </Text>
            </View>
            <TouchableOpacity
              style={{ boxShadow: "0px 0px 12px #00000020" }}
              onPress={() => {
                navigation.navigate(
                  userRole === "EVSAHIBI" ? "LandlordProfile" : "TenantProfile"
                );
              }}
              className="w-12 h-12 rounded-full bg-white justify-center items-center"
            >
              {/* Profile avatar or icon */}
              <Text className="text-gray-900 font-bold">
                {currentUser?.name?.charAt(0) || "P"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="">
            <View
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              className="bg-white rounded-3xl gap-2 px-4 flex-row items-center "
            >
              <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
              <TextInput
                className="w-full placeholder:text-gray-500 placeholder:text-[14px] py-4 text-normal"
                style={{
                  textAlignVertical: "center", // Android için
                  includeFontPadding: false, // Android için
                }}
                placeholder={
                  userRole === "KIRACI"
                    ? "Konuma göre ev ara..."
                    : "İlanlarınızda arayın..."
                }
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Categories Section for Tenants */}
          {userRole === "KIRACI" && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory("house")}
                  className={`mr-4 px-5 py-2 rounded-full ${
                    selectedCategory === "house"
                      ? "bg-[#A0E79E]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === "house"
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    Ev
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory("apartment")}
                  className={`mr-4 px-5 py-2 rounded-full ${
                    selectedCategory === "apartment"
                      ? "bg-[#A0E79E]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === "apartment"
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    Apartman
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory("hotel")}
                  className={`mr-4 px-5 py-2 rounded-full ${
                    selectedCategory === "hotel"
                      ? "bg-[#A0E79E]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === "hotel"
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    Otel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory("villa")}
                  className={`mr-4 px-5 py-2 rounded-full ${
                    selectedCategory === "villa"
                      ? "bg-[#A0E79E]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === "villa"
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    Villa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory("beach")}
                  className={`px-5 py-2 rounded-full ${
                    selectedCategory === "beach"
                      ? "bg-[#A0E79E]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === "beach"
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    Sahil
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View className="">
          {/* Nearby Properties Section - NEW COMPONENT */}
          <View style={{ zIndex: 1 }}>
            <NearbyProperties
              navigation={navigation}
              refreshing={refreshing}
              onRefresh={() => setRefreshing(false)}
            />
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default HomeScreen;
