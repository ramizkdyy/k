import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faPhone,
  faVideo,
  faPaperPlane,
  faCircleInfo,
} from "@fortawesome/pro-solid-svg-icons";
import { StatusBar } from "expo-status-bar";

const ChatDetailScreen = ({ navigation, route }) => {
  const { messageId, userName, userAvatar, propertyTitle } = route.params || {};
  const [message, setMessage] = useState("");
  const flatListRef = useRef();

  // Dummy chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      text: "Merhaba! Bu daire hakkında bilgi alabilir miyim?",
      isSent: false,
      timestamp: "10:30",
      isRead: true,
    },
    {
      id: "2",
      text: "Tabii ki! Hangi konularda bilgi almak istiyorsunuz?",
      isSent: true,
      timestamp: "10:32",
      isRead: true,
    },
    {
      id: "3",
      text: "Özellikle kira bedeli ve ek masraflar hakkında bilgi alabilir miyim?",
      isSent: false,
      timestamp: "10:35",
      isRead: true,
    },
    {
      id: "4",
      text: "Kira bedeli aylık 15.000 TL. Ek olarak aidat 800 TL, internet ve doğalgaz kiracı tarafından ödenecek.",
      isSent: true,
      timestamp: "10:37",
      isRead: true,
    },
    {
      id: "5",
      text: "Anladım. Daire ne zaman müsait olacak?",
      isSent: false,
      timestamp: "10:40",
      isRead: true,
    },
    {
      id: "6",
      text: "15 Ağustos'tan itibaren müsait. İsterseniz bu hafta sonu görüşebiliriz.",
      isSent: true,
      timestamp: "10:42",
      isRead: false,
    },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isSent: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isRead: false,
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessage("");

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isLastMessage = index === chatMessages.length - 1;

    return (
      <View
        className={`flex-row mb-2 ${
          item.isSent ? "justify-end" : "justify-start"
        }`}
      >
        <View
          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
            item.isSent
              ? "bg-blue-500 rounded-br-md"
              : "bg-gray-200 rounded-bl-md"
          }`}
        >
          <Text
            className={`text-base ${
              item.isSent ? "text-white" : "text-gray-900"
            }`}
          >
            {item.text}
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text
              className={`text-xs ${
                item.isSent ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {item.timestamp}
            </Text>
            {item.isSent && isLastMessage && (
              <View className="ml-2">
                <View
                  className={`w-3 h-3 rounded-full ${
                    item.isRead ? "bg-blue-100" : "bg-blue-300"
                  }`}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={{ flex: 0, backgroundColor: "#fff" }} />
      <StatusBar style="dark" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2 mr-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center flex-1">
            <Image
              source={{
                uri:
                  userAvatar ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
              }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {userName || "Kullanıcı"}
              </Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {propertyTitle || "Özellik başlığı"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="p-2">
            <FontAwesomeIcon icon={faPhone} size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <FontAwesomeIcon icon={faVideo} size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <FontAwesomeIcon icon={faCircleInfo} size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Input Area */}
      <View className="bg-white px-4 py-3 border-t border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <TextInput
            className="flex-1 text-base py-2"
            placeholder="Mesaj yazın..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={sendMessage}
            className={`ml-2 w-8 h-8 rounded-full items-center justify-center ${
              message.trim() ? "bg-blue-500" : "bg-gray-300"
            }`}
            disabled={!message.trim()}
          >
            <FontAwesomeIcon
              icon={faPaperPlane}
              size={14}
              color={message.trim() ? "#fff" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }} />
    </KeyboardAvoidingView>
  );
};

export default ChatDetailScreen;
