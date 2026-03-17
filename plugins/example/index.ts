/**
 * ═══════════════════════════════════════════════════════════════
 * 🎉 Example Plugin - إضافة مثال لـ Fᴀᴛɪᴍᴀ Bot
 * ═══════════════════════════════════════════════════════════════
 */

import { Plugin, Command, CommandCategory } from '../../src/types';
import { WASocket } from '@whiskeysockets/baileys';

// ═══════════════════════════════════════════════════════════════
// أوامر الإضافة
// ═══════════════════════════════════════════════════════════════

const helloCommand: Command = {
  name: 'مرحبا',
  aliases: ['hello', 'hi', 'اهلا'],
  description: 'تحية ترحيبية من الإضافة',
  category: CommandCategory.FUN,
  execute: async (ctx, socket: WASocket) => {
    const greetings = [
      'مرحباً بك! 🎉',
      'أهلاً وسهلاً! 👋',
      'نور المكان بوجودك! ✨',
      'هلا والله! 💜'
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    await socket.sendMessage(ctx.jid, { 
      text: `${randomGreeting}\n\n👤 ${ctx.pushName || 'صديقي'}` 
    });
  }
};

const timeCommand: Command = {
  name: 'الوقت',
  aliases: ['time', 'ساعة'],
  description: 'عرض الوقت الحالي',
  category: CommandCategory.UTILITY,
  execute: async (ctx, socket: WASocket) => {
    const now = new Date();
    const time = now.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const date = now.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    await socket.sendMessage(ctx.jid, { 
      text: `⏰ الوقت: ${time}\n📅 التاريخ: ${date}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// تعريف الإضافة
// ═══════════════════════════════════════════════════════════════

const examplePlugin: Plugin = {
  name: 'example',
  version: '1.0.0',
  author: 'Fᴀᴛɪᴍᴀ Team',
  description: 'إضافة مثال توضح كيفية إنشاء إضافات جديدة',
  commands: [helloCommand, timeCommand],
  enabled: true,
  
  onLoad: async () => {
    console.log('✅ تم تحميل إضافة المثال');
  },
  
  onUnload: async () => {
    console.log('📤 تم إلغاء تحميل إضافة المثال');
  }
};

export default examplePlugin;
