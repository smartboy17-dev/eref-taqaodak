import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const C = {
  bg: '#07091C', surface: '#0D1226', card: '#111830', border: '#1C2848',
  indigo: '#6366F1', indigoLight: '#818CF8', indigoDark: '#4338CA',
  gold: '#F59E0B', blue: '#3B82F6', green: '#10B981',
  text: '#F1F5F9', text2: '#94A3B8', text3: '#475569',
};
const F = { black: 'Cairo_900Black', bold: 'Cairo_700Bold', semi: 'Cairo_600SemiBold', reg: 'Cairo_400Regular' };

const FEATURES = [
  { icon: '🧮', title: 'احتساب دقيق', desc: 'نظام م/33 وقرار 2024م' },
  { icon: '📊', title: 'تقرير مرئي', desc: 'رسوم بيانية لوضعك التقاعدي' },
  { icon: '💡', title: 'سيناريوهات التحسين', desc: 'كيف ترفع معاشك قبل التقاعد' },
  { icon: '📄', title: 'تقرير قابل للمشاركة', desc: 'احفظه أو شاركه فوراً' },
];

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Animated.View style={[s.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.logoRing}>
            <Text style={s.logoIcon}>🏛️</Text>
          </View>
          <Text style={s.appName}>اعرف تقاعدك</Text>
          <Text style={s.tagline}>معاشك التقاعدي في دقيقتين</Text>
          <Text style={s.subtitle}>
            أول تطبيق سعودي يحسب معاشك بدقة بناءً على{'\n'}
            نظام التأمينات الاجتماعية وتعديلات 2024م
          </Text>
        </Animated.View>

        <Animated.View style={[s.featuresGrid, { opacity: fadeAnim }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureCard}>
              <View style={s.featureIconWrap}><Text style={s.featureIcon}>{f.icon}</Text></View>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={s.priceCard}>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>تقرير التقاعد الكامل</Text>
            <View style={s.priceBadge}>
              <Text style={s.priceAmount}>9.99</Text>
              <Text style={s.priceCur}>ريال</Text>
            </View>
          </View>
          <Text style={s.priceNote}>دفعة واحدة • بدون اشتراك شهري</Text>
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Input'); }} activeOpacity={0.88}>
          <Text style={s.btnPrimaryText}>ابدأ الاحتساب الآن ←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnDemo} onPress={() => { Haptics.selectionAsync(); navigation.navigate('Input', { demo: true }); }} activeOpacity={0.8}>
          <Text style={s.btnDemoText}>تجربة مجانية بدون دفع</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>⚠️ الأرقام تقديرية للتوعية المالية فقط. الرقم الرسمي لدى مؤسسة التأمينات.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 44 },
  hero: { alignItems: 'center', paddingTop: 44, paddingBottom: 32 },
  logoRing: { width: 90, height: 90, borderRadius: 28, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.indigo + '55', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: C.indigo, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 },
  logoIcon: { fontSize: 42 },
  appName: { fontSize: 34, fontFamily: F.black, color: C.indigoLight, letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 16, fontFamily: F.bold, color: C.text, marginBottom: 10 },
  subtitle: { fontSize: 13, fontFamily: F.reg, color: C.text2, textAlign: 'center', lineHeight: 22 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  featureCard: { width: (width - 50) / 2, backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  featureIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.indigo + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featureIcon: { fontSize: 20 },
  featureTitle: { fontSize: 13, fontFamily: F.bold, color: C.text, marginBottom: 4 },
  featureDesc: { fontSize: 11, fontFamily: F.reg, color: C.text2, lineHeight: 17 },
  priceCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1.5, borderColor: C.indigo + '35', shadowColor: C.indigo, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  priceLabel: { fontSize: 15, fontFamily: F.bold, color: C.text },
  priceBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3, backgroundColor: C.gold + '18', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.gold + '40' },
  priceAmount: { fontSize: 22, fontFamily: F.black, color: C.gold },
  priceCur: { fontSize: 12, fontFamily: F.semi, color: C.gold },
  priceNote: { fontSize: 11, fontFamily: F.reg, color: C.text3, textAlign: 'right' },
  btnPrimary: { backgroundColor: C.indigo, borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12, shadowColor: C.indigo, shadowOpacity: 0.55, shadowRadius: 18, elevation: 8 },
  btnPrimaryText: { fontSize: 17, fontFamily: F.black, color: '#FFFFFF' },
  btnDemo: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, marginBottom: 24 },
  btnDemoText: { fontSize: 14, fontFamily: F.semi, color: C.text2 },
  disclaimer: { fontSize: 10, fontFamily: F.reg, color: C.text3, textAlign: 'center', lineHeight: 17, paddingHorizontal: 10 },
});
