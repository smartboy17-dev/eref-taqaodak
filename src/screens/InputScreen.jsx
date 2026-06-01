import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { psSummary, retInfo, penCalc, psAtDate, ageNow, ageAt, SYS_OPTS, mdfCal, fI } from '../utils/pension';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@eref_input_v1';

const SYS_ICONS = {
  'تأمينات - قطاع حكومي': '🏛️',
  'تأمينات - قطاع خاص': '🏢',
  'تقاعد مدني': '📋',
  'تقاعد عسكري': '⚔️',
  'اشتراك اختياري': '💎',
};

const STEPS = ['المعلومات الأساسية', 'مدد الخدمة', 'الراتب'];

const isValidDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime());

export default function InputScreen({ navigation, route }) {
  const isDemo = route?.params?.demo;
  const [step, setStep] = useState(0);
  const [bd, setBd] = useState('');
  const [rd, setRd] = useState('');
  const [deps, setDeps] = useState(0);
  const [periods, setPeriods] = useState([
    { id: 1, sy: 'تأمينات - قطاع حكومي', sd: '', ed: '', ac: false, sl: 0, cal: 'g' },
  ]);
  const [salary, setSalary] = useState('');

  // تحميل البيانات المحفوظة
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (!json) return;
      try {
        const saved = JSON.parse(json);
        if (saved.bd) setBd(saved.bd);
        if (saved.rd) setRd(saved.rd);
        if (saved.deps != null) setDeps(saved.deps);
        if (saved.periods?.length) setPeriods(saved.periods);
        if (saved.salary) setSalary(saved.salary);
      } catch {}
    });
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ bd, rd, deps, periods, salary })).catch(() => {});
  }, [bd, rd, deps, periods, salary]);

  const addPeriod = () =>
    setPeriods(p => [...p, { id: Date.now(), sy: 'تأمينات - قطاع حكومي', sd: '', ed: '', ac: false, sl: 0, cal: 'g' }]);

  const updatePeriod = (id, field, val) =>
    setPeriods(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));

  const removePeriod = id => setPeriods(p => p.filter(x => x.id !== id));

  const goNext = () => {
    if (step === 0) {
      if (!bd || !isValidDate(bd)) return Alert.alert('', 'أدخل تاريخ ميلاد صحيح بصيغة YYYY-MM-DD');
      if (!rd || !isValidDate(rd)) return Alert.alert('', 'أدخل تاريخ تقاعد صحيح بصيغة YYYY-MM-DD');
      if (new Date(rd) <= new Date(bd)) return Alert.alert('', 'تاريخ التقاعد يجب أن يكون بعد تاريخ الميلاد');
      setStep(1);
    } else if (step === 1) {
      for (const p of periods) {
        if (!p.sd || !isValidDate(p.sd)) return Alert.alert('', 'أدخل تاريخ بداية صحيح لكل مدة');
        if (!p.ac && (!p.ed || !isValidDate(p.ed))) return Alert.alert('', 'أدخل تاريخ نهاية صحيح أو فعّل "لا تزال سارية"');
        if (!p.ac && new Date(p.ed) < new Date(p.sd)) return Alert.alert('', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      }
      setStep(2);
    } else {
      if (!salary || isNaN(+salary) || +salary <= 0) return Alert.alert('', 'أدخل راتباً صحيحاً');
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
    const ageG = ageAt(bd, rd).g;
    const ageH = ageAt(bd, rd).h;
    const ageNowG = ageNow(bd).g;
    navigation.navigate('Preview', { ps, ri, pen, salary: sal, deps, bd, rd, ageG, ageH, ageNowG, periods: periodsWithSt, isDemo });
  };

  const clearData = () =>
    Alert.alert('مسح البيانات', 'هل تريد مسح كل البيانات المحفوظة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح', style: 'destructive', onPress: () => { setBd(''); setRd(''); setDeps(0); setSalary(''); setPeriods([{ id: 1, sy: 'تأمينات - قطاع حكومي', sd: '', ed: '', ac: false, sl: 0, cal: 'g' }]); AsyncStorage.removeItem(STORAGE_KEY); } },
    ]);

  const aEnd = rd || new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>→</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{STEPS[step]}</Text>
        <TouchableOpacity onPress={clearData}>
          <Text style={s.clearTxt}>مسح</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={s.progressBg}>
        <View style={[s.progressFg, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>
      <Text style={s.stepHint}>الخطوة {step + 1} من {STEPS.length}</Text>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ═══ الخطوة 1 ═══ */}
          {step === 0 && (
            <View>
              <Field label="📅 تاريخ الميلاد" hint="مثال: 1980-06-15">
                <TextInput style={[s.input, bd && !isValidDate(bd) && s.inputErr]} value={bd} onChangeText={setBd} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" keyboardType="numbers-and-punctuation" />
              </Field>

              <Field label="🗓️ تاريخ التقاعد المستهدف" hint="متى تخطط للتقاعد؟">
                <TextInput style={[s.input, rd && !isValidDate(rd) && s.inputErr]} value={rd} onChangeText={setRd} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" keyboardType="numbers-and-punctuation" />
              </Field>

              {bd && rd && isValidDate(bd) && isValidDate(rd) && (
                <View style={s.infoCard}>
                  <InfoRow icon="🎂" label="عمرك الآن" value={`${ageNow(bd).g} سنة`} />
                  <InfoRow icon="🏁" label="عمر التقاعد" value={`${ageAt(bd, rd).g} م / ${ageAt(bd, rd).h} هـ`} />
                  <InfoRow icon="⏱" label="المدة حتى التقاعد" value={`${Math.max(0, Math.round((new Date(rd) - new Date()) / 864e5 / 30.44))} شهر تقريباً`} />
                </View>
              )}

              <Field label="👨‍👩‍👧 عدد المعالين">
                <View style={s.depsRow}>
                  {[0, 1, 2, 3].map(n => (
                    <TouchableOpacity key={n} style={[s.depBtn, deps === n && s.depBtnActive]} onPress={() => setDeps(n)}>
                      <Text style={[s.depBtnTxt, deps === n && s.depBtnTxtActive]}>
                        {n === 0 ? 'لا يوجد' : n === 3 ? '3+' : String(n)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
              {deps > 0 && <Text style={s.depsNote}>✅ بدل الإعالة: {deps >= 3 ? '20%' : deps === 2 ? '15%' : '10%'} من المعاش القديم (÷600)</Text>}
            </View>
          )}

          {/* ═══ الخطوة 2 ═══ */}
          {step === 1 && (
            <View>
              <Text style={s.sectionHint}>أضف جميع فترات الاشتراك في التأمينات أو التقاعد المدني</Text>
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

                  <Text style={s.fieldLabel}>نوع النظام</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                      {SYS_OPTS.map(opt => (
                        <TouchableOpacity key={opt} style={[s.sysChip, p.sy === opt && s.sysChipActive]} onPress={() => updatePeriod(p.id, 'sy', opt)}>
                          <Text style={s.sysChipIcon}>{SYS_ICONS[opt]}</Text>
                          <Text style={[s.sysChipTxt, p.sy === opt && s.sysChipTxtActive]}>{opt.replace('تأمينات - ', '')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Field label="تاريخ البداية" hint="YYYY-MM-DD">
                    <TextInput style={[s.input, p.sd && !isValidDate(p.sd) && s.inputErr]} value={p.sd} onChangeText={v => updatePeriod(p.id, 'sd', v)} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" keyboardType="numbers-and-punctuation" />
                  </Field>

                  <View style={s.activeRow}>
                    <Text style={s.fieldLabel}>لا تزال سارية</Text>
                    <Switch value={p.ac} onValueChange={v => updatePeriod(p.id, 'ac', v)} trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor={p.ac ? '#0F172A' : '#64748B'} />
                  </View>

                  {!p.ac && (
                    <Field label="تاريخ النهاية" hint="YYYY-MM-DD">
                      <TextInput style={[s.input, p.ed && !isValidDate(p.ed) && s.inputErr]} value={p.ed} onChangeText={v => updatePeriod(p.id, 'ed', v)} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" keyboardType="numbers-and-punctuation" />
                    </Field>
                  )}

                  <Field label="الراتب الأساسي (ر.س)">
                    <TextInput style={s.input} value={p.sl ? String(p.sl) : ''} onChangeText={v => updatePeriod(p.id, 'sl', +v || 0)} placeholder="0" placeholderTextColor="#475569" keyboardType="numeric" />
                  </Field>

                  {p.sd && isValidDate(p.sd) && (p.ac || (p.ed && isValidDate(p.ed))) && (
                    <View style={s.periodSummary}>
                      <Text style={s.periodSummaryTxt}>
                        ⏱ {fI(Math.round(mdfCal(p.sd, p.ac ? aEnd : p.ed, 'g').t))} شهر
                        {p.sl > 0 ? ` • الراتب: ${fI(p.sl)} ر.س` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity style={s.addPeriodBtn} onPress={addPeriod}>
                <Text style={s.addPeriodTxt}>+ إضافة مدة خدمة أخرى</Text>
              </TouchableOpacity>

              {/* إجمالي المدد */}
              {periods.some(p => p.sd && isValidDate(p.sd) && (p.ac || (p.ed && isValidDate(p.ed)))) && (
                <View style={s.totalCard}>
                  <Text style={s.totalLabel}>إجمالي المدد المدخلة</Text>
                  <Text style={s.totalVal}>
                    {fI(Math.round(periods.reduce((sum, p) => {
                      if (!p.sd || !isValidDate(p.sd)) return sum;
                      if (!p.ac && (!p.ed || !isValidDate(p.ed))) return sum;
                      return sum + mdfCal(p.sd, p.ac ? aEnd : p.ed, 'g').t;
                    }, 0)))} شهر
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ═══ الخطوة 3 ═══ */}
          {step === 2 && (
            <View>
              <Field label="💰 آخر راتب أساسي (ر.س)" hint="الراتب المعتمد لاحتساب المعاش — الحد الأعلى 45,000 ر.س">
                <TextInput style={[s.input, s.inputLarge]} value={salary} onChangeText={setSalary} placeholder="أدخل الراتب" placeholderTextColor="#475569" keyboardType="numeric" />
              </Field>

              {salary && +salary > 0 && (
                <View style={s.salCard}>
                  <Text style={s.salLabel}>الراتب المعتمد في الاحتساب</Text>
                  <Text style={s.salVal}>{fI(Math.min(+salary, 45000))} ر.س</Text>
                  {+salary > 45000 && <Text style={s.capNote}>⚠️ تجاوز الحد الأعلى — سيُحتسب بـ 45,000 ر.س</Text>}
                </View>
              )}

              {/* ملخص كامل قبل الحساب */}
              <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>📋 مراجعة البيانات</Text>
                <InfoRow icon="📅" label="الميلاد" value={bd} />
                <InfoRow icon="🏁" label="التقاعد" value={rd} />
                <InfoRow icon="👨‍👩‍👧" label="المعالون" value={deps > 0 ? String(deps) : 'لا يوجد'} />
                <InfoRow icon="📌" label="عدد المدد" value={`${periods.length} مدة`} />
                {salary && <InfoRow icon="💰" label="الراتب" value={`${fI(Math.min(+salary, 45000))} ر.س`} />}
              </View>

              <View style={s.disclaimerBox}>
                <Text style={s.disclaimerTxt}>
                  💡 الأرقام تقديرية بناءً على نظام م/33 وقرار 3/7/2024م. الراتب المعتمد = متوسط آخر 24 شهر (نُستخدم آخر راتب تقريباً).
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={s.nextBtnTxt}>
              {step < 2 ? 'التالي ←' : '🔍 احسب معاشي التقاعدي'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── مكونات مساعدة ─────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    {hint && <Text style={s.fieldHint}>{hint}</Text>}
    {children}
  </View>
);

const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoIcon}>{icon}</Text>
    <Text style={s.infoLabel}>{label}:</Text>
    <Text style={s.infoVal}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  clearTxt: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  progressBg: { height: 3, backgroundColor: '#1E293B', marginHorizontal: 20, borderRadius: 2 },
  progressFg: { height: 3, backgroundColor: '#F59E0B', borderRadius: 2 },
  stepHint: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 6, marginBottom: 2 },
  scroll: { padding: 20, paddingBottom: 50 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 6 },
  fieldHint: { fontSize: 10, color: '#475569', marginBottom: 5 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: '#F1F5F9', fontSize: 15, borderWidth: 1, borderColor: '#334155', textAlign: 'right' },
  inputErr: { borderColor: '#EF4444' },
  inputLarge: { fontSize: 26, fontWeight: '900', color: '#F59E0B', textAlign: 'center', paddingVertical: 20, borderColor: '#F59E0B50' },
  sectionHint: { fontSize: 12, color: '#94A3B8', marginBottom: 16, lineHeight: 20 },

  infoCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  infoIcon: { fontSize: 14, width: 22 },
  infoLabel: { fontSize: 12, color: '#64748B', flex: 1 },
  infoVal: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },

  depsRow: { flexDirection: 'row', gap: 8 },
  depBtn: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  depBtnActive: { backgroundColor: '#F59E0B15', borderColor: '#F59E0B' },
  depBtnTxt: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  depBtnTxtActive: { color: '#F59E0B', fontWeight: '800' },
  depsNote: { fontSize: 11, color: '#10B981', marginTop: 8, marginBottom: 4 },

  periodCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  periodNum: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  removeBtn: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  sysChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0F172A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  sysChipActive: { backgroundColor: '#F59E0B15', borderColor: '#F59E0B' },
  sysChipIcon: { fontSize: 13 },
  sysChipTxt: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  sysChipTxtActive: { color: '#F59E0B', fontWeight: '800' },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  periodSummary: { backgroundColor: '#0F172A', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#10B98120' },
  periodSummaryTxt: { fontSize: 12, color: '#10B981', fontWeight: '700' },

  addPeriodBtn: { borderWidth: 1.5, borderColor: '#334155', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  addPeriodTxt: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  totalCard: { backgroundColor: '#F59E0B10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F59E0B30', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#D97706', fontWeight: '600' },
  totalVal: { fontSize: 18, color: '#F59E0B', fontWeight: '900' },

  salCard: { backgroundColor: '#10B98110', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#10B98130', alignItems: 'center', marginBottom: 16 },
  salLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  salVal: { fontSize: 28, fontWeight: '900', color: '#10B981' },
  capNote: { fontSize: 11, color: '#F59E0B', marginTop: 6 },

  summaryCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: '#F59E0B', marginBottom: 12 },
  disclaimerBox: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 10, borderRightWidth: 3, borderRightColor: '#F59E0B', borderWidth: 1, borderColor: '#334155' },
  disclaimerTxt: { fontSize: 11, color: '#64748B', lineHeight: 18 },

  nextBtn: { backgroundColor: '#F59E0B', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  nextBtnTxt: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
});
