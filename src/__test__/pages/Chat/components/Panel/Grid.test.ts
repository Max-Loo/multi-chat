/**
 * Grid 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/Panel/Grid.test.tsx，保留核心语义：
 * - 按 board 行列数渲染网格
 * - 非最后列添加右边框、非最后行添加下边框
 * - modelId 正确传递给 Detail
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';

// Mock Detail：Grid 测试聚焦布局，不渲染真实消息列表
vi.mock('@/pages/Chat/components/Panel/Detail/Detail.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['chatModel'],
    template:
      '<div data-testid="mock-detail" :data-model-id="chatModel.modelId" />',
  },
}));

import Grid from '@/pages/Chat/components/Panel/Grid.vue';
import {
  createMockPanelChatModel,
  createMockPanelChatModels,
} from '@/__test__/helpers/fixtures/panelLayout';

describe('Grid（Vue 版）', () => {
  it('应该渲染单行单列 当 board 为 1x1', () => {
    render(Grid, { props: { board: [[createMockPanelChatModel('m1')]] } });

    expect(screen.getAllByTestId('grid-row')).toHaveLength(1);
    expect(screen.getAllByTestId('mock-detail')).toHaveLength(1);
  });

  it('应该渲染 2 行 3 列 当 board 为 2x3', () => {
    render(Grid, {
      props: {
        board: [
          createMockPanelChatModels(['m1', 'm2', 'm3']),
          createMockPanelChatModels(['m4', 'm5', 'm6']),
        ],
      },
    });

    expect(screen.getAllByTestId('grid-row')).toHaveLength(2);
    expect(screen.getAllByTestId('mock-detail')).toHaveLength(6);
  });

  it('应该给非最后列的单元格添加右侧边框', () => {
    render(Grid, {
      props: { board: [createMockPanelChatModels(['m1', 'm2'])] },
    });

    const cells = screen.getAllByTestId('mock-detail');
    const firstCell = cells[0].parentElement as HTMLElement;
    const lastCell = cells[1].parentElement as HTMLElement;
    expect(firstCell.className).toContain('border-r');
    expect(lastCell.className).not.toContain('border-r');
  });

  it('应该给非最后行的单元格添加底部边框', () => {
    render(Grid, {
      props: {
        board: [
          createMockPanelChatModels(['m1']),
          createMockPanelChatModels(['m2']),
        ],
      },
    });

    const rows = screen.getAllByTestId('grid-row');
    const firstRowCell = rows[0].querySelector('[data-testid="mock-detail"]')
      ?.parentElement as HTMLElement;
    const lastRowCell = rows[1].querySelector('[data-testid="mock-detail"]')
      ?.parentElement as HTMLElement;
    expect(firstRowCell.className).toContain('border-b');
    expect(lastRowCell.className).not.toContain('border-b');
  });

  it('应该渲染正确的 modelId 到 Detail', () => {
    render(Grid, {
      props: { board: [createMockPanelChatModels(['model-a', 'model-b'])] },
    });

    expect(screen.getAllByTestId('mock-detail')[0]).toHaveAttribute(
      'data-model-id',
      'model-a',
    );
    expect(screen.getAllByTestId('mock-detail')[1]).toHaveAttribute(
      'data-model-id',
      'model-b',
    );
  });
});
