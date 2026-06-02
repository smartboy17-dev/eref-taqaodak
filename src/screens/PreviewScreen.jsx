import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArcProgress, GaugeMeter } from '../components/PensionChart';
import { fI, fMD } from '../utils/pension';

const { width } = Dimensions.get('window');
const gold = '#F59E0B';
const indigo = '#6366F1';

export default function PreviewScreen({ navigation, route }) {
  const { ps, ri, pen, salary, deps, bd, rd, ageG, ageH, ageNowG, periods, isDemo } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const earlyNeed = Math.max(0, ri.eR - ps.tM);
  const earlyOk = earlyNeed === 0;
  const totalMonths = Math.round(ps.tM);
  const readinessPct = Math.min(ps.tM / ri.eR, 1);
  const benchmarkPct = Math.round((pen.f / salary) * 100);
  const benchmarkColor = benchmarkPct >= 70 ? '#10B981' : benchmarkPct >= 50 ? '#6366F1' : '#EF4444';

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
              <Text style={[s.earlyTxt, { color: earlyOk ? '#10B981' : '#6366F1' }]}>
                {earlyOk ? '✅ مؤهل للتقاعد المبكر' : `⏳ تحتاج ${fI(earlyNeed)} شهر للتقاعد المبكر`}
              </Text>
            </View>
          </View>

          {/* Readiness Gauge */}
          <View style={s.gaugeSection}>
            <GaugeMeter pct={readinessPct} size={180} currentM={totalMonths} targetM={ri.eR} />
            <View style={s.gaugePills}>
              <View style={s.gaugePill}>
                <Text style={[s.gaugePillNum, { color: benchmarkColor }]}>{benchmarkPct}%</Text>
                <Text style={s.gaugePillLbl}>من راتبك الحالي</Text>
              </View>
              <View style={s.gaugePillSep} />
              <View style={s.gaugePill}>
                <Text style={s.gaugePillNum}>{ri.rY}<Text style={{ fontSize: 11 }}>س</Text></Text>
                <Text style={s.gaugePillLbl}>سن التقاعد</Text>
              </View>
              <View style={s.gaugePillSep} />
              <View style={s.gaugePill}>
                <Text style={s.gaugePillNum}>{fI(totalMonths)}</Text>
                <Text style={s.gaugePillLbl}>شهر مكتسب</Text>
              </View>
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
  safe: { flex: 1, backgroundColor: '#07091C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111830', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: '#F1F5F9' },
  previewBadge: { backgroundColor: '#6366F120', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#6366F140' },
  previewBadgeTxt: { fontSize: 11, color: '#6366F1', fontFamily: 'Cairo_700Bold' },
  scroll: { padding: 20, paddingBottom: 50 },

  pensionHero: { backgroundColor: '#111830', borderRadius: 24, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#6366F130', shadowColor: '#6366F1', shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  heroLabel: { fontSize: 12, color: '#94A3B8', letterSpacing: 1.5, marginBottom: 8 },
  pensionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  pensionVal: { fontSize: 52, fontFamily: 'Cairo_900Black', color: '#F59E0B' },
  pensionCur: { fontSize: 15, color: '#D97706', fontFamily: 'Cairo_600SemiBold' },
  pensionYearly: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  earlyBadge: { backgroundColor: '#07091C', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  earlyTxt: { fontSize: 12, fontFamily: 'Cairo_700Bold' },

  gaugeSection: { alignItems: 'center', marginBottom: 16 },
  gaugePills: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, backgroundColor: '#111830', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, marginTop: 4, borderWidth: 1, borderColor: '#1C2848', width: '100%' },
  gaugePill: { flex: 1, alignItems: 'center' },
  gaugePillNum: { fontSize: 20, fontFamily: 'Cairo_900Black', color: '#6366F1', marginBottom: 2 },
  gaugePillLbl: { fontSize: 9, color: '#64748B', textAlign: 'center' },
  gaugePillSep: { width: 1, height: 36, backgroundColor: '#1C2848' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: (width - 50) / 2, backgroundColor: '#111830', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C2848', alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 16, fontFamily: 'Cairo_900Black', color: '#6366F1', marginBottom: 3 },
  statLbl: { fontSize: 10, color: '#64748B', textAlign: 'center' },

  lockCard: { backgroundColor: '#111830', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#1C2848' },
  lockTitle: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: '#F1F5F9', marginBottom: 14 },
  lockFeatures: { marginBottom: 18 },
  lockRow: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#07091C' },
  lockFeatureTxt: { fontSize: 13, color: '#CBD5E1' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  priceLabel: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: '#F1F5F9' },
  priceBadge: { backgroundColor: '#6366F1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  priceAmt: { fontSize: 16, fontFamily: 'Cairo_900Black', color: '#07091C' },
  buyBtn: { backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buyBtnTxt: { fontSize: 16, fontFamily: 'Cairo_900Black', color: '#07091C' },
  secureNote: { fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 12 },
});
