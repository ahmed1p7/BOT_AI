/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - الملف الرئيسي
 * ═══════════════════════════════════════════════════════════════
 */

import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  WAMessage,
  GroupMetadata,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

import { config, paths } from './config';
import { log } from './utils/logger';
import { registerCommands } from './core/commandRegistry';
import { connectDatabase } from './database';
import { handleMessage, handleGroupUpdate } from './handlers/messageHandler';
import { allCommands } from './commands';

// ═══════════════════════════════════════════════════════════════
// المتغيرات العامة
// ═══════════════════════════════════════════════════════════════

let socket: WASocket;
let groupCache: Map<string, GroupMetadata> = new Map();

// ═══════════════════════════════════════════════════════════════
// إنشاء مجلدات ضرورية
// ═══════════════════════════════════════════════════════════════

function ensureDirectories(): void {
  const dirs = [paths.session, paths.media, paths.logs];
  dirs.forEach(dir => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// تسجيل الأوامر
// ═══════════════════════════════════════════════════════════════

function registerAllCommands(): void {
  registerCommands(allCommands);
  log.success('الأوامر', `تم تسجيل ${allCommands.length} أمر`);
}

// ═══════════════════════════════════════════════════════════════
// بدء الاتصال
// ═══════════════════════════════════════════════════════════════

async function startBot(): Promise<void> {
  // إنشاء المجلدات
  ensureDirectories();

  // تسجيل الأوامر
  registerAllCommands();

  // الاتصال بقاعدة البيانات
  try {
    await connectDatabase();
  } catch (error) {
    log.warn('قاعدة البيانات', 'الاستمرار بدون قاعدة بيانات');
  }

  // الحصول على أحدث إصدار
  const { version } = await fetchLatestBaileysVersion();

  // إعداد حالة المصادقة
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(paths.session)
  );

  // إنشاء الاتصال
  socket = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Fᴀᴛɪᴍᴀ Bot', 'Chrome', '1.0.0'],
    markOnlineOnConnect: true,
    getMessage: async (key) => {
      return { conversation: '...' };
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // أحداث الاتصال
  // ═══════════════════════════════════════════════════════════════

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // عرض QR Code
    if (qr) {
      log.info('الاتصال', 'امسح رمز QR للاتصال');
      qrcode.generate(qr, { small: true });
    }

    // حالة الاتصال
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      log.connection('disconnected');
      log.error('الاتصال', 'تم قطع الاتصال', lastDisconnect?.error);

      if (shouldReconnect) {
        log.info('الاتصال', 'إعادة الاتصال...');
        await startBot();
      }
    } else if (connection === 'open') {
      log.connection('connected');
      log.start();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // حفظ بيانات المصادقة
  // ═══════════════════════════════════════════════════════════════

  socket.ev.on('creds.update', saveCreds);

  // ═══════════════════════════════════════════════════════════════
  // استقبال الرسائل
  // ═══════════════════════════════════════════════════════════════

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      // الحصول على معلومات المجموعة
      let groupMetadata: GroupMetadata | undefined;
      const jid = message.key.remoteJid;
      
      if (jid && jid.includes('@g.us')) {
        try {
          if (groupCache.has(jid)) {
            groupMetadata = groupCache.get(jid);
          } else {
            groupMetadata = await socket.groupMetadata(jid);
            groupCache.set(jid, groupMetadata);
          }
        } catch {
          // تجاهل الخطأ
        }
      }

      // معالجة الرسالة
      await handleMessage(socket, message, groupMetadata);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // تحديثات المجموعات
  // ═══════════════════════════════════════════════════════════════

  socket.ev.on('group-participants.update', async (update) => {
    await handleGroupUpdate(socket, update);
  });

  socket.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      if (update.id && groupCache.has(update.id)) {
        groupCache.delete(update.id);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // معالجة الأخطاء غير المعالجة
  // ═══════════════════════════════════════════════════════════════

  process.on('uncaughtException', (error) => {
    log.error('النظام', 'خطأ غير معالج', error);
  });

  process.on('unhandledRejection', (reason) => {
    log.error('النظام', 'وعد مرفوض غير معالج', reason as Error);
  });

  // ═══════════════════════════════════════════════════════════════
  // إيقاف آمن
  // ═══════════════════════════════════════════════════════════════

  process.on('SIGINT', async () => {
    log.info('النظام', 'جاري إيقاف البوت...');
    socket.end();
    process.exit(0);
  });
}

// ═══════════════════════════════════════════════════════════════
// تشغيل البوت
// ═══════════════════════════════════════════════════════════════

startBot().catch((error) => {
  log.error('النظام', 'فشل تشغيل البوت', error);
  process.exit(1);
});
