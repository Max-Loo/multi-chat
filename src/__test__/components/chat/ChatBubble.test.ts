/**
 * ChatBubble 组件测试（转写自 React components/chat/ChatBubble 测试）
 *
 * 验证用户/助手气泡渲染、推理内容标题、操作栏可见性与历史翻页
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import ChatBubble from '@/components/chat/ChatBubble.vue';
import { ChatRoleEnum } from '@/types/chat';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: { a11y: { userMessage: '用户消息', assistantMessage: '助手消息' } },
      chat: {
        copyMessage: '复制',
        editMessage: '编辑',
        regenerateMessage: '重新生成',
        previousVersion: '上一个版本',
        nextVersion: '下一个版本',
        thinking: '思考中',
        thinkingComplete: '思考完毕',
        editCancel: '取消编辑',
        editConfirm: '确认编辑',
      },
    }).useTranslation(),
}));

describe('ChatBubble', () => {
  it('应该正确渲染用户消息（含 Markdown）', () => {
    const { container } = render(ChatBubble, {
      props: { role: ChatRoleEnum.USER, content: '## 标题正文' },
    });

    expect(screen.getByTestId('user-message')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('应该正确渲染助手消息', () => {
    const { container } = render(ChatBubble, {
      props: { role: ChatRoleEnum.ASSISTANT, content: '**加粗**内容' },
    });

    expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeInTheDocument();
  });

  it('用户消息应该带可访问性标签', () => {
    render(ChatBubble, {
      props: { role: ChatRoleEnum.USER, content: 'hi' },
    });

    expect(screen.getByLabelText('用户消息')).toBeInTheDocument();
  });

  it('有消息 ID 时应该渲染复制按钮', () => {
    render(ChatBubble, {
      props: { role: ChatRoleEnum.USER, content: 'hi', messageId: 'm1' },
    });

    expect(screen.getByTitle('复制')).toBeInTheDocument();
  });

  it('最新用户消息且非发送中时显示编辑按钮', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: 'hi',
        messageId: 'm1',
        isLatestUserMessage: true,
        onEdit: vi.fn(),
      },
    });

    expect(screen.getByTitle('编辑')).toBeInTheDocument();
  });

  it('最后一条助手回复显示重新生成按钮', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.ASSISTANT,
        content: '回复',
        messageId: 'a1',
        isLastAssistant: true,
        onRegenerate: vi.fn(),
      },
    });

    expect(screen.getByTitle('重新生成')).toBeInTheDocument();
  });

  it('生成中隐藏全部操作栏', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.ASSISTANT,
        content: '回复',
        messageId: 'a1',
        isLastAssistant: true,
        isRunning: true,
        onRegenerate: vi.fn(),
      },
    });

    expect(screen.queryByTitle('重新生成')).not.toBeInTheDocument();
  });

  it('点击复制按钮应该触发 onCopy 回调', async () => {
    const onCopy = vi.fn();

    render(ChatBubble, {
      props: { role: ChatRoleEnum.USER, content: 'hi', messageId: 'm1', onCopy },
    });

    await fireEvent.click(screen.getByTitle('复制'));

    expect(onCopy).toHaveBeenCalledWith('m1');
  });

  it('推理内容应该渲染折叠面板且非运行状态标题为思考完毕', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.ASSISTANT,
        content: '回复',
        reasoningContent: '推理过程',
      },
    });

    expect(screen.getByText('思考完毕')).toBeInTheDocument();
    expect(screen.queryByText('推理过程')).not.toBeInTheDocument();
  });

  it('运行中且无正式内容时标题为思考中', () => {
    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.ASSISTANT,
        content: '',
        reasoningContent: '推理过程',
        isRunning: true,
      },
    });

    expect(screen.getByText('思考中')).toBeInTheDocument();
  });

  it('多版本内容应该渲染翻页器并支持切换', async () => {
    const onIndexChange = vi.fn();

    render(ChatBubble, {
      props: {
        role: ChatRoleEnum.USER,
        content: ['v1', 'v2'],
        messageId: 'm1',
        onHistoryIndexChange: onIndexChange,
      },
    });

    // 内部索引初始为最新版本
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();

    // 回退到 v1
    await fireEvent.click(screen.getByRole('button', { name: '上一个版本' }));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('其他角色（system/tool）应该不渲染任何气泡', () => {
    const { container } = render(ChatBubble, {
      props: { role: 'system' as ChatRoleEnum, content: 'sys' },
    });

    expect(container.querySelector('[data-testid="user-message"]')).toBeNull();
    expect(container.querySelector('[data-testid="assistant-message"]')).toBeNull();
  });

  it('应该清理 XSS 攻击代码', () => {
    const { container } = render(ChatBubble, {
      props: { role: ChatRoleEnum.USER, content: '<script>alert(1)</script>hi' },
    });

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('hi');
  });
});
