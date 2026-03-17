/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - أوامر المالك
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory } from '../types';
import { config } from '../config';
import { 
  banUser, 
  unbanUser, 
  getUser,
  getUsers,
  getGroups,
  updateGroup 
} from '../database';
import { registerCommand, unregisterCommand, getAllCommands } from '../core/commandRegistry';
import { log } from '../utils/logger';
import { getPhoneNumber, createMention } from '../utils/helpers';
import { WASocket } from '@whiskeysockets/baileys';

// ═══════════════════════════════════════════════════════════════
// أمر حظر مستخدم
// ═══════════════════════════════════════════════════════════════

const banCommand: Command = {
  name: 'حظر',
  aliases: ['ban'],
  description: 'حظر مستخدم من استخدام البوت',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  usage: '<رقم/منشن> [السبب]',
  minArgs: 1,
  execute: async (ctx, socket) => {
    let targetJid = '';
    let reason = '';
    
    // التحقق من المنشن أو الرقم
    if (ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      targetJid = ctx.message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      reason = ctx.args?.slice(1).join(' ') || 'بدون سبب';
    } else if (ctx.args && ctx.args.length > 0) {
      targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      reason = ctx.args.slice(1).join(' ') || 'بدون سبب';
    }

    if (!targetJid) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى تحديد المستخدم' });
      return;
    }

    // منع حظر المالك
    if (getPhoneNumber(targetJid) === config.ownerNumber) {
      await socket.sendMessage(ctx.jid, { text: '❌ لا يمكن حظر المالك' });
      return;
    }

    await banUser(targetJid, reason);
    await socket.sendMessage(ctx.jid, { 
      text: `🚫 تم حظر ${createMention(targetJid)}\n📋 السبب: ${reason}`,
      mentions: [targetJid]
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر إلغاء الحظر
// ═══════════════════════════════════════════════════════════════

const unbanCommand: Command = {
  name: 'فك_حظر',
  aliases: ['unban'],
  description: 'إلغاء حظر مستخدم',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  usage: '<رقم/منشن>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    let targetJid = '';
    
    if (ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      targetJid = ctx.message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (ctx.args && ctx.args.length > 0) {
      targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    if (!targetJid) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى تحديد المستخدم' });
      return;
    }

    await unbanUser(targetJid);
    await socket.sendMessage(ctx.jid, { 
      text: `✅ تم إلغاء حظر ${createMention(targetJid)}`,
      mentions: [targetJid]
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر معلومات المستخدم
// ═══════════════════════════════════════════════════════════════

const userInfoCommand: Command = {
  name: 'userinfo',
  aliases: ['معلومات_مستخدم'],
  description: 'عرض معلومات مستخدم من قاعدة البيانات',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  usage: '<رقم>',
  execute: async (ctx, socket) => {
    let targetJid = ctx.sender;
    
    if (ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      targetJid = ctx.message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (ctx.args && ctx.args.length > 0) {
      targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    const user = await getUser(targetJid);
    
    if (!user) {
      await socket.sendMessage(ctx.jid, { text: '❌ المستخدم غير موجود في قاعدة البيانات' });
      return;
    }

    const info = `
╭═══════════════════════════════╗
║ 👤 معلومات المستخدم
╰═══════════════════════════════╝

🆔 JID: ${user.jid}
📛 الاسم: ${user.name || user.pushName || 'غير معروف'}
🚫 محظور: ${user.isBanned ? 'نعم' : 'لا'}
${user.banReason ? `📋 سبب الحظر: ${user.banReason}` : ''}
⚠️ التحذيرات: ${user.warnings}
👑 مميز: ${user.isPremium ? 'نعم' : 'لا'}
📊 الأوامر المستخدمة: ${user.commandsUsed}
📅 تاريخ التسجيل: ${user.createdAt?.toLocaleDateString('ar-SA') || 'غير معروف'}
${user.lastCommand ? `⏰ آخر أمر: ${user.lastCommand.toLocaleDateString('ar-SA')}` : ''}
`;

    await socket.sendMessage(ctx.jid, { text: info });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر إعادة تحميل البوت
// ═══════════════════════════════════════════════════════════════

const restartCommand: Command = {
  name: 'restart',
  aliases: ['اعادة', 'إعادة_تشغيل'],
  description: 'إعادة تشغيل البوت',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  execute: async (ctx, socket) => {
    await socket.sendMessage(ctx.jid, { text: '🔄 جاري إعادة تشغيل البوت...' });
    log.info('النظام', 'تم طلب إعادة التشغيل من المالك');
    process.exit(0);
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر البث العام
// ═══════════════════════════════════════════════════════════════

const broadcastCommand: Command = {
  name: 'broadcast',
  aliases: ['بث', 'اذاعة'],
  description: 'إرسال رسالة لجميع المحادثات',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  usage: '<الرسالة>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة الرسالة' });
      return;
    }

    const message = ctx.args.join(' ');
    const chats = await socket.groupFetchAllParticipating();
    
    await socket.sendMessage(ctx.jid, { 
      text: `📢 جاري إرسال البث إلى ${Object.keys(chats).length} مجموعة...` 
    });

    let sent = 0;
    let failed = 0;

    for (const jid of Object.keys(chats)) {
      try {
        await socket.sendMessage(jid, { text: `📢 *بث عام*\n\n${message}` });
        sent++;
      } catch {
        failed++;
      }
    }

    await socket.sendMessage(ctx.jid, { 
      text: `✅ تم إرسال البث\n📤 نجح: ${sent}\n❌ فشل: ${failed}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تغيير البادئة
// ═══════════════════════════════════════════════════════════════

const setPrefixCommand: Command = {
  name: 'setprefix',
  aliases: ['بادئة', 'تغيير_البادئة'],
  description: 'تغيير بادئة الأوامر',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  usage: '<البادئة الجديدة>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة البادئة الجديدة' });
      return;
    }

    const newPrefix = ctx.args[0];
    config.prefix = newPrefix;
    
    await socket.sendMessage(ctx.jid, { 
      text: `✅ تم تغيير البادئة إلى: ${newPrefix}` 
    });
    log.info('النظام', `تم تغيير البادئة إلى: ${newPrefix}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر مغادرة المجموعة
// ═══════════════════════════════════════════════════════════════

const leaveCommand: Command = {
  name: 'leave',
  aliases: ['مغادرة', 'خروج'],
  description: 'مغادرة المجموعة الحالية',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  groupOnly: true,
  execute: async (ctx, socket) => {
    await socket.sendMessage(ctx.jid, { text: '👋 مغادر المجموعة...' });
    await socket.groupLeave(ctx.jid);
    log.info('المجموعات', `غادر البوت المجموعة: ${ctx.jid}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر الانضمام لمجموعة
// ═══════════════════════════════════════════════════════════════

const joinCommand: Command = {
  name: 'join',
  aliases: ['انضمام', 'ادخل'],
  description: 'الانضمام لمجموعة عبر الرابط',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  usage: '<رابط المجموعة>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة رابط المجموعة' });
      return;
    }

    const link = ctx.args[0];
    const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);

    if (!match) {
      await socket.sendMessage(ctx.jid, { text: '❌ رابط غير صالح' });
      return;
    }

    try {
      const code = match[1];
      const result = await socket.groupAcceptInvite(code);
      await socket.sendMessage(ctx.jid, { text: `✅ تم الانضمام للمجموعة: ${result}` });
      log.info('المجموعات', `انضم البوت لمجموعة جديدة: ${result}`);
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في الانضمام للمجموعة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر إحصائيات
// ═══════════════════════════════════════════════════════════════

const statsCommand: Command = {
  name: 'stats',
  aliases: ['احصائيات', 'إحصائيات'],
  description: 'عرض إحصائيات البوت',
  category: CommandCategory.OWNER,
  ownerOnly: true,
  execute: async (ctx, socket) => {
    const chats = await socket.groupFetchAllParticipating();
    const groups = Object.keys(chats).length;
    const totalParticipants = Object.values(chats).reduce(
      (acc, chat) => acc + (chat.participants?.length || 0), 
      0
    );

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const stats = `
╭═══════════════════════════════╗
║ 📊 إحصائيات ${config.name}
╰═══════════════════════════════╝

🕐 وقت التشغيل: ${days} يوم، ${hours} ساعة، ${minutes} دقيقة
👥 المجموعات: ${groups}
👤 إجمالي الأعضاء: ${totalParticipants}
📋 الأوامر المسجلة: ${getAllCommands().length}
💾 الذاكرة المستخدمة: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
💾 الذاكرة الكلية: ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB
`;

    await socket.sendMessage(ctx.jid, { text: stats });
  }
};

// ═══════════════════════════════════════════════════════════════
// تصدير الأوامر
// ═══════════════════════════════════════════════════════════════

export const ownerCommands: Command[] = [
  banCommand,
  unbanCommand,
  userInfoCommand,
  restartCommand,
  broadcastCommand,
  setPrefixCommand,
  leaveCommand,
  joinCommand,
  statsCommand
];

export default ownerCommands;
