/**
 * Pinia stores 行为冒烟测试
 *
 * 验证核心 store 的状态形状与关键动作行为与迁移前 Redux slices 一致。
 * 持久化依赖（storage 服务）通过全局 mock 隔离。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { useModelPageStore } from '@/store/pinia/modelPage';
import { useSettingPageStore } from '@/store/pinia/settingPage';
import { useModelStore } from '@/store/pinia/model';
import { useChatStore } from '@/store/pinia/chat';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import type { Chat } from '@/types/chat';
import type { Model } from '@/types/model';

// Mock 语言切换 Toast 依赖，避免真实 sonner
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn().mockResolvedValue('toast'),
    dismiss: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock 存储服务层，隔离 IndexedDB 与主密钥加密依赖
vi.mock('@/store/storage', () => ({
  loadModelsFromJson: vi.fn().mockResolvedValue({ models: [] }),
  saveModelsToJson: vi.fn().mockResolvedValue(undefined),
  loadChatIndex: vi.fn().mockResolvedValue([]),
  loadChatById: vi.fn().mockResolvedValue(null),
  saveChatAndIndex: vi.fn().mockResolvedValue(undefined),
  deleteChatFromStorage: vi.fn().mockResolvedValue(undefined),
}));

describe('Pinia stores 行为冒烟', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe('appConfig', () => {
    it('初始状态与迁移前一致', () => {
      const store = useAppConfigStore();
      expect(store.language).toBe('');
      expect(store.transmitHistoryReasoning).toBe(false);
      expect(store.autoNamingEnabled).toBe(true);
    });

    it('setTransmitHistoryReasoning 更新并持久化', () => {
      const store = useAppConfigStore();
      store.setTransmitHistoryReasoning(true);
      expect(store.transmitHistoryReasoning).toBe(true);
      expect(localStorage.getItem('multi-chat-transmit-history-reasoning')).toBe('true');
    });

    it('setAutoNamingEnabled 更新并持久化', () => {
      const store = useAppConfigStore();
      store.setAutoNamingEnabled(false);
      expect(store.autoNamingEnabled).toBe(false);
      expect(localStorage.getItem('multi-chat-auto-naming-enabled')).toBe('false');
    });
  });

  describe('页面级 store', () => {
    it('chatPage/modelPage/settingPage 抽屉动作一致', () => {
      const chatPage = useChatPageStore();
      const modelPage = useModelPageStore();
      const settingPage = useSettingPageStore();

      expect(chatPage.isSidebarCollapsed).toBe(false);
      expect(chatPage.isShowChatPage).toBe(false);
      expect(chatPage.isDrawerOpen).toBe(false);
      expect(modelPage.isDrawerOpen).toBe(false);
      expect(settingPage.isDrawerOpen).toBe(false);

      chatPage.setIsCollapsed(true);
      chatPage.setIsShowChatPage(true);
      chatPage.toggleDrawer();
      expect(chatPage.isSidebarCollapsed).toBe(true);
      expect(chatPage.isShowChatPage).toBe(true);
      expect(chatPage.isDrawerOpen).toBe(true);
      chatPage.setIsDrawerOpen(false);
      expect(chatPage.isDrawerOpen).toBe(false);

      modelPage.setIsDrawerOpen(true);
      settingPage.setIsDrawerOpen(true);
      expect(modelPage.isDrawerOpen).toBe(true);
      expect(settingPage.isDrawerOpen).toBe(true);
    });
  });

  describe('model store', () => {
    it('createModel/editModel/deleteModel 行为一致', async () => {
      const store = useModelStore();
      const model = { id: 'm1', modelName: 'test', providerKey: 'deepseek', isDeleted: false, isEnable: true } as unknown as Model;

      await store.createModel({ model });
      expect(store.models).toHaveLength(1);

      const edited = { ...model, modelName: 'edited' };
      await store.editModel({ model: edited });
      expect(store.models[0].modelName).toBe('edited');

      await store.deleteModel({ model });
      // 标记删除，不执行真删除
      expect(store.models).toHaveLength(1);
      expect(store.models[0].isDeleted).toBe(true);
    });
  });

  describe('chat store', () => {
    const makeChat = (id: string): Chat =>
      ({
        id,
        name: '',
        chatModelList: [],
      }) as unknown as Chat;

    it('createChat 同时更新 chatMetaList 与 activeChatData 并补齐 updatedAt', async () => {
      const store = useChatStore();
      const chat = makeChat('c1');

      await store.createChat({ chat });

      expect(store.chatMetaList).toHaveLength(1);
      expect(store.activeChatData.c1).toBeDefined();
      expect(chat.updatedAt).toBeDefined();
    });

    it('editChatName 拒绝空标题且超长截断到 20 字符', async () => {
      const store = useChatStore();
      const chat = makeChat('c1');
      chat.name = '原名';
      await store.createChat({ chat });

      // 空标题静默拒绝
      await store.editChatName({ id: 'c1', name: '   ' });
      expect(store.chatMetaList[0].name).toBe('原名');

      // 超长截断
      await store.editChatName({ id: 'c1', name: 'x'.repeat(30) });
      expect(store.chatMetaList[0].name).toHaveLength(20);
      expect(store.chatMetaList[0].isManuallyNamed).toBe(true);
    });

    it('deleteChat 从列表移除并清理选中态', async () => {
      const store = useChatStore();
      const chat = makeChat('c1');
      await store.createChat({ chat });
      store.setSelectedChatId('c1');

      await store.deleteChat({ chat });

      expect(store.chatMetaList).toHaveLength(0);
      expect(store.activeChatData.c1).toBeUndefined();
      expect(store.selectedChatId).toBeNull();
    });

    it('发送中的聊天不允许删除', async () => {
      const store = useChatStore();
      const chat = makeChat('c1');
      await store.createChat({ chat });
      store.sendingChatIds.c1 = true;

      await store.deleteChat({ chat });

      expect(store.chatMetaList).toHaveLength(1);
    });

    it('releaseCompletedBackgroundChat 仅回收非选中聊天', () => {
      const store = useChatStore();
      const chatA = makeChat('a');
      const chatB = makeChat('b');
      store.setActiveChatData({ chatId: 'a', chat: chatA });
      store.setActiveChatData({ chatId: 'b', chat: chatB });
      store.setSelectedChatId('a');

      store.releaseCompletedBackgroundChat('a');
      expect(store.activeChatData.a).toBeDefined();

      store.releaseCompletedBackgroundChat('b');
      expect(store.activeChatData.b).toBeUndefined();
    });
  });

  describe('modelProvider store', () => {
    it('初始状态与迁移前一致', () => {
      const store = useModelProviderStore();
      expect(store.providers).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.lastUpdate).toBeNull();
      expect(store.backgroundRefreshing).toBe(false);
    });
  });
});
