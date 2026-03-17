/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - نظام قاعدة البيانات
 * ═══════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';
import { database } from '../config';
import { log } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
// مخطط المستخدم
// ═══════════════════════════════════════════════════════════════

const UserSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  pushName: { type: String, default: '' },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  warnings: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date, default: null },
  commandsUsed: { type: Number, default: 0 },
  lastCommand: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ═══════════════════════════════════════════════════════════════
// مخطط المجموعة
// ═══════════════════════════════════════════════════════════════

const GroupSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  welcomeEnabled: { type: Boolean, default: true },
  welcomeMessage: { type: String, default: '' },
  goodbyeEnabled: { type: Boolean, default: true },
  goodbyeMessage: { type: String, default: '' },
  antiLink: { type: Boolean, default: false },
  antiSpam: { type: Boolean, default: false },
  antiDelete: { type: Boolean, default: false },
  muted: { type: Boolean, default: false },
  settings: {
    aiEnabled: { type: Boolean, default: true },
    levelSystem: { type: Boolean, default: false },
    autoReply: { type: Boolean, default: true },
    customPrefix: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ═══════════════════════════════════════════════════════════════
// مخطط الردود التلقائية
// ═══════════════════════════════════════════════════════════════

const AutoReplySchema = new mongoose.Schema({
  trigger: { type: String, required: true },
  response: { type: String, required: true },
  isRegex: { type: Boolean, default: false },
  caseSensitive: { type: Boolean, default: false },
  exact: { type: Boolean, default: false },
  groupOnly: { type: Boolean, default: false },
  privateOnly: { type: Boolean, default: false },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// ═══════════════════════════════════════════════════════════════
// مخطط الإعدادات العامة
// ═══════════════════════════════════════════════════════════════

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// ═══════════════════════════════════════════════════════════════
// إنشاء النماذج
// ═══════════════════════════════════════════════════════════════

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
export const AutoReply = mongoose.models.AutoReply || mongoose.model('AutoReply', AutoReplySchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// ═══════════════════════════════════════════════════════════════
// دوال قاعدة البيانات للمستخدمين
// ═══════════════════════════════════════════════════════════════

export async function getUser(jid: string) {
  return await User.findOne({ jid });
}

export async function createUser(jid: string, name?: string, pushName?: string) {
  const existing = await getUser(jid);
  if (existing) return existing;

  return await User.create({
    jid,
    name,
    pushName
  });
}

export async function updateUser(jid: string, data: Partial<typeof UserSchema>) {
  return await User.findOneAndUpdate(
    { jid },
    { ...data, updatedAt: new Date() },
    { new: true, upsert: true }
  );
}

export async function banUser(jid: string, reason: string = '') {
  return await updateUser(jid, { isBanned: true, banReason: reason });
}

export async function unbanUser(jid: string) {
  return await updateUser(jid, { isBanned: false, banReason: '' });
}

export async function addWarning(jid: string) {
  const user = await getUser(jid);
  if (!user) return null;

  return await updateUser(jid, { warnings: user.warnings + 1 });
}

export async function resetWarnings(jid: string) {
  return await updateUser(jid, { warnings: 0 });
}

export async function incrementCommandsUsed(jid: string) {
  return await User.findOneAndUpdate(
    { jid },
    { 
      $inc: { commandsUsed: 1 },
      lastCommand: new Date(),
      updatedAt: new Date()
    },
    { new: true, upsert: true }
  );
}

// ═══════════════════════════════════════════════════════════════
// دوال قاعدة البيانات للمجموعات
// ═══════════════════════════════════════════════════════════════

export async function getGroup(jid: string) {
  return await Group.findOne({ jid });
}

export async function createGroup(jid: string, name?: string) {
  const existing = await getGroup(jid);
  if (existing) return existing;

  return await Group.create({ jid, name });
}

export async function updateGroup(jid: string, data: Partial<typeof GroupSchema>) {
  return await Group.findOneAndUpdate(
    { jid },
    { ...data, updatedAt: new Date() },
    { new: true, upsert: true }
  );
}

export async function setGroupSetting(jid: string, setting: string, value: any) {
  return await Group.findOneAndUpdate(
    { jid },
    { 
      [`settings.${setting}`]: value,
      updatedAt: new Date()
    },
    { new: true, upsert: true }
  );
}

// ═══════════════════════════════════════════════════════════════
// دوال الردود التلقائية
// ═══════════════════════════════════════════════════════════════

export async function getAutoReplies() {
  return await AutoReply.find({});
}

export async function addAutoReply(data: {
  trigger: string;
  response: string;
  isRegex?: boolean;
  caseSensitive?: boolean;
  exact?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  createdBy?: string;
}) {
  return await AutoReply.create(data);
}

export async function removeAutoReply(trigger: string) {
  return await AutoReply.findOneAndDelete({ trigger });
}

// ═══════════════════════════════════════════════════════════════
// دوال الإعدادات العامة
// ═══════════════════════════════════════════════════════════════

export async function getSetting(key: string) {
  const setting = await Settings.findOne({ key });
  return setting?.value;
}

export async function setSetting(key: string, value: any) {
  return await Settings.findOneAndUpdate(
    { key },
    { value, updatedAt: new Date() },
    { new: true, upsert: true }
  );
}

// ═══════════════════════════════════════════════════════════════
// الاتصال بقاعدة البيانات
// ═══════════════════════════════════════════════════════════════

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(database.uri);
    log.success('قاعدة البيانات', 'تم الاتصال بقاعدة البيانات بنجاح');
  } catch (error) {
    log.error('قاعدة البيانات', 'فشل الاتصال بقاعدة البيانات', error as Error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    log.info('قاعدة البيانات', 'تم قطع الاتصال بقاعدة البيانات');
  } catch (error) {
    log.error('قاعدة البيانات', 'فشل قطع الاتصال بقاعدة البيانات', error as Error);
  }
}

export default {
  User,
  Group,
  AutoReply,
  Settings,
  getUser,
  createUser,
  updateUser,
  banUser,
  unbanUser,
  addWarning,
  resetWarnings,
  incrementCommandsUsed,
  getGroup,
  createGroup,
  updateGroup,
  setGroupSetting,
  getAutoReplies,
  addAutoReply,
  removeAutoReply,
  getSetting,
  setSetting,
  connectDatabase,
  disconnectDatabase
};
