/**
 * ProviderLogo 组件单元测试
 *
 * 测试供应商 Logo 组件：
 * - 图片加载成功时 fade-in
 * - 图片加载失败时首字母回退
 * - 超时后首字母回退
 * - providerKey 变化时状态重置
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderLogo } from '@/components/ProviderLogo';

// Mock providerUtils
vi.mock('@/utils/providerUtils', () => ({
  getProviderLogoUrl: (key: string) => `https://example.com/logos/${key}.png`,
}));

describe('ProviderLogo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('应该显示首字母 当组件初始渲染', () => {
    render(<ProviderLogo providerKey="openai" providerName="OpenAI" />);

    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('应该显示图片 当图片加载成功', () => {
    render(<ProviderLogo providerKey="openai" providerName="OpenAI" />);

    // 使用更精确的选择器找到 img 元素
    const img = document.querySelector('img')!;
    expect(img).toBeInTheDocument();

    // 模拟图片加载成功
    fireEvent.load(img);

    // 首字母应该不可见（opacity 变为 0）
    const initialDiv = screen.getByText('O').closest('div');
    expect(initialDiv).toHaveStyle({ opacity: 0 });
  });

  it('应该显示首字母 当图片加载失败', () => {
    render(<ProviderLogo providerKey="openai" providerName="OpenAI" />);

    const img = document.querySelector('img')!;
    fireEvent.error(img);

    // 图片应该被移除（imgError=true 时不渲染 img）
    expect(document.querySelector('img')).toBeNull();

    // 首字母应该可见
    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('应该显示首字母 当图片加载超时 5 秒', () => {
    render(<ProviderLogo providerKey="openai" providerName="OpenAI" />);

    // 首字母初始可见
    expect(screen.getByText('O')).toBeInTheDocument();

    // 模拟 5 秒超时
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 图片应该被移除（超时触发 setImgError(true)）
    expect(document.querySelector('img')).toBeNull();

    // 首字母保持可见
    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('不应该超时回退 当图片在 5 秒内加载成功', () => {
    render(<ProviderLogo providerKey="openai" providerName="OpenAI" />);

    const img = document.querySelector('img')!;

    // 3 秒后图片加载成功
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.load(img);

    // 再过 2 秒（总共 5 秒）不应回退
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // 图片仍然存在
    expect(document.querySelector('img')).toBeInTheDocument();
  });

  it('应该重置状态 当 providerKey 变化', () => {
    const { rerender } = render(
      <ProviderLogo providerKey="openai" providerName="OpenAI" />
    );

    // 加载第一个 logo
    const img = document.querySelector('img')!;
    fireEvent.load(img);

    // 切换 providerKey
    rerender(
      <ProviderLogo providerKey="anthropic" providerName="Anthropic" />
    );

    // 应该显示新的首字母
    expect(screen.getByText('A')).toBeInTheDocument();

    // 新图片应该存在
    expect(document.querySelector('img')).toBeInTheDocument();
  });

  it('应该使用大写首字母', () => {
    render(<ProviderLogo providerKey="kimi" providerName="kimi" />);

    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('应该应用自定义 size', () => {
    const { container } = render(
      <ProviderLogo providerKey="openai" providerName="OpenAI" size={60} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('应该使用默认 size 40', () => {
    const { container } = render(
      <ProviderLogo providerKey="openai" providerName="OpenAI" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '40px', height: '40px' });
  });
});
