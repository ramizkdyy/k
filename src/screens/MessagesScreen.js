import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  FlatList,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faEdit,
  faCircle,
} from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";

const MessagesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy data for messages
  const dummyMessages = [
    {
      id: "1",
      name: "Ahmet Yılmaz",
      lastMessage: "Ev hakkında bir sorum var, müsait misiniz?",
      time: "2 dk",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      unreadCount: 3,
      isOnline: true,
      propertyTitle: "Beşiktaş'ta 2+1 Daire",
    },
    {
      id: "2",
      name: "Zeynep Kaya",
      lastMessage: "Teşekkürler, yarın görüşürüz.",
      time: "15 dk",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
      unreadCount: 0,
      isOnline: true,
      propertyTitle: "Kadıköy'de 3+1 Ev",
    },
    {
      id: "3",
      name: "Mehmet Öztürk",
      lastMessage: "Fiyat konusunda anlaşabilir miyiz?",
      time: "1 sa",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      unreadCount: 1,
      isOnline: false,
      propertyTitle: "Şişli'de Studio Daire",
    },
    {
      id: "4",
      name: "Ayşe Demir",
      lastMessage: "Evi çok beğendim, ne zaman görüşebiliriz?",
      time: "2 sa",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      unreadCount: 0,
      isOnline: false,
      propertyTitle: "Beyoğlu'nda 1+1 Loft",
    },
    {
      id: "5",
      name: "Can Arslan",
      lastMessage: "Merhaba, daire hala müsait mi?",
      time: "3 sa",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      unreadCount: 2,
      isOnline: true,
      propertyTitle: "Etiler'de 4+1 Villa",
    },
    {
      id: "6",
      name: "Elif Şahin",
      lastMessage: "Belgeler hazır, imzalayabiliriz.",
      time: "5 sa",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      unreadCount: 0,
      isOnline: false,
      propertyTitle: "Nişantaşı'nda 2+1 Daire",
    },
    {
      id: "7",
      name: "Oğuz Kılıç",
      lastMessage: "Kirayı ne zaman ödeyebilirim?",
      time: "1 gün",
      avatar:
        "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150",
      unreadCount: 0,
      isOnline: false,
      propertyTitle: "Ataköy'de 3+1 Daire",
    },
    {
      id: "8",
      name: "Selin Yurt",
      lastMessage: "Ev çok güzel, teşekkür ederim.",
      time: "2 gün",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      unreadCount: 1,
      isOnline: true,
      propertyTitle: "Bebek'te Deniz Manzaralı",
    },
  ];

  // Filter messages based on search query
  const filteredMessages = dummyMessages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 bg-white"
      onPress={() => {
        // Navigate to individual chat screen
        navigation.navigate("ChatDetail", {
          messageId: item.id,
          userName: item.name,
          userAvatar: item.avatar,
          propertyTitle: item.propertyTitle,
        });
      }}
    >
      {/* Avatar with online indicator */}
      <View className="relative mr-3">
        <Image
          source={{ uri: item.avatar }}
          className="w-14 h-14 rounded-full"
        />
        {item.isOnline && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      {/* Message content */}
      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold text-gray-900 flex-1">
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: item.unreadCount > 0 ? "#54ff65" : "#8c8c8c",
            }}
            className="ml-2"
          >
            {item.time}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text
            className={`text-sm flex-1 ${
              item.unreadCount > 0
                ? "text-gray-900 font-medium"
                : "text-gray-600"
            }`}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
            <View className="bg-green-300 rounded-full w-6 h-6 justify-center items-center ml-2">
              <Text
                style={{ fontSize: 13 }}
                className="text-white font-semibold"
              >
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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

          <Text className="text-xl font-bold text-gray-900">Mesajlar</Text>

          <TouchableOpacity className="p-2 -mr-2">
            <FontAwesomeIcon icon={faEdit} size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center">
          <FontAwesomeIcon icon={faSearch} size={16} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Mesajlarda ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-gray-100 ml-16" />
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            <FontAwesomeIcon icon={faSearch} size={40} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-base">
              {searchQuery ? "Mesaj bulunamadı" : "Henüz mesajınız yok"}
            </Text>
          </View>
        )}
      />

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </View>
  );
};

export default MessagesScreen;
