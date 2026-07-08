import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Share, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BarChart, DonutChart, GaugeMeter, AreaChart } from '../components/PensionChart';
import { calcScenarios, calcTimeline, fI, fMD, fmt } from '../utils/pension';

const { width } = Dimensions.get('window');
const gold = '#F59E0B'; // الأرقام المالية تبقى ذهبية
const indigo = '#6366F1'; // لون واجهة UI
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
  const readinessPct = ps.tM / ri.eR;
  const benchmarkPct = Math.round((pen.f / salary) * 100);
  const benchmarkColor = benchmarkPct >= 70 ? grn : benchmarkPct >= 50 ? gold : red;
  const yearsToRetire = Math.max(2, Math.min(35, Math.round((ageG || 0) - (ageNowG || 0))));
  const timelinePoints = calcTimeline(ps, salary, deps, yearsToRetire);
  const scenarios = calcScenarios(ps, salary, pen.f, deps);
  const monthScenarios = scenarios.filter(sc => sc.type === 'months').slice(0, 6);
  const volScenarios = scenarios.filter(sc => sc.type === 'voluntary').slice(0, 5);
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
      const html = buildReportHTML({ ps, ri, pen, salary, deps, bd, rd, ageG, ageH, ageNowG, scenarios: monthScenarios, volScenarios, salScenarios, benchmarkPct, readinessPct, earlyNeed });
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

        {/* لوحة الاستعداد التقاعدي */}
        <View style={s.heroCard}>
          <Text style={s.heroSubtitle}>مؤشر الاستعداد التقاعدي</Text>
          <GaugeMeter pct={readinessPct} size={190} currentM={Math.round(ps.tM)} targetM={ri.eR} />
          <View style={s.heroPills}>
            <View style={s.heroPill}>
              <Text style={s.heroPillNum}>{fI(pen.f)}</Text>
              <Text style={s.heroPillLbl}>ر.س / شهر</Text>
            </View>
            <View style={s.heroPillSep} />
            <View style={s.heroPill}>
              <Text style={[s.heroPillNum, { color: benchmarkColor }]}>{benchmarkPct}%</Text>
              <Text style={s.heroPillLbl}>من راتبك الحالي</Text>
            </View>
            <View style={s.heroPillSep} />
            <View style={s.heroPill}>
              <Text style={s.heroPillNum}>{fI(pen.f * 12)}</Text>
              <Text style={s.heroPillLbl}>ر.س / سنة</Text>
            </View>
          </View>
          <View style={[s.statusBadge, { backgroundColor: earlyOk ? '#10B98120' : '#6366F120' }]}>
            <Text style={[s.statusTxt, { color: earlyOk ? grn : gold }]}>
              {earlyOk ? '✅ مؤهل للتقاعد المبكر' : `⏳ متبقي ${fI(earlyNeed)} شهر للتقاعد المبكر`}
            </Text>
          </View>
        </View>

        {/* نسبة الاستبدال */}
        <View style={[s.section, { flexDirection: 'row', gap: 10 }]}>
          <View style={[s.benchKpi, { borderColor: benchmarkColor + '40' }]}>
            <Text style={s.benchKpiIcon}>💼</Text>
            <Text style={[s.benchKpiVal, { color: benchmarkColor }]}>{benchmarkPct}%</Text>
            <Text style={s.benchKpiLbl}>نسبة الاستبدال</Text>
            <Text style={[s.benchKpiNote, { color: benchmarkColor }]}>
              {benchmarkPct >= 70 ? 'ممتاز ✅' : benchmarkPct >= 50 ? 'مقبول ⚠️' : 'منخفض ❌'}
            </Text>
          </View>
          <View style={[s.benchKpi, { borderColor: (readinessPct >= 1 ? grn : readinessPct >= 0.7 ? gold : red) + '40' }]}>
            <Text style={s.benchKpiIcon}>🎯</Text>
            <Text style={[s.benchKpiVal, { color: readinessPct >= 1 ? grn : readinessPct >= 0.7 ? gold : red }]}>
              {Math.round(Math.min(readinessPct, 1) * 100)}%
            </Text>
            <Text style={s.benchKpiLbl}>مدة التقاعد المبكر</Text>
            <Text style={[s.benchKpiNote, { color: readinessPct >= 1 ? grn : gold }]}>
              {readinessPct >= 1 ? 'اكتملت ✅' : `${fI(earlyNeed)} شهر متبقي`}
            </Text>
          </View>
          <View style={[s.benchKpi, { borderColor: '#3B82F640' }]}>
            <Text style={s.benchKpiIcon}>📅</Text>
            <Text style={[s.benchKpiVal, { color: blu }]}>{yearsToRetire}</Text>
            <Text style={s.benchKpiLbl}>سنة للتقاعد</Text>
            <Text style={[s.benchKpiNote, { color: blu }]}>{ri.rY} سنة هجرية</Text>
          </View>
        </View>

        {/* ─── تفاصيل المعاش ─── */}
        <Section icon="📊" title="تفاصيل احتساب المعاش">
          {pen.fullPen && (
            <Row label="المتوسط المعتمد (قاعدة 150%)" value={`${fI(pen.fullPen.approvedAvg)} ر.س`} color="#94A3B8" />
          )}
          {pen.pO > 0 && <Row label={`مدة قديمة (${fI(ps.oM)} شهر ÷ 600)`} value={`${fI(pen.pO)} ر.س`} color="#F97316" />}
          <Row label={`مدة جديدة (${fI(ps.nM)} شهر ÷ 480)`} value={`${fI(pen.pN)} ر.س`} color={blu} />
          {pen.pV > 0 && <Row label="اشتراك اختياري" value={`+ ${fI(pen.pV)} ر.س`} color={pur} />}
          {pen.fullPen?.diffPension > 0 && (
            <Row label={`فروقات رواتب (${pen.fullPen.diffDetails?.reduce((s, d) => s + d.count, 0)} شهر)`} value={`+ ${fI(pen.fullPen.diffPension)} ر.س`} color={pur} />
          )}
          {pen.dA > 0 && <Row label={`بدل إعالة (${deps} معال)`} value={`+ ${fI(pen.dA)} ر.س`} color={grn} />}
          <View style={s.divider} />
          <Row label="الإجمالي" value={`${fI(pen.f)} ر.س`} color={gold} />
          <Row label="الأجر المعتمد" value={`${fI(salary)} ر.س`} color="#94A3B8" />
          <Row label="إجمالي المدة" value={fMD(ps.tM)} color="#94A3B8" />
        </Section>

        {/* ─── تفاصيل الشرائح ─── */}
        {pen.fullPen?.hasTwoTiers && (
          <Section icon="🏗️" title="شريحتان مستقلتان (م/38)">
            {pen.fullPen.tiers.map((t, i) => (
              <View key={i}>
                <Text style={s.tierLabel}>{t.label}</Text>
                <Row label={`متوسط الشريحة`} value={`${fI(t.avg)} ر.س`} color="#94A3B8" />
                {t.oM > 0 && <Row label={`مدة قديمة (${fI(t.oM)} شهر)`} value={`${fI(t.pO)} ر.س`} color="#F97316" />}
                {t.nM > 0 && <Row label={`مدة جديدة (${fI(t.nM)} شهر)`} value={`${fI(t.pN)} ر.س`} color={blu} />}
                <Row label="معاش الشريحة" value={`${fI(t.sub)} ر.س`} color={gold} />
                {i < pen.fullPen.tiers.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </Section>
        )}

        {/* ─── تفاصيل الفروقات ─── */}
        {pen.fullPen?.hasDiffs && (
          <Section icon="↕️" title="فروقات الرواتب">
            {pen.fullPen.diffDetails.map((d, i) => (
              <View key={i}>
                <Row label={`أشهر الفروقات (${d.count} شهر)`} value={`متوسط: ${fI(d.diffAvg)} ر.س`} color="#94A3B8" />
                <Row label={`معاش الفروقات — ${d.tierLabel}`} value={`${fI(d.dp)} ر.س`} color={pur} />
              </View>
            ))}
          </Section>
        )}

        {/* ─── الوضع التقاعدي ─── */}
        <Section icon="🏁" title="الوضع التقاعدي">
          <Row label="حالتك بتعديلات 2024" value={ri.ex ? 'غير مشمول ✅' : 'مشمول ⚠️'} color={ri.ex ? grn : gold} />
          <Row label="سن التقاعد النظامي" value={`${ri.rY} سنة هجرية`} color="#94A3B8" />
          <Row label="المدة المطلوبة للمبكر" value={`${fI(ri.eR)} شهر (${ri.eY} سنة)`} color="#94A3B8" />
          <Row label="مدتك الحالية" value={`${fI(Math.round(ps.tM))} شهر`} color={earlyOk ? grn : gold} />
          {!earlyOk && <Row label="المتبقي للمبكر" value={`${fI(earlyNeed)} شهر`} color={red} />}
        </Section>

        {/* ─── مسار نمو المعاش ─── */}
        {timelinePoints.length >= 3 && (
          <Section icon="📈" title="مسار نمو معاشك حتى التقاعد">
            <Text style={s.scenarioNote}>المعاش المتوقع لو تقاعدت في كل سنة من الآن:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <AreaChart
                points={timelinePoints}
                width={Math.max(300, width - 44)}
                height={170}
                color={gold}
                target={Math.round(salary * 0.7)}
              />
            </ScrollView>
            <View style={s.timelineLegend}>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: '#475569' }]} />
                <Text style={s.legendTxt}>الآن: {fI(timelinePoints[0].pension)} ر.س/شهر ({fI(Math.round(ps.tM))} شهر)</Text>
              </View>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: gold }]} />
                <Text style={s.legendTxt}>عند التقاعد: {fI(timelinePoints[timelinePoints.length - 1].pension)} ر.س/شهر (+{fI(timelinePoints[timelinePoints.length - 1].pension - timelinePoints[0].pension)} ر.س)</Text>
              </View>
            </View>
          </Section>
        )}

        {/* ─── توصية ذكية ─── */}
        {(() => {
          const target70 = salary * 0.7;
          const allMs = scenarios.filter(sc => sc.type === 'months');
          const hit = allMs.find(sc => sc.newPension >= target70);
          const best = hit || allMs[allMs.length - 1];
          if (!best) return null;
          const hitsPct = Math.round((best.newPension / salary) * 100);
          return (
            <View style={s.recCard}>
              <Text style={s.recIcon}>💡</Text>
              <View style={s.recBody}>
                <Text style={s.recTitle}>
                  {hit ? `أضف ${best.addM >= 12 ? best.addY + ' سنة' : best.addM + ' شهر'} لتحقيق هدفك` : `أفضل تحسين متاح: +${best.addM >= 12 ? best.addY + ' سنة' : best.addM + ' شهر'}`}
                </Text>
                <Text style={s.recSub}>
                  معاشك: {fI(best.newPension)} ر.س ({hitsPct}% من راتبك)
                  {best.breakEvenMonths ? `  •  نقطة التعادل: ${best.breakEvenMonths} شهر` : ''}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* ─── تحليل فجوة المعاش ─── */}
        <Section icon="🎯" title="تحليل فجوة المعاش">
          <Text style={s.scenarioNote}>مقارنة معاشك بهدف استبدال 70% من راتبك الحالي ({fI(Math.round(salary * 0.7))} ر.س):</Text>
          {(() => {
            const maxVal = Math.max(salary, pen.f, ...monthScenarios.slice(0, 3).map(s => s.newPension));
            const items = [
              { label: 'راتبك الحالي', value: salary, color: '#475569', note: '100%' },
              { label: 'هدف 70%', value: Math.round(salary * 0.7), color: grn, note: '70%' },
              { label: 'معاشك الآن', value: Math.round(pen.f), color: benchmarkColor, note: `${benchmarkPct}%` },
              ...monthScenarios.slice(0, 3).map(sc => ({
                label: `+${sc.addM >= 12 ? sc.addY + 'س' : sc.addM + 'ش'}`,
                value: sc.newPension,
                color: blu,
                note: `${Math.round((sc.newPension / salary) * 100)}%`,
              })),
            ];
            const target70pct = Math.round((salary * 0.7 / maxVal) * 100);
            return items.map((item, i) => (
              <View key={i} style={s.gapRow}>
                <Text style={s.gapLabel}>{item.label}</Text>
                <View style={s.gapTrack}>
                  <View style={[s.gapFill, { width: `${Math.min(100, Math.round((item.value / maxVal) * 100))}%`, backgroundColor: item.color }]} />
                  <View style={[s.gapMark, { left: `${target70pct}%` }]} />
                </View>
                <Text style={[s.gapVal, { color: item.color }]}>{fI(item.value)}</Text>
                <Text style={[s.gapPct, { color: item.color }]}>{item.note}</Text>
              </View>
            ));
          })()}
          <Text style={s.gapNote}>الخط العمودي = هدف 70% من الراتب</Text>
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

        {/* ─── سيناريوهات الاشتراك الاختياري ─── */}
        {volScenarios.length > 0 && (
          <Section icon="💎" title="الاشتراك الاختياري في التأمينات">
            <Text style={s.scenarioNote}>
              الاشتراك الاختياري يمكّنك من شراء مدد خدمة إضافية بتكلفة 18% من راتبك شهرياً (حصة الموظف + المنشأة). مناسب لمن ينوي التوقف عن العمل أو يرغب في تحسين معاشه المبكر:
            </Text>
            {volScenarios.map((sc, i) => (
              <View key={i} style={[s.scenarioCard, { borderColor: pur + '40' }]}>
                <View style={s.scenarioLeft}>
                  <Text style={[s.scenarioAdd, { color: pur }]}>💎 {sc.addM >= 12 ? `${sc.addY} سنة` : `${sc.addM} شهر`}</Text>
                  <Text style={s.scenarioCost}>تكلفة شهرية: {fI(sc.monthlyCost)} ر.س</Text>
                  <Text style={s.scenarioCost}>إجمالي التكلفة: {fI(sc.totalCost)} ر.س</Text>
                  {sc.breakEvenMonths && <Text style={s.scenarioBreak}>⚖️ تعادل: {sc.breakEvenMonths} شهر</Text>}
                </View>
                <View style={s.scenarioRight}>
                  <Text style={[s.scenarioDelta, { color: pur }]}>+{fI(sc.delta)} ر.س/شهر</Text>
                  <Text style={s.scenarioNew}>{fI(sc.newPension)} ر.س</Text>
                  <Text style={[s.scenarioNew, { color: grn }]}>+{fI(sc.annualGain)} سنوياً</Text>
                </View>
              </View>
            ))}
            <View style={[s.disclaimer, { marginTop: 4, marginBottom: 0 }]}>
              <Text style={s.disclaimerTxt}>
                💡 الاشتراك الاختياري يُضاف إلى المدد الخاضعة للنظام الجديد (÷480). التكلفة 18% شهرياً تشمل حصة المنشأة التي يدفعها المشترك اختيارياً من جيبه.
              </Text>
            </View>
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
function buildReportHTML({ ps, ri, pen, salary, deps, bd, rd, ageG, ageH, ageNowG, scenarios, volScenarios = [], salScenarios = [], benchmarkPct, readinessPct, earlyNeed }) {
  const N = v => new Intl.NumberFormat('ar-SA').format(Math.round(v));
  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const readinessPctRounded = Math.round(Math.min(readinessPct, 1) * 100);
  const benchClr = benchmarkPct >= 70 ? '#059669' : benchmarkPct >= 50 ? '#D97706' : '#DC2626';
  const readClr = readinessPct >= 1 ? '#059669' : readinessPct >= 0.7 ? '#D97706' : '#DC2626';
  const earlyOk = earlyNeed === 0;

  // بيانات المعاش الكاملة
  const fp = pen.fullPen || {};
  const capApplied = fp.capApplied || false;
  const capLoss = fp.capLoss || 0;
  const rawAvg24 = fp.rawAvg24 || 0;
  const refSal = fp.refSal || 0;
  const sal150 = fp.sal150 || 0;
  const approvedAvg = fp.approvedAvg || salary;
  const hasTwoTiers = fp.hasTwoTiers || false;
  const hasDiffs = fp.hasDiffs || false;
  const diffPension = fp.diffPension || 0;

  // حساب الخسارة الشهرية من قاعدة 150%
  const nM_for_cap = (ps.nM || 0) + (ps.vM || 0);
  const pensionLossFromCap = capApplied ? Math.round(capLoss * (nM_for_cap / 480)) : 0;

  // هل الراتب الحالي كافٍ لرفع القاعدة لو صار هو المرجعي؟
  const salaryNeededForNoCap = rawAvg24 > 0 ? Math.ceil(rawAvg24 / 1.5) : 0;
  const canCurrentSalaryFixCap = salary >= salaryNeededForNoCap;
  const salaryShortfall = Math.max(0, salaryNeededForNoCap - salary);

  const bar = (pct, clr) => `
    <div style="background:#E2E8F0;border-radius:6px;height:10px;overflow:hidden;margin:4px 0 8px;">
      <div style="width:${Math.min(100, Math.round(pct * 100))}%;height:100%;background:${clr};border-radius:6px;"></div>
    </div>`;

  const monthRows = scenarios.map(sc => `
    <tr>
      <td style="font-weight:700">${sc.addM >= 12 ? `${sc.addY} سنة` : `${sc.addM} شهر`}</td>
      <td style="color:#1E3A5F;font-weight:700">${N(sc.newPension)} ر.س</td>
      <td style="color:#059669;font-weight:700">+${N(sc.delta)} ر.س</td>
      <td style="color:#6B7280">${N(sc.totalCost)} ر.س</td>
      <td style="color:#7C3AED">${sc.breakEvenMonths || '—'} شهر</td>
    </tr>`).join('');

  const volRows = volScenarios.map(sc => `
    <tr>
      <td style="font-weight:700">💎 ${sc.addM >= 12 ? `${sc.addY} سنة` : `${sc.addM} شهر`}</td>
      <td style="color:#7C3AED;font-weight:700">${N(sc.monthlyCost)} ر.س/شهر</td>
      <td style="color:#1E3A5F;font-weight:700">${N(sc.newPension)} ر.س</td>
      <td style="color:#059669;font-weight:700">+${N(sc.delta)} ر.س/شهر</td>
      <td style="color:#7C3AED">${sc.breakEvenMonths || '—'} شهر</td>
    </tr>`).join('');

  const salRows = salScenarios.map(sc => `
    <tr>
      <td style="font-weight:700">+${N(sc.salaryBump)} ر.س</td>
      <td style="color:#1E3A5F;font-weight:700">${N(sc.newSalary)} ر.س</td>
      <td style="color:#1E3A5F;font-weight:700">${N(sc.newPension)} ر.س</td>
      <td style="color:#059669;font-weight:700">+${N(sc.delta)} ر.س/شهر</td>
    </tr>`).join('');

  // بناء الخطة التنفيذية الشخصية
  const actionSteps = [];
  let stepNum = 1;

  if (capApplied) {
    actionSteps.push({
      num: stepNum++,
      title: 'معالجة خسارة قاعدة 150% — أعلى أولوية',
      priority: 'عاجل',
      priorityClr: '#DC2626',
      body: canCurrentSalaryFixCap
        ? `راتبك الحالي (${N(salary)} ر.س) كافٍ لرفع القاعدة. الحل: استمر في العمل 60 شهراً إضافياً (5 سنوات) حتى يصبح الشهر المرجعي برواتبك الحالية. سيرتفع السقف إلى ${N(Math.round(salary * 1.5))} ر.س، وهو أعلى من متوسطك (${N(rawAvg24)} ر.س). بعدها لن تُطبَّق القاعدة وسيرتفع معاشك تلقائياً بـ +${N(pensionLossFromCap)} ر.س/شهر.`
        : `راتبك الحالي (${N(salary)} ر.س) غير كافٍ وحده لرفع القاعدة. تحتاج راتباً مرجعياً ≥ ${N(salaryNeededForNoCap)} ر.س (فارق ${N(salaryShortfall)} ر.س). الحلول: (أ) احصل على زيادة راتب ${N(salaryShortfall)} ر.س ثم استمر 60 شهراً — ستُرفع القاعدة نهائياً، أو (ب) عوّض الفرق عبر اشتراك اختياري (تفاصيل أدناه).`,
    });
  }

  if (!earlyOk) {
    actionSteps.push({
      num: stepNum++,
      title: `إكمال مدة التقاعد المبكر — متبقٍ ${N(earlyNeed)} شهر`,
      priority: earlyNeed <= 24 ? 'قريب' : 'متوسط',
      priorityClr: earlyNeed <= 24 ? '#D97706' : '#3B82F6',
      body: volScenarios.length > 0
        ? `تحتاج ${N(earlyNeed)} شهراً للوصول إلى ${N(ri.eR)} شهر (حد التقاعد المبكر). يمكنك تحقيق ذلك بالاشتراك الاختياري بتكلفة إجمالية ${N(Math.round(salary * 0.18 * earlyNeed))} ر.س (${N(Math.round(salary * 0.18))} ر.س/شهر × ${N(earlyNeed)} شهر). هذا يُحقق هدف التقاعد المبكر ويرفع معاشك في نفس الوقت.`
        : `تحتاج ${N(earlyNeed)} شهراً إضافياً للوصول إلى حد التقاعد المبكر (${N(ri.eR)} شهر). تحقق مع التأمينات الاجتماعية عن إمكانية الاشتراك الاختياري لإكمال المدة.`,
    });
  }

  if (benchmarkPct < 70) {
    const allSc = [...scenarios, ...volScenarios];
    const hit70 = allSc.find(sc => sc.newPension >= salary * 0.7);
    const targetGap = Math.round(salary * 0.7) - Math.round(pen.f);
    actionSteps.push({
      num: stepNum++,
      title: `رفع نسبة الاستبدال من ${benchmarkPct}% إلى هدف 70%`,
      priority: benchmarkPct < 50 ? 'ضروري' : 'مهم',
      priorityClr: benchmarkPct < 50 ? '#DC2626' : '#D97706',
      body: hit70
        ? `الفجوة الحالية: ${N(targetGap)} ر.س/شهر. أقرب سيناريو يحقق 70%: إضافة ${hit70.addM >= 12 ? hit70.addY + ' سنة' : hit70.addM + ' شهر'} (${hit70.type === 'voluntary' ? 'اشتراك اختياري' : 'استمرار في الخدمة'}) بتكلفة إجمالية ${N(hit70.totalCost)} ر.س، ونقطة تعادل ${hit70.breakEvenMonths} شهر.`
        : `الفجوة الحالية: ${N(targetGap)} ر.س/شهر (تحتاج معاشاً ${N(Math.round(salary * 0.7))} ر.س). راجع جداول السيناريوهات أدناه واختر الأنسب لوضعك.`,
    });
  }

  if (salScenarios.length > 0 && benchmarkPct < 80) {
    actionSteps.push({
      num: stepNum++,
      title: 'تحسين الأجر المعتمد عبر زيادة الراتب',
      priority: 'مستحسن',
      priorityClr: '#3B82F6',
      body: `كل ${N(salScenarios[0]?.salaryBump || 500)} ر.س زيادة في راتبك تضيف ${N(salScenarios[0]?.delta || 0)} ر.س/شهر لمعاشك مدى الحياة${capApplied ? '. وإذا تجاوز راتبك ' + N(salaryNeededForNoCap) + ' ر.س واستمريت 60 شهراً ستُحل مشكلة قاعدة 150% أيضاً' : ''}. راجع جدول تأثير الراتب أدناه.`,
    });
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير اعرف تقاعدك</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', 'Tajawal', 'Arial', sans-serif; background: #F8FAFC; color: #0F172A; direction: rtl; }
    .page { max-width: 820px; margin: 0 auto; background: #fff; }
    .cover { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1e293b 100%); color: #fff; padding: 50px 40px 40px; text-align: center; }
    .cover-logo { font-size: 44px; margin-bottom: 10px; }
    .cover-title { font-size: 30px; font-weight: 900; color: #F59E0B; margin-bottom: 6px; letter-spacing: 1px; }
    .cover-sub { font-size: 14px; color: #94A3B8; margin-bottom: 30px; }
    .cover-hero { background: rgba(255,255,255,0.06); border: 1px solid rgba(245,158,11,0.3); border-radius: 20px; padding: 28px; margin: 0 auto; max-width: 480px; }
    .cover-pension { font-size: 56px; font-weight: 900; color: #F59E0B; line-height: 1; }
    .cover-pension-lbl { font-size: 13px; color: #94A3B8; margin-top: 6px; margin-bottom: 18px; }
    .cover-pills { display: flex; justify-content: center; gap: 20px; margin-top: 6px; }
    .cover-pill { text-align: center; }
    .cover-pill-val { font-size: 20px; font-weight: 900; color: #fff; }
    .cover-pill-lbl { font-size: 10px; color: #64748B; }
    .cover-sep { width: 1px; background: rgba(255,255,255,0.15); }
    .cover-date { font-size: 11px; color: #475569; margin-top: 24px; }
    .kpis { display: flex; gap: 0; border-bottom: 2px solid #F1F5F9; }
    .kpi { flex: 1; padding: 20px 16px; text-align: center; border-left: 1px solid #F1F5F9; }
    .kpi:last-child { border-left: none; }
    .kpi-val { font-size: 28px; font-weight: 900; }
    .kpi-lbl { font-size: 10px; color: #64748B; margin-top: 3px; }
    .kpi-note { font-size: 10px; font-weight: 700; margin-top: 4px; }
    .section { padding: 28px 36px; border-bottom: 1px solid #F1F5F9; }
    .section-title { font-size: 15px; font-weight: 700; color: #0F172A; border-right: 4px solid #F59E0B; padding-right: 12px; margin-bottom: 18px; }
    .section-alt { background: #FAFBFF; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-lbl { color: #64748B; }
    .detail-val { font-weight: 700; }
    .readiness-box { background: linear-gradient(135deg, #F0FDF4, #ECFDF5); border: 1px solid #A7F3D0; border-radius: 14px; padding: 20px; margin-bottom: 16px; }
    .readiness-box.warn { background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border-color: #FDE68A; }
    .readiness-box.danger { background: linear-gradient(135deg, #FEF2F2, #FEE2E2); border-color: #FECACA; }
    .readiness-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 8px; }
    th { background: #1E293B; color: #F59E0B; padding: 11px 14px; text-align: right; font-size: 12px; }
    td { padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; }
    tr:nth-child(even) td { background: #F8FAFC; }
    tr:hover td { background: #F0F9FF; }
    .alert-box { background: #FFFBEB; border: 1px solid #FDE68A; border-right: 4px solid #F59E0B; border-radius: 12px; padding: 14px 16px; margin: 12px 0; font-size: 12px; color: #92400E; line-height: 1.8; }
    .info-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-right: 4px solid #3B82F6; border-radius: 12px; padding: 14px 16px; margin: 12px 0; font-size: 12px; color: #1E40AF; line-height: 1.8; }
    .danger-box { background: #FEF2F2; border: 1px solid #FECACA; border-right: 4px solid #DC2626; border-radius: 12px; padding: 14px 16px; margin: 12px 0; font-size: 12px; color: #7F1D1D; line-height: 1.8; }
    .success-box { background: #F0FDF4; border: 1px solid #A7F3D0; border-right: 4px solid #10B981; border-radius: 12px; padding: 14px 16px; margin: 12px 0; font-size: 12px; color: #064E3B; line-height: 1.8; }
    .purple-box { background: #FDFBFF; border: 1px solid #DDD6FE; border-right: 4px solid #7C3AED; border-radius: 12px; padding: 14px 16px; margin: 12px 0; font-size: 12px; color: #4C1D95; line-height: 1.8; }
    .cap-header { background: linear-gradient(135deg, #7F1D1D, #991B1B); color: #fff; padding: 18px 22px; border-radius: 12px 12px 0 0; }
    .cap-header-title { font-size: 16px; font-weight: 900; margin-bottom: 5px; }
    .cap-header-sub { font-size: 12px; color: #FCA5A5; line-height: 1.6; }
    .cap-body { border: 2px solid #FECACA; border-top: none; border-radius: 0 0 12px 12px; padding: 20px 22px; margin-bottom: 16px; background: #FFF8F8; }
    .cap-numbers { display: flex; gap: 10px; margin: 16px 0; flex-wrap: wrap; }
    .cap-num-card { flex: 1; min-width: 120px; background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; text-align: center; }
    .cap-num-val { font-size: 17px; font-weight: 900; }
    .cap-num-lbl { font-size: 10px; color: #64748B; margin-top: 4px; line-height: 1.4; }
    .action-plan { padding: 32px 36px; background: linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%); }
    .action-plan-title { font-size: 19px; font-weight: 900; color: #F59E0B; margin-bottom: 6px; }
    .action-plan-sub { font-size: 12px; color: #64748B; margin-bottom: 22px; }
    .action-step { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 20px; margin-bottom: 14px; }
    .action-step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .action-num { width: 34px; height: 34px; background: #F59E0B; color: #0F172A; border-radius: 50%; font-size: 15px; font-weight: 900; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
    .action-step-title { font-size: 13px; font-weight: 700; color: #F1F5F9; flex: 1; }
    .action-priority { font-size: 10px; padding: 3px 10px; border-radius: 20px; font-weight: 700; white-space: nowrap; }
    .action-step-body { font-size: 12px; color: #94A3B8; line-height: 1.9; padding-right: 46px; }
    .rec-box { background: linear-gradient(135deg, #ECFDF5, #F0FDF4); border: 1px solid #6EE7B7; border-right: 4px solid #10B981; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; }
    .rec-title { font-size: 14px; font-weight: 700; color: #065F46; margin-bottom: 6px; }
    .rec-body { font-size: 12px; color: #047857; line-height: 1.7; }
    .footer { background: #0F172A; color: #475569; text-align: center; padding: 28px 36px; font-size: 11px; line-height: 1.9; }
    .footer strong { color: #F59E0B; }
    @media print { body { background: white; } .page { max-width: 100%; } }
  </style>
</head>
<body>
<div class="page">

  <!-- غلاف التقرير -->
  <div class="cover">
    <div class="cover-logo">🏛️</div>
    <div class="cover-title">اعرف تقاعدك</div>
    <div class="cover-sub">تقرير تحليلي شامل للمعاش التقاعدي — مُصدَر بتاريخ ${today}</div>
    <div class="cover-hero">
      <div style="font-size:12px;color:#94A3B8;margin-bottom:6px;">المعاش التقاعدي المتوقع</div>
      <div class="cover-pension">${N(pen.f)}</div>
      <div class="cover-pension-lbl">ريال سعودي شهرياً — ${N(pen.f * 12)} ر.س سنوياً</div>
      <div class="cover-pills">
        <div class="cover-pill"><div class="cover-pill-val" style="color:${benchClr}">${benchmarkPct}%</div><div class="cover-pill-lbl">من الراتب</div></div>
        <div class="cover-sep"></div>
        <div class="cover-pill"><div class="cover-pill-val">${N(Math.round(ps.tM))}</div><div class="cover-pill-lbl">شهر خدمة</div></div>
        <div class="cover-sep"></div>
        <div class="cover-pill"><div class="cover-pill-val" style="color:${earlyOk ? '#10B981' : '#F59E0B'}">${earlyOk ? '✅' : N(earlyNeed)}</div><div class="cover-pill-lbl">${earlyOk ? 'مؤهل للمبكر' : 'شهر للمبكر'}</div></div>
      </div>
    </div>
    ${capApplied ? `<div style="background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.4);border-radius:10px;padding:10px 16px;margin-top:18px;font-size:12px;color:#FCA5A5;">⚠️ تنبيه: تم تطبيق قاعدة 150% — راجع التحليل التفصيلي داخل التقرير</div>` : ''}
  </div>

  <!-- مؤشرات الاستعداد -->
  <div class="kpis">
    <div class="kpi"><div class="kpi-val" style="color:${benchClr}">${benchmarkPct}%</div><div class="kpi-lbl">نسبة الاستبدال</div><div class="kpi-note" style="color:${benchClr}">${benchmarkPct >= 70 ? 'ممتاز ✅' : benchmarkPct >= 50 ? 'مقبول ⚠️' : 'يحتاج تحسين ❌'}</div></div>
    <div class="kpi"><div class="kpi-val" style="color:${readClr}">${readinessPctRounded}%</div><div class="kpi-lbl">مدة التقاعد المبكر</div><div class="kpi-note" style="color:${readClr}">${earlyOk ? 'اكتملت ✅' : `${N(earlyNeed)} شهر متبقي`}</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#3B82F6">${ri.rY}</div><div class="kpi-lbl">سن التقاعد النظامي</div><div class="kpi-note" style="color:#3B82F6">سنة هجرية</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#0F172A">${N(salary)}</div><div class="kpi-lbl">الأجر المعتمد</div><div class="kpi-note" style="color:#64748B">ر.س / شهر</div></div>
  </div>

  <!-- تفاصيل احتساب المعاش -->
  <div class="section">
    <div class="section-title">📊 تفاصيل احتساب المعاش</div>
    ${capApplied ? `
    <div class="detail-row"><span class="detail-lbl">متوسط آخر 24 شهر (قبل التقييد)</span><span class="detail-val" style="color:#DC2626">${N(rawAvg24)} ر.س</span></div>
    <div class="detail-row"><span class="detail-lbl">⚠️ المتوسط المعتمد (مُقيَّد بقاعدة 150%)</span><span class="detail-val" style="color:#DC2626">${N(approvedAvg)} ر.س</span></div>
    <div class="detail-row"><span class="detail-lbl" style="color:#DC2626">الخسارة الشهرية جراء القاعدة</span><span class="detail-val" style="color:#DC2626">−${N(pensionLossFromCap)} ر.س/شهر</span></div>` :
    `${approvedAvg ? `<div class="detail-row"><span class="detail-lbl">الأجر المعتمد ✅</span><span class="detail-val">${N(approvedAvg)} ر.س</span></div>` : ''}`}
    ${ps.oM > 0 ? `<div class="detail-row"><span class="detail-lbl">المدة القديمة (${N(ps.oM)} شهر ÷ 600)</span><span class="detail-val" style="color:#F97316">${N(pen.pO)} ر.س</span></div>` : ''}
    <div class="detail-row"><span class="detail-lbl">المدة الجديدة (${N(ps.nM)} شهر ÷ 480)</span><span class="detail-val" style="color:#3B82F6">${N(pen.pN)} ر.س</span></div>
    ${pen.pV > 0 ? `<div class="detail-row"><span class="detail-lbl">الاشتراك الاختياري (${N(ps.vM)} شهر)</span><span class="detail-val" style="color:#7C3AED">+ ${N(pen.pV)} ر.س</span></div>` : ''}
    ${hasDiffs && diffPension > 0 ? `<div class="detail-row"><span class="detail-lbl">فروقات الرواتب ✅</span><span class="detail-val" style="color:#8B5CF6">+ ${N(diffPension)} ر.س</span></div>` : ''}
    ${pen.dA > 0 ? `<div class="detail-row"><span class="detail-lbl">بدل الإعالة (${deps} معال)</span><span class="detail-val" style="color:#10B981">+ ${N(pen.dA)} ر.س</span></div>` : ''}
    <div style="border-top:2px solid #F59E0B;margin:12px 0;"></div>
    <div class="detail-row"><span class="detail-lbl" style="font-weight:700;font-size:14px;">المعاش الإجمالي الشهري</span><span class="detail-val" style="color:#D97706;font-size:22px;">${N(pen.f)} ر.س</span></div>
    <div class="detail-row"><span class="detail-lbl">المعاش السنوي</span><span class="detail-val" style="color:#D97706">${N(pen.f * 12)} ر.س</span></div>
    <div class="detail-row"><span class="detail-lbl">المعاش على مدى 20 سنة</span><span class="detail-val" style="color:#D97706">${N(pen.f * 240)} ر.س</span></div>
    ${bar(Math.min(benchmarkPct / 100, 1), benchClr)}
    <div style="font-size:11px;color:#64748B;text-align:center;">نسبة الاستبدال: ${benchmarkPct}% ${benchmarkPct >= 70 ? '— تجاوزت هدف 70% ✅' : `— هدفك ${N(Math.round(salary * 0.7))} ر.س (فجوة: ${N(Math.round(salary * 0.7) - Math.round(pen.f))} ر.س/شهر)`}</div>
  </div>

  <!-- الوضع التقاعدي -->
  <div class="section section-alt">
    <div class="section-title">🏁 الوضع التقاعدي</div>
    <div class="${earlyOk ? 'readiness-box' : readinessPct >= 0.7 ? 'readiness-box warn' : 'readiness-box danger'}">
      <div class="readiness-title" style="color:${readClr}">${earlyOk ? '✅ مؤهل للتقاعد المبكر' : `⏳ ${N(earlyNeed)} شهر متبقية للتقاعد المبكر`}</div>
      ${bar(Math.min(readinessPct, 1), readClr)}
      <div style="font-size:11px;color:#64748B">${N(Math.round(ps.tM))} شهر من أصل ${N(ri.eR)} شهر مطلوب (${readinessPctRounded}%)</div>
    </div>
    <div class="detail-row"><span class="detail-lbl">تاريخ الميلاد</span><span class="detail-val">${bd}</span></div>
    <div class="detail-row"><span class="detail-lbl">تاريخ التقاعد المستهدف</span><span class="detail-val">${rd}</span></div>
    <div class="detail-row"><span class="detail-lbl">عمر التقاعد</span><span class="detail-val">${ageG} م / ${ageH} هـ</span></div>
    <div class="detail-row"><span class="detail-lbl">سن التقاعد النظامي</span><span class="detail-val">${ri.rY} سنة هجرية</span></div>
    <div class="detail-row"><span class="detail-lbl">متطلب التقاعد المبكر</span><span class="detail-val">${N(ri.eR)} شهر (${ri.eY} سنة)</span></div>
    <div class="detail-row"><span class="detail-lbl">خضوع لتعديلات 2024</span><span class="detail-val" style="color:${ri.ex ? '#059669' : '#D97706'}">${ri.ex ? 'غير مشمول ✓' : 'مشمول ⚠️'}</span></div>
    ${deps > 0 ? `<div class="detail-row"><span class="detail-lbl">بدل الإعالة</span><span class="detail-val" style="color:#10B981">${deps >= 3 ? '20%' : deps === 2 ? '15%' : '10%'} من المعاش القديم (${deps} معال = +${N(pen.dA)} ر.س)</span></div>` : ''}
    ${hasTwoTiers ? `<div class="detail-row"><span class="detail-lbl">نظام المدتين م/38</span><span class="detail-val" style="color:#10B981">مُطبَّق ✅ (لصالحك)</span></div>` : ''}
    ${hasDiffs ? `<div class="detail-row"><span class="detail-lbl">فروقات الرواتب</span><span class="detail-val" style="color:#8B5CF6">+${N(diffPension)} ر.س/شهر ✅</span></div>` : ''}
  </div>

  ${capApplied ? `
  <!-- تحليل قاعدة 150% -->
  <div class="section" style="background:#FFF8F8; padding-bottom: 32px;">
    <div class="section-title" style="border-color:#DC2626;color:#7F1D1D;">⚠️ تحليل قاعدة 150% — التأثير والحلول</div>
    <div class="cap-header">
      <div class="cap-header-title">⚠️ تم تطبيق قاعدة 150% على معاشك</div>
      <div class="cap-header-sub">راتبك الأخير نما بنسبة تجاوزت 50% عن الراتب المرجعي قبل 60 شهراً — هذا أدى إلى تقييد الأجر المعتمد وخفض معاشك</div>
    </div>
    <div class="cap-body">
      <p style="font-size:13px;line-height:2;color:#374151;margin-bottom:18px;">
        بموجب <strong>نظام التأمينات الاجتماعية م/33 — قرار مجلس الإدارة بتاريخ 3/7/2024م</strong>، يُحدَّد الأجر المعتمد في احتساب المعاش بما لا يتجاوز <strong>150%</strong> من الراتب الأساسي الذي كان يتقاضاه المشترك قبل <strong>60 شهراً (5 سنوات)</strong> من تاريخ انتهاء الخدمة.
        <br><br>
        <strong>نص اللائحة:</strong> <em>"يُعتمد في احتساب المتوسط الأجر الفعلي لآخر 24 شهراً، بشرط ألا يتجاوز هذا المتوسط نسبة 150% من الأجر الأساسي الذي كان يتقاضاه المشترك قبل 60 شهراً من تاريخ انتهاء الخدمة."</em>
      </p>
      <div class="cap-numbers">
        <div class="cap-num-card">
          <div class="cap-num-val" style="color:#DC2626">${N(rawAvg24)} ر.س</div>
          <div class="cap-num-lbl">متوسطك الفعلي (آخر 24 شهر)</div>
        </div>
        <div class="cap-num-card">
          <div class="cap-num-val" style="color:#D97706">${N(refSal)} ر.س</div>
          <div class="cap-num-lbl">الراتب المرجعي (قبل 60 شهر)</div>
        </div>
        <div class="cap-num-card">
          <div class="cap-num-val" style="color:#7C3AED">${N(sal150)} ر.س</div>
          <div class="cap-num-lbl">السقف الأقصى (150% × المرجعي)</div>
        </div>
        <div class="cap-num-card">
          <div class="cap-num-val" style="color:#059669">${N(approvedAvg)} ر.س</div>
          <div class="cap-num-lbl">المتوسط المعتمد فعلياً</div>
        </div>
      </div>
      <div class="danger-box">
        <strong>📉 كم خسرت بسبب هذه القاعدة؟</strong><br>
        فارق المتوسط المُقيَّد: <strong>${N(Math.round(rawAvg24 - sal150))} ر.س</strong><br>
        الخسارة الشهرية من معاشك: <strong>−${N(pensionLossFromCap)} ر.س/شهر</strong><br>
        الخسارة السنوية: <strong>−${N(pensionLossFromCap * 12)} ر.س/سنة</strong><br>
        الخسارة على مدى 20 سنة: <strong>−${N(pensionLossFromCap * 240)} ر.س</strong>
      </div>
      <div style="font-size:14px;font-weight:700;color:#0F172A;margin:20px 0 12px;">🛠 الحلول المتاحة — مُرتَّبة من الأرخص للأغلى:</div>
      <div class="alert-box">
        <strong>الحل 1 — الأسهل: الاستمرار في العمل 60 شهراً إضافياً</strong><br><br>
        آلية العمل: كل شهر تستمر في العمل، ينتقل الشهر المرجعي خطوة للأمام نحو رواتب أعلى. بعد <strong>60 شهراً (5 سنوات)</strong> يصبح الراتب المرجعي هو راتبك في تاريخ اليوم، والسقف الجديد = <strong>${N(Math.round(salary * 1.5))} ر.س</strong>.<br><br>
        ${canCurrentSalaryFixCap
          ? `✅ <strong>القاعدة تُرفع نهائياً بحقك:</strong> السقف الجديد (${N(Math.round(salary * 1.5))} ر.س) أعلى من متوسطك (${N(rawAvg24)} ر.س). الاستمرار 60 شهراً يضيف +${N(pensionLossFromCap)} ر.س/شهر بدون أي تكلفة مباشرة.`
          : `⚠️ <strong>تنبيه: راتبك الحالي وحده لا يكفي.</strong> السقف الجديد (${N(Math.round(salary * 1.5))} ر.س) سيظل أقل من متوسطك (${N(rawAvg24)} ر.س). تحتاج رفع الراتب أيضاً — انظر الحل 2.`
        }
      </div>
      <div class="info-box">
        <strong>الحل 2 — زيادة الراتب قبل التقاعد بـ 60 شهراً</strong><br><br>
        ${canCurrentSalaryFixCap
          ? `راتبك الحالي (${N(salary)} ر.س) كافٍ لرفع القاعدة. لا تحتاج زيادة — يكفيك الاستمرار 60 شهراً فقط. لكن زيادة إضافية ستعزز معاشك أكثر.`
          : `تحتاج رفع راتبك بمقدار <strong>${N(salaryShortfall)} ر.س</strong> (من ${N(salary)} إلى ${N(salaryNeededForNoCap)} ر.س)، ثم الاستمرار 60 شهراً. عندها: السقف الجديد = ${N(Math.round(salaryNeededForNoCap * 1.5))} ر.س ≥ متوسطك (${N(rawAvg24)} ر.س) — القاعدة تُرفع ✅`
        }
      </div>
      <div class="purple-box">
        <strong>الحل 3 — تعويض الخسارة بالاشتراك الاختياري (إذا تعذّر الحلان السابقان)</strong><br><br>
        ${volScenarios.length > 0
          ? `مثال: اشتراك اختياري ${volScenarios[0]?.addM} أشهر بتكلفة شهرية ${N(volScenarios[0]?.monthlyCost)} ر.س يضيف +${N(volScenarios[0]?.delta)} ر.س/شهر (نقطة تعادل: ${volScenarios[0]?.breakEvenMonths} شهر). التكلفة الشهرية = 18% × ${N(salary)} = ${N(Math.round(salary * 0.18))} ر.س. راجع جدول الاشتراك الاختياري أدناه.`
          : `التكلفة الشهرية للاشتراك الاختياري = 18% × ${N(salary)} = ${N(Math.round(salary * 0.18))} ر.س. اشتراك 24 شهراً يُكلف ${N(Math.round(salary * 0.18 * 24))} ر.س ويضيف مدة خدمة تؤثر إيجابياً.`
        }
      </div>
      <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:10px;padding:14px 16px;margin-top:14px;font-size:12px;color:#064E3B;line-height:1.8;">
        <strong>✅ الخلاصة والتوصية لحالتك:</strong><br>
        ${canCurrentSalaryFixCap
          ? `الخيار الأمثل: الاستمرار في الخدمة 60 شهراً إضافياً — تكلفتك الوحيدة هي الوقت، ومكسبك +${N(pensionLossFromCap)} ر.س/شهر مدى الحياة (${N(pensionLossFromCap * 240)} ر.س على 20 سنة).`
          : `الخيار الأمثل: (1) احصل على زيادة راتب ${N(salaryShortfall)} ر.س، ثم (2) استمر 60 شهراً. المكسب: رفع معاشك بالكامل من القيد. إذا تعذّر، استخدم الاشتراك الاختياري لتعويض جزء من الخسارة.`
        }
      </div>
    </div>
  </div>` : ''}

  ${hasTwoTiers ? `
  <div class="section">
    <div class="section-title">✅ نظام المدتين — المادة 38 (م/38)</div>
    <div class="success-box">
      <strong>تم تطبيق نظام المدتين على معاشك — هذه ميزة لصالحك</strong><br><br>
      يُطبَّق نظام المدتين عندما تتضمن مسيرتك فترتين بفارق متوسط رواتب يزيد عن 10% وكل فترة ≥ 24 شهراً. يُحتسب معاش كل فترة بشكل مستقل بناءً على متوسطها الخاص، مما يحمي معاشك من الانخفاض بسبب رواتب قديمة أقل.
      ${hasDiffs && diffPension > 0 ? `<br><br><strong>فروقات الرواتب:</strong> الأشهر التي تجاوز فيها راتبك 110% من متوسط فترتها أضافت <strong>+${N(diffPension)} ر.س/شهر</strong> إضافياً — محتسبة تلقائياً، لا إجراء مطلوب.` : ''}
    </div>
  </div>` : ''}

  ${actionSteps.length > 0 ? `
  <div class="action-plan">
    <div class="action-plan-title">📋 خطتك التنفيذية الشخصية</div>
    <div class="action-plan-sub">خطوات مُرتَّبة حسب الأولوية بناءً على وضعك الفعلي — اقرأها كلها قبل اتخاذ أي قرار</div>
    ${actionSteps.map(step => `
    <div class="action-step">
      <div class="action-step-header">
        <div class="action-num">${step.num}</div>
        <div class="action-step-title">${step.title}</div>
        <div class="action-priority" style="background:rgba(255,255,255,0.08);color:${step.priorityClr};border:1px solid ${step.priorityClr}40">${step.priority}</div>
      </div>
      <div class="action-step-body">${step.body}</div>
    </div>`).join('')}
  </div>` : ''}

  ${scenarios.length > 0 ? `
  <div class="section">
    <div class="section-title">💡 سيناريوهات تحسين المعاش — إضافة أشهر خدمة (9%)</div>
    <div class="alert-box">تكلفة كل شهر إضافي = 9% من راتبك (${N(Math.round(salary * 0.09))} ر.س/شهر) — حصة الموظف فقط.</div>
    <table>
      <tr><th>المدة المضافة</th><th>المعاش الجديد</th><th>الزيادة الشهرية</th><th>إجمالي التكلفة</th><th>نقطة التعادل</th></tr>
      ${monthRows}
    </table>
  </div>` : ''}

  ${volScenarios.length > 0 ? `
  <div class="section section-alt">
    <div class="section-title">💎 الاشتراك الاختياري في التأمينات الاجتماعية (18%)</div>
    <div class="info-box">
      <strong>ما هو الاشتراك الاختياري؟</strong><br>
      يمكّنك من شراء مدد خدمة إضافية مباشرةً من التأمينات الاجتماعية، وتدفع أنت حصة الموظف والمنشأة معاً (18% من الراتب شهرياً). مناسب لمن يقترب من التقاعد أو توقف عن العمل.
    </div>
    <table>
      <tr style="background:#4C1D95"><th style="color:#DDD6FE">المدة المضافة</th><th style="color:#DDD6FE">التكلفة الشهرية</th><th style="color:#DDD6FE">المعاش الجديد</th><th style="color:#DDD6FE">الزيادة الشهرية</th><th style="color:#DDD6FE">نقطة التعادل</th></tr>
      ${volRows}
    </table>
    <div style="font-size:11px;color:#7C3AED;margin-top:10px;text-align:center;">التكلفة الشهرية = 18% × ${N(salary)} = ${N(Math.round(salary * 0.18))} ر.س/شهر</div>
  </div>` : ''}

  ${salScenarios.length > 0 ? `
  <div class="section">
    <div class="section-title">💰 أثر زيادة الراتب على المعاش</div>
    <div class="alert-box">كل زيادة في الأجر المعتمد تنعكس مباشرةً على معاشك مدى الحياة${capApplied ? `. وإذا تجاوز راتبك ${N(salaryNeededForNoCap)} ر.س واستمريت 60 شهراً، ستُحل مشكلة قاعدة 150% أيضاً` : ''}.</div>
    <table>
      <tr><th>زيادة الراتب</th><th>الراتب الجديد</th><th>المعاش الجديد</th><th>الزيادة الشهرية</th></tr>
      ${salRows}
    </table>
  </div>` : ''}

  ${(() => {
    const allMs = scenarios;
    const target70 = salary * 0.7;
    const hit = allMs.find(sc => sc.newPension >= target70);
    const best = hit || allMs[allMs.length - 1];
    if (!best) return '';
    const pct = Math.round((best.newPension / salary) * 100);
    return `
  <div class="section section-alt">
    <div class="section-title">🎯 التوصية الذكية</div>
    <div class="rec-box">
      <div class="rec-title">${hit ? `أضف ${best.addM >= 12 ? best.addY + ' سنة' : best.addM + ' شهر'} لتحقيق هدف 70% من راتبك` : `أفضل سيناريو متاح — يرفع معاشك إلى ${pct}%`}</div>
      <div class="rec-body">
        📌 المعاش المتوقع: <strong>${N(best.newPension)} ر.س/شهر</strong> (${pct}% من راتبك)<br>
        💸 إجمالي التكلفة: <strong>${N(best.totalCost)} ر.س</strong><br>
        ⚖️ نقطة التعادل: <strong>${best.breakEvenMonths} شهر</strong> — بعدها كل شهر ربح صافٍ<br>
        📅 الفائدة على 20 سنة: <strong>+${N(best.delta * 240)} ر.س</strong> مقابل تكلفة ${N(best.totalCost)} ر.س
      </div>
    </div>
  </div>`;
  })()}

  <div class="footer">
    <strong>تقرير اعرف تقاعدك</strong> — تقرير للتوعية المالية الشخصية<br>
    صُنع هذا التقرير استناداً إلى نظام م/33 وقرار مجلس إدارة مؤسسة التأمينات الاجتماعية بتاريخ 3/7/2024م<br>
    الأرقام تقديرية والأجر المعتمد = متوسط آخر 24 شهر (يُستخدم هنا آخر راتب تقريباً)<br>
    <strong>الرقم الرسمي والملزم قانونياً لدى مؤسسة التأمينات الاجتماعية فقط</strong><br><br>
    تاريخ إصدار التقرير: ${today}
  </div>

</div>
</body>
</html>`;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07091C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111830', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: '#F1F5F9' },
  exportBtn: { backgroundColor: '#111830', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#1C2848' },
  exportTxt: { fontSize: 12, color: '#6366F1', fontFamily: 'Cairo_700Bold' },
  scroll: { padding: 20, paddingBottom: 50 },

  heroCard: { backgroundColor: '#111830', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#6366F130', shadowColor: '#6366F1', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  heroSubtitle: { fontSize: 11, color: '#94A3B8', letterSpacing: 1.5, marginBottom: 4, fontFamily: 'Cairo_400Regular' },
  heroPills: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#07091C', borderRadius: 14, paddingVertical: 14, marginVertical: 10, borderWidth: 1, borderColor: '#1C2848' },
  heroPill: { flex: 1, alignItems: 'center' },
  heroPillNum: { fontSize: 18, fontFamily: 'Cairo_900Black', color: '#F59E0B', marginBottom: 2 },
  heroPillLbl: { fontSize: 9, color: '#64748B', textAlign: 'center', fontFamily: 'Cairo_400Regular' },
  heroPillSep: { width: 1, height: 34, backgroundColor: '#1C2848' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  statusTxt: { fontSize: 12, fontFamily: 'Cairo_700Bold' },
  benchKpi: { flex: 1, backgroundColor: '#07091C', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  benchKpiIcon: { fontSize: 18, marginBottom: 4 },
  benchKpiVal: { fontSize: 22, fontFamily: 'Cairo_900Black', marginBottom: 2 },
  benchKpiLbl: { fontSize: 9, color: '#64748B', textAlign: 'center', marginBottom: 4, fontFamily: 'Cairo_400Regular' },
  benchKpiNote: { fontSize: 9, fontFamily: 'Cairo_600SemiBold', textAlign: 'center' },
  timelineLegend: { marginTop: 10, gap: 6 },

  section: { backgroundColor: '#111830', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1C2848' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#F1F5F9' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#07091C' },
  rowLabel: { fontSize: 12, color: '#94A3B8', flex: 1, lineHeight: 18, fontFamily: 'Cairo_400Regular' },
  rowValue: { fontSize: 13, fontFamily: 'Cairo_700Bold', textAlign: 'right' },
  rowSub: { fontSize: 10, color: '#64748B', textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#1C2848', marginVertical: 8 },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 12, color: '#CBD5E1', fontFamily: 'Cairo_400Regular' },

  scenarioNote: { fontSize: 11, color: '#64748B', marginBottom: 12, lineHeight: 18, fontFamily: 'Cairo_400Regular' },
  scenarioCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#07091C', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1C2848' },
  scenarioLeft: {},
  scenarioAdd: { fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#F1F5F9', marginBottom: 3 },
  scenarioCost: { fontSize: 10, color: '#64748B', fontFamily: 'Cairo_400Regular' },
  scenarioRight: { alignItems: 'flex-end' },
  scenarioDelta: { fontSize: 15, fontFamily: 'Cairo_900Black', color: '#10B981', marginBottom: 2 },
  scenarioNew: { fontSize: 10, color: '#64748B', fontFamily: 'Cairo_400Regular' },
  scenarioBreak: { fontSize: 9, color: '#8B5CF6', marginTop: 2 },

  recCard: { backgroundColor: '#10B98112', borderRadius: 16, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: '#10B98130', borderRightWidth: 3, borderRightColor: '#10B981' },
  recIcon: { fontSize: 22, marginTop: 1 },
  recBody: { flex: 1 },
  recTitle: { fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#10B981', marginBottom: 4 },
  recSub: { fontSize: 11, color: '#6EE7B7', lineHeight: 18, fontFamily: 'Cairo_400Regular' },

  gapRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9, gap: 6 },
  gapLabel: { fontSize: 9, color: '#94A3B8', width: 56, textAlign: 'right', fontFamily: 'Cairo_400Regular' },
  gapTrack: { flex: 1, height: 18, backgroundColor: '#07091C', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  gapFill: { height: '100%', borderRadius: 4, opacity: 0.8 },
  gapMark: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#10B981' },
  gapVal: { fontSize: 11, fontFamily: 'Cairo_700Bold', width: 46, textAlign: 'right' },
  gapPct: { fontSize: 9, fontFamily: 'Cairo_700Bold', width: 28, textAlign: 'right' },
  gapNote: { fontSize: 9, color: '#475569', textAlign: 'center', marginTop: 6, fontFamily: 'Cairo_400Regular' },

  disclaimer: { backgroundColor: '#111830', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1C2848', borderRightWidth: 3, borderRightColor: '#6366F1' },
  disclaimerTxt: { fontSize: 11, color: '#64748B', lineHeight: 19, fontFamily: 'Cairo_400Regular' },

  recalcBtn: { borderWidth: 1.5, borderColor: '#1C2848', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  recalcTxt: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#94A3B8' },
  tierLabel: { fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#6366F1', marginBottom: 6, marginTop: 4 },
});