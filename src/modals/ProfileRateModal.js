// src/modals/ProfileRateModal.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    Platform,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Dimensions,
    StyleSheet,
    Alert,
    Keyboard,
    ScrollView,
} from "react-native";
import { X, Star } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

// Custom TextInput Component (OfferModal'dan kopyalandı)
const CustomTextInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    required = false,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
    maxLength,
}) => (
    <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-900 mb-3">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <View className="border border-gray-900 rounded-xl px-4 py-4">
            <TextInput
                className="text-gray-900 text-base"
                placeholder={placeholder}
                placeholderTextColor="#b0b0b0"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={numberOfLines}
                maxLength={maxLength}
                style={{ fontSize: 16 }}
                textAlignVertical={multiline ? "top" : "center"}
                blurOnSubmit={!multiline}
                returnKeyType={multiline ? "default" : "done"}
            />
        </View>
    </View>
);

// Star Rating Component
const StarRating = ({ rating, onRatingChange, size = 40 }) => {
    const [tempRating, setTempRating] = useState(0);

    return (
        <View className="flex-row justify-center items-center space-x-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (tempRating || rating) >= star;
                return (
                    <TouchableOpacity
                        key={star}
                        onPress={() => onRatingChange(star)}
                        onPressIn={() => setTempRating(star)}
                        onPressOut={() => setTempRating(0)}
                        className="p-2"
                        activeOpacity={0.7}
                    >
                        <Star
                            size={size}
                            color={isActive ? "#fbbf24" : "#d1d5db"}
                            fill={isActive ? "#fbbf24" : "none"}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// Main ProfileRateModal Component
const ProfileRateModal = ({
    visible,
    onClose,
    onSubmit,
    isLoading = false,
    profileData = {},
}) => {
    const insets = useSafeAreaInsets();
    const [selectedRating, setSelectedRating] = useState(0);
    const [ratingMessage, setRatingMessage] = useState("");

    // Modal animation values (OfferModal'dan kopyalandı)
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // Klavye animasyonu için değer
    const keyboardHeight = useSharedValue(0);

    // Klavye listeners (OfferModal'dan kopyalandı)
    useEffect(() => {
        const showListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                console.log('🎹 Klavye açılıyor, yükseklik:', e.endCoordinates.height);
                keyboardHeight.value = withSpring(e.endCoordinates.height, {
                    damping: 80,
                    stiffness: 300,
                });
            }
        );

        const hideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                console.log('🎹 Klavye kapanıyor');
                keyboardHeight.value = withSpring(0, {
                    damping: 80,
                    stiffness: 300,
                });
            }
        );

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    // Modal açılma/kapanma animasyonları
    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, {
                damping: 85,
                stiffness: 300,
                mass: 0.8,
            });
            backdropOpacity.value = withTiming(0.5, { duration: 300 });
        } else if (visible === false && translateY.value !== SCREEN_HEIGHT) {
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 85,
                stiffness: 300,
                mass: 0.8,
            });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

    // Modal kapandığında state'i temizle
    useEffect(() => {
        if (!visible) {
            setSelectedRating(0);
            setRatingMessage("");
        }
    }, [visible]);

    const handleSubmit = () => {
        if (selectedRating === 0) {
            Alert.alert("Hata", "Lütfen bir puan seçiniz.");
            return;
        }

        onSubmit({
            rating: selectedRating,
            message: ratingMessage.trim() || null,
        });
    };

    const handleClose = () => {
        Keyboard.dismiss();
        translateY.value = withSpring(SCREEN_HEIGHT, {
            damping: 85,
            stiffness: 300,
            mass: 0.8,
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        setTimeout(() => onClose(), 300);
    };

    const handleBackdropPress = () => {
        Keyboard.dismiss();
        handleClose();
    };

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    // Modal style - klavye yüksekliğini hesaba katıyor
    const modalStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: translateY.value - keyboardHeight.value
        }],
    }));

    // Rating text'ini al
    const getRatingText = (rating) => {
        const texts = {
            1: "Çok Kötü",
            2: "Kötü",
            3: "Orta",
            4: "İyi",
            5: "Mükemmel"
        };
        return texts[rating] || "";
    };

    const profileName = profileData?.user?.name || "Kullanıcı";
    const profileSurname = profileData?.user?.surname || "";

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <View className="flex-1">
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                    <Animated.View style={[styles.backdrop, backdropStyle]} />
                </TouchableWithoutFeedback>

                {/* Modal Content */}
                <Animated.View style={[styles.rateModal, modalStyle]}>
                    {/* Handle */}
                    <View className="items-center py-3">
                        <View className="w-12 h-1 bg-gray-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100">
                        <View className="w-5" />
                        <Text className="text-xl font-bold text-gray-800">
                            Profili Değerlendir
                        </Text>
                        <TouchableOpacity onPress={handleClose} className="p-1">
                            <X size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="px-6 py-6 flex-1">
                            {/* Profile Info */}
                            <View className="items-center mb-6">
                                <Text className="text-lg font-semibold text-gray-800 text-center">
                                    {profileName} {profileSurname}
                                </Text>
                                <Text className="text-sm text-gray-500 text-center mt-1">
                                    Bu profili nasıl değerlendiriyorsunuz?
                                </Text>
                            </View>

                            {/* Star Rating */}
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-gray-900 mb-3 text-center">
                                    Puanınız <Text className="text-red-500">*</Text>
                                </Text>

                                <StarRating
                                    rating={selectedRating}
                                    onRatingChange={setSelectedRating}
                                    size={36}
                                />

                                {selectedRating > 0 && (
                                    <Text className="text-center text-lg font-medium text-gray-700 mt-2">
                                        {getRatingText(selectedRating)}
                                    </Text>
                                )}
                            </View>

                            {/* Message Input */}
                            <CustomTextInput
                                label="Yorumunuz"
                                value={ratingMessage}
                                onChangeText={setRatingMessage}
                                placeholder="Bu profil hakkında yorumunuzu yazın (opsiyonel)"
                                multiline={true}
                                numberOfLines={4}
                                maxLength={500}
                            />

                            {/* Character Count */}
                            <Text className="text-xs text-gray-400 text-right -mt-4 mb-6">
                                {ratingMessage.length}/500
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Bottom Section */}
                    <View
                        className="px-6 py-4 border-t border-gray-100 bg-white"
                        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                    >
                        <TouchableOpacity
                            className={`py-4 rounded-xl items-center ${isLoading || selectedRating === 0
                                    ? "bg-gray-300"
                                    : "bg-gray-900"
                                }`}
                            onPress={handleSubmit}
                            disabled={isLoading || selectedRating === 0}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-semibold text-center text-lg">
                                    Değerlendirmeyi Gönder
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

// Styles (OfferModal'dan uyarlandı)
const styles = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    rateModal: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT * 0.75, // Biraz daha yüksek - rating için daha fazla alan
        backgroundColor: "#ffffff",
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
    },
});

export default ProfileRateModal;