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

// Create Express app
const app = express();
app.use(express.json());

// PORT from environment variable for Vercel compatibility
const PORT = process.env.PORT || 3000;

// Store for messages
const store = makeInMemoryStore({ logger: pino().child({ level: 'fatal', stream: 'store' }) });

// Initialize socket
let sock;

async function connectToWhatsApp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['AdvancedWhatsAppBot', 'Chrome', '1.0.0'],
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
            return {
                conversation: 'Hello'
            };
        }
    });

    // Handle QR Code generation
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('تم إنشاء رمز الاستجابة، جاري المسح...');
            QRCode.generate(qr, { small: true });
            
            // For Vercel deployment, we'll also save QR to a file
            try {
                const qrcode = require('qrcode');
                const qrDataUrl = await qrcode.toDataURL(qr);
                fs.writeFileSync('./public/qrcode.html', `
                    <!DOCTYPE html>
                    <html dir="rtl">
                    <head>
                        <title>رمز استجابة GataBot-MD</title>
                        <style>
                            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                            .container { text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h1 { color: #25D366; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>امسح رمز الاستجابة</h1>
                            <img src="${qrDataUrl}" alt="QR Code" />
                            <p>امسح رمز الاستجابة هذا بواتساب لربط البوت</p>
                        </div>
                    </body>
                    </html>
                `);
            } catch (err) {
                console.error('Error generating QR HTML:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('تم إغلاق الاتصال بسبب ', lastDisconnect?.error?.output?.statusCode, 'جاري إعادة الاتصال ', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('تم الاتصال بواتساب ويب!');
            
            // Send welcome message to owner if specified
            if (process.env.OWNER_NUMBER) {
                await sock.sendMessage(`${process.env.OWNER_NUMBER}@s.whatsapp.net`, { 
                    text: '✅ تم توصيل GataBot-MD بنجاح!' 
                });
            }
        }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const message = messages[0];
        if (!message.key.fromMe && message.message) {
            const senderNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
            const senderName = message.pushName || 'Unknown';
            
            // Get message text
            let messageText = '';
            if (message.message.conversation) {
                messageText = message.message.conversation;
            } else if (message.message.extendedTextMessage?.text) {
                messageText = message.message.extendedTextMessage.text;
            }
            
            if (messageText) {
                console.log(`تم الاستلام من ${senderName} (${senderNumber}): ${messageText}`);
                
                // Process commands
                await handleCommand(message, messageText.toLowerCase(), senderNumber);
            }
        }
    });
}

// Command handler
async function handleCommand(message, command, senderNumber) {
    const senderJid = message.key.remoteJid;
    
    // Basic command responses
    if (command.startsWith('!ping')) {
        await sock.sendMessage(senderJid, { text: 'بونج! 🏓' });
    } 
    else if (command.startsWith('!info')) {
        const infoMessage = `
🤖 *معلومات GataBot-MD*
• الإصدار: 2.0.0
• المنصة: Vercel
• المحرك: Baileys/Multi-Device
• الأوامر: !ping, !info, !help, !yt [url], !gpt [prompt]
• الحالة: متصل ✅
        `;
        await sock.sendMessage(senderJid, { text: infoMessage.trim() });
    } 
    else if (command.startsWith('!help')) {
        const helpMessage = `
🤖 *أوامر GataBot-MD*

*الأوامر العامة:*
• !ping - فحص حالة البوت
• !info - عرض معلومات البوت
• !help - عرض رسالة المساعدة هذه

*أوامر الوسائط:*
• !yt [URL] - تحميل فيديو من يوتيوب
• !play [اسم الأغنية] - البحث وتشغيل الموسيقى

*أوامر الذكاء الاصطناعي:*
• !gpt [السؤال] - الدردشة مع مساعد الذكاء الاصطناعي

*أوامر المجموعات:*
• !groupinfo - الحصول على معلومات المجموعة
• !add [الرقم] - إضافة عضو إلى المجموعة
• !remove [الرقم] - إزالة عضو من المجموعة

المزيد من الميزات قادمة قريباً! 💫
        `;
        await sock.sendMessage(senderJid, { text: helpMessage.trim() });
    } 
    else if (command.startsWith('!yt ')) {
        const url = command.substring(4).trim();
        if (!url) {
            await sock.sendMessage(senderJid, { text: '❌ يرجى توفير رابط يوتيوب بعد الأمر.\nمثال: !yt https://youtube.com/watch?v=...' });
            return;
        }
        
        // Simple YouTube download placeholder
        await sock.sendMessage(senderJid, { text: `🎬 جاري تحميل فيديو يوتيوب: ${url}\n⏳ قد يستغرق هذا لحظة...` });
    }
    else if (command.startsWith('!gpt ')) {
        const prompt = command.substring(5).trim();
        if (!prompt) {
            await sock.sendMessage(senderJid, { text: '❌ يرجى توفير نص بعد الأمر.\nمثال: !gpt ما هو الطقس اليوم؟' });
            return;
        }
        
        // Placeholder for OpenAI integration
        await sock.sendMessage(senderJid, { text: `🤖 رد الذكاء الاصطناعي: سيتم معالجة هذا بواسطة OpenAI API مع سؤالك: "${prompt}"` });
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
        // Default response for unknown commands
        await sock.sendMessage(senderJid, { 
            text: `🤖 أنا بوت GataBot-MD!\nاكتب !help لرؤية الأوامر المتاحة.` 
        });
    }
}

// Start the bot
connectToWhatsApp();

// Health check endpoint for Vercel
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>GataBot-MD - بوت واتساب</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                .container { text-align: center; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                h1 { color: #25D366; }
                .status { color: green; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 GataBot-MD</h1>
                <p class="status">الحالة: يعمل ✅</p>
                <p>تم نشر هذا البوت على Vercel وجاهز للتعامل مع رسائل واتساب!</p>
                <p>لربط البوت، امسح رمز الاستجابة بهاتفك</p>
                <p><a href="/qrcode" style="color: #25D366;">عرض رمز الاستجابة</a></p>
            </div>
        </body>
        </html>
    `);
});

// QR code endpoint
app.get('/qrcode', (req, res) => {
    if (fs.existsSync('./public/qrcode.html')) {
        res.sendFile(path.resolve('./public/qrcode.html'));
    } else {
        res.send('<h1>رمز الاستجابة غير متاح. قد يكون البوت متصلاً بالفعل.</h1>');
    }
});

// API endpoint to send messages (for external integration)
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