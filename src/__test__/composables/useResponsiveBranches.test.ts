/**
 * useResponsive / useBoard 分支覆盖与 a11y 工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, defineComponent, h } from 'vue';
import { render } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { useResponsive } from '@/composables/useResponsive';
import { useBoard } from '@/pages/Chat/composables/useBoard';
import { handleActivationKeyDown } from '@/utils/a11y';
import { useChatStore } from '@/store/chat';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

describe('useResponsive 完整生命周期', () => {
  it('重同步定时器应重新求值匹配状态', async () => {
    vi.useFakeTimers();
    const { container } = render(
      defineComponent({
        setup() {
          const r = useResponsive();
          return () => h('div', { 'data-mobile': String(r.isMobile.value) });
        },
      }),
    );

    // 初始求值 + 重同步定时器（50/200/600ms）
    await vi.advanceTimersByTimeAsync(700);

    expect(container.querySelector('div')?.getAttribute('data-mobile')).toBe('false');
    vi.useRealTimers();
  });

  it('作用域销毁后重同步定时器不应抛错', async () => {
    vi.useFakeTimers();

    const { unmount } = render(
      defineComponent({
        setup() {
          useResponsive();
          return () => h('div');
        },
      }),
    );

    unmount();

    // 销毁后触发重同步定时器不应抛错（update 的 mql 空守卫生效）
    await vi.advanceTimersByTimeAsync(700);
    vi.useRealTimers();
    expect(true).toBe(true);
  });
});

describe('useBoard 参数形态', () => {
  /** 构造 n 个模型聊天并选中 */
  function seedChat(modelCount: number) {
    const chatStore = useChatStore();
    const chat = createMockChat({
      id: 'board-chat',
      chatModelList: Array.from({ length: modelCount }, (_, i) => ({
        modelId: `m-${i}`,
        chatHistoryList: [],
      })),
    }) as Chat;
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);
    return chat;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('应支持 ref 形式的列数与开关（空聊天）', () => {
    seedChat(0);
    const { board, shouldUseSplitter } = useBoard(ref(2), ref(false));

    expect(board.value).toEqual([]);
    expect(shouldUseSplitter.value).toBe(false);
  });

  it('应支持 getter 形式的列数与开关（空聊天）', () => {
    seedChat(0);
    const { board, shouldUseSplitter } = useBoard(
      () => 3,
      () => false,
    );

    expect(board.value).toEqual([]);
    expect(shouldUseSplitter.value).toBe(false);
  });
});

describe('handleActivationKeyDown', () => {
  it('Enter 键应触发回调并阻止默认行为', () => {
    const callback = vi.fn();
    const handler = handleActivationKeyDown(callback);
    const event = {
      key: 'Enter',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('Space 键应触发回调', () => {
    const callback = vi.fn();
    const handler = handleActivationKeyDown(callback);
    const event = {
      key: ' ',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('其他键不应触发回调', () => {
    const callback = vi.fn();
    const handler = handleActivationKeyDown(callback);
    const event = {
      key: 'a',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    handler(event);

    expect(callback).not.toHaveBeenCalled();
  });
});
