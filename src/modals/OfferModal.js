import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Keyboard,
    ActivityIndicator,
} from "react-native";
import { ChevronDown, ChevronLeft, X, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetTextInput,
    BottomSheetBackdrop,
    BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";

const currencyOptions = [
    { label: "Türk Lirası (₺)", value: 1, symbol: "₺" },
    { label: "Amerikan Doları ($)", value: 2, symbol: "$" },
    { label: "Euro (€)", value: 3, symbol: "€" },
    { label: "İngiliz Sterlini (£)", value: 4, symbol: "£" },
];

// Para birimi seçici — ayrı BottomSheetModal
const CurrencyPickerModal = ({ sheetRef, value, onSelect }) => {
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.4}
                pressBehavior="close"
            />
        ),
        []
    );

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={["35%"]}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.background}
            stackBehavior="push"
        >
            <View className="flex-row items-center px-6 pb-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} className="mr-3">
                    <ChevronLeft size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-gray-800">Para Birimi</Text>
            </View>

            <BottomSheetFlatList
                data={currencyOptions}
                keyExtractor={(item) => item.value.toString()}
                contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50"
                        onPress={() => {
                            onSelect(item);
                            sheetRef.current?.dismiss();
                        }}
                    >
                        <Text className="text-base text-gray-800">{item.label}</Text>
                        {value?.value === item.value && (
                            <Check size={18} color="#111827" />
                        )}
                    </TouchableOpacity>
                )}
            />
        </BottomSheetModal>
    );
};

// TextInput
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
        <View className="border border-gray-300 rounded-xl px-4 py-4 flex-row items-center">
            {prefix && (
                <Text className="text-gray-900 text-base font-medium mr-2">{prefix}</Text>
            )}
            <BottomSheetTextInput
                style={[
                    styles.textInput,
                    multiline && { textAlignVertical: "top", minHeight: numberOfLines * 24 },
                ]}
                placeholder={placeholder}
                placeholderTextColor="#b0b0b0"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? numberOfLines : undefined}
                maxLength={maxLength}
                blurOnSubmit={!multiline}
                returnKeyType={multiline ? "default" : "done"}
            />
        </View>
    </View>
);

