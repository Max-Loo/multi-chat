/**
 * 聊天存储模块
 * 负责聊天数据的明文存储和加载
 */
import type { Chat } from "@/types/chat";
import { createLazyStore, saveToStore, loadFromStore } from "./storeUtils";

/**
 * 聊天存储的 LazyStore 实例
 */
const chatsStore = createLazyStore('chats.json');

/**
 * 保存聊天列表到 Store
 * 聊天数据不加密，明文存储
 * @param chats - 聊天列表
 */
export const saveChatsToJson = async (chats: Chat[]): Promise<void> => {
  await saveToStore(chatsStore, 'chats', chats, `保存 ${chats.length} 个聊天`);
};

/**
 * 从 Store 加载聊天列表
 * @returns 聊天列表
 */
export const loadChatsFromJson = async (): Promise<Chat[]> => {
  return await loadFromStore<Chat[]>(chatsStore, 'chats', []);
};
