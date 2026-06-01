import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '🧮', title: 'احتساب دقيق', desc: 'بناءً على نظام م/33 وقرار 2024م' },
  { icon: '📊', title: 'تقرير مرئي', desc: 'رسوم بيانية توضح وضعك التقاعدي' },
  { icon: '💡', title: 'سيناريوهات التحسين', desc: 'كيف ترفع معاشك قبل التقاعد' },
  { icon: '📄', title: 'تقرير قابل للمشاركة', desc: 'احفظه أو شاركه فوراً' },
];

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* الشعار والعنوان */}
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

        {/* المميزات */}
        <Animated.View style={[s.featuresGrid, { opacity: fadeAnim }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureCard}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </Animated.View>

        {/* سعر التقرير */}
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

        {/* أزرار البداية */}
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Input')} activeOpacity={0.85}>
          <Text style={s.btnPrimaryText}>ابدأ الاحتساب الآن ←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnDemo} onPress={() => navigation.navigate('Input', { demo: true })} activeOpacity={0.8}>
          <Text style={s.btnDemoText}>تجربة مجانية بدون دفع</Text>
        </TouchableOpacity>

        {/* إخلاء المسؤولية */}
        <Text style={s.disclaimer}>
          ⚠️ الأرقام تقديرية للتوعية المالية فقط. الرقم الرسمي لدى مؤسسة التأمينات.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  logoRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1E293B', borderWidth: 2, borderColor: '#F59E0B40', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 32, fontWeight: '900', color: '#F59E0B', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 10 },
  subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  featureCard: { width: (width - 50) / 2, backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  featureIcon: { fontSize: 24, marginBottom: 8 },
  featureTitle: { fontSize: 13, fontWeight: '800', color: '#F1F5F9', marginBottom: 4 },
  featureDesc: { fontSize: 11, color: '#94A3B8', lineHeight: 17 },

  priceCard: { backgroundColor: '#1E293B', borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 1.5, borderColor: '#F59E0B30' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  priceLabel: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  priceBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3, backgroundColor: '#F59E0B20', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#F59E0B40' },
  priceAmount: { fontSize: 22, fontWeight: '900', color: '#F59E0B' },
  priceCur: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  priceNote: { fontSize: 11, color: '#64748B', textAlign: 'right' },

  btnPrimary: { backgroundColor: '#F59E0B', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12, shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnPrimaryText: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  btnDemo: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#334155', marginBottom: 24 },
  btnDemoText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

  disclaimer: { fontSize: 10, color: '#475569', textAlign: 'center', lineHeight: 17, paddingHorizontal: 10 },
});
