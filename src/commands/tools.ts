/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - أوامر الأدوات
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory } from '../types';
import { config } from '../config';
import { log } from '../utils/logger';
import { formatDate, formatTime, truncate } from '../utils/helpers';
import ZAI from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════════════════════════
// أمر البحث في الويب
// ═══════════════════════════════════════════════════════════════

const searchCommand: Command = {
  name: 'بحث',
  aliases: ['search', 'google'],
  description: 'البحث في الإنترنت',
  category: CommandCategory.TOOLS,
  usage: '<كلمات البحث>',
  minArgs: 1,
  cooldown: 5,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { 
        text: `⚠️ يرجى كتابة كلمات البحث\n\nمثال: ${config.prefix}بحث عاصمة السعودية` 
      });
      return;
    }

    const query = ctx.args.join(' ');

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await ZAI.create();
      const results = await zai.functions.invoke('web_search', {
        query,
        num: 5
      });

      if (!results || results.length === 0) {
        await socket.sendMessage(ctx.jid, { text: '❌ لم يتم العثور على نتائج' });
        return;
      }

      let message = `🔍 نتائج البحث عن: "${query}"\n\n`;

      results.forEach((result: any, index: number) => {
        message += `${index + 1}. ${result.name}\n`;
        message += `   📝 ${truncate(result.snippet, 100)}\n`;
        message += `   🔗 ${result.url}\n\n`;
      });

      await socket.sendMessage(ctx.jid, { text: message });
    } catch (error) {
      log.error('البحث', 'خطأ في البحث', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء البحث' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر قراءة صفحة ويب
// ═══════════════════════════════════════════════════════════════

const readUrlCommand: Command = {
  name: 'قراءة',
  aliases: ['read', 'url', 'صفحة'],
  description: 'قراءة محتوى صفحة ويب',
  category: CommandCategory.TOOLS,
  usage: '<الرابط>',
  minArgs: 1,
  cooldown: 5,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة رابط الصفحة' });
      return;
    }

    const url = ctx.args[0];

    if (!url.startsWith('http')) {
      await socket.sendMessage(ctx.jid, { text: '❌ الرابط غير صالح' });
      return;
    }

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await ZAI.create();
      const result = await zai.functions.invoke('page_reader', { url });

      const title = result.data?.title || 'بدون عنوان';
      const content = result.data?.text || result.data?.html || '';

      // تنظيف المحتوى
      const cleanContent = content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000);

      const message = `📄 ${title}\n🔗 ${url}\n\n${cleanContent}${content.length > 2000 ? '...' : ''}`;

      await socket.sendMessage(ctx.jid, { text: message });
    } catch (error) {
      log.error('قراءة', 'خطأ في قراءة الصفحة', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء قراءة الصفحة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر جلب صورة
// ═══════════════════════════════════════════════════════════════

const imageCommand: Command = {
  name: 'صورة',
  aliases: ['image', 'img', 'صور'],
  description: 'إنشاء أو البحث عن صورة',
  category: CommandCategory.TOOLS,
  usage: '<الوصف>',
  minArgs: 1,
  cooldown: 10,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة وصف الصورة' });
      return;
    }

    const prompt = ctx.args.join(' ');

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await ZAI.create();
      const result = await zai.images.generations.create({
        prompt,
        size: '1024x1024'
      });

      if (result.data && result.data[0]?.base64) {
        const buffer = Buffer.from(result.data[0].base64, 'base64');
        
        await socket.sendMessage(ctx.jid, {
          image: buffer,
          caption: `🖼️ صورة: ${prompt}`
        });
      } else {
        await socket.sendMessage(ctx.jid, { text: '❌ فشل في إنشاء الصورة' });
      }
    } catch (error) {
      log.error('صورة', 'خطأ في إنشاء الصورة', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء إنشاء الصورة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر الآلة الحاسبة
// ═══════════════════════════════════════════════════════════════

const calcCommand: Command = {
  name: 'حاسبة',
  aliases: ['calc', 'calculate', 'احسب'],
  description: 'آلة حاسبة للعمليات الحسابية',
  category: CommandCategory.UTILITY,
  usage: '<عملية حسابية>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { 
        text: `🔢 الآلة الحاسبة\n\nالاستخدام: ${config.prefix}حاسبة 2 + 2\n\nالعمليات المتاحة:\n+ جمع\n- طرح\n* ضرب\n/ قسمة\n** أس` 
      });
      return;
    }

    const expression = ctx.args.join(' ').replace(/[^0-9+\-*/.() ]/g, '');

    try {
      // حساب آمن
      const result = Function(`"use strict"; return (${expression})`)();
      
      await socket.sendMessage(ctx.jid, { 
        text: `🔢 الآلة الحاسبة\n\n📝 العملية: ${expression}\n✅ النتيجة: ${result}` 
      });
    } catch {
      await socket.sendMessage(ctx.jid, { text: '❌ خطأ في العملية الحسابية' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر الطقس
// ═══════════════════════════════════════════════════════════════

const weatherCommand: Command = {
  name: 'طقس',
  aliases: ['weather', 'جو'],
  description: 'عرض حالة الطقس لمدينة',
  category: CommandCategory.TOOLS,
  usage: '<اسم المدينة>',
  minArgs: 1,
  cooldown: 5,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ يرجى كتابة اسم المدينة' });
      return;
    }

    const city = ctx.args.join(' ');

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await ZAI.create();
      const results = await zai.functions.invoke('web_search', {
        query: `طقس ${city} اليوم`,
        num: 3
      });

      if (results && results.length > 0) {
        let weatherInfo = `🌤️ حالة الطقس في ${city}\n\n`;
        
        results.forEach((result: any) => {
          weatherInfo += `📰 ${result.name}\n`;
          weatherInfo += `${result.snippet}\n\n`;
        });

        await socket.sendMessage(ctx.jid, { text: weatherInfo });
      } else {
        await socket.sendMessage(ctx.jid, { text: '❌ لم يتم العثور على معلومات الطقس' });
      }
    } catch (error) {
      log.error('طقس', 'خطأ في جلب الطقس', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء جلب معلومات الطقس' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تحويل العملات
// ═══════════════════════════════════════════════════════════════

const currencyCommand: Command = {
  name: 'عملة',
  aliases: ['currency', 'تحويل'],
  description: 'تحويل بين العملات',
  category: CommandCategory.UTILITY,
  usage: '<المبلغ> <من> <إلى>',
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length < 3) {
      await socket.sendMessage(ctx.jid, { 
        text: `💱 تحويل العملات\n\nالاستخدام: ${config.prefix}عملة 100 USD SAR\n\nالعملات الشائعة:\nUSD - دولار أمريكي\nSAR - ريال سعودي\nAED - درهم إماراتي\nEGP - جنيه مصري\nEUR - يورو` 
      });
      return;
    }

    const amount = parseFloat(ctx.args[0]);
    const from = ctx.args[1].toUpperCase();
    const to = ctx.args[2].toUpperCase();

    if (isNaN(amount)) {
      await socket.sendMessage(ctx.jid, { text: '❌ المبلغ غير صالح' });
      return;
    }

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await ZAI.create();
      const results = await zai.functions.invoke('web_search', {
        query: `${amount} ${from} to ${to} exchange rate today`,
        num: 1
      });

      if (results && results.length > 0) {
        // استخراج سعر التحويل من النتائج
        const info = results[0].snippet;
        
        await socket.sendMessage(ctx.jid, { 
          text: `💱 تحويل العملات\n\n💰 ${amount} ${from} إلى ${to}\n\n📰 معلومات:\n${info}` 
        });
      } else {
        await socket.sendMessage(ctx.jid, { text: '❌ لم يتم العثور على سعر التحويل' });
      }
    } catch (error) {
      log.error('عملة', 'خطأ في تحويل العملة', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء التحويل' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// تصدير الأوامر
// ═══════════════════════════════════════════════════════════════

export const toolsCommands: Command[] = [
  searchCommand,
  readUrlCommand,
  imageCommand,
  calcCommand,
  weatherCommand,
  currencyCommand
];

export default toolsCommands;
