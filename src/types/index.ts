/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - تعريفات الأنواع
 * ═══════════════════════════════════════════════════════════════
 */

import { WAMessage, WASocket, Contact, GroupMetadata } from '@whiskeysockets/baileys';

// ═══════════════════════════════════════════════════════════════
// أنواع الرسائل
// ═══════════════════════════════════════════════════════════════

export interface MessageContext {
  jid: string;
  sender: string;
  senderName?: string;
  isGroup: boolean;
  groupMetadata?: GroupMetadata;
  message: WAMessage;
  messageText: string;
  command?: string;
  args?: string[];
  quotedMessage?: WAMessage;
  isOwner: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  pushName?: string;
}

// ═══════════════════════════════════════════════════════════════
// أنواع الأوامر
// ═══════════════════════════════════════════════════════════════

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  category: CommandCategory;
  usage?: string;
  examples?: string[];
  cooldown?: number;
  minArgs?: number;
  maxArgs?: number;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  botAdminRequired?: boolean;
  execute: (ctx: MessageContext, socket: WASocket) => Promise<void>;
}

export enum CommandCategory {
  GENERAL = 'عام',
  ADMIN = 'إدارة',
  GROUP = 'مجموعات',
  MEDIA = 'وسائط',
  AI = 'ذكاء اصطناعي',
  FUN = 'ترفيه',
  TOOLS = 'أدوات',
  OWNER = 'مالك',
  DOWNLOAD = 'تحميل',
  UTILITY = 'خدمات'
}

// ═══════════════════════════════════════════════════════════════
// أنواع الإعدادات
// ═══════════════════════════════════════════════════════════════

export interface BotConfig {
  name: string;
  prefix: string;
  version: string;
  language: string;
  ownerNumber: string;
  additionalOwners: string[];
  ai: AIConfig;
  rateLimit: number;
  readMessages: boolean;
  typingIndicator: boolean;
  autoSaveSession: boolean;
  welcome: WelcomeConfig;
  anti: AntiConfig;
}

export interface AIConfig {
  enabled: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export interface WelcomeConfig {
  enabled: boolean;
  message: string;
  goodbyeEnabled: boolean;
  goodbyeMessage: string;
}

export interface AntiConfig {
  link: boolean;
  spam: boolean;
  delete: boolean;
}

// ═══════════════════════════════════════════════════════════════
// أنواع قاعدة البيانات
// ═══════════════════════════════════════════════════════════════

export interface UserDB {
  _id?: string;
  jid: string;
  name?: string;
  pushName?: string;
  isBanned: boolean;
  banReason?: string;
  warnings: number;
  isPremium: boolean;
  premiumExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  commandsUsed: number;
  lastCommand?: Date;
}

export interface GroupDB {
  _id?: string;
  jid: string;
  name?: string;
  welcomeEnabled: boolean;
  welcomeMessage?: string;
  goodbyeEnabled: boolean;
  goodbyeMessage?: string;
  antiLink: boolean;
  antiSpam: boolean;
  antiDelete: boolean;
  muted: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings: GroupSettings;
}

export interface GroupSettings {
  aiEnabled: boolean;
  levelSystem: boolean;
  autoReply: boolean;
  customPrefix?: string;
}

// ═══════════════════════════════════════════════════════════════
// أنواع الإضافات
// ═══════════════════════════════════════════════════════════════

export interface Plugin {
  name: string;
  version: string;
  author: string;
  description: string;
  commands: Command[];
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  enabled: boolean;
}

// ═══════════════════════════════════════════════════════════════
// أنواع السجل
// ═══════════════════════════════════════════════════════════════

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

// ═══════════════════════════════════════════════════════════════
// أنواع الردود
// ═══════════════════════════════════════════════════════════════

export interface AutoReply {
  trigger: string | RegExp;
  response: string | ((ctx: MessageContext) => Promise<string>);
  caseSensitive?: boolean;
  exact?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// أنواع المجموعات
// ═══════════════════════════════════════════════════════════════

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin';
}

// ═══════════════════════════════════════════════════════════════
// أنواع التنزيل
// ═══════════════════════════════════════════════════════════════

export interface DownloadResult {
  success: boolean;
  title?: string;
  author?: string;
  thumbnail?: string;
  mediaUrl?: string;
  duration?: string;
  views?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// أنواع الرسوم المتحركة
// ═══════════════════════════════════════════════════════════════

export interface MenuCategory {
  emoji: string;
  name: string;
  description: string;
  commands: Command[];
}
