// GataBot-MD - بوت واتساب متقدم للغة العربية
// متوافق مع Vercel Serverless Functions

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { toDataURL } = require('qrcode');

// تخزين مؤقت للجلسات (في الإنتاج الحقيقي، استخدم قاعدة بيانات)
const sessions = new Map();

module.exports = async (req, res) => {
    // تفعيل CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // صفحة الهبوط الرئيسية
        if (req.method === 'GET' && req.url === '/') {
            return res.status(200).send(`
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>GataBot-MD - بوت واتساب</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                        }
                        .container {
                            background: white;
                            border-radius: 20px;
                            padding: 40px;
                            max-width: 500px;
                            width: 100%;
                            text-align: center;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        }
                        h1 { color: #25D366; margin-bottom: 20px; font-size: 2.5em; }
                        p { color: #666; margin-bottom: 30px; line-height: 1.6; }
                        .btn {
                            display: inline-block;
                            background: #25D366;
                            color: white;
                            padding: 15px 40px;
                            border-radius: 50px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 10px;
                            transition: all 0.3s;
                        }
                        .btn:hover { background: #128C7E; transform: translateY(-2px); }
                        .status { 
                            background: #f0f0f0; 
                            padding: 15px; 
                            border-radius: 10px; 
                            margin-top: 20px;
                        }
                        .emoji { font-size: 3em; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="emoji">🤖</div>
                        <h1>GataBot-MD</h1>
                        <p>بوت واتساب متقدم باللغة العربية<br>جاهز للاستخدام!</p>
                        <a href="/api/qr" class="btn">📱 مسح رمز الاستجابة</a>
                        <a href="/api/help" class="btn">❓ المساعدة</a>
                        <div class="status">
                            <strong>✅ الحالة:</strong> الخادم يعمل بنجاح
                        </div>
                    </div>
                </body>
                </html>
            `);
        }

        // عرض رمز الاستجابة السريعة (QR Code)
        if (req.method === 'GET' && req.url === '/api/qr') {
            const sessionId = 'default';
            
            if (!sessions.has(sessionId)) {
                const { state, saveCreds } = await useMultiFileAuthState(`./auth_${sessionId}`);
                const { version } = await fetchLatestBaileysVersion();
                
                const sock = makeWASocket({
                    version,
                    logger: console,
                    printQRInTerminal: false,
                    auth: state,
                    browser: ['GataBot-MD', 'Chrome', '2.0.0']
                });

                sessions.set(sessionId, { sock, state, saveCreds });
            }

            const session = sessions.get(sessionId);
            
            return new Promise((resolve) => {
                let qrResolved = false;

                session.sock.ev.on('connection.update', async (update) => {
                    const { connection, lastDisconnect, qr } = update;

                    if (qr && !qrResolved) {
                        qrResolved = true;
                        try {
                            const qrDataUrl = await toDataURL(qr);
                            resolve(res.status(200).send(`
                                <!DOCTYPE html>
                                <html dir="rtl" lang="ar">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>رمز الاستجابة - GataBot-MD</title>
                                    <style>
                                        body { 
                                            font-family: Arial, sans-serif; 
                                            background: #f0f0f0;
                                            display: flex;
                                            justify-content: center;
                                            align-items: center;
                                            min-height: 100vh;
                                            padding: 20px;
                                        }
                                        .container {
                                            background: white;
                                            padding: 40px;
                                            border-radius: 20px;
                                            text-align: center;
                                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                                        }
                                        h1 { color: #25D366; margin-bottom: 20px; }
                                        img { max-width: 300px; margin: 20px 0; }
                                        p { color: #666; margin: 10px 0; }
                                        .back { 
                                            display: inline-block; 
                                            margin-top: 20px; 
                                            color: #25D366; 
                                            text-decoration: none; 
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>📱 امسح رمز الاستجابة</h1>
                                        <img src="${qrDataUrl}" alt="QR Code" />
                                        <p>افتح واتساب على هاتفك</p>
                                        <p>الإعدادات → الأجهزة المرتبطة → ربط جهاز</p>
                                        <p>امسح الرمز أعلاه</p>
                                        <a href="/" class="back">← العودة للرئيسية</a>
                                    </div>
                                </body>
                                </html>
                            `));
                        } catch (error) {
                            resolve(res.status(500).json({ error: 'فشل إنشاء رمز الاستجابة' }));
                        }
                    }

                    if (connection === 'open') {
                        if (!qrResolved) {
                            qrResolved = true;
                            resolve(res.status(200).send(`
                                <!DOCTYPE html>
                                <html dir="rtl" lang="ar">
                                <head>
                                    <meta charset="UTF-8">
                                    <title>متصل - GataBot-MD</title>
                                    <style>
                                        body { 
                                            font-family: Arial, sans-serif; 
                                            background: #d4edda;
                                            display: flex;
                                            justify-content: center;
                                            align-items: center;
                                            min-height: 100vh;
                                        }
                                        .container {
                                            background: white;
                                            padding: 40px;
                                            border-radius: 20px;
                                            text-align: center;
                                        }
                                        h1 { color: #28a745; }
                                        .emoji { font-size: 4em; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="emoji">✅</div>
                                        <h1>البوت متصل بنجاح!</h1>
                                        <p>تم ربط GataBot-MD بحساب واتساب الخاص بك</p>
                                        <a href="/" style="color: #25D366; margin-top: 20px; display: inline-block;">العودة للرئيسية</a>
                                    </div>
                                </body>
                                </html>
                            `));
                        }
                    }
                });

                // مهلة زمنية في حالة عدم ظهور QR
                setTimeout(() => {
                    if (!qrResolved) {
                        qrResolved = true;
                        resolve(res.status(200).send(`
                            <html dir="rtl">
                            <body style="font-family: Arial; text-align: center; padding: 40px; background: #fff3cd;">
                                <h2 style="color: #856404;">⏳ جاري الاتصال...</h2>
                                <p>يرجى الانتظار قليلاً ثم تحديث الصفحة</p>
                                <a href="/api/qr" style="color: #856404;">تحديث</a>
                            </body>
                            </html>
                        `));
                    }
                }, 10000);
            });
        }

        // صفحة المساعدة
        if (req.method === 'GET' && req.url === '/api/help') {
            return res.status(200).send(`
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>المساعدة - GataBot-MD</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f8f9fa; padding: 40px; }
                        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; }
                        h1 { color: #25D366; }
                        .command { background: #f0f0f0; padding: 10px 15px; margin: 10px 0; border-radius: 8px; }
                        code { background: #e9ecef; padding: 2px 8px; border-radius: 4px; color: #d63384; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❓ أوامر البوت</h1>
                        <div class="command"><code>!help</code> - عرض هذه القائمة</div>
                        <div class="command"><code>!ping</code> - فحص سرعة البوت</div>
                        <div class="command"><code>!info</code> - معلومات عن البوت</div>
                        <div class="command"><code>!tictactoe</code> - لعبة X O</div>
                        <div class="command"><code>!hangman</code> - لعبة تخمين الكلمة</div>
                        <br>
                        <a href="/" style="color: #25D366;">← العودة للرئيسية</a>
                    </div>
                </body>
                </html>
            `);
        }

        // معالجة رسائل الويب هوك (اختياري)
        if (req.method === 'POST') {
            return res.status(200).json({ 
                success: true, 
                message: 'GataBot-MD جاهز!',
                endpoints: {
                    qr: '/api/qr',
                    help: '/api/help'
                }
            });
        }

        // أي مسار آخر
        return res.status(404).json({ error: 'الصفحة غير موجودة' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'خطأ داخلي في الخادم',
            message: error.message 
        });
    }
};