// Ana OfferModal
const OfferModal = ({
    visible,
    onClose,
    onSubmit,
    isLoading = false,
    postData = {},
    existingOffer = null,
}) => {
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef(null);
    const currencySheetRef = useRef(null);
    const [offerAmount, setOfferAmount] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [offerMessage, setOfferMessage] = useState("");

    const snapPoints = useMemo(() => ["80%"], []);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    useEffect(() => {
        if (postData?.paraBirimi && !selectedCurrency) {
            const currency = currencyOptions.find((opt) => opt.value === postData.paraBirimi);
            if (currency) setSelectedCurrency(currency);
        }
    }, [postData]);

    const handleDismiss = useCallback(() => {
        setOfferAmount("");
        setOfferMessage("");
        onClose();
    }, [onClose]);

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
        bottomSheetRef.current?.dismiss();
    };

    const formatNumber = (text) => {
        const numericText = text.replace(/[^0-9.]/g, "");
        const parts = numericText.split(".");
        if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
        if (parts[0]) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const handleAmountChange = (text) => {
        setOfferAmount(formatNumber(text));
    };

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    return (
        <>
            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                onDismiss={handleDismiss}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                keyboardBehavior="extend"
                keyboardBlursBehavior="restore"
                android_keyboardInputMode="adjustResize"
                handleIndicatorStyle={styles.handleIndicator}
                backgroundStyle={styles.background}
                stackBehavior="push"
            >
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100">
                    <View className="w-5" />
                    <Text className="text-xl font-bold text-gray-800">Teklif Ver</Text>
                    <TouchableOpacity onPress={handleClose} className="p-1">
                        <X size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 16 }}
                >
                    <View className="px-6 pt-4">
                        {/* İlan Bilgisi */}
                        <View className="mb-6 p-4 bg-gray-50 rounded-xl">
                            <Text className="text-base font-semibold text-gray-800 mb-1">
                                {postData?.ilanBasligi || "İlan"}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                Mevcut Fiyat: {postData?.kiraFiyati?.toLocaleString() || "0"}{" "}
                                {selectedCurrency?.symbol || "₺"}/ay
                            </Text>
                        </View>

                        {/* Mevcut Teklif */}
                        {existingOffer && (
                            <View className="mb-6 p-4 rounded-xl border border-gray-100" style={{
                                backgroundColor: existingOffer.status === 1 ? "#f0fdf4"
                                    : existingOffer.status === 2 ? "#fef2f2"
                                    : "#fffbeb"
                            }}>
                                <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                    Mevcut Teklifiniz
                                </Text>
                                <Text className="text-xl font-bold text-gray-900 mb-1">
                                    {new Intl.NumberFormat("tr-TR").format(existingOffer.offerAmount)}{" "}
                                    {currencyOptions.find(c => c.value === existingOffer.currency)?.symbol || "₺"}
                                </Text>
                                <Text className="text-sm font-medium" style={{
                                    color: existingOffer.status === 1 ? "#16a34a"
                                        : existingOffer.status === 2 ? "#dc2626"
                                        : "#d97706"
                                }}>
                                    {existingOffer.status === 0 ? "Beklemede"
                                        : existingOffer.status === 1 ? "Kabul Edildi"
                                        : "Reddedildi"}
                                </Text>
                                {existingOffer.description ? (
                                    <Text className="text-xs text-gray-500 mt-2" numberOfLines={2}>
                                        "{existingOffer.description}"
                                    </Text>
                                ) : null}
                            </View>
                        )}

                        {/* Para Birimi */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-gray-900 mb-3">
                                Para Birimi <Text className="text-red-500">*</Text>
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-xl px-4 py-4 flex-row justify-between items-center"
                                onPress={() => currencySheetRef.current?.present()}
                            >
                                <Text className={selectedCurrency ? "text-gray-900 text-base" : "text-gray-400 text-base"}>
                                    {selectedCurrency ? selectedCurrency.label : "Para birimi seçin"}
                                </Text>
                                <ChevronDown size={16} color={selectedCurrency ? "#111827" : "#9ca3af"} />
                            </TouchableOpacity>
                        </View>

                        {/* Teklif Tutarı */}
                        <CustomTextInput
                            label="Teklif Tutarı"
                            value={offerAmount}
                            onChangeText={handleAmountChange}
                            placeholder="Teklif tutarınızı girin"
                            keyboardType="numeric"
                            required={true}
                            prefix={selectedCurrency?.symbol}
                        />

                        {/* Mesaj */}
                        <CustomTextInput
                            label="Mesajınız"
                            value={offerMessage}
                            onChangeText={setOfferMessage}
                            placeholder="Ev sahibine iletmek istediğiniz mesaj (opsiyonel)"
                            multiline={true}
                            numberOfLines={4}
                            maxLength={500}
                        />

                        {/* Karakter sayacı */}
                        <Text className="text-xs text-gray-500 text-right -mt-4 mb-6">
                            {offerMessage.length}/500
                        </Text>
                    </View>
                </BottomSheetScrollView>

                {/* Gönder Butonu */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <TouchableOpacity
                        style={{ borderRadius: 12, overflow: 'hidden' }}
                        onPress={handleSubmit}
                        disabled={isLoading || !offerAmount.trim() || !selectedCurrency}
                    >
                        {(isLoading || !offerAmount.trim() || !selectedCurrency) ? (
                            <View className="py-3 items-center bg-gray-300">
                                {isLoading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text className="text-white font-semibold text-center text-lg">
                                        Teklifi Gönder
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <LinearGradient
                                colors={['#0C9870', '#0A6650']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ paddingVertical: 12, alignItems: 'center' }}
                            >
                                <Text className="text-white font-semibold text-center text-lg">
                                    Teklifi Gönder
                                </Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </View>
            </BottomSheetModal>

            {/* Para Birimi Seçici */}
            <CurrencyPickerModal
                sheetRef={currencySheetRef}
                value={selectedCurrency}
                onSelect={setSelectedCurrency}
            />
        </>
    );
};

const styles = StyleSheet.create({
    background: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: "#ffffff",
    },
    handleIndicator: {
        backgroundColor: "#d1d5db",
        width: 48,
        height: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: "#111827",
    },
    footer: {
        paddingTop: 16,
        paddingHorizontal: 24,
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
});

export default OfferModal;
