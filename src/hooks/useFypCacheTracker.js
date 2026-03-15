// src/hooks/useFypCacheTracker.js
import { useRef, useCallback } from 'react';

export const useFypCacheTracker = () => {
    // Son gerçek API çağrısının zamanı
    const lastApiCallTimeRef = useRef(null);

    const CACHE_DURATION = 10000; // 10 saniye

    
    const getCacheValueForQuery = useCallback(() => {
        const now = Date.now();

        if (!lastApiCallTimeRef.current) {
            return false;
        }

        const timeSinceLastCall = now - lastApiCallTimeRef.current;
        const shouldCache = timeSinceLastCall < CACHE_DURATION;



        return shouldCache;
    }, []);

    // 🔧 API çağrısını kaydet (sadece fresh response için)
    const recordApiCall = useCallback(() => {
        const now = Date.now();
        lastApiCallTimeRef.current = now;

    }, []);

    // Manuel cache reset
    const resetCache = useCallback(() => {
        lastApiCallTimeRef.current = null;
    }, []);

    // Debug bilgileri
    const getCacheInfo = useCallback(() => {
        const now = Date.now();

        if (!lastApiCallTimeRef.current) {
            return {
                status: 'İlk çağrı bekleniyor',
                lastCallTime: null,
                timeSinceLastCall: null,
                timeUntilExpire: null
            };
        }

        const timeSinceLastCall = now - lastApiCallTimeRef.current;
        const timeUntilExpire = Math.max(0, CACHE_DURATION - timeSinceLastCall);
        const currentCacheStatus = timeSinceLastCall < CACHE_DURATION;

        return {
            status: currentCacheStatus ? 'Cache AKTIF' : 'Cache KAPALI',
            lastCallTime: new Date(lastApiCallTimeRef.current).toLocaleTimeString(),
            timeSinceLastCall: `${(timeSinceLastCall / 1000).toFixed(1)} saniye`,
            timeUntilExpire: `${(timeUntilExpire / 1000).toFixed(1)} saniye`,
        };
    }, []);

    return {
        getCacheValueForQuery,    // ✅ Query için cache değeri
        recordApiCall,            // Fresh API response geldiğinde çağır
        resetCache,               // Manuel reset
        getCacheInfo              // Debug bilgileri
    };
};