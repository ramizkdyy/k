// HomeScreen.js - Animated Header ile güncellenmiş
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
  Dimensions,
  StatusBar as RNStatusBar,
} from "react-native";
import { useSelector } from "react-redux";
import { selectUserRole, selectCurrentUser } from "../redux/slices/authSlice";
import { selectUserProfile } from "../redux/slices/profileSlice";
import NearbyProperties from "../components/NearbyProperties";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faBarsFilter, faSearch, faSliders } from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";
import {
  faEdit,
  faMessage,
  faFingerprint,
} from "@fortawesome/pro-regular-svg-icons";
import { useGetUnreadSummaryQuery } from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const userProfile = useSelector(selectUserProfile);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("house");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // ===== ANIMATION SETUP =====
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const SCROLL_DISTANCE = 50;

  // Header animasyonları
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -60], // Title + gap kadar yukarı kayar
    extrapolate: 'clamp',
  });

  // ÖNEMLİ: Arama barının genişlik animasyonu
  const searchBarWidth = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [
      screenWidth - 32, // Başta neredeyse tam genişlik (sadece padding)
      screenWidth - 32 - 50 - 8 // Scroll sonunda mesaj butonu için yer bırak
    ],
    extrapolate: 'clamp',
  });

  // Arama barının sağdan margin/padding animasyonu
  const searchBarMarginRight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, 58], // Mesaj butonu için yer (50 + 8 margin)
    extrapolate: 'clamp',
  });

  const headerContainerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [
      insets.top + 50 + 60 + 16, // Normal: SafeArea + Title + SearchBar + padding
      insets.top + 60 + 8        // Scroll: SafeArea + SearchBar + minimal padding
    ],
    extrapolate: 'clamp',
  });

  // SignalR context'den connection ve status al
  const { isConnected, connection } = useSignalR();

  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useGetUnreadSummaryQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const totalUnreadCount = React.useMemo(() => {
    console.log("HomeScreen - Unread Data Response:", unreadData);
    return unreadData?.totalUnreadChats || 0;
  }, [unreadData?.totalUnreadChats]);

  // Focus effect - Ekrana gelince unread count'u yenile
  useFocusEffect(
    useCallback(() => {
      console.log("📱 HomeScreen focused, refreshing unread count...");
      refetchUnread();
    }, [refetchUnread])
  );

  // SignalR event listener'larını ekle
  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log("🔔 Setting up SignalR listeners for HomeScreen unread count");

    const handleReceiveMessage = (messageData) => {
      console.log("📨 New message received in HomeScreen:", messageData);
      refetchUnread();
    };

    const handleMessageSent = (confirmationData) => {
      console.log("✅ Message sent confirmation in HomeScreen:", confirmationData);
      refetchUnread();
    };

    const handleMessagesRead = (readData) => {
      console.log("👁️ Messages read in HomeScreen:", readData);
      refetchUnread();
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessageSent", handleMessageSent);
    connection.on("MessagesRead", handleMessagesRead);

    return () => {
      console.log("🧹 Cleaning up SignalR listeners for HomeScreen");
      connection.off("ReceiveMessage", handleReceiveMessage);
      connection.off("MessageSent", handleMessageSent);
      connection.off("MessagesRead", handleMessagesRead);
    };
  }, [connection, isConnected, refetchUnread]);

  // Check if profile needs to be completed
  const needsProfileCompletion =
    currentUser &&
    ((userRole === "EVSAHIBI" && !currentUser.isLandlordExpectationCompleted) ||
      (userRole === "KIRACI" && !currentUser.isTenantExpectationCompleted));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUnread(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
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

  const handleMessagesPress = () => {
    navigation.navigate("Messages");
  };

  const handleFilterPress = () => {
    setIsFilterVisible(!isFilterVisible);
    // Filter modal'ı açma logic'i buraya eklenebilir
  };

  // Dynamic padding helper
  const getDynamicPaddingTop = () => {
    const normalPadding = insets.top + 50 + 60 + 32;
    return normalPadding;
  };

  // Animated Header Component
  const renderAnimatedHeader = () => {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: headerContainerHeight,
        }}
      >
        {/* BlurView Background */}
        <BlurView
          intensity={80}
          tint="light"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Semi-transparent overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
          }}
        />

        {/* Content Container */}
        <View style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          flex: 1,
          zIndex: 10,
        }}>

          {/* Title Section - Kaybolur */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
              height: 50,
              justifyContent: 'center',
            }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-col flex-1">
                <Text
                  style={{ fontSize: 30 }}
                  className="text-gray-900 font-semibold"
                >
                  kiraX
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Search Bar - Title'ın yerine geçer ve genişlik animasyonu */}
          <Animated.View
            style={{
              marginTop: 10,
              transform: [{ translateY: searchBarTranslateY }],
              width: searchBarWidth, // Animasyonlu genişlik
              marginRight: searchBarMarginRight, // Sağdan margin animasyonu
            }}
          >
            <BlurView
              intensity={60}
              tint="light"
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
                className="border border-gray-100 border-[1px] rounded-full"
              >
                <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
                <TextInput
                  className="flex-1 placeholder:text-gray-500 py-4 text-normal"
                  style={{
                    textAlignVertical: "center",
                    includeFontPadding: false,
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
            </BlurView>
          </Animated.View>
        </View>

        {/* Message Button - Sağ üstte sabit */}
        <View
          style={{
            position: 'absolute',
            right: 16,
            top: insets.top + 3,
            zIndex: 20,
          }}
        >
          <TouchableOpacity
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
            className="p-3 rounded-full bg-white"
            onPress={handleMessagesPress}
          >
            <FontAwesomeIcon
              icon={faMessage}
              size={20}
              color={isFilterVisible ? "white" : "#111827"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <StatusBar style="dark" backgroundColor="transparent" />

      {/* Animated Header */}
      {renderAnimatedHeader()}

      {/* Main ScrollView */}
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: getDynamicPaddingTop(),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A0E79E"
            colors={["#A0E79E"]}
            progressBackgroundColor="#fff"
            progressViewOffset={getDynamicPaddingTop()}
            title="Yenileniyor..."
            titleColor="#666"
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Completion Alert (if needed) */}
        {/* {needsProfileCompletion && (
          <View className="mx-5 mb-4">
            <TouchableOpacity
              onPress={handleCompleteProfile}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
            >
              <View className="flex-row items-center">
                <FontAwesomeIcon icon={faFingerprint} size={24} color="#EAB308" />
                <View className="ml-3 flex-1">
                  <Text className="text-yellow-900 font-semibold">
                    Profilinizi Tamamlayın
                  </Text>
                  <Text className="text-yellow-700 text-sm mt-1">
                    Daha iyi eşleşmeler için profilinizi tamamlayın
                  </Text>
                </View>
                <FontAwesomeIcon icon={faEdit} size={16} color="#EAB308" />
              </View>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Main Content - NearbyProperties */}
        <View className="">
          <View style={{ zIndex: 1 }}>
            <NearbyProperties
              navigation={navigation}
              refreshing={refreshing}
              onRefresh={() => setRefreshing(false)}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} /> */}
    </View>
  );
};

export default HomeScreen;