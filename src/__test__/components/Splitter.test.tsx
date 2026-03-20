/**
 * Splitter 组件测试
 *
 * 测试可拖拽布局组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import Splitter from '@/pages/Chat/components/Panel/Splitter';
import type { ChatModel } from '@/types/chat';
import {
  createMockPanelChatModel,
  createPanelLayoutStore,
  createPanelLayoutWrapper,
} from '@/__test__/helpers/mocks/panelLayout';

// 设置通用 Mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/pages/Chat/components/Panel/Detail', () => ({
  default: ({ chatModel }: { chatModel: ChatModel }) => (
    <div data-testid={`detail-${chatModel.modelId}`}>Detail: {chatModel.modelId}</div>
  ),
}));

describe('Splitter', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('ResizablePanel 渲染', () => {
    it('应该渲染 ResizablePanelGroup', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
      ];

      const { container } = render(<Splitter board={board} />, { wrapper });

      // 验证容器存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });

    it('应该处理多行 board', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3')],
      ];

      const { container } = render(<Splitter board={board} />, { wrapper });

      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });

    it('应该处理空 board', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [];

      const { container } = render(<Splitter board={board} />, { wrapper });

      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });

    it('应该处理单个模型', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [[createMockPanelChatModel('model-1')]];

      const { container } = render(<Splitter board={board} />, { wrapper });

      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('样式验证', () => {
    it('应该应用正确的容器样式', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [[createMockPanelChatModel('model-1')]];

      const { container } = render(<Splitter board={board} />, { wrapper });

      const absContainer = container.querySelector('.absolute.top-0.left-0.w-full.h-full');
      expect(absContainer).toBeInTheDocument();
      expect(absContainer).toHaveClass('pt-12');
      expect(absContainer).toHaveClass('pb-30');
    });
  });
});
