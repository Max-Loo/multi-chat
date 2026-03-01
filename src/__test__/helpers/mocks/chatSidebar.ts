/**
 * Chat Sidebar 测试 Mock 工厂
 *
 * 提供聊天侧边栏组件测试所需的 Mock 工厂函数
 */

import { vi } from 'vitest';
import type { Chat } from '@/types/chat';
import { createMockMessage } from './chatPanel';
import { generateId } from 'ai';

/**
 * 创建 Mock Chat 对象
 * @param overrides 要覆盖的字段
 * @returns Chat 对象
 */
export const createMockChat = (overrides?: Partial<Chat>): Chat => {
  return {
    id: generateId(),
    name: 'Test Chat',
    chatModelList: [],
    isDeleted: false,
    ...overrides,
  };
};

/**
 * 创建包含多个模型的 Chat
 * @param modelCount 模型数量
 * @param overrides 要覆盖的字段
 * @returns Chat 对象
 */
export const createMockChatWithModels = (
  modelCount: number,
  overrides?: Partial<Chat>
): Chat => {
  const chatModelList = Array.from({ length: modelCount }, (_, i) => ({
    modelId: `model-${i}`,
    chatHistoryList: [
      createMockMessage({
        id: `msg-${i}-1`,
        role: 'user' as any,
        content: `User message ${i + 1}`,
      }),
      createMockMessage({
        id: `msg-${i}-2`,
        role: 'assistant' as any,
        content: `Assistant response ${i + 1}`,
      }),
    ],
  }));

  return createMockChat({
    chatModelList,
    ...overrides,
  });
};

/**
 * 创建未命名的 Chat
 * @param overrides 要覆盖的字段
 * @returns Chat 对象
 */
export const createMockUnnamedChat = (overrides?: Partial<Chat>): Chat => {
  return createMockChat({
    name: '',
    ...overrides,
  });
};

/**
 * 创建已删除的 Chat
 * @param overrides 要覆盖的字段
 * @returns Chat 对象
 */
export const createMockDeletedChat = (overrides?: Partial<Chat>): Chat => {
  return createMockChat({
    isDeleted: true,
    ...overrides,
  });
};

/**
 * 创建 Chat 列表
 * @param count 聊天数量
 * @param overrides 每个聊天要覆盖的字段
 * @returns Chat 对象数组
 */
export const createMockChatList = (
  count: number,
  overrides?: Partial<Chat>
): Chat[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockChat({
      name: `Chat ${i + 1}`,
      ...overrides,
    })
  );
};

/**
 * 创建 Mock 重命名操作状态
 * @param isRenaming 是否正在重命名
 * @param newName 新名称
 * @returns 重命名状态对象
 */
export const createMockRenameState = (isRenaming = false, newName?: string) => {
  return {
    isRenaming,
    newName: newName || '',
    setIsRenaming: vi.fn(),
    setNewName: vi.fn(),
  };
};

/**
 * 创建 Mock 搜索状态
 * @param isSearching 是否正在搜索
 * @param filterText 过滤文本
 * @returns 搜索状态对象
 */
export const createMockSearchState = (isSearching = false, filterText = '') => {
  return {
    isSearching,
    filterText,
    setIsSearching: vi.fn(),
    setFilterText: vi.fn(),
  };
};

/**
 * 创建 Mock 侧边栏折叠状态
 * @param isCollapsed 是否折叠
 * @returns 折叠状态对象
 */
export const createMockCollapsedState = (isCollapsed = false) => {
  return {
    isCollapsed,
    setIsCollapsed: vi.fn(),
  };
};

/**
 * 创建 ChatButton 测试 Mock 集合
 * @param customMocks 自定义 Mock 配置
 * @returns 包含所有必需 Mock 的对象
 */
export const createChatButtonMocks = (customMocks?: {
  chat?: Chat;
  selectedChatId?: string;
  renameState?: ReturnType<typeof createMockRenameState>;
}) => {
  const chat = customMocks?.chat || createMockChat();
  const selectedChatId = customMocks?.selectedChatId || chat.id;
  const renameState = customMocks?.renameState || createMockRenameState();

  return {
    chat,
    selectedChatId,
    renameState,
  };
};

/**
 * 创建 ToolsBar 测试 Mock 集合
 * @param customMocks 自定义 Mock 配置
 * @returns 包含所有必需 Mock 的对象
 */
export const createToolsBarMocks = (customMocks?: {
  filterText?: string;
  searchState?: ReturnType<typeof createMockSearchState>;
  collapsedState?: ReturnType<typeof createMockCollapsedState>;
  isShowChatPage?: boolean;
}) => {
  const searchState = customMocks?.searchState || createMockSearchState();
  const collapsedState = customMocks?.collapsedState || createMockCollapsedState();

  return {
    filterText: customMocks?.filterText || '',
    searchState,
    collapsedState,
    isShowChatPage: customMocks?.isShowChatPage ?? true,
  };
};
