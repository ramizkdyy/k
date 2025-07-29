// screens/MessagesScreen.js - Fixed Version
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faCircle,
  faWifi,
  faWifiSlash,
} from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";
import { faEdit } from "@fortawesome/pro-regular-svg-icons";
import {
  useGetChatPartnersQuery,
  useGetUnreadCountQuery,
} from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useSelector } from "react-redux";

const MessagesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSelector((state) => state.auth);
  const { isConnected, onlineUsers } = useSignalR();

  // API calls
  const {
    data: chatPartnersResponse,
    isLoading: partnersLoading,
    error: partnersError,
    refetch: refetchPartners,
  } = useGetChatPartnersQuery();

  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useGetUnreadCountQuery();

  // ✅ API response'dan doğru şekilde chat partners'ı al
  const chatPartners = React.useMemo(() => {
    console.log("Chat Partners Response:", chatPartnersResponse);

    // Eğer response direkt array ise
    if (Array.isArray(chatPartnersResponse)) {
      return chatPartnersResponse;
    }

    // Eğer response object içinde data varsa
    if (
      chatPartnersResponse?.data &&
      Array.isArray(chatPartnersResponse.data)
    ) {
      return chatPartnersResponse.data;
    }

    // Eğer response object içinde result varsa
    if (
      chatPartnersResponse?.result &&
      Array.isArray(chatPartnersResponse.result)
    ) {
      return chatPartnersResponse.result;
    }

    // Eğer response object içinde chatPartners varsa
    if (
      chatPartnersResponse?.chatPartners &&
      Array.isArray(chatPartnersResponse.chatPartners)
    ) {
      return chatPartnersResponse.chatPartners;
    }

    // Default empty array
    return [];
  }, [chatPartnersResponse]);

  // ✅ Unread count'u doğru şekilde al
  const totalUnreadCount = React.useMemo(() => {
    console.log("Unread Data Response:", unreadData);

    if (typeof unreadData === "number") {
      return unreadData;
    }

    if (unreadData?.count !== undefined) {
      return unreadData.count;
    }

    if (unreadData?.data?.count !== undefined) {
      return unreadData.data.count;
    }

    if (unreadData?.result?.count !== undefined) {
      return unreadData.result.count;
    }

    return 0;
  }, [unreadData]);

  // Refresh handler
  const onRefresh = () => {
    refetchPartners();
    refetchUnread();
  };

  // ✅ Partner listesini arama ile filtrele - güvenli string kontrolleri ile
  const filteredPartners = React.useMemo(() => {
    if (!Array.isArray(chatPartners)) {
      return [];
    }

    return chatPartners.filter((partner) => {
      // Partner string ise direkt kullan
      if (typeof partner === "string") {
        return partner.toLowerCase().includes(searchQuery.toLowerCase());
      }

      // Partner object ise içinden string alanları bul
      if (typeof partner === "object" && partner !== null) {
        const partnerName =
          partner.name ||
          partner.partnerId ||
          partner.userId ||
          partner.id ||
          "";
        return partnerName
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }

      return false;
    });
  }, [chatPartners, searchQuery]);

  // ✅ Partner ID'sini güvenli şekilde al
  const getPartnerId = (partner) => {
    if (typeof partner === "string") {
      return partner;
    }

    if (typeof partner === "object" && partner !== null) {
      return (
        partner.partnerId ||
        partner.userId ||
        partner.id ||
        partner.name ||
        "Unknown"
      );
    }

    return "Unknown";
  };

  // ✅ Partner name'ini güvenli şekilde al
  const getPartnerName = (partner) => {
    if (typeof partner === "string") {
      return partner;
    }

    if (typeof partner === "object" && partner !== null) {
      return (
        partner.name ||
        partner.displayName ||
        partner.partnerId ||
        partner.userId ||
        partner.id ||
        "Unknown User"
      );
    }

    return "Unknown User";
  };

  // Partner item renderer
  const renderPartner = ({ item: partner }) => {
    const partnerId = getPartnerId(partner);
    const partnerName = getPartnerName(partner);
    const isOnline = onlineUsers.has(partnerId);

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
        onPress={() => {
          navigation.navigate("ChatDetail", {
            partnerId: partnerId,
            partnerName: partnerName,
          });
        }}
      >
        {/* Avatar with online indicator */}
        <View className="relative mr-3">
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                partnerName
              )}&background=0ea5e9&color=fff&size=56`,
            }}
            className="w-14 h-14 rounded-full"
          />
          {/* Online status indicator */}
          <View
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </View>

        {/* Partner info */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold text-gray-900 flex-1">
              {partnerName}
            </Text>
            <View className="flex-row items-center">
              {isOnline && (
                <FontAwesomeIcon
                  icon={faCircle}
                  size={8}
                  color="#10b981"
                  style={{ marginRight: 4 }}
                />
              )}
              <Text className="text-xs text-gray-500">
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          <Text className="text-sm text-gray-600 mt-1">
            {partnerId !== partnerName
              ? `ID: ${partnerId}`
              : "Tap to start chatting"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (partnersLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-2 text-gray-600">Loading chats...</Text>
      </View>
    );
  }

  // Error state
  if (partnersError) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-4">
        <FontAwesomeIcon icon={faWifiSlash} size={40} color="#ef4444" />
        <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
          Connection Error
        </Text>
        <Text className="mt-2 text-gray-600 text-center">
          Unable to load your chats. Please check your connection.
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
          onPress={onRefresh}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView style={{ flex: 0, backgroundColor: "#fff" }} />
      <StatusBar style="dark" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-gray-900">Messages</Text>
            {/* Connection status */}
            <View className="flex-row items-center mt-1">
              <FontAwesomeIcon
                icon={isConnected ? faWifi : faWifiSlash}
                size={12}
                color={isConnected ? "#10b981" : "#ef4444"}
              />
              <Text
                className={`ml-1 text-xs ${
                  isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            {totalUnreadCount > 0 && (
              <View className="bg-red-500 rounded-full px-2 py-1 mr-2">
                <Text className="text-white text-xs font-bold">
                  {totalUnreadCount}
                </Text>
              </View>
            )}
            <TouchableOpacity className="p-2 -mr-2">
              <FontAwesomeIcon icon={faEdit} size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-full px-4 py-3 flex-row items-center">
          <FontAwesomeIcon icon={faSearch} size={16} color="#666" />
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Debug Info - Geliştirme aşamasında görmek için */}
      {__DEV__ && (
        <View className="bg-yellow-100 px-4 py-2">
          <Text className="text-xs text-yellow-800">
            Debug: Partners count: {chatPartners.length} | Type:{" "}
            {typeof chatPartnersResponse}
          </Text>
        </View>
      )}

      {/* Partners List */}
      <FlatList
        data={filteredPartners}
        renderItem={renderPartner}
        keyExtractor={(item, index) => {
          const partnerId = getPartnerId(item);
          return partnerId + index; // Unique key için index ekle
        }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={partnersLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            {searchQuery ? (
              <>
                <FontAwesomeIcon icon={faSearch} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  No conversations found for "{searchQuery}"
                </Text>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEdit} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  No conversations yet
                </Text>
                <Text className="text-gray-400 mt-2 text-sm text-center">
                  Start a new conversation to see it here
                </Text>
              </>
            )}
          </View>
        )}
      />

      {/* Quick Actions */}
      <View className="p-4 border-t border-gray-100">
        <TouchableOpacity
          className="bg-blue-500 rounded-lg py-3 flex-row items-center justify-center"
          onPress={() => {
            Alert.prompt(
              "Start New Chat",
              "Enter user ID to start a new conversation:",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Start Chat",
                  onPress: (userId) => {
                    if (userId && userId.trim()) {
                      navigation.navigate("ChatDetail", {
                        partnerId: userId.trim(),
                        partnerName: userId.trim(),
                      });
                    }
                  },
                },
              ],
              "plain-text"
            );
          }}
        >
          <FontAwesomeIcon icon={faEdit} size={16} color="#fff" />
          <Text className="text-white font-semibold ml-2">Start New Chat</Text>
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default MessagesScreen;
