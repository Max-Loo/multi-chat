/**
 * ChatPanel 发送框组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/components/ChatPanelSender.test.tsx，保留核心行为语义：
 * - 渲染输入框与发送按钮、更新输入值
 * - Enter 发送、Shift+Enter 换行
 * - 发送中：忽略 Enter、显示停止按钮、点击停止中止
 * - 空消息与空白消息不发送
 * - 发送成功清空输入框、失败保留
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { nextTick } from 'vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import Sender from '@/pages/Chat/components/Panel/Sender.vue';
import { createAppPinia, useChatStore } from '@/stores';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';

const CHAT_ID = 'chat-sender-test';

/** 渲染 Sender 并监听 startSendChatMessage */
function renderSender() {
  const pinia = createAppPinia();
  const chatStore = useChatStore(pinia);
  const chat = {
    id: CHAT_ID,
    name: '发送测试',
    chatModelList: [createMockPanelChatModel('m1')],
    isDeleted: false,
  };
  chatStore.chatMetaList = [{ id: CHAT_ID, name: '发送测试', modelIds: [], isDeleted: false }];
  chatStore.activeChatData = { [CHAT_ID]: chat };
  chatStore.selectedChatId = CHAT_ID;

  /** 发送 spy：可配置实现（默认成功） */
  const startSpy = vi.fn();
  chatStore.startSendChatMessage = (async (...args: unknown[]) => {
    startSpy(...args);
  }) as never;

  const result = render(Sender, { global: { plugins: [pinia] } });
  return { ...result, chatStore, startSpy, pinia };
}

/** 获取输入框（placeholder 断言聚焦用户视角） */
function getTextarea(): HTMLTextAreaElement {
  return screen.getByPlaceholderText(
    '请输入消息...',
  ) as HTMLTextAreaElement;
}

describe('ChatPanelSender（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染输入框和发送按钮', () => {
    renderSender();

    expect(getTextarea()).toBeInTheDocument();
    expect(screen.getByTitle('发送消息')).toBeInTheDocument();
  });

  it('应该更新输入框的值', async () => {
    renderSender();

    await fireEvent.update(getTextarea(), '你好');

    expect(getTextarea()).toHaveValue('你好');
  });

  it('应该在按下 Enter 键时发送消息', async () => {
    const { startSpy } = renderSender();

    await fireEvent.update(getTextarea(), '你好');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(startSpy).toHaveBeenCalled();
  });

  it('应该在按下 Shift+Enter 时换行而不是发送', async () => {
    const { startSpy } = renderSender();

    await fireEvent.update(getTextarea(), '你好');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter', shiftKey: true });

    expect(startSpy).not.toHaveBeenCalled();
  });

  it('不应该发送空消息', async () => {
    const { startSpy } = renderSender();

    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(startSpy).not.toHaveBeenCalled();
  });

  it('不应该发送仅包含空格的消息', async () => {
    const { startSpy } = renderSender();

    await fireEvent.update(getTextarea(), '   ');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(startSpy).not.toHaveBeenCalled();
  });

  it('应该在发送成功后清空输入框', async () => {
    renderSender();

    await fireEvent.update(getTextarea(), '你好');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(getTextarea()).toHaveValue('');
  });

  it('应该在发送失败时保留输入框内容', async () => {
    const { chatStore } = renderSender();
    // 发送失败（reject）
    chatStore.startSendChatMessage = (async () => {
      throw new Error('send failed');
    }) as never;

    await fireEvent.update(getTextarea(), '你好');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(getTextarea()).toHaveValue('你好');
  });

  describe('发送中状态', () => {
    it('应该在发送中时忽略 Enter 键', async () => {
      const { chatStore, startSpy } = renderSender();
      chatStore.runningChat = {
        [CHAT_ID]: { m1: { isSending: true, history: null, errorMessage: '' } },
      };

      await fireEvent.update(getTextarea(), '你好');
      await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

      expect(startSpy).not.toHaveBeenCalled();
    });

    it('应该显示停止按钮而不是发送按钮', async () => {
      const { chatStore } = renderSender();
      chatStore.runningChat = {
        [CHAT_ID]: { m1: { isSending: true, history: null, errorMessage: '' } },
      };
      await nextTick();

      expect(screen.getByTitle('停止发送')).toBeInTheDocument();
      expect(screen.queryByTitle('发送消息')).not.toBeInTheDocument();
    });

    it('应该在点击停止按钮时中止消息发送', async () => {
      const { chatStore } = renderSender();
      /** 通过对象包装规避 TS 控制流收窄（闭包内赋值） */
      const captured: { signal: AbortSignal | null; resolve: (() => void) | null } = {
        signal: null,
        resolve: null,
      };
      const pendingSend = new Promise<void>((resolve) => {
        captured.resolve = resolve;
      });
      chatStore.startSendChatMessage = (async (
        _args: unknown,
        signal: AbortSignal,
      ) => {
        captured.signal = signal;
        // 标记发送中
        chatStore.runningChat = {
          [CHAT_ID]: {
            m1: { isSending: true, history: null, errorMessage: '' },
          },
        };
        await pendingSend;
      }) as never;

      // 触发发送（保存 AbortController 并进入发送中状态）
      await fireEvent.update(getTextarea(), '你好');
      await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

      // 点击停止按钮
      await fireEvent.click(screen.getByTitle('停止发送'));

      expect(captured.signal?.aborted).toBe(true);
      // 收尾：结束挂起的发送
      captured.resolve?.();
    });
  });
});
