/**
 * ProviderLogo 组件测试
 *
 * 验证首字母降级、加载成功淡入、失败/超时回退与 providerKey 变化重置
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import ProviderLogo from '@/components/ProviderLogo/ProviderLogo.vue';

describe('ProviderLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始渲染时应该显示大写首字母占位', () => {
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'openai', providerName: 'openai' },
    });

    expect(screen.getByText('O')).toBeInTheDocument();
    expect(container.querySelector('[role="img"]')).toHaveAttribute(
      'aria-label',
      'openai logo',
    );
  });

  it('图片加载成功后应该淡入图片', async () => {
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'openai', providerName: 'OpenAI' },
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', expect.stringContaining('openai'));

    await fireEvent(img!, new Event('load'));

    // 图片层 opacity 变为 1，占位层隐藏
    const imgWrapper = img!.parentElement!;
    expect(imgWrapper.style.opacity).toBe('1');
  });

  it('图片加载失败时应该保持首字母降级', async () => {
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'bad-provider', providerName: 'Bad' },
    });

    const img = container.querySelector('img');
    await fireEvent(img!, new Event('error'));

    // 图片层被移除，占位层保持可见
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('图片加载超时 5 秒后应该回退到首字母', async () => {
    vi.useFakeTimers();
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'slow-provider', providerName: 'Slow' },
    });

    await vi.advanceTimersByTimeAsync(5000);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('图片在 5 秒内加载成功则不应超时回退', async () => {
    vi.useFakeTimers();
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'fast-provider', providerName: 'Fast' },
    });

    const img = container.querySelector('img');
    await fireEvent(img!, new Event('load'));
    await vi.advanceTimersByTimeAsync(6000);

    expect(container.querySelector('img')).not.toBeNull();
  });

  it('providerKey 变化时应该重置状态并重新挂载图片', async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(ProviderLogo, {
      props: { providerKey: 'provider-a', providerName: 'A' },
    });

    // 触发失败进入降级
    await fireEvent(container.querySelector('img')!, new Event('error'));
    expect(container.querySelector('img')).toBeNull();

    // 切换 provider：重新显示新图片
    await rerender({ providerKey: 'provider-b', providerName: 'B' });
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('provider-b'),
    );
  });

  it('应该应用自定义 size', () => {
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'openai', providerName: 'OpenAI', size: 64 },
    });

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe('64px');
    expect(root.style.height).toBe('64px');
  });

  it('默认 size 应为 40', () => {
    const { container } = render(ProviderLogo, {
      props: { providerKey: 'openai', providerName: 'OpenAI' },
    });

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe('40px');
  });
});
