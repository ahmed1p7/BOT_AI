/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - نظام الإعدادات
 * ═══════════════════════════════════════════════════════════════
 */

import dotenv from 'dotenv';
import { BotConfig, AIConfig, WelcomeConfig, AntiConfig } from '../types';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ═══════════════════════════════════════════════════════════════
// إعدادات الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════

const aiConfig: AIConfig = {
  enabled: process.env.AI_ENABLED === 'true',
  model: process.env.AI_MODEL || 'gpt-4',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '500'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  systemPrompt: `أنتِ Fᴀᴛɪᴍᴀ، بوت واتساب ذكية ومساعدة.
تتميزين بالآتي:
- تتحدثين بالعربية بطريقة ودية ومحترمة
- تساعدين المستخدمين في مختلف المهام
- تجيبين على الأسئلة بشكل واضح ومفيد
- تستخدمين الإيموجي بشكل مناسب
- قادرة على فهم السياق والحفاظ على المحادثة

قواعد مهمة:
- لا تقدمي معلومات ضارة أو غير لائقة
- لا تشاركي معلومات شخصية
- كوني مختصرة ومفيدة
- استخدمي الإيموجي باعتدال`
};

// ═══════════════════════════════════════════════════════════════
// إعدادات الترحيب
// ═══════════════════════════════════════════════════════════════

const welcomeConfig: WelcomeConfig = {
  enabled: process.env.WELCOME_ENABLED === 'true',
  message: process.env.WELCOME_MESSAGE || 'مرحباً بك @user في مجموعة @group! 🎉',
  goodbyeEnabled: process.env.GOODBYE_ENABLED === 'true',
  goodbyeMessage: process.env.GOODBYE_MESSAGE || 'وداعاً @user، نتمنى لك التوفيق! 👋'
};

// ═══════════════════════════════════════════════════════════════
// إعدادات الحماية
// ═══════════════════════════════════════════════════════════════

const antiConfig: AntiConfig = {
  link: process.env.ANTI_LINK === 'true',
  spam: process.env.ANTI_SPAM === 'true',
  delete: process.env.ANTI_DELETE === 'true'
};

// ═══════════════════════════════════════════════════════════════
// الإعدادات الرئيسية
// ═══════════════════════════════════════════════════════════════

export const config: BotConfig = {
  name: process.env.BOT_NAME || 'Fᴀᴛɪᴍᴀ',
  prefix: process.env.BOT_PREFIX || '.',
  version: process.env.BOT_VERSION || '1.0.0',
  language: process.env.BOT_LANGUAGE || 'ar',
  ownerNumber: process.env.OWNER_NUMBER || '',
  additionalOwners: (process.env.ADDITIONAL_OWNERS || '').split(',').filter(Boolean),
  ai: aiConfig,
  rateLimit: parseInt(process.env.RATE_LIMIT || '10'),
  readMessages: process.env.READ_MESSAGES === 'true',
  typingIndicator: process.env.TYPING_INDICATOR === 'true',
  autoSaveSession: process.env.AUTO_SAVE_SESSION === 'true',
  welcome: welcomeConfig,
  anti: antiConfig
};

// ═══════════════════════════════════════════════════════════════
// مسارات الملفات
// ═══════════════════════════════════════════════════════════════

export const paths = {
  session: process.env.SESSION_PATH || './data/sessions',
  media: process.env.MEDIA_PATH || './data/media',
  logs: process.env.LOG_PATH || './logs'
};

// ═══════════════════════════════════════════════════════════════
// قاعدة البيانات
// ═══════════════════════════════════════════════════════════════

export const database = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fatima-bot'
};

// ═══════════════════════════════════════════════════════════════
// دالة فحص المالك
// ═══════════════════════════════════════════════════════════════

export function isOwner(jid: string): boolean {
  const number = jid.replace(/[@.sapa-]+/g, '').split(':')[0];
  const ownerNumber = config.ownerNumber.replace(/[@.sapa-]+/g, '');
  
  if (number === ownerNumber) return true;
  
  return config.additionalOwners.some(
    owner => number === owner.replace(/[@.sapa-]+/g, '')
  );
}

// ═══════════════════════════════════════════════════════════════
// رسائل النظام
// ═══════════════════════════════════════════════════════════════

export const messages = {
  ownerOnly: '⚠️ هذا الأمر مخصص للمالك فقط',
  adminOnly: '⚠️ هذا الأمر مخصص للمشرفين فقط',
  groupOnly: '⚠️ هذا الأمر يعمل في المجموعات فقط',
  privateOnly: '⚠️ هذا الأمر يعمل في المحادثات الخاصة فقط',
  botAdminRequired: '⚠️ البوت يجب أن يكون مشرفاً لتنفيذ هذا الأمر',
  banned: '🚫 تم حظرك من استخدام البوت',
  cooldown: '⏳ يرجى الانتظار قبل استخدام الأمر مجدداً',
  error: '❌ حدث خطأ أثناء تنفيذ الأمر',
  invalidArgs: '⚠️ استخدام غير صحيح للأمر',
  notFound: '❌ لم يتم العثور على النتيجة المطلوبة'
};

export default config;
