/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - نظام تسجيل الأوامر
 * ═══════════════════════════════════════════════════════════════
 */

import { Command, CommandCategory, MessageContext } from '../types';
import { WASocket } from '@whiskeysockets/baileys';
import { messages, config } from '../config';
import { log } from '../utils/logger';
import NodeCache from 'node-cache';

// ═══════════════════════════════════════════════════════════════
// تخزين الأوامر
// ═══════════════════════════════════════════════════════════════

const commands = new Map<string, Command>();
const aliases = new Map<string, string>();
const cooldowns = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// ═══════════════════════════════════════════════════════════════
// تسجيل أمر جديد
// ═══════════════════════════════════════════════════════════════

export function registerCommand(command: Command): void {
  // تسجيل الأمر الأساسي
  commands.set(command.name.toLowerCase(), command);
  
  // تسجيل الأسماء المستعارة
  if (command.aliases && command.aliases.length > 0) {
    command.aliases.forEach(alias => {
      aliases.set(alias.toLowerCase(), command.name.toLowerCase());
    });
  }

  log.debug('الأوامر', `تم تسجيل الأمر: ${command.name}`);
}

// ═══════════════════════════════════════════════════════════════
// تسجيل مجموعة أوامر
// ═══════════════════════════════════════════════════════════════

export function registerCommands(commandList: Command[]): void {
  commandList.forEach(registerCommand);
}

// ═══════════════════════════════════════════════════════════════
// الحصول على أمر
// ═══════════════════════════════════════════════════════════════

export function getCommand(name: string): Command | undefined {
  const lowerName = name.toLowerCase();
  
  // البحث المباشر
  let command = commands.get(lowerName);
  
  // البحث في الأسماء المستعارة
  if (!command) {
    const originalName = aliases.get(lowerName);
    if (originalName) {
      command = commands.get(originalName);
    }
  }
  
  return command;
}

// ═══════════════════════════════════════════════════════════════
// الحصول على جميع الأوامر
// ═══════════════════════════════════════════════════════════════

export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}

// ═══════════════════════════════════════════════════════════════
// الحصول على الأوامر حسب الفئة
// ═══════════════════════════════════════════════════════════════

export function getCommandsByCategory(category: CommandCategory): Command[] {
  return getAllCommands().filter(cmd => cmd.category === category);
}

// ═══════════════════════════════════════════════════════════════
// الحصول على الفئات المتاحة
// ═══════════════════════════════════════════════════════════════

export function getCategories(): CommandCategory[] {
  const categories = new Set<CommandCategory>();
  commands.forEach(cmd => categories.add(cmd.category));
  return Array.from(categories);
}

// ═══════════════════════════════════════════════════════════════
// التحقق من Cooldown
// ═══════════════════════════════════════════════════════════════

function checkCooldown(userJid: string, command: Command): boolean {
  if (!command.cooldown) return true;

  const key = `${userJid}:${command.name}`;
  const lastUsed = cooldowns.get<number>(key);

  if (lastUsed) {
    const now = Date.now();
    const diff = (now - lastUsed) / 1000;
    if (diff < command.cooldown) {
      return false;
    }
  }

  cooldowns.set(key, Date.now(), command.cooldown);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// تنفيذ الأمر
// ═══════════════════════════════════════════════════════════════

export async function executeCommand(
  commandName: string,
  ctx: MessageContext,
  socket: WASocket
): Promise<{ success: boolean; message?: string }> {
  const command = getCommand(commandName);

  if (!command) {
    return { success: false, message: `❌ الأمر \`${commandName}\` غير موجود` };
  }

  // التحقق من المالك
  if (command.ownerOnly && !ctx.isOwner) {
    return { success: false, message: messages.ownerOnly };
  }

  // التحقق من المشرف
  if (command.adminOnly && !ctx.isAdmin && !ctx.isOwner) {
    return { success: false, message: messages.adminOnly };
  }

  // التحقق من المجموعة
  if (command.groupOnly && !ctx.isGroup) {
    return { success: false, message: messages.groupOnly };
  }

  // التحقق من المحادثة الخاصة
  if (command.privateOnly && ctx.isGroup) {
    return { success: false, message: messages.privateOnly };
  }

  // التحقق من صلاحيات البوت
  if (command.botAdminRequired && !ctx.isBotAdmin) {
    return { success: false, message: messages.botAdminRequired };
  }

  // التحقق من عدد الحجج
  if (command.minArgs && ctx.args && ctx.args.length < command.minArgs) {
    return { 
      success: false, 
      message: `${messages.invalidArgs}\n\n📋 الاستخدام: ${config.prefix}${command.name} ${command.usage || ''}` 
    };
  }

  // التحقق من Cooldown
  if (!checkCooldown(ctx.sender, command)) {
    return { success: false, message: messages.cooldown };
  }

  try {
    log.command(command.name, ctx.sender, ctx.isGroup ? ctx.jid : undefined);
    await command.execute(ctx, socket);
    return { success: true };
  } catch (error) {
    log.error('الأوامر', `خطأ في تنفيذ ${command.name}`, error as Error);
    return { success: false, message: messages.error };
  }
}

// ═══════════════════════════════════════════════════════════════
// إزالة أمر
// ═══════════════════════════════════════════════════════════════

export function unregisterCommand(name: string): boolean {
  const command = commands.get(name.toLowerCase());
  if (!command) return false;

  commands.delete(name.toLowerCase());
  
  // إزالة الأسماء المستعارة
  if (command.aliases) {
    command.aliases.forEach(alias => {
      aliases.delete(alias.toLowerCase());
    });
  }

  return true;
}

export default {
  registerCommand,
  registerCommands,
  getCommand,
  getAllCommands,
  getCommandsByCategory,
  getCategories,
  executeCommand,
  unregisterCommand
};
