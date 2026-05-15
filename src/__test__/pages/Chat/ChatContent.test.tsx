import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatContent from '@/pages/Chat/components/Content';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';

/**
 * Mock useCurrentSelectedChat hook
 */
export const mockUseCurrentSelectedChat = vi.fn();

vi.mock('@/hooks/useCurrentSelectedChat', () => ({
  useCurrentSelectedChat: () => mockUseCurrentSelectedChat(),
}));

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: { selectChatToStart: '选择一个聊天开始对话' },
    table: {
      nickname: '昵称',
      modelProvider: '模型提供商',
      modelName: '模型名称',
      lastUpdateTime: '最后更新时间',
      createTime: '创建时间',
    },
  }));

/**
 * 渲染 ChatContent 组件的辅助函数
 */
function renderChatContent() {
  const store = createTypeSafeTestStore();
  const { store: _store, ...result } = renderWithProviders(<ChatContent />, { store });

  return { store, ...result };
}

/**
 * ChatContent 组件单元测试
 *
 * ChatContent 根据 useCurrentSelectedChat 返回的聊天状态渲染不同子组件：
 * - null/undefined → 占位文本
 * - 有 chatModelList → ChatPanel（React.lazy）
 * - 无 chatModelList → ModelSelect（React.lazy）
 */
describe('ChatContent Component', () => {
  beforeEach(async () => {
    await resetTestState();
    mockUseCurrentSelectedChat.mockReset();
  });

  
  it('应该显示占位文本 当没有选中聊天', () => {
    mockUseCurrentSelectedChat.mockReturnValue(null);

    renderChatContent();

    expect(screen.getByText('选择一个聊天开始对话')).toBeInTheDocument();
  });

  it('应该渲染内容 当聊天有模型配置', () => {
    mockUseCurrentSelectedChat.mockReturnValue({
      id: 'chat-1',
      name: '测试聊天',
      chatModelList: [{ modelId: 'model-1' }],
      isDeleted: false,
    });

    const { container } = renderChatContent();

    expect(container.firstChild).toBeInTheDocument();
  });

  it('应该渲染内容 当聊天没有模型配置', () => {
    mockUseCurrentSelectedChat.mockReturnValue({
      id: 'chat-1',
      name: '测试聊天',
      chatModelList: [],
      isDeleted: false,
    });

    const { container } = renderChatContent();

    expect(container.firstChild).toBeInTheDocument();
  });
});
