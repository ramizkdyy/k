// screens/MessagesScreen.js - Fixed with Real-time Updates
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
    // ✅ Enable refetch when screen gains focus
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useGetUnreadCountQuery(undefined, {
    // ✅ Enable refetch when screen gains focus
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  // ✅ API response'dan chat partners'ı al (direkt array geliyor)
  const chatPartners = React.useMemo(() => {
    console.log("Chat Partners Response:", chatPartnersResponse);
    return Array.isArray(chatPartnersResponse) ? chatPartnersResponse : [];
  }, [chatPartnersResponse]);

  // ✅ Unread count'u al (response.count geliyor)
  const totalUnreadCount = React.useMemo(() => {
    console.log("Unread Data Response:", unreadData);
    return unreadData?.count || 0;
  }, [unreadData]);

  // ✅ Focus effect - Screen her görüldüğünde data'yı yenile
  useFocusEffect(
    useCallback(() => {
      console.log("📱 MessagesScreen focused, refreshing data...");
      refetchPartners();
      refetchUnread();
    }, [refetchPartners, refetchUnread])
  );

  // ✅ SignalR message listener for real-time updates
  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log("🔔 Setting up SignalR listeners for MessagesScreen");

    // Listen for new messages to update partners list
    const handleReceiveMessage = (messageData) => {
      console.log("📨 New message received in MessagesScreen:", messageData);

      // Refetch partners to show latest message
      refetchPartners();
      refetchUnread();
    };

    // Listen for message sent confirmations
    const handleMessageSent = (confirmationData) => {
      console.log(
        "✅ Message sent confirmation in MessagesScreen:",
        confirmationData
      );

      // Refetch partners to show sent message
      refetchPartners();
      refetchUnread();
    };

    // Listen for messages read status
    const handleMessagesRead = (readData) => {
      console.log("👁️ Messages read in MessagesScreen:", readData);

      // Refetch unread count
      refetchUnread();
    };

    // Register SignalR listeners
    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessageSent", handleMessageSent);
    connection.on("MessagesRead", handleMessagesRead);

    // Cleanup listeners
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

  // ✅ Partner listesini arama ile filtrele
  const filteredPartners = React.useMemo(() => {
    return chatPartners.filter((partner) => {
      const partnerName = partner.name || partner.userName || "";
      return partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chatPartners, searchQuery]);

  // ✅ Partner ID'sini al
  const getPartnerId = (partner) => {
    return partner.id;
  };

  // ✅ Partner name'ini al
  const getPartnerName = (partner) => {
    return partner.name || partner.userName || "Unknown User";
  };

  // ✅ Son mesajı al
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

  // ✅ Son mesaj zamanını formatla
  const formatMessageTime = (sentAt) => {
    if (!sentAt) return "";

    try {
      const messageDate = new Date(sentAt);
      const now = new Date();
      const diffInHours = (now - messageDate) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
        return diffInMinutes <= 1 ? "now" : `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h`;
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}d`;
      } else {
        return messageDate.toLocaleDateString();
      }
    } catch (error) {
      return "";
    }
  };

  // ✅ Mesajın okunmadığını kontrol et
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
          });
        }}
      >
        {/* Avatar with online indicator */}

        <View
          style={{ boxShadow: "0px 0px 12px #00000014", width: 60, height: 60 }}
          className=" rounded-full bg-white justify-center  items-center overflow-hidden"
        >
          {partner?.profileImageUrl &&
          partner?.profileImageUrl !== "default_profile_image_url" ? (
            <Image
              source={{ uri: partner.profileImageUrl }}
              className="w-full h-full"
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
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-green-500
              }`}
            />
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
                  style={{ fontSize: 15 }}
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
              style={{ fontSize: 14 }}
              className={` flex-1 mr-2 ${
                isUnread ? "text-gray-900 font-medium" : "text-gray-600"
              }`}
              numberOfLines={1}
            >
              {lastMessage || ""}
            </Text>
            {isUnread && <View className="w-3 h-3 bg-gray-900 rounded-full" />}
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

          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-gray-900">Mesajlar</Text>
            {/* ✅ Connection status indicator */}
            <View className="flex-row items-center mt-1">
              <FontAwesomeIcon
                icon={isConnected ? faWifi : faWifiSlash}
                size={12}
                color={isConnected ? "#10b981" : "#ef4444"}
              />
              <Text
                className={`text-xs ml-1 ${
                  isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {isConnected ? "Connected" : "Offline"}
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
        <View
          style={{ boxShadow: "0px 0px 12px #00000014" }}
          className=" rounded-full px-4 py-3 flex-row items-center"
        >
          <FontAwesomeIcon icon={faSearch} size={16} color="#000" />
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
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
        // ✅ Pull to refresh ekle
        onRefresh={onRefresh}
        refreshing={partnersLoading}
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
                      console.log("🚀 Starting new chat with:", userId.trim());
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
