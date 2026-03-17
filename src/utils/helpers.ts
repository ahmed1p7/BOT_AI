/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - الدوال المساعدة
 * ═══════════════════════════════════════════════════════════════
 */

import { WAMessage, WASocket, GroupMetadata, isJidGroup, isJidUser } from '@whiskeysockets/baileys';
import { MessageContext, GroupParticipant } from '../types';
import config from '../config';

// ═══════════════════════════════════════════════════════════════
// معالجة الرسائل
// ═══════════════════════════════════════════════════════════════

/**
 * استخراج نص الرسالة
 */
export function getMessageText(message: WAMessage): string {
  const msg = message.message;
  if (!msg) return '';

  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
  if (msg.imageMessage?.caption) return msg.imageMessage.caption;
  if (msg.videoMessage?.caption) return msg.videoMessage.caption;
  if (msg.buttonsResponseMessage?.selectedButtonId) return msg.buttonsResponseMessage.selectedButtonId;
  if (msg.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.listResponseMessage.singleSelectReply.selectedRowId;

  return '';
}

/**
 * استخراج الرسالة المقتبسة
 */
export function getQuotedMessage(message: WAMessage): WAMessage | undefined {
  const msg = message.message;
  if (!msg) return undefined;

  const quoted = 
    msg.extendedTextMessage?.contextInfo?.quotedMessage ||
    msg.imageMessage?.contextInfo?.quotedMessage ||
    msg.videoMessage?.contextInfo?.quotedMessage;

  if (quoted) {
    return { message: quoted, key: message.key } as WAMessage;
  }

  return undefined;
}

// ═══════════════════════════════════════════════════════════════
// معالجة الأوامر
// ═══════════════════════════════════════════════════════════════

/**
 * فحص إذا كانت الرسالة أمر
 */
export function isCommand(text: string, prefix: string = config.prefix): boolean {
  return text.startsWith(prefix);
}

/**
 * تحليل الأمر
 */
export function parseCommand(text: string, prefix: string = config.prefix): { command: string; args: string[] } | null {
  if (!isCommand(text, prefix)) return null;

  const withoutPrefix = text.slice(prefix.length).trim();
  const parts = withoutPrefix.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { command, args };
}

// ═══════════════════════════════════════════════════════════════
// معالجة JID
// ═══════════════════════════════════════════════════════════════

/**
 * استخراج رقم الهاتف من JID
 */
export function getPhoneNumber(jid: string): string {
  return jid.replace(/[@.sapa-]+/g, '').split(':')[0];
}

/**
 * تحويل رقم الهاتف إلى JID
 */
export function toJid(phone: string, type: 'user' | 'group' = 'user'): string {
  const cleanNumber = phone.replace(/[^0-9]/g, '');
  return type === 'user' ? `${cleanNumber}@s.whatsapp.net` : `${cleanNumber}@g.us`;
}

/**
 * التحقق من كون JID مجموعة
 */
export function isGroup(jid: string): boolean {
  return isJidGroup(jid);
}

/**
 * التحقق من كون JID مستخدم
 */
export function isUser(jid: string): boolean {
  return isJidUser(jid);
}

// ═══════════════════════════════════════════════════════════════
// الصلاحيات
// ═══════════════════════════════════════════════════════════════

/**
 * التحقق من كون المستخدم مشرف في المجموعة
 */
export function isAdmin(participants: GroupParticipant[], userJid: string): boolean {
  const participant = participants.find(p => p.id === userJid);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

/**
 * التحقق من كون البوت مشرف في المجموعة
 */
export function isBotAdmin(participants: GroupParticipant[], botJid: string): boolean {
  return isAdmin(participants, botJid);
}

/**
 * التحقق من كون المستخدم المالك
 */
export function isOwner(userJid: string): boolean {
  const userNumber = getPhoneNumber(userJid);
  const ownerNumber = config.ownerNumber.replace(/[^0-9]/g, '');
  
  if (userNumber === ownerNumber) return true;
  
  return config.additionalOwners.some(
    owner => userNumber === owner.replace(/[^0-9]/g, '')
  );
}

// ═══════════════════════════════════════════════════════════════
// إنشاء سياق الرسالة
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء سياق الرسالة الكامل
 */
export async function createMessageContext(
  message: WAMessage,
  socket: WASocket,
  groupMetadata?: GroupMetadata
): Promise<MessageContext> {
  const jid = message.key.remoteJid || '';
  const sender = message.key.fromMe 
    ? socket.user?.id || ''
    : (isGroup(jid) ? message.key.participant || '' : jid);
  
  const messageText = getMessageText(message);
  const parsed = parseCommand(messageText);
  const isGroupChat = isGroup(jid);
  
  let isAdminUser = false;
  let isBotAdminUser = false;

  if (isGroupChat && groupMetadata) {
    const participants = groupMetadata.participants as GroupParticipant[];
    isAdminUser = isAdmin(participants, sender);
    isBotAdminUser = isBotAdmin(participants, socket.user?.id || '');
  }

  return {
    jid,
    sender,
    senderName: message.pushName,
    isGroup: isGroupChat,
    groupMetadata,
    message,
    messageText,
    command: parsed?.command,
    args: parsed?.args,
    quotedMessage: getQuotedMessage(message),
    isOwner: isOwner(sender),
    isAdmin: isAdminUser,
    isBotAdmin: isBotAdminUser,
    pushName: message.pushName
  };
}

// ═══════════════════════════════════════════════════════════════
// دوال الوقت والتاريخ
// ═══════════════════════════════════════════════════════════════

/**
 * تنسيق الوقت بالعربية
 */
export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * الوقت النسبي بالعربية
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `منذ ${years} سنة`;
  if (months > 0) return `منذ ${months} شهر`;
  if (weeks > 0) return `منذ ${weeks} أسبوع`;
  if (days > 0) return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (minutes > 0) return `منذ ${minutes} دقيقة`;
  return 'الآن';
}

// ═══════════════════════════════════════════════════════════════
// دوال النص
// ═══════════════════════════════════════════════════════════════

/**
 * اختصار النص
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * تنظيف النص من HTML
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * تحويل النص إلى أحرف صغيرة مع دعم العربية
 */
export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

/**
 * فحص إذا كان النص يحتوي على رابط
 */
export function containsLink(text: string): boolean {
  const linkRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})/gi;
  return linkRegex.test(text);
}

// ═══════════════════════════════════════════════════════════════
// دوال عشوائية
// ═══════════════════════════════════════════════════════════════

/**
 * اختيار عنصر عشوائي من مصفوفة
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * إنشاء معرف فريد
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * رقم عشوائي في نطاق
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ═══════════════════════════════════════════════════════════════
// دوال الانتظار
// ═══════════════════════════════════════════════════════════════

/**
 * انتظار لمدة محددة
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// دوال الحجم
// ═══════════════════════════════════════════════════════════════

/**
 * تنسيق حجم الملف
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// ═══════════════════════════════════════════════════════════════
// دوال Mention
// ═══════════════════════════════════════════════════════════════

/**
 * استخراج المentions من الرسالة
 */
export function extractMentions(message: WAMessage): string[] {
  const msg = message.message;
  if (!msg) return [];

  const contextInfo = 
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo;

  return contextInfo?.mentionedJid || [];
}

/**
 * إنشاء تنسيق Mention
 */
export function createMention(jid: string): string {
  return `@${getPhoneNumber(jid)}`;
}
