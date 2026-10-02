/**
 * Splitter 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/Panel/Splitter.test.tsx，保留核心语义：
 * - 按 board 行列数渲染面板
 * - 行/列 defaultSize 计算（100 / 行数、100 / 列数）
 * - 行间与列间渲染分隔手柄
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';

// Mock Resizable 组件族：以 data 属性暴露关键 props，聚焦 Splitter 的组合逻辑
vi.mock('@/components/ui/resizable', () => ({
  __esModule: true,
  ResizablePanelGroup: {
    __isTeleport: false,
    props: ['direction'],
    template:
      '<div data-testid="resizable-group" :data-direction="direction"><slot /></div>',
  },
  ResizablePanel: {
    __isTeleport: false,
    props: ['defaultSize'],
    template:
      '<div data-testid="resizable-panel" :data-default-size="defaultSize"><slot /></div>',
  },
  ResizableHandle: {
    __isTeleport: false,
    template: '<div data-testid="resizable-handle" />',
  },
}));

vi.mock('@/pages/Chat/components/Panel/Detail/Detail.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['chatModel'],
    template:
      '<div data-testid="mock-detail" :data-model-id="chatModel.modelId" />',
  },
}));

import Splitter from '@/pages/Chat/components/Panel/Splitter.vue';
import {
  createMockPanelChatModel,
  createMockPanelChatModels,
} from '@/__test__/helpers/fixtures/panelLayout';

describe('Splitter（Vue 版）', () => {
  it('应该渲染 2x2 面板 当 board 为 2 行 2 列', () => {
    render(Splitter, {
      props: {
        board: [
          createMockPanelChatModels(['m1', 'm2']),
          createMockPanelChatModels(['m3', 'm4']),
        ],
      },
    });

    expect(screen.getAllByTestId('resizable-panel')).toHaveLength(6); // 2 行面板 + 每行 2 列面板
    expect(screen.getAllByTestId('mock-detail')).toHaveLength(4);
  });

  it('应该计算正确的 defaultSize 当 board 为 2 行', () => {
    render(Splitter, {
      props: {
        board: [
          createMockPanelChatModels(['m1']),
          createMockPanelChatModels(['m2']),
        ],
      },
    });

    // 行面板 defaultSize = 100 / 2
    const rowPanels = screen
      .getAllByTestId('resizable-panel')
      .filter((p) => p.getAttribute('data-default-size') === '50');
    expect(rowPanels).toHaveLength(2);
  });

  it('应该在行间和列间渲染 ResizableHandle', () => {
    render(Splitter, {
      props: {
        board: [
          createMockPanelChatModels(['m1', 'm2']),
          createMockPanelChatModels(['m3', 'm4']),
        ],
      },
    });

    // 2 行间 1 个 + 每行 2 列间 1 个 = 3 个
    expect(screen.getAllByTestId('resizable-handle')).toHaveLength(3);
  });

  it('应该渲染单行单列 当 board 为 1x1 且无手柄', () => {
    render(Splitter, {
      props: { board: [[createMockPanelChatModel('m1')]] },
    });

    expect(screen.getAllByTestId('resizable-panel')).toHaveLength(2); // 1 行面板 + 1 列面板
    expect(screen.queryByTestId('resizable-handle')).not.toBeInTheDocument();
  });
});
