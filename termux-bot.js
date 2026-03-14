const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// مسار مجلد المصادقة
const authFolder = path.join(__dirname, 'auth_info_baileys');

async function startBot() {
    console.log('🚀 جاري تشغيل البوت على Termux...');

    // التحقق من وجود مجلد المصادقة وإنشاؤه إذا لم يكن موجوداً
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // طباعة QR في التيرمينال مباشرة
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // طباعة QR Code في التيرمينال
            console.log('\n📱 امسح رمز الـ QR هذا بواسطة واتساب:\n');
            qrcode.generate(qr, { small: true });
            console.log('\nأو انتظر كود التسجيل إذا طُلب منك ذلك...\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ انقطع الاتصال. السبب:', lastDisconnect.error);
            
            if (shouldReconnect) {
                console.log('🔄 جاري إعادة التشغيل تلقائياً...');
                startBot();
            } else {
                console.log('⚠️ تم تسجيل الخروج. يرجى مسح مجلد auth_info_baileys وإعادة التشغيل.');
                process.exit(0);
            }
        } else if (connection === 'open') {
            console.log('✅ تم الاتصال بنجاح! البوت يعمل الآن.');
            console.log('📞 رقم البوت:', sock.user?.id.split(':')[0]);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe) {
            console.log(`📨 رسالة جديدة من: ${msg.key.remoteJid}`);
            // هنا يمكنك إضافة منطق الرد الخاص بك مستقبلاً
        }
    });
}

// تشغيل البوت
startBot().catch(err => {
    console.error('حدث خطأ أثناء التشغيل:', err);
    process.exit(1);
});
