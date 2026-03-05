const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require('@whiskeysockets/baileys');
const { state, saveCreds } = useMultiFileAuthState('./baileys_auth_info');
const QRCode = require('qrcode-terminal');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
            console.log('QR Code generated, scanning...');
            QRCode.generate(qr, { small: true });
            
            // For Vercel deployment, we'll also save QR to a file
            try {
                const qrcode = require('qrcode');
                const qrDataUrl = await qrcode.toDataURL(qr);
                fs.writeFileSync('./public/qrcode.html', `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>WhatsApp Bot QR Code</title>
                        <style>
                            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                            .container { text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h1 { color: #25D366; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Scan QR Code</h1>
                            <img src="${qrDataUrl}" alt="QR Code" />
                            <p>Scan this QR code with your WhatsApp to connect the bot</p>
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
            console.log('Connection closed due to ', lastDisconnect?.error?.output?.statusCode, 'reconnecting ', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp Web!');
            
            // Send welcome message to owner if specified
            if (process.env.OWNER_NUMBER) {
                await sock.sendMessage(`${process.env.OWNER_NUMBER}@s.whatsapp.net`, { 
                    text: '✅ Advanced WhatsApp Bot is now connected!' 
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
                console.log(`Received from ${senderName} (${senderNumber}): ${messageText}`);
                
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
        await sock.sendMessage(senderJid, { text: 'pong! 🏓' });
    } 
    else if (command.startsWith('!info')) {
        const infoMessage = `
🤖 *Advanced WhatsApp Bot Info*
• Version: 1.0.0
• Platform: Vercel
• Engine: Baileys/Multi-Device
• Commands: !ping, !info, !help, !yt [url], !gpt [prompt]
• Status: Online ✅
        `;
        await sock.sendMessage(senderJid, { text: infoMessage.trim() });
    } 
    else if (command.startsWith('!help')) {
        const helpMessage = `
🤖 *Advanced WhatsApp Bot Commands*

*General Commands:*
• !ping - Check bot status
• !info - Show bot information
• !help - Show this help message

*Media Commands:*
• !yt [URL] - Download YouTube video
• !play [song name] - Search and play music

*AI Commands:*
• !gpt [prompt] - Chat with AI assistant

*Group Commands:*
• !groupinfo - Get group information
• !add [number] - Add member to group
• !remove [number] - Remove member from group

More features coming soon! 💫
        `;
        await sock.sendMessage(senderJid, { text: helpMessage.trim() });
    } 
    else if (command.startsWith('!yt ')) {
        const url = command.substring(4).trim();
        if (!url) {
            await sock.sendMessage(senderJid, { text: '❌ Please provide a YouTube URL after the command.\nExample: !yt https://youtube.com/watch?v=...' });
            return;
        }
        
        // Simple YouTube download placeholder
        await sock.sendMessage(senderJid, { text: `🎬 Attempting to download YouTube video: ${url}\n⏳ This might take a moment...` });
    }
    else if (command.startsWith('!gpt ')) {
        const prompt = command.substring(5).trim();
        if (!prompt) {
            await sock.sendMessage(senderJid, { text: '❌ Please provide a prompt after the command.\nExample: !gpt What is the weather today?' });
            return;
        }
        
        // Placeholder for OpenAI integration
        await sock.sendMessage(senderJid, { text: `🤖 AI Response: This would be processed by OpenAI API with your prompt: "${prompt}"` });
    }
    else if (command.startsWith('!groupinfo') && senderJid.includes('@g.us')) {
        const groupMetadata = await sock.groupMetadata(senderJid);
        const groupInfo = `
👥 *Group Information*
• Name: ${groupMetadata.subject}
• ID: ${groupMetadata.id}
• Owner: ${groupMetadata.owner ? groupMetadata.owner.split('@')[0] : 'Unknown'}
• Members: ${groupMetadata.participants.length} participants
• Description: ${groupMetadata.desc || 'No description'}
        `;
        await sock.sendMessage(senderJid, { text: groupInfo.trim() });
    }
    else {
        // Default response for unknown commands
        await sock.sendMessage(senderJid, { 
            text: `🤖 I'm the Advanced WhatsApp Bot!\nType !help to see available commands.` 
        });
    }
}

// Start the bot
connectToWhatsApp();

// Health check endpoint for Vercel
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Advanced WhatsApp Bot</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                .container { text-align: center; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                h1 { color: #25D366; }
                .status { color: green; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Advanced WhatsApp Bot</h1>
                <p class="status">Status: Running</p>
                <p>This bot is deployed on Vercel and ready to handle WhatsApp messages!</p>
                <p>For bot connection, scan the QR code on your phone</p>
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
        res.send('<h1>QR Code not available. Bot might already be connected.</h1>');
    }
});

// API endpoint to send messages (for external integration)
app.post('/send-message', express.json(), async (req, res) => {
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({ error: 'Number and message are required' });
    }
    
    try {
        await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});