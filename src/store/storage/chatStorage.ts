/**
 * 聊天存储模块
 * 负责聊天数据的按 key 存储：chat_index 索引 + chat_<id> 独立数据
 */
import type { Chat, ChatMeta } from "@/types/chat";
import { chatToMeta } from "@/types/chat";
import { createLazyStore, saveToStore, loadFromStore } from "./storeUtils";
import { getCurrentTimestamp } from "@/utils/utils";

/** 索引 key */
const CHAT_INDEX_KEY = 'chat_index';
/** 单聊天 key 前缀 */
const CHAT_KEY_PREFIX = 'chat_';
/** 旧的单一 key（用于迁移） */
const OLD_CHATS_KEY = 'chats';

/** 聊天存储的 LazyStore 实例 */
const chatsStore = createLazyStore('chats.json');

/**
 * 生成单聊天的存储 key
 * @param chatId 聊天 ID
 */
function chatKey(chatId: string): string {
  return `${CHAT_KEY_PREFIX}${chatId}`;
}

/**
 * 读取聊天索引
 * @returns 聊天元数据列表
 */
export const loadChatIndex = async (): Promise<ChatMeta[]> => {
  return await loadFromStore<ChatMeta[]>(chatsStore, CHAT_INDEX_KEY, []);
};

/**
 * 写入聊天索引
 * @param index 聊天元数据列表
 */
export const saveChatIndex = async (index: ChatMeta[]): Promise<void> => {
  await saveToStore(chatsStore, CHAT_INDEX_KEY, index, `索引（${index.length} 条）`);
};

/**
 * 从存储读取单个聊天完整数据
 * @param chatId 聊天 ID
 * @returns 聊天数据，不存在时返回 undefined
 */
export const loadChatById = async (chatId: string): Promise<Chat | undefined> => {
  await chatsStore.init();
  const data = await chatsStore.get<Chat>(chatKey(chatId));
  return data ?? undefined;
};

/**
 * 写入单个聊天数据
 * @param chatId 聊天 ID
 * @param chat 完整聊天数据
 */
export const saveChatById = async (chatId: string, chat: Chat): Promise<void> => {
  await saveToStore(chatsStore, chatKey(chatId), chat, `聊天 ${chatId}`);
};

/**
 * 同时写入聊天数据和更新索引
 * @param chatId 聊天 ID
 * @param chat 完整聊天数据
 * @param index 当前索引（将被更新后写入）
 */
export const saveChatAndIndex = async (chatId: string, chat: Chat, index: ChatMeta[]): Promise<void> => {
  const meta = chatToMeta(chat);
  const existingIdx = index.findIndex(m => m.id === chatId);

  if (existingIdx !== -1) {
    index[existingIdx] = meta;
  } else {
    index.unshift(meta);
  }

  // 先写聊天数据，再写索引
  await saveChatById(chatId, chat);
  await saveChatIndex(index);
};

/**
 * 删除聊天：先从存储加载完整数据，再标记 isDeleted 后写回并更新索引
 * @param chatId 聊天 ID
 * @param index 当前索引
 */
export const deleteChatFromStorage = async (chatId: string, index: ChatMeta[]): Promise<void> => {
  const storedChat = await loadChatById(chatId);
  if (!storedChat) {
    console.warn(`deleteChatFromStorage: 聊天 ${chatId} 在存储中不存在，跳过`);
    return;
  }

  const deletedChat: Chat = { ...storedChat, isDeleted: true };
  const meta = chatToMeta(deletedChat);
  const existingIdx = index.findIndex(m => m.id === chatId);

  if (existingIdx !== -1) {
    index[existingIdx] = meta;
  }

  await saveChatById(chatId, deletedChat);
  await saveChatIndex(index);
};

/**
 * 检测并迁移旧格式存储（单 key 数组 → 每聊天独立 key + 索引）
 * 强制写入顺序：(1) 所有 chat_<id> key (2) chat_index (3) 删除旧 chats key
 * 幂等：多次执行不会丢数据
 */
export const migrateOldChatStorage = async (): Promise<void> => {
  await chatsStore.init();

  // 检查索引是否已存在（已迁移过则跳过）
  const existingIndex = await chatsStore.get<ChatMeta[]>(CHAT_INDEX_KEY);
  if (existingIndex !== undefined && existingIndex !== null) {
    return;
  }

  // 读取旧格式数据
  const oldChats = await chatsStore.get<Chat[]>(OLD_CHATS_KEY);
  if (!oldChats || !Array.isArray(oldChats) || oldChats.length === 0) {
    // 无旧数据，初始化空索引
    await saveChatIndex([]);
    return;
  }

  const now = getCurrentTimestamp();

  // 第一步：写入所有 chat_<id> key（Tauri 端先 set() 所有 key，最后一次 save()）
  for (const chat of oldChats) {
    // 为缺少 updatedAt 的旧聊天补充当前时间戳
    if (chat.updatedAt === undefined) {
      chat.updatedAt = now;
    }
    await chatsStore.set(chatKey(chat.id), chat);
  }
  await chatsStore.save();

  // 第二步：生成并写入索引
  const index: ChatMeta[] = oldChats.map(chat => chatToMeta(chat));
  await chatsStore.set(CHAT_INDEX_KEY, index);
  await chatsStore.save();

  // 第三步：删除旧 chats key（索引写入成功后才删除）
  await chatsStore.delete(OLD_CHATS_KEY);
  await chatsStore.save();
};
