/**
 * useNavigateToChat / useCreateChat 组合式函数测试（Vue 版）
 *
 * 验证带 chatId 查询参数的导航行为与创建聊天流程（对应迁移前 hooks 测试）：
 * - navigateToChat 的 push/replace 与 chatId 查询参数分支
 * - clearChatIdParam 保留其他查询参数
 * - createNewChat 的完整流程（创建 → 选中 → 导航）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Mock vue-router（组合式 API 形态）
const mockPush = vi.fn().mockResolvedValue(undefined);
const mockReplace = vi.fn().mockResolvedValue(undefined);
let mockRoute: { path: string; query: Record<string, string> } = { path: '/chat', query: {} };

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRoute: () => mockRoute,
}));

// Mock ID 生成保证断言确定性（保留其余 ai 导出）
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'generated-chat-id'),
  };
});

import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useChatStore } from '@/store/pinia/chat';

describe('useNavigateToChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute = { path: '/chat', query: {} };
  });

  it('带 chatId 时应 push 到 /chat?chatId=xxx', () => {
    const { navigateToChat } = useNavigateToChat();

    navigateToChat({ chatId: 'c1' });

    expect(mockPush).toHaveBeenCalledWith({ path: '/chat', query: { chatId: 'c1' } });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('无 chatId 时应 push 到 /chat', () => {
    const { navigateToChat } = useNavigateToChat();

    navigateToChat();

    expect(mockPush).toHaveBeenCalledWith({ path: '/chat' });
  });

  it('replace 为 true 时应使用 router.replace', () => {
    const { navigateToChat } = useNavigateToChat();

    navigateToChat({ chatId: 'c1', replace: true });

    expect(mockReplace).toHaveBeenCalledWith({ path: '/chat', query: { chatId: 'c1' } });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clearChatIdParam 应只移除 chatId 并保留其他参数', () => {
    mockRoute = { path: '/model', query: { chatId: 'c1', tab: 'remote' } };
    const { clearChatIdParam } = useNavigateToChat();

    clearChatIdParam();

    expect(mockReplace).toHaveBeenCalledWith({ path: '/model', query: { tab: 'remote' } });
  });
});

describe('useCreateChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    mockRoute = { path: '/chat', query: {} };
  });

  it('createNewChat 应创建空名聊天、选中并导航', async () => {
    const chatStore = useChatStore();
    const createChatSpy = vi.spyOn(chatStore, 'createChat').mockResolvedValue(undefined);
    const { createNewChat } = useCreateChat();

    await createNewChat();

    // 创建的聊天含生成的 ID 与空标题
    const created = createChatSpy.mock.calls[0][0].chat;
    expect(created.id).toBe('generated-chat-id');
    expect(created.name).toBe('');
    expect(chatStore.selectedChatId).toBe('generated-chat-id');
    expect(mockPush).toHaveBeenCalledWith({ path: '/chat', query: { chatId: 'generated-chat-id' } });
  });
});
