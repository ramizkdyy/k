import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Dimensions,
    ScrollView,
    StyleSheet,
    Animated,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import ReAnimated, {
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
import {
    faTimes,
    faInfo,
    faBed,
    faShower,
    faRuler,
    faBuilding,
    faCalendar,
    faMoneyBills,
    faCoins,
    faUsers,
    faStar,
    faHome,
    faLocationDot,
    faUser,
    faEnvelope,
    faPhone,
    faClock,
    faEye,
    faThumbsUp,
    faCheckCircle,
    faXCircle,
    faKey,
    faParking,
    faElevator,
    faTreeCity,
    faDoorOpen,
    faFire,
    faBedBunk,
    faUtensils,
    faBarsProgress,
    faWifi,
    faCheck,
    faTv,
    faSnowflake,
    faShieldCheck,
    faCamera,
    faHashtag,
    faGlobe,
    faAward,
    faCalendarCheck,
    faDatabase,
    faCode,
    faHeart,
} from "@fortawesome/pro-solid-svg-icons";

const { height: SCREEN_HEIGHT, width } = Dimensions.get('window');

const ExploreDetailModal = ({
    visible,
    onClose,
    listing
}) => {
    const insets = useSafeAreaInsets();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = currentUser?.role || currentUser?.userRole;

    // Modal boyutları - CommentsBottomSheet'teki gibi
    const SNAP_POINTS = {
        MEDIUM: SCREEN_HEIGHT * 0.35,  // %65 ekran (orta boyut)
        LARGE: SCREEN_HEIGHT * 0.1,   // %95 ekran (büyük boyut)
        CLOSED: SCREEN_HEIGHT
    };

    // Animated values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // State
    const [currentSnapPoint, setCurrentSnapPoint] = useState(SNAP_POINTS.MEDIUM);

    // Match Score gösterim fonksiyonu
    const getMatchScoreInfo = (score) => {
        const percentage = score * 100;
        if (percentage >= 80)
            return {
                level: "excellent",
                color: "#10b981",
                text: "Mükemmel",
                bgColor: "#dcfce7",
            };
        if (percentage >= 60)
            return {
                level: "good",
                color: "#3b82f6",
                text: "Çok İyi",
                bgColor: "#dbeafe",
            };
        if (percentage >= 40)
            return {
                level: "medium",
                color: "#f59e0b",
                text: "İyi",
                bgColor: "#fef3c7",
            };
        return {
            level: "weak",
            color: "#ef4444",
            text: "Orta",
            bgColor: "#fee2e2",
        };
    };

    // Match score işleme fonksiyonu
    const getProcessedMatchScore = (rawMatchScore) => {
        if (!rawMatchScore) return null;

        let processedScore = null;

        if (typeof rawMatchScore === 'object' && rawMatchScore.matchScore !== undefined) {
            processedScore = rawMatchScore.matchScore / 100;
        } else if (typeof rawMatchScore === 'number') {
            processedScore = rawMatchScore > 1 ? rawMatchScore / 100 : rawMatchScore;
        }

        return processedScore;
    };

    // Match Score Bar Component
    const MatchScoreBar = ({ matchScore, showBar = true, size = "sm" }) => {
        const progressAnim = useRef(new Animated.Value(0)).current;
        const timeoutRef = useRef(null);

        const scoreInfo = getMatchScoreInfo(matchScore);

        const sizes = {
            sm: {
                barHeight: 5,
                iconSize: 12,
                textSize: 12,
                containerPadding: 2,
                barWidth: width * 0.6,
            },
        };

        const currentSize = sizes[size];

        useEffect(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                Animated.timing(progressAnim, {
                    toValue: matchScore,
                    duration: 800,
                    useNativeDriver: false,
                }).start();
            }, 200);

            return () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        }, [matchScore]);

        if (showBar) {
            return (
                <View style={{ marginTop: currentSize.containerPadding * 2 }}>
                    <View className="flex-row items-center">
                        <View
                            className="bg-gray-100 rounded-full overflow-hidden"
                            style={{
                                height: currentSize.barHeight,
                                width: currentSize.barWidth,
                                marginRight: 12,
                            }}
                        >
                            <Animated.View
                                style={{
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0%", "100%"],
                                        extrapolate: "clamp",
                                    }),
                                    backgroundColor: scoreInfo.color,
                                    height: "100%",
                                    borderRadius: currentSize.barHeight / 2,
                                }}
                            />
                        </View>
                        <Text
                            className="font-medium ml-1"
                            style={{
                                color: scoreInfo.color,
                                fontSize: currentSize.textSize,
                            }}
                        >
                            %{Math.round(matchScore * 100)}
                        </Text>
                    </View>
                    <Text
                        className="text-xs mt-1"
                        style={{
                            color: scoreInfo.color,
                        }}
                    >
                        {scoreInfo.text} Uyumluluk
                    </Text>
                </View>
            );
        }

        return (
            <View className="flex-row items-center">
                <FontAwesomeIcon
                    color={scoreInfo.color}
                    icon={faHeart}
                    size={currentSize.iconSize}
                />
                <Text
                    className="font-medium ml-1"
                    style={{
                        color: scoreInfo.color,
                        fontSize: currentSize.textSize,
                    }}
                >
                    %{Math.round(matchScore * 100)} {scoreInfo.text}
                </Text>
            </View>
        );
    };

    // Snap to position - CommentsBottomSheet'teki aynı mantık
    const snapTo = useCallback((position) => {
        console.log(`Modal snap to position: ${position}`);

        if (position === SNAP_POINTS.CLOSED) {
            // Modal kapanış animasyonu
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0, { duration: 300 });

            // Animasyon bittikten sonra modal'ı kapat
            setTimeout(() => onClose(), 300);
            return;
        }

        // CurrentSnapPoint'i güncelle
        setCurrentSnapPoint(position);

        // Modal animasyonu
        translateY.value = withSpring(position, {
            damping: 80,
            stiffness: 400,
        });

        // Backdrop opacity'i ayarla
        const newOpacity = position === SNAP_POINTS.LARGE ? 0.7 : 0.5;
        backdropOpacity.value = withTiming(newOpacity, { duration: 200 });

        console.log(`Modal snap completed to: ${position === SNAP_POINTS.MEDIUM ? 'MEDIUM' : 'LARGE'}`);
    }, [onClose]);

    // Pan gesture - CommentsBottomSheet'teki aynı mantık
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            const newY = currentSnapPoint + event.translationY;

            if (event.translationY > 0) {
                // AŞAĞI hareket - Modal kapanma/küçülme yönü
                translateY.value = Math.min(newY, SCREEN_HEIGHT);
                const progress = event.translationY / 200;
                backdropOpacity.value = Math.max(0, 0.5 - progress * 0.5);
            } else if (event.translationY < 0) {
                // YUKARI hareket - Modal büyüme yönü
                translateY.value = Math.max(newY, SNAP_POINTS.LARGE);
                const progress = Math.abs(event.translationY) / 200;
                backdropOpacity.value = Math.min(0.7, 0.5 + progress * 0.2);
            }
        })
        .onEnd((event) => {
            const velocity = event.velocityY;
            const translation = event.translationY;

            console.log(`Gesture ended - Translation: ${translation}, Velocity: ${velocity}, Current: ${currentSnapPoint === SNAP_POINTS.MEDIUM ? 'MEDIUM' : 'LARGE'}`);

            // ÇOK HIZLI AŞAĞI HAREKET - Sadece MEDIUM modaldan direkt kapatmaya izin ver
            if (velocity > 1000 && currentSnapPoint === SNAP_POINTS.MEDIUM) {
                console.log('Modal kapatılıyor - çok hızlı aşağı hareket (sadece MEDIUM\'dan)');
                runOnJS(snapTo)(SNAP_POINTS.CLOSED);
                return;
            }

            // BÜYÜK MODAL'dan (LARGE) hareket
            if (currentSnapPoint === SNAP_POINTS.LARGE) {
                if (translation > 30 || velocity > 300) {
                    console.log('Büyük modaldan orta modala geçiliyor');
                    runOnJS(snapTo)(SNAP_POINTS.MEDIUM);
                } else {
                    console.log('Büyük modal konumunda kalıyor');
                    runOnJS(snapTo)(SNAP_POINTS.LARGE);
                }
            }
            // ORTA MODAL'dan (MEDIUM) hareket
            else if (currentSnapPoint === SNAP_POINTS.MEDIUM) {
                // Yukarı hareket - büyük modala geç
                if (translation < -80 || velocity < -600) {
                    console.log('Orta modaldan büyük modala geçiliyor');
                    runOnJS(snapTo)(SNAP_POINTS.LARGE);
                }
                // Aşağı hareket - kapat
                else if (translation > 120 || velocity > 800) {
                    console.log('Modal kapatılıyor - orta modaldan yeterli aşağı hareket');
                    runOnJS(snapTo)(SNAP_POINTS.CLOSED);
                }
                // Küçük hareket - aynı yerde kal
                else {
                    console.log('Orta modal konumunda kalıyor');
                    runOnJS(snapTo)(SNAP_POINTS.MEDIUM);
                }
            }
            // Fallback
            else {
                console.log('Fallback - mevcut konuma dönülüyor');
                runOnJS(snapTo)(currentSnapPoint);
            }
        })
        .shouldCancelWhenOutside(false);

    // Modal açılış/kapanış
    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(SNAP_POINTS.MEDIUM, {
                damping: 80,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(0.5, { duration: 300 });
            setCurrentSnapPoint(SNAP_POINTS.MEDIUM);
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
        snapTo(SNAP_POINTS.CLOSED);
    };

    // Backdrop press handler
    const handleBackdropPress = () => {
        snapTo(SNAP_POINTS.CLOSED);
    };

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const modalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Helper functions
    const formatCurrency = (amount, currency) => {
        if (!amount) return "Belirtilmemiş";
        const symbols = {
            'TL': '₺',
            'USD': '$',
            'EUR': '€'
        };
        return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Belirtilmemiş";
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPropertyTypeName = (type) => {
        const types = {
            0: "Daire",
            1: "Butik Otel",
            2: "Otel",
            3: "Konaklama",
            5: "B&B",
            6: "Apart",
            8: "Ev",
            16: "Mağara",
        };
        return types[type] || "Belirtilmemiş";
    };

    const getRoomTypeName = (type) => {
        const types = {
            0: "Tüm ev/daire",
            1: "Özel oda",
            2: "Ortak oda"
        };
        return types[type] || "Belirtilmemiş";
    };

    const getPriceStatusName = (status) => {
        const statuses = {
            0: "Tarih ekleyin",
            1: "Belirtilmemiş"
        };
        return statuses[status] || "Bilinmiyor";
    };

    const getStatusText = (status) => {
        const statusMap = {
            0: { text: "Aktif", color: "text-green-600" },
            1: { text: "Kiralandı", color: "text-blue-600" },
            2: { text: "Kapalı", color: "text-red-600" }
        };
        return statusMap[status] || { text: "Bilinmiyor", color: "text-gray-600" };
    };

    const renderDetailItem = (icon, label, value, valueColor = "text-black") => (
        <View className="flex-row items-center py-2">
            <View className="items-center">
                <FontAwesomeIcon icon={icon} size={18} color="#111827" />
            </View>
            <Text className="text-gray-900 text-m flex-1 ml-4">{label}:</Text>
            <Text className={`${valueColor} text-sm font-medium ml-2 flex-1 text-right`}>
                {value || "Belirtilmemiş"}
            </Text>
        </View>
    );

    const renderBooleanItem = (icon, label, value) => {
        const isTrue = value === true || value === "true" || value === 1;
        return renderDetailItem(
            icon,
            label,
            isTrue ? "Evet" : "Hayır",
            isTrue ? "text-green-700" : "text-red-700"
        );
    };

    if (!visible || !listing) return null;

    const isNormalPost = listing.postType === "NormalPost";
    const post = listing.post;
    const metaPost = listing.metaPost;
    const statusInfo = isNormalPost ? getStatusText(post?.status) : null;

    // Match score'u işle
    let processedMatchScore = null;
    if (isNormalPost && post) {
        const rawMatchScore = listing.matchScore || post.matchScore;
        processedMatchScore = getProcessedMatchScore(rawMatchScore);
    } else if (listing.matchScore) {
        processedMatchScore = getProcessedMatchScore(listing.matchScore);
    }

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
                <ReAnimated.View style={[styles.backdrop, backdropStyle]}>
                    <TouchableWithoutFeedback onPress={handleBackdropPress}>
                        <View style={styles.backdropTouchable} />
                    </TouchableWithoutFeedback>
                </ReAnimated.View>

                {/* Modal Content */}
                <ReAnimated.View style={[styles.modal, modalStyle]}>
                    {/* Header - GESTİKLİ ALAN */}
                    <GestureDetector gesture={panGesture}>
                        <View className="items-center py-4 px-2 border-b border-[1px] border-gray-200 bg-white">
                            <View className="w-10 h-1 bg-gray-300 rounded-sm mb-3" />
                            <View className="flex-row justify-between items-center w-full">
                                <View className="flex-row items-center">
                                    <Text className="text-xl font-bold text-gray-900 px-2">
                                        İlan Detayları
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    className="px-3 items-center justify-center"
                                >
                                    <FontAwesomeIcon icon={faTimes} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </GestureDetector>

                    {/* Content - SCROLLABİL ALAN */}
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        contentContainerStyle={{
                            paddingBottom: currentSnapPoint === SNAP_POINTS.MEDIUM
                                ? 100 + insets.bottom  // Küçük modalde fazla boşluk
                                : 40 + insets.bottom   // Büyük modalde normal boşluk
                        }}
                    >
                        {isNormalPost && post ? (
                            // Normal Post Details
                            <>
                                {/* Ev Sahibi ve Uyumluluk Skoru */}
                                {(post.user || processedMatchScore) && (
                                    <View className="px-4 py-4 border-b border-gray-100">
                                        {post.user && (
                                            <View className="mb-4">
                                                <Text className="text-lg font-bold text-gray-900 mb-2">
                                                    Ev Sahibi
                                                </Text>
                                                <View className="flex-row items-center">
                                                    <View
                                                        style={{
                                                            shadowColor: '#000',
                                                            shadowOffset: { width: 0, height: 2 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 3,
                                                        }}
                                                    >
                                                        <Image
                                                            source={{
                                                                uri: post.user.profilePictureUrl || "https://via.placeholder.com/48x48/cccccc/666666?text=U"
                                                            }}
                                                            style={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 24,
                                                                borderWidth: 2,
                                                                borderColor: '#f3f4f6'
                                                            }}
                                                            resizeMode="cover"
                                                        />
                                                    </View>
                                                    <View className="flex-1 ml-3">
                                                        <Text className="text-base font-semibold text-gray-900">
                                                            {`${post.user.name} ${post.user.surname}`}
                                                        </Text>
                                                        {post.user.age && (
                                                            <Text className="text-sm text-gray-600">
                                                                {post.user.age} yaşında
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                        {/* Uyumluluk Skoru - sadece KIRACI için */}
                                        {userRole === "KIRACI" && processedMatchScore && processedMatchScore > 0 && (
                                            <View>
                                                <Text className="text-base font-semibold text-gray-900 mb-2">
                                                    Uyumluluk
                                                </Text>
                                                <MatchScoreBar matchScore={processedMatchScore} showBar={true} />
                                            </View>
                                        )}
                                        {userRole === "KIRACI" && (!processedMatchScore || processedMatchScore === 0) && (
                                            <View>
                                                <Text className="text-base font-semibold text-gray-900 mb-2">
                                                    Uyumluluk
                                                </Text>
                                                <Text className="text-sm text-gray-500">
                                                    Uyumluluk hesaplanıyor...
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Emlak Bilgileri */}
                                <View className="px-4 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Emlak Bilgileri
                                    </Text>
                                    {renderDetailItem(faLocationDot, "Lokasyon", `${post.mahalle}, ${post.ilce}, ${post.il}`)}
                                    {renderDetailItem(faMoneyBills, "Kira", formatCurrency(post.kiraFiyati, post.paraBirimi))}
                                    {renderDetailItem(faCoins, "Depozito", formatCurrency(post.depozito, post.paraBirimi))}
                                    {renderDetailItem(faBed, "Oda Sayısı", post.odaSayisi)}
                                    {post.yatakOdasiSayisi !== undefined && renderDetailItem(faBedBunk, "Yatak Odası", post.yatakOdasiSayisi)}
                                    {renderDetailItem(faShower, "Banyo Sayısı", post.banyoSayisi)}
                                    {renderDetailItem(faRuler, "Brüt Alan", post.brutMetreKare ? `${post.brutMetreKare} m²` : null)}
                                    {renderDetailItem(faRuler, "Net Alan", post.netMetreKare ? `${post.netMetreKare} m²` : null)}
                                    {renderDetailItem(faBuilding, "Kat", `${post.bulunduguKat}/${post.toplamKat}`)}
                                    {renderDetailItem(faCalendar, "Bina Yaşı", `${post.binaYasi} yıl`)}
                                    {renderDetailItem(faFire, "Isıtma", post.isitmaTipi)}
                                    {renderDetailItem(faUtensils, "Mutfak", post.mutfak)}
                                    {renderDetailItem(faKey, "Kullanım Durumu", post.kullanimDurumu)}
                                    {renderDetailItem(faUser, "Kimden", post.kimden)}
                                </View>

                                {/* Özellikler */}
                                <View className="px-4 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Özellikler
                                    </Text>
                                    {renderBooleanItem(faCheckCircle, "Eşyalı", post.esyali)}
                                    {renderBooleanItem(faParking, "Otopark", post.otopark)}
                                    {renderBooleanItem(faElevator, "Asansör", post.asansor)}
                                    {renderBooleanItem(faTreeCity, "Balkon", post.balkon)}
                                    {renderBooleanItem(faBuilding, "Site İçerisinde", post.siteIcerisinde)}
                                    {post.siteAdi && renderDetailItem(faHome, "Site Adı", post.siteAdi)}
                                    {renderBooleanItem(faCheckCircle, "Takas", post.takas)}
                                </View>

                                {/* Mali Bilgiler */}
                                <View className="px-4 py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        Mali Bilgiler
                                    </Text>
                                    {renderDetailItem(faMoneyBills, "Aidat", post.aidat ? `${post.aidat} ₺` : "Yok")}
                                    {renderDetailItem(faCalendar, "Kiralama Süresi", `${post.rentalPeriod} ay`)}
                                    {renderDetailItem(faCalendar, "Min. Kiralama", `${post.minimumKiralamaSuresi} ay`)}
                                </View>

                                {/* İlan Sahibi Detayları */}
                                {post.user && (
                                    <View className="px-4 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            İletişim Bilgileri
                                        </Text>
                                        {renderDetailItem(faEnvelope, "E-posta", post.user.email)}
                                        {renderDetailItem(faPhone, "Telefon", post.user.phoneNumber)}
                                        {post.user.gender && renderDetailItem(faUser, "Cinsiyet", post.user.gender)}
                                    </View>
                                )}

                                {/* İlan Açıklaması */}
                                {post.postDescription && (
                                    <View className="px-4 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            İlan Açıklaması
                                        </Text>
                                        <Text className="text-sm text-gray-700 leading-6">
                                            {post.postDescription}
                                        </Text>
                                    </View>
                                )}
                                {/* İstatistikler */}
                                <View className="px-4  py-4 border-t border-gray-100">
                                    <Text className="text-base font-semibold text-gray-900 mb-3">
                                        İstatistikler
                                    </Text>
                                    {renderDetailItem(faEye, "Görüntülenme", post.viewCount || 0)}
                                    {renderDetailItem(faEye, "Benzersiz Görüntülenme", post.uniqueViewCount || 0)}
                                    {renderDetailItem(faEye, "Bugün", post.todayViewCount || 0)}
                                    {renderDetailItem(faEye, "Bu Hafta", post.weekViewCount || 0)}
                                    {renderDetailItem(faBarsProgress, "Benzerlik Skoru", post.similarityScore || 0)}
                                    {renderDetailItem(faThumbsUp, "Teklif Sayısı", post.offerCount || 0)}
                                    {renderBooleanItem(faCheckCircle, "Teklif Kabul Edildi", post.isOfferAccepted)}
                                </View>
                            </>
                        ) : (
                            // Meta Post Details (Airbnb)
                            metaPost && (
                                <>
                                    {/* Uyumluluk Skoru - MetaPost için */}
                                    {userRole === "KIRACI" && processedMatchScore && processedMatchScore > 0 && (
                                        <View className="px-4 py-4 border-b border-gray-100">
                                            <Text className="text-base font-semibold text-gray-900 mb-2">
                                                Uyumluluk
                                            </Text>
                                            <MatchScoreBar matchScore={processedMatchScore} showBar={true} />
                                        </View>
                                    )}

                                    {/* Konaklama Bilgileri */}
                                    <View className="px-4 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Konaklama Bilgileri
                                        </Text>
                                        {renderDetailItem(faLocationDot, "Lokasyon", `${metaPost.location}, ${metaPost.city}, ${metaPost.country}`)}
                                        {renderDetailItem(faMoneyBills, "Fiyat", metaPost.priceInfo)}
                                        {renderDetailItem(faHome, "Emlak Tipi", getPropertyTypeName(metaPost.propertyType))}
                                        {renderDetailItem(faBed, "Yatak Odası", metaPost.bedroomCount || 0)}
                                        {renderDetailItem(faShower, "Banyo", metaPost.bathroomCount)}
                                        {renderDetailItem(faUsers, "Kapasite", `${metaPost.personCapacity} kişi`)}
                                    </View>

                                    {/* Ev Sahibi */}
                                    <View className="px-4 py-4 border-t border-gray-100">
                                        <Text className="text-base font-semibold text-gray-900 mb-3">
                                            Ev Sahibi
                                        </Text>
                                        {renderDetailItem(faUser, "İsim", metaPost.hostName)}
                                        {renderBooleanItem(faCheckCircle, "Süper Ev Sahibi", metaPost.isSuperhost)}
                                        {renderBooleanItem(faCheckCircle, "Anında Rezervasyon", metaPost.canInstantBook)}
                                    </View>

                                    {/* Açıklama */}
                                    {metaPost.description && (
                                        <View className="px-4 py-4 border-t border-gray-100">
                                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                                Açıklama
                                            </Text>
                                            <Text className="text-sm text-gray-700 leading-6">
                                                {metaPost.description}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Olanaklar */}
                                    {metaPost.amenities && metaPost.amenities.length > 0 && (
                                        <View className="px-4 py-4 border-t border-gray-100">
                                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                                Olanaklar ({metaPost.amenityCount || metaPost.amenities.length})
                                            </Text>
                                            <View className="flex-row flex-wrap">
                                                {metaPost.amenities.slice(0, 10).map((amenity, index) => (
                                                    <View key={index} className="flex-row items-center mr-4 mb-2">
                                                        <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                                                        <Text className="text-xs text-gray-700 ml-1">{amenity}</Text>
                                                    </View>
                                                ))}
                                                {metaPost.amenities.length > 10 && (
                                                    <Text className="text-xs text-gray-500 italic mt-2">
                                                        +{metaPost.amenities.length - 10} daha fazla...
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* İstatistikler */}
                                    {(metaPost.rating || metaPost.reviewCount) && (
                                        <View className="px-4 py-4 border-t border-gray-100">
                                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                                İstatistikler
                                            </Text>
                                            {metaPost.rating && renderDetailItem(faThumbsUp, "Puan", `${metaPost.rating.toFixed(2)} ⭐`)}
                                            {renderDetailItem(faEye, "Yorum Sayısı", metaPost.reviewCount || 0)}
                                            {renderDetailItem(faEye, "Görünür Yorum", metaPost.visibleReviewCount || 0)}
                                        </View>
                                    )}
                                </>
                            )
                        )}
                    </ScrollView>


                </ReAnimated.View>
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

export default ExploreDetailModal;