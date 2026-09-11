/**
 * Vue 聊天通用组件冒烟测试
 *
 * 验证 ChatBubble 的核心行为：角色布局、内容渲染、编辑历史翻页、编辑交互。
 */
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { render, screen, fireEvent } from '@testing-library/vue';
import ChatBubble from '@/components/chat/ChatBubble.vue';
import { ChatRoleEnum } from '@/types/chat';
import { VirtualList } from '@/components/ui-vue/vlist';
import { MasonryGrid } from '@/components/ui-vue/masonry';

describe('ChatBubble（Vue 版）', () => {
  it('用户消息渲染在右侧容器', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: '你好',
        messageId: 'm1',
      },
    });

    expect(screen.getByTestId('user-message')).toBeVisible();
  });

  it('AI 消息渲染在左侧容器', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.ASSISTANT,
        content: '你好！有什么可以帮你？',
        messageId: 'm2',
      },
    });

    expect(screen.getByTestId('assistant-message')).toBeVisible();
  });

  it('编辑历史翻页显示当前版本索引', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: ['第一版', '第二版', '第三版'],
        messageId: 'm1',
      },
    });

    // 默认显示最新版本 3/3
    expect(screen.getByText('3/3')).toBeVisible();
  });

  it('翻页按钮切换版本并触发索引变更事件', async () => {
    const { emitted } = render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: ['第一版', '第二版'],
        messageId: 'm1',
        historyIndexOverride: 1,
      },
    });

    const prevButton = screen.getByLabelText('Go to previous page');
    fireEvent.click(prevButton);

    expect(emitted('historyIndexChange')).toBeTruthy();
    expect(emitted('historyIndexChange')![0]).toEqual([0]);
  });

  it('进入编辑模式后可取消', async () => {
    const onEdit = vi.fn();
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: '可编辑消息',
        messageId: 'm1',
        isLatestUserMessage: true,
        onEdit,
      },
    });

    // 用户消息操作栏：第一个按钮为复制，第二个为编辑（仅最新用户消息显示）
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1];
    fireEvent.click(editButton);
    await nextTick();

    // 编辑模式出现原生 textarea，且预填当前内容
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('可编辑消息');

    // 取消按钮（编辑区第一个操作按钮）退出编辑模式
    const cancelButtons = screen.getAllByRole('button');
    fireEvent.click(cancelButtons[cancelButtons.length - 2]);
    await nextTick();

    // 回到展示模式
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('AI 消息生成中隐藏操作栏', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.ASSISTANT,
        content: '生成中内容',
        messageId: 'm2',
        isRunning: true,
      },
    });

    // 生成中不渲染重新生成按钮
    expect(screen.queryByTitle(/regenerate/i)).toBeNull();
  });

  it('onCopy 回调触发', async () => {
    const onCopy = vi.fn();
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: '复制我',
        messageId: 'm1',
        onCopy,
      },
    });

    // 第一个操作按钮为复制
    const copyButton = screen.getAllByRole('button')[0];
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalledWith('m1');
  });

  it('VirtualList 虚拟滚动容器渲染', () => {
    const { container } = render(VirtualList, {
      props: { items: ['a', 'b', 'c'] },
      slots: {
        item: `<template #item="{ item }"><div>item-{{ item }}</div></template>`,
      },
    });
    expect(container.querySelector('[data-testid="virtual-list"]')).not.toBeNull();
  });

  it('MasonryGrid 瀑布流按列数渲染', () => {
    const { container } = render(MasonryGrid, {
      props: { cols: 2, gap: 8 },
      slots: { default: '<div>项目1</div><div>项目2</div>' },
    });
    const grid = container.querySelector('[data-testid="masonry-grid"]') as HTMLElement;
    expect(grid).toBeVisible();
    expect(grid.style.columnCount).toBe('2');
    expect(grid.textContent).toContain('项目1');
  });
});
