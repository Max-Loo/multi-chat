/**
 * 聊天导出服务
 * 支持从存储直接读取活跃聊天和已删除聊天数据
 */
import type { Chat } from "@/types/chat";
import { loadChatIndex, loadChatById } from "@/store/storage/chatStorage";
import { version } from '../../package.json';

/**
 * 导出数据格式
 */
interface ExportData {
  chats: Chat[];
  exportedAt: string;
  version: string;
}

/**
 * 从存储读取所有聊天完整数据
 */
async function loadAllChats(): Promise<Chat[]> {
  const index = await loadChatIndex();
  const chats: Chat[] = [];

  for (const meta of index) {
    const chat = await loadChatById(meta.id);
    if (chat) {
      chats.push(chat);
    }
  }

  return chats;
}

/**
 * 导出所有活跃聊天
 * @returns 导出数据对象
 */
export async function exportAllChats(): Promise<ExportData> {
  const allChats = await loadAllChats();
  const activeChats = allChats.filter(chat => !chat.isDeleted);

  return {
    chats: activeChats,
    exportedAt: new Date().toISOString(),
    version,
  };
}

/**
 * 导出已删除聊天
 * @returns 导出数据对象
 */
export async function exportDeletedChats(): Promise<ExportData> {
  const allChats = await loadAllChats();
  const deletedChats = allChats.filter(chat => chat.isDeleted);

  return {
    chats: deletedChats,
    exportedAt: new Date().toISOString(),
    version,
  };
}
