/**
 * StreamingContent / ThinkingSection 组件测试
 * （转写自 React components/chat 测试）
 */

import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { render, fireEvent } from '@testing-library/vue';
import StreamingContent from '@/components/chat/StreamingContent.vue';
import ThinkingSection from '@/components/chat/ThinkingSection.vue';

describe('StreamingContent', () => {
  it('非流式状态应该完整渲染 Markdown HTML', () => {
    const { container } = render(StreamingContent, {
      props: { content: '# 标题\n\n正文', isRunning: false },
    });

    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.textContent).toContain('正文');
  });

  it('流式状态应该渲染冻结块与活跃块', async () => {
    const { container, rerender } = render(StreamingContent, {
      props: { content: '第一段', isRunning: true },
    });

    // 推进内容：产生冻结块
    await rerender({ content: '第一段\n\n第二段', isRunning: true });
    await nextTick();

    // 完整内容应可见（冻结 + 活跃）
    expect(container.textContent).toContain('第一段');
    expect(container.textContent).toContain('第二段');
  });

  it('内容缩短时应该重置缓存并完整重渲染', async () => {
    const { container, rerender } = render(StreamingContent, {
      props: { content: '长内容第一段\n\n第二段', isRunning: true },
    });
    await rerender({ content: '回退', isRunning: true });
    await nextTick();

    expect(container.textContent).toContain('回退');
    expect(container.textContent).not.toContain('第一段');
  });

  it('非流式结束后应执行一次完整渲染', async () => {
    const { container, rerender } = render(StreamingContent, {
      props: { content: '内容**加粗**', isRunning: true },
    });

    await rerender({ content: '内容**加粗**', isRunning: false });
    await nextTick();

    expect(container.querySelector('strong')).toBeInTheDocument();
  });

  it('应该清理 XSS 攻击代码', () => {
    const { container } = render(StreamingContent, {
      props: {
        content: '<script>alert(1)</script>正常内容<img src=x onerror="alert(1)">',
        isRunning: false,
      },
    });

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('正常内容');
  });
});

describe('ThinkingSection', () => {
  it('默认应该折叠推理内容', () => {
    const { container } = render(ThinkingSection, {
      props: { title: '思考完毕', content: '推理内容' },
    });

    expect(container.textContent).toContain('思考完毕');
    expect(container.textContent).not.toContain('推理内容');
  });

  it('点击标题应该展开推理内容', async () => {
    const { container, getByRole } = render(ThinkingSection, {
      props: { title: '思考完毕', content: '推理内容' },
    });

    await fireEvent.click(getByRole('button'));

    expect(container.textContent).toContain('推理内容');
  });

  it('加载状态应该渲染 loading 标识', () => {
    const { getByTestId, queryByTestId } = render(ThinkingSection, {
      props: { title: '思考中', content: '', loading: true },
    });

    expect(getByTestId('thinking-loading')).toBeInTheDocument();
    expect(queryByTestId('chevron-right')).toBeInTheDocument();
  });

  it('aria-expanded 应该随展开状态变化', async () => {
    const { getByRole } = render(ThinkingSection, {
      props: { title: '思考', content: '内容' },
    });

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
