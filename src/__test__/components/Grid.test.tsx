/**
 * Grid 组件测试
 *
 * 测试固定网格布局组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Grid from '@/pages/Chat/components/Panel/Grid';
import type { ChatModel } from '@/types/chat';
import {
  createMockPanelChatModel,
  createPanelLayoutStore,
  createPanelLayoutWrapper,
} from '@/__test__/helpers/mocks/panelLayout';

vi.mock('react-i18next', () => {
  const R = {};
  return globalThis.__createI18nMockReturn(R);
});

vi.mock('@/pages/Chat/components/Panel/Detail', () => ({
  default: ({ chatModel }: { chatModel: ChatModel }) => (
    <div data-testid={`detail-${chatModel.modelId}`}>Detail: {chatModel.modelId}</div>
  ),
}));

describe('Grid', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('列表转二维网格', () => {
    it('应该将 board 渲染为网格布局', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3')],
      ];

      const { container } = render(<Grid board={board} />, { wrapper });

      // 验证容器存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });

    it('应该渲染正确数量的行', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3'), createMockPanelChatModel('model-4')],
        [createMockPanelChatModel('model-5')],
      ];

      const { container } = render(<Grid board={board} />, { wrapper });

      // 验证有 3 个行
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(3);
    });

    it('应该处理空 board', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [];

      const { container } = render(<Grid board={board} />, { wrapper });

      // 验证容器仍然存在
      const containerElement = container.querySelector('.absolute.top-0.left-0');
      expect(containerElement).toBeInTheDocument();
    });

    it('应该处理单行 board', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1')],
      ];

      const { container } = render(<Grid board={board} />, { wrapper });

      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(1);
    });

    it('应该处理单列 board', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1')],
        [createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3')],
      ];

      const { container } = render(<Grid board={board} />, { wrapper });

      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(3);
    });
  });

  describe('样式验证', () => {
    it('应该应用正确的容器样式', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [[createMockPanelChatModel('model-1')]];

      const { container } = render(<Grid board={board} />, { wrapper });

      const absContainer = container.querySelector('.absolute.top-0.left-0.w-full.h-full');
      expect(absContainer).toBeInTheDocument();
      expect(absContainer).toHaveClass('pt-12');
      expect(absContainer).toHaveClass('pb-30');
    });

    it('应该为非最后一行添加底部边框', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1')],
        [createMockPanelChatModel('model-2')],
      ];

      const { container } = render(<Grid board={board} />, { wrapper });

      // 第一行的单元格应该有 border-b
      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows.length).toBe(2);
    });
  });

  describe('边界情况', () => {
    it('应该处理大量模型', () => {
      const store = createPanelLayoutStore();
      const wrapper = createPanelLayoutWrapper(store);

      const board: ChatModel[][] = [];
      for (let i = 0; i < 10; i++) {
        board.push([createMockPanelChatModel(`model-${i + 1}`)]);
      }

      const { container } = render(<Grid board={board} />, { wrapper });

      const rows = container.querySelectorAll('.flex.w-full.flex-1');
      expect(rows).toHaveLength(10);
    });
  });
});
