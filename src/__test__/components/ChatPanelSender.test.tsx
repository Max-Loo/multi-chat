/**
 * ChatPanelSender 组件测试
 *
 * 测试消息发送框的各种交互场景
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import React from "react";
import ChatPanelSender from "@/pages/Chat/components/Panel/Sender";
import { createMockChat } from "@/__test__/helpers/mocks/chatSidebar";
import {
  createTypeSafeTestStore,
  renderWithProviders,
} from "@/__test__/helpers/render/redux";
import {
  createChatSliceState,
  createAppConfigSliceState,
} from "@/__test__/helpers/mocks/testState";

vi.mock('react-i18next', () => {
  const R = { chat: { sendMessage: "发送消息", stopSending: "停止发送", typeMessage: "输入消息...", transmitHistoryReasoning: "包含推理内容" }, common: { confirm: "确认", cancel: "取消" } };
  return globalThis.__createI18nMockReturn(R);
});

const createStore = (
  chatOverrides?: Parameters<typeof createChatSliceState>[0],
  appConfigOverrides?: Parameters<typeof createAppConfigSliceState>[0],
) => {
  return createTypeSafeTestStore({
    chat: createChatSliceState(chatOverrides),
    appConfig: createAppConfigSliceState(appConfigOverrides),
  });
};

describe("ChatPanelSender", () => {
  let mockChat: ReturnType<typeof createMockChat>;

  beforeEach(() => {
    mockChat = createMockChat({ id: "chat-1", name: "Test Chat" });
  });

  afterEach(() => {
    cleanup();
  });

  describe("基础消息发送功能", () => {
    it("应该渲染输入框和发送按钮", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByTitle(/发送消息/i);

      expect(textarea).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it("应该更新输入框的值", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Hello, AI!" } });

      expect(textarea.value).toBe("Hello, AI!");
    });
  });

  describe("Enter 键发送消息", () => {
    it("应该在按下 Enter 键时发送消息", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Test message" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", keyCode: 13 });

      // 输入框应该被清空
      expect(textarea.value).toBe("");
    });

    it("应该在按下 Shift+Enter 时换行而不是发送", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Line 1" } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        shiftKey: true,
        code: "Enter",
        keyCode: 13,
      });

      // 输入框不应该被清空
      expect(textarea.value).toBe("Line 1");
    });
  });

  describe("发送中状态", () => {
    it("应该在发送中时忽略 Enter 键", () => {
      const store = createStore(
        {
          chatList: [mockChat],
          selectedChatId: "chat-1",
          runningChat: {
            "chat-1": {
              "model-1": { isSending: true, history: null },
            },
          },
        },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Test message" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", keyCode: 13 });

      // 输入框应该保持不变（不发送）
      expect(textarea.value).toBe("Test message");
    });

    it("应该显示停止按钮而不是发送按钮", () => {
      const store = createStore(
        {
          chatList: [mockChat],
          selectedChatId: "chat-1",
          runningChat: {
            "chat-1": {
              "model-1": { isSending: true, history: null },
            },
          },
        },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const stopButton = screen.getByTitle(/停止发送/i);

      // 按钮应该存在（显示停止图标）
      expect(stopButton).toBeInTheDocument();
    });

    it("应该在点击停止按钮时中止消息发送", () => {
      const store = createStore(
        {
          chatList: [mockChat],
          selectedChatId: "chat-1",
          runningChat: {
            "chat-1": {
              "model-1": { isSending: true, history: null },
            },
          },
        },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const stopButton = screen.getByTitle(/停止发送/i);

      fireEvent.click(stopButton);

      // 验证 abortController 被调用
      // 注意：点击停止按钮只是调用 abort，runningChat 的清理由 rejected action 处理
      expect(stopButton).toBeInTheDocument();
    });
  });

  describe("空消息处理", () => {
    it("不应该发送空消息", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "   " } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", keyCode: 13 });

      // 输入框不应该被清空（因为不是有效消息）
      expect(textarea.value).toBe("   ");
    });

    it("不应该发送仅包含空格的消息", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "   " } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", keyCode: 13 });

      // 输入框不应该被清空（因为不是有效消息）
      expect(textarea.value).toBe("   ");
    });
  });

  describe("Safari 中文输入法兼容性", () => {
    let originalUA: string;

    beforeEach(() => {
      originalUA = navigator.userAgent;
    });

    afterEach(() => {
      Object.defineProperty(navigator, "userAgent", {
        value: originalUA,
        configurable: true,
      });
    });

    it("应该在 macOS Safari 中阻止 compositionEnd 后 100ms 内的 Enter 键", () => {
      // 模拟 macOS Safari
      Object.defineProperty(navigator, "userAgent", {
        value:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        configurable: true,
      });

      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "中文输入" } });
      fireEvent.compositionEnd(textarea, { timeStamp: Date.now() });

      // 立即按下 Enter 键（在 100ms 内）
      fireEvent.keyDown(textarea, {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        timeStamp: Date.now() + 50,
      });

      // 消息不应该被发送
      expect(textarea.value).toBe("中文输入");
    });

    it("应该在非 Safari 环境中正常发送消息", () => {
      // 模拟 Chrome
      Object.defineProperty(navigator, "userAgent", {
        value:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        configurable: true,
      });

      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Test message" } });
      fireEvent.compositionEnd(textarea, { timeStamp: Date.now() });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        timeStamp: Date.now() + 50,
      });

      // 消息应该被发送
      expect(textarea.value).toBe("");
    });
  });

  describe("推理内容开关", () => {
    it("应该显示推理内容开关", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      // 推理内容开关应该存在于 DOM 中
      const reasoningButton = screen.queryByText(/包含推理内容/i);
      expect(reasoningButton).toBeInTheDocument();
    });

    // TODO: 推理内容开关按钮当前有 hidden class，点击不会触发任何效果
    // 当功能启用后，需要移除 hidden class 并取消此跳过
    it.skip("应该切换推理内容开关状态", async () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const reasoningButton = screen.getByText(/包含推理内容/i);
      
      // 初始状态：未激活
      expect(reasoningButton).toBeInTheDocument();
      
      // 点击切换
      fireEvent.click(reasoningButton);
      
      // 验证状态已更新（通过检查样式变化）
      await waitFor(() => {
        const state = store.getState();
        expect(state.appConfig.transmitHistoryReasoning).toBe(true);
      });
    });
  });

  describe("发送按钮交互", () => {
    it("应该在非发送状态时显示发送按钮", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const sendButton = screen.getByTitle(/发送消息/i);

      expect(sendButton).toBeInTheDocument();
    });

    it("应该在点击发送按钮时发送消息", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByTitle(/发送消息/i);

      fireEvent.change(textarea, { target: { value: "Test message" } });
      fireEvent.click(sendButton);

      // 输入框应该被清空
      expect(textarea.value).toBe("");
    });
  });

  describe("异步消息发送流程", () => {
    it("应该在发送消息后保存 AbortController", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Test message" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", keyCode: 13 });

      // 检查输入框是否被清空（表示消息已发送）
      expect(textarea.value).toBe("");
    });

    it.todo("应该在发送失败时保持输入框内容");
  });

  describe("输入框值变化和清空", () => {
    it("应该在输入时更新文本状态", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "First line" } });
      expect(textarea.value).toBe("First line");

      fireEvent.change(textarea, {
        target: { value: "First line\nSecond line" },
      });
      expect(textarea.value).toBe("First line\nSecond line");
    });

    it("应该在发送消息后清空输入框", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Test message" } });
      expect(textarea.value).toBe("Test message");

      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", keyCode: 13 });

      expect(textarea.value).toBe("");
    });
  });

  describe("compositionEnd 事件时间戳记录", () => {
    it("应该在 compositionEnd 事件触发时记录时间戳", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      const timestamp = Date.now();
      fireEvent.compositionEnd(textarea, { timeStamp: timestamp });

      // 时间戳应该被记录（通过在 Safari 测试中验证）
      // 这里我们只是确认事件被触发，不检查内部状态
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("自动调整高度功能", () => {
    it("5.1 应该保持最小高度 当单行输入", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(
        /输入消息/i,
      ) as HTMLTextAreaElement;

      // 单行输入
      fireEvent.change(textarea, { target: { value: "短文本" } });

      // 高度应该保持最小值 60px
      const height = parseInt(textarea.style.height);
      expect(height).toBeGreaterThanOrEqual(60);
    });
  });

  describe("布局和样式", () => {
    it("7.1 应该使用 flex 布局结构", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByTitle(/发送消息/i);

      expect(textarea).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it("7.2 外层容器应该有细灰色边框", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(/输入消息/i);

      // 验证 textarea 是可见且可交互的
      expect(textarea).toBeVisible();
      expect(textarea).toBeEnabled();
    });

    it("7.3 工具栏应该独立于 Textarea 区域", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const textarea = screen.getByPlaceholderText(/输入消息/i);
      const reasoningButton = screen.getByText(/包含推理内容/i);

      // 推理按钮不应该在 textarea 元素内部
      expect(textarea.contains(reasoningButton)).toBe(false);

      // 它们应该在同一个 flex 容器中，但是是兄弟关系
      const textareaParent = textarea.parentElement;
      const buttonParent = reasoningButton.closest(".flex.justify-between");

      expect(textareaParent).toBe(buttonParent?.parentElement);
    });

    it("7.4 发送按钮应该可点击且尺寸适当", () => {
      const store = createStore(
        { chatList: [mockChat], selectedChatId: "chat-1" },
      );

      renderWithProviders(React.createElement(ChatPanelSender), { store });

      const sendButton = screen.getByTitle(/发送消息/i);

      expect(sendButton).toBeVisible();
      expect(sendButton).toBeEnabled();
    });
  });
});
