/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 Fᴀᴛɪᴍᴀ WhatsApp Bot - تصدير جميع الأوامر
 * ═══════════════════════════════════════════════════════════════
 */

import { Command } from '../types';
import { generalCommands } from './general';
import { groupCommands } from './group';
import { ownerCommands } from './owner';
import { aiCommands } from './ai';
import { funCommands } from './fun';
import { toolsCommands } from './tools';

// جمع جميع الأوامر
export const allCommands: Command[] = [
  ...generalCommands,
  ...groupCommands,
  ...ownerCommands,
  ...aiCommands,
  ...funCommands,
  ...toolsCommands
];

// تصدير الأوامر حسب الفئة
export {
  generalCommands,
  groupCommands,
  ownerCommands,
  aiCommands,
  funCommands,
  toolsCommands
};

export default allCommands;
