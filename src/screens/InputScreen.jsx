import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { psSummary, retInfo, penCalc, psAtDate, ageNow, ageAt, SYS_OPTS, mdfCal, dateToHijriParts, fmt, fI } from '../utils/pension';

const SYS_ICONS = { 'تأمينات - قطاع حكومي': '🏛️', 'تأمينات - قطاع خاص': '🏢', 'تقاعد مدني': '📋', 'تقاعد عسكري': '⚔️', 'اشتراك اختياري': '💎' };

const STEPS = ['المعلومات الأساسية', 'مدد الخدمة', 'الراتب والتقرير'];

export default function InputScreen({ navigation, route }) {
  const isDemo = route?.params?.demo;

  const [step, setStep] = useState(0);

  // Step 1
  const [bd, setBd] = useState('');
  const [rd, setRd] = useState('');
  const [deps, setDeps] = useState(0);

  // Step 2 — periods
  const [periods, setPeriods] = useState([{ id: 1, sy: 'تأمينات - قطاع حكومي', sd: '', ed: '', ac: false, sl: 0, cal: 'g' }]);

  // Step 3
  const [salary, setSalary] = useState('');

  const addPeriod = () => setPeriods(p => [...p, { id: Date.now(), sy: 'تأمينات - قطاع حكومي', sd: '', ed: '', ac: false, sl: 0, cal: 'g' }]);
  const updatePeriod = (id, field, val) => setPeriods(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));
  const removePeriod = id => setPeriods(p => p.filter(x => x.id !== id));

  const goNext = () => {
    if (step === 0) {
      if (!bd) return Alert.alert('', 'أدخل تاريخ الميلاد');
      if (!rd) return Alert.alert('', 'أدخل تاريخ التقاعد المتوقع');
      setStep(1);
    } else if (step === 1) {
      const valid = periods.every(p => p.sd && (p.ac || p.ed));
      if (!valid) return Alert.alert('', 'أكمل تواريخ المدد');
      setStep(2);
    } else {
      if (!salary || +salary <= 0) return Alert.alert('', 'أدخل الراتب الأساسي');
      doCalculate();
    }
  };

  const doCalculate = () => {
    const aEnd = rd || new Date().toISOString().split('T')[0];
    const periodsWithSt = periods.map(p => ({ ...p, st: 'منتهي' }));
    const ps = psSummary(periodsWithSt, aEnd);
    const psRF = psAtDate(periodsWithSt, '2024-07-03');
    const ri = retInfo(bd, psRF.tM);
    const sal = Math.min(+salary, 45000);
    const pen = penCalc(ps, sal, deps);
    const ageG = bd ? ageAt(bd, rd).g : 0;
    const ageH = bd ? ageAt(bd, rd).h : 0;
    const ageNowG = bd ? ageNow(bd).g : 0;

    navigation.navigate('Preview', {
      ps, ri, pen, salary: sal, deps, bd, rd, ageG, ageH, ageNowG,
      periods: periodsWithSt, isDemo,
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>→</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{STEPS[step]}</Text>
        <Text style={s.stepBadge}>{step + 1}/{STEPS.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <View style={[s.progressFg, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ═══ الخطوة 1: المعلومات الأساسية ═══ */}
          {step === 0 && (
            <View>
              <Text style={s.sectionTitle}>📅 تاريخ الميلاد</Text>
              <Text style={s.fieldHint}>بالصيغة: YYYY-MM-DD</Text>
              <TextInput style={s.input} value={bd} onChangeText={setBd} placeholder="مثال: 1980-06-15" placeholderTextColor="#475569" keyboardType="numeric" />

              <Text style={s.sectionTitle}>🗓️ تاريخ التقاعد المستهدف</Text>
              <Text style={s.fieldHint}>متى تخطط للتقاعد؟</Text>
              <TextInput style={s.input} value={rd} onChangeText={setRd} placeholder="مثال: 2035-01-01" placeholderTextColor="#475569" keyboardType="numeric" />

              {bd && rd && (
                <View style={s.infoCard}>
                  <Text style={s.infoRow}>🎂 عمرك الآن: <Text style={s.infoVal}>{ageNow(bd).g} سنة ميلادية</Text></Text>
                  <Text style={s.infoRow}>🏁 عمر التقاعد: <Text style={s.infoVal}>{ageAt(bd, rd).g} سنة ميلادية ({ageAt(bd, rd).h} هجرية)</Text></Text>
                </View>
              )}

              <Text style={s.sectionTitle}>👨‍👩‍👧 عدد المعالين</Text>
              <View style={s.depsRow}>
                {[0, 1, 2, 3].map(n => (
                  <TouchableOpacity key={n} style={[s.depBtn, deps === n && s.depBtnActive]} onPress={() => setDeps(n)}>
                    <Text style={[s.depBtnTxt, deps === n && s.depBtnTxtActive]}>{n === 3 ? '3+' : n === 0 ? 'لا يوجد' : n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {deps > 0 && <Text style={s.depsNote}>بدل الإعالة: {deps >= 3 ? '20%' : deps === 2 ? '15%' : '10%'} من المعاش القديم</Text>}
            </View>
          )}

          {/* ═══ الخطوة 2: مدد الخدمة ═══ */}
          {step === 1 && (
            <View>
              <Text style={s.sectionHint}>أدخل جميع فترات عملك في التأمينات أو التقاعد المدني</Text>
              {periods.map((p, i) => (
                <View key={p.id} style={s.periodCard}>
                  <View style={s.periodHeader}>
                    <Text style={s.periodNum}>📌 المدة {i + 1}</Text>
                    {periods.length > 1 && (
                      <TouchableOpacity onPress={() => removePeriod(p.id)}>
                        <Text style={s.removeBtn}>✕ حذف</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* نوع النظام */}
                  <Text style={s.fieldLabel}>نوع النظام</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sysScroll}>
                    {SYS_OPTS.map(opt => (
                      <TouchableOpacity key={opt} style={[s.sysChip, p.sy === opt && s.sysChipActive]} onPress={() => updatePeriod(p.id, 'sy', opt)}>
                        <Text style={s.sysChipIcon}>{SYS_ICONS[opt]}</Text>
                        <Text style={[s.sysChipTxt, p.sy === opt && s.sysChipTxtActive]}>{opt.replace('تأمينات - ', '')}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* تاريخ البداية */}
                  <Text style={s.fieldLabel}>تاريخ البداية</Text>
                  <TextInput style={s.input} value={p.sd} onChangeText={v => updatePeriod(p.id, 'sd', v)} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" keyboardType="numeric" />

                  {/* لا تزال سارية */}
                  <View style={s.activeRow}>
                    <Text style={s.fieldLabel}>لا تزال سارية؟</Text>
                    <Switch value={p.ac} onValueChange={v => updatePeriod(p.id, 'ac', v)} trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor={p.ac ? '#0F172A' : '#64748B'} />
                  </View>

                  {/* تاريخ النهاية */}
                  {!p.ac && (
                    <>
                      <Text style={s.fieldLabel}>تاريخ النهاية</Text>
                      <TextInput style={s.input} value={p.ed} onChangeText={v => updatePeriod(p.id, 'ed', v)} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" keyboardType="numeric" />
                    </>
                  )}

                  {/* الراتب */}
                  <Text style={s.fieldLabel}>الراتب في هذه الفترة (ر.س)</Text>
                  <TextInput style={s.input} value={p.sl ? String(p.sl) : ''} onChangeText={v => updatePeriod(p.id, 'sl', +v)} placeholder="الراتب الأساسي" placeholderTextColor="#475569" keyboardType="numeric" />

                  {/* ملخص المدة */}
                  {p.sd && (p.ac || p.ed) && (
                    <View style={s.periodSummary}>
                      <Text style={s.periodSummaryTxt}>
                        ⏱ {fI(mdfCal(p.sd, p.ac ? (rd || new Date().toISOString().split('T')[0]) : p.ed, 'g').t)} شهر تقريباً
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity style={s.addPeriodBtn} onPress={addPeriod}>
                <Text style={s.addPeriodTxt}>+ إضافة مدة أخرى</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ الخطوة 3: الراتب ═══ */}
          {step === 2 && (
            <View>
              <Text style={s.sectionTitle}>💰 آخر راتب أساسي</Text>
              <Text style={s.fieldHint}>الراتب المعتمد لاحتساب المعاش (الحد الأعلى 45,000 ر.س)</Text>
              <TextInput style={[s.input, s.inputLarge]} value={salary} onChangeText={setSalary} placeholder="0" placeholderTextColor="#475569" keyboardType="numeric" />
              {salary && +salary > 0 && (
                <Text style={s.salNote}>الراتب المعتمد: {fI(Math.min(+salary, 45000))} ر.س</Text>
              )}
              {salary && +salary > 45000 && (
                <Text style={s.capNote}>⚠️ الراتب تجاوز الحد الأعلى — سيُحتسب بـ 45,000 ر.س</Text>
              )}

              <View style={s.summaryPreview}>
                <Text style={s.summaryTitle}>ملخص البيانات</Text>
                {bd && <Text style={s.summaryRow}>📅 الميلاد: {bd}</Text>}
                {rd && <Text style={s.summaryRow}>🏁 التقاعد: {rd}</Text>}
                <Text style={s.summaryRow}>📋 عدد المدد: {periods.length}</Text>
                {deps > 0 && <Text style={s.summaryRow}>👨‍👩‍👧 المعالون: {deps}</Text>}
              </View>
            </View>
          )}

          {/* زر التالي */}
          <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={s.nextBtnTxt}>
              {step < 2 ? 'التالي →' : '🔍 احسب معاشي التقاعدي'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  stepBadge: { backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  progressBg: { height: 3, backgroundColor: '#1E293B', marginHorizontal: 20, borderRadius: 2 },
  progressFg: { height: 3, backgroundColor: '#F59E0B', borderRadius: 2 },
  scroll: { padding: 20, paddingBottom: 40 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#F1F5F9', marginTop: 20, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#94A3B8', marginBottom: 16, lineHeight: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 12, marginBottom: 5 },
  fieldHint: { fontSize: 11, color: '#64748B', marginBottom: 8 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: '#F1F5F9', fontSize: 15, borderWidth: 1, borderColor: '#334155', textAlign: 'right' },
  inputLarge: { fontSize: 24, fontWeight: '800', color: '#F59E0B', textAlign: 'center', paddingVertical: 18, borderColor: '#F59E0B40', borderWidth: 1.5 },

  infoCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#334155' },
  infoRow: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  infoVal: { color: '#F59E0B', fontWeight: '700' },

  depsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  depBtn: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  depBtnActive: { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' },
  depBtnTxt: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  depBtnTxtActive: { color: '#F59E0B' },
  depsNote: { fontSize: 11, color: '#10B981', marginTop: 8 },

  periodCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  periodNum: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  removeBtn: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  sysScroll: { marginBottom: 4 },
  sysChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0F172A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8, borderWidth: 1, borderColor: '#334155' },
  sysChipActive: { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' },
  sysChipIcon: { fontSize: 13 },
  sysChipTxt: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  sysChipTxtActive: { color: '#F59E0B' },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  periodSummary: { backgroundColor: '#0F172A', borderRadius: 8, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#10B98130' },
  periodSummaryTxt: { fontSize: 12, color: '#10B981', fontWeight: '700' },

  addPeriodBtn: { borderWidth: 1.5, borderColor: '#334155', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  addPeriodTxt: { fontSize: 14, fontWeight: '700', color: '#64748B' },

  salNote: { fontSize: 13, color: '#10B981', textAlign: 'center', marginTop: 8, fontWeight: '700' },
  capNote: { fontSize: 12, color: '#F59E0B', textAlign: 'center', marginTop: 6 },
  summaryPreview: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: '#F59E0B', marginBottom: 10 },
  summaryRow: { fontSize: 12, color: '#94A3B8', marginBottom: 6 },

  nextBtn: { backgroundColor: '#F59E0B', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 24, shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  nextBtnTxt: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
});
