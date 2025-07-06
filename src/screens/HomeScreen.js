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

const HomeScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const userProfile = useSelector(selectUserProfile);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('house'); // varsayılan olarak 'house' seçili


  // Check if profile needs to be completed
  const needsProfileCompletion =
    currentUser &&
    ((userRole === "EVSAHIBI" && !currentUser.isLandlordExpectationCompleted) ||
      (userRole === "KIRACI" && !currentUser.isTenantExpectationCompleted));

  const onRefresh = async () => {
    setRefreshing(true);
    // The NearbyProperties component will handle its own refresh
    // This is just to coordinate the overall refresh state
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCompleteProfile = () => {
    navigation.navigate("ProfileExpectation");
  };

  return (
    <ScrollView
      bounces={false}
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <SafeAreaView>
        {/* Profile Completion Banner - Only show if profile needs to be completed */}
        {!currentUser.isTenantExpectationCompleted &&
          !currentUser.isLandlordExpectationCompleted && (
            <TouchableOpacity
              className="bg-yellow-500 py-3 px-4 flex-row justify-between items-center"
              onPress={handleCompleteProfile}
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold mr-2">!</Text>
                <Text className="text-white font-semibold">Profili Tamamla</Text>
              </View>
              <Text className="text-white">→</Text>
            </TouchableOpacity>
          )}
        <StatusBar style="dark" backgroundColor="#fff" />
        {/* Header Section */}
        <View className="bg-white px-4 gap-4">
          <View className="flex-row flex- w-full justify-between items-center">
            <View>
              <Text className="text-gray-700 text-lg font-semibold">
                Merhaba, {currentUser?.name || "Kullanıcı"}
              </Text>
              <Text className="text-gray-700 text-sm opacity-80">
                {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"} hesabı
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate(
                  userRole === "EVSAHIBI" ? "LandlordProfile" : "TenantProfile"
                );
              }}
              className="w-10 h-10 mr-3 rounded-full bg-[#A0E79E] justify-center items-center"
            >
              {/* Profile avatar or icon */}
              <Text className="text-gray-100 font-bold">
                {currentUser?.name?.charAt(0) || "K"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center gap-3">

            <View className="bg-gray-100 rounded-lg flex-row items-center px-3 gap-2 ">

              <FontAwesomeIcon icon={faSearch} size={20} color="#838383" />
              <TextInput
                className="w-[75%] py-3.5 text-normal"
                style={{
                  textAlignVertical: 'center', // Android için
                  includeFontPadding: false,   // Android için
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
            <Pressable className="rounded-lg p-3 bg-[#A0E79E]" >
              <FontAwesomeIcon icon={faBarsFilter} size={20} color="#fff" className="ml-2" />
            </Pressable>
          </View>
          {/* Categories Section for Tenants */}
          {/* Categories Section for Tenants */}
          {userRole === "KIRACI" && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory('house')}
                  className={`mr-4 px-5 py-2 rounded-full ${selectedCategory === 'house'
                    ? 'bg-[#A0E79E]'
                    : 'bg-gray-100'
                    }`}
                >
                  <Text className={`text-sm font-medium ${selectedCategory === 'house'
                    ? 'text-white'
                    : 'text-gray-700'
                    }`}>
                    Ev
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('apartment')}
                  className={`mr-4 px-5 py-2 rounded-full ${selectedCategory === 'apartment'
                    ? 'bg-[#A0E79E]'
                    : 'bg-gray-100'
                    }`}
                >
                  <Text className={`text-sm font-medium ${selectedCategory === 'apartment'
                    ? 'text-white'
                    : 'text-gray-700'
                    }`}>
                    Apartman
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('hotel')}
                  className={`mr-4 px-5 py-2 rounded-full ${selectedCategory === 'hotel'
                    ? 'bg-[#A0E79E]'
                    : 'bg-gray-100'
                    }`}
                >
                  <Text className={`text-sm font-medium ${selectedCategory === 'hotel'
                    ? 'text-white'
                    : 'text-gray-700'
                    }`}>
                    Otel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('villa')}
                  className={`mr-4 px-5 py-2 rounded-full ${selectedCategory === 'villa'
                    ? 'bg-[#A0E79E]'
                    : 'bg-gray-100'
                    }`}
                >
                  <Text className={`text-sm font-medium ${selectedCategory === 'villa'
                    ? 'text-white'
                    : 'text-gray-700'
                    }`}>
                    Villa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('beach')}
                  className={`px-5 py-2 rounded-full ${selectedCategory === 'beach'
                    ? 'bg-[#A0E79E]'
                    : 'bg-gray-100'
                    }`}
                >
                  <Text className={`text-sm font-medium ${selectedCategory === 'beach'
                    ? 'text-white'
                    : 'text-gray-700'
                    }`}>
                    Sahil
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

        </View>

        {/* Main Content */}
        <View className="p-5">
          {/* Nearby Properties Section - NEW COMPONENT */}
          <View style={{ zIndex: 1 }}>
            <NearbyProperties
              navigation={navigation}
              refreshing={refreshing}
              onRefresh={() => setRefreshing(false)}
            />
          </View>



          {/* Dashboard Stats for Landlords */}
          {userRole === "EVSAHIBI" && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                Genel Durum
              </Text>

              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                  <Text className="text-2xl font-bold text-green-500">3</Text>
                  <Text className="text-sm text-gray-600">Aktif İlanlar</Text>
                </View>

                <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                  <Text className="text-2xl font-bold text-green-500">5</Text>
                  <Text className="text-sm text-gray-600">Yeni Teklifler</Text>
                </View>

                <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                  <Text className="text-2xl font-bold text-yellow-500">2</Text>
                  <Text className="text-sm text-gray-600">Kiralanmış</Text>
                </View>

                <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                  <Text className="text-2xl font-bold text-purple-500">15</Text>
                  <Text className="text-sm text-gray-600">
                    Toplam Görüntülenme
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Recent Activity or Nearby Properties */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              {userRole === "EVSAHIBI" ? "Son Aktiviteler" : "Son Aktiviteler"}
            </Text>

            {userRole === "KIRACI" ? (
              // Recent activities for tenants
              <View>
                {[1, 2, 3].map((item) => (
                  <TouchableOpacity
                    key={item}
                    className="flex-row bg-white rounded-xl p-3 mb-3"
                    onPress={() => {
                      /* Navigate to property details */
                    }}
                  >
                    <Image
                      source={require("../../assets/placeholder.png")} // Placeholder image
                      className="w-20 h-20 rounded-lg mr-3"
                    />
                    <View className="flex-1 justify-center">
                      <Text className="text-base font-bold text-gray-800">
                        {item === 1
                          ? "Modern Stüdyo Daire"
                          : item === 2
                            ? "2+1 Bahçeli Daire"
                            : "3+1 Lüks Daire"}
                      </Text>
                      <Text className="text-base font-semibold text-[#8dcc8c]">
                        {item === 1
                          ? "3.500 ₺"
                          : item === 2
                            ? "4.200 ₺"
                            : "6.000 ₺"}
                      </Text>
                      <Text className="text-sm text-gray-500 mb-1">
                        {item === 1
                          ? "Beşiktaş, İstanbul"
                          : item === 2
                            ? "Çankaya, Ankara"
                            : "Konak, İzmir"}
                      </Text>

                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Recent activities for landlords
              <View>
                {[1, 2, 3].map((item) => (
                  <View
                    key={item}
                    className="flex-row bg-white rounded-xl p-3 mb-3 border border-gray-200"
                  >
                    <View
                      className={`w-10 h-10 rounded-full ${item === 1
                        ? "bg-green-100"
                        : item === 2
                          ? "bg-green-100"
                          : "bg-yellow-100"
                        } justify-center items-center mr-3`}
                    >
                      <Text
                        className={`${item === 1
                          ? "text-green-600"
                          : item === 2
                            ? "text-green-600"
                            : "text-yellow-600"
                          } font-bold`}
                      >
                        {item === 1 ? "M" : item === 2 ? "K" : "İ"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-800">
                        {item === 1
                          ? "Modern Daire için yeni teklif"
                          : item === 2
                            ? "Bahçeli Ev kiralandı"
                            : "İlan görüntülendi"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {item === 1
                          ? "5 dakika önce"
                          : item === 2
                            ? "3 saat önce"
                            : "Dün"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="mb-10">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Hızlı İşlemler
            </Text>

            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                className="w-[48%] bg-green-50 rounded-xl p-4 mb-3 border border-green-100"
                onPress={() => {
                  /* Navigate based on role */
                  userRole === "EVSAHIBI"
                    ? navigation.navigate("CreatePost")
                    : navigation.navigate("FindProperties");
                }}
              >
                <Text className="text-green-800 font-semibold text-center">
                  {userRole === "EVSAHIBI" ? "Yeni İlan Oluştur" : "İlan Ara"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-[48%] bg-green-50 rounded-xl p-4 mb-3 border border-green-100"
                onPress={() => {
                  /* Navigate to offers */
                  navigation.navigate(
                    userRole === "EVSAHIBI" ? "ReceivedOffers" : "MySentOffers"
                  );
                }}
              >
                <Text className="text-green-800 font-semibold text-center">
                  {userRole === "EVSAHIBI"
                    ? "Teklifleri Görüntüle"
                    : "Tekliflerim"}
                </Text>
              </TouchableOpacity>

              {/* Add ProfileExpectation button when needed */}
              {needsProfileCompletion && (
                <TouchableOpacity
                  className="w-full bg-yellow-50 rounded-xl p-4 mb-3 border border-yellow-100"
                  onPress={handleCompleteProfile}
                >
                  <Text className="text-yellow-800 font-semibold text-center">
                    Beklenti Profili Oluştur
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default HomeScreen;
