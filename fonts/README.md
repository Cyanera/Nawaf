# خط الواجهة (ثمانية)

لم يكن ملف خط ثمانية متاحًا وقت البناء، لذلك يستخدم الموقع حاليًا **بديلًا عربيًا مؤقتًا** من خطوط النظام (Noto Sans Arabic / Segoe UI / Tahoma). هذا البديل ليس خط ثمانية.

لاستخدام خط ثمانية الذي لديك ترخيص استخدامه:

1. حوّل ملفات الخط إلى صيغة `woff2` إن لزم.
2. ضع الملفين في هذا المجلد بهذين الاسمين بالضبط:
   - `thmanyah-regular.woff2` (الوزن العادي 400)
   - `thmanyah-bold.woff2` (الوزن العريض 700)
3. أعد تحميل الصفحة. ثم انسخ سطرَي `@font-face` أدناه إلى أعلى `css/style.css`.

إن كانت أسماء ملفاتك مختلفة فعدّل سطرَي `@font-face` في أعلى `css/style.css`.

## سطرا الخط (انسخهما إلى أعلى `css/style.css`)

```css
@font-face { font-family: 'UserArabicFont'; src: url('../fonts/thmanyah-regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'UserArabicFont'; src: url('../fonts/thmanyah-bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }
```

(لم نفعّلهما افتراضيًا حتى لا يطلب المتصفح ملفات غير موجودة.)
