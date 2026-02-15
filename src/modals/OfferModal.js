import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Dimensions,
    FlatList,
    StyleSheet,
    Alert,
    Keyboard,
    ScrollView,
} from "react-native";
import { ChevronDown, ChevronLeft, X } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

// Currency options similar to ProfileExpectation dropdown options
const currencyOptions = [
    { label: "Türk Lirası (₺)", value: 1, symbol: "₺" },  // ✅ Sayısal value
    { label: "Amerikan Doları ($)", value: 2, symbol: "$" },
    { label: "Euro (€)", value: 3, symbol: "€" },
    { label: "İngiliz Sterlini (£)", value: 4, symbol: "£" },
];

// Custom Dropdown Component (same as ProfileExpectation)
const CustomDropdown = ({
    label,
    value,
    setValue,
    options,
    placeholder,
    required = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const getModalHeight = () => {
        const headerHeight = 80;
        const itemHeight = 50;
        const bottomPadding = 40;
        const calculatedHeight = headerHeight + options.length * itemHeight + bottomPadding;

        if (options.length <= 3) {
            return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.35);
        }

        if (options.length <= 7) {
            return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.55);
        }

        return SCREEN_HEIGHT * 0.6;
    };

    const SNAP_POINTS = {
        CLOSED: SCREEN_HEIGHT,
        OPEN: SCREEN_HEIGHT - getModalHeight(),
    };

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (isOpen) {
            translateY.value = withSpring(SNAP_POINTS.OPEN, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0.5, { duration: 300 });
        } else if (isOpen === false && translateY.value !== SCREEN_HEIGHT) {
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [isOpen]);

    const handleClose = () => {
        translateY.value = withSpring(SCREEN_HEIGHT, {
            damping: 80,
            stiffness: 400,
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        setTimeout(() => setIsOpen(false), 300);
    };

    const handleOptionSelect = (option) => {
        setValue(option);
        handleClose();
    };

    const handleBackdropPress = () => {
        handleClose();
    };

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const modalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View className="mb-6">
            <Text
                className="text-sm font-semibold text-gray-900 mb-3"
            >
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>

            <TouchableOpacity
                className="border border-gray-900 rounded-xl px-4 py-4 flex-row justify-between items-center"
                onPress={() => setIsOpen(true)}
            >
                <Text
                    className={value ? "text-gray-900 text-base" : "text-gray-400 text-base"}
                >
                    {value ? value.label : placeholder}
                </Text>
                <ChevronDown
                    size={16}
                    color={value ? "#111827" : "#9ca3af"}
                />
            </TouchableOpacity>

            {/* Dropdown Modal */}
            {isOpen && (
                <Modal transparent={true} visible={isOpen}>
                    <TouchableWithoutFeedback onPress={handleBackdropPress}>
                        <View className="flex-1">
                            {/* Backdrop */}
                            <Animated.View style={[styles.backdrop, backdropStyle]}>
                                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                                    <View className="flex-1" />
                                </TouchableWithoutFeedback>
                            </Animated.View>

                            {/* Modal Content */}
                            <Animated.View style={[styles.modal, modalStyle]}>
                                {/* Handle */}
                                <View className="items-center py-3">
                                    <View className="w-12 h-1 bg-gray-300 rounded-full" />
                                </View>

                                {/* Header */}
                                <View className="flex-row justify-between items-center px-6 pb-4">
                                    <TouchableOpacity onPress={handleClose}>
                                        <ChevronLeft size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                    <Text className="text-lg font-semibold text-gray-800">{label}</Text>
                                    <View className="w-5" />
                                </View>

                                {/* Options List */}
                                <FlatList
                                    data={options}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className="px-6 py-4 border-b border-gray-100"
                                            onPress={() => handleOptionSelect(item)}
                                        >
                                            <Text className="text-base text-gray-800">{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                    showsVerticalScrollIndicator={false}
                                />
                            </Animated.View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
};

// Custom TextInput Component (same as ProfileExpectation)
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
    prefix,
}) => (
    <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-900 mb-3">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <View className="border border-gray-900 rounded-xl px-4 py-4 flex-row items-center">
            {prefix && (
                <Text className="text-gray-900 text-base font-medium mr-2">{prefix}</Text>
            )}
            <TextInput
                className="text-gray-900 text-base flex-1"
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

// Main OfferModal Component
const OfferModal = ({
    visible,
    onClose,
    onSubmit,
    isLoading = false,
    postData = {},
}) => {
    const insets = useSafeAreaInsets();
    const [offerAmount, setOfferAmount] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [offerMessage, setOfferMessage] = useState("");
    const [isInitialized, setIsInitialized] = useState(false); // Yeni state


    // Modal animation values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // ✅ Klavye animasyonu için yeni değer - CommentsBottomSheet'teki gibi
    const keyboardHeight = useSharedValue(0);

    // ✅ Klavye listeners - CommentsBottomSheet'teki smooth animasyon
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
            showListener?.remove();
            hideListener?.remove();
        };
    }, []);

    // Initialize currency based on post data
    useEffect(() => {
        if (postData?.paraBirimi && !selectedCurrency) {
            const currency = currencyOptions.find(
                (option) => option.value === postData.paraBirimi
            );
            if (currency) {
                setSelectedCurrency(currency);
            }
        }
    }, [postData, selectedCurrency]);

    // Modal open/close animation with smoother transitions
    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, {
                damping: 85,
                stiffness: 300,
                mass: 0.8,
            });
            backdropOpacity.value = withTiming(0.5, { duration: 300 });
        } else {
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 85,
                stiffness: 300,
                mass: 0.8,
            });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

    // Reset form when modal closes
    useEffect(() => {
        if (!visible) {
            setTimeout(() => {
                setOfferAmount("");
                setOfferMessage("");
                // Don't reset currency as it should remember user's last selection
            }, 300);
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!offerAmount.trim()) {
            Alert.alert("Hata", "Lütfen bir teklif tutarı giriniz.");
            return;
        }

        if (!selectedCurrency) {
            Alert.alert("Hata", "Lütfen para birimi seçiniz.");
            return;
        }

        const amount = parseFloat(offerAmount.replace(/[^0-9.]/g, ""));
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Hata", "Geçerli bir tutar giriniz.");
            return;
        }

        onSubmit({
            amount,
            currency: selectedCurrency.value,
            message: offerMessage.trim(),
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

    // ✅ Modal style - klavye yüksekliğini de hesaba katıyor (CommentsBottomSheet'teki gibi)
    const modalStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: translateY.value - keyboardHeight.value
        }],
    }));

    const formatNumber = (text) => {
        // Remove non-numeric characters except decimal point
        const numericText = text.replace(/[^0-9.]/g, "");

        // Handle decimal point
        const parts = numericText.split(".");
        if (parts.length > 2) {
            return parts[0] + "." + parts.slice(1).join("");
        }

        // Format with thousands separator
        if (parts[0]) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        return parts.join(".");
    };

    const handleAmountChange = (text) => {
        const formatted = formatNumber(text);
        setOfferAmount(formatted);
    };

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            {/* ✅ KeyboardAvoidingView'ı kaldırdık - artık gerekli değil çünkü manuel animasyon yapıyoruz */}
            <View className="flex-1">
                {/* Backdrop - Only this should close modal */}
                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                    <Animated.View style={[styles.backdrop, backdropStyle]} />
                </TouchableWithoutFeedback>

                {/* Modal Content - This should NOT close modal */}
                {/* ✅ modalStyle artık klavye yüksekliğini de hesaplıyor */}
                <Animated.View style={[styles.offerModal, modalStyle]}>
                    {/* Handle */}
                    <View className="items-center py-3">
                        <View className="w-12 h-1 bg-gray-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100">
                        <View className="w-5" />
                        <Text className="text-xl font-bold text-gray-800">Teklif Ver</Text>
                        <TouchableOpacity onPress={handleClose} className="p-1">
                            <X size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View className="px-6 pt-4">
                                {/* Property Info */}
                                <View className="mb-6 p-4 bg-gray-50 rounded-xl">
                                    <Text className="text-base font-semibold text-gray-800 mb-1">
                                        {postData?.ilanBasligi || "İlan"}
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        Mevcut Fiyat: {postData?.kiraFiyati?.toLocaleString() || "0"}{" "}
                                        {selectedCurrency?.symbol || "₺"}/ay
                                    </Text>
                                </View>

                                {/* Currency Selection */}
                                <CustomDropdown
                                    label="Para Birimi"
                                    value={selectedCurrency}
                                    setValue={setSelectedCurrency}
                                    options={currencyOptions}
                                    placeholder="Para birimi seçin"
                                    required={true}
                                />

                                {/* Offer Amount */}
                                <CustomTextInput
                                    label="Teklif Tutarı"
                                    value={offerAmount}
                                    onChangeText={handleAmountChange}
                                    placeholder="Teklif tutarınızı girin"
                                    keyboardType="numeric"
                                    required={true}
                                    prefix={selectedCurrency?.symbol}
                                />

                                {/* Offer Message */}
                                <CustomTextInput
                                    label="Mesajınız"
                                    value={offerMessage}
                                    onChangeText={setOfferMessage}
                                    placeholder="Ev sahibine iletmek istediğiniz mesaj (opsiyonel)"
                                    multiline={true}
                                    numberOfLines={4}
                                    maxLength={500}
                                />

                                {/* Character Counter */}
                                <Text className="text-xs text-gray-500 text-right -mt-4 mb-6">
                                    {offerMessage.length}/500
                                </Text>

                                {/* ✅ Extra bottom padding kaldırıldı - artık klavye animasyonu var */}
                            </View>
                        </TouchableWithoutFeedback>
                    </ScrollView>

                    {/* Submit Button - Fixed at bottom */}
                    <View
                        className="border-t border-gray-100 bg-white"
                        style={{
                            paddingBottom: insets.bottom,
                            paddingTop: 16,
                            paddingHorizontal: 24,
                        }}
                    >
                        <TouchableOpacity
                            className={`py-3 rounded-xl ${isLoading || !offerAmount.trim() || !selectedCurrency
                                ? "bg-gray-300"
                                : "bg-gray-900"
                                }`}
                            onPress={handleSubmit}
                            disabled={isLoading || !offerAmount.trim() || !selectedCurrency}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-semibold text-center text-lg">
                                    Teklifi Gönder
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

// Styles
const styles = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modal: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#ffffff",
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
    },
    offerModal: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT * 0.72,
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

export default OfferModal;