const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require('@whiskeysockets/baileys');
const { state, saveCreds } = useMultiFileAuthState('./baileys_auth_info');
const QRCode = require('qrcode-terminal');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { games, TicTacToe, Hangman, activeGames } = require('./games');
const { enhancedGames } = require('./enhanced_features');

// إنشاء تطبيق Express
const app = express();
app.use(express.json());

// المنفذ من متغير البيئة للتوافق مع Vercel
const PORT = process.env.PORT || 3000;

// تخزين الرسائل
const store = makeInMemoryStore({ logger: pino().child({ level: 'fatal', stream: 'store' }) });

// تهيئة المقبس
let sock;

async function connectToWhatsApp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['GataBot-MD', 'Chrome', '1.0.0'],
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
            return {
                conversation: 'مرحباً'
            };
        }
    });

    // معالجة توليد رمز الاستجابة السريعة
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('تم توليد رمز الاستجابة السريعة، جاري المسح...');
            QRCode.generate(qr, { small: true });
            
            try {
                const qrcode = require('qrcode');
                const qrDataUrl = await qrcode.toDataURL(qr);
                fs.writeFileSync('./public/qrcode.html', `
                    <!DOCTYPE html>
                    <html dir="rtl" lang="ar">
                    <head>
                        <meta charset="UTF-8">
                        <title>رمز بوت الواتساب</title>
                        <style>
                            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                            .container { text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h1 { color: #25D366; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>امسح رمز الاستجابة السريعة</h1>
                            <img src="${qrDataUrl}" alt="رمز الاستجابة السريعة" />
                            <p>امسح رمز الاستجابة السريعة هذا باستخدام واتساب لربط البوت</p>
                        </div>
                    </body>
                    </html>
                `);
            } catch (err) {
                console.error('خطأ في توليد HTML لرمز الاستجابة السريعة:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('انقطع الاتصال بسبب ', lastDisconnect?.error?.output?.statusCode, 'إعادة الاتصال ', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('متصل بواتساب ويب!');
            
            if (process.env.OWNER_NUMBER) {
                await sock.sendMessage(`${process.env.OWNER_NUMBER}@s.whatsapp.net`, { 
                    text: '✅ بوت GataBot-MD متصل الآن!' 
                });
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const message = messages[0];
        if (!message.key.fromMe && message.message) {
            const senderNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
            const senderName = message.pushName || 'غير معروف';
            
            let messageText = '';
            if (message.message.conversation) {
                messageText = message.message.conversation;
            } else if (message.message.extendedTextMessage?.text) {
                messageText = message.message.extendedTextMessage.text;
            }
            
            if (messageText) {
                console.log(`تم الاستلام من ${senderName} (${senderNumber}): ${messageText}`);
                await handleCommand(message, messageText.toLowerCase(), senderNumber);
            }
        }
    });
}

