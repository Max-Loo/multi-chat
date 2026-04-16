/**
 * Splitter 组件测试
 *
 * 测试可拖拽布局组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import Splitter from '@/pages/Chat/components/Panel/Splitter';
import type { ChatModel } from '@/types/chat';
import {
  createMockPanelChatModel,
  createPanelLayoutStore,
  createPanelLayoutWrapper,
} from '@/__test__/helpers/mocks/panelLayout';

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('react-i18next', () => {
  const R = {};
  return globalThis.__createI18nMockReturn(R);
});

vi.mock('@/pages/Chat/components/Panel/Detail', () => ({
  default: ({ chatModel }: { chatModel: ChatModel }) => (
    <div data-testid={`detail-${chatModel.modelId}`}>Detail: {chatModel.modelId}</div>
  ),
}));

/** 渲染 Splitter 的辅助函数 */
function renderSplitter(board: ChatModel[][]) {
  const store = createPanelLayoutStore();
  const wrapper = createPanelLayoutWrapper(store);
  return render(<Splitter board={board} />, { wrapper });
}

describe('Splitter', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('ResizablePanel 渲染', () => {
    it.each([
      {
        name: '单行两个模型',
        board: [[createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')]],
      },
      {
        name: '多行 board',
        board: [
          [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
          [createMockPanelChatModel('model-3')],
        ],
      },
      {
        name: '空 board',
        board: [] as ChatModel[][],
      },
      {
        name: '单个模型',
        board: [[createMockPanelChatModel('model-1')]],
      },
    ])('应该渲染 ResizablePanelGroup ($name)', ({ board }) => {
      const { container } = renderSplitter(board);
      expect(container.querySelector('.pt-12.pb-30')).toBeInTheDocument();
    });
  });

  describe('样式验证', () => {
    it('应该应用正确的容器样式', () => {
      const { container } = renderSplitter([[createMockPanelChatModel('model-1')]]);

      const splitterContainer = container.querySelector('.pt-12.pb-30');
      expect(splitterContainer).toBeInTheDocument();
    });
  });

  describe('面板结构验证', () => {
    it('应该根据 board 行数渲染对应数量的垂直面板', () => {
      renderSplitter([
        [createMockPanelChatModel('model-1')],
        [createMockPanelChatModel('model-2')],
      ]);

      expect(screen.getByTestId('detail-model-1')).toBeInTheDocument();
      expect(screen.getByTestId('detail-model-2')).toBeInTheDocument();
    });

    it('应该在同一行中渲染多个水平面板', () => {
      renderSplitter([
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2'), createMockPanelChatModel('model-3')],
      ]);

      expect(screen.getByTestId('detail-model-1')).toBeInTheDocument();
      expect(screen.getByTestId('detail-model-2')).toBeInTheDocument();
      expect(screen.getByTestId('detail-model-3')).toBeInTheDocument();
    });

    it('应该在多行多列时正确渲染所有面板', () => {
      renderSplitter([
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3'), createMockPanelChatModel('model-4')],
      ]);

      expect(screen.getByTestId('detail-model-1')).toBeInTheDocument();
      expect(screen.getByTestId('detail-model-2')).toBeInTheDocument();
      expect(screen.getByTestId('detail-model-3')).toBeInTheDocument();
      expect(screen.getByTestId('detail-model-4')).toBeInTheDocument();
    });
  });
});
