import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Share, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BarChart, DonutChart, ArcProgress } from '../components/PensionChart';
import { calcScenarios, fI, fMD, fmt } from '../utils/pension';

const { width } = Dimensions.get('window');
const gold = '#F59E0B';
const grn = '#10B981';
const blu = '#3B82F6';
const pur = '#8B5CF6';
const red = '#EF4444';

const Section = ({ icon, title, children }) => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Row = ({ label, value, color = '#F1F5F9', sub }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[s.rowValue, { color }]}>{value}</Text>
      {sub && <Text style={s.rowSub}>{sub}</Text>}
    </View>
  </View>
);

export default function ReportScreen({ navigation, route }) {
  const { ps, ri, pen, salary, deps, bd, rd, ageG, ageH, ageNowG } = route.params;

  const earlyNeed = Math.max(0, ri.eR - ps.tM);
  const earlyOk = earlyNeed === 0;
  const scenarios = calcScenarios(ps, salary, pen.f, deps);
  const monthScenarios = scenarios.filter(sc => sc.type === 'months').slice(0, 6);
  const salScenarios = scenarios.filter(sc => sc.type === 'salary').slice(0, 4);

  // بيانات الرسوم البيانية
  const pensionBars = [
    { lb: 'معاشك الآن', val: Math.round(pen.pN + (pen.pO || 0)), clr: '#64748B' },
    pen.pV > 0 && { lb: '+ اختياري', val: Math.round(pen.pN + (pen.pO || 0) + pen.pV), clr: pur },
    { lb: 'إجمالي', val: Math.round(pen.f), clr: gold },
  ].filter(Boolean);

  const donutSegments = [
    ps.oM > 0 && { lb: 'مدة قديمة', val: ps.oM, clr: '#F97316' },
    ps.nM > 0 && { lb: 'مدة جديدة', val: ps.nM, clr: blu },
    ps.vM > 0 && { lb: 'اختياري', val: ps.vM, clr: pur },
  ].filter(Boolean);

  const generatePDF = async () => {
    try {
      const html = buildReportHTML({ ps, ri, pen, salary, deps, bd, rd, ageG, ageH, scenarios: monthScenarios });
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'مشاركة تقرير التقاعد' });
      } else {
        Alert.alert('تم الحفظ', `التقرير محفوظ في: ${uri}`);
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر إنشاء التقرير. حاول مجدداً.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>→</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>تقرير تقاعدي شامل</Text>
        <TouchableOpacity style={s.exportBtn} onPress={generatePDF}>
          <Text style={s.exportTxt}>📄 PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* بطاقة المعاش الرئيسية */}
        <View style={s.heroCard}>
          <Text style={s.heroSubtitle}>المعاش التقاعدي المتوقع</Text>
          <Text style={s.heroAmount}>{fI(pen.f)}</Text>
          <Text style={s.heroCur}>ريال سعودي / شهر</Text>
          <Text style={s.heroYearly}>{fI(pen.f * 12)} ر.س سنوياً</Text>
          <View style={[s.statusBadge, { backgroundColor: earlyOk ? '#10B98120' : '#F59E0B20' }]}>
            <Text style={[s.statusTxt, { color: earlyOk ? grn : gold }]}>
              {earlyOk ? '✅ مؤهل للتقاعد المبكر' : `⏳ متبقي ${fI(earlyNeed)} شهر للتقاعد المبكر`}
            </Text>
          </View>
        </View>

        {/* ─── تفاصيل المعاش ─── */}
        <Section icon="📊" title="تفاصيل احتساب المعاش">
          {pen.pO > 0 && <Row label={`مدة قديمة (${fI(ps.oM)} شهر ÷ 600)`} value={`${fI(pen.pO)} ر.س`} color="#F97316" />}
          <Row label={`مدة جديدة (${fI(ps.nM)} شهر ÷ 480)`} value={`${fI(pen.pN)} ر.س`} color={blu} />
          {pen.pV > 0 && <Row label="اشتراك اختياري" value={`+ ${fI(pen.pV)} ر.س`} color={pur} />}
          {pen.dA > 0 && <Row label={`بدل إعالة (${deps} معال)`} value={`+ ${fI(pen.dA)} ر.س`} color={grn} />}
          <View style={s.divider} />
          <Row label="الإجمالي" value={`${fI(pen.f)} ر.س`} color={gold} />
          <Row label="الأجر المعتمد" value={`${fI(salary)} ر.س`} color="#94A3B8" />
          <Row label="إجمالي المدة" value={fMD(ps.tM)} color="#94A3B8" />
        </Section>

        {/* ─── الوضع التقاعدي ─── */}
        <Section icon="🏁" title="الوضع التقاعدي">
          <Row label="حالتك بتعديلات 2024" value={ri.ex ? 'غير مشمول ✅' : 'مشمول ⚠️'} color={ri.ex ? grn : gold} />
          <Row label="سن التقاعد النظامي" value={`${ri.rY} سنة هجرية`} color="#94A3B8" />
          <Row label="المدة المطلوبة للمبكر" value={`${fI(ri.eR)} شهر (${ri.eY} سنة)`} color="#94A3B8" />
          <Row label="مدتك الحالية" value={`${fI(Math.round(ps.tM))} شهر`} color={earlyOk ? grn : gold} />
          {!earlyOk && <Row label="المتبقي للمبكر" value={`${fI(earlyNeed)} شهر`} color={red} />}
        </Section>

        {/* ─── رسم توزيع المدد ─── */}
        {donutSegments.length > 1 && (
          <Section icon="🍩" title="توزيع مدد الخدمة">
            <View style={s.donutRow}>
              <DonutChart segments={donutSegments} size={160} label={fI(Math.round(ps.tM))} sublabel="شهر إجمالي" />
              <View style={s.donutLegend}>
                {donutSegments.map((seg, i) => (
                  <View key={i} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: seg.clr }]} />
                    <Text style={s.legendTxt}>{seg.lb}: {fI(Math.round(seg.val))} شهر</Text>
                  </View>
                ))}
              </View>
            </View>
          </Section>
        )}

        {/* ─── رسم المعاش ─── */}
        <Section icon="📈" title="مقارنة مكونات المعاش">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart bars={pensionBars} width={Math.max(280, pensionBars.length * 110)} height={180} />
          </ScrollView>
        </Section>

        {/* ─── سيناريوهات إضافة أشهر ─── */}
        {monthScenarios.length > 0 && (
          <Section icon="💡" title="سيناريوهات تحسين المعاش">
            <Text style={s.scenarioNote}>كيف تتغير معاشك بإضافة أشهر خدمة إضافية:</Text>
            {monthScenarios.map((sc, i) => (
              <View key={i} style={s.scenarioCard}>
                <View style={s.scenarioLeft}>
                  <Text style={s.scenarioAdd}>+ {sc.addM >= 12 ? `${sc.addY} سنة` : `${sc.addM} شهر`}</Text>
                  <Text style={s.scenarioCost}>تكلفة: {fI(sc.totalCost)} ر.س</Text>
                  {sc.breakEvenMonths && <Text style={s.scenarioBreak}>⚖️ نقطة تعادل: {sc.breakEvenMonths} شهر</Text>}
                </View>
                <View style={s.scenarioRight}>
                  <Text style={s.scenarioDelta}>+{fI(sc.delta)} ر.س/شهر</Text>
                  <Text style={s.scenarioNew}>{fI(sc.newPension)} ر.س</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* ─── سيناريوهات رفع الراتب ─── */}
        {salScenarios.length > 0 && (
          <Section icon="💰" title="أثر زيادة الراتب على المعاش">
            <Text style={s.scenarioNote}>كيف تؤثر زيادة راتبك على معاشك التقاعدي:</Text>
            {salScenarios.map((sc, i) => (
              <View key={i} style={s.scenarioCard}>
                <View style={s.scenarioLeft}>
                  <Text style={s.scenarioAdd}>راتب +{fI(sc.salaryBump)} ر.س</Text>
                  <Text style={s.scenarioCost}>الجديد: {fI(sc.newSalary)} ر.س</Text>
                </View>
                <View style={s.scenarioRight}>
                  <Text style={s.scenarioDelta}>+{fI(sc.delta)} ر.س/شهر</Text>
                  <Text style={s.scenarioNew}>{fI(sc.newPension)} ر.س إجمالي</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* ─── ملاحظة ─── */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerTxt}>
            ⚠️ هذا التقرير للتوعية المالية فقط. الأرقام تقديرية بناءً على نظام م/33 وقرار 3/7/2024م. الرقم الرسمي لدى مؤسسة التأمينات الاجتماعية.
          </Text>
        </View>

        {/* زر إعادة الحساب */}
        <TouchableOpacity style={s.recalcBtn} onPress={() => navigation.navigate('Input')}>
          <Text style={s.recalcTxt}>🔄 حساب جديد</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── توليد HTML للطباعة ──────────────────────────────────────────────
function buildReportHTML({ ps, ri, pen, salary, deps, bd, rd, ageG, ageH, scenarios }) {
  const rows = scenarios.map(sc => `
    <tr>
      <td>${sc.addM >= 12 ? `${sc.addY} سنة` : `${sc.addM} شهر`}</td>
      <td>${new Intl.NumberFormat().format(sc.newPension)} ر.س</td>
      <td style="color:#10B981">+${new Intl.NumberFormat().format(sc.delta)} ر.س</td>
      <td>${new Intl.NumberFormat().format(sc.totalCost)} ر.س</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Tajawal', 'Arial', sans-serif; background: #fff; color: #0F172A; direction: rtl; padding: 32px; }
    h1 { color: #D97706; font-size: 28px; text-align: center; border-bottom: 2px solid #FCD34D; padding-bottom: 12px; }
    h2 { color: #1E293B; font-size: 16px; margin-top: 28px; border-right: 4px solid #F59E0B; padding-right: 10px; }
    .hero { text-align: center; background: #FFF8E7; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #FCD34D; }
    .hero .amount { font-size: 48px; font-weight: 900; color: #D97706; }
    .hero .label { font-size: 13px; color: #92400E; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { background: #1E293B; color: #F59E0B; padding: 10px; text-align: right; }
    td { padding: 9px; border-bottom: 1px solid #E2E8F0; text-align: right; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .footer { font-size: 10px; color: #94A3B8; text-align: center; margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 12px; }
    .badge-green { color: #059669; font-weight: 700; }
    .badge-gold { color: #D97706; font-weight: 700; }
  </style>
</head>
<body>
  <h1>🏛️ تقرير اعرف تقاعدك</h1>
  <div class="hero">
    <div class="label">المعاش التقاعدي المتوقع</div>
    <div class="amount">${new Intl.NumberFormat().format(pen.f)}</div>
    <div class="label">ريال سعودي / شهر — ${new Intl.NumberFormat().format(pen.f * 12)} سنوياً</div>
  </div>
  <h2>تفاصيل الاحتساب</h2>
  <table>
    <tr><td>إجمالي المدة</td><td>${Math.round(ps.tM)} شهر</td></tr>
    ${ps.oM > 0 ? `<tr><td>مدة قديمة (÷600)</td><td>${new Intl.NumberFormat().format(ps.oM)} شهر → ${new Intl.NumberFormat().format(pen.pO)} ر.س</td></tr>` : ''}
    <tr><td>مدة جديدة (÷480)</td><td>${new Intl.NumberFormat().format(ps.nM)} شهر → ${new Intl.NumberFormat().format(pen.pN)} ر.س</td></tr>
    <tr><td>الأجر المعتمد</td><td>${new Intl.NumberFormat().format(salary)} ر.س</td></tr>
    <tr><td>حالة تعديلات 2024</td><td class="${ri.ex ? 'badge-green' : 'badge-gold'}">${ri.ex ? 'غير مشمول ✓' : 'مشمول'}</td></tr>
    <tr><td>سن التقاعد النظامي</td><td>${ri.rY} سنة هجرية</td></tr>
    <tr><td>متطلب التقاعد المبكر</td><td>${ri.eR} شهر</td></tr>
  </table>
  ${scenarios.length > 0 ? `
  <h2>سيناريوهات تحسين المعاش</h2>
  <table>
    <tr><th>أشهر إضافية</th><th>المعاش الجديد</th><th>الزيادة</th><th>التكلفة</th></tr>
    ${rows}
  </table>` : ''}
  <div class="footer">
    تقرير أنشئ بواسطة تطبيق اعرف تقاعدك • للتوعية المالية فقط • استناداً إلى نظام م/33 وقرار 3/7/2024م
  </div>
</body>
</html>`;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  exportBtn: { backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155' },
  exportTxt: { fontSize: 12, color: '#F59E0B', fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 50 },

  heroCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#F59E0B30', shadowColor: '#F59E0B', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  heroSubtitle: { fontSize: 12, color: '#94A3B8', letterSpacing: 1.5, marginBottom: 10 },
  heroAmount: { fontSize: 54, fontWeight: '900', color: '#F59E0B', lineHeight: 60 },
  heroCur: { fontSize: 14, color: '#D97706', fontWeight: '600', marginBottom: 4 },
  heroYearly: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  statusTxt: { fontSize: 12, fontWeight: '700' },

  section: { backgroundColor: '#1E293B', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#F1F5F9' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  rowLabel: { fontSize: 12, color: '#94A3B8', flex: 1, lineHeight: 18 },
  rowValue: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  rowSub: { fontSize: 10, color: '#64748B', textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 12, color: '#CBD5E1' },

  scenarioNote: { fontSize: 11, color: '#64748B', marginBottom: 12, lineHeight: 18 },
  scenarioCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  scenarioLeft: {},
  scenarioAdd: { fontSize: 13, fontWeight: '800', color: '#F1F5F9', marginBottom: 3 },
  scenarioCost: { fontSize: 10, color: '#64748B' },
  scenarioRight: { alignItems: 'flex-end' },
  scenarioDelta: { fontSize: 15, fontWeight: '900', color: '#10B981', marginBottom: 2 },
  scenarioNew: { fontSize: 10, color: '#64748B' },
  scenarioBreak: { fontSize: 9, color: '#8B5CF6', marginTop: 2 },

  disclaimer: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#334155', borderRightWidth: 3, borderRightColor: '#F59E0B' },
  disclaimerTxt: { fontSize: 11, color: '#64748B', lineHeight: 19 },

  recalcBtn: { borderWidth: 1.5, borderColor: '#334155', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  recalcTxt: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
});
