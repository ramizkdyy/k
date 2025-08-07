// src/hooks/useFypCacheTracker.js
import { useRef } from 'react';

export const useFypCacheTracker = () => {
    const lastCallRef = useRef(null);

    const shouldUseCache = () => {
        const now = Date.now();
        const CACHE_THRESHOLD = 10000; // 10 saniye

        // Eğer son çağrı 10 saniye içindeyse cache kullan
        const shouldCache = lastCallRef.current && (now - lastCallRef.current) < CACHE_THRESHOLD;

        // Debug için log
        if (shouldCache) {
            console.log('🚀 FYP Cache - Using Cache:', {
                lastCall: new Date(lastCallRef.current).toLocaleTimeString(),
                currentCall: new Date(now).toLocaleTimeString(),
                timeDiff: `${(now - lastCallRef.current) / 1000}s`,
                isCached: true
            });
        } else {
            console.log('🆕 FYP Cache - Fresh Call:', {
                lastCall: lastCallRef.current ? new Date(lastCallRef.current).toLocaleTimeString() : 'First call',
                currentCall: new Date(now).toLocaleTimeString(),
                isCached: false
            });
        }

        // Timestamp'i güncelle
        lastCallRef.current = now;

        return shouldCache;
    };

    // Manuel cache reset fonksiyonu
    const resetCache = () => {
        console.log('🔄 FYP Cache manually reset');
        lastCallRef.current = null;
    };

    // Cache bilgilerini döndür
    const getCacheInfo = () => {
        const now = Date.now();
        return {
            lastCallTimestamp: lastCallRef.current,
            lastCallTime: lastCallRef.current ? new Date(lastCallRef.current).toLocaleTimeString() : null,
            timeSinceLastCall: lastCallRef.current ? now - lastCallRef.current : null,
            isWithinCacheThreshold: lastCallRef.current ? (now - lastCallRef.current) < 10000 : false,
        };
    };

    return {
        shouldUseCache,
        resetCache,
        getCacheInfo
    };
};