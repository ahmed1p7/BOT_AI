/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - أوامر الترفيه
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory } from '../types';
import { config } from '../config';
import { randomChoice, randomNumber, createMention, getPhoneNumber } from '../utils/helpers';

// ═══════════════════════════════════════════════════════════════
// الألعاب والترفيه
// ═══════════════════════════════════════════════════════════════

// ألعاب القمار
const games = new Map<string, { game: string; data: any }>();

// ═══════════════════════════════════════════════════════════════
// أمر الصرافة (عملة)
// ═══════════════════════════════════════════════════════════════

const coinflipCommand: Command = {
  name: 'عملة',
  aliases: ['coin', 'coinflip', 'نقود'],
  description: 'رمي عملة وعرض النتيجة',
  category: CommandCategory.FUN,
  execute: async (ctx, socket) => {
    const result = Math.random() < 0.5 ? '🪙 كتابة' : '🪙 صورة';
    await socket.sendMessage(ctx.jid, { 
      text: `🎲 رميت العملة...\n\n${result}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر النرد
// ═══════════════════════════════════════════════════════════════

const diceCommand: Command = {
  name: 'نرد',
  aliases: ['dice', 'زر', 'زهر'],
  description: 'رمي النرد',
  category: CommandCategory.FUN,
  execute: async (ctx, socket) => {
    const dice1 = randomNumber(1, 6);
    const dice2 = randomNumber(1, 6);
    
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    await socket.sendMessage(ctx.jid, { 
      text: `🎲 رميت النرد...\n\n${diceEmojis[dice1 - 1]} ${diceEmojis[dice2 - 1]}\n\nالنتيجة: ${dice1} + ${dice2} = ${dice1 + dice2}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر اختيار عشوائي
// ═══════════════════════════════════════════════════════════════

const pickCommand: Command = {
  name: 'اختيار',
  aliases: ['pick', 'choose', 'اختر'],
  description: 'اختيار عشوائي من خيارات',
  category: CommandCategory.FUN,
  usage: '<خيار1> | <خيار2> | ...',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { 
        text: `⚠️ الاستخدام: ${config.prefix}اختيار خيار1 | خيار2 | خيار3` 
      });
      return;
    }

    const text = ctx.args.join(' ');
    const choices = text.split('|').map(c => c.trim()).filter(c => c);

    if (choices.length < 2) {
      await socket.sendMessage(ctx.jid, { 
        text: '⚠️ يرجى تقديم خيارين على الأقل مفصولين بـ |' 
      });
      return;
    }

    const selected = randomChoice(choices);
    await socket.sendMessage(ctx.jid, { 
      text: `🤔 الخيارات: ${choices.join('، ')}\n\n✨ الاختيار: ${selected}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر حساب الحب
// ═══════════════════════════════════════════════════════════════

const loveCommand: Command = {
  name: 'حب',
  aliases: ['love', 'محبة'],
  description: 'حساب نسبة الحب بين شخصين',
  category: CommandCategory.FUN,
  execute: async (ctx, socket) => {
    const mentions = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (mentions.length < 2 && (!ctx.args || ctx.args.length < 2)) {
      await socket.sendMessage(ctx.jid, { 
        text: `💕 حساب نسبة الحب\n\nالاستخدام: ${config.prefix}حب @شخص1 @شخص2\nأو: ${config.prefix}حب أحمد سارة` 
      });
      return;
    }

    let person1: string, person2: string;

    if (mentions.length >= 2) {
      person1 = getPhoneNumber(mentions[0]);
      person2 = getPhoneNumber(mentions[1]);
    } else {
      person1 = ctx.args![0];
      person2 = ctx.args![1];
    }

    // حساب "عشوائي" ثابت بناءً على الأسماء
    const hash = (person1 + person2).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const percentage = (hash % 100) + 1;

    const hearts = percentage > 80 ? '💕💕💕' : percentage > 50 ? '💕💕' : '💕';
    const message = percentage > 80 
      ? 'حب حقيقي! 💍' 
      : percentage > 50 
      ? 'هناك أمل! 💪' 
      : 'صعب... لكن مستحيل لا شيء! 😅';

    await socket.sendMessage(ctx.jid, { 
      text: `💕 حساب الحب\n\n👤 ${person1}\n❤️ ${percentage}%\n👤 ${person2}\n\n${hearts}\n${message}`,
      mentions
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر الصفة العشوائية
// ═══════════════════════════════════════════════════════════════

const characterCommand: Command = {
  name: 'صفة',
  aliases: ['character', 'شخصية'],
  description: 'صفة عشوائية لشخص',
  category: CommandCategory.FUN,
  execute: async (ctx, socket) => {
    const mentions = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions.length > 0 ? mentions[0] : ctx.sender;
    const targetName = mentions.length > 0 ? createMention(target) : 'أنت';

    const traits = [
      'ذكي جداً 🧠',
      'طيب القلب 💖',
      'شجاع 🦁',
      'مرح 😄',
      'غامض 🌙',
      'رومانسي 💕',
      'طموح 🚀',
      'صادق ✨',
      'مبدع 🎨',
      'قائد موالود 👑',
      'صبور 🧘',
      'عاطفي 💭',
      'قوي 💪',
      'لطيف 🌸',
      'سريع البديهة ⚡'
    ];

    const trait = randomChoice(traits);
    
    await socket.sendMessage(ctx.jid, { 
      text: `✨ صفة ${targetName}:\n\n${trait}`,
      mentions: [target]
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر السؤال والجواب
// ═══════════════════════════════════════════════════════════════

const eightBallCommand: Command = {
  name: 'سؤال',
  aliases: ['8ball', 'askme', 'اسأل'],
  description: 'اسأل سؤال واحصل على إجابة عشوائية',
  category: CommandCategory.FUN,
  usage: '<السؤال>',
  minArgs: 1,
  execute: async (ctx, socket) => {
    if (!ctx.args || ctx.args.length === 0) {
      await socket.sendMessage(ctx.jid, { text: '🎱 اسأل سؤالاً!' });
      return;
    }

    const responses = [
      'نعم، بالتأكيد! ✅',
      'لا أعتقد ذلك ❌',
      'ربما... 🤔',
      'من المؤكد! 💯',
      'لا تعد على ذلك ❗',
      'اسأل لاحقاً 🕐',
      'الآفاق ليست جيدة 😕',
      'نعم! ✨',
      'لا! 🙅',
      'تركز واسأل مجدداً 🔮',
      'النتيجة غير مؤكدة 🎲',
      'كل المؤشرات تقول نعم 👍'
    ];

    const response = randomChoice(responses);
    const question = ctx.args.join(' ');

    await socket.sendMessage(ctx.jid, { 
      text: `🎱 السؤال: ${question}\n\n🔮 الإجابة: ${response}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر النكتة
// ═══════════════════════════════════════════════════════════════

const jokeCommand: Command = {
  name: 'نكتة',
  aliases: ['joke', 'ضحك'],
  description: 'نكتة عشوائية',
  category: CommandCategory.FUN,
  execute: async (ctx, socket) => {
    const jokes = [
      'ليش الحمار يحب الجزر؟ 🥕\nلأن ما يعرف يأكل بحر! 🌊',
      'مدرس سأل طالب: كم يساوي 2×2؟\nالطالب: 4\nالمدرس: صح!\nالطالب: الحمد لله طلعت ذكي! 😂',
      'شو اسم دب在没有 أسنان؟ 🦷\nدب.removeAllTeeth() 💻',
      'مرة واحد راح يشتري بيضة\nقال للبائع: هذي بيضة؟\nقال: لا، هذي طايرة! 🐔',
      'ليش الفيل مختبئ في الشوكولاتة؟ 🍫\nلأن ما حد يشوفه! 🐘',
      'واحد سأل صاحبه: عندك بطارية؟\nقال: آسف، أنا شاحن! 🔋',
      'شو الفرق بين الذكي والكسلان؟\nالذكي يفكر قبل ما يعمل، والكسلان ما يعمل أصلاً! 😴'
    ];

    const joke = randomChoice(jokes);
    await socket.sendMessage(ctx.jid, { text: `😂 نكتة:\n\n${joke}` });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر اقتباس
// ═══════════════════════════════════════════════════════════════

const quoteCommand: Command = {
  name: 'اقتباس',
  aliases: ['quote', 'حكمة'],
  description: 'اقتباس أو حكمة عشوائية',
  category: CommandCategory.FUN,
  execute: async (ctx, socket) => {
    const quotes = [
      { text: 'النجاح ليس نهائياً، والفشل ليس قاتلاً.', author: 'ونستون تشرشل' },
      { text: 'كن أنت التغيير الذي تريد أن تراه في العالم.', author: 'المهاتما غاندي' },
      { text: 'الطريقة الوحيدة للقيام بعمل عظيم هي أن تحب ما تفعله.', author: 'ستيف جوبز' },
      { text: 'لا تخف من الفشل، بل خف من عدم المحاولة.', author: 'روي بينيت' },
      { text: 'الصبر مفتاح الفرج.', author: 'حكمة عربية' },
      { text: 'العلم نور والجهل ظلام.', author: 'حكمة عربية' },
      { text: 'من جد وجد ومن زرع حصد.', author: 'مثل عربي' },
      { text: 'العقل السليم في الجسم السليم.', author: 'مثل عربي' },
      { text: 'الحياة إما مغامرة جريئة أو لا شيء.', author: 'هيلين كيلر' },
      { text: 'لا يهم كم تسير ببطء طالما أنك لا تتوقف.', author: 'كونفوشيوس' }
    ];

    const quote = randomChoice(quotes);
    await socket.sendMessage(ctx.jid, { 
      text: `💭 اقتباس:\n\n"${quote.text}"\n\n— ${quote.author}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// أمر حجر ورقة مقص
// ═══════════════════════════════════════════════════════════════

const rpsCommand: Command = {
  name: 'حجر',
  aliases: ['rps', 'ورقة', 'مقص'],
  description: 'لعبة حجر ورقة مقص',
  category: CommandCategory.FUN,
  usage: '<حجر/ورقة/مقص>',
  execute: async (ctx, socket) => {
    const choices = ['حجر', 'ورقة', 'مقص'];
    const emojis = { 'حجر': '🪨', 'ورقة': '📄', 'مقص': '✂️' };

    const userChoice = ctx.args?.[0]?.toLowerCase();
    let normalizedChoice: string | undefined;

    if (userChoice === 'حجر' || userChoice === 'rock' || userChoice === 'r') normalizedChoice = 'حجر';
    if (userChoice === 'ورقة' || userChoice === 'paper' || userChoice === 'p') normalizedChoice = 'ورقة';
    if (userChoice === 'مقص' || userChoice === 'scissors' || userChoice === 's') normalizedChoice = 'مقص';

    if (!normalizedChoice) {
      await socket.sendMessage(ctx.jid, { 
        text: `🪨📄✂️ حجر ورقة مقص\n\nالاستخدام: ${config.prefix}حجر <حجر/ورقة/مقص>` 
      });
      return;
    }

    const botChoice = randomChoice(choices);
    let result: string;

    if (normalizedChoice === botChoice) {
      result = '🤝 تعادل!';
    } else if (
      (normalizedChoice === 'حجر' && botChoice === 'مقص') ||
      (normalizedChoice === 'ورقة' && botChoice === 'حجر') ||
      (normalizedChoice === 'مقص' && botChoice === 'ورقة')
    ) {
      result = '🎉 فزت!';
    } else {
      result = '😢 خسرت!';
    }

    await socket.sendMessage(ctx.jid, { 
      text: `🪨📄✂️ حجر ورقة مقص\n\n👤 أنت: ${emojis[normalizedChoice as keyof typeof emojis]} ${normalizedChoice}\n🤖 البوت: ${emojis[botChoice as keyof typeof emojis]} ${botChoice}\n\n${result}` 
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// تصدير الأوامر
// ═══════════════════════════════════════════════════════════════

export const funCommands: Command[] = [
  coinflipCommand,
  diceCommand,
  pickCommand,
  loveCommand,
  characterCommand,
  eightBallCommand,
  jokeCommand,
  quoteCommand,
  rpsCommand
];

export default funCommands;
