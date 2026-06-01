import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

/*
  ── تكامل Moyasar ───────────────────────────────────────────────────
  للتفعيل الحقيقي:
  1. أنشئ حساباً في moyasar.com
  2. ضع مفتاح النشر (publishable key) في MOYASAR_PK أدناه
  3. أنشئ Payment عبر Moyasar API وافتح صفحة الدفع في WebView
  4. استمع للـ callback_url وتحقق من نجاح الدفع

  الوثائق: https://docs.moyasar.com/
*/

// ────────────────────────────────────────────────────────────────────
const MOYASAR_PK = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx'; // ← ضع مفتاحك هنا
const REPORT_PRICE_HALALAS = 999; // 9.99 ريال = 999 هللة
const SUCCESS_REDIRECT = 'https://eref-taqaodak.app/payment/success';
const FAIL_REDIRECT = 'https://eref-taqaodak.app/payment/fail';
// ────────────────────────────────────────────────────────────────────

const PAYMENT_HTML = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>اعرف تقاعدك - الدفع</title>
  <script src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"></script>
  <link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css" />
  <style>
    body { background: #0F172A; color: #F1F5F9; font-family: system-ui, sans-serif; padding: 20px; }
    h2 { color: #F59E0B; font-size: 22px; text-align: center; margin-bottom: 8px; }
    .desc { color: #94A3B8; font-size: 13px; text-align: center; margin-bottom: 24px; }
    .mysr-form { direction: rtl; }
  </style>
</head>
<body>
  <h2>🏛️ اعرف تقاعدك</h2>
  <p class="desc">تقرير التقاعد الكامل — 9.99 ريال سعودي</p>
  <div id="moyasar-form"></div>
  <script>
    Moyasar.init({
      element: '#moyasar-form',
      amount: ${REPORT_PRICE_HALALAS},
      currency: 'SAR',
      description: 'تقرير تقاعدي — اعرف تقاعدك',
      publishable_api_key: '${MOYASAR_PK}',
      callback_url: '${SUCCESS_REDIRECT}',
      methods: ['creditcard', 'applepay', 'stcpay'],
    });
  </script>
</body>
</html>
`;

export default function PaymentScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const webRef = useRef(null);

  const handleNavChange = (event) => {
    const { url } = event;
    if (url.startsWith(SUCCESS_REDIRECT)) {
      navigation.replace('Report', route.params);
    } else if (url.startsWith(FAIL_REDIRECT)) {
      Alert.alert('فشل الدفع', 'لم تتم عملية الدفع. حاول مجدداً.', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>→</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>إتمام الدفع</Text>
        <View style={s.secureBadge}>
          <Text style={s.secureTxt}>🔐 آمن</Text>
        </View>
      </View>

      <View style={s.priceInfo}>
        <Text style={s.priceInfoTxt}>تقرير التقاعد الكامل</Text>
        <Text style={s.priceInfoAmt}>9.99 ر.س</Text>
      </View>

      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={s.loadingTxt}>جاري تحميل بوابة الدفع...</Text>
        </View>
      )}

      <WebView
        ref={webRef}
        source={{ html: PAYMENT_HTML }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavChange}
        style={s.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#94A3B8', fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  secureBadge: { backgroundColor: '#10B98120', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#10B98140' },
  secureTxt: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  priceInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#334155' },
  priceInfoTxt: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  priceInfoAmt: { fontSize: 17, color: '#F59E0B', fontWeight: '900' },
  webview: { flex: 1, backgroundColor: '#0F172A' },
  loadingOverlay: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  loadingTxt: { color: '#94A3B8', marginTop: 12, fontSize: 13 },
});
