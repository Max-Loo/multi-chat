/**
 * RunningBubble 组件单元测试
 *
 * 测试正在生成的聊天气泡：
 * - 非发送状态返回 null
 * - 等待首字时显示 spinner
 * - 有内容时渲染 ChatBubble
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RunningBubble from '@/pages/Chat/components/Panel/Detail/RunningBubble';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

// Mock hooks
const mockSelectedChat = { id: 'chat-1' };
const mockRunningChat: Record<string, Record<string, any>> = {};

vi.mock('@/pages/Chat/hooks/useSelectedChat', () => ({
  useSelectedChat: () => ({ selectedChat: mockSelectedChat }),
}));

vi.mock('@/hooks/redux', () => ({
  useAppSelector: (selector: any) => selector({
    chat: { runningChat: mockRunningChat },
  }),
}));

// Mock ChatBubble
vi.mock('@/components/chat/ChatBubble', () => ({
  ChatBubble: ({ role, content, isRunning }: any) => (
    <div data-testid="assistant-message" data-role={role} data-content={content} data-running={isRunning} />
  ),
}));

// Mock Spinner
vi.mock('@/components/ui/spinner', () => ({
  Spinner: ({ className }: any) => (
    <div data-testid="spinner" className={className} />
  ),
}));

describe('RunningBubble', () => {
  beforeEach(() => {
    Object.keys(mockRunningChat).forEach((key) => delete mockRunningChat[key]);
  });

  it('应该不渲染可见内容 当 isSending 为 false', () => {
    mockRunningChat['chat-1'] = {
      'model-1': { isSending: false, history: null },
    };

    render(<RunningBubble chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.queryByTestId('assistant-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('应该不渲染可见内容 当 chatData 为 undefined', () => {
    mockRunningChat['chat-1'] = {};

    render(<RunningBubble chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.queryByTestId('assistant-message')).not.toBeInTheDocument();
  });

  it('应该显示 spinner 当正在发送但无历史内容', () => {
    mockRunningChat['chat-1'] = {
      'model-1': { isSending: true, history: null },
    };

    render(<RunningBubble chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('assistant-message')).not.toBeInTheDocument();
  });

  it('应该显示 spinner 当正在发送但历史内容为空', () => {
    mockRunningChat['chat-1'] = {
      'model-1': { isSending: true, history: { content: '', reasoningContent: '' } },
    };

    render(<RunningBubble chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('应该渲染 ChatBubble 当有运行中的内容', () => {
    mockRunningChat['chat-1'] = {
      'model-1': {
        isSending: true,
        history: { role: 'assistant', content: '正在生成的内容', reasoningContent: undefined },
      },
    };

    render(<RunningBubble chatModel={createMockPanelChatModel('model-1')} />);

    const bubble = screen.getByTestId('assistant-message');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveAttribute('data-running', 'true');
    expect(bubble).toHaveAttribute('data-content', '正在生成的内容');
  });

  it('应该渲染 ChatBubble 当有 reasoningContent', () => {
    mockRunningChat['chat-1'] = {
      'model-1': {
        isSending: true,
        history: { role: 'assistant', content: '', reasoningContent: '思考中...' },
      },
    };

    render(<RunningBubble chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
  });
});
