import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import { selectUserRole, selectCurrentUser } from "../redux/slices/authSlice";
import { useGetLandlordProfilesQuery } from "../redux/api/apiSlice";

const HomeScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data based on user role
  const { data, isLoading, refetch } = useGetLandlordProfilesQuery();

  // Placeholder for featured properties - replace with actual data fetching
  const [featuredProperties, setFeaturedProperties] = useState([
    {
      id: 1,
      title: "Modern Daire",
      location: "Kadıköy, İstanbul",
      price: "5.500 ₺",
      image: "https://via.placeholder.com/300x200",
      bedroom: 2,
      bathroom: 1,
      area: "90 m²",
    },
    {
      id: 2,
      title: "Deniz Manzaralı Villa",
      location: "Çeşme, İzmir",
      price: "12.000 ₺",
      image: "https://via.placeholder.com/300x200",
      bedroom: 4,
      bathroom: 3,
      area: "220 m²",
    },
    {
      id: 3,
      title: "Şehir Merkezinde Daire",
      location: "Kızılay, Ankara",
      price: "4.200 ₺",
      image: "https://via.placeholder.com/300x200",
      bedroom: 3,
      bathroom: 1,
      area: "110 m²",
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity
      className="mr-4 bg-white rounded-xl overflow-hidden w-64 shadow-sm border border-gray-200"
      onPress={() => {
        /* Navigate to property details */
      }}
    >
      <Image
        source={{ uri: item.image }}
        className="w-full h-36"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
        <Text className="text-sm text-gray-500 mb-2">{item.location}</Text>
        <Text className="text-base font-semibold text-blue-600">
          {item.price}
        </Text>
        <View className="flex-row justify-between mt-2">
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-700">
              {item.bedroom} Yatak Odası
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-700">{item.bathroom} Banyo</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-700">{item.area}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View className="bg-blue-500 pt-12 pb-4 px-5">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-lg font-semibold">
              Merhaba, {currentUser?.name || "Kullanıcı"}
            </Text>
            <Text className="text-white text-sm opacity-80">
              {userRole === "EVSAHIBI" ? "Ev Sahibi" : "Kiracı"} hesabı
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              /* Navigate to profile */
            }}
            className="w-10 h-10 rounded-full bg-white justify-center items-center"
          >
            {/* Profile avatar or icon */}
            <Text className="text-blue-500 font-bold">
              {currentUser?.name?.charAt(0) || "K"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-lg flex-row items-center px-4 py-2">
          <Image
            source={require("../../assets/logo-kirax.png")} // Replace with search icon
            className="w-5 h-5 mr-2"
            resizeMode="contain"
          />
          <TextInput
            className="flex-1 text-base"
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
      // Continued from previous code
      {/* Main Content */}
      <View className="p-5">
        {/* Featured Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              {userRole === "KIRACI" ? "Öne Çıkan Evler" : "Son İlanlarınız"}
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-500">Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#4A90E2" />
          ) : (
            <FlatList
              data={featuredProperties}
              renderItem={renderPropertyCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pt-2"
            />
          )}
        </View>

        {/* Categories Section for Tenants */}
        {userRole === "KIRACI" && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Kategoriler
            </Text>

            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <View className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center mb-3">
                  <Image
                    source={require("../../assets/logo-kirax.png")} // Replace with category icon
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-base font-semibold text-gray-800">
                  Daireler
                </Text>
                <Text className="text-xs text-gray-500">120+ ilan</Text>
              </TouchableOpacity>

              <TouchableOpacity className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <View className="w-12 h-12 rounded-full bg-green-100 justify-center items-center mb-3">
                  <Image
                    source={require("../../assets/logo-kirax.png")} // Replace with category icon
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-base font-semibold text-gray-800">
                  Villalar
                </Text>
                <Text className="text-xs text-gray-500">43+ ilan</Text>
              </TouchableOpacity>

              <TouchableOpacity className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <View className="w-12 h-12 rounded-full bg-yellow-100 justify-center items-center mb-3">
                  <Image
                    source={require("../../assets/logo-kirax.png")} // Replace with category icon
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-base font-semibold text-gray-800">
                  Rezidanslar
                </Text>
                <Text className="text-xs text-gray-500">65+ ilan</Text>
              </TouchableOpacity>

              <TouchableOpacity className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <View className="w-12 h-12 rounded-full bg-purple-100 justify-center items-center mb-3">
                  <Image
                    source={require("../../assets/logo-kirax.png")} // Replace with category icon
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-base font-semibold text-gray-800">
                  Müstakil
                </Text>
                <Text className="text-xs text-gray-500">28+ ilan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dashboard Stats for Landlords */}
        {userRole === "EVSAHIBI" && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Genel Durum
            </Text>

            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <Text className="text-2xl font-bold text-blue-500">3</Text>
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
            {userRole === "EVSAHIBI" ? "Size Yakın Mülkler" : "Son Aktiviteler"}
          </Text>

          {userRole === "KIRACI" ? (
            // Nearby properties for tenants
            <View>
              {[1, 2, 3].map((item) => (
                <TouchableOpacity
                  key={item}
                  className="flex-row bg-white rounded-xl p-3 mb-3 border border-gray-200"
                  onPress={() => {
                    /* Navigate to property details */
                  }}
                >
                  <Image
                    source={{ uri: "https://via.placeholder.com/100" }}
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
                    <Text className="text-sm text-gray-500 mb-1">
                      {item === 1
                        ? "Beşiktaş, İstanbul"
                        : item === 2
                          ? "Çankaya, Ankara"
                          : "Konak, İzmir"}
                    </Text>
                    <Text className="text-base font-semibold text-blue-600">
                      {item === 1
                        ? "3.500 ₺"
                        : item === 2
                          ? "4.200 ₺"
                          : "6.000 ₺"}
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
                      ? "bg-blue-100"
                      : item === 2
                        ? "bg-green-100"
                        : "bg-yellow-100"
                      } justify-center items-center mr-3`}
                  >
                    <Text
                      className={`${item === 1
                        ? "text-blue-600"
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
              className="w-[48%] bg-blue-50 rounded-xl p-4 mb-3 border border-blue-100"
              onPress={() => {
                /* Navigate based on role */
                userRole === "EVSAHIBI"
                  ? navigation.navigate("CreatePost")
                  : navigation.navigate("FindProperties");
              }}
            >
              <Text className="text-blue-800 font-semibold text-center">
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
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
