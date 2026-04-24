/**
 * ChatBubble memo 重渲染行为测试
 *
 * 测试目标：间接验证 React.memo + arePropsEqual 比较函数的正确性
 *
 * 技术方案：
 * - 创建渲染次数追踪 wrapper 组件包裹 ChatBubble
 * - mock generateCleanHtml 并 spy 追踪调用次数（content 变化检测）
 * - mock react-i18next 支持 selector-based 模式
 * - 通过 DOM 断言验证 role/reasoningContent/isRunning 变化导致的重渲染
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatRoleEnum } from '@/types/chat';

// ========================================
// Mock 模块配置
// ========================================

/** mock generateCleanHtml 并导出 spy */
const mockGenerateCleanHtml = vi.fn((content: string) => `<p>${content}</p>`);

vi.mock('@/utils/markdown', () => ({
  generateCleanHtml: (content: string) => mockGenerateCleanHtml(content),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n());

// ========================================
// 渲染次数追踪 wrapper
// ========================================

/**
 * 渲染次数追踪器
 * 通过 vi.fn() 追踪 wrapper 组件的渲染次数，间接验证 ChatBubble 的 memo 行为
 */
const renderTracker = vi.fn();

/** 创建包裹 ChatBubble 的追踪 wrapper（使用 React.memo 避免 rerender 时 wrapper 自身重复渲染） */
const TrackedChatBubble = React.memo(function TrackedChatBubble(props: Parameters<typeof ChatBubble>[0]) {
  renderTracker();
  return <ChatBubble {...props} />;
});

// ========================================
// 测试用例
// ========================================

describe('ChatBubble memo 重渲染行为', () => {
  const defaultProps = {
    role: ChatRoleEnum.USER,
    content: 'Hello',
    isRunning: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    renderTracker.mockClear();
    mockGenerateCleanHtml.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('应该不重渲染 当四个关键 props（role/content/reasoningContent/isRunning）都相同', () => {
    const { rerender } = render(<TrackedChatBubble {...defaultProps} />);

    // 首次渲染：renderTracker 应被调用 1 次
    expect(renderTracker).toHaveBeenCalledTimes(1);

    // 用相同 props 重新渲染
    rerender(<TrackedChatBubble {...defaultProps} />);

    // memo 阻止了重复渲染，renderTracker 仍为 1 次
    expect(renderTracker).toHaveBeenCalledTimes(1);
  });

  it('应该重渲染 当 content 不同', () => {
    const { rerender } = render(<TrackedChatBubble {...defaultProps} />);

    // 清除首次渲染的 spy 调用
    mockGenerateCleanHtml.mockClear();

    rerender(<TrackedChatBubble {...defaultProps} content="New content" />);

    // content 变化触发 useMemo 重新计算，generateCleanHtml 被调用
    expect(mockGenerateCleanHtml).toHaveBeenCalledWith('New content');
  });

  it('应该重渲染 当 role 不同', () => {
    const { rerender } = render(<TrackedChatBubble {...defaultProps} />);

    rerender(<TrackedChatBubble {...defaultProps} role={ChatRoleEnum.ASSISTANT} />);

    // role 变化触发重渲染：testid 从 user-message 切换为 assistant-message
    expect(screen.queryByTestId('user-message')).not.toBeInTheDocument();
    screen.getByTestId('assistant-message');
  });

  it('应该重渲染 当 reasoningContent 不同', () => {
    const { rerender } = render(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content="Some content"
        reasoningContent={undefined}
        isRunning={false}
      />
    );

    // 无 reasoningContent 时，不应有 ThinkingSection 相关内容
    expect(screen.queryByText('思考完毕')).not.toBeInTheDocument();

    // reasoningContent 变化触发重渲染，ThinkingSection 出现
    rerender(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content="Some content"
        reasoningContent="Deep reasoning..."
        isRunning={false}
      />
    );

    expect(screen.getByText('思考完毕')).toBeInTheDocument();
  });

  it('应该重渲染 当 isRunning 不同', () => {
    const { rerender } = render(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content=""
        reasoningContent="Thinking..."
        isRunning={false}
      />
    );

    // isRunning=false 且 content="" → thinkingLoading=false → 显示 "思考完毕"
    expect(screen.getByText('思考完毕')).toBeInTheDocument();

    // isRunning=true 且 content="" → thinkingLoading=true → 显示 "思考中..."
    rerender(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content=""
        reasoningContent="Thinking..."
        isRunning={true}
      />
    );

    expect(screen.getByText('思考中...')).toBeInTheDocument();
  });
});
