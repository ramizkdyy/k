import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    TouchableWithoutFeedback,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { ChevronDown, Check, Search, X } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLazyGetSuggestionsQuery } from '../redux/api/searchApiSlice';
import { debounce } from 'lodash';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ Türkçe karakterleri normalize eden helper fonksiyon
const normalizeTurkishText = (text) => {
    if (!text) return '';

    return text
        .toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')  // ÖNEMLİ: Büyük İ'yi küçük i'ye çevir
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .trim();
};

const FilterDropdown = ({
    label,
    value,
    setValue,
    options,
    placeholder,
    required = false,
    disabled = false,
    multiSelect = false,
    searchable = false, // Arama özelliği aktif/pasif
    suggestionType = null, // 'il', 'ilce', 'mahalle' - API'den öneri almak için
    onSearch = null, // Custom arama fonksiyonu
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [isSearching, setIsSearching] = useState(false);

    // API hook'u - sadece suggestionType varsa kullan
    const [getSuggestions, { data: suggestions, isFetching: isSuggestionsLoading }] =
        suggestionType ? useLazyGetSuggestionsQuery() : [null, {}];

    const getModalHeight = () => {
        const headerHeight = searchable ? 140 : 80; // Arama barı varsa daha fazla alan
        const itemHeight = 50;
        const bottomPadding = 40;
        const optionCount = filteredOptions.length || options.length;
        const calculatedHeight = headerHeight + optionCount * itemHeight + bottomPadding;

        if (optionCount <= 3) {
            return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.5);
        }
        if (optionCount <= 7) {
            return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.7);
        }
        return SCREEN_HEIGHT * 0.8;
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

    // API'den öneri al
    const fetchSuggestions = useCallback(
        debounce(async (query) => {
            if (!suggestionType || !getSuggestions || query.length < 2) {
                return;
            }

            try {
                const result = await getSuggestions({
                    type: suggestionType,
                    keyword: query
                }).unwrap();

                if (result && Array.isArray(result)) {
                    // API'den gelen string array'i option formatına çevir
                    const formattedSuggestions = result.map(item => ({
                        label: item,
                        value: item
                    }));
                    setFilteredOptions(formattedSuggestions);
                }
            } catch (error) {
                console.error('Öneri alınırken hata:', error);
                // Hata durumunda local filtreleme yap
                performLocalSearch(query);
            }
        }, 300),
        [suggestionType, getSuggestions]
    );

    // ✅ Düzeltilmiş local arama fonksiyonu - Türkçe karakter desteği
    const performLocalSearch = (query) => {
        if (!query) {
            setFilteredOptions(options);
            return;
        }

        const normalizedQuery = normalizeTurkishText(query);

        const filtered = options.filter(option => {
            let searchText = '';

            if (typeof option === 'string') {
                searchText = option;
            } else if (option?.value) {
                searchText = option.value;
                // Label varsa onu da kontrol et
                if (option.label) {
                    searchText += ' ' + option.label;
                }
            }

            const normalizedSearchText = normalizeTurkishText(searchText);
            return normalizedSearchText.includes(normalizedQuery);
        });

        setFilteredOptions(filtered);
    };

    // Arama işleyici
    const handleSearch = (text) => {
        setSearchQuery(text);
        setIsSearching(true);

        if (onSearch) {
            // Custom arama fonksiyonu varsa kullan
            const results = onSearch(text, options);
            setFilteredOptions(results);
            setIsSearching(false);
        } else if (suggestionType && getSuggestions) {
            // API'den öneri al
            fetchSuggestions(text);
        } else {
            // Local arama yap
            performLocalSearch(text);
            setIsSearching(false);
        }
    };

    // Modal açıldığında
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setFilteredOptions(options);
        }
    }, [isOpen, options]);

    // Options değiştiğinde filtered options'ı güncelle
    useEffect(() => {
        if (!searchQuery) {
            setFilteredOptions(options);
        }
    }, [options]);

    // Loading durumu
    useEffect(() => {
        setIsSearching(isSuggestionsLoading);
    }, [isSuggestionsLoading]);

    const handleClose = () => {
        translateY.value = withSpring(SCREEN_HEIGHT, {
            damping: 80,
            stiffness: 400,
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        setTimeout(() => {
            setIsOpen(false);
            setSearchQuery('');
            setFilteredOptions(options);
        }, 300);
    };

    const handleOptionSelect = (option) => {
        const optionValue = typeof option === 'object' ? option.value : option;

        if (multiSelect) {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.includes(optionValue)) {
                setValue(currentValues.filter(v => v !== optionValue));
            } else {
                setValue([...currentValues, optionValue]);
            }
        } else {
            setValue(optionValue);
            handleClose();
        }
    };

    const displayValue = () => {
        if (!value) return placeholder;

        if (multiSelect && Array.isArray(value)) {
            if (value.length === 0) return placeholder;
            if (value.length === 1) {
                const option = options.find(opt => {
                    const optionValue = typeof opt === 'object' ? opt.value : opt;
                    return optionValue === value[0];
                });
                return typeof option === 'object' ? option.label : option || value[0];
            }
            return `${value.length} seçili`;
        } else {
            const option = options.find(opt => {
                const optionValue = typeof opt === 'object' ? opt.value : opt;
                return optionValue === value;
            });
            return typeof option === 'object' ? option.label : option || value;
        }
    };

    const isGroupedOptions = filteredOptions.length > 0 && filteredOptions[0]?.type;

    const renderOption = (option, index) => {
        if (isGroupedOptions) {
            if (option.type === 'header') {
                return (
                    <View key={option.id} className="bg-gray-50 px-6 py-3">
                        <Text className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                            {option.value}
                        </Text>
                    </View>
                );
            } else if (option.type === 'item') {
                const isSelected = multiSelect && Array.isArray(value) && value.includes(option.value);
                return (
                    <TouchableOpacity
                        key={option.id}
                        className={`px-6 py-4 flex-row justify-between items-center border-b border-gray-50 ${isSelected ? "bg-gray-100" : "bg-white"
                            }`}
                        onPress={() => handleOptionSelect(option)}
                        activeOpacity={0.7}
                    >
                        <View className="flex-1">
                            <Text className={`text-base ${isSelected ? "text-gray-800 font-medium" : "text-gray-700"
                                }`}>
                                {option.value}
                            </Text>
                            {/* {option.district && (
                                <Text className="text-xs text-gray-500 mt-1">
                                    {option.district}
                                </Text>
                            )} */}
                        </View>
                        {isSelected && (
                            <Check size={16} color="#2563EB" />
                        )}
                    </TouchableOpacity>
                );
            }
        } else {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;

            const isSelected = multiSelect
                ? Array.isArray(value) && value.includes(optionValue)
                : value === optionValue;

            return (
                <TouchableOpacity
                    key={index}
                    className={`px-6 py-4 flex-row justify-between items-center ${index !== filteredOptions.length - 1 ? "border-b border-gray-50" : ""
                        } ${isSelected ? "bg-gray-100" : "bg-white"}`}
                    onPress={() => handleOptionSelect(option)}
                    activeOpacity={0.7}
                >
                    <Text
                        className={`text-lg flex-1 mr-3 ${isSelected ? "text-gray-900 font-medium" : "text-gray-600"
                            }`}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {optionLabel}
                    </Text>
                    {isSelected && (
                        <Check size={16} color="#16a34a" />
                    )}
                </TouchableOpacity>
            );
        }
    };

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const modalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View className="mb-4">
            <Text style={{ fontSize: 14 }} className="font-semibold text-gray-900 mb-3">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>

            <TouchableOpacity
                className={`border rounded-xl px-4 py-4 flex-row justify-between items-center ${disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-900'
                    }`}
                onPress={() => !disabled && setIsOpen(true)}
                disabled={disabled}
            >
                <Text
                    className={`text-base ${value ? 'text-gray-900' : 'text-gray-400'} ${disabled ? 'text-gray-400' : ''
                        }`}
                    style={{ fontSize: 16 }}
                >
                    {displayValue()}
                </Text>
                <ChevronDown
                    size={16}
                    color={disabled ? "#D1D5DB" : "#374151"}
                />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={handleClose}
            >
                <GestureHandlerRootView style={styles.container}>
                    <Animated.View style={[styles.backdrop, backdropStyle]}>
                        <TouchableWithoutFeedback onPress={handleClose}>
                            <View style={styles.backdropTouchable} />
                        </TouchableWithoutFeedback>
                    </Animated.View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardAvoid}
                    >
                        <Animated.View style={[styles.modal, modalStyle]}>
                            {/* Header */}
                            <View className="items-center py-4 px-6 bg-white">
                                {/* <View className="w-10 h-1 bg-gray-300 rounded-sm mb-3" /> */}
                                <View className="flex-row justify-between items-center w-full">
                                    <Text className="text-xl font-bold text-gray-900">
                                        {label}
                                    </Text>
                                    {multiSelect && (
                                        <TouchableOpacity
                                            onPress={handleClose}
                                            className="px-2 py-2 rounded-lg"
                                        >
                                            <Text className="text-blue-500 font-medium">Tamam</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Search Bar */}
                            {searchable && (
                                <View className="px-4 py-3 bg-white border-b border-gray-100">
                                    <View className="flex-row items-center border bg-white border-gray-900 rounded-xl px-4 py-2">
                                        <Search
                                            size={16}
                                            color="#111827"
                                        />
                                        <TextInput
                                            className="flex-1 ml-3 py-1 text-gray-900"
                                            placeholder={`${label} içinde ara...`}
                                            placeholderTextColor="#808080"
                                            value={searchQuery}
                                            onChangeText={handleSearch}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            style={{ fontSize: 16 }}
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity
                                                onPress={() => handleSearch('')}
                                                className="p-1"
                                            >
                                                <X
                                                    size={14}
                                                    color="#6B7280"
                                                />
                                            </TouchableOpacity>
                                        )}
                                        {isSearching && (
                                            <ActivityIndicator
                                                size="small"
                                                color="#9CA3AF"
                                                style={{ marginLeft: 8 }}
                                            />
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Options List */}
                            <ScrollView
                                className="flex-1 bg-white"
                                showsVerticalScrollIndicator={false}
                                style={{ maxHeight: getModalHeight() - (searchable ? 180 : 120) }}
                                nestedScrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                {filteredOptions.length === 0 ? (
                                    <View className="px-6 py-8">
                                        <Text className="text-center text-gray-500">
                                            {isSearching ? 'Aranıyor...' : 'Sonuç bulunamadı'}
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {filteredOptions.map((option, index) =>
                                            renderOption(option, index)
                                        )}
                                        {filteredOptions.length > 7 && <View className="h-2" />}
                                    </>
                                )}
                            </ScrollView>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdropTouchable: {
        flex: 1,
    },
    modal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
});

export default FilterDropdown;