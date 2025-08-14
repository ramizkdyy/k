// src/hooks/useFypCacheTracker.js
import { useRef, useState, useCallback } from 'react';

export const useFypCacheTracker = () => {
    // Son gerçek API çağrısının zamanı
    const lastApiCallTimeRef = useRef(null);
    // Cache state'i - component re-render'larında korunur
    const [cacheEnabled, setCacheEnabled] = useState(false);

    // Cache durumunu hesapla ve state'i güncelle
    const calculateCacheStatus = useCallback(() => {
        const now = Date.now();
        const CACHE_DURATION = 10000; // 10 saniye

        if (!lastApiCallTimeRef.current) {
            // İlk çağrı
            console.log('🆕 İlk API çağrısı yapılıyor - Cache: FALSE', {
                time: new Date(now).toLocaleTimeString()
            });
            lastApiCallTimeRef.current = now;
            setCacheEnabled(false);
            return false;
        }

        const timeSinceLastCall = now - lastApiCallTimeRef.current;

        if (timeSinceLastCall < CACHE_DURATION) {
            // 10 saniye içinde - CACHE KULLAN
            console.log('🚀 Cache AKTIF - 10 saniye içinde', {
                currentTime: new Date(now).toLocaleTimeString(),
                lastCallTime: new Date(lastApiCallTimeRef.current).toLocaleTimeString(),
                timeDiff: `${(timeSinceLastCall / 1000).toFixed(1)} saniye`
            });
            setCacheEnabled(true);
            return true;
        } else {
            // 10 saniye geçmiş - YENİ DATA
            console.log('⏰ Cache SÜRESİ DOLDU - Yeni data çekiliyor', {
                currentTime: new Date(now).toLocaleTimeString(),
                lastCallTime: new Date(lastApiCallTimeRef.current).toLocaleTimeString(),
                timeDiff: `${(timeSinceLastCall / 1000).toFixed(1)} saniye`
            });
            lastApiCallTimeRef.current = now;
            setCacheEnabled(false);
            return false;
        }
    }, []);

    // Manuel refresh için cache reset
    const resetCache = useCallback(() => {
        console.log('🔄 Cache manuel olarak resetlendi');
        lastApiCallTimeRef.current = null;
        setCacheEnabled(false);
    }, []);

    // Debug bilgileri
    const getCacheInfo = useCallback(() => {
        const now = Date.now();
        if (!lastApiCallTimeRef.current) {
            return {
                status: 'İlk çağrı bekleniyor',
                cacheEnabled: false
            };
        }

        const timeSinceLastCall = now - lastApiCallTimeRef.current;
        const timeUntilExpire = Math.max(0, 10000 - timeSinceLastCall);

        return {
            status: cacheEnabled ? 'Cache AKTIF' : 'Cache KAPALI',
            lastCallTime: new Date(lastApiCallTimeRef.current).toLocaleTimeString(),
            timeSinceLastCall: `${(timeSinceLastCall / 1000).toFixed(1)} saniye`,
            timeUntilExpire: `${(timeUntilExpire / 1000).toFixed(1)} saniye`,
            cacheEnabled: cacheEnabled
        };
    }, [cacheEnabled]);

    return {
        cacheEnabled,           // State olarak tutulan cache durumu
        calculateCacheStatus,   // Cache durumunu hesapla
        resetCache,            // Manuel reset
        getCacheInfo          // Debug bilgileri
    };
};
