// src/screens/PropertiesFilterScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    Switch,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Alert,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faTimes,
    faSliders,
    faChevronDown,
    faChevronUp,
    faChevronLeft,
    faMapPin,
    faHome,
    faUser,
    faCoins,
    faCalendar,
    faSearch,
    faCheck,
    faFilter,
    faLocationDot
} from "@fortawesome/pro-solid-svg-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
    getCities,
    getDistrictsAndNeighbourhoodsByCityCode,
    getNeighbourhoodsByCityCodeAndDistrict
} from 'turkey-neighbourhoods';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// CustomDropdown Component - ProfileExpectationScreen'daki gibi
// CustomDropdown Component - Grouped options desteği ile
const CustomDropdown = ({
    label,
    value,
    setValue,
    options,
    placeholder,
    required = false,
    disabled = false,
    multiSelect = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const getModalHeight = () => {
        const headerHeight = 80;
        const itemHeight = 50;
        const bottomPadding = 40;
        const calculatedHeight = headerHeight + options.length * itemHeight + bottomPadding;

        if (options.length <= 3) {
            return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.5); // 0.35 -> 0.5
        }
        if (options.length <= 7) {
            return Math.min(calculatedHeight, SCREEN_HEIGHT * 0.7); // 0.55 -> 0.7
        }
        return SCREEN_HEIGHT * 0.8; // 0.6 -> 0.8
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
        if (multiSelect) {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.includes(option)) {
                setValue(currentValues.filter(v => v !== option));
            } else {
                setValue([...currentValues, option]);
            }
        } else {
            setValue(option);
            handleClose();
        }
    };

    const displayValue = () => {
        if (multiSelect && Array.isArray(value) && value.length > 0) {
            return value.length === 1 ? value[0] : `${value.length} seçili`;
        }
        return value || placeholder;
    };

    // Check if options are grouped (for neighborhoods)
    const isGroupedOptions = options.length > 0 && options[0]?.type;

    const renderOption = (option, index) => {
        // If this is a grouped option structure
        if (isGroupedOptions) {
            if (option.type === 'header') {
                return (
                    <View key={option.id} className="bg-gray-50 px-6 py-3">
                        <Text className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                            {option.title}
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
                        onPress={() => handleOptionSelect(option.value)}
                        activeOpacity={0.7}
                    >
                        <View className="flex-1">
                            <Text className={`text-base ${isSelected ? "text-gray-800 font-medium" : "text-gray-700"
                                }`}>
                                {option.value}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                {option.district}
                            </Text>
                        </View>
                        {isSelected && (
                            <FontAwesomeIcon icon={faCheck} size={16} color="#2563EB" />
                        )}
                    </TouchableOpacity>
                );
            }
        } else {
            // Regular options (non-grouped)
            const isSelected = multiSelect
                ? Array.isArray(value) && value.includes(option)
                : value === option;

            return (
                <TouchableOpacity
                    key={index}
                    className={`px-6 py-4 flex-row justify-between items-center ${index !== options.length - 1 ? "border-b border-gray-50" : ""
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
                        {option}
                    </Text>
                    {isSelected && (
                        <FontAwesomeIcon icon={faCheck} size={16} color="#16a34a" />
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
                    className={`text-base ${value ? 'text-gray-900' : 'text-gray-400'
                        } ${disabled ? 'text-gray-400' : ''}`}
                    style={{ fontSize: 16 }}
                >
                    {displayValue()}
                </Text>
                <FontAwesomeIcon
                    icon={faChevronDown}
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

                    <Animated.View style={[styles.modal, modalStyle]}>
                        <View className="items-center py-4 px-6 border-b border-gray-100 bg-white">
                            <View className="w-10 h-1 bg-gray-300 rounded-sm mb-3" />
                            <View className="flex-row justify-between items-center w-full">
                                <Text className="text-lg font-bold text-gray-900">
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

                        <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}
                            style={{ maxHeight: getModalHeight() - 120 }} // Header ve padding çıkarıldı
                            nestedScrollEnabled={true}
                        >
                            {options.map((option, index) => renderOption(option, index))}
                            {options.length > 7 && <View className="h-2" />}
                        </ScrollView>
                    </Animated.View>
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
};

// Mahalle yükleme fonksiyonu - güncellenmiş versiyon
const loadNeighborhoodsForDistricts = (selectedCity, selectedDistricts) => {
    try {
        const cityCode = cityCodeMap[selectedCity];
        if (!cityCode) {
            setNeighborhoodOptions([]);
            return;
        }

        let groupedNeighborhoods = [];
        selectedDistricts.forEach(district => {
            try {
                const neighborhoods = getNeighbourhoodsByCityCodeAndDistrict(cityCode, district);
                if (neighborhoods && Array.isArray(neighborhoods)) {
                    // Sort neighborhoods for this district
                    const sortedNeighborhoods = neighborhoods.sort((a, b) => a.localeCompare(b, 'tr'));

                    // Add district header
                    groupedNeighborhoods.push({
                        type: 'header',
                        title: district,
                        id: `header_${district}`
                    });

                    // Add neighborhoods for this district
                    sortedNeighborhoods.forEach(neighborhood => {
                        groupedNeighborhoods.push({
                            type: 'item',
                            value: neighborhood,
                            district: district,
                            id: `${district}_${neighborhood}`
                        });
                    });
                }
            } catch (error) {
                console.log(`${district} için mahalleler yüklenirken hata:`, error);
            }
        });

        setNeighborhoodOptions(groupedNeighborhoods);
    } catch (error) {
        console.error('Mahalleler yüklenirken hata:', error);
        setNeighborhoodOptions([]);
    }
};

// Main Filter Screen Component
const PropertiesFilterScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { currentFilters = {}, userRole, onApply } = route.params || {};

    // Location states - Turkey neighbourhoods
    const [selectedCity, setSelectedCity] = useState(currentFilters.selectedCity || "");
    const [selectedDistricts, setSelectedDistricts] = useState(currentFilters.selectedDistricts || []);
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState(currentFilters.selectedNeighborhoods || []);
    const [allCities, setAllCities] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [neighborhoodOptions, setNeighborhoodOptions] = useState([]);
    const [cityCodeMap, setCityCodeMap] = useState({});

    // Filter states
    const [filters, setFilters] = useState({
        // Temel filtreler
        priceMin: currentFilters.priceMin ? String(currentFilters.priceMin) : "",
        priceMax: currentFilters.priceMax ? String(currentFilters.priceMax) : "",
        quickPrice: currentFilters.quickPrice || null,
        roomTypes: currentFilters.roomTypes || [], // 1+0, 1+1 formatında
        propertyTypes: currentFilters.propertyTypes || [], // Çoklu seçim

        // Ev özellikleri
        minSquareMeters: currentFilters.minSquareMeters ? String(currentFilters.minSquareMeters) : "",
        maxBuildingAge: currentFilters.maxBuildingAge ? String(currentFilters.maxBuildingAge) : "",
        preferredFloorRange: currentFilters.preferredFloorRange || "",
        heatingTypes: currentFilters.heatingTypes || [],
        furnishedPreference: currentFilters.furnishedPreference || null,

        // Features
        hasElevator: currentFilters.hasElevator || false,
        hasBalcony: currentFilters.hasBalcony || false,
        hasParking: currentFilters.hasParking || false,
        hasInternet: currentFilters.hasInternet || false,
        hasGarden: currentFilters.hasGarden || false,

        // Ev sahibi beklentileri (EVSAHIBI için)
        maximumOccupants: currentFilters.maximumOccupants ? String(currentFilters.maximumOccupants) : "",
        petPolicy: currentFilters.petPolicy || null,
        studentPolicy: currentFilters.studentPolicy || null,
        smokingPolicy: currentFilters.smokingPolicy || null,
        isGuarantorRequired: currentFilters.isGuarantorRequired || false,
        isReferenceRequired: currentFilters.isReferenceRequired || false,
        isIncomeProofRequired: currentFilters.isIncomeProofRequired || false,
        minimumMonthlyIncome: currentFilters.minimumMonthlyIncome ? String(currentFilters.minimumMonthlyIncome) : "",

        // Kiracı tercihleri (KIRACI için)
        occupantCount: currentFilters.occupantCount ? String(currentFilters.occupantCount) : "",
        hasPets: currentFilters.hasPets || false,
        petTypes: currentFilters.petTypes || "",
        isStudent: currentFilters.isStudent || false,
        isFamily: currentFilters.isFamily || false,
        hasChildren: currentFilters.hasChildren || false,
        isSmoker: currentFilters.isSmoker || false,
        hasInsuredJob: currentFilters.hasInsuredJob || false,
        canProvideGuarantor: currentFilters.canProvideGuarantor || false,
        canProvideReference: currentFilters.canProvideReference || false,

        // Finansal
        maintenanceFeePreference: currentFilters.maintenanceFeePreference || null,
        maxMaintenanceFee: currentFilters.maxMaintenanceFee ? String(currentFilters.maxMaintenanceFee) : "",
        canPayDeposit: currentFilters.canPayDeposit || false,
        maxDepositAmount: currentFilters.maxDepositAmount ? String(currentFilters.maxDepositAmount) : "",
        preferredPaymentMethod: currentFilters.preferredPaymentMethod || null,
        preferredRentalPeriod: currentFilters.preferredRentalPeriod || null,

        // Erişilebilirlik
        requiresPublicTransport: currentFilters.requiresPublicTransport || false,
        requiresShoppingAccess: currentFilters.requiresShoppingAccess || false,
        requiresSchoolAccess: currentFilters.requiresSchoolAccess || false,
        requiresHospitalAccess: currentFilters.requiresHospitalAccess || false,

        // Sıralama
        sortBy: currentFilters.sortBy || null,

        // Status (EVSAHIBI için)
        status: currentFilters.status || null,
    });

    // Options arrays
    const quickPriceOptions = [
        { key: '0-10000', label: '₺0-10K', min: 0, max: 10000 },
        { key: '10000-20000', label: '₺10-20K', min: 10000, max: 20000 },
        { key: '20000-30000', label: '₺20-30K', min: 20000, max: 30000 },
        { key: '30000-40000', label: '₺30-40K', min: 30000, max: 40000 },
        { key: '40000+', label: '₺45K+', min: 45000, max: null }
    ];

    const roomTypeOptions = [
        '1+0', '1+1', '1+2',
        '2+0', '2+1', '2+2',
        '3+0', '3+1', '3+2', '3+3',
        '4+1', '4+2', '4+3',
        '5+1', '5+2', '5+3'
    ];

    const propertyTypeOptions = [
        'Daire',
        'Müstakil Ev',
        'Villa',
        'Stüdyo Daire',
        'Rezidans',
        'Dubleks',
        'Çiftlik Evi',
        'Diğer'
    ];

    const heatingTypeOptions = [
        'Doğalgaz Kombi',
        'Merkezi Sistem',
        'Elektrikli Isıtma',
        'Soba',
        'Klima',
        'Yerden Isıtma',
        'Fark Etmez'
    ];

    const furnishedOptions = [
        'Eşyalı',
        'Eşyasız',
        'Yarı Eşyalı',
        'Fark Etmez'
    ];

    const petPolicyOptions = [
        'Evet, Kabul Ediyorum',
        'Hayır, Kabul Etmiyorum',
        'Sadece Küçük Hayvan'
    ];

    const studentPolicyOptions = [
        'Evet, Kabul Ediyorum',
        'Hayır, Kabul Etmiyorum',
        'Referanslı Öğrenci Olabilir'
    ];

    const smokingPolicyOptions = [
        'Evet, İzin Veriyorum',
        'Hayır, İzin Vermiyorum',
        'Sadece Balkonda İçilebilir'
    ];

    const maintenanceFeeOptions = [
        'Kiracıya Ait',
        'Ev Sahibine Ait',
        'Ortak Ödeme'
    ];

    const paymentMethodOptions = [
        'Banka Havalesi',
        'Nakit Ödeme',
        'Çek',
        'Fark Etmez'
    ];

    const rentalPeriodOptions = [
        '6 Ay',
        '1 Yıl',
        'Uzun Vadeli (1+ Yıl)',
        'Kısa Dönem Olabilir'
    ];

    const sortOptions = [
        'En Yeni',
        'Ucuzdan Pahalıya',
        'Pahalıdan Ucuza',
        'M² Büyükten Küçüğe',
        'Oda Sayısına Göre'
    ];

    // Load cities on mount
    useEffect(() => {
        loadAllTurkeyCities();
    }, []);

    // Load districts when city changes
    useEffect(() => {
        if (selectedCity) {
            loadDistrictsForCity(selectedCity);
            setSelectedDistricts([]);
            setSelectedNeighborhoods([]);
            setNeighborhoodOptions([]);
        } else {
            setDistrictOptions([]);
            setSelectedDistricts([]);
            setSelectedNeighborhoods([]);
            setNeighborhoodOptions([]);
        }
    }, [selectedCity]);

    // Load neighborhoods when districts change
    useEffect(() => {
        if (selectedDistricts.length > 0 && selectedCity) {
            loadNeighborhoodsForDistricts(selectedCity, selectedDistricts);
            setSelectedNeighborhoods([]);
        } else {
            setNeighborhoodOptions([]);
            setSelectedNeighborhoods([]);
        }
    }, [selectedDistricts, selectedCity]);

    // Turkey cities loader
    const loadAllTurkeyCities = () => {
        try {
            const cities = getCities();
            if (cities && Array.isArray(cities)) {
                const cityNames = cities
                    .map((city) => city.name)
                    .sort((a, b) => a.localeCompare(b, "tr"));
                setAllCities(cityNames);

                const codeMap = {};
                cities.forEach((city) => {
                    codeMap[city.name] = city.code;
                });
                setCityCodeMap(codeMap);
            } else {
                throw new Error("Cities array not found");
            }
        } catch (error) {
            console.error("Şehirler yüklenirken hata:", error);
            loadFallbackCities();
        }
    };

    const loadFallbackCities = () => {
        const fallbackCities = [
            "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya",
            "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik",
            "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
            "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
            "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul",
            "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale",
            "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
            "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize",
            "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ",
            "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
        ];
        setAllCities(fallbackCities);
    };

    const loadDistrictsForCity = (selectedCity) => {
        try {
            const cityCode = cityCodeMap[selectedCity];
            if (!cityCode) {
                setDistrictOptions([]);
                return;
            }

            const districtsData = getDistrictsAndNeighbourhoodsByCityCode(cityCode);
            if (districtsData && typeof districtsData === 'object') {
                const districtNames = Object.keys(districtsData).sort((a, b) => a.localeCompare(b, 'tr'));
                setDistrictOptions(districtNames);
            } else {
                setDistrictOptions([]);
            }
        } catch (error) {
            console.error('İlçeler yüklenirken hata:', error);
            setDistrictOptions([]);
        }
    };

    const loadNeighborhoodsForDistricts = (selectedCity, selectedDistricts) => {
        try {
            const cityCode = cityCodeMap[selectedCity];
            if (!cityCode) {
                setNeighborhoodOptions([]);
                return;
            }

            let groupedNeighborhoods = [];

            selectedDistricts.forEach(district => {
                try {
                    const neighborhoods = getNeighbourhoodsByCityCodeAndDistrict(cityCode, district);
                    if (neighborhoods && Array.isArray(neighborhoods)) {
                        // Sort neighborhoods for this district
                        const sortedNeighborhoods = neighborhoods.sort((a, b) => a.localeCompare(b, 'tr'));

                        // Add district header
                        groupedNeighborhoods.push({
                            type: 'header',
                            title: district,
                            id: `header_${district}`
                        });

                        // Add neighborhoods for this district
                        sortedNeighborhoods.forEach(neighborhood => {
                            groupedNeighborhoods.push({
                                type: 'item',
                                value: neighborhood,
                                district: district,
                                id: `${district}_${neighborhood}`
                            });
                        });
                    }
                } catch (error) {
                    console.log(`${district} için mahalleler yüklenirken hata:`, error);
                }
            });

            setNeighborhoodOptions(groupedNeighborhoods);
        } catch (error) {
            console.error('Mahalleler yüklenirken hata:', error);
            setNeighborhoodOptions([]);
        }
    };

    // Update filter function
    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Apply filters
    const handleApplyFilters = () => {
        const appliedFilters = {
            ...filters,
            selectedCity,
            selectedDistricts,
            selectedNeighborhoods,
            // Convert string numbers to numbers
            priceMin: filters.priceMin ? parseFloat(filters.priceMin) : null,
            priceMax: filters.priceMax ? parseFloat(filters.priceMax) : null,
            minSquareMeters: filters.minSquareMeters ? parseInt(filters.minSquareMeters) : null,
            maxBuildingAge: filters.maxBuildingAge ? parseInt(filters.maxBuildingAge) : null,
            maximumOccupants: filters.maximumOccupants ? parseInt(filters.maximumOccupants) : null,
            minimumMonthlyIncome: filters.minimumMonthlyIncome ? parseFloat(filters.minimumMonthlyIncome) : null,
            occupantCount: filters.occupantCount ? parseInt(filters.occupantCount) : null,
            maxMaintenanceFee: filters.maxMaintenanceFee ? parseFloat(filters.maxMaintenanceFee) : null,
            maxDepositAmount: filters.maxDepositAmount ? parseFloat(filters.maxDepositAmount) : null,
        };

        if (onApply) {
            onApply(appliedFilters);
        }
        navigation.goBack();
    };

    // Reset filters
    const handleResetFilters = () => {
        Alert.alert(
            "Filtreleri Sıfırla",
            "Tüm filtreleri sıfırlamak istediğinizden emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sıfırla",
                    style: "destructive",
                    onPress: () => {
                        setSelectedCity("");
                        setSelectedDistricts([]);
                        setSelectedNeighborhoods([]);
                        setFilters({
                            priceMin: "",
                            priceMax: "",
                            quickPrice: null,
                            roomTypes: [],
                            propertyTypes: [],
                            minSquareMeters: "",
                            maxBuildingAge: "",
                            preferredFloorRange: "",
                            heatingTypes: [],
                            furnishedPreference: null,
                            hasElevator: false,
                            hasBalcony: false,
                            hasParking: false,
                            hasInternet: false,
                            hasGarden: false,
                            maximumOccupants: "",
                            petPolicy: null,
                            studentPolicy: null,
                            smokingPolicy: null,
                            isGuarantorRequired: false,
                            isReferenceRequired: false,
                            isIncomeProofRequired: false,
                            minimumMonthlyIncome: "",
                            occupantCount: "",
                            hasPets: false,
                            petTypes: "",
                            isStudent: false,
                            isFamily: false,
                            hasChildren: false,
                            isSmoker: false,
                            hasInsuredJob: false,
                            canProvideGuarantor: false,
                            canProvideReference: false,
                            maintenanceFeePreference: null,
                            maxMaintenanceFee: "",
                            canPayDeposit: false,
                            maxDepositAmount: "",
                            preferredPaymentMethod: null,
                            preferredRentalPeriod: null,
                            requiresPublicTransport: false,
                            requiresShoppingAccess: false,
                            requiresSchoolAccess: false,
                            requiresHospitalAccess: false,
                            sortBy: null,
                            status: null,
                        });
                    }
                }
            ]
        );
    };

    // Quick price handler
    const handleQuickPriceSelect = (optionKey) => {
        const option = quickPriceOptions.find(opt => opt.key === optionKey);
        if (option) {
            const isSelected = filters.quickPrice === optionKey;
            updateFilter('quickPrice', isSelected ? null : optionKey);
            updateFilter('priceMin', isSelected ? "" : String(option.min));
            updateFilter('priceMax', isSelected ? "" : (option.max ? String(option.max) : ""));
        }
    };

    // Switch component
    const renderSwitch = (label, value, onValueChange, description = null) => (
        <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 mr-4">
                <Text className="text-gray-700 font-medium">{label}</Text>
                {description && (
                    <Text className="text-sm text-gray-500 mt-1">{description}</Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: "#e5e7eb", true: "#111827" }}
                thumbColor={value ? "#ffffff" : "#f3f4f6"}
            />
        </View>
    );

    // Option buttons component - devamı
    const renderOptionButtons = (options, selectedValues, onSelect, multiSelect = false) => (
        <View className="flex-row flex-wrap">
            {options.map((option, index) => {
                const isSelected = multiSelect
                    ? Array.isArray(selectedValues) && selectedValues.includes(option)
                    : selectedValues === option;

                return (
                    <TouchableOpacity
                        key={index}
                        className={`mr-3 mb-3 px-4 py-2 rounded-full border ${isSelected
                            ? "bg-gray-900 border-gray-900"
                            : "bg-white border-gray-300"
                            }`}
                        onPress={() => {
                            if (multiSelect) {
                                const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
                                if (currentValues.includes(option)) {
                                    onSelect(currentValues.filter(v => v !== option));
                                } else {
                                    onSelect([...currentValues, option]);
                                }
                            } else {
                                onSelect(isSelected ? null : option);
                            }
                        }}
                    >
                        <Text className={`font-medium ${isSelected ? "text-white" : "text-gray-700"
                            }`}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100">
                <View className="flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="flex-row items-center"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} size={22} color="#374151" />
                        {/* <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Filtreler
                        </Text> */}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleResetFilters}
                        className="px-3 py-1 rounded-lg bg-gray-100"
                    >
                        <Text className="text-gray-700 font-medium">Sıfırla</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Konum Seçimi */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <FontAwesomeIcon icon={faMapPin} size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Konum
                        </Text>
                    </View>

                    {/* Şehir Seçimi */}
                    <CustomDropdown
                        label="Şehir"
                        value={selectedCity}
                        setValue={setSelectedCity}
                        options={allCities}
                        placeholder="Şehir seçiniz"
                        required
                    />

                    {/* İlçe Seçimi - Çoklu */}
                    <CustomDropdown
                        label="İlçeler"
                        value={selectedDistricts}
                        setValue={setSelectedDistricts}
                        options={districtOptions}
                        placeholder={selectedCity ? "İlçe seçiniz" : "Önce şehir seçiniz"}
                        disabled={!selectedCity || districtOptions.length === 0}
                        multiSelect={true}
                    />

                    {/* Mahalle Seçimi - Çoklu */}
                    <CustomDropdown
                        label="Mahalleler"
                        value={selectedNeighborhoods}
                        setValue={setSelectedNeighborhoods}
                        options={neighborhoodOptions}
                        placeholder={
                            !selectedCity ? "Önce şehir seçiniz" :
                                selectedDistricts.length === 0 ? "Önce ilçe seçiniz" :
                                    "Mahalle seçiniz"
                        }
                        disabled={selectedDistricts.length === 0 || neighborhoodOptions.length === 0}
                        multiSelect={true}
                    />
                </View>

                {/* Fiyat Filtreleri */}
                <View className="bg-white mt-4 rounded-xl p-4 ">
                    <View className="flex-row items-center mb-4">
                        <FontAwesomeIcon icon={faCoins} size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Fiyat
                        </Text>
                    </View>

                    {/* Hızlı Fiyat Seçimi */}
                    <Text className="text-gray-700 font-medium mb-3">Hızlı Seçim</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        <View className="flex-row gap-2">
                            {quickPriceOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    className={`px-4 py-2 rounded-full border ${filters.quickPrice === option.key
                                        ? "bg-gray-900 border-gray-900"
                                        : "bg-white border-gray-300"
                                        }`}
                                    onPress={() => handleQuickPriceSelect(option.key)}
                                >
                                    <Text className={`font-medium ${filters.quickPrice === option.key ? "text-white" : "text-gray-700"
                                        }`}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Manuel Fiyat Girişi */}
                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Min. Fiyat (₺)</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 p-4 rounded-xl"
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.priceMin}
                                onChangeText={(text) => {
                                    updateFilter('priceMin', text);
                                    updateFilter('quickPrice', null);
                                }}
                                style={{ fontSize: 16 }}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Max. Fiyat (₺)</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 p-4 rounded-xl"
                                placeholder="∞"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.priceMax}
                                onChangeText={(text) => {
                                    updateFilter('priceMax', text);
                                    updateFilter('quickPrice', null);
                                }}
                                style={{ fontSize: 16 }}
                            />
                        </View>
                    </View>
                </View>

                {/* Ev Özellikleri */}
                <View className="bg-white  mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <FontAwesomeIcon icon={faHome} size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Ev Özellikleri
                        </Text>
                    </View>

                    {/* Oda Türleri - Çoklu seçim */}
                    <Text className="text-gray-700 font-medium mb-3">Oda Türü</Text>
                    {renderOptionButtons(
                        roomTypeOptions,
                        filters.roomTypes,
                        (value) => updateFilter('roomTypes', value),
                        true
                    )}

                    {/* Emlak Türleri - Çoklu seçim */}
                    <Text className="text-gray-700 font-medium mb-3">Emlak Türü</Text>
                    {renderOptionButtons(
                        propertyTypeOptions,
                        filters.propertyTypes,
                        (value) => updateFilter('propertyTypes', value),
                        true
                    )}

                    {/* Metrekare */}
                    <Text className="text-gray-700 font-medium mb-2">Minimum Metrekare</Text>
                    <TextInput
                        className="bg-white border border-gray-900 p-4 rounded-xl mb-4"
                        placeholder="..."
                        placeholderTextColor="#505050"
                        keyboardType="numeric"
                        value={filters.minSquareMeters}
                        onChangeText={(text) => updateFilter('minSquareMeters', text)}
                        style={{ fontSize: 16 }}
                    />

                    {/* Bina Yaşı */}
                    <Text className="text-gray-700 font-medium mb-2">Maksimum Bina Yaşı</Text>
                    <TextInput
                        className="bg-white border border-gray-900 p-4 rounded-xl mb-4"
                        placeholder="..."
                        placeholderTextColor="#808080"
                        keyboardType="numeric"
                        value={filters.maxBuildingAge}
                        onChangeText={(text) => updateFilter('maxBuildingAge', text)}
                        style={{ fontSize: 16 }}
                    />

                    {/* Kat Aralığı */}
                    <Text className="text-gray-700 font-medium mb-2">Kat Aralığı</Text>
                    <TextInput
                        className="bg-white border border-gray-900 p-4 rounded-xl mb-4"
                        placeholder="1-5, zemin, çatı katı"
                        placeholderTextColor="#808080"
                        value={filters.preferredFloorRange}
                        onChangeText={(text) => updateFilter('preferredFloorRange', text)}
                        style={{ fontSize: 16 }}
                    />

                    {/* Isıtma Türü - Çoklu seçim */}
                    <Text className="text-gray-700 font-medium mb-3">Isıtma Türü</Text>
                    {renderOptionButtons(
                        heatingTypeOptions,
                        filters.heatingTypes,
                        (value) => updateFilter('heatingTypes', value),
                        true
                    )}

                    {/* Eşya Durumu */}
                    <CustomDropdown
                        label="Eşya Durumu"
                        value={filters.furnishedPreference}
                        setValue={(value) => updateFilter('furnishedPreference', value)}
                        options={furnishedOptions}
                        placeholder="Eşya durumu seçiniz"
                    />

                    {/* Özellikler - Switch'ler */}
                    <Text className="text-gray-700 font-medium mb-3 mt-4">Özellikler</Text>
                    {renderSwitch(
                        "Asansör",
                        filters.hasElevator,
                        (value) => updateFilter('hasElevator', value)
                    )}
                    {renderSwitch(
                        "Balkon",
                        filters.hasBalcony,
                        (value) => updateFilter('hasBalcony', value)
                    )}
                    {renderSwitch(
                        "Otopark",
                        filters.hasParking,
                        (value) => updateFilter('hasParking', value)
                    )}
                    {renderSwitch(
                        "İnternet",
                        filters.hasInternet,
                        (value) => updateFilter('hasInternet', value)
                    )}
                    {renderSwitch(
                        "Bahçe",
                        filters.hasGarden,
                        (value) => updateFilter('hasGarden', value)
                    )}
                </View>

                {/* Ev Sahibi Beklentileri - Sadece EVSAHIBI için */}
                {userRole === "EVSAHIBI" && (
                    <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <FontAwesomeIcon icon={faUser} size={18} color="#374151" />
                            <Text className="text-lg font-semibold text-gray-900 ml-2">
                                Kiracı Beklentilerim
                            </Text>
                        </View>

                        {/* Maksimum Kişi Sayısı */}
                        <Text className="text-gray-700 font-medium mb-2">Maksimum Kişi Sayısı</Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-300 p-4 rounded-xl mb-4"
                            placeholder="4"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={filters.maximumOccupants}
                            onChangeText={(text) => updateFilter('maximumOccupants', text)}
                            style={{ fontSize: 16 }}
                        />

                        {/* Evcil Hayvan Politikası */}
                        <CustomDropdown
                            label="Evcil Hayvan Politikası"
                            value={filters.petPolicy}
                            setValue={(value) => updateFilter('petPolicy', value)}
                            options={petPolicyOptions}
                            placeholder="Evcil hayvan politikası seçiniz"
                        />

                        {/* Öğrenci Politikası */}
                        <CustomDropdown
                            label="Öğrenci Politikası"
                            value={filters.studentPolicy}
                            setValue={(value) => updateFilter('studentPolicy', value)}
                            options={studentPolicyOptions}
                            placeholder="Öğrenci politikası seçiniz"
                        />

                        {/* Sigara Politikası */}
                        <CustomDropdown
                            label="Sigara Politikası"
                            value={filters.smokingPolicy}
                            setValue={(value) => updateFilter('smokingPolicy', value)}
                            options={smokingPolicyOptions}
                            placeholder="Sigara politikası seçiniz"
                        />

                        {/* Gereksinimler */}
                        <Text className="text-gray-700 font-medium mb-3 mt-4">Gereksinimler</Text>
                        {renderSwitch(
                            "Kefil Gerekli",
                            filters.isGuarantorRequired,
                            (value) => updateFilter('isGuarantorRequired', value)
                        )}
                        {renderSwitch(
                            "Referans Gerekli",
                            filters.isReferenceRequired,
                            (value) => updateFilter('isReferenceRequired', value)
                        )}
                        {renderSwitch(
                            "Gelir Belgesi Gerekli",
                            filters.isIncomeProofRequired,
                            (value) => updateFilter('isIncomeProofRequired', value)
                        )}

                        {/* Minimum Gelir - Sadece gelir belgesi gerekli ise */}
                        {filters.isIncomeProofRequired && (
                            <>
                                <Text className="text-gray-700 font-medium mb-2">Minimum Aylık Gelir (₺)</Text>
                                <TextInput
                                    className="bg-gray-50 border border-gray-300 p-4 rounded-xl mb-4"
                                    placeholder="15000"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={filters.minimumMonthlyIncome}
                                    onChangeText={(text) => updateFilter('minimumMonthlyIncome', text)}
                                    style={{ fontSize: 16 }}
                                />
                            </>
                        )}
                    </View>
                )}

                {/* Kiracı Tercihleri - Sadece KIRACI için */}
                {userRole === "KIRACI" && (
                    <View className="bg-white mt-4 rounded-xl p-4">
                        <View className="flex-row items-center mb-4">
                            <FontAwesomeIcon icon={faUser} size={18} color="#374151" />
                            <Text className="text-lg font-semibold text-gray-900 ml-2">
                                Yaşam Tarzım
                            </Text>
                        </View>

                        {/* Yaşayacak Kişi Sayısı */}
                        <Text className="text-gray-700 font-medium mb-2">Yaşayacak Kişi Sayısı</Text>
                        <TextInput
                            className="bg-white border border-gray-900 p-4 rounded-xl mb-4"
                            placeholder="2"
                            placeholderTextColor="#808080"
                            keyboardType="numeric"
                            value={filters.occupantCount}
                            onChangeText={(text) => updateFilter('occupantCount', text)}
                            style={{ fontSize: 16 }}
                        />

                        {/* Yaşam Tarzı Switch'leri */}
                        {renderSwitch(
                            "Evcil Hayvanım Var",
                            filters.hasPets,
                            (value) => updateFilter('hasPets', value)
                        )}

                        {/* Evcil Hayvan Türü - Sadece evcil hayvan varsa */}
                        {filters.hasPets && (
                            <>
                                <Text className="text-gray-700 font-medium mb-2">Evcil Hayvan Türü</Text>
                                <TextInput
                                    className="bg-gray-50 border border-gray-300 p-4 rounded-xl mb-4"
                                    placeholder="Köpek, kedi, kuş..."
                                    placeholderTextColor="#9CA3AF"
                                    value={filters.petTypes}
                                    onChangeText={(text) => updateFilter('petTypes', text)}
                                    style={{ fontSize: 16 }}
                                />
                            </>
                        )}

                        {renderSwitch(
                            "Öğrenciyim",
                            filters.isStudent,
                            (value) => updateFilter('isStudent', value)
                        )}
                        {renderSwitch(
                            "Aileyim",
                            filters.isFamily,
                            (value) => updateFilter('isFamily', value)
                        )}
                        {renderSwitch(
                            "Çocuğum Var",
                            filters.hasChildren,
                            (value) => updateFilter('hasChildren', value)
                        )}
                        {renderSwitch(
                            "Sigara İçiyorum",
                            filters.isSmoker,
                            (value) => updateFilter('isSmoker', value)
                        )}
                        {renderSwitch(
                            "Sigortalı İşim Var",
                            filters.hasInsuredJob,
                            (value) => updateFilter('hasInsuredJob', value)
                        )}
                        {renderSwitch(
                            "Kefil Verebilirim",
                            filters.canProvideGuarantor,
                            (value) => updateFilter('canProvideGuarantor', value)
                        )}
                        {renderSwitch(
                            "Referans Verebilirim",
                            filters.canProvideReference,
                            (value) => updateFilter('canProvideReference', value)
                        )}
                    </View>
                )}

                {/* Finansal Tercihler */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <FontAwesomeIcon icon={faCoins} size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Finansal Tercihler
                        </Text>
                    </View>

                    {/* Aidat Tercihi */}
                    <CustomDropdown
                        label="Aidat Sorumluluğu"
                        value={filters.maintenanceFeePreference}
                        setValue={(value) => updateFilter('maintenanceFeePreference', value)}
                        options={maintenanceFeeOptions}
                        placeholder="Aidat sorumluluğu seçiniz"
                    />

                    {/* Maksimum Aidat */}
                    <Text className="text-gray-700 font-medium mb-2">Maksimum Aidat (₺)</Text>
                    <TextInput
                        className="bg-white border border-gray-900 p-4 rounded-xl mb-4"
                        placeholder="500"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={filters.maxMaintenanceFee}
                        onChangeText={(text) => updateFilter('maxMaintenanceFee', text)}
                        style={{ fontSize: 16 }}
                    />

                    {/* Depozito */}
                    {renderSwitch(
                        "Depozito Ödeyebilirim",
                        filters.canPayDeposit,
                        (value) => updateFilter('canPayDeposit', value)
                    )}

                    {/* Maksimum Depozito - Sadece depozito ödeyebilirse */}
                    {filters.canPayDeposit && (
                        <>
                            <Text className="text-gray-700 font-medium mb-2">Maksimum Depozito (₺)</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 p-4 rounded-xl mb-4"
                                placeholder="10000"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.maxDepositAmount}
                                onChangeText={(text) => updateFilter('maxDepositAmount', text)}
                                style={{ fontSize: 16 }}
                            />
                        </>
                    )}

                    {/* Ödeme Yöntemi */}
                    <CustomDropdown
                        label="Tercih Edilen Ödeme Yöntemi"
                        value={filters.preferredPaymentMethod}
                        setValue={(value) => updateFilter('preferredPaymentMethod', value)}
                        options={paymentMethodOptions}
                        placeholder="Ödeme yöntemi seçiniz"
                    />

                    {/* Kira Süresi */}
                    <CustomDropdown
                        label="Tercih Edilen Kira Süresi"
                        value={filters.preferredRentalPeriod}
                        setValue={(value) => updateFilter('preferredRentalPeriod', value)}
                        options={rentalPeriodOptions}
                        placeholder="Kira süresi seçiniz"
                    />
                </View>

                {/* Erişilebilirlik */}
                {/* <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <FontAwesomeIcon icon={faLocationDot} size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Konum Erişilebilirliği
                        </Text>
                    </View>

                    {renderSwitch(
                        "Toplu Taşıma Yakınlığı",
                        filters.requiresPublicTransport,
                        (value) => updateFilter('requiresPublicTransport', value),
                        "Metro, otobüs durağına yakın olmalı"
                    )}
                    {renderSwitch(
                        "Alışveriş Merkezi Yakınlığı",
                        filters.requiresShoppingAccess,
                        (value) => updateFilter('requiresShoppingAccess', value),
                        "Market, AVM gibi yerlere yakın olmalı"
                    )}
                    {renderSwitch(
                        "Okul Yakınlığı",
                        filters.requiresSchoolAccess,
                        (value) => updateFilter('requiresSchoolAccess', value),
                        "Anaokulu, ilkokul, lise yakınlığı"
                    )}
                    {renderSwitch(
                        "Hastane Yakınlığı",
                        filters.requiresHospitalAccess,
                        (value) => updateFilter('requiresHospitalAccess', value),
                        "Sağlık kuruluşlarına yakın olmalı"
                    )}
                </View> */}

                {/* Sıralama */}
                {/* <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <FontAwesomeIcon icon={faCalendar} size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Sıralama
                        </Text>
                    </View>

                    <CustomDropdown
                        label="Sonuçları Sırala"
                        value={filters.sortBy}
                        setValue={(value) => updateFilter('sortBy', value)}
                        options={sortOptions}
                        placeholder="Sıralama türü seçiniz"
                    />
                </View> */}

                {/* İlan Durumu - Sadece EVSAHIBI için */}
                {userRole === "EVSAHIBI" && (
                    <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <FontAwesomeIcon icon={faFilter} size={18} color="#374151" />
                            <Text className="text-lg font-semibold text-gray-900 ml-2">
                                İlan Durumu
                            </Text>
                        </View>

                        <View className="flex-row flex-wrap">
                            <TouchableOpacity
                                className={`mr-3 mb-3 px-4 py-2 rounded-full border ${filters.status === 0
                                    ? "bg-green-500 border-green-500"
                                    : "bg-white border-gray-300"
                                    }`}
                                onPress={() => updateFilter('status', filters.status === 0 ? null : 0)}
                            >
                                <Text className={`font-medium ${filters.status === 0 ? "text-white" : "text-gray-700"
                                    }`}>
                                    Aktif
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`mr-3 mb-3 px-4 py-2 rounded-full border ${filters.status === 1
                                    ? "bg-blue-500 border-blue-500"
                                    : "bg-white border-gray-300"
                                    }`}
                                onPress={() => updateFilter('status', filters.status === 1 ? null : 1)}
                            >
                                <Text className={`font-medium ${filters.status === 1 ? "text-white" : "text-gray-700"
                                    }`}>
                                    Kiralandı
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`mr-3 mb-3 px-4 py-2 rounded-full border ${filters.status === 2
                                    ? "bg-gray-500 border-gray-500"
                                    : "bg-white border-gray-300"
                                    }`}
                                onPress={() => updateFilter('status', filters.status === 2 ? null : 2)}
                            >
                                <Text className={`font-medium ${filters.status === 2 ? "text-white" : "text-gray-700"
                                    }`}>
                                    Kapalı
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4 border-t border-gray-100"
                style={{ paddingBottom: insets.bottom + 16 }}
            >
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        className="flex-1 bg-gray-100 py-4 rounded-xl"
                        onPress={handleResetFilters}
                    >
                        <Text className="text-gray-800 font-bold text-center text-base">
                            Sıfırla
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 bg-gray-900 py-4 rounded-xl"
                        onPress={handleApplyFilters}
                    >
                        <Text className="text-white font-bold text-center text-base">
                            Filtreleri Uygula
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
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

export default PropertiesFilterScreen;