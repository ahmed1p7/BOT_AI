/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - نظام السجلات
 * ═══════════════════════════════════════════════════════════════
 */

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { paths } from '../config';

// إنشاء مجلد السجلات إذا لم يكن موجوداً
const logsDir = path.resolve(paths.logs);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// إعدادات السجلات
// ═══════════════════════════════════════════════════════════════

const logFile = path.join(logsDir, `fatima-${new Date().toISOString().split('T')[0]}.log`);

// سجل الملفات
const fileTransport = pino.transport({
  target: 'pino/file',
  options: { destination: logFile }
});

// سجل الكونسول
const consoleTransport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname'
  }
});

// السجل الرئيسي
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
}, consoleTransport);

// ═══════════════════════════════════════════════════════════════
// واجهة السجلات المخصصة
// ═══════════════════════════════════════════════════════════════

class Logger {
  private prefix: string;

  constructor(prefix: string = 'Fᴀᴛɪᴍᴀ') {
    this.prefix = prefix;
  }

  private formatMessage(category: string, message: string): string {
    return `[${this.prefix}][${category}] ${message}`;
  }

  info(category: string, message: string, data?: any): void {
    logger.info(data || {}, this.formatMessage(category, message));
  }

  warn(category: string, message: string, data?: any): void {
    logger.warn(data || {}, this.formatMessage(category, message));
  }

  error(category: string, message: string, error?: Error | any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    logger.error(errorData || {}, this.formatMessage(category, message));
  }

  debug(category: string, message: string, data?: any): void {
    logger.debug(data || {}, this.formatMessage(category, message));
  }

  success(category: string, message: string, data?: any): void {
    logger.info(data || {}, `✅ ${this.formatMessage(category, message)}`);
  }

  command(command: string, user: string, group?: string): void {
    const location = group ? `مجموعة: ${group}` : 'محادثة خاصة';
    logger.info({ command, user, location }, `⚡ أمر: ${command} | من: ${user} | ${location}`);
  }

  message(type: 'received' | 'sent', from: string, preview: string): void {
    const emoji = type === 'received' ? '📩' : '📤';
    logger.debug(`${emoji} ${type === 'received' ? 'وصلت' : 'تم إرسال'} رسالة من ${from}: ${preview.substring(0, 50)}...`);
  }

  connection(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    const statusMessages = {
      connecting: '🔄 جاري الاتصال...',
      connected: '✅ تم الاتصال بنجاح',
      disconnected: '⚠️ تم قطع الاتصال',
      error: '❌ خطأ في الاتصال'
    };
    logger.info(`🔌 ${statusMessages[status]}`);
  }

  start(): void {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗ █████╗ ███████╗██╗  ██╗██╗ ██████╗███████╗      ║
║     ██╔════╝██╔══██╗██╔════╝██║ ██╔╝██║██╔════╝██╔════╝      ║
║     █████╗  ███████║███████╗█████╔╝ ██║██║     █████╗        ║
║     ██╔══╝  ██╔══██║╚════██║██╔═██╗ ██║██║     ██╔══╝        ║
║     ███████╗██║  ██║███████║██║  ██╗██║╚██████╗███████╗      ║
║     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝      ║
║                                                               ║
║              🤖 WhatsApp Bot - الإصدار 1.0.0                  ║
║                  بواسطة فريق Fᴀᴛɪᴍᴀ                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    logger.info('🚀 تم تشغيل البوت بنجاح');
  }
}

export const log = new Logger();
export default log;
