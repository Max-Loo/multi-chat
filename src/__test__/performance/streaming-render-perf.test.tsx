/**
 * 流式渲染性能行为测试
 *
 * 验证 ChatBubble、ThinkingSection 在流式内容更新时的 generateCleanHtml 调用次数。
 *
 * 策略：mock generateCleanHtml，通过 vi.fn() spy 追踪调用次数，断言行为契约。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { memo } from 'react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ThinkingSection } from '@/components/chat/ThinkingSection';
import { ChatRoleEnum } from '@/types/chat';

// ========================================
// Mock 模块配置
// ========================================

/** mock generateCleanHtml 并导出 spy */
const mockGenerateCleanHtml = vi.fn();

vi.mock('@/utils/markdown', () => ({
  generateCleanHtml: (content: string) => mockGenerateCleanHtml(content),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n());

// ========================================
// 渲染追踪工具
// ========================================

/** 创建包裹 ChatBubble 的追踪 wrapper（memo 阻止 wrapper 自身因 rerender 重复渲染） */
const TrackedChatBubble = memo(function TrackedChatBubble(
  props: Parameters<typeof ChatBubble>[0],
) {
  return <ChatBubble {...props} />;
});

// ========================================
// 1.2 ChatBubble 流式更新 generateCleanHtml 调用次数测试
// ========================================

describe('ChatBubble 流式更新 generateCleanHtml 调用次数', () => {
  beforeEach(() => {
    mockGenerateCleanHtml.mockClear();
    mockGenerateCleanHtml.mockImplementation((content: string) => `<p>${content}</p>`);
  });

  it('content 逐次增长时每次触发调用', () => {
    const contents = ['H', 'He', 'Hel', 'Hell', 'Hello'];
    const { rerender } = render(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content={contents[0]}
        isRunning={true}
      />,
    );

    for (let i = 1; i < contents.length; i++) {
      rerender(
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content={contents[i]}
          isRunning={true}
        />,
      );
    }

    // 总共 5 次（初始渲染 1 次 + 4 次 rerender）
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(5);
    contents.forEach(content => {
      expect(mockGenerateCleanHtml).toHaveBeenCalledWith(content);
    });
  });

  it('相同 content 的 rerender 不触发额外调用', () => {
    const { rerender } = render(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content="Hello"
        isRunning={true}
      />,
    );

    mockGenerateCleanHtml.mockClear();

    // isRunning 变化，content 不变
    rerender(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content="Hello"
        isRunning={false}
      />,
    );

    // ChatBubble 因 isRunning 变化而重渲染，但 useMemo([content]) 的 content 未变，
    // 不会重新调用 generateCleanHtml
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(0);
  });

  it('多个 ChatBubble 独立计算', () => {
    const { rerender } = render(
      <>
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="A"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="B"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="C"
          isRunning={false}
        />
      </>
    );

    // 初始渲染：3 个 ChatBubble 各调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(3);
    mockGenerateCleanHtml.mockClear();

    // 仅更新第 2 个的 content
    rerender(
      <>
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="A"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="B2"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="C"
          isRunning={false}
        />
      </>
    );

    // 仅第 2 个触发额外调用
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    expect(mockGenerateCleanHtml).toHaveBeenCalledWith('B2');
  });
});

// ========================================
// 1.3 ThinkingSection 推理内容更新调用次数测试
// ========================================

describe('ThinkingSection 推理内容更新 generateCleanHtml 调用次数', () => {
  beforeEach(() => {
    mockGenerateCleanHtml.mockClear();
    mockGenerateCleanHtml.mockImplementation((content: string) => `<p>${content}</p>`);
  });

  it('推理内容逐步增长时每次触发调用', () => {
    const contents = ['Step 1', 'Step 1\nStep 2', 'Step 1\nStep 2\nStep 3'];
    const { rerender } = render(
      <ThinkingSection title="思考中" content={contents[0]} loading={true} />,
    );

    for (let i = 1; i < contents.length; i++) {
      rerender(
        <ThinkingSection title="思考中" content={contents[i]} loading={true} />,
      );
    }

    // 总共 3 次（每次 content 变化触发 useMemo 重计算）
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(3);
    contents.forEach(content => {
      expect(mockGenerateCleanHtml).toHaveBeenCalledWith(content);
    });
  });

  it('content 不变时 title 或 loading 变化不触发调用', () => {
    const { rerender } = render(
      <ThinkingSection title="思考中" content="推理完成" loading={true} />,
    );

    // 初始渲染调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    mockGenerateCleanHtml.mockClear();

    // title 变化，content 不变
    rerender(
      <ThinkingSection title="思考完毕" content="推理完成" loading={true} />,
    );

    // loading 变化，content 不变
    rerender(
      <ThinkingSection title="思考完毕" content="推理完成" loading={false} />,
    );

    // generateCleanHtml 不应被再次调用（useMemo 依赖未变）
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(0);
  });
});
