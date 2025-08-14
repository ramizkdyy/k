// src/redux/slices/searchSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import { searchApiSlice } from "../api/searchApiSlice";


const initialState = {
    searchResults: [],
    isLoading: false,
    error: null,
    currentSearchFilters: {
        // Konump
        il: "",
        ilce: [],
        mahalle: [],
        latitude: null,
        longitude: null,
        maxDistance: null,

        // Fiyat
        minKiraFiyati: null,
        maxKiraFiyati: null,
        minDepozito: null,
        maxDepozito: null,
        paraBirimi: "TRY",

        // Metrekare
        minBrutMetreKare: null,
        maxBrutMetreKare: null,
        minNetMetreKare: null,
        maxNetMetreKare: null,

        // Oda sayıları
        odaSayilari: [], // ["1+0", "1+1", "2+1"]

        // Bina özellikleri
        minBinaYasi: null,
        maxBinaYasi: null,
        minKat: null,
        maxKat: null,
        minToplamKat: null,
        maxToplamKat: null,

        // Emlak türleri
        propertyTypes: [], // [1, 2, 3] - enum değerler

        // Isıtma
        isitmaTipleri: [], // ["Doğalgaz", "Elektrik"]

        // Oda sayıları
        minBanyoSayisi: null,
        maxBanyoSayisi: null,
        minYatakOdasiSayisi: null,
        maxYatakOdasiSayisi: null,

        // Politikalar
        petPolicies: [], // [1, 2] - enum değerler
        studentPolicies: [], // [1, 2] - enum değerler
        smokingPolicies: [], // [1, 2] - enum değerler
        maintenanceFeeResponsibilities: [], // [1, 2] - enum değerler

        // Özellikler (boolean)
        balkon: null,
        asansor: null,
        otopark: null,
        esyali: null,
        siteIcerisinde: null,
        takas: null,

        // Kiralama süresi
        minKiralamaSuresi: null,
        maxKiralamaSuresi: null,
        rentalPeriods: [], // [1, 2] - enum değerler

        // Arama
        searchKeyword: "",
        siteAdi: "",

        // Status
        statuses: [], // [0, 1, 2] - 0: Aktif, 1: Pasif, 2: Kapalı

        // Sayfalama ve sıralama
        sortBy: "CreatedDate",
        page: 1,
        pageSize: 20
    },
    totalResults: 0,
    totalPages: 0,
    hasNextPage: false,
};

