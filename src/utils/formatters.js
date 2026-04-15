/**
 * Ortak formatlama ve yardımcı fonksiyonlar
 * Birden fazla ekranda tekrar eden utility fonksiyonlarını merkezileştiriyoruz.
 */

/**
 * Para birimi kodunu/numarasını sembol olarak döndürür.
 * PostDetailScreen, PostsScreen, AllSimilarPropertiesScreen, AllNearbyPropertiesScreen vb. dosyalarda
 * farklı varyasyonlarla tekrarlanıyordu.
 */
export const getCurrencyText = (value) => {
  if (typeof value === "string") {
    const stringMapping = {
      TRY: "₺",
      TL: "₺",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    return stringMapping[value] || value || "₺";
  }
  const numericMapping = { 1: "₺", 2: "$", 3: "€", 4: "£" };
  return numericMapping[value] || "₺";
};

/**
 * Geçmişe dönük zaman formatı (örn: "3 gün önce", "Az önce")
 * AllNearbyPropertiesScreen, AllSimilarPropertiesScreen, PostsScreen, AllRecommendedPostsScreen
 * dosyalarında birebir tekrarlanıyordu.
 */
export const getRelativeTime = (postTime) => {
  if (!postTime) return "Tarih belirtilmemiş";

  const now = new Date();
  const postDate = new Date(postTime);
  if (isNaN(postDate.getTime())) return "Geçersiz tarih";

  const diffMs = now.getTime() - postDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} yıl önce`;
  if (diffMonths > 0) return `${diffMonths} ay önce`;
  if (diffWeeks > 0) return `${diffWeeks} hafta önce`;
  if (diffDays > 0) return `${diffDays} gün önce`;
  if (diffHours > 0) return `${diffHours} saat önce`;
  if (diffMinutes > 0) return `${diffMinutes} dakika önce`;
  return "Az önce";
};

/**
 * Para formatı (Türkçe Lira formatı)
 */
export const formatCurrency = (amount, currency = "TRY") => {
  if (!amount && amount !== 0) return "Belirtilmemiş";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency === "₺" ? "TRY" : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Tarih formatı (Türkçe)
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("tr-TR");
};

/**
 * Kira dönemi enum değerini metin olarak döndürür
 */
export const getRentalPeriodText = (value) => {
  const mapping = {
    1: "6 Ay",
    2: "1 Yıl",
    3: "Uzun Vadeli (1+ Yıl)",
    4: "Kısa Dönem Olabilir",
  };
  return mapping[value] || "Belirtilmemiş";
};

/**
 * Mülk tipi enum değerini metin olarak döndürür
 */
export const getPropertyTypeText = (value) => {
  const mapping = {
    1: "Daire",
    2: "Müstakil Ev",
    3: "Villa",
    4: "Stüdyo Daire",
    5: "Rezidans",
    6: "Diğer",
  };
  return mapping[value] || "Belirtilmemiş";
};

/**
 * Isıtma tipi enum değerini metin olarak döndürür
 */
export const getHeatingTypeText = (value) => {
  const mapping = {
    1: "Doğalgaz Kombi",
    2: "Merkezi Sistem",
    3: "Elektrikli Isıtma",
    4: "Soba",
    5: "Fark Etmez",
  };
  return mapping[value] || "Belirtilmemiş";
};
