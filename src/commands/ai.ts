/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - أوامر الذكاء الاصطناعي
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory } from '../types';
import { config } from '../config';
import { log } from '../utils/logger';
import { getGroup } from '../database';
import ZAI from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════════════════════════
// إعداد الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ═══════════════════════════════════════════════════════════════
// ذاكرة المحادثة
// ═══════════════════════════════════════════════════════════════

const conversationMemory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

function addToMemory(jid: string, role: 'user' | 'assistant', content: string) {
  if (!conversationMemory.has(jid)) {
    conversationMemory.set(jid, []);
  }
  
  const memory = conversationMemory.get(jid)!;
  memory.push({ role, content });
  
  // الاحتفاظ بآخر 10 رسائل فقط
  if (memory.length > 10) {
    memory.shift();
  }
}

function getMemory(jid: string) {
  return conversationMemory.get(jid) || [];
}

function clearMemory(jid: string) {
  conversationMemory.delete(jid);
}

// ═══════════════════════════════════════════════════════════════
// أمر المحادثة مع الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════

const aiCommand: Command = {
  name: 'ai',
  aliases: ['ذكاء', 'سؤال', 'ask', 'تحدث'],
  description: 'تحدث مع الذكاء الاصطناعي',
  category: CommandCategory.AI,
  usage: '<السؤال أو الرسالة>',
  cooldown: 3,
  execute: async (ctx, socket) => {
    if (!config.ai.enabled) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ الذكاء الاصطناعي غير مفعل' });
      return;
    }

    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { 
        text: `🤖 مرحباً! أنا ${config.name}، مساعدتك الذكية.\n\nاسألني أي سؤال وسأجيبك!\n\nمثال: ${config.prefix}ai ما هي عاصمة السعودية؟` 
      });
      return;
    }

    const question = ctx.args.join(' ');
    
    // إظهار حالة الكتابة
    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await getAI();
      const memory = getMemory(ctx.sender);
      
      const messages = [
        { role: 'system' as const, content: config.ai.systemPrompt },
        ...memory,
        { role: 'user' as const, content: question }
      ];

      const completion = await zai.chat.completions.create({
        messages,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature
      });

      const response = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من توليد رد';

      // حفظ في الذاكرة
      addToMemory(ctx.sender, 'user', question);
      addToMemory(ctx.sender, 'assistant', response);

      await socket.sendMessage(ctx.jid, { text: `🤖 ${response}` });
    } catch (error) {
      log.error('AI', 'خطأ في الاستجابة', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء معالجة طلبك' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر مسح ذاكرة المحادثة
// ═══════════════════════════════════════════════════════════════

const clearMemoryCommand: Command = {
  name: 'مسح_ذاكرة',
  aliases: ['forget', 'نسيان', 'newchat'],
  description: 'بدء محادثة جديدة مع الذكاء الاصطناعي',
  category: CommandCategory.AI,
  execute: async (ctx, socket) => {
    clearMemory(ctx.sender);
    await socket.sendMessage(ctx.jid, { 
      text: '🧠 تم مسح ذاكرة المحادثة السابقة. يمكنك بدء محادثة جديدة!' 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر الترجمة
// ═══════════════════════════════════════════════════════════════

const translateCommand: Command = {
  name: 'ترجمة',
  aliases: ['translate', 'tr'],
  description: 'ترجمة نص إلى لغة أخرى',
  category: CommandCategory.AI,
  usage: '<اللغة> <النص>',
  minArgs: 2,
  cooldown: 3,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length < 2) {
      await socket.sendMessage(ctx.jid, { 
        text: `⚠️ الاستخدام: ${config.prefix}ترجمة <اللغة> <النص>\n\nمثال: ${config.prefix}ترجمة english مرحبا بالعالم` 
      });
      return;
    }

    const targetLang = ctx.args[0];
    const text = ctx.args.slice(1).join(' ');

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await getAI();
      
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `أنت مترجم محترف. قم بترجمة النص المقدم إلى اللغة ${targetLang}. أعد الترجمة فقط بدون أي شرح أو تعليق.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000
      });

      const translation = completion.choices[0]?.message?.content || 'فشلت الترجمة';

      await socket.sendMessage(ctx.jid, { 
        text: `🌐 الترجمة إلى ${targetLang}:\n\n${translation}` 
      });
    } catch (error) {
      log.error('AI', 'خطأ في الترجمة', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء الترجمة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر التلخيص
// ═══════════════════════════════════════════════════════════════

const summarizeCommand: Command = {
  name: 'تلخيص',
  aliases: ['summary', 'summarize', 'ملخص'],
  description: 'تلخيص نص طويل',
  category: CommandCategory.AI,
  usage: '<النص>',
  minArgs: 1,
  cooldown: 5,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { 
        text: `⚠️ يرجى كتابة النص الذي تريد تلخيصه\n\nمثال: ${config.prefix}تلخيص [النص الطويل]` 
      });
      return;
    }

    const text = ctx.args.join(' ');

    if (text.length < 100) {
      await socket.sendMessage(ctx.jid, { text: '⚠️ النص قصير جداً ولا يحتاج لتلخيص' });
      return;
    }

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await getAI();
      
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد متخصص في تلخيص النصوص. قم بتلخيص النص المقدم بشكل موجز وواضح مع الحفاظ على النقاط الرئيسية. التلخيص يجب أن يكون باللغة العربية.'
          },
          {
            role: 'user',
            content: `قم بتلخيص هذا النص:\n\n${text}`
          }
        ],
        max_tokens: 500
      });

      const summary = completion.choices[0]?.message?.content || 'فشل التلخيص';

      await socket.sendMessage(ctx.jid, { 
        text: `📝 ملخص النص:\n\n${summary}\n\n📊 الطول الأصلي: ${text.length} حرف` 
      });
    } catch (error) {
      log.error('AI', 'خطأ في التلخيص', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء التلخيص' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تصحيح القواعد
// ═══════════════════════════════════════════════════════════════

const grammarCommand: Command = {
  name: 'تصحيح',
  aliases: ['grammar', 'correct', 'صحح'],
  description: 'تصحيح الأخطاء الإملائية والنحوية',
  category: CommandCategory.AI,
  usage: '<النص>',
  minArgs: 1,
  cooldown: 3,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { 
        text: `⚠️ يرجى كتابة النص الذي تريد تصحيحه` 
      });
      return;
    }

    const text = ctx.args.join(' ');

    await socket.sendPresenceUpdate('composing', ctx.jid);

    try {
      const zai = await getAI();
      
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'أنت مدقق لغوي متخصص في اللغة العربية. قم بتصحيح الأخطاء الإملائية والنحوية في النص المقدم. أعد النص المصحح فقط مع ذكر التصحيحات إن وجدت.'
          },
          {
            role: 'user',
            content: `صحح هذا النص:\n\n${text}`
          }
        ],
        max_tokens: 500
      });

      const corrected = completion.choices[0]?.message?.content || 'فشل التصحيح';

      await socket.sendMessage(ctx.jid, { 
        text: `✏️ النص المصحح:\n\n${corrected}` 
      });
    } catch (error) {
      log.error('AI', 'خطأ في التصحيح', error as Error);
      await socket.sendMessage(ctx.jid, { text: '❌ حدث خطأ أثناء التصحيح' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر تفعيل/إيقاف الذكاء الاصطناعي في المجموعة
// ═══════════════════════════════════════════════════════════════

const toggleAICommand: Command = {
  name: 'ai-toggle',
  aliases: ['تفعيل_ذكاء', 'ai-on', 'ai-off'],
  description: 'تفعيل/إيقاف الذكاء الاصطناعي في المجموعة',
  category: CommandCategory.AI,
  groupOnly: true,
  adminOnly: true,
  execute: async (ctx, socket) => {
    const group = await getGroup(ctx.jid);
    const currentStatus = group?.settings?.aiEnabled ?? true;
    const newStatus = !currentStatus;
    
    // تحديث إعدادات المجموعة
    const { setGroupSetting } = await import('../database');
    await setGroupSetting(ctx.jid, 'aiEnabled', newStatus);
    
    await socket.sendMessage(ctx.jid, { 
      text: `🤖 الذكاء الاصطناعي: ${newStatus ? '✅ مفعّل' : '❌ معطّل'}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// تصدير الأوامر
// ═══════════════════════════════════════════════════════════════

export const aiCommands: Command[] = [
  aiCommand,
  clearMemoryCommand,
  translateCommand,
  summarizeCommand,
  grammarCommand,
  toggleAICommand
];

export default aiCommands;
