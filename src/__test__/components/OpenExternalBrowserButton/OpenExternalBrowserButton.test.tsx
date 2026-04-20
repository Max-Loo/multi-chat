/**
 * OpenExternalBrowserButton 组件单元测试
 *
 * 测试外部浏览器按钮：
 * - 无 URL 时不渲染可见内容
 * - 有 URL 时渲染按钮并可点击导航
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OpenExternalBrowserButton from '@/components/OpenExternalBrowserButton';

// Mock hook
const mockNavToExternalSite = vi.fn();
vi.mock('@/hooks/useNavigateToExternalSite', () => ({
  useNavigateToExternalSite: () => ({
    navToExternalSite: mockNavToExternalSite,
  }),
}));

describe('OpenExternalBrowserButton', () => {
  beforeEach(() => {
    mockNavToExternalSite.mockClear();
  });

  it('应该不渲染可见内容 当 siteUrl 为 undefined', () => {
    const { container } = render(
      <OpenExternalBrowserButton siteUrl={undefined} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('应该渲染按钮 当 siteUrl 有值', () => {
    render(
      <OpenExternalBrowserButton siteUrl="https://example.com" />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('应该调用导航函数 当点击按钮', () => {
    render(
      <OpenExternalBrowserButton siteUrl="https://example.com" />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavToExternalSite).toHaveBeenCalledWith('https://example.com');
  });

  it('应该传递 className 到按钮', () => {
    render(
      <OpenExternalBrowserButton
        siteUrl="https://example.com"
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });
});
