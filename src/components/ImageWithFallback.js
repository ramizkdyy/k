/**
 * ImageWithFallback - Ortak resim bileşeni
 * 
 * Daha önce NearbyProperties.js ve PostsScreen.js'de inline olarak tanımlıydı.
 * Tek bir kaynak haline getirilerek tüm ekranlarda tutarlı resim yükleme davranışı sağlanıyor.
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Home } from "lucide-react-native";

// Hata durumunda gösterilen placeholder
const ErrorPlaceholder = React.memo(({ width, height, borderRadius = 30 }) => (
  <View
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: "#f5f5f5",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Home size={Math.min(width || 200, height || 200) * 0.15} color="#ccc" />
  </View>
));

// Yükleme sırasında gösterilen placeholder
const LoadingPlaceholder = React.memo(({ style, borderRadius }) => (
  <View
    style={{
      ...style,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: borderRadius || 30,
      backgroundColor: "#f5f5f5",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Home size={20} color="#ccc" />
  </View>
));

const ImageWithFallback = React.memo(
  ({
    source,
    style,
    contentFit = "cover",
    className = "",
    fallbackWidth,
    fallbackHeight,
    borderRadius,
    placeholder,
    recyclingKey,
    ...props
  }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const sourceUri = source?.uri;

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoading(false);
    }, []);

    const handleLoadStart = useCallback(() => setIsLoading(true), []);
    const handleLoad = useCallback(() => setIsLoading(false), []);

    // URI değişince hata durumunu sıfırla
    useEffect(() => {
      if (sourceUri) {
        setHasError(false);
        setIsLoading(false);
      }
    }, [sourceUri]);

    if (hasError || !sourceUri) {
      return (
        <ErrorPlaceholder
          width={fallbackWidth || style?.width || 200}
          height={fallbackHeight || style?.height || 200}
          borderRadius={borderRadius || style?.borderRadius || 30}
        />
      );
    }

    return (
      <View style={{ position: "relative" }}>
        <Image
          source={source}
          style={style}
          className={className}
          contentFit={contentFit}
          onError={handleError}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          placeholder={
            placeholder || {
              blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
            }
          }
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey || sourceUri}
          transition={0}
          {...props}
        />
        {isLoading && (
          <LoadingPlaceholder
            style={style}
            borderRadius={borderRadius || style?.borderRadius}
          />
        )}
      </View>
    );
  }
);

export { ErrorPlaceholder, LoadingPlaceholder };
export default ImageWithFallback;
