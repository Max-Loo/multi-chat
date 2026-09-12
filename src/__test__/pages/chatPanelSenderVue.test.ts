/**
 * Vue PanelSender 组件测试
 *
 * 对应 React 版 ChatPanelSender.test.tsx 的行为断言：
 * 输入框/按钮渲染、Enter 发送、Shift+Enter 换行、发送中忽略 Enter 与停止按钮、
 * 空白消息不发送、Safari 中文输入法 hack、发送失败保留内容、无选中聊天不发送。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: {
      typeMessage: '请输入消息...',
      sendMessage: '发送消息',
      stopSending: '停止发送',
      transmitHistoryReasoning: '包含推理内容',
      transmitHistoryReasoningHint: '推理内容提示',
    },
    common: { cancel: '取消' },
  }));

import PanelSender from '@/pages/Chat/components/Panel/PanelSender.vue';
import { useChatStore } from '@/store/pinia/chat';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

/** 注入选中聊天 */
const injectSelectedChat = () => {
  const chatStore = useChatStore();
  const chat = createMockChat({ id: 'chat-1', name: 'Test Chat' });
  chatStore.selectedChatId = chat.id;
  chatStore.activeChatData = { [chat.id]: chat };
  chatStore.runningChat = {};
  return chatStore;
};

/** 取输入框 textarea */
const getTextarea = () => screen.getByPlaceholderText('请输入消息...') as HTMLTextAreaElement;

/** 取发送/停止按钮（title 随状态切换；工具栏还有隐藏的推理开关按钮，不能用 role） */
const getSendButton = () => screen.getByTitle(/发送消息|停止发送/);

describe('PanelSender（Vue 版）', () => {
  const originalUA = navigator.userAgent;
  let chatStore: ReturnType<typeof injectSelectedChat>;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    chatStore = injectSelectedChat();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUA,
    });
    vi.restoreAllMocks();
  });

  it('渲染输入框与发送按钮', () => {
    render(PanelSender);

    expect(getTextarea()).toBeTruthy();
    expect(screen.getByTitle('发送消息')).toBeTruthy();
  });

  it('输入框值受控更新', async () => {
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Hello');

    expect(getTextarea().value).toBe('Hello');
  });

  it('按 Enter 键发送消息并清空输入框', async () => {
    const spy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Hello world');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    await waitFor(() => expect(getTextarea().value).toBe(''));
    expect(spy).toHaveBeenCalledTimes(1);
    const [payload, options] = spy.mock.calls[0];
    expect(payload.message).toBe('Hello world');
    expect((options as { signal: AbortSignal }).signal).toBeInstanceOf(AbortSignal);
  });

  it('Shift+Enter 换行而不发送', async () => {
    vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Line 1');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter', shiftKey: true });

    expect(getTextarea().value).toBe('Line 1');
  });

  it('发送中时忽略 Enter 键', async () => {
    const chat = chatStore.activeChatData['chat-1'];
    chatStore.runningChat = {
      'chat-1': { 'model-1': { isSending: true, history: null } },
    };
    void chat;
    const spy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Test message');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(spy).not.toHaveBeenCalled();
    expect(getTextarea().value).toBe('Test message');
  });

  it('发送中显示停止按钮，点击停止时中止发送', async () => {
    // 挂起的发送请求，模拟进行中的流式响应
    vi.spyOn(chatStore, 'startSendChatMessage').mockImplementation(() => new Promise(() => {}));
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    render(PanelSender);

    // 发起发送（保存 AbortController）
    await fireEvent.update(getTextarea(), 'Test message');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    // 随后进入发送中状态 → 按钮切换为「停止发送」
    chatStore.runningChat = {
      'chat-1': { 'model-1': { isSending: true, history: null } },
    };
    await waitFor(() => expect(getSendButton().getAttribute('title')).toBe('停止发送'));

    await fireEvent.click(getSendButton());

    expect(abortSpy).toHaveBeenCalled();
  });

  it('空白消息不发送', async () => {
    const spy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), '   ');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(spy).not.toHaveBeenCalled();
    expect(getTextarea().value).toBe('   ');
  });

  it('macOS Safari 中文输入法组合结束后 100ms 内 Enter 不发送', async () => {
    // 模拟 macOS Safari UA
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });
    const spy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), '你好');
    // 真实事件 timeStamp：compositionEnd 与 keyDown 紧邻，间隔 < 100ms
    await fireEvent.compositionEnd(getTextarea());
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(spy).not.toHaveBeenCalled();
    expect(getTextarea().value).toBe('你好');
  });

  it('Chrome 下同样的组合结束 + Enter 正常发送', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const spy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), '你好');
    await fireEvent.compositionEnd(getTextarea());
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    await waitFor(() => expect(getTextarea().value).toBe(''));
    expect(spy).toHaveBeenCalled();
  });

  it('发送失败时保留输入框内容', async () => {
    vi.spyOn(chatStore, 'startSendChatMessage').mockRejectedValue(new Error('network'));
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Test message');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    await waitFor(() => expect(getTextarea().value).toBe('Test message'));
  });

  it('无选中聊天时不发送', async () => {
    chatStore.selectedChatId = null;
    const spy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Test message');
    await fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(spy).not.toHaveBeenCalled();
    expect(getTextarea().value).toBe('Test message');
  });

  it('点击发送按钮发送并清空输入框', async () => {
    vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue(undefined);
    render(PanelSender);

    await fireEvent.update(getTextarea(), 'Via button');
    await fireEvent.click(getSendButton());

    await waitFor(() => expect(getTextarea().value).toBe(''));
  });
});
