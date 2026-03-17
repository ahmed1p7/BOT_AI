/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - أوامر عامة
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory } from '../types';
import { config } from '../config';
import { getCommandsByCategory, getAllCommands } from '../core/commandRegistry';
import { formatDate, formatTime, getPhoneNumber } from '../utils/helpers';

// ═══════════════════════════════════════════════════════════════
// أمر القائمة الرئيسية
// ═══════════════════════════════════════════════════════════════

const menuCommand: Command = {
  name: 'menu',
  aliases: ['قائمة', 'الاوامر', 'اوامر', 'help', 'مساعدة'],
  description: 'عرض قائمة الأوامر المتاحة',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    const categories = {
      [CommandCategory.GENERAL]: '📌 الأوامر العامة',
      [CommandCategory.ADMIN]: '👑 أوامر الإدارة',
      [CommandCategory.GROUP]: '👥 أوامر المجموعات',
      [CommandCategory.MEDIA]: '🎬 أوامر الوسائط',
      [CommandCategory.AI]: '🤖 الذكاء الاصطناعي',
      [CommandCategory.FUN]: '🎮 الترفيه',
      [CommandCategory.TOOLS]: '🛠️ الأدوات',
      [CommandCategory.DOWNLOAD]: '📥 التحميل',
      [CommandCategory.UTILITY]: '⚡ الخدمات'
    };

    let menu = `╭═══════════════════════════════╗
║     🤖 ${config.name} Bot     
║         الإصدار ${config.version}
╰═══════════════════════════════╝

`;

    for (const [category, title] of Object.entries(categories)) {
      const cmds = getCommandsByCategory(category as CommandCategory);
      if (cmds.length > 0) {
        menu += `┌──❯ ${title}\n`;
        cmds.forEach(cmd => {
          menu += `│ ${config.prefix}${cmd.name} - ${cmd.description}\n`;
        });
        menu += `└──────────────────\n\n`;
      }
    }

    menu += `╭═══════════════════════════════╗
║ 📝 تلميح: استخدم ${config.prefix}مساعدة [أمر]
║ لمعرفة المزيد عن أمر معين
╰═══════════════════════════════╝`;

    await socket.sendMessage(ctx.jid, { text: menu });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر المساعدة
// ═══════════════════════════════════════════════════════════════

const helpCommand: Command = {
  name: 'مساعدة',
  aliases: ['help'],
  description: 'عرض معلومات مساعدة لأمر معين',
  category: CommandCategory.GENERAL,
  usage: '<أمر>',
  minArgs: 0,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await menuCommand.execute(ctx, socket);
      return;
    }

    const commandName = ctx.args[0].replace(config.prefix, '').toLowerCase();
    const allCommands = getAllCommands();
    const command = allCommands.find(
      cmd => cmd.name === commandName || 
      (cmd.aliases && cmd.aliases.some(a => a === commandName))
    );

    if (!command) {
      await socket.sendMessage(ctx.jid, { 
        text: `❌ لم يتم العثور على الأمر: ${commandName}` 
      });
      return;
    }

    let helpText = `
╭═══════════════════════════════╗
║ 📋 معلومات الأمر
╰═══════════════════════════════╝

🔖 الاسم: ${command.name}
📝 الوصف: ${command.description}
📁 الفئة: ${command.category}
`;

    if (command.aliases && command.aliases.length > 0) {
      helpText += `🔄 الأسماء المستعارة: ${command.aliases.join(', ')}\n`;
    }

    if (command.usage) {
      helpText += `📋 الاستخدام: ${config.prefix}${command.name} ${command.usage}\n`;
    }

    if (command.examples && command.examples.length > 0) {
      helpText += `\n📌 أمثلة:\n`;
      command.examples.forEach(ex => {
        helpText += `  • ${config.prefix}${ex}\n`;
      });
    }

    if (command.cooldown) {
      helpText += `⏱️ فترة الانتظار: ${command.cooldown} ثانية\n`;
    }

    if (command.ownerOnly) {
      helpText += `🔒 صلاحية: المالك فقط\n`;
    } else if (command.adminOnly) {
      helpText += `🔒 صلاحية: المشرفين فقط\n`;
    } else if (command.groupOnly) {
      helpText += `🔒 صلاحية: المجموعات فقط\n`;
    }

    await socket.sendMessage(ctx.jid, { text: helpText });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر المعلومات
// ═══════════════════════════════════════════════════════════════

const infoCommand: Command = {
  name: 'info',
  aliases: ['معلومات', 'البوت', 'bot'],
  description: 'معلومات عن البوت',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const info = `
╭═══════════════════════════════╗
║ 🤖 معلومات ${config.name}
╰═══════════════════════════════╝

📛 الاسم: ${config.name}
📝 الإصدار: ${config.version}
🌐 اللغة: العربية
⚡ البادئة: ${config.prefix}
👤 المالك: @${config.ownerNumber}

⏱️ وقت التشغيل: ${days} يوم، ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية

📊 الأوامر المسجلة: ${getAllCommands().length}
💾 استخدام الذاكرة: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
`;

    await socket.sendMessage(ctx.jid, { 
      text: info,
      mentions: [ctx.sender]
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر البينق
// ═══════════════════════════════════════════════════════════════

const pingCommand: Command = {
  name: 'ping',
  aliases: ['بنج', 'سرعة'],
  description: 'فحص سرعة الاستجابة',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    const start = Date.now();
    const msg = await socket.sendMessage(ctx.jid, { text: '🏓 جاري الفحص...' });
    const end = Date.now();
    
    const speed = end - start;
    let emoji = '🟢';
    if (speed > 500) emoji = '🟡';
    if (speed > 1000) emoji = '🔴';

    await socket.sendMessage(ctx.jid, { 
      text: `${emoji} سرعة الاستجابة: *${speed}ms*`,
      edit: msg.key
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر التاريخ والوقت
// ═══════════════════════════════════════════════════════════════

const dateCommand: Command = {
  name: 'تاريخ',
  aliases: ['date', 'وقت', 'time'],
  description: 'عرض التاريخ والوقت الحالي',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    const now = new Date();
    const message = `
📅 التاريخ: ${formatDate(now)}
⏰ الوقت: ${formatTime(now)}
🕐 الطابع الزمني: ${now.getTime()}
`;
    await socket.sendMessage(ctx.jid, { text: message });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر معلومات المستخدم
// ═══════════════════════════════════════════════════════════════

const profileCommand: Command = {
  name: 'بروفايل',
  aliases: ['profile', 'انا'],
  description: 'عرض معلومات حسابك',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    const number = getPhoneNumber(ctx.sender);
    const name = ctx.pushName || ctx.senderName || 'غير معروف';
    
    const profile = `
👤 معلومات الحساب

📛 الاسم: ${name}
📱 الرقم: ${number}
🆔 JID: ${ctx.sender}
📍 الموقع: ${ctx.isGroup ? 'مجموعة' : 'محادثة خاصة'}
${ctx.isGroup ? `👥 المجموعة: ${ctx.groupMetadata?.subject || 'غير معروف'}` : ''}
`;

    await socket.sendMessage(ctx.jid, { text: profile });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر المالك
// ═══════════════════════════════════════════════════════════════

const ownerCommand: Command = {
  name: 'owner',
  aliases: ['مالك', 'المطور'],
  description: 'معلومات المالك',
  category: CommandCategory.GENERAL,
  execute: async (ctx, socket) => {
    const ownerInfo = `
╭═══════════════════════════════╗
║ 👑 معلومات المالك
╰═══════════════════════════════╝

🤖 البوت: ${config.name}
📱 التواصل: wa.me/${config.ownerNumber}
📧 للشكاوى والاقتراحات

شكراً لاستخدامك البوت! 💜
`;
    await socket.sendMessage(ctx.jid, { text: ownerInfo });
  }
};

// ═══════════════════════════════════════════════════════════════
// تصدير الأوامر
// ═══════════════════════════════════════════════════════════════

export const generalCommands: Command[] = [
  menuCommand,
  helpCommand,
  infoCommand,
  pingCommand,
  dateCommand,
  profileCommand,
  ownerCommand
];

export default generalCommands;
