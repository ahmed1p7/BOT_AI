# 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot

<div align="center">

```
███████╗ █████╗ ███████╗██╗  ██╗██╗ ██████╗███████╗
██╔════╝██╔══██╗██╔════╝██║ ██╔╝██║██╔════╝██╔════╝
███████╗███████║███████╗█████╔╝ ██║██║     █████╗  
██╔════╝██╔══██║╚════██║██╔═██╗ ██║██║     ██╔══╝  
███████╗██║  ██║███████║██║  ██╗██║╚██████╗███████╗
╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝
```

### بوت واتساب ذكي ومتطور - بالعربية

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📋 المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [المميزات](#-المميزات)
- [التثبيت](#-التثبيت)
- [الإعداد](#-الإعداد)
- [الأوامر](#-الأوامر)
- [هيكل المشروع](#-هيكل-المشروع)
- [المساهمة](#-المساهمة)

---

## 🌟 نظرة عامة

**Fᴀᴛɪᴍᴀ** هو بوت واتساب متكامل ومتطور مبني بـ TypeScript مع تصميم منظم وقابل للتوسع. يدعم:

- ✅ أوامر متنوعة (عامة، إدارية، ترفيهية)
- ✅ تكامل الذكاء الاصطناعي
- ✅ إدارة المجموعات الكاملة
- ✅ نظام إضافات مرن
- ✅ قاعدة بيانات MongoDB

---

## 🚀 المميزات

### 📌 الأوامر العامة
| الأمر | الوصف |
|-------|-------|
| `.قائمة` | عرض جميع الأوامر المتاحة |
| `.مساعدة` | عرض مساعدة لأمر معين |
| `.info` | معلومات عن البوت |
| `.ping` | فحص سرعة الاستجابة |
| `.تاريخ` | عرض التاريخ والوقت |

### 👑 أوامر الإدارة
| الأمر | الوصف |
|-------|-------|
| `.ترقية` | ترقية عضو إلى مشرف |
| `.تنزيل` | تنزيل مشرف |
| `.طرد` | طرد عضو من المجموعة |
| `.اضافة` | إضافة عضو للمجموعة |
| `.رابط` | الحصول على رابط المجموعة |
| `.قفل` / `.فتح` | إغلاق/فتح المجموعة |

### 🤖 الذكاء الاصطناعي
| الأمر | الوصف |
|-------|-------|
| `.ai` | التحدث مع الذكاء الاصطناعي |
| `.ترجمة` | ترجمة نص إلى لغة أخرى |
| `.تلخيص` | تلخيص نص طويل |
| `.تصحيح` | تصحيح الأخطاء الإملائية |

### 🎮 الترفيه
| الأمر | الوصف |
|-------|-------|
| `.عملة` | رمي عملة |
| `.نرد` | رمي النرد |
| `.حب` | حساب نسبة الحب |
| `.نكتة` | نكتة عشوائية |
| `.حجر` | لعبة حجر ورقة مقص |

### 🛠️ الأدوات
| الأمر | الوصف |
|-------|-------|
| `.بحث` | البحث في الإنترنت |
| `.صورة` | إنشاء صورة بالذكاء الاصطناعي |
| `.طقس` | حالة الطقس |
| `.حاسبة` | آلة حاسبة |

---

## 📥 التثبيت

### المتطلبات
- Node.js v18 أو أحدث
- MongoDB
- npm أو yarn

### الخطوات

```bash
# استنساخ المشروع
git clone https://github.com/your-username/fatima-bot.git
cd fatima-bot

# تثبيت المتطلبات
npm install

# نسخ ملف الإعدادات
cp .env.example .env

# تعديل الإعدادات
nano .env

# تشغيل البوت
npm run dev
```

---

## ⚙️ الإعداد

قم بتعديل ملف `.env`:

```env
# معلومات البوت
BOT_NAME=Fᴀᴛɪᴍᴀ
BOT_PREFIX=.
OWNER_NUMBER=1234567890

# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/fatima-bot

# الذكاء الاصطناعي
AI_ENABLED=true
AI_MODEL=gpt-4
```

---

## 📁 هيكل المشروع

```
fatima-bot/
├── src/
│   ├── commands/          # أوامر البوت
│   │   ├── general.ts     # أوامر عامة
│   │   ├── group.ts       # أوامر المجموعات
│   │   ├── owner.ts       # أوامر المالك
│   │   ├── ai.ts          # أوامر الذكاء الاصطناعي
│   │   ├── fun.ts         # أوامر ترفيهية
│   │   └── tools.ts       # أوامر الأدوات
│   ├── core/              # النواة
│   │   └── commandRegistry.ts
│   ├── database/          # قاعدة البيانات
│   │   └── index.ts
│   ├── handlers/          # معالجات الأحداث
│   │   └── messageHandler.ts
│   ├── types/             # تعريفات TypeScript
│   │   └── index.ts
│   ├── utils/             # أدوات مساعدة
│   │   ├── helpers.ts
│   │   └── logger.ts
│   ├── config/            # الإعدادات
│   │   └── index.ts
│   └── index.ts           # نقطة الدخول
├── data/
│   ├── sessions/          # جلسات الواتساب
│   ├── media/             # الوسائط
│   └── temp/              # ملفات مؤقتة
├── logs/                  # السجلات
├── .env.example           # مثال للإعدادات
├── package.json
└── tsconfig.json
```

---

## 🔌 إضافة أوامر جديدة

```typescript
// src/commands/custom.ts
import { Command, CommandCategory } from '../types';

const myCommand: Command = {
  name: 'أمري',
  aliases: ['mycommand'],
  description: 'وصف الأمر',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    await socket.sendMessage(ctx.jid, { 
      text: 'مرحباً!' 
    });
  }
};

export const customCommands = [myCommand];
```

ثم أضفها في `src/commands/index.ts`.

---

## 📊 قاعدة البيانات

### المستخدمون
- `jid` - معرف المستخدم
- `name` - الاسم
- `isBanned` - محظور
- `warnings` - التحذيرات
- `isPremium` - مميز

### المجموعات
- `jid` - معرف المجموعة
- `welcomeEnabled` - الترحيب مفعل
- `antiLink` - حماية الروابط
- `settings` - إعدادات إضافية

---

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing`)
3. Commit التغييرات (`git commit -m 'إضافة ميزة رائعة'`)
4. Push للفرع (`git push origin feature/amazing`)
5. فتح Pull Request

---

## 📜 الترخيص

MIT License - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 📞 الدعم

- 📧 Discord: [انضم للسيرفر](#)
- 📱 WhatsApp: [تواصل معنا](#)

---

<div align="center">

**صنع بـ ❤️ بواسطة فريق Fᴀᴛɪᴍᴀ**

</div>
