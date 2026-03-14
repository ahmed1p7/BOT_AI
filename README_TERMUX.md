# تشغيل GataBot-MD على Termux

دليل شامل لتشغيل البوت على هاتفك الأندرويد باستخدام Termux.

## المتطلبات
- هاتف أندرويد
- تطبيق Termux من F-Droid (يفضل) أو GitHub Releases
  - ⚠️ لا تستخدم النسخة من Google Play لأنها قديمة وغير مدعومة

## خطوات التثبيت والتشغيل

### 1. تحديث وتثبيت الحزم الأساسية
افتح Termux ونفذ الأوامر التالية:

```bash
pkg update && pkg upgrade -y
pkg install nodejs -y
pkg install git -y
pkg install python -y
```

### 2. استنساخ المشروع
```bash
git clone https://github.com/YOUR_USERNAME/gatabot-md.git
cd gatabot-md
```

### 3. تثبيت المكتبات
```bash
npm install
```

### 4. تشغيل البوت
```bash
node index.js
```

أو استخدم الأمر المختصر:
```bash
npm run termux
```

## حل المشاكل الشائعة

### مشكلة: خطأ في تثبيت Baileys
```bash
pkg install ffmpeg -y
pkg install libwebp -y
```

### مشكلة: صلاحيات التخزين
إذا كنت تحتاج لحفظ الملفات:
```bash
termux-setup-storage
```

### مشكلة: البوت يتوقف عند إغلاق Termux
لتشغيل البوت في الخلفية:
```bash
pkg install proot-distro -y
# أو استخدم nohup
nohup node index.js &
```

### مشكلة: مسح رمز QR
إذا ظهر خطأ في الجلسة، احذف مجلد المصادقة:
```bash
rm -rf /tmp/auth
# ثم أعد تشغيل البوت
node index.js
```

## نصائح مهمة

1. **الاتصال بالإنترنت**: تأكد من اتصال مستقر بالإنترنت
2. **البطارية**: عطل توفير الطاقة لـ Termux لمنع إيقاف البوت
3. **التحديثات**: نفذ `pkg update` دورياً لتحديث الحزم
4. **المساحة**: تأكد من وجود مساحة كافية على الجهاز

## إيقاف البوت
اضغط `Ctrl + C` لإيقاف البوت بأمان.

## دعم
للحصول على المساعدة، افتح issue في المستودع.
