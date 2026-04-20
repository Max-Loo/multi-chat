/**
 * Splitter 组件单元测试
 *
 * 测试可拖拽布局：
 * - 面板数量
 * - ResizableHandle 数量
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Splitter from '@/pages/Chat/components/Panel/Splitter';
import { ChatModel } from '@/types/chat';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

// Mock Detail 组件
vi.mock('@/pages/Chat/components/Panel/Detail', () => ({
  default: ({ chatModel }: { chatModel: ChatModel }) => (
    <div data-testid="detail" data-model-id={chatModel.modelId} />
  ),
}));

// Mock Resizable 组件
vi.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children, orientation }: any) => (
    <div data-testid="panel-group" data-orientation={orientation}>{children}</div>
  ),
  ResizablePanel: ({ children, defaultSize }: any) => (
    <div data-testid="resizable-panel" data-default-size={defaultSize}>{children}</div>
  ),
  ResizableHandle: ({ withHandle }: any) => (
    <div data-testid="resizable-handle" data-with-handle={withHandle ? 'true' : 'false'} />
  ),
}));

describe('Splitter', () => {
  it('应该渲染 2x2 面板 当 board 为 2 行 2 列', () => {
    const board = [
      [createMockPanelChatModel('m1'), createMockPanelChatModel('m2')],
      [createMockPanelChatModel('m3'), createMockPanelChatModel('m4')],
    ];

    const { container } = render(<Splitter board={board} />);

    const panels = container.querySelectorAll('[data-testid="resizable-panel"]');
    // 2 行 + 每行 2 个 = 6 panels
    expect(panels).toHaveLength(6);

    const details = container.querySelectorAll('[data-testid="detail"]');
    expect(details).toHaveLength(4);
  });

  it('应该计算正确的 defaultSize 当 board 为 2 行', () => {
    const board = [
      [createMockPanelChatModel('m1')],
      [createMockPanelChatModel('m2')],
    ];

    const { container } = render(<Splitter board={board} />);

    const panels = container.querySelectorAll('[data-testid="resizable-panel"]');
    // 布局结构：行面板(50) > 面板组 > 列面板(100)，行面板(50) > 面板组 > 列面板(100)
    // querySelectorAll 按文档顺序：[行面板50, 列面板100, 行面板50, 列面板100]
    // 行面板 defaultSize = 100 / 2 = 50
    expect(panels[0]).toHaveAttribute('data-default-size', '50');
    expect(panels[2]).toHaveAttribute('data-default-size', '50');
  });

  it('应该在行间和列间渲染 ResizableHandle', () => {
    const board = [
      [createMockPanelChatModel('m1'), createMockPanelChatModel('m2')],
      [createMockPanelChatModel('m3'), createMockPanelChatModel('m4')],
    ];

    const { container } = render(<Splitter board={board} />);

    const handles = container.querySelectorAll('[data-testid="resizable-handle"]');
    // 1 行间 handle + 2 列间 handles (每行 1 个) = 3
    expect(handles).toHaveLength(3);

    // 所有 handle 都应有 withHandle
    handles.forEach((h) => {
      expect(h).toHaveAttribute('data-with-handle', 'true');
    });
  });

  it('应该渲染单行单列 当 board 为 1x1', () => {
    const board = [[createMockPanelChatModel('m1')]];

    const { container } = render(<Splitter board={board} />);

    const panels = container.querySelectorAll('[data-testid="resizable-panel"]');
    expect(panels).toHaveLength(2); // 1 行面板 + 1 列面板

    const handles = container.querySelectorAll('[data-testid="resizable-handle"]');
    expect(handles).toHaveLength(0);
  });
});
