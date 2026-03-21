import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Animated,
} from "react-native";
import {
  ChevronLeft,
  ChevronDown,
  Mail,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { selectUserRole } from "../redux/slices/authSlice";

const FAQS_KIRACI = [
  {
    question: "Nasıl teklif gönderebilirim?",
    answer:
      "Beğendiğiniz bir ilana girip 'Teklif Gönder' butonuna tıklayarak ev sahibine teklif iletebilirsiniz. Teklif durumunu 'Tekliflerim' sekmesinden takip edebilirsiniz.",
  },
  {
    question: "Beklenti profilim ne işe yarıyor?",
    answer:
      "Beklenti profiliniz, sizinle uyumlu ev sahibi ve ilanların hesaplanmasında kullanılır. Ne kadar eksiksiz doldurursanız eşleşme sonuçları o kadar doğru olur.",
  },
  {
    question: "Favori ilanlarımı nasıl görebilirim?",
    answer:
      "İlan detay sayfasındaki kalp ikonuna tıklayarak ilanı favorilere ekleyebilirsiniz. Profilim → Favoriler → Favori İlanlar yolunu izleyerek tümünü görebilirsiniz.",
  },
  {
    question: "Ev sahibiyle nasıl mesajlaşabilirim?",
    answer:
      "Bir ilan sahibine teklif gönderdikten sonra sohbet başlatabilir ya da ilan detay sayfasındaki 'Mesaj Gönder' butonunu kullanabilirsiniz.",
  },
  {
    question: "Uyumluluk skoru nasıl hesaplanıyor?",
    answer:
      "Uyumluluk skoru, beklenti profiliniz ile ev sahibinin tercihleri karşılaştırılarak hesaplanır. Bütçe, konum, evcil hayvan, sigara gibi kriterler değerlendirmeye alınır.",
  },
  {
    question: "Bir kullanıcıyı nasıl şikayet edebilirim?",
    answer:
      "Kullanıcı profil sayfasındaki kalkan ikonuna tıklayarak şikayet formunu doldurabilirsiniz. Ekibimiz en kısa sürede inceleme yapar.",
  },
];

const FAQS_EVSAHIBI = [
  {
    question: "Nasıl ilan oluşturabilirim?",
    answer:
      "Profilim → İlanlar → Yeni İlan Oluştur yolunu izleyerek adım adım ilan ekleyebilirsiniz. İlan yayınlandıktan sonra uyumlu kiracılar anasayfanızda görünmeye başlar.",
  },
  {
    question: "Kiracı tekliflerini nereden görebilirim?",
    answer:
      "'Teklifler' sekmesinden size gelen tüm teklifleri inceleyebilir, kabul veya reddedebilirsiniz.",
  },
  {
    question: "Beklenti profilim ne işe yarıyor?",
    answer:
      "Beklenti profiliniz, sizinle uyumlu kiracıların hesaplanmasında kullanılır. Kiracıdan beklentilerinizi eksiksiz doldurmanız daha iyi eşleşmeler sağlar.",
  },
  {
    question: "İlanımı nasıl düzenleyebilirim?",
    answer:
      "İlanlarım sayfasından ilgili ilana girip düzenle ikonuna tıklayarak bilgileri güncelleyebilirsiniz.",
  },
  {
    question: "Kiracıyla nasıl mesajlaşabilirim?",
    answer:
      "Kiracının profil sayfasından ya da gelen teklifler üzerinden sohbet başlatabilirsiniz.",
  },
  {
    question: "Bir kullanıcıyı nasıl şikayet edebilirim?",
    answer:
      "Kullanıcı profil sayfasındaki kalkan ikonuna tıklayarak şikayet formunu doldurabilirsiniz. Ekibimiz en kısa sürede inceleme yapar.",
  },
];

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.timing(anim, { toValue, duration: 260, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue, duration: 260, useNativeDriver: true }),
    ]).start();
    setOpen((prev) => !prev);
  };

  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });
  const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggle}
      className="py-4"
    >
      <View className="flex-row justify-between items-center">
        <Text
          style={{ fontSize: 15 }}
          className="text-gray-900 font-medium flex-1 pr-3"
        >
          {question}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={18} color="#9ca3af" />
        </Animated.View>
      </View>
      <Animated.View style={{ maxHeight, overflow: "hidden", opacity }}>
        <Text
          style={{ fontSize: 14, lineHeight: 22, marginTop: 12, color: "#6b7280" }}
        >
          {answer}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const HelpSupportScreen = ({ navigation }) => {
  const userRole = useSelector(selectUserRole);
  const faqs = userRole === "EVSAHIBI" ? FAQS_EVSAHIBI : FAQS_KIRACI;

  const handleEmail = () => {
    Linking.openURL(
      "mailto:info@kirax.com?subject=Yardım Talebi&body=Merhaba KiraX ekibi,"
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-2 border-b border-gray-100"
        style={{ minHeight: 44 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <ChevronLeft size={24} color="black" />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 17, fontWeight: "600" }}
          className="text-gray-900 ml-2"
        >
          Yardım & Destek
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SSS */}
        <Text
          className="mt-8 mb-1 text-gray-900"
          style={{ fontSize: 20, fontWeight: "600" }}
        >
          Sık Sorulan Sorular
        </Text>
        <Text style={{ fontSize: 13 }} className="text-gray-400 mb-4">
          {userRole === "EVSAHIBI"
            ? "Ev sahiplerine yönelik sık sorulan sorular"
            : "Kiracılara yönelik sık sorulan sorular"}
        </Text>

        <View>
          {faqs.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </View>

        {/* Bize Ulaşın */}
        <Text
          className="mt-10 mb-4 text-gray-900"
          style={{ fontSize: 20, fontWeight: "600" }}
        >
          Bize Ulaşın
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleEmail}
          className="flex-row items-center justify-between py-5 px-5 rounded-2xl border border-gray-100"
          style={{ boxShadow: "0px 0px 12px #00000008" }}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center">
              <Mail size={20} color="black" />
            </View>
            <View>
              <Text
                style={{ fontSize: 15 }}
                className="text-gray-900 font-medium"
              >
                E-posta Gönder
              </Text>
              <Text style={{ fontSize: 13 }} className="text-gray-400 mt-0.5">
                info@kirax.com
              </Text>
            </View>
          </View>
          <ChevronLeft
            size={16}
            color="#cfcfcf"
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>

        <Text
          style={{ fontSize: 12, lineHeight: 18 }}
          className="text-gray-400 text-center mt-6"
        >
          Çalışma saatlerimiz içinde (Pzt–Cum, 09:00–18:00) en geç 1 iş günü
          içinde dönüş yapıyoruz.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
