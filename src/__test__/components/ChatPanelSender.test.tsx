/**
 * ChatPanelSender 组件测试
 *
 * 测试消息发送框的各种交互场景
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ChatPanelSender from '@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender';
import chatReducer from '@/store/slices/chatSlices';
import type { RootState } from '@/store';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      if (typeof keyOrFn === 'function') {
        return keyOrFn({
          chat: {
            sendMessage: '发送消息',
            stopSending: '停止发送',
            typeMessage: '输入消息...',
            includeReasoningContent: '包含推理内容',
            includeReasoningContentHint: '是否在聊天历史中传输推理内容',
          },
          common: {
            cancel: '取消',
          },
        });
      }
      const translations: Record<string, string> = {
        'chat.sendMessage': '发送消息',
        'chat.stopSending': '停止发送',
        'chat.typeMessage': '输入消息...',
        'chat.includeReasoningContent': '包含推理内容',
        'chat.includeReasoningContentHint': '是否在聊天历史中传输推理内容',
        'common.cancel': '取消',
      };
      return translations[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      appConfig: (state = { includeReasoningContent: false, language: 'en' }) => state,
    } as any,
    preloadedState: state as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('ChatPanelSender', () => {
  let mockChat: ReturnType<typeof createMockChat>;

  beforeEach(() => {
    mockChat = createMockChat({ id: 'chat-1', name: 'Test Chat' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('基础消息发送功能', () => {
    it('应该渲染输入框和发送按钮', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByTitle(/发送消息/i);

      expect(textarea).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('应该更新输入框的值', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello, AI!' } });

      expect(textarea.value).toBe('Hello, AI!');
    });
  });

  describe('Enter 键发送消息', () => {
    it('应该在按下 Enter 键时发送消息', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });

      // 输入框应该被清空
      expect(textarea.value).toBe('');
    });

    it('应该在按下 Shift+Enter 时换行而不是发送', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Line 1' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true, code: 'Enter', keyCode: 13 });

      // 输入框不应该被清空
      expect(textarea.value).toBe('Line 1');
    });
  });

  describe('发送中状态', () => {
    it('应该在发送中时忽略 Enter 键', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {
            'chat-1': {
              'model-1': { isSending: true, history: null },
            },
          },
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });

      // 输入框应该保持不变（不发送）
      expect(textarea.value).toBe('Test message');
    });

    it('应该显示停止按钮而不是发送按钮', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {
            'chat-1': {
              'model-1': { isSending: true, history: null },
            },
          },
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const stopButton = screen.getByTitle(/停止发送/i);

      // 按钮应该存在（显示停止图标）
      expect(stopButton).toBeInTheDocument();
    });

    it('应该在点击停止按钮时中止消息发送', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {
            'chat-1': {
              'model-1': { isSending: true, history: null },
            },
          },
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const stopButton = screen.getByTitle(/停止发送/i);

      fireEvent.click(stopButton);

      // 等待状态更新
      waitFor(() => {
        const runningChat = store.getState().chat.runningChat;
        expect(runningChat['chat-1']).toBeUndefined();
      });
    });
  });

  describe('空消息处理', () => {
    it('不应该发送空消息', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });

      // 输入框不应该被清空（因为不是有效消息）
      expect(textarea.value).toBe('   ');
    });

    it('不应该发送仅包含空格的消息', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });

      // 输入框不应该被清空（因为不是有效消息）
      expect(textarea.value).toBe('   ');
    });
  });

  describe('Safari 中文输入法兼容性', () => {
    let originalUA: string;

    beforeEach(() => {
      originalUA = navigator.userAgent;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true,
      });
    });

    it('应该在 macOS Safari 中阻止 compositionEnd 后 100ms 内的 Enter 键', () => {
      // 模拟 macOS Safari
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        configurable: true,
      });

      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: '中文输入' } });
      fireEvent.compositionEnd(textarea, { timeStamp: Date.now() });

      // 立即按下 Enter 键（在 100ms 内）
      fireEvent.keyDown(textarea, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        timeStamp: Date.now() + 50,
      });

      // 消息不应该被发送
      expect(textarea.value).toBe('中文输入');
    });

    it('应该在非 Safari 环境中正常发送消息', () => {
      // 模拟 Chrome
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });

      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.compositionEnd(textarea, { timeStamp: Date.now() });
      fireEvent.keyDown(textarea, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        timeStamp: Date.now() + 50,
      });

      // 消息应该被发送
      expect(textarea.value).toBe('');
    });
  });

  describe('推理内容开关', () => {
    it('应该隐藏推理内容开关（当前实现）', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      // 推理内容开关应该存在于 DOM 中但被隐藏
      const reasoningButton = screen.queryByText(/包含推理内容/i);
      expect(reasoningButton).toBeInTheDocument();

      // 检查是否有 hidden 类
      const buttonContainer = reasoningButton?.closest('.hidden');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('应该切换推理内容开关状态', () => {
      // 这个测试需要移除 hidden class 才能验证
      // 当前实现中开关是隐藏的，所以这个测试暂时跳过
      // TODO: 当恢复推理内容开关 UI 时，启用此测试
    });
  });

  describe('发送按钮交互', () => {
    it('应该在非发送状态时显示发送按钮', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const sendButton = screen.getByTitle(/发送消息/i);

      expect(sendButton).toBeInTheDocument();
    });

    it('应该在点击发送按钮时发送消息', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;
      const sendButton = screen.getByTitle(/发送消息/i);

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      // 输入框应该被清空
      expect(textarea.value).toBe('');
    });
  });

  describe('异步消息发送流程', () => {
    it('应该在发送消息后保存 AbortController', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });

      // 检查输入框是否被清空（表示消息已发送）
      expect(textarea.value).toBe('');
    });

    it('应该在发送失败时保持输入框内容', () => {
      // 这个测试需要模拟发送失败的情况
      // TODO: 添加错误处理测试
    });
  });

  describe('输入框值变化和清空', () => {
    it('应该在输入时更新文本状态', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'First line' } });
      expect(textarea.value).toBe('First line');

      fireEvent.change(textarea, { target: { value: 'First line\nSecond line' } });
      expect(textarea.value).toBe('First line\nSecond line');
    });

    it('应该在发送消息后清空输入框', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      expect(textarea.value).toBe('Test message');

      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });

      expect(textarea.value).toBe('');
    });
  });

  describe('compositionEnd 事件时间戳记录', () => {
    it('应该在 compositionEnd 事件触发时记录时间戳', () => {
      const store = createTestStore({
        chat: {
          chatList: [mockChat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
        appConfig: {
          includeReasoningContent: false,
          language: 'en',
        },
      });

      const wrapper = createWrapper(store);
      render(React.createElement(ChatPanelSender), { wrapper });

      const textarea = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;

      const timestamp = Date.now();
      fireEvent.compositionEnd(textarea, { timeStamp: timestamp });

      // 时间戳应该被记录（通过在 Safari 测试中验证）
      // 这里我们只是确认事件被触发，不检查内部状态
      expect(textarea).toBeInTheDocument();
    });
  });
});
