// src/redux/api/searchApiSlice.js
import { apiSlice } from "./apiSlice";

export const searchApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // POST /api/PostSearch/search - Ana arama endpoint'i
        searchPosts: builder.mutation({
            query: (searchFilters) => ({
                url: "/api/PostSearch/search",
                method: "POST",
                body: searchFilters,
            }),
            providesTags: (result) => [
                { type: "Post", id: "SEARCH" },
                ...(result?.result?.data || []).map(({ id }) => ({
                    type: "Post",
                    id
                })),
            ],
        }),

        // GET /api/PostSearch/search - Filtreleri almak için (eğer gerekirse)
        getSearchFilters: builder.query({
            query: (params) => ({
                url: "/api/PostSearch/search",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "SearchFilters", id: "LIST" }],
        }),
        // YENİ: Şehir önerileri
        getCitySuggestions: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/suggestions/il?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0, // Cache'lemiyoruz, her aramada yeni sonuç
        }),

        // YENİ: İlçe önerileri
        getDistrictSuggestions: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/suggestions/ilce?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0,
        }),

        // YENİ: Mahalle önerileri
        getNeighborhoodSuggestions: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/suggestions/mahalle?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0,
        }),

        // YENİ: Genel öneri endpoint'i (type parametreli)
        getSuggestions: builder.query({
            query: ({ type, keyword }) => ({
                url: `/api/PostSearch/suggestions/${type}?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0,
        }),

        // Hızlı arama için basit endpoint (eğer varsa)
        quickSearch: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/quick?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            providesTags: [{ type: "Post", id: "QUICK_SEARCH" }],
        }),

        // YENİ: Şehir önerileri
        getCitySuggestions: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/suggestions/il?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0, // Cache'lemiyoruz, her aramada yeni sonuç
        }),

        // YENİ: İlçe önerileri
        getDistrictSuggestions: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/suggestions/ilce?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0,
        }),

        // YENİ: Mahalle önerileri
        getNeighborhoodSuggestions: builder.query({
            query: (keyword) => ({
                url: `/api/PostSearch/suggestions/mahalle?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0,
        }),

        // YENİ: Genel öneri endpoint'i (type parametreli)
        getSuggestions: builder.query({
            query: ({ type, keyword }) => ({
                url: `/api/PostSearch/suggestions/${type}?keyword=${encodeURIComponent(keyword)}`,
                method: "GET",
            }),
            keepUnusedDataFor: 0,
        }),

        // Popüler aramalar (eğer varsa)
        getPopularSearches: builder.query({
            query: () => ({
                url: "/api/PostSearch/popular",
                method: "GET",
            }),
            providesTags: [{ type: "SearchFilters", id: "POPULAR" }],
        }),

        // Arama geçmişi (eğer varsa)
        getSearchHistory: builder.query({
            query: () => ({
                url: "/api/PostSearch/history",
                method: "GET",
            }),
            providesTags: [{ type: "SearchFilters", id: "HISTORY" }],
        }),

        // Arama geçmişini temizle
        clearSearchHistory: builder.mutation({
            query: () => ({
                url: "/api/PostSearch/history",
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "SearchFilters", id: "HISTORY" }],
        }),
    }),
});

export const {
    useSearchPostsMutation,
    useGetSearchFiltersQuery,
    useQuickSearchQuery,
    useGetCitySuggestionsQuery,
    useGetDistrictSuggestionsQuery,
    useGetNeighborhoodSuggestionsQuery,
    useGetSuggestionsQuery,
    useLazyGetCitySuggestionsQuery,
    useLazyGetDistrictSuggestionsQuery,
    useLazyGetNeighborhoodSuggestionsQuery,
    useLazyGetSuggestionsQuery,
    useGetPopularSearchesQuery,
    useGetSearchHistoryQuery,
    useClearSearchHistoryMutation,
} = searchApiSlice;