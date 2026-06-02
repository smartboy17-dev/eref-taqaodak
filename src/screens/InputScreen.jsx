import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { psSummary, retInfo, penCalc, psAtDate, ageNow, ageAt, SYS_OPTS, mdfCal, fI, hijriStrToIso, isoToHijriStr } from '../utils/pension';

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

const isValidHijri = v => {
  const n = (v || '').replace(/\//g, '-');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n)) return false;
  const [y, m, d] = n.split('-').map(Number);
  return y >= 1300 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 30;
};

const toGreg = (raw, mode) => {
  if (mode === 'h') {
    if (!isValidHijri(raw)) return '';
    return hijriStrToIso(raw.replace(/\//g, '-')) || '';
  }
  return raw;
};

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

  // أوضاع التقويم — هجري أو ميلادي لكل حقل
  const [bdMode, setBdMode] = useState('g');
  const [rdMode, setRdMode] = useState('g');
  const [bdRaw, setBdRaw] = useState(''); // ما كتبه المستخدم (قد يكون هجري)
  const [rdRaw, setRdRaw] = useState('');

  // تحميل البيانات المحفوظة
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (!json) return;
      try {
        const saved = JSON.parse(json);
        if (saved.bd) { setBd(saved.bd); setBdRaw(saved.bd); }
        if (saved.rd) { setRd(saved.rd); setRdRaw(saved.rd); }
        if (saved.deps != null) setDeps(saved.deps);
        if (saved.periods?.length) setPeriods(saved.periods);
        if (saved.salary) setSalary(saved.salary);
      } catch {}
    });
  }, []);

  const handleDateChange = (raw, mode, setRaw, setGreg) => {
    setRaw(raw);
    const greg = toGreg(raw, mode);
    setGreg(greg);
  };

  const handleModeChange = (newMode, currentGreg, setMode, setRaw) => {
    setMode(newMode);
    if (newMode === 'h' && isValidDate(currentGreg)) {
      setRaw(isoToHijriStr(currentGreg));
    } else if (newMode === 'g' && isValidDate(currentGreg)) {
      setRaw(currentGreg);
    } else {
      setRaw('');
    }
  };

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
              <DateField
                label="📅 تاريخ الميلاد"
                raw={bdRaw} greg={bd} mode={bdMode}
                onChangeRaw={v => handleDateChange(v, bdMode, setBdRaw, setBd)}
                onModeChange={m => handleModeChange(m, bd, setBdMode, setBdRaw)}
              />

              <DateField
                label="🗓️ تاريخ التقاعد المستهدف"
                raw={rdRaw} greg={rd} mode={rdMode}
                onChangeRaw={v => handleDateChange(v, rdMode, setRdRaw, setRd)}
                onModeChange={m => handleModeChange(m, rd, setRdMode, setRdRaw)}
              />

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

                  <PeriodDateField
                    label="تاريخ البداية"
                    value={p.sd} mode={p.pdm || 'g'}
                    onChangeText={v => {
                      const greg = toGreg(v, p.pdm || 'g');
                      updatePeriod(p.id, 'sd', greg || v);
                      updatePeriod(p.id, 'sdRaw', v);
                    }}
                    onModeChange={m => {
                      const newRaw = m === 'h' && isValidDate(p.sd) ? isoToHijriStr(p.sd) : p.sd;
                      updatePeriod(p.id, 'pdm', m);
                      updatePeriod(p.id, 'sdRaw', newRaw);
                    }}
                    rawVal={p.sdRaw || p.sd}
                    greg={p.sd}
                  />

                  <View style={s.activeRow}>
                    <Text style={s.fieldLabel}>لا تزال سارية</Text>
                    <Switch value={p.ac} onValueChange={v => updatePeriod(p.id, 'ac', v)} trackColor={{ false: '#1C2848', true: '#6366F1' }} thumbColor={p.ac ? '#07091C' : '#64748B'} />
                  </View>

                  {!p.ac && (
                    <PeriodDateField
                      label="تاريخ النهاية"
                      value={p.ed} mode={p.pdm || 'g'}
                      onChangeText={v => {
                        const greg = toGreg(v, p.pdm || 'g');
                        updatePeriod(p.id, 'ed', greg || v);
                        updatePeriod(p.id, 'edRaw', v);
                      }}
                      onModeChange={m => {
                        const newRaw = m === 'h' && isValidDate(p.ed) ? isoToHijriStr(p.ed) : p.ed;
                        updatePeriod(p.id, 'pdm', m);
                        updatePeriod(p.id, 'edRaw', newRaw);
                      }}
                      rawVal={p.edRaw || p.ed}
                      greg={p.ed}
                    />
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

// حقل تاريخ مع toggle هجري/ميلادي (الخطوة 1)
const DateField = ({ label, raw, greg, mode, onChangeRaw, onModeChange }) => {
  const isH = mode === 'h';
  const valid = isH ? isValidHijri(raw) : isValidDate(raw);
  const invalid = raw && raw.length > 4 && !valid;
  const hint = isH && isValidHijri(raw)
    ? `ميلادي: ${hijriStrToIso(raw.replace(/\//g, '-')) || '—'}`
    : !isH && isValidDate(greg)
    ? `هجري: ${isoToHijriStr(greg)}`
    : isH ? 'مثال: 1395-06-15' : 'مثال: 1975-06-15';
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={s.dualLabelRow}>
        <Text style={s.fieldLabel}>{label}</Text>
        <View style={s.calToggle}>
          <TouchableOpacity style={[s.calBtn, mode === 'g' && s.calBtnActive]} onPress={() => onModeChange('g')}>
            <Text style={[s.calBtnTxt, mode === 'g' && s.calBtnTxtActive]}>م</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.calBtn, mode === 'h' && s.calBtnActive]} onPress={() => onModeChange('h')}>
            <Text style={[s.calBtnTxt, mode === 'h' && s.calBtnTxtActive]}>هـ</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={[s.input, invalid && s.inputErr]}
        value={raw}
        onChangeText={onChangeRaw}
        placeholder={isH ? 'YYYY-MM-DD (هجري)' : 'YYYY-MM-DD (ميلادي)'}
        placeholderTextColor="#475569"
        keyboardType="numbers-and-punctuation"
      />
      <Text style={[s.calHint, { color: invalid ? '#EF4444' : '#10B981' }]}>{hint}</Text>
    </View>
  );
};

