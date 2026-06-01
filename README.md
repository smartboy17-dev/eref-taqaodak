# اعرف تقاعدك 🏛️

تطبيق React Native (Expo) لحاسبة المعاش التقاعدي السعودي بناءً على نظام التأمينات الاجتماعية م/33 وتعديلات 2024م.

## المميزات

- **حساب دقيق** — نظام م/33، م.38 (÷600/÷480)، قرار مجلس الوزراء 3/7/2024م
- **تقرير مرئي** — رسوم بيانية SVG (أعمدة، قوس، donut)
- **سيناريوهات التحسين** — أثر إضافة الأشهر ورفع الراتب مع نقطة التعادل
- **دفع مدمج** — Moyasar (mada / Visa / Apple Pay / STC Pay)
- **تصدير PDF** — تقرير قابل للمشاركة عبر expo-print
- **حفظ تلقائي** — AsyncStorage يحفظ البيانات بين الجلسات
- **دعم RTL** — واجهة عربية كاملة بخط Tajawal

## هيكل المشروع

```
eref-taqaodak/
├── App.js                          ← Navigation + RTL + fonts
├── app.json                        ← Expo config + bundle IDs
├── eas.json                        ← EAS build config
├── src/
│   ├── utils/
│   │   └── pension.js              ← محرك الحسابات الكامل
│   ├── components/
│   │   └── PensionChart.jsx        ← BarChart / ArcProgress / DonutChart
│   └── screens/
│       ├── WelcomeScreen.jsx       ← الشاشة الترحيبية
│       ├── InputScreen.jsx         ← معالج 3 خطوات
│       ├── PreviewScreen.jsx       ← النتيجة الأولية (مجاناً)
│       ├── PaymentScreen.jsx       ← Moyasar WebView
│       └── ReportScreen.jsx        ← التقرير الكامل + PDF
```

## تشغيل المشروع

```bash
# 1. تثبيت التبعيات
cd eref-taqaodak
npm install

# 2. تشغيل على الجوال (Expo Go)
npx expo start

# 3. افتح تطبيق Expo Go وامسح QR Code
```

## تفعيل Moyasar (الدفع الحقيقي)

1. أنشئ حساباً على [moyasar.com](https://moyasar.com)
2. في لوحة التحكم: **Developers → API Keys**
3. انسخ **Publishable Key**
4. افتح `src/screens/PaymentScreen.jsx` واستبدل:
   ```js
   const MOYASAR_PK = 'pk_test_REPLACE_WITH_YOUR_KEY';
   ```
5. أيضاً في `app.json` استبدل:
   ```json
   "moyasarPublishableKey": "pk_test_REPLACE_WITH_YOUR_KEY"
   ```
6. اضبط `callback_url` في Moyasar Dashboard ليطابق:
   ```
   https://eref-taqaodak.app/payment/success
   ```

## البناء للنشر (App Store / Google Play)

```bash
# 1. تسجيل دخول Expo
npx eas login

# 2. بناء APK للاختبار الداخلي
npx eas build --platform android --profile preview

# 3. بناء للنشر في Google Play
npx eas build --platform android --profile production

# 4. بناء لـ App Store (يحتاج Mac أو EAS)
npx eas build --platform ios --profile production

# 5. رفع إلى المتاجر
npx eas submit --platform android
npx eas submit --platform ios
```

## تخصيص الأسعار

في `src/screens/PaymentScreen.jsx`:
```js
const REPORT_PRICE_HALALAS = 999; // 9.99 ريال (1 ريال = 100 هللة)
```

## المتطلبات

- Node.js ≥ 18
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`
- حساب Expo: [expo.dev](https://expo.dev)
- حساب Moyasar: [moyasar.com](https://moyasar.com)

## مراجع الحسابات

- **نظام التأمينات الاجتماعية م/33** (1421هـ) — م.38 صيغة الاحتساب
- **قرار مجلس الوزراء 3/7/2024م** — تعديلات سن التقاعد المبكر
- **م/53 تبادل المنافع** (1424هـ) — الجدول الاكتواري
- الحد الأدنى للمعاش: **1,983.75 ر.س**
- الحد الأعلى للأجر المؤمن: **45,000 ر.س**
- نقطة التحول في الاحتساب: **25 أبريل 2001م** (القديم ÷600 / الجديد ÷480)
- تاريخ تغيير طريقة احتساب الأيام: **1 فبراير 2022م**

## إخلاء المسؤولية

الأرقام تقديرية للتوعية المالية فقط. الرقم الرسمي لدى مؤسسة التأمينات الاجتماعية.

---

**المطوّر**: صائد | **الرخصة**: MIT
