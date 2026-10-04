/**
 * OpenExternalBrowserButton 组件测试
 *
 * 验证 siteUrl 条件渲染与外链打开调用
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import OpenExternalBrowserButton from '@/components/OpenExternalBrowserButton/OpenExternalBrowserButton.vue';

const openExternalMock = vi.hoisted(() => ({ openExternal: vi.fn() }));

vi.mock('@/utils/openExternal', () => openExternalMock);

describe('OpenExternalBrowserButton', () => {
  it('siteUrl 为 undefined 时应该不渲染可见内容', () => {
    const { container } = render(OpenExternalBrowserButton, {
      props: { siteUrl: undefined },
    });

    expect(container.querySelector('button')).toBeNull();
  });

  it('siteUrl 有值时应该渲染按钮', () => {
    render(OpenExternalBrowserButton, { props: { siteUrl: 'https://example.com' } });

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('点击按钮应该以 URL 调用外链打开函数', async () => {
    render(OpenExternalBrowserButton, {
      props: { siteUrl: 'https://example.com' },
    });

    await fireEvent.click(screen.getByRole('button'));

    expect(openExternalMock.openExternal).toHaveBeenCalledWith('https://example.com');
  });
});
