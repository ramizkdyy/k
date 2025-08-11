// HomeScreen.js - Real-time Unread Count ile güncellenmiş
import React, { useState, useEffect, useCallback } from "react";
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
import {
  faEdit,
  faMessage,
  faFingerprint,
} from "@fortawesome/pro-regular-svg-icons";
import { useGetUnreadCountQuery } from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext"; // ✅ SignalR context'i ekle
import { useFocusEffect } from "@react-navigation/native"; // ✅ Focus effect ekle

const HomeScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const userProfile = useSelector(selectUserProfile);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("house");

  // ✅ SignalR context'den connection ve status al
  const { isConnected, connection } = useSignalR();

  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useGetUnreadCountQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const totalUnreadCount = React.useMemo(() => {
    console.log("HomeScreen - Unread Data Response:", unreadData);
    return unreadData?.count || 0;
  }, [unreadData]);

  // ✅ Focus effect - Ekrana gelince unread count'u yenile
  useFocusEffect(
    useCallback(() => {
      console.log("📱 HomeScreen focused, refreshing unread count...");
      refetchUnread();
    }, [refetchUnread])
  );

  // ✅ SignalR event listener'larını ekle
  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log("🔔 Setting up SignalR listeners for HomeScreen unread count");

    const handleReceiveMessage = (messageData) => {
      console.log("📨 New message received in HomeScreen:", messageData);
      // Yeni mesaj geldiğinde unread count'u yenile
      refetchUnread();
    };

    const handleMessageSent = (confirmationData) => {
      console.log(
        "✅ Message sent confirmation in HomeScreen:",
        confirmationData
      );
      // Mesaj gönderildiğinde unread count'u yenile (diğer chat'lerden gelen mesajlar için)
      refetchUnread();
    };

    const handleMessagesRead = (readData) => {
      console.log("👁️ Messages read in HomeScreen:", readData);
      // Mesajlar okunduğunda unread count'u yenile
      refetchUnread();
    };

    // ✅ SignalR event'lerini dinle
    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessageSent", handleMessageSent);
    connection.on("MessagesRead", handleMessagesRead);

    // ✅ Cleanup function
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
      // ✅ Refresh sırasında unread count'u da yenile
      await Promise.all([
        refetchUnread(),
        // Diğer refresh işlemlerin...
        new Promise((resolve) => setTimeout(resolve, 1500)), // Simulated delay
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

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView style={{ flex: 0, backgroundColor: "#fff" }} />
      <StatusBar style="dark" backgroundColor="#fff" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 0 }}
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
                style={{ fontSize: 30 }}
                className="text-gray-900 font-semibold"
              >
                kiraX
              </Text>
            </View>
            <View className="flex-row gap-6 items-center justify-center">
              <TouchableOpacity
                className="rounded-full justify-center items-center flex flex-col relative"
                onPress={handleMessagesPress}
              >
                <FontAwesomeIcon icon={faMessage} size={20} />
                {/* ✅ Real-time güncellenen unread count badge */}
                {totalUnreadCount === 0 ? null : (
                  <View className="bg-red-500 rounded-full w-7 h-6 absolute -top-3 -right-3 flex justify-center items-center">
                    <Text className="text-white font-semibold">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </Text>
                  </View>
                )}
                {/* ✅ Loading state için küçük indicator (opsiyonel) */}
                {unreadLoading && (
                  <View className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </TouchableOpacity>
            </View>
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
          </View>
        </View>

        {/* Main Content */}
        <View className="">
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
