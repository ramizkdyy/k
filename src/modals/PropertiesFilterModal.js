// src/modals/PropertiesFilterModal.js

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Switch,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
    Home,
    User,
    Coins,
    Search,
    Filter,
    MapPin
} from "lucide-react-native";
import {
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetBackdrop,
    BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {
    getCities,
    getDistrictsAndNeighbourhoodsByCityCode,
} from 'turkey-neighbourhoods';

// Redux imports
import {
    selectSearchFilters,
    setSearchFilters,
    clearSearchFilters,
    resetPagination,
} from '../redux/slices/searchSlice';
import { useSearchPostsMutation } from '../redux/api/searchApiSlice';
import { selectUserRole } from '../redux/slices/authSlice';
import FilterDropdown from '../modals/FilterDropdown';

// Filter options (same as original)
const roomTypeOptions = [
    { label: '1+0 (Studio)', value: '1+0' },
    { label: '1+1', value: '1+1' },
    { label: '2+1', value: '2+1' },
    { label: '3+1', value: '3+1' },
    { label: '4+1', value: '4+1' },
    { label: '5+1 ve üzeri', value: '5+1' },
];

const propertyTypeOptions = [
    { label: 'Daire', value: 1 },
    { label: 'Müstakil Ev', value: 2 },
    { label: 'Villa', value: 3 },
    { label: 'Rezidans', value: 4 },
    { label: 'Apart', value: 5 },
];

const heatingTypeOptions = [
    { label: 'Doğalgaz', value: 'Doğalgaz' },
    { label: 'Elektrik', value: 'Elektrik' },
    { label: 'Kömür', value: 'Kömür' },
    { label: 'Fuel-oil', value: 'Fuel-oil' },
    { label: 'Jeotermal', value: 'Jeotermal' },
    { label: 'Güneş Enerjisi', value: 'Güneş Enerjisi' },
    { label: 'Klima', value: 'Klima' },
];

const petPolicyOptions = [
    { label: 'Evcil hayvan kabul edilir', value: 1 },
    { label: 'Evcil hayvan kabul edilmez', value: 2 },
    { label: 'Görüşmeli', value: 3 },
];

const studentPolicyOptions = [
    { label: 'Öğrenci kabul edilir', value: 1 },
    { label: 'Öğrenci kabul edilmez', value: 2 },
    { label: 'Görüşmeli', value: 3 },
];

const smokingPolicyOptions = [
    { label: 'Sigara içilebilir', value: 1 },
    { label: 'Sigara içilemez', value: 2 },
    { label: 'Görüşmeli', value: 3 },
];

const maintenanceFeeOptions = [
    { label: 'Kiracı öder', value: 1 },
    { label: 'Ev sahibi öder', value: 2 },
    { label: 'Görüşmeli', value: 3 },
];

const statusOptions = [
    { label: 'Aktif', value: 0 },
    { label: 'Pasif', value: 1 },
    { label: 'Kapalı', value: 2 },
];

const currencyOptions = [
    { label: "Türk Lirası (₺)", value: "TRY", symbol: "₺" },
    { label: "Amerikan Doları ($)", value: "USD", symbol: "$" },
    { label: "Euro (€)", value: "EUR", symbol: "€" },
    { label: "İngiliz Sterlini (£)", value: "GBP", symbol: "£" },
];

// Helper functions for location data
const loadDistrictsForCity = async (cityCode, setCityCodeMap, setDistrictOptions) => {
    try {
        const data = getDistrictsAndNeighbourhoodsByCityCode(cityCode);
        const districts = Object.keys(data).sort();
        const districtOptions = districts.map(district => ({
            label: district,
            value: district
        }));
        setDistrictOptions(districtOptions);
    } catch (error) {
        console.error('İlçeler yüklenirken hata:', error);
        setDistrictOptions([]);
    }
};

const loadNeighborhoodsForDistricts = async (cityCode, selectedDistricts, setNeighborhoodOptions) => {
    if (!selectedDistricts || selectedDistricts.length === 0) {
        setNeighborhoodOptions([]);
        return;
    }

    try {
        const data = getDistrictsAndNeighbourhoodsByCityCode(cityCode);
        let groupedNeighborhoods = [];

        selectedDistricts.forEach(district => {
            try {
                const neighborhoods = data[district] || [];
                const sortedNeighborhoods = neighborhoods.sort();

                if (sortedNeighborhoods.length > 0) {
                    groupedNeighborhoods.push({
                        type: 'header',
                        value: district,
                        id: `header_${district}`
                    });

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

// Main Filter Modal Component
const PropertiesFilterModal = ({
    visible,
    onClose,
    onApply
}) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();

    // Bottom Sheet Ref
    const bottomSheetModalRef = useRef(null);

    // Snap points - %65 ve %90 ekran
    const snapPoints = useMemo(() => ["65%", "90%"], []);

    // Redux state
    const searchFilters = useSelector(selectSearchFilters);
    const userRole = useSelector(selectUserRole);
    const [searchPosts, { isLoading: isSearching }] = useSearchPostsMutation();

    // Location states - Turkey neighbourhoods
    const [allCities, setAllCities] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [neighborhoodOptions, setNeighborhoodOptions] = useState([]);
    const [cityCodeMap, setCityCodeMap] = useState({});

    // Local filter states - API formatına göre
    const [filters, setFilters] = useState({
        // Konum
        il: searchFilters.il || "",
        ilce: searchFilters.ilce || [],
        mahalle: searchFilters.mahalle || [],

        // Fiyat
        minKiraFiyati: searchFilters.minKiraFiyati ? String(searchFilters.minKiraFiyati) : "",
        maxKiraFiyati: searchFilters.maxKiraFiyati ? String(searchFilters.maxKiraFiyati) : "",
        paraBirimi: searchFilters.paraBirimi || "TRY",

        quickPrice: null,

        // Metrekare
        minBrutMetreKare: searchFilters.minBrutMetreKare ? String(searchFilters.minBrutMetreKare) : "",
        maxBrutMetreKare: searchFilters.maxBrutMetreKare ? String(searchFilters.maxBrutMetreKare) : "",

        // Odalar
        odaSayilari: searchFilters.odaSayilari || [],
        propertyTypes: searchFilters.propertyTypes || [],

        // Bina özellikleri
        minBinaYasi: searchFilters.minBinaYasi ? String(searchFilters.minBinaYasi) : "",
        maxBinaYasi: searchFilters.maxBinaYasi ? String(searchFilters.maxBinaYasi) : "",
        minKat: searchFilters.minKat ? String(searchFilters.minKat) : "",
        maxKat: searchFilters.maxKat ? String(searchFilters.maxKat) : "",

        // Isıtma
        isitmaTipleri: searchFilters.isitmaTipleri || [],

        // Politikalar
        petPolicies: searchFilters.petPolicies || [],
        studentPolicies: searchFilters.studentPolicies || [],
        smokingPolicies: searchFilters.smokingPolicies || [],
        maintenanceFeeResponsibilities: searchFilters.maintenanceFeeResponsibilities || [],

        // Boolean özellikler
        balkon: searchFilters.balkon,
        asansor: searchFilters.asansor,
        otopark: searchFilters.otopark,
        esyali: searchFilters.esyali,
        siteIcerisinde: searchFilters.siteIcerisinde,

        // Arama
        searchKeyword: searchFilters.searchKeyword || "",
        siteAdi: searchFilters.siteAdi || "",

        // Status
        statuses: searchFilters.statuses || [],
    });

    // Load cities on mount
    useEffect(() => {
        try {
            const cities = getCities();
            const sortedCities = cities.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

            setAllCities(sortedCities.map(city => ({
                label: city.name,
                value: city.name
            })));

            const codeMap = {};
            cities.forEach(city => {
                codeMap[city.name] = city.code;
            });
            setCityCodeMap(codeMap);

        } catch (error) {
            console.error('Şehirler yüklenirken hata:', error);
            setAllCities([]);
        }
    }, []);

    // Load districts when city changes
    useEffect(() => {
        if (filters.il && cityCodeMap[filters.il]) {
            loadDistrictsForCity(cityCodeMap[filters.il], setCityCodeMap, setDistrictOptions);
        } else {
            setDistrictOptions([]);
            setNeighborhoodOptions([]);
        }
    }, [filters.il, cityCodeMap]);

    // Load neighborhoods when districts change
    useEffect(() => {
        if (filters.il && filters.ilce.length > 0 && cityCodeMap[filters.il]) {
            loadNeighborhoodsForDistricts(cityCodeMap[filters.il], filters.ilce, setNeighborhoodOptions);
        } else {
            setNeighborhoodOptions([]);
        }
    }, [filters.il, filters.ilce, cityCodeMap]);

    // Present/dismiss based on visible prop
    useEffect(() => {
        if (visible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [visible]);

    // Bottom Sheet dismiss handler
    const handleSheetChanges = useCallback((index) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    // Backdrop component
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

    // Close handler
    const handleClose = () => {
        bottomSheetModalRef.current?.dismiss();
    };

    // Filter update function
    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Multi-select helper
    const renderOptionButtons = (options, selectedValues, onSelect, multiSelect = false) => {
        return (
            <View className="flex-row flex-wrap gap-2 mb-4">
                {options.map((option, index) => {
                    const isSelected = multiSelect
                        ? Array.isArray(selectedValues) && selectedValues.includes(option.value)
                        : selectedValues === option.value;

                    return (
                        <TouchableOpacity
                            key={index}
                            className={`px-4 py-2 rounded-full border ${isSelected
                                ? "bg-gray-900 border-gray-900"
                                : "bg-white border-gray-300"
                                }`}
                            onPress={() => {
                                if (multiSelect) {
                                    const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
                                    if (currentValues.includes(option.value)) {
                                        onSelect(currentValues.filter(v => v !== option.value));
                                    } else {
                                        onSelect([...currentValues, option.value]);
                                    }
                                } else {
                                    onSelect(isSelected ? null : option.value);
                                }
                            }}
                        >
                            <Text className={`font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const handleApplyFilters = async () => {
        try {
            // İlçe ve mahalle değerlerinin string array olduğundan emin ol
            const ilceArray = Array.isArray(filters.ilce)
                ? filters.ilce.filter(item => typeof item === 'string' && item.length > 0)
                : [];

            const mahalleArray = Array.isArray(filters.mahalle)
                ? filters.mahalle.filter(item => typeof item === 'string' && item.length > 0)
                : [];

            // API formatına göre filtre objesini oluştur
            const searchPayload = {
                // Konum - küçük harfle başlamalı
                il: filters.il || null,
                ilceler: ilceArray.length > 0 ? ilceArray : null,
                mahalleler: mahalleArray.length > 0 ? mahalleArray : null,
                latitude: null,
                longitude: null,
                maxDistance: null,

                // Fiyat
                minKiraFiyati: filters.minKiraFiyati ? parseInt(filters.minKiraFiyati) : null,
                maxKiraFiyati: filters.maxKiraFiyati ? parseInt(filters.maxKiraFiyati) : null,
                minDepozito: null,
                maxDepozito: null,
                paraBirimi: filters.paraBirimi || "TRY",

                // Metrekare
                minBrutMetreKare: filters.minBrutMetreKare ? parseInt(filters.minBrutMetreKare) : null,
                maxBrutMetreKare: filters.maxBrutMetreKare ? parseInt(filters.maxBrutMetreKare) : null,
                minNetMetreKare: null,
                maxNetMetreKare: null,

                // Odalar - string array olmalı
                odaSayilari: filters.odaSayilari.length > 0 ? filters.odaSayilari : null,

                // Bina özellikleri
                minBinaYasi: filters.minBinaYasi ? parseInt(filters.minBinaYasi) : null,
                maxBinaYasi: filters.maxBinaYasi ? parseInt(filters.maxBinaYasi) : null,
                minKat: filters.minKat ? parseInt(filters.minKat) : null,
                maxKat: filters.maxKat ? parseInt(filters.maxKat) : null,
                minToplamKat: null,
                maxToplamKat: null,

                // Türler - integer array olmalı
                propertyTypes: filters.propertyTypes.length > 0
                    ? filters.propertyTypes.map(pt => parseInt(pt))
                    : null,

                // Isıtma - string array olmalı
                isitmaTipleri: filters.isitmaTipleri.length > 0 ? filters.isitmaTipleri : null,

                // Oda sayıları
                minBanyoSayisi: null,
                maxBanyoSayisi: null,
                minYatakOdasiSayisi: null,
                maxYatakOdasiSayisi: null,

                // Politikalar - integer array olmalı
                petPolicies: filters.petPolicies.length > 0
                    ? filters.petPolicies.map(p => parseInt(p))
                    : null,
                studentPolicies: filters.studentPolicies.length > 0
                    ? filters.studentPolicies.map(p => parseInt(p))
                    : null,
                smokingPolicies: filters.smokingPolicies.length > 0
                    ? filters.smokingPolicies.map(p => parseInt(p))
                    : null,
                maintenanceFeeResponsibilities: filters.maintenanceFeeResponsibilities.length > 0
                    ? filters.maintenanceFeeResponsibilities.map(p => parseInt(p))
                    : null,

                // Boolean özellikler - null, true veya false olmalı
                balkon: filters.balkon === true ? true : filters.balkon === false ? false : null,
                asansor: filters.asansor === true ? true : filters.asansor === false ? false : null,
                otopark: filters.otopark === true ? true : filters.otopark === false ? false : null,
                esyali: filters.esyali === true ? true : filters.esyali === false ? false : null,
                siteIcerisinde: filters.siteIcerisinde === true ? true : filters.siteIcerisinde === false ? false : null,
                takas: null,

                // Kiralama süresi
                minKiralamaSuresi: null,
                maxKiralamaSuresi: null,
                rentalPeriods: [], // integer array

                // Arama
                searchKeyword: filters.searchKeyword || null,
                siteAdi: filters.siteAdi || null,

                // Status - integer array olmalı, default [0]
                statuses: filters.statuses.length > 0
                    ? filters.statuses.map(s => parseInt(s))
                    : [0],

                // Sayfalama
                sortBy: "CreatedDate",
                page: 1,
                pageSize: 20
            };

            // null değerleri temizle (undefined yerine null kullan)
            const cleanedPayload = Object.fromEntries(
                Object.entries(searchPayload).filter(([_, v]) => v !== null)
            );

            console.log('Gönderilen payload:', JSON.stringify(cleanedPayload, null, 2));

            // API çağrısı yap
            const result = await searchPosts(cleanedPayload).unwrap();

            console.log('API yanıtı:', result);

            if (onApply) {
                onApply(cleanedPayload, result);
            }

            handleClose();
        } catch (error) {
            console.error('Filtre uygulama hatası:', error);

            let errorMessage = 'Filtreler uygulanırken bir hata oluştu.';

            if (error?.data) {
                errorMessage = typeof error.data === 'string'
                    ? error.data
                    : error.data.message || errorMessage;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            Alert.alert('Hata', errorMessage);
        }
    };

    // Helper fonksiyonlar
    const getCurrencySymbol = (currency) => {
        const currencyOption = currencyOptions.find(option => option.value === currency);
        return currencyOption ? currencyOption.symbol : "₺";
    };

    const getQuickPriceOptions = (currency) => {
        switch (currency) {
            case "USD":
                return [
                    { label: '$500-$1,000', value: { min: 500, max: 1000 } },
                    { label: '$1,000-$1,500', value: { min: 1000, max: 1500 } },
                    { label: '$1,500-$2,000', value: { min: 1500, max: 2000 } },
                    { label: '$2,000-$2,500', value: { min: 2000, max: 2500 } },
                    { label: '$2,500+', value: { min: 2500, max: null } },
                ];
            case "EUR":
                return [
                    { label: '€450-€900', value: { min: 450, max: 900 } },
                    { label: '€900-€1,350', value: { min: 900, max: 1350 } },
                    { label: '€1,350-€1,800', value: { min: 1350, max: 1800 } },
                    { label: '€1,800-€2,250', value: { min: 1800, max: 2250 } },
                    { label: '€2,250+', value: { min: 2250, max: null } },
                ];
            case "GBP":
                return [
                    { label: '£400-£800', value: { min: 400, max: 800 } },
                    { label: '£800-£1,200', value: { min: 800, max: 1200 } },
                    { label: '£1,200-£1,600', value: { min: 1200, max: 1600 } },
                    { label: '£1,600-£2,000', value: { min: 1600, max: 2000 } },
                    { label: '£2,000+', value: { min: 2000, max: null } },
                ];
            case "TRY":
            default:
                return [
                    { label: '10.000₺-20.000₺', value: { min: 10000, max: 20000 } },
                    { label: '20.000₺-30.000₺', value: { min: 20000, max: 30000 } },
                    { label: '30.000₺-40.000₺', value: { min: 30000, max: 40000 } },
                    { label: '40.000₺-50.000₺', value: { min: 40000, max: 50000 } },
                    { label: '50.000₺+', value: { min: 50000, max: null } },
                ];
        }
    };

    const handleResetFilters = () => {
        setFilters({
            il: "",
            ilce: [],
            mahalle: [],
            minKiraFiyati: "",
            maxKiraFiyati: "",
            paraBirimi: "TRY",
            quickPrice: null,
            minBrutMetreKare: "",
            maxBrutMetreKare: "",
            odaSayilari: [],
            propertyTypes: [],
            minBinaYasi: "",
            maxBinaYasi: "",
            minKat: "",
            maxKat: "",
            isitmaTipleri: [],
            petPolicies: [],
            studentPolicies: [],
            smokingPolicies: [],
            maintenanceFeeResponsibilities: [],
            balkon: null,
            asansor: null,
            otopark: null,
            esyali: null,
            siteIcerisinde: null,
            searchKeyword: "",
            siteAdi: "",
            statuses: [],
        });

        dispatch(clearSearchFilters());
    };

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={true}
            enableDismissOnClose={true}
            enableDynamicSizing={false}
            enableOverDrag={false}
            android_keyboardInputMode="adjustResize"
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
        >
            {/* Header */}
            <View className="px-4 pb-3 border-b border-gray-200 bg-white mt-1">
                <View className="flex-row justify-between items-center w-full">
                    <Text className="text-xl font-bold text-gray-900">
                        Filtreler
                    </Text>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={handleResetFilters}
                            className="items-center justify-center"
                        >
                            <Text
                                style={{ fontSize: 13 }}
                                className="font-medium border px-4 py-2 border-gray-300 text-gray-700 rounded-full"
                            >
                                Sıfırla
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleApplyFilters}
                            disabled={isSearching}
                            className="items-center justify-center bg-gray-900 rounded-full px-4 py-2"
                        >
                            <Text
                                style={{ fontSize: 13 }}
                                className="font-medium text-white"
                            >
                                {isSearching ? '...' : 'Uygula'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Content */}
            <BottomSheetScrollView
                contentContainerStyle={{
                    paddingBottom: 20 + (insets.bottom || 16),
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Konum Filtresi */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <MapPin size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Konum
                        </Text>
                    </View>

                    <FilterDropdown
                        label="Şehir"
                        value={filters.il}
                        setValue={(value) => {
                            updateFilter('il', value);
                            updateFilter('ilce', []);
                            updateFilter('mahalle', []);
                        }}
                        options={allCities}
                        placeholder="Şehir seçiniz"
                        searchable={true}
                    />

                    <FilterDropdown
                        label="İlçe"
                        value={filters.ilce}
                        setValue={(value) => {
                            updateFilter('ilce', value);
                            updateFilter('mahalle', []);
                        }}
                        options={districtOptions}
                        placeholder="İlçe seçiniz"
                        disabled={!filters.il || districtOptions.length === 0}
                        multiSelect={true}
                        searchable={true}
                    />

                    <FilterDropdown
                        label="Mahalle"
                        value={filters.mahalle}
                        setValue={(value) => updateFilter('mahalle', value)}
                        options={neighborhoodOptions}
                        placeholder="Mahalle seçiniz"
                        disabled={!filters.il || filters.ilce.length === 0 || neighborhoodOptions.length === 0}
                        multiSelect={true}
                        searchable={true}
                    />
                </View>

                {/* Fiyat Filtresi */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <Coins size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Fiyat
                        </Text>
                    </View>

                    {/* Para Birimi Seçimi */}
                    <FilterDropdown
                        label="Para Birimi"
                        value={filters.paraBirimi}
                        setValue={(value) => updateFilter('paraBirimi', value)}
                        options={currencyOptions}
                        placeholder="Para birimi seçiniz"
                    />

                    {/* Hızlı Fiyat Seçimi */}
                    <Text className="text-gray-700 font-medium mb-3">Hızlı Seçim</Text>
                    {renderOptionButtons(
                        getQuickPriceOptions(filters.paraBirimi),
                        filters.quickPrice,
                        (value) => {
                            updateFilter('quickPrice', value);
                            if (value) {
                                updateFilter('minKiraFiyati', value.min ? String(value.min) : "");
                                updateFilter('maxKiraFiyati', value.max ? String(value.max) : "");
                            }
                        }
                    )}

                    {/* Manuel Fiyat Girişi */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">
                                Min. Fiyat ({getCurrencySymbol(filters.paraBirimi)})
                            </Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="0"
                                placeholderTextColor="#808080"
                                keyboardType="numeric"
                                value={filters.minKiraFiyati}
                                onChangeText={(text) => {
                                    updateFilter('minKiraFiyati', text);
                                    updateFilter('quickPrice', null);
                                }}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">
                                Max. Fiyat ({getCurrencySymbol(filters.paraBirimi)})
                            </Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="∞"
                                placeholderTextColor="#808080"
                                keyboardType="numeric"
                                value={filters.maxKiraFiyati}
                                onChangeText={(text) => {
                                    updateFilter('maxKiraFiyati', text);
                                    updateFilter('quickPrice', null);
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* Ev Özellikleri */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <Home size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Ev Özellikleri
                        </Text>
                    </View>

                    {/* Oda Türleri */}
                    <Text className="text-gray-700 font-medium mb-3">Oda Türü</Text>
                    {renderOptionButtons(
                        roomTypeOptions,
                        filters.odaSayilari,
                        (value) => updateFilter('odaSayilari', value),
                        true
                    )}

                    {/* Emlak Türleri */}
                    <Text className="text-gray-700 font-medium mb-3">Emlak Türü</Text>
                    {renderOptionButtons(
                        propertyTypeOptions,
                        filters.propertyTypes,
                        (value) => updateFilter('propertyTypes', value),
                        true
                    )}

                    {/* Metrekare */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Min. m²</Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.minBrutMetreKare}
                                onChangeText={(text) => updateFilter('minBrutMetreKare', text)}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Max. m²</Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="∞"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.maxBrutMetreKare}
                                onChangeText={(text) => updateFilter('maxBrutMetreKare', text)}
                            />
                        </View>
                    </View>

                    {/* Bina Yaşı */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Min. Bina Yaşı</Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.minBinaYasi}
                                onChangeText={(text) => updateFilter('minBinaYasi', text)}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Max. Bina Yaşı</Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="∞"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.maxBinaYasi}
                                onChangeText={(text) => updateFilter('maxBinaYasi', text)}
                            />
                        </View>
                    </View>

                    {/* Kat */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Min. Kat</Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.minKat}
                                onChangeText={(text) => updateFilter('minKat', text)}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-2">Max. Kat</Text>
                            <BottomSheetTextInput
                                style={styles.textInput}
                                placeholder="∞"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={filters.maxKat}
                                onChangeText={(text) => updateFilter('maxKat', text)}
                            />
                        </View>
                    </View>

                    {/* Isıtma Türü */}
                    <Text className="text-gray-700 font-medium mb-3">Isıtma Türü</Text>
                    {renderOptionButtons(
                        heatingTypeOptions,
                        filters.isitmaTipleri,
                        (value) => updateFilter('isitmaTipleri', value),
                        true
                    )}

                    {/* Boolean Özellikler */}
                    <Text className="text-gray-700 font-medium mb-3">Özellikler</Text>

                    <View className="space-y-3">
                        {[
                            { key: 'balkon', label: 'Balkon' },
                            { key: 'asansor', label: 'Asansör' },
                            { key: 'otopark', label: 'Otopark' },
                            { key: 'esyali', label: 'Eşyalı' },
                            { key: 'siteIcerisinde', label: 'Site İçerisinde' },
                        ].map(({ key, label }) => (
                            <View key={key} className="flex-row justify-between items-center py-2">
                                <Text className="text-gray-700 font-medium">{label}</Text>
                                <Switch
                                    value={filters[key] === true}
                                    onValueChange={(value) => updateFilter(key, value ? true : null)}
                                    trackColor={{ false: '#d1d5db', true: '#059669' }}
                                    thumbColor={filters[key] === true ? '#ffffff' : '#ffffff'}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Politikalar */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <User size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Politikalar
                        </Text>
                    </View>

                    <FilterDropdown
                        label="Evcil Hayvan Politikası"
                        value={filters.petPolicies}
                        setValue={(value) => updateFilter('petPolicies', value)}
                        options={petPolicyOptions}
                        placeholder="Seçiniz"
                        multiSelect={true}
                    />

                    <FilterDropdown
                        label="Öğrenci Politikası"
                        value={filters.studentPolicies}
                        setValue={(value) => updateFilter('studentPolicies', value)}
                        options={studentPolicyOptions}
                        placeholder="Seçiniz"
                        multiSelect={true}
                    />

                    <FilterDropdown
                        label="Sigara Politikası"
                        value={filters.smokingPolicies}
                        setValue={(value) => updateFilter('smokingPolicies', value)}
                        options={smokingPolicyOptions}
                        placeholder="Seçiniz"
                        multiSelect={true}
                    />

                    <FilterDropdown
                        label="Aidat Sorumluluğu"
                        value={filters.maintenanceFeeResponsibilities}
                        setValue={(value) => updateFilter('maintenanceFeeResponsibilities', value)}
                        options={maintenanceFeeOptions}
                        placeholder="Seçiniz"
                        multiSelect={true}
                    />
                </View>

                {/* Arama */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <Search size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            Arama
                        </Text>
                    </View>

                    <Text className="text-gray-700 font-medium mb-2">Anahtar Kelime</Text>
                    <BottomSheetTextInput
                        style={[styles.textInput, { marginBottom: 16 }]}
                        placeholder="Ev, daire, villa..."
                        placeholderTextColor="#9CA3AF"
                        value={filters.searchKeyword}
                        onChangeText={(text) => updateFilter('searchKeyword', text)}
                    />

                    <Text className="text-gray-700 font-medium mb-2">Site Adı</Text>
                    <BottomSheetTextInput
                        style={[styles.textInput, { marginBottom: 16 }]}
                        placeholder="Site adı..."
                        placeholderTextColor="#9CA3AF"
                        value={filters.siteAdi}
                        onChangeText={(text) => updateFilter('siteAdi', text)}
                    />
                </View>

                {/* Status */}
                <View className="bg-white mt-4 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                        <Filter size={18} color="#374151" />
                        <Text className="text-lg font-semibold text-gray-900 ml-2">
                            İlan Durumu
                        </Text>
                    </View>

                    <Text className="text-gray-700 font-medium mb-3">Durum</Text>
                    {renderOptionButtons(
                        statusOptions,
                        filters.statuses,
                        (value) => updateFilter('statuses', value),
                        true
                    )}
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
    },
    handleIndicator: {
        backgroundColor: '#d1d5db',
        width: 40,
        height: 4,
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#111827',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
});

export default PropertiesFilterModal;
