// src/modals/PropertiesFilterModal.js

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    Dimensions,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTimes, faSliders } from "@fortawesome/pro-regular-svg-icons";
import { MaterialIcons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PropertiesFilterModal = ({
    visible,
    onClose,
    onApply,
    currentFilters = {},
    userRole
}) => {
    const insets = useSafeAreaInsets();

    // Modal boyutları
    const SNAP_POINTS = {
        CLOSED: SCREEN_HEIGHT,
        OPEN: SCREEN_HEIGHT * 0.15, // %85 ekran yüksekliği
    };

    // Animated values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // Local filter state
    const [localFilters, setLocalFilters] = useState({
        location: currentFilters.location || "",
        priceMin: currentFilters.priceMin ? String(currentFilters.priceMin) : "",
        priceMax: currentFilters.priceMax ? String(currentFilters.priceMax) : "",
        quickPrice: currentFilters.quickPrice || null,
        rooms: currentFilters.rooms || null,
        propertyType: currentFilters.propertyType || null,
        features: currentFilters.features || {},
        status: currentFilters.status || null,
        sortBy: currentFilters.sortBy || null,
    });

    // Modal açılış/kapanış animasyonu
    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(SNAP_POINTS.OPEN, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0.5, { duration: 300 });
        } else if (visible === false && translateY.value !== SCREEN_HEIGHT) {
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

    // Close handler
    const handleClose = () => {
        translateY.value = withSpring(SCREEN_HEIGHT, {
            damping: 80,
            stiffness: 400,
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        setTimeout(() => onClose(), 300);
    };

    // Apply filters handler
    const handleApply = () => {
        const processedFilters = {
            location: localFilters.location || null,
            priceMin: localFilters.priceMin ? parseFloat(localFilters.priceMin) : null,
            priceMax: localFilters.priceMax ? parseFloat(localFilters.priceMax) : null,
            quickPrice: localFilters.quickPrice,
            rooms: localFilters.rooms,
            propertyType: localFilters.propertyType,
            features: localFilters.features,
            status: localFilters.status,
            sortBy: localFilters.sortBy,
        };

        onApply(processedFilters);
        handleClose();
    };

    // Reset filters
    const handleReset = () => {
        const emptyFilters = {
            location: "",
            priceMin: "",
            priceMax: "",
            quickPrice: null,
            rooms: null,
            propertyType: null,
            features: {},
            status: null,
            sortBy: null,
        };
        setLocalFilters(emptyFilters);
    };

    // Backdrop press handler
    const handleBackdropPress = () => {
        handleClose();
    };

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const modalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Quick price options
    const quickPriceOptions = [
        { key: '0-2000', label: '₺0-2K', min: 0, max: 2000 },
        { key: '2000-5000', label: '₺2-5K', min: 2000, max: 5000 },
        { key: '5000-10000', label: '₺5-10K', min: 5000, max: 10000 },
        { key: '10000-15000', label: '₺10-15K', min: 10000, max: 15000 },
        { key: '15000+', label: '₺15K+', min: 15000, max: null }
    ];

    // Room options
    const roomOptions = ['1', '2', '3', '4', '5+'];

    // Property type options
    const propertyTypes = [
        { key: 'daire', label: 'Daire' },
        { key: 'villa', label: 'Villa' },
        { key: 'dubleks', label: 'Dubleks' },
        { key: 'mustakil', label: 'Müstakil' },
    ];

    // Feature options
    const featureOptions = [
        { key: 'furnished', label: 'Eşyalı' },
        { key: 'parking', label: 'Otopark' },
        { key: 'elevator', label: 'Asansör' },
        { key: 'balcony', label: 'Balkon' },
    ];

    // Sort options
    const sortOptions = [
        { key: 'newest', label: 'En Yeni' },
        { key: 'priceLow', label: 'Ucuzdan Pahalıya' },
        { key: 'priceHigh', label: 'Pahalıdan Ucuza' },
    ];

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <GestureHandlerRootView style={styles.container}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <TouchableWithoutFeedback onPress={handleBackdropPress}>
                        <View style={styles.backdropTouchable} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                {/* Modal Content */}
                <Animated.View style={[styles.modal, modalStyle]}>
                    {/* Header */}
                    <View className="items-center py-4 px-6 border-b border-gray-100 bg-white">
                        <View className="w-10 h-1 bg-gray-300 rounded-sm mb-3" />
                        <View className="flex-row justify-between items-center w-full">
                            <View className="flex-row items-center">
                                <FontAwesomeIcon icon={faSliders} size={20} color="#374151" />
                                <Text className="text-lg font-bold text-gray-900 ml-2">
                                    Filtrele
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleClose}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            >
                                <FontAwesomeIcon icon={faTimes} size={16} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        {/* Quick Price Filters */}
                        <View className="px-6 py-4">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Hızlı Fiyat Seçimi
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-row gap-2">
                                    {quickPriceOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.key}
                                            className={`px-4 py-2 rounded-full border ${localFilters.quickPrice === option.key
                                                ? "bg-gray-900 border-gray-900"
                                                : "bg-white border-gray-300"
                                                }`}
                                            onPress={() => {
                                                const isSelected = localFilters.quickPrice === option.key;
                                                setLocalFilters({
                                                    ...localFilters,
                                                    quickPrice: isSelected ? null : option.key,
                                                    priceMin: isSelected ? "" : String(option.min),
                                                    priceMax: isSelected ? "" : (option.max ? String(option.max) : "")
                                                });
                                            }}
                                        >
                                            <Text className={`font-medium ${localFilters.quickPrice === option.key ? "text-white" : "text-gray-700"
                                                }`}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Location & Custom Price */}
                        <View className="px-6 py-4 border-t border-gray-100">
                            {/* <Text className="text-base font-semibold text-gray-900 mb-3">
                                Konum ve Özel Fiyat
                            </Text> */}

                            {/* Location */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-medium mb-2">Konum</Text>
                                <TextInput
                                    className="bg-white border border-gray-900 p-4 rounded-2xl"
                                    placeholder="İstanbul, Ankara, İzmir..."
                                    placeholderTextColor="#9CA3AF"
                                    value={localFilters.location}
                                    onChangeText={(text) =>
                                        setLocalFilters({ ...localFilters, location: text })
                                    }
                                    style={{ fontSize: 16 }}
                                />
                            </View>

                            {/* Custom Price Range */}
                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-medium mb-2">Min. Fiyat</Text>
                                    <TextInput
                                        className="bg-white border border-gray-900 p-4 rounded-2xl"
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={localFilters.priceMin}
                                        onChangeText={(text) =>
                                            setLocalFilters({ ...localFilters, priceMin: text, quickPrice: null })
                                        }
                                        style={{ fontSize: 16 }}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-medium mb-2">Max. Fiyat</Text>
                                    <TextInput
                                        className="bg-white border border-gray-900 p-4 rounded-2xl"
                                        placeholder="∞"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={localFilters.priceMax}
                                        onChangeText={(text) =>
                                            setLocalFilters({ ...localFilters, priceMax: text, quickPrice: null })
                                        }
                                        style={{ fontSize: 16 }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Room Count */}
                        <View className="px-6 py-4 border-t border-gray-100">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Oda Sayısı
                            </Text>
                            <View className="flex-row flex-wrap">
                                {roomOptions.map((room) => (
                                    <TouchableOpacity
                                        key={room}
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.rooms === room
                                            ? "bg-gray-900 border-gray-900"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() =>
                                            setLocalFilters({
                                                ...localFilters,
                                                rooms: localFilters.rooms === room ? null : room
                                            })
                                        }
                                    >
                                        <Text className={`font-medium ${localFilters.rooms === room ? "text-white" : "text-gray-700"
                                            }`}>
                                            {room} oda
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Property Type */}
                        <View className="px-6 py-4 border-t border-gray-100">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Emlak Tipi
                            </Text>
                            <View className="flex-row flex-wrap">
                                {propertyTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.key}
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.propertyType === type.key
                                            ? "bg-gray-700 border-gray-700"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() =>
                                            setLocalFilters({
                                                ...localFilters,
                                                propertyType: localFilters.propertyType === type.key ? null : type.key
                                            })
                                        }
                                    >
                                        <Text className={`font-medium ${localFilters.propertyType === type.key ? "text-white" : "text-gray-700"
                                            }`}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Features */}
                        <View className="px-6 py-4 border-t border-gray-100">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Özellikler
                            </Text>
                            <View className="flex-row flex-wrap">
                                {featureOptions.map((feature) => (
                                    <TouchableOpacity
                                        key={feature.key}
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.features?.[feature.key]
                                            ? "bg-gray-900 border-gray-900"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() =>
                                            setLocalFilters({
                                                ...localFilters,
                                                features: {
                                                    ...localFilters.features,
                                                    [feature.key]: !localFilters.features?.[feature.key]
                                                }
                                            })
                                        }
                                    >
                                        <Text className={`font-medium ${localFilters.features?.[feature.key] ? "text-white" : "text-gray-700"
                                            }`}>
                                            {feature.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Sort Options */}
                        <View className="px-6 py-4 border-t border-gray-100">
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Sıralama
                            </Text>
                            <View className="flex-row flex-wrap">
                                {sortOptions.map((sort) => (
                                    <TouchableOpacity
                                        key={sort.key}
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.sortBy === sort.key
                                            ? "bg-gray-600 border-gray-600"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() =>
                                            setLocalFilters({
                                                ...localFilters,
                                                sortBy: localFilters.sortBy === sort.key ? null : sort.key
                                            })
                                        }
                                    >
                                        <Text className={`font-medium ${localFilters.sortBy === sort.key ? "text-white" : "text-gray-700"
                                            }`}>
                                            {sort.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Status Options - Only for Landlords */}
                        {userRole === "EVSAHIBI" && (
                            <View className="px-6 py-4 border-t border-gray-100">
                                <Text className="text-base font-semibold text-gray-900 mb-3">
                                    İlan Durumu
                                </Text>
                                <View className="flex-row flex-wrap">
                                    <TouchableOpacity
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.status === 0
                                            ? "bg-gray-900 border-gray-900"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() => {
                                            setLocalFilters({
                                                ...localFilters,
                                                status: localFilters.status === 0 ? null : 0
                                            });
                                        }}
                                    >
                                        <Text className={`font-medium ${localFilters.status === 0 ? "text-white" : "text-gray-700"
                                            }`}>
                                            Aktif
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.status === 1
                                            ? "bg-gray-700 border-gray-700"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() => {
                                            setLocalFilters({
                                                ...localFilters,
                                                status: localFilters.status === 1 ? null : 1
                                            });
                                        }}
                                    >
                                        <Text className={`font-medium ${localFilters.status === 1 ? "text-white" : "text-gray-700"
                                            }`}>
                                            Kiralandı
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${localFilters.status === 2
                                            ? "bg-gray-500 border-gray-500"
                                            : "bg-white border-gray-300"
                                            }`}
                                        onPress={() => {
                                            setLocalFilters({
                                                ...localFilters,
                                                status: localFilters.status === 2 ? null : 2
                                            });
                                        }}
                                    >
                                        <Text className={`font-medium ${localFilters.status === 2 ? "text-white" : "text-gray-700"
                                            }`}>
                                            Kapalı
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Actions */}
                    <View
                        className="px-6 py-4 border-t border-gray-100 bg-white"
                        style={{ paddingBottom: insets.bottom }}
                    >
                        <View className="flex-row space-x-3">
                            <TouchableOpacity
                                className="flex-1 bg-gray-100 py-4 rounded-xl"
                                onPress={handleReset}
                            >
                                <Text className="text-gray-800 font-bold text-center text-base">
                                    Sıfırla
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-gray-900 py-4 rounded-xl"
                                onPress={handleApply}
                            >
                                <Text className="text-white font-bold text-center text-base">
                                    Uygula
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </GestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
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

export default PropertiesFilterModal;