// معالجة الأوامر
async function handleCommand(message, command, senderNumber) {
    const senderJid = message.key.remoteJid;
    
    if (command.startsWith('!ping')) {
        await sock.sendMessage(senderJid, { text: 'موجود! 🏓' });
    } 
    else if (command.startsWith('!info')) {
        const infoMessage = `
🤖 *معلومات بوت GataBot-MD*
• الإصدار: 2.0.0
• المنصة: Vercel
• المحرك: Baileys/متعدد الأجهزة
• اللغة: العربية 🇸🇦
• الأوامر: !ping, !info, !help, !yt [url], !gpt [prompt]
• الحالة: متصل ✅
        `;
        await sock.sendMessage(senderJid, { text: infoMessage.trim() });
    } 
    else if (command.startsWith('!help')) {
        const helpMessage = `
🤖 *أوامر بوت GataBot-MD*

*الأوامر العامة:*
• !ping - فحص حالة البوت
• !info - عرض معلومات البوت
• !help - عرض رسالة المساعدة هذه

*أوامر الميديا:*
• !yt [URL] - تحميل فيديو يوتيوب
• !play [اسم الأغنية] - البحث وتشغيل الموسيقى

*أوامر الذكاء الاصطناعي:*
• !gpt [prompt] - الدردشة مع مساعد الذكاء الاصطناعي

*أوامر المجموعات:*
• !groupinfo - الحصول على معلومات المجموعة
• !add [رقم] - إضافة عضو إلى المجموعة
• !remove [رقم] - إزالة عضو من المجموعة

*الألعاب الترفيهية:*
• !rps [حجر/ورقة/مقص] - لعب حجر ورقة مقص
• !guess [رقم] - لعب لعبة تخمين الرقم
• !tictactoe [موقع 0-8] - لعب لعبة إكس أو
• !tictactoe new - بدء لعبة إكس أو جديدة
• !trivia - لعب لعبة المسابقات
• !answer [خيار] - الإجابة على المسابقة
• !wordscramble - لعب لعبة خلط الكلمات
• !unscramble [كلمة] - الإجابة على لعبة خلط الكلمات
• !memory - لعب لعبة الذاكرة
• !memory [تسلسل] - الإجابة على لعبة الذاكرة
• !hangman - بدء لعبة الرجل المشنوق
• !hangman [حرف] - تخمين حرف في الرجل المشنوق
• !wordguess - بدء لعبة تخمين الكلمة
• !wordguess [حرف] - تخمين حرف في تخمين الكلمة
• !quiz - لعب لعبة المسابقات
• !math - لعب تحدي الرياضيات
• !match [card_id] - قلب بطاقة في مطابقة الذاكرة (1-16)
• !dice [مبلغ الرهان] - لعب لعبة النرد مع الرهان
• !chain - بدء لعبة سلسلة الكلمات
• !chain [كلمة] - إضافة كلمة إلى السلسلة

المزيد من الميزات قادمة قريباً! 💫
        `;
        await sock.sendMessage(senderJid, { text: helpMessage.trim() });
    } 
    else if (command.startsWith('!yt ')) {
        const url = command.substring(4).trim();
        if (!url) {
            await sock.sendMessage(senderJid, { text: '❌ يرجى تقديم رابط يوتيوب بعد الأمر.\nمثال: !yt https://youtube.com/watch?v=...' });
            return;
        }
        await sock.sendMessage(senderJid, { text: `🎬 محاولة تحميل فيديو يوتيوب: ${url}\n⏳ قد يستغرق هذا لحظة...` });
    }
    else if (command.startsWith('!gpt ')) {
        const prompt = command.substring(5).trim();
        if (!prompt) {
            await sock.sendMessage(senderJid, { text: '❌ يرجى تقديم مطالبة بعد الأمر.\nمثال: !gpt ما هو الطقس اليوم؟' });
            return;
        }
        await sock.sendMessage(senderJid, { text: `🤖 رد الذكاء الاصطناعي: سيتم معالجة هذا بواسطة API الخاص بـ OpenAI مع مطالبتك: "${prompt}"` });
    }
    else if (command.startsWith('!groupinfo') && senderJid.includes('@g.us')) {
        const groupMetadata = await sock.groupMetadata(senderJid);
        const groupInfo = `
👥 *معلومات المجموعة*
• الاسم: ${groupMetadata.subject}
• المعرف: ${groupMetadata.id}
• المالك: ${groupMetadata.owner ? groupMetadata.owner.split('@')[0] : 'غير معروف'}
• الأعضاء: ${groupMetadata.participants.length} مشارك
• الوصف: ${groupMetadata.desc || 'لا يوجد وصف'}
        `;
        await sock.sendMessage(senderJid, { text: groupInfo.trim() });
    }
    else {
        await sock.sendMessage(senderJid, { 
            text: `🤖 أنا بوت GataBot-MD!\nاكتب !help لرؤية الأوامر المتاحة.` 
        });
    }
}

// بدء البوت
connectToWhatsApp();

// نقطة نهاية فحص الصحة لـ Vercel
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>GataBot-MD - بوت الواتساب</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                .container { text-align: center; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                h1 { color: #25D366; }
                .status { color: green; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 GataBot-MD - بوت الواتساب المتقدم</h1>
                <p class="status">الحالة: يعمل ✅</p>
                <p>تم نشر هذا البوت على Vercel وجاهز لمعالجة رسائل الواتساب!</p>
                <p>لربط البوت، امسح رمز الاستجابة السريعة على هاتفك</p>
            </div>
        </body>
        </html>
    `);
});

// نقطة نهاية رمز الاستجابة السريعة
app.get('/qrcode', (req, res) => {
    if (fs.existsSync('./public/qrcode.html')) {
        res.sendFile(path.resolve('./public/qrcode.html'));
    } else {
        res.send('<h1>رمز الاستجابة السريعة غير متاح. قد يكون البوت متصلاً بالفعل.</h1>');
    }
});

// نقطة نهاية API لإرسال الرسائل
app.post('/send-message', express.json(), async (req, res) => {
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({ error: 'الرقم والرسالة مطلوبان' });
    }
    
    try {
        await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
