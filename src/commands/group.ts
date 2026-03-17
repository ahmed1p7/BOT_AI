/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - أوامر المجموعات
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory } from '../types';
import { config, messages } from '../config';
import { getGroup, updateGroup, createGroup } from '../database';
import { createMention } from '../utils/helpers';
import { WASocket, WAMessage, GroupMetadata, delay } from '@whiskeysockets/baileys';

// ═══════════════════════════════════════════════════════════════
// أمر ترقية عضو إلى مشرف
// ═══════════════════════════════════════════════════════════════

const promoteCommand: Command = {
  name: 'ترقية',
  aliases: ['promote', 'رفع'],
  description: 'ترقية عضو إلى مشرف',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  usage: '@منشن / رقم',
  execute: async (ctx, socket) => {
    let targetJid = '';
    
    // التحقق من المنشن أو الرقم
    if (ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      targetJid = ctx.message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (ctx.args && ctx.args.length > 0) {
      targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    if (!targetJid) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى منشن الشخص أو كتابة رقمه' });
      return;
    }

    try {
      await socket.groupParticipantsUpdate(ctx.jid, [targetJid], 'promote');
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم ترقية ${createMention(targetJid)} إلى مشرف`,
        mentions: [targetJid]
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في ترقية العضو' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تنزيل مشرف
// ═══════════════════════════════════════════════════════════════

const demoteCommand: Command = {
  name: 'تنزيل',
  aliases: ['demote', 'عزل'],
  description: 'تنزيل مشرف إلى عضو عادي',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  usage: '@منشن / رقم',
  execute: async (ctx, socket) => {
    let targetJid = '';
    
    if (ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      targetJid = ctx.message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (ctx.args && ctx.args.length > 0) {
      targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    if (!targetJid) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى منشن الشخص أو كتابة رقمه' });
      return;
    }

    try {
      await socket.groupParticipantsUpdate(ctx.jid, [targetJid], 'demote');
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم تنزيل ${createMention(targetJid)} من المشرفين`,
        mentions: [targetJid]
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في تنزيل المشرف' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر طرد عضو
// ═══════════════════════════════════════════════════════════════

const kickCommand: Command = {
  name: 'طرد',
  aliases: ['kick', 'حذف', 'remove'],
  description: 'طرد عضو من المجموعة',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  usage: '@منشن / رقم',
  execute: async (ctx, socket) => {
    let targetJid = '';
    
    if (ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      targetJid = ctx.message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (ctx.args && ctx.args.length > 0) {
      targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    if (!targetJid) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى منشن الشخص أو كتابة رقمه' });
      return;
    }

    // منع طرد المالك
    if (targetJid === socket.user?.id) {
      await socket.sendMessage(ctx.jid, { text: '❌ لا يمكن طرد البوت' });
      return;
    }

    try {
      await socket.groupParticipantsUpdate(ctx.jid, [targetJid], 'remove');
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم طرد ${createMention(targetJid)} من المجموعة`,
        mentions: [targetJid]
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في طرد العضو' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر إضافة عضو
// ═══════════════════════════════════════════════════════════════

const addCommand: Command = {
  name: 'اضافة',
  aliases: ['add', 'إضافة', 'ادخل'],
  description: 'إضافة عضو للمجموعة',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  usage: '<رقم>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة رقم العضو' });
      return;
    }

    const targetJid = `${ctx.args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    try {
      await socket.groupParticipantsUpdate(ctx.jid, [targetJid], 'add');
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم إضافة ${createMention(targetJid)} للمجموعة`,
        mentions: [targetJid]
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في إضافة العضو (قد يكون الرقم غير موجود أو الخصوصية مفعلة)' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر روابط المجموعة
// ═══════════════════════════════════════════════════════════════

const linkCommand: Command = {
  name: 'رابط',
  aliases: ['link', 'لينك'],
  description: 'الحصول على رابط المجموعة',
  category: CommandCategory.GROUP,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  execute: async (ctx, socket) => {
    try {
      const code = await socket.groupInviteCode(ctx.jid);
      const link = `https://chat.whatsapp.com/${code}`;
      await socket.sendMessage(ctx.jid, { 
        text: `🔗 رابط المجموعة:\n${link}\n\n📋 انقر على الرابط للنسخ`
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في الحصول على رابط المجموعة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر إعادة ضبط الرابط
// ═══════════════════════════════════════════════════════════════

const revokeLinkCommand: Command = {
  name: 'اعادة',
  aliases: ['revoke', 'revokelink', 'تجديد'],
  description: 'إعادة ضبط رابط المجموعة',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  execute: async (ctx, socket) => {
    try {
      await socket.groupRevokeInvite(ctx.jid);
      const code = await socket.groupInviteCode(ctx.jid);
      const link = `https://chat.whatsapp.com/${code}`;
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم تجديد رابط المجموعة:\n${link}`
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في تجديد الرابط' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تغيير اسم المجموعة
// ═══════════════════════════════════════════════════════════════

const setGcNameCommand: Command = {
  name: 'اسم',
  aliases: ['setname', 'اسم_مجموعة'],
  description: 'تغيير اسم المجموعة',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  usage: '<الاسم الجديد>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة الاسم الجديد' });
      return;
    }

    const newName = ctx.args.join(' ');
    
    try {
      await socket.groupUpdateSubject(ctx.jid, newName);
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم تغيير اسم المجموعة إلى: ${newName}`
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في تغيير الاسم' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تغيير وصف المجموعة
// ═══════════════════════════════════════════════════════════════

const setDescCommand: Command = {
  name: 'وصف',
  aliases: ['setdesc', 'الوصف'],
  description: 'تغيير وصف المجموعة',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  usage: '<الوصف الجديد>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة الوصف الجديد' });
      return;
    }

    const newDesc = ctx.args.join(' ');
    
    try {
      await socket.groupUpdateDescription(ctx.jid, newDesc);
      await socket.sendMessage(ctx.jid, { 
        text: `✅ تم تغيير وصف المجموعة`
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في تغيير الوصف' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر إعدادات المجموعة
// ═══════════════════════════════════════════════════════════════

const gcSettingsCommand: Command = {
  name: 'اعدادات',
  aliases: ['settings', 'إعدادات'],
  description: 'عرض وإعدادات المجموعة',
  category: CommandCategory.GROUP,
  groupOnly: true,
  adminOnly: true,
  execute: async (ctx, socket) => {
    let groupData = await getGroup(ctx.jid);
    if (!groupData) {
      groupData = await createGroup(ctx.jid, ctx.groupMetadata?.subject);
    }

    const settings = `
╭═══════════════════════════════╗
║ ⚙️ إعدادات المجموعة
╰═══════════════════════════════╝

👥 المجموعة: ${ctx.groupMetadata?.subject || 'غير معروف'}
🆔 المعرف: ${ctx.jid}
👥 الأعضاء: ${ctx.groupMetadata?.participants.length || 0}

📜 الإعدادات:
• الترحيب: ${groupData.welcomeEnabled ? '✅' : '❌'}
• الوداع: ${groupData.goodbyeEnabled ? '✅' : '❌'}
• حماية الروابط: ${groupData.antiLink ? '✅' : '❌'}
• حماية السبام: ${groupData.antiSpam ? '✅' : '❌'}
• الذكاء الاصطناعي: ${groupData.settings.aiEnabled ? '✅' : '❌'}

📝 لتغيير الإعدادات استخدم:
${config.prefix}ترحيب [تشغيل/إيقاف]
${config.prefix}وداع [تشغيل/إيقاف]
${config.prefix}حماية [روابط/سبام]
`;

    await socket.sendMessage(ctx.jid, { text: settings });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تفعيل/إيقاف الترحيب
// ═══════════════════════════════════════════════════════════════

const welcomeToggleCommand: Command = {
  name: 'ترحيب',
  aliases: ['welcome'],
  description: 'تفعيل/إيقاف رسالة الترحيب',
  category: CommandCategory.GROUP,
  groupOnly: true,
  adminOnly: true,
  usage: '[تشغيل/إيقاف] [الرسالة]',
  execute: async (ctx, socket) => {
    const arg = ctx.args?.[0]?.toLowerCase();
    
    if (arg === 'تشغيل' || arg === 'on') {
      await updateGroup(ctx.jid, { welcomeEnabled: true });
      await socket.sendMessage(ctx.jid, { text: '✅ تم تفعيل رسالة الترحيب' });
    } else if (arg === 'إيقاف' || arg === 'off') {
      await updateGroup(ctx.jid, { welcomeEnabled: false });
      await socket.sendMessage(ctx.jid, { text: '✅ تم إيقاف رسالة الترحيب' });
    } else if (ctx.args && ctx.args.length > 1) {
      const message = ctx.args.join(' ');
      await updateGroup(ctx.jid, { welcomeMessage: message, welcomeEnabled: true });
      await socket.sendMessage(ctx.jid, { text: `✅ تم تحديث رسالة الترحيب` });
    } else {
      const groupData = await getGroup(ctx.jid);
      await socket.sendMessage(ctx.jid, { 
        text: `وضع الترحيب الحالي: ${groupData?.welcomeEnabled ? '✅ مفعل' : '❌ معطل'}\n\nالاستخدام:\n${config.prefix}ترحيب تشغيل\n${config.prefix}ترحيب إيقاف\n${config.prefix}ترحيب [الرسالة الجديدة]`
      });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر فتح/إغلاق المجموعة
// ═══════════════════════════════════════════════════════════════

const lockCommand: Command = {
  name: 'قفل',
  aliases: ['lock', 'اغلاق', 'إغلاق'],
  description: 'إغلاق المجموعة (المشرفين فقط يرسلون)',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  execute: async (ctx, socket) => {
    try {
      await socket.groupSettingUpdate(ctx.jid, 'announcement');
      await socket.sendMessage(ctx.jid, { 
        text: '🔒 تم إغلاق المجموعة - المشرفين فقط يستطيعون الإرسال'
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في إغلاق المجموعة' });
    }
  }
};

const unlockCommand: Command = {
  name: 'فتح',
  aliases: ['unlock', 'افتح'],
  description: 'فتح المجموعة للجميع',
  category: CommandCategory.ADMIN,
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  execute: async (ctx, socket) => {
    try {
      await socket.groupSettingUpdate(ctx.jid, 'not_announcement');
      await socket.sendMessage(ctx.jid, { 
        text: '🔓 تم فتح المجموعة - الجميع يستطيعون الإرسال'
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ فشل في فتح المجموعة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// تصدير الأوامر
// ═══════════════════════════════════════════════════════════════

export const groupCommands: Command[] = [
  promoteCommand,
  demoteCommand,
  kickCommand,
  addCommand,
  linkCommand,
  revokeLinkCommand,
  setGcNameCommand,
  setDescCommand,
  gcSettingsCommand,
  welcomeToggleCommand,
  lockCommand,
  unlockCommand
];

export default groupCommands;