const searchSlice = createSlice({
    name: "search",
    initialState,
    reducers: {
        setSearchFilters: (state, action) => {
            state.currentSearchFilters = {
                ...state.currentSearchFilters,
                ...action.payload
            };
        },

        clearSearchFilters: (state) => {
            state.currentSearchFilters = {
                ...initialState.currentSearchFilters,
                page: 1 // Reset to first page
            };
        },

        setSearchResults: (state, action) => {
            state.searchResults = action.payload;
        },

        appendSearchResults: (state, action) => {
            // For pagination - append new results
            state.searchResults = [...state.searchResults, ...action.payload];
        },

        clearSearchResults: (state) => {
            state.searchResults = [];
            state.totalResults = 0;
            state.totalPages = 0;
            state.hasNextPage = false;
        },

        setSearchPage: (state, action) => {
            state.currentSearchFilters.page = action.payload;
        },

        incrementSearchPage: (state) => {
            if (state.hasNextPage) {
                state.currentSearchFilters.page += 1;
            }
        },

        setSearchLoading: (state, action) => {
            state.isLoading = action.payload;
        },

        setSearchError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        clearSearchError: (state) => {
            state.error = null;
        },

        // Quick filter actions
        setLocationFilter: (state, action) => {
            const { il, ilce, mahalle } = action.payload;
            state.currentSearchFilters.il = il || "";
            state.currentSearchFilters.ilce = ilce || [];
            state.currentSearchFilters.mahalle = mahalle || [];
        },

        setPriceFilter: (state, action) => {
            const { minKiraFiyati, maxKiraFiyati } = action.payload;
            state.currentSearchFilters.minKiraFiyati = minKiraFiyati;
            state.currentSearchFilters.maxKiraFiyati = maxKiraFiyati;
        },

        setRoomFilter: (state, action) => {
            state.currentSearchFilters.odaSayilari = action.payload;
        },

        setPropertyTypeFilter: (state, action) => {
            state.currentSearchFilters.propertyTypes = action.payload;
        },

        // Reset pagination when filters change
        resetPagination: (state) => {
            state.currentSearchFilters.page = 1;
            state.searchResults = [];
            state.totalResults = 0;
            state.totalPages = 0;
            state.hasNextPage = false;
        }
    },
    extraReducers: (builder) => {
        // Handle search API responses
        builder.addMatcher(
            searchApiSlice.endpoints.searchPosts.matchPending,
            (state) => {
                state.isLoading = true;
                state.error = null;
            }
        );

        builder.addMatcher(
            searchApiSlice.endpoints.searchPosts.matchFulfilled,
            (state, { payload, meta }) => {
                state.isLoading = false;

                if (payload && payload.isSuccess) {
                    const { result } = payload;
                    const isFirstPage = meta.arg.originalArgs?.page === 1;

                    if (isFirstPage) {
                        // First page - replace results
                        state.searchResults = result.data || [];
                    } else {
                        // Subsequent pages - append results
                        state.searchResults = [...state.searchResults, ...(result.data || [])];
                    }

                    // Update pagination info
                    state.totalResults = result.totalCount || 0;
                    state.totalPages = result.totalPages || 0;
                    state.hasNextPage = result.hasNextPage || false;
                }
            }
        );

        builder.addMatcher(
            searchApiSlice.endpoints.searchPosts.matchRejected,
            (state, { payload }) => {
                state.isLoading = false;
                state.error = payload?.data?.message || "Arama sırasında hata oluştu";
            }
        );
        // Handle search API responses
        builder.addMatcher(
            apiSlice.endpoints.searchPosts?.matchPending,
            (state) => {
                state.isLoading = true;
                state.error = null;
            }
        );

        builder.addMatcher(
            apiSlice.endpoints.searchPosts?.matchFulfilled,
            (state, { payload, meta }) => {
                state.isLoading = false;

                if (payload && payload.isSuccess) {
                    const { result } = payload;
                    const isFirstPage = meta.arg.originalArgs?.page === 1;

                    if (isFirstPage) {
                        // First page - replace results
                        state.searchResults = result.data || [];
                    } else {
                        // Subsequent pages - append results
                        state.searchResults = [...state.searchResults, ...(result.data || [])];
                    }

                    // Update pagination info
                    state.totalResults = result.totalCount || 0;
                    state.totalPages = result.totalPages || 0;
                    state.hasNextPage = result.hasNextPage || false;
                }
            }
        );

        builder.addMatcher(
            apiSlice.endpoints.searchPosts?.matchRejected,
            (state, { payload }) => {
                state.isLoading = false;
                state.error = payload?.data?.message || "Arama sırasında hata oluştu";
            }
        );
    },
});

export const {
    setSearchFilters,
    clearSearchFilters,
    setSearchResults,
    appendSearchResults,
    clearSearchResults,
    setSearchPage,
    incrementSearchPage,
    setSearchLoading,
    setSearchError,
    clearSearchError,
    setLocationFilter,
    setPriceFilter,
    setRoomFilter,
    setPropertyTypeFilter,
    resetPagination
} = searchSlice.actions;

export default searchSlice.reducer;

// Selectors
export const selectSearchResults = (state) => state.search.searchResults;
export const selectSearchFilters = (state) => state.search.currentSearchFilters;
export const selectSearchLoading = (state) => state.search.isLoading;
export const selectSearchError = (state) => state.search.error;
export const selectSearchPagination = (state) => ({
    page: state.search.currentSearchFilters.page,
    totalResults: state.search.totalResults,
    totalPages: state.search.totalPages,
    hasNextPage: state.search.hasNextPage,
});

// Helper selectors
export const selectHasActiveFilters = (state) => {
    const filters = state.search.currentSearchFilters;
    return (
        filters.il ||
        filters.ilce.length > 0 ||
        filters.mahalle.length > 0 ||
        filters.minKiraFiyati ||
        filters.maxKiraFiyati ||
        filters.odaSayilari.length > 0 ||
        filters.propertyTypes.length > 0 ||
        filters.searchKeyword
    );
};

export const selectFilterCount = (state) => {
    const filters = state.search.currentSearchFilters;
    let count = 0;

    if (filters.il) count++;
    if (filters.ilce.length > 0) count++;
    if (filters.mahalle.length > 0) count++;
    if (filters.minKiraFiyati || filters.maxKiraFiyati) count++;
    if (filters.odaSayilari.length > 0) count++;
    if (filters.propertyTypes.length > 0) count++;
    if (filters.searchKeyword) count++;
    if (filters.balkon !== null) count++;
    if (filters.asansor !== null) count++;
    if (filters.otopark !== null) count++;
    if (filters.esyali !== null) count++;

    return count;
};