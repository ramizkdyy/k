// screens/MessagesScreen.js - Fixed with Real-time Updates and Working Filters
import React, { useState, useEffect, useCallback } from "react";
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
import { selectCurrentUser } from "../redux/slices/authSlice";
import { useFocusEffect } from "@react-navigation/native";

const MessagesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  // ✅ Filter state'i ekledik
  const [activeFilter, setActiveFilter] = useState("all"); // "all" veya "unread"

  const { user } = useSelector((state) => state.auth);
  const { isConnected, onlineUsers, connection } = useSignalR();
  const currentUser = useSelector(selectCurrentUser);

  // API calls
  const {
    data: chatPartnersResponse,
    isLoading: partnersLoading,
    error: partnersError,
    refetch: refetchPartners,
  } = useGetChatPartnersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useGetUnreadCountQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  // API response'dan chat partners'ı al
  const chatPartners = React.useMemo(() => {
    console.log("Chat Partners Response:", chatPartnersResponse);
    return Array.isArray(chatPartnersResponse) ? chatPartnersResponse : [];
  }, [chatPartnersResponse]);

  // Unread count'u al
  const totalUnreadCount = React.useMemo(() => {
    console.log("Unread Data Response:", unreadData);
    return unreadData?.count || 0;
  }, [unreadData]);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      console.log("📱 MessagesScreen focused, refreshing data...");
      refetchPartners();
      refetchUnread();
    }, [refetchPartners, refetchUnread])
  );

  // SignalR message listener
  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log("🔔 Setting up SignalR listeners for MessagesScreen");

    const handleReceiveMessage = (messageData) => {
      console.log("📨 New message received in MessagesScreen:", messageData);
      refetchPartners();
      refetchUnread();
    };

    const handleMessageSent = (confirmationData) => {
      console.log(
        "✅ Message sent confirmation in MessagesScreen:",
        confirmationData
      );
      refetchPartners();
      refetchUnread();
    };

    const handleMessagesRead = (readData) => {
      console.log("👁️ Messages read in MessagesScreen:", readData);
      refetchUnread();
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessageSent", handleMessageSent);
    connection.on("MessagesRead", handleMessagesRead);

    return () => {
      console.log("🧹 Cleaning up SignalR listeners for MessagesScreen");
      connection.off("ReceiveMessage", handleReceiveMessage);
      connection.off("MessageSent", handleMessageSent);
      connection.off("MessagesRead", handleMessagesRead);
    };
  }, [connection, isConnected, refetchPartners, refetchUnread]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    console.log("🔄 Manual refresh requested");
    refetchPartners();
    refetchUnread();
  }, [refetchPartners, refetchUnread]);

  // Helper functions
  const getPartnerId = (partner) => {
    return partner.id;
  };

  const getPartnerName = (partner) => {
    return partner.name || partner.userName || "Unknown User";
  };

  const getLastMessage = (partner) => {
    if (
      typeof partner === "object" &&
      partner !== null &&
      partner.lastMessage
    ) {
      return partner.lastMessage.content || "";
    }
    return "";
  };

  const formatMessageTime = (sentAt) => {
    if (!sentAt) return "";

    try {
      const messageDate = new Date(sentAt);
      const now = new Date();
      const diffInHours = (now - messageDate) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
        return diffInMinutes <= 1 ? "az önce" : `${diffInMinutes}dk`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}s`;
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}g`;
      } else {
        return messageDate.toLocaleDateString();
      }
    } catch (error) {
      return "";
    }
  };

  const isMessageUnread = (partner) => {
    if (
      typeof partner === "object" &&
      partner !== null &&
      partner.lastMessage
    ) {
      return !partner.lastMessage.isRead && !partner.lastMessage.isFromMe;
    }
    return false;
  };

  // ✅ Filter ve arama ile birleştirilmiş filtreleme
  const filteredPartners = React.useMemo(() => {
    let filtered = chatPartners;

    // Önce arama filtresini uygula
    if (searchQuery.trim()) {
      filtered = filtered.filter((partner) => {
        const partnerName = partner.name || partner.userName || "";
        const surname = partner.surname || "";
        const fullName = `${partnerName} ${surname}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
    }

    // Sonra unread filtresini uygula
    if (activeFilter === "unread") {
      filtered = filtered.filter((partner) => isMessageUnread(partner));
    }

    return filtered;
  }, [chatPartners, searchQuery, activeFilter]);

  // ✅ Filter button component'i
  const FilterButton = ({ filter, title, count, isActive, onPress }) => (
    <TouchableOpacity
      className={`py-2 px-4 rounded-full ${
        isActive ? "bg-black" : "border border-gray-200 bg-white"
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        className={` ${isActive ? "text-white font-medium" : "text-gray-500"}`}
      >
        {title} {count !== undefined ? `(${count})` : ""}
      </Text>
    </TouchableOpacity>
  );

  // Partner item renderer
  const renderPartner = ({ item: partner }) => {
    const partnerId = getPartnerId(partner);
    const partnerName = getPartnerName(partner);
    const lastMessage = getLastMessage(partner);
    const isOnline = onlineUsers.has(partnerId);
    const messageTime = partner.lastMessage
      ? formatMessageTime(partner.lastMessage.sentAt)
      : "";
    const isUnread = isMessageUnread(partner);

    return (
      <TouchableOpacity
        className="flex flex-row items-center justify-center py-2 px-4 bg-white gap-4"
        onPress={() => {
          console.log("🚀 Navigating to chat with:", partnerId, partnerName);
          navigation.navigate("ChatDetail", {
            partnerId: partnerId,
            partnerName: partnerName,
            partner: partner,
          });
        }}
      >
        {/* Avatar with online indicator */}
        <View
          style={{ width: 55, height: 55 }}
          className="justify-center  items-center rounded-full border border-gray-100"
        >
          {partner?.profileImageUrl &&
          partner?.profileImageUrl !== "default_profile_image_url" ? (
            <Image
              source={{ uri: partner.profileImageUrl }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 30 }} className="text-gray-900 font-bold">
              {partner?.name?.charAt(0) || "P"}
            </Text>
          )}

          {/* Online status indicator */}
          {isOnline && (
            <View
              style={{ width: 20, height: 20, bottom: -4, right: -4 }}
              className={`absolute flex justify-center items-center rounded-full bg-white`}
            >
              {" "}
              <View
                style={{ width: 12, height: 12 }}
                className={`flex justify-center items-center  rounded-full bg-green-500`}
              />
            </View>
          )}
        </View>

        {/* Partner info */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text
              style={{ fontSize: 15 }}
              className={` text-gray-900 flex-1 mb-1 ${
                isUnread ? "font-bold" : " font-medium"
              }`}
            >
              {partner?.name} {partner.surname}
            </Text>
            <View className="flex-row items-center">
              {messageTime && (
                <Text
                  style={{ fontSize: 14 }}
                  className={` ${
                    isUnread
                      ? "text-gray-900 font-bold"
                      : "text-gray-500 font-normal"
                  }`}
                >
                  {messageTime}
                </Text>
              )}
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              style={{ fontSize: 15 }}
              className={` flex-1 mr-2 ${
                isUnread ? "text-gray-900 font-bold" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {lastMessage || ""}
            </Text>
            {isUnread && (
              <View
                style={{ backgroundColor: "#ff4a4a" }}
                className="w-3 h-3 rounded-full"
              />
            )}
          </View>
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
      <View className="bg-white px-4 py-3">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
          </TouchableOpacity>

          <View className="flex-1 items-start">
            <Text className="text-3xl ml-1 font-semibold text-gray-900">
              Mesajlar
            </Text>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              className="flex-row items-center justify-center"
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
                          console.log("🚀 Starting chat with user ID:", userId);
                          navigation.navigate("ChatDetail", {
                            partnerId: userId.trim(),
                            partnerName: `User ${userId.trim()}`,
                            partner: { id: userId.trim(), name: `User ${userId.trim()}` },
                          });
                        } else {
                          Alert.alert("Error", "Please enter a valid user ID");
                        }
                      },
                    },
                  ],
                  "plain-text"
                );
              }}
            >
              <FontAwesomeIcon icon={faEdit} size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{ boxShadow: "0px 0px 12px #00000014" }}
          className=" rounded-full px-4 py-3 flex-row items-center"
        >
          <FontAwesomeIcon icon={faSearch} size={16} color="#000" />
          <TextInput
            style={{ fontSize: 15 }}
            className="flex-1 ml-3 "
            placeholder="Sohbet ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* ✅ Filter Buttons - Çalışır halde */}
        <View className="w-full flex-row gap-2 items-center justify-start mt-4">
          <FilterButton
            filter="all"
            title="Tümü"
            isActive={activeFilter === "all"}
            onPress={() => setActiveFilter("all")}
          />
          <FilterButton
            filter="unread"
            title="Okunmamış"
            count={totalUnreadCount}
            isActive={activeFilter === "unread"}
            onPress={() => setActiveFilter("unread")}
          />
        </View>
      </View>

      {/* Partners List */}
      <FlatList
        data={filteredPartners}
        renderItem={renderPartner}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={partnersLoading}
            onRefresh={onRefresh}
            colors={["#0ea5e9"]}
            tintColor="#0ea5e9"
          />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            {activeFilter === "unread" && !searchQuery ? (
              <>
                <FontAwesomeIcon icon={faCircle} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  Okunmamış mesaj yok
                </Text>
                <Text className="text-gray-400 mt-2 text-sm text-center">
                  Tüm mesajlarınızı okudunuz
                </Text>
              </>
            ) : searchQuery ? (
              <>
                <FontAwesomeIcon icon={faSearch} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  "{searchQuery}" için sonuç bulunamadı
                </Text>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEdit} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  Henüz sohbet yok
                </Text>
                <Text className="text-gray-400 mt-2 text-sm text-center">
                  Yeni bir sohbet başlatın
                </Text>
              </>
            )}
          </View>
        )}
        onRefresh={onRefresh}
        refreshing={partnersLoading}
      />

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default MessagesScreen;
