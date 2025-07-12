import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectUserRole } from "../redux/slices/authSlice";
import { useGetForYouPageQuery } from "../redux/api/apiSlice";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBed,
  faGrid2,
  faMoneyBills,
  faRuler,
  faShower,
  faCar,
  faCalendar,
  faBuilding,
  faCoins,
} from "@fortawesome/pro-light-svg-icons";
import { BlurView } from "expo-blur";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import {
  faChevronLeft,
  faFilter,
  faSliders,
} from "@fortawesome/pro-regular-svg-icons";

const { width } = Dimensions.get("window");

const AllNearbyPropertiesScreen = ({ navigation, route }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Get initial location from route params if available
  const initialLocation = route.params?.initialLocation;

  const [userLocation, setUserLocation] = useState(initialLocation || null);
  const [locationLoading, setLocationLoading] = useState(!initialLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // distance, price, date
  const [isMapView, setIsMapView] = useState(false);

  // OPTIMIZE EDİLDİ: Native driver ile animated değerler
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filter animasyonu için transform ve opacity kullanıyoruz (native driver için)
  const filterTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -60], // Filtreyi yukarı kaydır
    extrapolate: "clamp",
  });

  const filterOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  // Container height animasyonu (JS thread'de çalışır ama gerekli)
  const containerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [45, 0], // Container yüksekliğini 60px'den 0'a küçült
    extrapolate: "clamp",
  });

  // Get user's current location if not provided
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, [initialLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setUserLocation({
          latitude: 41.0082,
          longitude: 28.9784,
        });
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log("Location error:", error);
      setUserLocation({
        latitude: 41.0082,
        longitude: 28.9784,
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch nearby properties
  const {
    data: nearbyData,
    isLoading: isLoadingNearby,
    error,
    refetch,
  } = useGetForYouPageQuery(
    {
      userId: currentUser?.id,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
    },
    {
      skip: !userLocation || !currentUser?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  const nearbyProperties = nearbyData?.result?.bestForYou || [];
  const nearFromYouProperties = nearbyData?.result?.nearFromYou || [];

  // Combine and deduplicate properties
  const allProperties = React.useMemo(() => {
    const combined = [...nearFromYouProperties, ...nearbyProperties];

    // Remove duplicates based on postId
    const uniqueProperties = combined.reduce((acc, current) => {
      const isDuplicate = acc.find((item) => item.postId === current.postId);
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueProperties;
  }, [nearFromYouProperties, nearbyProperties]);

  // Filter and sort properties
  const getFilteredAndSortedProperties = () => {
    let filteredProperties = [...allProperties];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (property) =>
          (property.ilanBasligi &&
            property.ilanBasligi.toLowerCase().includes(query)) ||
          (property.il && property.il.toLowerCase().includes(query)) ||
          (property.ilce && property.ilce.toLowerCase().includes(query)) ||
          (property.postDescription &&
            property.postDescription.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "distance":
        filteredProperties.sort((a, b) => {
          const distanceA = a.distanceInKM || 999;
          const distanceB = b.distanceInKM || 999;
          return distanceA - distanceB;
        });
        break;
      case "price":
        filteredProperties.sort((a, b) => {
          const priceA = a.kiraFiyati || 0;
          const priceB = b.kiraFiyati || 0;
          return priceA - priceB;
        });
        break;
      case "date":
        filteredProperties.sort((a, b) => {
          const dateA = new Date(a.createdDate || 0);
          const dateB = new Date(b.createdDate || 0);
          return dateB - dateA; // Newest first
        });
        break;
      default:
        break;
    }

    return filteredProperties;
  };

  const filteredProperties = getFilteredAndSortedProperties();

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // YENİ: Property Details Free Drag Slider Component
  const PropertyDetailsSlider = ({ item }) => {
    // Property özelliklerini array olarak hazırlıyoruz
    const propertyDetails = [
      {
        id: "rooms",
        icon: faBed,
        value: item.odaSayisi || "N/A",
        label: "Oda",
      },
      {
        id: "bathrooms",
        icon: faShower,
        value: item.banyoSayisi || "N/A",
        label: "Banyo",
      },
      {
        id: "area",
        icon: faRuler,
        value: item.brutMetreKare ? `${item.brutMetreKare} m²` : "N/A",
        label: "Alan",
      },
      {
        id: "dues",
        icon: faMoneyBills,
        value: item.aidat ? `${item.aidat} ₺` : "Yok",
        label: "Aidat",
      },
      {
        id: "",
        icon: faCoins,
        value: item.depozito ? `${item.depozito} ₺` : "Yok",
        label: "Depozito",
      },
      {
        id: "floor",
        icon: faBuilding,
        value: item.bulunduguKat || "N/A",
        label: "Kat",
      },
      {
        id: "age",
        icon: faCalendar,
        value: item.binaYasi ? `${item.binaYasi} ` : "N/A",
        label: "Bina yaşı",
      },
    ];

    return (
      <View className="mt-4 mb-6">
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="normal"
          bounces={true}
          contentContainerStyle={{
            paddingRight: 16, // Sağ tarafta biraz boşluk
            paddingLeft: 4,
          }}
        >
          {propertyDetails.map((detail, index) => (
            <View
              key={detail.id}
              className="items-center justify-center rounded-2xl"
              style={{
                width: 85,
                height: 85,
              }}
            >
              <FontAwesomeIcon size={30} icon={detail.icon} color="#000" />
              <Text
                style={{ fontSize: 16, fontWeight: 600 }}
                className="text-gray-800 mt-2 text-center"
                numberOfLines={1}
              >
                {detail.value}
              </Text>
              <Text
                style={{ fontSize: 11 }}
                className="text-gray-500 text-center"
                numberOfLines={1}
              >
                {detail.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Simple and reliable image slider component
  const PropertyImageSlider = ({ images, distanceInKM, status, postId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const handleScroll = (event) => {
      const slideSize = width - 32;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentIndex(index);
    };

    const handleDotPress = (index) => {
      setCurrentIndex(index);
      const slideSize = width - 32;
      scrollViewRef.current?.scrollTo({
        x: slideSize * index,
        animated: true,
      });
    };

    if (!images || images.length === 0) {
      return (
        <View className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 justify-center items-center rounded-3xl">
          <MaterialIcons name="home" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 font-medium">Resim yok</Text>
        </View>
      );
    }

    return (
      <View
        className="relative bg-gray-100"
        style={{ borderRadius: 25, overflow: "hidden" }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={true}
          style={{ width: width - 32 }}
        >
          {images.map((item, index) => (
            <TouchableOpacity
              key={`image-${postId}-${index}`}
              style={{ width: width - 32 }}
              activeOpacity={1}
              onPress={() =>
                navigation.navigate("PostDetail", { postId: postId })
              }
            >
              <Image
                source={{ uri: item.postImageUrl }}
                style={{ width: width - 32, height: 350 }}
                contentFit="cover"
                transition={150}
                placeholder={{
                  uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Yw7xrbGVuaXlvcjwvdGV4dD48L3N2Zz4=",
                }}
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Distance badge */}
        {distanceInKM !== undefined && (
          <View className="absolute top-3 left-3">
            <View className="bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex-row items-center">
              <MaterialIcons name="location-on" size={12} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                {distanceInKM.toFixed(1)} km
              </Text>
            </View>
          </View>
        )}

        {/* Status badge */}
        <View className="absolute top-3 right-3">
          <BlurView
            intensity={90}
            style={{ overflow: "hidden", borderRadius: 100 }}
            className="px-3 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              {status === 0 ? "Aktif" : status === 1 ? "Kiralandı" : "Kapalı"}
            </Text>
          </BlurView>
        </View>

        {/* Pagination dots - Only show if more than 1 image */}
        {images.length > 1 && (
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
            <View
              style={{
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <View className="flex-row justify-center">
                {images.map((_, index) => (
                  <TouchableOpacity
                    key={`dot-${index}`}
                    onPress={() => handleDotPress(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 4,
                      backgroundColor:
                        index === currentIndex
                          ? "#FFFFFF"
                          : "rgba(255, 255, 255, 0.5)",
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render property item
  const renderPropertyItem = ({ item }) => (
    <View
      style={{ marginHorizontal: 16 }}
      className="overflow-hidden mb-4 pt-6 border-b border-gray-200"
    >
      {/* Image slider - OnPress sadece burada */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("PostDetail", { postId: item.postId })
        }
        activeOpacity={1}
      >
        <PropertyImageSlider
          images={item.postImages}
          distanceInKM={item.distanceInKM}
          status={item.status}
          postId={item.postId}
        />
      </TouchableOpacity>

      <View className="mt-4 px-1">
        {/* Title and Price */}
        <View className="items-start mb-1">
          <Text
            style={{ fontSize: 18, fontWeight: 700 }}
            className="text-gray-800 mb-"
            numberOfLines={2}
          >
            {item.ilanBasligi || "İlan başlığı yok"}
          </Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Text style={{ fontSize: 12 }} className=" text-gray-500">
            {item.ilce && item.il
              ? `${item.ilce}, ${item.il}`
              : item.il || "Konum belirtilmemiş"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text
            style={{ fontSize: 18, fontWeight: 500 }}
            className="text-gray-900 underline"
          >
            {item.kiraFiyati || item.rent
              ? `${(item.kiraFiyati || item.rent).toLocaleString()} ${
                  item.paraBirimi || item.currency || "₺"
                }`
              : "Fiyat belirtilmemiş"}
          </Text>
          <Text className="text-sm text-gray-400 ml-1">/ay</Text>
        </View>

        {/* YENİ: Property details slider */}
        <PropertyDetailsSlider item={item} />
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-8">
      <MaterialIcons name="location-off" size={64} color="#CBD5E0" />
      <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
        Yakınında ilan bulunamadı
      </Text>
      <Text className="text-base text-gray-500 text-center mb-6">
        {searchQuery
          ? "Arama kriterlerinize uygun yakındaki ilan bulunamadı."
          : "Yakınınızda henüz ilan bulunmuyor. Daha sonra tekrar kontrol edin."}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg"
          onPress={() => setSearchQuery("")}
        >
          <Text className="text-white font-semibold">Aramayı Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Show loading state
  if (locationLoading || (!userLocation && isLoadingNearby)) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text className="mt-3 text-base text-gray-500">
            {locationLoading
              ? "Konum alınıyor..."
              : "Yakındaki evler yükleniyor..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-8">
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
            Bir hata oluştu
          </Text>
          <Text className="text-base text-gray-500 text-center mb-6">
            Yakındaki evler yüklenirken bir sorun oluştu.
          </Text>
          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-semibold">Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Fixed search bar */}
      <View className="bg-white border-b border-gray-200 z-10">
        <View className="flex flex-row items-center px-5">
          <View style={{ width: "8%" }}>
            {" "}
            <FontAwesomeIcon icon={faChevronLeft} color="black" size={25} />
          </View>

          <View className="px-4 py-4" style={{ width: "84%" }}>
            <View
              style={{ boxShadow: "0px 0px 12px #00000014" }}
              className="bg-white rounded-3xl gap-2 px-4 flex-row items-center"
            >
              <TextInput
                className="w-full px-2 placeholder:text-gray-400 placeholder:text-[14px] py-4 text-normal"
                placeholder="Yakındaki ilanlar"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={{ width: "8%" }}>
            {" "}
            <FontAwesomeIcon icon={faSliders} color="black" size={20} />
          </View>
        </View>

        {/* OPTIMIZE EDİLDİ: Container height da animate ediliyor */}
        <Animated.View
          style={{
            height: containerHeight, // Container yüksekliği de küçülür
            overflow: "hidden",
          }}
        >
          <Animated.View
            className="flex justify-center items-center"
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              height: 50,
              opacity: filterOpacity,
              transform: [{ translateY: filterTranslateY }],
            }}
          >
            <View className="flex-row">
              {[
                { key: "distance", label: "Uzaklık" },
                { key: "price", label: "Fiyat" },
                { key: "date", label: "Tarih" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  className={`mr-3 px-4 py-2 rounded-full border ${
                    sortBy === option.key
                      ? "bg-gray-900"
                      : "bg-white border-white"
                  }`}
                  onPress={() => setSortBy(option.key)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      sortBy === option.key ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* OPTIMIZE EDİLDİ: Native driver ile scroll tracking */}
      <Animated.FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={(item, index) => `nearby_${item.postId}_${index}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false, // Height animasyonu için false gerekli
          }
        )}
        scrollEventThrottle={1} // Daha smooth animasyon için düşük değer
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A90E2"]}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 16,
        }}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={8}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

export default AllNearbyPropertiesScreen;
