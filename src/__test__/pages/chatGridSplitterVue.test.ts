/**
 * Vue Grid / Splitter 布局组件测试
 *
 * 对应 React 版 Grid.test.tsx 与 Splitter.test.tsx 的行为断言：
 * 网格行列渲染、单元格边框、modelId 传递，以及 Splitter 的行列分组与拖拽把手。
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';

// Mock Detail，聚焦布局层行为
vi.mock('@/pages/Chat/components/Panel/Detail/Detail.vue', () => ({
  default: {
    name: 'Detail',
    props: ['chatModel'],
    template: `<div data-testid="detail" :data-model-id="chatModel.modelId" />`,
  },
}));

// Mock reka-ui Splitter 三件套，暴露 defaultSize / withHandle 供断言
vi.mock('reka-ui', () => ({
  SplitterGroup: {
    name: 'SplitterGroup',
    props: ['orientation'],
    template: `<div data-testid="splitter-group" :data-orientation="orientation"><slot /></div>`,
  },
  SplitterPanel: {
    name: 'SplitterPanel',
    props: ['defaultSize'],
    template: `<div data-testid="resizable-panel" :data-default-size="defaultSize"><slot /></div>`,
  },
  SplitterResizeHandle: {
    name: 'SplitterResizeHandle',
    props: { withHandle: { type: Boolean, default: false } },
    template: `<div data-testid="resizable-handle" :data-with-handle="String(withHandle)"><slot /></div>`,
  },
}));

import PanelGrid from '@/pages/Chat/components/Panel/PanelGrid.vue';
import PanelSplitter from '@/pages/Chat/components/Panel/PanelSplitter.vue';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

describe('PanelGrid（Vue 版）', () => {
  it('board 为 1x1 时渲染单行单列', () => {
    const board = [[createMockPanelChatModel('openai-gpt4')]];
    render(PanelGrid, { props: { board } });

    expect(screen.getAllByTestId('detail').length).toBe(1);
  });

  it('board 为 2x3 时渲染 6 个单元格', () => {
    const board = [
      [createMockPanelChatModel('a'), createMockPanelChatModel('b'), createMockPanelChatModel('c')],
      [createMockPanelChatModel('d'), createMockPanelChatModel('e'), createMockPanelChatModel('f')],
    ];
    render(PanelGrid, { props: { board } });

    expect(screen.getAllByTestId('detail').length).toBe(6);
  });

  it('非最后一列的单元格有右边框，最后一列没有', () => {
    const board = [[createMockPanelChatModel('a'), createMockPanelChatModel('b')]];
    const { container } = render(PanelGrid, { props: { board } });

    const cells = container.querySelectorAll('[data-testid="detail"]');
    expect(cells[0].parentElement?.className).toContain('border-r');
    expect(cells[1].parentElement?.className).not.toContain('border-r');
  });

  it('非最后一行的单元格有底边框，最后一行没有', () => {
    const board = [
      [createMockPanelChatModel('a')],
      [createMockPanelChatModel('b')],
    ];
    const { container } = render(PanelGrid, { props: { board } });

    const cells = container.querySelectorAll('[data-testid="detail"]');
    expect(cells[0].parentElement?.className).toContain('border-b');
    expect(cells[1].parentElement?.className).not.toContain('border-b');
  });

  it('把 modelId 正确传递给 Detail', () => {
    const board = [[createMockPanelChatModel('openai-gpt4'), createMockPanelChatModel('anthropic-claude')]];
    render(PanelGrid, { props: { board } });

    const details = screen.getAllByTestId('detail');
    expect(details[0].getAttribute('data-model-id')).toBe('openai-gpt4');
    expect(details[1].getAttribute('data-model-id')).toBe('anthropic-claude');
  });
});

describe('PanelSplitter（Vue 版）', () => {
  it('board 为 2x2 时渲染 6 个面板与 4 个 Detail', () => {
    const board = [
      [createMockPanelChatModel('a'), createMockPanelChatModel('b')],
      [createMockPanelChatModel('c'), createMockPanelChatModel('d')],
    ];
    render(PanelSplitter, { props: { board } });

    // 行面板 2 + 单元格面板 4 = 6
    expect(screen.getAllByTestId('resizable-panel').length).toBe(6);
    expect(screen.getAllByTestId('detail').length).toBe(4);
  });

  it('board 为 2 行时行面板 defaultSize 为 50', () => {
    const board = [
      [createMockPanelChatModel('a'), createMockPanelChatModel('b')],
      [createMockPanelChatModel('c'), createMockPanelChatModel('d')],
    ];
    const { container } = render(PanelSplitter, { props: { board } });

    const panels = Array.from(container.querySelectorAll('[data-testid="resizable-panel"]'));
    // 行面板：defaultSize=50；单元格面板：defaultSize=50（单列行）
    expect(panels[0].getAttribute('data-default-size')).toBe('50');
    expect(panels[2].getAttribute('data-default-size')).toBe('50');
  });

  it('行间与列间渲染拖拽把手', () => {
    const board = [
      [createMockPanelChatModel('a'), createMockPanelChatModel('b')],
      [createMockPanelChatModel('c'), createMockPanelChatModel('d')],
    ];
    const { container } = render(PanelSplitter, { props: { board } });

    const handles = container.querySelectorAll('[data-testid="resizable-handle"]');
    // 2x2：行间 1 个 + 列间 2 个 = 3
    expect(handles.length).toBe(3);
    handles.forEach((handle) => {
      expect(handle.getAttribute('data-with-handle')).toBe('true');
    });
  });

  it('board 为 1x1 时渲染 2 个面板且无把手', () => {
    const board = [[createMockPanelChatModel('a')]];
    const { container } = render(PanelSplitter, { props: { board } });

    expect(container.querySelectorAll('[data-testid="resizable-panel"]').length).toBe(2);
    expect(container.querySelectorAll('[data-testid="resizable-handle"]').length).toBe(0);
  });
});
