// screens/MessagesScreen.js - Global SignalR handler'lar ile güncellenmiş
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
  useLazySearchChatPartnersQuery,
  chatApiHelpers,
} from "../redux/api/chatApiSlice";
import { useSignalR } from "../contexts/SignalRContext";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { useFocusEffect } from "@react-navigation/native";

const MessagesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" veya "unread"
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const { user } = useSelector((state) => state.auth);
  const { isConnected, onlineUsers, connection } = useSignalR();
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  // ✅ API calls with better error handling
  const {
    data: chatPartnersResponse,
    isLoading: partnersLoading,
    error: partnersError,
    refetch: refetchPartners,
  } = useGetChatPartnersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
    onError: (error) => {
      console.error("❌ Chat partners fetch error:", error);
    },
  });

  const {
    data: unreadData,
    isLoading: unreadLoading,
    error: unreadError,
    refetch: refetchUnread,
  } = useGetUnreadCountQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
    onError: (error) => {
      console.error("❌ Unread count fetch error:", error);
    },
  });

  // ✅ Search functionality
  const [
    triggerSearch,
    { data: searchResponse, isLoading: isSearchLoading, error: searchError },
  ] = useLazySearchChatPartnersQuery();

  // ✅ API response handling with backend format compatibility
  const chatPartners = React.useMemo(() => {
    console.log("🔍 Chat Partners Response Processing:", chatPartnersResponse);

    if (Array.isArray(chatPartnersResponse)) {
      console.log(
        `✅ Partners array format - ${chatPartnersResponse.length} partners`
      );
      return chatPartnersResponse;
    }

    if (
      chatPartnersResponse?.result &&
      Array.isArray(chatPartnersResponse.result)
    ) {
      return chatPartnersResponse.result;
    }

    if (
      chatPartnersResponse?.data &&
      Array.isArray(chatPartnersResponse.data)
    ) {
      return chatPartnersResponse.data;
    }

    console.log("⚠️ Unknown chat partners format, returning empty array");
    return [];
  }, [chatPartnersResponse]);

  // ✅ Unread count handling with backend format compatibility
  const totalUnreadCount = React.useMemo(() => {
    console.log("🔍 Unread Data Response Processing:", unreadData);

    if (typeof unreadData === "number") {
      return unreadData;
    }

    if (unreadData?.count !== undefined) {
      return Number(unreadData.count);
    }

    if (unreadData?.result?.count !== undefined) {
      return Number(unreadData.result.count);
    }

    if (unreadData?.data?.count !== undefined) {
      return Number(unreadData.data.count);
    }

    if (typeof unreadData === "object" && unreadData !== null) {
      const numericValue = Object.values(unreadData).find(
        (val) => typeof val === "number"
      );
      if (numericValue !== undefined) {
        return numericValue;
      }
    }

    console.log("⚠️ Unknown unread count format, defaulting to 0");
    return 0;
  }, [unreadData]);

  // ✅ Search handling
  const handleSearch = useCallback(
    async (query) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const result = await triggerSearch({
          query: query.trim(),
          limit: 20,
        }).unwrap();

        console.log("🔍 Search result:", result);

        if (result?.results && Array.isArray(result.results)) {
          setSearchResults(result.results);
        } else if (Array.isArray(result)) {
          setSearchResults(result);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("❌ Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [triggerSearch]
  );

  // ✅ Search debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // Focus effect - Sadece refetch yapıyoruz, SignalR listener'lar global olarak yönetiliyor
  useFocusEffect(
    useCallback(() => {
      console.log("📱 MessagesScreen focused, refreshing data...");
      refetchPartners();
      refetchUnread();
    }, [refetchPartners, refetchUnread])
  );

  // ✅ REMOVED: SignalR message listeners - Artık global olarak yönetiliyorlar
  // Global SignalR handler'lar SignalRContext'te aktif olduğu için burada listener'lara gerek yok

  // ✅ Refresh handler with better error handling
  const onRefresh = useCallback(() => {
    console.log("🔄 Manual refresh requested");

    Promise.all([refetchPartners(), refetchUnread()])
      .then(() => {
        console.log("✅ Manual refresh completed successfully");
      })
      .catch((error) => {
        console.error("❌ Manual refresh failed:", error);
        Alert.alert(
          "Refresh Failed",
          "Unable to refresh chat data. Please check your connection and try again.",
          [
            { text: "OK", style: "default" },
            { text: "Retry", onPress: onRefresh, style: "default" },
          ]
        );
      });
  }, [refetchPartners, refetchUnread]);

  // ✅ Helper functions with backend field names compatibility
  const getPartnerId = (partner) => {
    return partner.id || partner.Id;
  };

  const getPartnerName = (partner) => {
    const firstName = partner.name || partner.Name || "";
    const lastName = partner.surname || partner.Surname || "";
    const username = partner.userName || partner.UserName || "";

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (username) {
      return username;
    }

    return "Unknown User";
  };

  const getLastMessage = (partner) => {
    const lastMessage = partner.lastMessage || partner.LastMessage;

    if (typeof lastMessage === "object" && lastMessage !== null) {
      return lastMessage.content || lastMessage.Content || "";
    }

    return "";
  };

  const getLastMessageTime = (partner) => {
    const lastMessage = partner.lastMessage || partner.LastMessage;

    if (typeof lastMessage === "object" && lastMessage !== null) {
      return lastMessage.sentAt || lastMessage.SentAt;
    }

    return null;
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
        return messageDate.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
        });
      }
    } catch (error) {
      console.error("❌ Date formatting error:", error);
      return "";
    }
  };

  const isMessageUnread = (partner) => {
    const lastMessage = partner.lastMessage || partner.LastMessage;

    if (typeof lastMessage === "object" && lastMessage !== null) {
      const isRead = lastMessage.isRead || lastMessage.IsRead;
      const isFromMe = lastMessage.isFromMe || lastMessage.IsFromMe;
      const senderId = lastMessage.senderUserId || lastMessage.SenderUserId;

      return !isRead && !isFromMe && senderId !== user?.id;
    }

    return false;
  };

  const getProfileImage = (partner) => {
    return partner.profileImageUrl || partner.ProfileImageUrl;
  };

  // ✅ Filter ve arama ile birleştirilmiş filtreleme
  const filteredPartners = React.useMemo(() => {
    let filtered = [];

    if (searchQuery.trim() && searchResults.length > 0) {
      filtered = searchResults;
      console.log(`🔍 Using search results: ${filtered.length} partners`);
    } else if (searchQuery.trim() && !isSearching) {
      filtered = [];
      console.log("🔍 Search completed but no results");
    } else {
      filtered = chatPartners;
      console.log(`📝 Using normal partners: ${filtered.length} partners`);
    }

    if (activeFilter === "unread") {
      filtered = filtered.filter((partner) => isMessageUnread(partner));
      console.log(`🔍 After unread filter: ${filtered.length} partners`);
    }

    return filtered;
  }, [
    chatPartners,
    searchQuery,
    searchResults,
    isSearching,
    activeFilter,
    user?.id,
  ]);

  // ✅ Filter button component
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

  // ✅ Partner item renderer with backend field names compatibility
  const renderPartner = ({ item: partner }) => {
    const partnerId = getPartnerId(partner);
    const partnerName = getPartnerName(partner);
    const lastMessage = getLastMessage(partner);
    const lastMessageTime = getLastMessageTime(partner);
    const isOnline = onlineUsers.has(partnerId);
    const messageTime = formatMessageTime(lastMessageTime);
    const isUnread = isMessageUnread(partner);
    const profileImage = getProfileImage(partner);

    return (
      <TouchableOpacity
        className="flex flex-row items-center justify-center py-2 px-4 bg-white gap-4"
        onPress={() => {
          console.log("🚀 Navigating to chat with:", {
            partnerId,
            partnerName,
            partner: {
              ...partner,
              id: partnerId,
              name: partner.name || partner.Name,
              surname: partner.surname || partner.Surname,
              userName: partner.userName || partner.UserName,
              profileImageUrl: profileImage,
            },
          });

          navigation.navigate("ChatDetail", {
            partnerId: partnerId,
            partnerName: partnerName,
            partner: {
              ...partner,
              id: partnerId,
              name: partner.name || partner.Name,
              surname: partner.surname || partner.Surname,
              userName: partner.userName || partner.UserName,
              profileImageUrl: profileImage,
            },
          });
        }}
      >
        {/* Avatar with online indicator */}
        <View
          style={{ width: 55, height: 55 }}
          className="justify-center items-center rounded-full border border-gray-100"
        >
          {profileImage && profileImage !== "default_profile_image_url" ? (
            <Image
              source={{ uri: profileImage }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
              onError={(error) => {
                console.log("❌ Profile image load error:", error);
              }}
            />
          ) : (
            <Text style={{ fontSize: 30 }} className="text-gray-900 font-bold">
              {partnerName?.charAt(0)?.toUpperCase() || "P"}
            </Text>
          )}

          {isOnline && (
            <View
              style={{ width: 20, height: 20, bottom: -4, right: -4 }}
              className={`absolute flex justify-center items-center rounded-full bg-white`}
            >
              <View
                style={{ width: 12, height: 12 }}
                className={`flex justify-center items-center rounded-full bg-green-500`}
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
              numberOfLines={1}
            >
              {partnerName}
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
  if (partnersLoading && !chatPartners.length) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-2 text-gray-600">Loading chats...</Text>
        {!isConnected && (
          <Text className="mt-1 text-red-500 text-sm">
            ⚠️ Connection issues detected
          </Text>
        )}
      </View>
    );
  }

  // Error state
  if (partnersError && !chatPartners.length) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-4">
        <FontAwesomeIcon icon={faWifiSlash} size={40} color="#ef4444" />
        <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
          Connection Error
        </Text>
        <Text className="mt-2 text-gray-600 text-center">
          Unable to load your chats. Please check your connection.
        </Text>
        {!isConnected && (
          <Text className="mt-2 text-red-500 text-center text-sm">
            SignalR connection is offline
          </Text>
        )}
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
            {!isConnected && (
              <Text className="text-red-500 text-sm ml-1">⚠️ Offline mode</Text>
            )}
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
                            partner: {
                              id: userId.trim(),
                              name: `User ${userId.trim()}`,
                              surname: "",
                              userName: userId.trim(),
                            },
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
            className="flex-1 ml-3"
            placeholder="Sohbet ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#0ea5e9" className="ml-2" />
          )}
        </View>

        {/* Filter Buttons */}
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

          {searchQuery.trim() && (
            <Text className="text-gray-500 text-sm ml-2">
              {isSearching
                ? "Searching..."
                : `${filteredPartners.length} result${
                    filteredPartners.length !== 1 ? "s" : ""
                  }`}
            </Text>
          )}
        </View>
      </View>

      {/* Partners List */}
      <FlatList
        data={filteredPartners}
        renderItem={renderPartner}
        keyExtractor={(item) =>
          getPartnerId(item)?.toString() || Math.random().toString()
        }
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={partnersLoading || unreadLoading}
            onRefresh={onRefresh}
            colors={["#0ea5e9"]}
            tintColor="#0ea5e9"
          />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            {isSearching ? (
              <>
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  Searching...
                </Text>
              </>
            ) : searchQuery.trim() ? (
              <>
                <FontAwesomeIcon icon={faSearch} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  "{searchQuery}" için sonuç bulunamadı
                </Text>
                <Text className="text-gray-400 mt-2 text-sm text-center">
                  Farklı bir arama terimi deneyin
                </Text>
              </>
            ) : activeFilter === "unread" ? (
              <>
                <FontAwesomeIcon icon={faCircle} size={40} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-base text-center">
                  Okunmamış mesaj yok
                </Text>
                <Text className="text-gray-400 mt-2 text-sm text-center">
                  Tüm mesajlarınızı okudunuz
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default MessagesScreen;
