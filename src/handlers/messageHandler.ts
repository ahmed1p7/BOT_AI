/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - معالج الرسائل
 * ═══════════════════════════════════════════════════════════════
 */

import { WASocket, WAMessage, GroupMetadata } from '@whiskeysockets/baileys';
import { config, messages } from '../config';
import { createMessageContext, getMessageText, parseCommand, isGroup } from '../utils/helpers';
import { executeCommand } from '../core/commandRegistry';
import { 
  getUser, 
  createUser, 
  incrementCommandsUsed, 
  getGroup, 
  createGroup,
  getAutoReplies 
} from '../database';
import { log } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
// معالجة الرسائل الواردة
// ═══════════════════════════════════════════════════════════════

export async function handleMessage(
  socket: WASocket,
  message: WAMessage,
  groupMetadata?: GroupMetadata
): Promise<void> {
  try {
    // تجاهل الرسائل من البوت نفسه
    if (message.key.fromMe) return;

    // إنشاء سياق الرسالة
    const ctx = await createMessageContext(message, socket, groupMetadata);
    const messageText = ctx.messageText;

    // تجاهل الرسائل الفارغة
    if (!messageText) return;

    // تسجيل الرسالة
    log.message('received', ctx.sender, messageText);

    // التحقق من المستخدم في قاعدة البيانات
    await ensureUserExists(ctx.sender, ctx.pushName);

    // التحقق من الحظر
    const user = await getUser(ctx.sender);
    if (user?.isBanned) {
      await socket.sendMessage(ctx.jid, { 
        text: `${messages.banned}\n📋 السبب: ${user.banReason || 'غير محدد'}` 
      });
      return;
    }

    // معالجة الأوامر
    if (ctx.command) {
      await handleCommand(socket, ctx);
      return;
    }

    // معالجة الردود التلقائية
    await handleAutoReplies(socket, ctx);

    // التفاعل مع الرسائل العادية (اختياري)
    // await handleNormalMessage(socket, ctx);

  } catch (error) {
    log.error('الرسائل', 'خطأ في معالجة الرسالة', error as Error);
  }
}

// ═══════════════════════════════════════════════════════════════
// التأكد من وجود المستخدم
// ═══════════════════════════════════════════════════════════════

async function ensureUserExists(jid: string, name?: string): Promise<void> {
  const existing = await getUser(jid);
  if (!existing) {
    await createUser(jid, name, name);
  }
}

// ═══════════════════════════════════════════════════════════════
// معالجة الأوامر
// ═══════════════════════════════════════════════════════════════

async function handleCommand(socket: WASocket, ctx: any): Promise<void> {
  // إظهار حالة الكتابة
  if (config.typingIndicator) {
    await socket.sendPresenceUpdate('composing', ctx.jid);
  }

  // تنفيذ الأمر
  const result = await executeCommand(ctx.command, ctx, socket);

  // تسجيل استخدام الأمر
  await incrementCommandsUsed(ctx.sender);

  // إرسال رسالة الخطأ إن وجدت
  if (!result.success && result.message) {
    await socket.sendMessage(ctx.jid, { text: result.message });
  }

  // وضع علامة القراءة
  if (config.readMessages) {
    await socket.readMessages([ctx.message.key]);
  }
}

// ═══════════════════════════════════════════════════════════════
// معالجة الردود التلقائية
// ═══════════════════════════════════════════════════════════════

