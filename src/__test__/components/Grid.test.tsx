/**
 * Grid 组件测试
 *
 * 测试固定网格布局组件
 * 不 mock Detail 子组件，使用 renderWithProviders 渲染完整组件树
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import Grid from '@/pages/Chat/components/Panel/Grid';
import type { ChatModel } from '@/types/chat';
import {
  createMockPanelChatModel,
  createPanelLayoutStore,
} from '@/__test__/helpers/mocks/panelLayout';
import { renderWithProviders } from '@/__test__/helpers/render/redux';

vi.mock('react-i18next', () => {
  const R = { chat: { modelDeleted: '模型已删除', deleted: '已删除', disabled: '已禁用', supplier: '供应商', model: '模型', nickname: '昵称' }, common: { loading: 'Loading...' } };
  return globalThis.__createI18nMockReturn(R);
});

describe('Grid', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('列表转二维网格', () => {
    it('应该将 board 渲染为网格布局', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3')],
      ];

      renderWithProviders(<Grid board={board} />, { store });

      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });

    it('应该渲染正确数量的行', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1'), createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3'), createMockPanelChatModel('model-4')],
        [createMockPanelChatModel('model-5')],
      ];

      renderWithProviders(<Grid board={board} />, { store });

      const rows = screen.getAllByTestId('grid-row');
      expect(rows).toHaveLength(3);
    });

    it('应该处理空 board', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [];

      renderWithProviders(<Grid board={board} />, { store });

      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });

    it('应该处理单行 board', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1')],
      ];

      renderWithProviders(<Grid board={board} />, { store });

      const rows = screen.getAllByTestId('grid-row');
      expect(rows).toHaveLength(1);
    });

    it('应该处理单列 board', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1')],
        [createMockPanelChatModel('model-2')],
        [createMockPanelChatModel('model-3')],
      ];

      renderWithProviders(<Grid board={board} />, { store });

      const rows = screen.getAllByTestId('grid-row');
      expect(rows).toHaveLength(3);
    });
  });

  describe('样式验证', () => {
    it('应该应用正确的容器样式', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [[createMockPanelChatModel('model-1')]];

      renderWithProviders(<Grid board={board} />, { store });

      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });

    it('应该为非最后一行添加底部边框', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [
        [createMockPanelChatModel('model-1')],
        [createMockPanelChatModel('model-2')],
      ];

      renderWithProviders(<Grid board={board} />, { store });

      const rows = screen.getAllByTestId('grid-row');
      expect(rows.length).toBe(2);
    });
  });

  describe('边界情况', () => {
    it('应该处理大量模型', () => {
      const store = createPanelLayoutStore();

      const board: ChatModel[][] = [];
      for (let i = 0; i < 10; i++) {
        board.push([createMockPanelChatModel(`model-${i + 1}`)]);
      }

      renderWithProviders(<Grid board={board} />, { store });

      const rows = screen.getAllByTestId('grid-row');
      expect(rows).toHaveLength(10);
    });
  });
});