// حقل تاريخ مدة (الخطوة 2) — أبسط
const PeriodDateField = ({ label, rawVal, greg, mode, onChangeText, onModeChange }) => {
  const isH = mode === 'h';
  const valid = isH ? isValidHijri(rawVal) : isValidDate(rawVal);
  const invalid = rawVal && rawVal.length > 4 && !valid;
  const hint = isH && isValidHijri(rawVal)
    ? `م: ${hijriStrToIso(rawVal.replace(/\//g, '-')) || '—'}`
    : !isH && isValidDate(greg)
    ? `هـ: ${isoToHijriStr(greg)}`
    : '';
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={s.dualLabelRow}>
        <Text style={s.fieldLabel}>{label}</Text>
        <View style={s.calToggle}>
          <TouchableOpacity style={[s.calBtn, mode === 'g' && s.calBtnActive]} onPress={() => onModeChange('g')}>
            <Text style={[s.calBtnTxt, mode === 'g' && s.calBtnTxtActive]}>م</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.calBtn, mode === 'h' && s.calBtnActive]} onPress={() => onModeChange('h')}>
            <Text style={[s.calBtnTxt, mode === 'h' && s.calBtnTxtActive]}>هـ</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={[s.input, invalid && s.inputErr]}
        value={rawVal}
        onChangeText={onChangeText}
        placeholder={isH ? 'YYYY-MM-DD (هجري)' : 'YYYY-MM-DD'}
        placeholderTextColor="#475569"
        keyboardType="numbers-and-punctuation"
      />
      {hint ? <Text style={s.calHint}>{hint}</Text> : null}
    </View>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoIcon}>{icon}</Text>
    <Text style={s.infoLabel}>{label}:</Text>
    <Text style={s.infoVal}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07091C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111830', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: '#F1F5F9' },
  clearTxt: { fontSize: 12, color: '#EF4444', fontFamily: 'Cairo_600SemiBold' },
  progressBg: { height: 3, backgroundColor: '#111830', marginHorizontal: 20, borderRadius: 2 },
  progressFg: { height: 3, backgroundColor: '#6366F1', borderRadius: 2 },
  stepHint: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 6, marginBottom: 2 },
  scroll: { padding: 20, paddingBottom: 50 },

  dualLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  calToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#1C2848' },
  calBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#111830' },
  calBtnActive: { backgroundColor: '#6366F1' },
  calBtnTxt: { fontSize: 12, color: '#64748B', fontFamily: 'Cairo_700Bold' },
  calBtnTxtActive: { color: '#07091C' },
  calHint: { fontSize: 10, color: '#10B981', marginTop: 4, textAlign: 'right' },
  fieldLabel: { fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#94A3B8', marginBottom: 0 },
  fieldHint: { fontSize: 10, color: '#475569', marginBottom: 5 },
  input: { backgroundColor: '#111830', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: '#F1F5F9', fontSize: 15, borderWidth: 1, borderColor: '#1C2848', textAlign: 'right' },
  inputErr: { borderColor: '#EF4444' },
  inputLarge: { fontSize: 26, fontFamily: 'Cairo_900Black', color: '#6366F1', textAlign: 'center', paddingVertical: 20, borderColor: '#6366F150' },
  sectionHint: { fontSize: 12, color: '#94A3B8', marginBottom: 16, lineHeight: 20 },

  infoCard: { backgroundColor: '#111830', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1C2848' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  infoIcon: { fontSize: 14, width: 22 },
  infoLabel: { fontSize: 12, color: '#64748B', flex: 1 },
  infoVal: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#6366F1' },

  depsRow: { flexDirection: 'row', gap: 8 },
  depBtn: { flex: 1, backgroundColor: '#111830', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1C2848' },
  depBtnActive: { backgroundColor: '#6366F115', borderColor: '#6366F1' },
  depBtnTxt: { fontSize: 11, color: '#64748B', fontFamily: 'Cairo_600SemiBold' },
  depBtnTxtActive: { color: '#6366F1', fontFamily: 'Cairo_700Bold' },
  depsNote: { fontSize: 11, color: '#10B981', marginTop: 8, marginBottom: 4 },

  periodCard: { backgroundColor: '#111830', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1C2848' },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  periodNum: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#6366F1' },
  removeBtn: { fontSize: 12, color: '#EF4444', fontFamily: 'Cairo_600SemiBold' },
  sysChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#07091C', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1C2848', marginBottom: 8 },
  sysChipActive: { backgroundColor: '#6366F115', borderColor: '#6366F1' },
  sysChipIcon: { fontSize: 13 },
  sysChipTxt: { fontSize: 11, color: '#64748B', fontFamily: 'Cairo_600SemiBold' },
  sysChipTxtActive: { color: '#6366F1', fontFamily: 'Cairo_700Bold' },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  periodSummary: { backgroundColor: '#07091C', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#10B98120' },
  periodSummaryTxt: { fontSize: 12, color: '#10B981', fontFamily: 'Cairo_700Bold' },

  addPeriodBtn: { borderWidth: 1.5, borderColor: '#1C2848', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  addPeriodTxt: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#64748B' },
  totalCard: { backgroundColor: '#F59E0B10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#6366F130', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#D97706', fontFamily: 'Cairo_600SemiBold' },
  totalVal: { fontSize: 18, color: '#6366F1', fontFamily: 'Cairo_900Black' },

  salCard: { backgroundColor: '#10B98110', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#10B98130', alignItems: 'center', marginBottom: 16 },
  salLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  salVal: { fontSize: 28, fontFamily: 'Cairo_900Black', color: '#10B981' },
  capNote: { fontSize: 11, color: '#6366F1', marginTop: 6 },

  summaryCard: { backgroundColor: '#111830', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1C2848' },
  summaryTitle: { fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#6366F1', marginBottom: 12 },
  disclaimerBox: { backgroundColor: '#111830', borderRadius: 10, padding: 12, marginBottom: 10, borderRightWidth: 3, borderRightColor: '#6366F1', borderWidth: 1, borderColor: '#1C2848' },
  disclaimerTxt: { fontSize: 11, color: '#64748B', lineHeight: 18 },

  nextBtn: { backgroundColor: '#6366F1', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: '#6366F1', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  nextBtnTxt: { fontSize: 16, fontFamily: 'Cairo_900Black', color: '#07091C' },
});
