/**
 * ChatPanelContent 组件测试
 *
 * 测试聊天内容布局组件
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ChatPanelContent from '@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent';
import type { Chat, ChatModel } from '@/types/chat';
import chatReducer from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';

/**
 * 创建测试用 Redux Store
 * @param chatModelList 聊天模型列表
 * @returns 配置好的 Redux Store
 */
const createTestStore = (chatModelList?: ChatModel[]) => {
  const chat: Chat = {
    id: 'test-chat-1',
    name: 'Test Chat',
    chatModelList: chatModelList || [],
    isDeleted: false,
  };

  return configureStore({
    reducer: {
      chat: chatReducer,
      models: modelReducer,
    } as any,
    preloadedState: {
      chat: {
        chatList: [chat],
        selectedChatId: 'test-chat-1',
        loading: false,
        error: null,
        initializationError: null,
        runningChat: {},
      },
      models: {
        models: [],
        loading: false,
        error: null,
      },
    } as any,
  });
};

/**
 * 创建测试 Wrapper 组件
 * @param store Redux Store
 * @returns Wrapper 组件
 */
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

/**
 * 创建 Mock 聊天模型
 * @param id 模型 ID
 * @returns ChatModel 对象
 */
const createMockChatModel = (id: string): ChatModel => ({
  modelId: id,
  chatHistoryList: [],
});

describe('ChatPanelContent', () => {
  describe('列表转二维网格（4.2.1）', () => {
    it('应该将 5 个模型转换为 2 列网格布局', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
        createMockChatModel('model-3'),
        createMockChatModel('model-4'),
        createMockChatModel('model-5'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证容器存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();

      // 验证 flex 容器存在
      const flexContainer = container.querySelector('.flex.flex-col');
      expect(flexContainer).toBeInTheDocument();
    });

    it('应该正确划分 5 个模型为 3 行（3, 2, 0）', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
        createMockChatModel('model-3'),
        createMockChatModel('model-4'),
        createMockChatModel('model-5'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证有 3 个行 div
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(3);
    });
  });

  describe('空列表处理（4.2.2）', () => {
    it('应该处理空列表', () => {
      const store = createTestStore([]);
      const wrapper = createWrapper(store);

      expect(() => render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      )).not.toThrow();
    });

    it('应该在空列表时渲染空容器', () => {
      const store = createTestStore([]);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证容器仍然存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });

    it('应该在空列表时使用常规网格布局', () => {
      const store = createTestStore([]);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证包含常规 flex 容器
      const flexContainer = container.querySelector('.flex.flex-col.w-full.h-full');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('不同 columnCount 的布局（4.2.3）', () => {
    it('应该支持 columnCount 为 1', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={1}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证有 2 行（每行 1 个）
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(2);
    });

    it('应该支持 columnCount 为 2', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
        createMockChatModel('model-3'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证有 2 行（2, 1）
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(2);
    });

    it('应该支持 columnCount 为 3', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
        createMockChatModel('model-3'),
        createMockChatModel('model-4'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={3}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证有 2 行（3, 1）
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(2);
    });

    it('应该支持 columnCount 大于模型数量', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={5}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证只有 1 行（所有模型在一行）
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(1);
    });

    it('应该在模型数量刚好等于 columnCount 时渲染单行', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
        createMockChatModel('model-3'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={3}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证只有 1 行
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(1);
    });
  });

  describe('ResizablePanel 集成（4.2.4）', () => {
    it('应该在 isSplitter 为 true 且模型数 > 1 时使用 ResizablePanel', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={true}
        />,
        { wrapper }
      );

      // 验证容器存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();

      // 验证不包含常规 flex 布局（因为使用了 ResizablePanel）
      const flexContainer = container.querySelector('.flex.flex-col.w-full.h-full');
      expect(flexContainer).not.toBeInTheDocument();
    });

    it('应该在 isSplitter 为 false 时使用常规网格布局', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证包含常规 flex 容器
      const flexContainer = container.querySelector('.flex.flex-col.w-full.h-full');
      expect(flexContainer).toBeInTheDocument();
    });

    it('应该在 isSplitter 为 true 但只有一个模型时使用常规布局', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={true}
        />,
        { wrapper }
      );

      // 验证包含常规 flex 容器（因为只有一个模型）
      const flexContainer = container.querySelector('.flex.flex-col.w-full.h-full');
      expect(flexContainer).toBeInTheDocument();
    });

    it('应该在 ResizablePanel 模式下正确设置内边距', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={true}
        />,
        { wrapper }
      );

      // 验证容器存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();

      // 验证内边距样式正确应用
      expect(containerElement).toHaveClass('pt-12');
      expect(containerElement).toHaveClass('pb-22');
    });

    it('应该在 ResizablePanel 模式下渲染多个模型', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
        createMockChatModel('model-2'),
        createMockChatModel('model-3'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={true}
        />,
        { wrapper }
      );

      // 验证容器存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理单个模型的情况', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证有 1 行
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(1);
    });

    it('应该处理大量模型（10 个模型 / 3 列）', () => {
      const chatModelList = Array.from({ length: 10 }, (_, i) =>
        createMockChatModel(`model-${i + 1}`)
      );

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={3}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证有 4 行（3, 3, 3, 1）
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(4);
    });

    it('应该正确设置容器样式类', () => {
      const chatModelList = [
        createMockChatModel('model-1'),
      ];

      const store = createTestStore(chatModelList);
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContent
          columnCount={2}
          isSplitter={false}
        />,
        { wrapper }
      );

      // 验证绝对定位容器
      const absContainer = container.querySelector('.absolute.top-0.left-0.w-full.h-screen');
      expect(absContainer).toBeInTheDocument();

      // 验证内边距
      expect(absContainer).toHaveClass('pt-12');
      expect(absContainer).toHaveClass('pb-24');
    });
  });
});
