/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - نظام الإضافات
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { Plugin, Command } from '../types';
import { registerCommand, unregisterCommand } from '../core/commandRegistry';
import { log } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
// تخزين الإضافات
// ═══════════════════════════════════════════════════════════════

const plugins = new Map<string, Plugin>();
const pluginsDir = path.resolve(__dirname, '../../plugins');

// ═══════════════════════════════════════════════════════════════
// تحميل إضافة
// ═══════════════════════════════════════════════════════════════

export async function loadPlugin(pluginName: string): Promise<boolean> {
  try {
    const pluginPath = path.join(pluginsDir, pluginName);
    
    // التحقق من وجود الملف
    if (!fs.existsSync(path.join(pluginPath, 'index.js')) && 
        !fs.existsSync(path.join(pluginPath, 'index.ts'))) {
      log.error('الإضافات', `الإضافة ${pluginName} غير موجودة`);
      return false;
    }

    // تحميل الإضافة
    const pluginModule = require(pluginPath);
    const plugin: Plugin = pluginModule.default || pluginModule;

    if (!plugin.name || !plugin.commands) {
      log.error('الإضافات', `الإضافة ${pluginName} غير صالحة`);
      return false;
    }

    // تسجيل الأوامر
    plugin.commands.forEach(command => {
      registerCommand(command);
    });

    // استدعاء دالة التحميل
    if (plugin.onLoad) {
      await plugin.onLoad();
    }

    plugin.enabled = true;
    plugins.set(plugin.name, plugin);

    log.success('الإضافات', `تم تحميل الإضافة: ${plugin.name}`);
    return true;
  } catch (error) {
    log.error('الإضافات', `خطأ في تحميل ${pluginName}`, error as Error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// إلغاء تحميل إضافة
// ═══════════════════════════════════════════════════════════════

export async function unloadPlugin(pluginName: string): Promise<boolean> {
  try {
    const plugin = plugins.get(pluginName);
    
    if (!plugin) {
      log.warn('الإضافات', `الإضافة ${pluginName} غير محملة`);
      return false;
    }

    // إلغاء تسجيل الأوامر
    plugin.commands.forEach(command => {
      unregisterCommand(command.name);
    });

    // استدعاء دالة إلغاء التحميل
    if (plugin.onUnload) {
      await plugin.onUnload();
    }

    plugin.enabled = false;
    plugins.delete(pluginName);

    log.success('الإضافات', `تم إلغاء تحميل: ${pluginName}`);
    return true;
  } catch (error) {
    log.error('الإضافات', `خطأ في إلغاء تحميل ${pluginName}`, error as Error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// تحميل جميع الإضافات
// ═══════════════════════════════════════════════════════════════

export async function loadAllPlugins(): Promise<void> {
  // إنشاء مجلد الإضافات إذا لم يكن موجوداً
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
    log.info('الإضافات', 'تم إنشاء مجلد الإضافات');
    return;
  }

  // قراءة المجلدات
  const dirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  log.info('الإضافات', `تم العثور على ${dirs.length} إضافة`);

  for (const dir of dirs) {
    await loadPlugin(dir);
  }
}

// ═══════════════════════════════════════════════════════════════
// الحصول على إضافة
// ═══════════════════════════════════════════════════════════════

export function getPlugin(name: string): Plugin | undefined {
  return plugins.get(name);
}

// ═══════════════════════════════════════════════════════════════
// الحصول على جميع الإضافات
// ═══════════════════════════════════════════════════════════════

export function getAllPlugins(): Plugin[] {
  return Array.from(plugins.values());
}

// ═══════════════════════════════════════════════════════════════
// تفعيل/إيقاف إضافة
// ═══════════════════════════════════════════════════════════════

export async function togglePlugin(name: string): Promise<boolean> {
  const plugin = plugins.get(name);
  
  if (!plugin) {
    return false;
  }

  if (plugin.enabled) {
    return await unloadPlugin(name);
  } else {
    return await loadPlugin(name);
  }
}

// ═══════════════════════════════════════════════════════════════
// إنشاء قالب إضافة
// ═══════════════════════════════════════════════════════════════

export function createPluginTemplate(name: string): string {
  return `/**
 * ${name} Plugin for Fᴀᴛɪᴍᴀ Bot
 */

import { Plugin, Command, CommandCategory } from '../../src/types';

const commands: Command[] = [
  {
    name: 'example',
    description: 'أمر مثال',
    category: CommandCategory.UTILITY,
    execute: async (ctx, socket) => {
      await socket.sendMessage(ctx.jid, { text: 'مرحباً من ${name}!' });
    }
  }
];

const plugin: Plugin = {
  name: '${name}',
  version: '1.0.0',
  author: 'Your Name',
  description: 'وصف الإضافة',
  commands,
  enabled: true,
  
  onLoad: async () => {
    console.log('${name} plugin loaded!');
  },
  
  onUnload: async () => {
    console.log('${name} plugin unloaded!');
  }
};

export default plugin;
`;
}

export default {
  loadPlugin,
  unloadPlugin,
  loadAllPlugins,
  getPlugin,
  getAllPlugins,
  togglePlugin,
  createPluginTemplate
};