async function handleAutoReplies(socket: WASocket, ctx: any): Promise<void> {
  const autoReplies = await getAutoReplies();
  const messageText = ctx.messageText.toLowerCase();

  for (const reply of autoReplies) {
    let shouldReply = false;

    // فحص الشرط
    if (reply.isRegex) {
      const regex = new RegExp(reply.trigger, reply.caseSensitive ? '' : 'i');
      shouldReply = regex.test(messageText);
    } else if (reply.exact) {
      shouldReply = reply.caseSensitive 
        ? messageText === reply.trigger 
        : messageText === reply.trigger.toLowerCase();
    } else {
      shouldReply = reply.caseSensitive 
        ? messageText.includes(reply.trigger)
        : messageText.includes(reply.trigger.toLowerCase());
    }

    // فحص الموقع
    if (reply.groupOnly && !ctx.isGroup) continue;
    if (reply.privateOnly && ctx.isGroup) continue;

    if (shouldReply) {
      await socket.sendMessage(ctx.jid, { text: reply.response });
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// معالجة الرسائل العادية
// ═══════════════════════════════════════════════════════════════

async function handleNormalMessage(socket: WASocket, ctx: any): Promise<void> {
  // يمكن إضافة ردود تلقائية بسيطة هنا
  const messageText = ctx.messageText.toLowerCase();

  // ردود على كلمات معينة
  const simpleReplies: { [key: string]: string } = {
    'مرحبا': 'مرحباً بك! 👋',
    'السلام عليكم': 'وعليكم السلام ورحمة الله 🌟',
    'صباح الخير': 'صباح النور والسرور ☀️',
    'مساء الخير': 'مساء النور 🌙',
    'شكرا': 'العفو! 😊',
    'شكراً': 'العفو! 😊'
  };

  for (const [trigger, response] of Object.entries(simpleReplies)) {
    if (messageText.includes(trigger)) {
      await socket.sendMessage(ctx.jid, { text: response });
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// معالجة أحداث المجموعات
// ═══════════════════════════════════════════════════════════════

export async function handleGroupUpdate(
  socket: WASocket,
  update: { id: string; author?: string; action: string; participants?: string[] }
): Promise<void> {
  const groupJid = update.id;

  // الحصول على معلومات المجموعة
  let groupData = await getGroup(groupJid);
  
  try {
    const groupMetadata = await socket.groupMetadata(groupJid);
    
    if (!groupData) {
      groupData = await createGroup(groupJid, groupMetadata.subject);
    }

    // معالجة الانضمام
    if (update.action === 'add' && update.participants) {
      for (const participant of update.participants) {
        await handleWelcome(socket, groupJid, participant, groupData, groupMetadata.subject);
      }
    }

    // معالجة المغادرة
    if (update.action === 'remove' && update.participants) {
      for (const participant of update.participants) {
        await handleGoodbye(socket, groupJid, participant, groupData, groupMetadata.subject);
      }
    }

    // معالجة الترقية
    if (update.action === 'promote' && update.participants) {
      for (const participant of update.participants) {
        await socket.sendMessage(groupJid, {
          text: `👑 تم ترقية @${participant.split('@')[0]} إلى مشرف`,
          mentions: [participant]
        });
      }
    }

    // معالجة التنزيل
    if (update.action === 'demote' && update.participants) {
      for (const participant of update.participants) {
        await socket.sendMessage(groupJid, {
          text: `📉 تم تنزيل @${participant.split('@')[0]} من المشرفين`,
          mentions: [participant]
        });
      }
    }
  } catch (error) {
    log.error('المجموعات', 'خطأ في معالجة تحديث المجموعة', error as Error);
  }
}

// ═══════════════════════════════════════════════════════════════
// رسالة الترحيب
// ═══════════════════════════════════════════════════════════════

async function handleWelcome(
  socket: WASocket,
  groupJid: string,
  participant: string,
  groupData: any,
  groupName: string
): Promise<void> {
  if (!groupData.welcomeEnabled) return;

  const welcomeMsg = groupData.welcomeMessage || config.welcome.message;
  const finalMessage = welcomeMsg
    .replace('@user', `@${participant.split('@')[0]}`)
    .replace('@group', groupName);

  await socket.sendMessage(groupJid, {
    text: finalMessage,
    mentions: [participant]
  });
}

// ═══════════════════════════════════════════════════════════════
// رسالة الوداع
// ═══════════════════════════════════════════════════════════════

async function handleGoodbye(
  socket: WASocket,
  groupJid: string,
  participant: string,
  groupData: any,
  groupName: string
): Promise<void> {
  if (!groupData.goodbyeEnabled) return;

  const goodbyeMsg = groupData.goodbyeMessage || config.welcome.goodbyeMessage;
  const finalMessage = goodbyeMsg
    .replace('@user', `@${participant.split('@')[0]}`)
    .replace('@group', groupName);

  await socket.sendMessage(groupJid, {
    text: finalMessage,
    mentions: [participant]
  });
}

export default {
  handleMessage,
  handleGroupUpdate
};
