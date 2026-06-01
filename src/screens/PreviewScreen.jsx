import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions, BlurView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArcProgress, BarChart } from '../components/PensionChart';
import { fI, fMD } from '../utils/pension';

const { width } = Dimensions.get('window');
const gold = '#F59E0B';

export default function PreviewScreen({ navigation, route }) {
  const { ps, ri, pen, salary, deps, bd, rd, ageG, ageH, ageNowG, periods, isDemo } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const earlyNeed = Math.max(0, ri.eR - ps.tM);
  const earlyOk = earlyNeed === 0;
  const totalMonths = Math.round(ps.tM);

  const handleBuy = () => {
    if (isDemo) {
      navigation.navigate('Report', route.params);
    } else {
      navigation.navigate('Payment', { ...route.params });
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>→</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>نتائج أولية</Text>
        <View style={s.previewBadge}><Text style={s.previewBadgeTxt}>معاينة</Text></View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* بطاقة المعاش - معروض جزئياً */}
          <View style={s.pensionHero}>
            <Text style={s.heroLabel}>معاشك التقاعدي المتوقع</Text>
            <View style={s.pensionRow}>
              <Text style={s.pensionVal}>{fI(pen.f)}</Text>
              <Text style={s.pensionCur}>ر.س / شهر</Text>
            </View>
            <Text style={s.pensionYearly}>سنوياً: {fI(pen.f * 12)} ر.س</Text>
            <View style={s.earlyBadge}>
              <Text style={[s.earlyTxt, { color: earlyOk ? '#10B981' : '#F59E0B' }]}>
                {earlyOk ? '✅ مؤهل للتقاعد المبكر' : `⏳ تحتاج ${fI(earlyNeed)} شهر للتقاعد المبكر`}
              </Text>
            </View>
          </View>

          {/* Arc Progress */}
          <View style={s.arcRow}>
            <View style={s.arcBox}>
              <ArcProgress
                pct={totalMonths / ri.eR}
                size={130}
                color={earlyOk ? '#10B981' : '#F59E0B'}
                label={fI(totalMonths)}
                sublabel="شهر خدمة"
              />
              <Text style={s.arcLabel}>المدة المتراكمة</Text>
            </View>
            <View style={s.arcBox}>
              <ArcProgress
                pct={ageH / ri.rY}
                size={130}
                color="#3B82F6"
                label={ageH.toFixed(1)}
                sublabel="سنة هجرية"
              />
              <Text style={s.arcLabel}>عمرك عند التقاعد</Text>
            </View>
          </View>

          {/* ملخص سريع */}
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Text style={s.statIcon}>📊</Text>
              <Text style={s.statVal}>{fI(pen.pN)} ر.س</Text>
              <Text style={s.statLbl}>مدة جديدة (÷480)</Text>
            </View>
            {pen.pO > 0 && (
              <View style={s.statCard}>
                <Text style={s.statIcon}>📜</Text>
                <Text style={[s.statVal, { color: '#F97316' }]}>{fI(pen.pO)} ر.س</Text>
                <Text style={s.statLbl}>مدة قديمة (÷600)</Text>
              </View>
            )}
            <View style={s.statCard}>
              <Text style={s.statIcon}>🏁</Text>
              <Text style={[s.statVal, { color: ri.ex ? '#10B981' : '#8B5CF6' }]}>
                {ri.ex ? 'غير مشمول' : 'مشمول'}
              </Text>
              <Text style={s.statLbl}>تعديلات 2024</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statIcon}>📅</Text>
              <Text style={[s.statVal, { color: '#3B82F6' }]}>{ri.rY} سنة</Text>
              <Text style={s.statLbl}>سن التقاعد النظامي</Text>
            </View>
          </View>

          {/* قفل التقرير الكامل */}
          <View style={s.lockCard}>
            <Text style={s.lockTitle}>🔒 التقرير الكامل يتضمن</Text>
            <View style={s.lockFeatures}>
              {[
                '📊 رسم بياني تفاعلي للمعاش',
                '💡 10 سيناريو لتحسين معاشك',
                '📈 جدول المقارنة بالراتب الحالي',
                '⏱ الجدول الزمني حتى التقاعد',
                '📄 تقرير قابل للتصدير والمشاركة',
              ].map((f, i) => (
                <View key={i} style={s.lockRow}>
                  <Text style={s.lockFeatureTxt}>{f}</Text>
                </View>
              ))}
            </View>

            {isDemo ? (
              <TouchableOpacity style={s.buyBtn} onPress={handleBuy} activeOpacity={0.85}>
                <Text style={s.buyBtnTxt}>🎁 وضع التجربة — اعرض التقرير مجاناً</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>اشترِ التقرير الكامل</Text>
                  <View style={s.priceBadge}>
                    <Text style={s.priceAmt}>9.99 ر.س</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.buyBtn} onPress={handleBuy} activeOpacity={0.85}>
                  <Text style={s.buyBtnTxt}>🛒 اشترِ التقرير الآن</Text>
                </TouchableOpacity>
                <Text style={s.secureNote}>🔐 دفع آمن عبر Moyasar — mada / Visa / Apple Pay</Text>
              </>
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  previewBadge: { backgroundColor: '#F59E0B20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#F59E0B40' },
  previewBadgeTxt: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 50 },

  pensionHero: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#F59E0B30', shadowColor: '#F59E0B', shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  heroLabel: { fontSize: 12, color: '#94A3B8', letterSpacing: 1.5, marginBottom: 8 },
  pensionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  pensionVal: { fontSize: 52, fontWeight: '900', color: '#F59E0B' },
  pensionCur: { fontSize: 15, color: '#D97706', fontWeight: '600' },
  pensionYearly: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  earlyBadge: { backgroundColor: '#0F172A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  earlyTxt: { fontSize: 12, fontWeight: '700' },

  arcRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  arcBox: { alignItems: 'center' },
  arcLabel: { fontSize: 11, color: '#64748B', marginTop: 6, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: (width - 50) / 2, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 16, fontWeight: '900', color: '#F59E0B', marginBottom: 3 },
  statLbl: { fontSize: 10, color: '#64748B', textAlign: 'center' },

  lockCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#334155' },
  lockTitle: { fontSize: 15, fontWeight: '800', color: '#F1F5F9', marginBottom: 14 },
  lockFeatures: { marginBottom: 18 },
  lockRow: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  lockFeatureTxt: { fontSize: 13, color: '#CBD5E1' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  priceLabel: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  priceBadge: { backgroundColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  priceAmt: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  buyBtn: { backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buyBtnTxt: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  secureNote: { fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 12 },
});
