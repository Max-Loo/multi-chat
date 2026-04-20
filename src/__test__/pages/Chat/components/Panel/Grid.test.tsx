/**
 * Grid 组件单元测试
 *
 * 测试固定网格布局：
 * - 行列渲染数量
 * - 边框样式应用
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Grid from '@/pages/Chat/components/Panel/Grid';
import { ChatModel } from '@/types/chat';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

// Mock Detail 组件
vi.mock('@/pages/Chat/components/Panel/Detail', () => ({
  default: ({ chatModel }: { chatModel: ChatModel }) => (
    <div data-testid="detail" data-model-id={chatModel.modelId} />
  ),
}));

describe('Grid', () => {
  it('应该渲染单行单列 当 board 为 1x1', () => {
    const board = [[createMockPanelChatModel('model-1')]];

    const { container } = render(<Grid board={board} />);

    const rows = container.querySelectorAll('.flex.w-full.flex-1');
    expect(rows).toHaveLength(1);

    const details = container.querySelectorAll('[data-testid="detail"]');
    expect(details).toHaveLength(1);
  });

  it('应该渲染 2 行 3 列 当 board 为 2x3', () => {
    const board = [
      [createMockPanelChatModel('m1'), createMockPanelChatModel('m2'), createMockPanelChatModel('m3')],
      [createMockPanelChatModel('m4'), createMockPanelChatModel('m5'), createMockPanelChatModel('m6')],
    ];

    const { container } = render(<Grid board={board} />);

    const rows = container.querySelectorAll('.flex.w-full.flex-1');
    expect(rows).toHaveLength(2);

    const details = container.querySelectorAll('[data-testid="detail"]');
    expect(details).toHaveLength(6);
  });

  it('应该给非最后列的单元格添加右侧边框', () => {
    const board = [
      [createMockPanelChatModel('m1'), createMockPanelChatModel('m2')],
    ];

    const { container } = render(<Grid board={board} />);

    // border 类在包含 Detail mock 的父 div 上，使用 detail 作为锚点找父级
    const details = container.querySelectorAll('[data-testid="detail"]');
    const cell0 = details[0].parentElement!;
    const cell1 = details[1].parentElement!;
    expect(cell0).toHaveClass('border-r');
    expect(cell1).not.toHaveClass('border-r');
  });

  it('应该给非最后行的单元格添加底部边框', () => {
    const board = [
      [createMockPanelChatModel('m1')],
      [createMockPanelChatModel('m2')],
    ];

    const { container } = render(<Grid board={board} />);

    const details = container.querySelectorAll('[data-testid="detail"]');
    const cell0 = details[0].parentElement!;
    const cell1 = details[1].parentElement!;
    expect(cell0).toHaveClass('border-b');
    expect(cell1).not.toHaveClass('border-b');
  });

  it('应该渲染正确的 modelId 到 Detail', () => {
    const board = [
      [createMockPanelChatModel('openai-gpt4'), createMockPanelChatModel('anthropic-claude')],
    ];

    const { container } = render(<Grid board={board} />);

    const details = container.querySelectorAll('[data-testid="detail"]');
    expect(details[0]).toHaveAttribute('data-model-id', 'openai-gpt4');
    expect(details[1]).toHaveAttribute('data-model-id', 'anthropic-claude');
  });
});
