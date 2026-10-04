/**
 * MobileDrawer 组件测试
 *
 * 验证打开状态渲染、插槽内容、可访问性属性与关闭按钮控制
 */

import { nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { MobileDrawer } from '@/components/MobileDrawer';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      navigation: {
        mobileDrawer: {
          title: '导航抽屉',
          description: '应用导航菜单',
          ariaDescription: '侧边导航抽屉',
        },
      },
    }).useTranslation(),
}));

describe('MobileDrawer 组件', () => {
  it('应该在打开状态时渲染插槽内容', async () => {
    render(MobileDrawer, {
      props: { open: true },
      slots: { default: '<div data-testid="drawer-content">菜单内容</div>' },
    });
    await nextTick();

    expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    expect(screen.getByText('菜单内容')).toBeInTheDocument();
  });

  it('应该渲染 sr-only 的标题与描述（可访问性）', async () => {
    render(MobileDrawer, { props: { open: true } });
    await nextTick();

    const title = screen.getByText('导航抽屉');
    const description = screen.getByText('应用导航菜单');

    expect(title).toHaveClass('sr-only');
    expect(description).toHaveClass('sr-only');
  });

  it('应该有 aria-description 属性', async () => {
    render(MobileDrawer, { props: { open: true } });
    await nextTick();

    // 抽屉内容经 reka Portal 传送至 document.body
    const content = document.querySelector('[data-slot="sheet-content"]');
    expect(content).toHaveAttribute('aria-description', '侧边导航抽屉');
  });

  it('应该从左侧滑出（side=left 的定位类）', async () => {
    render(MobileDrawer, { props: { open: true } });
    await nextTick();

    const content = document.querySelector('[data-slot="sheet-content"]');
    expect(content?.className).toContain('left-0');
  });

  it('默认应该显示关闭按钮', async () => {
    render(MobileDrawer, { props: { open: true } });
    await nextTick();

    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('应该支持隐藏关闭按钮（showCloseButton=false）', async () => {
    render(MobileDrawer, {
      props: { open: true, showCloseButton: false },
    });
    await nextTick();

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });
});
