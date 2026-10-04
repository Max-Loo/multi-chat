/**
 * NoProvidersAvailable 组件测试
 *
 * 验证错误信息展示、可访问性与重新加载交互
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import NoProvidersAvailable from '@/components/NoProvidersAvailable.vue';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: {
        noProvidersAvailable: '无可用的模型供应商',
        noProvidersDescription: '应用无法连接模型服务器',
        noProvidersHint: '请检查网络连接后重试',
        reload: '重新加载',
        errorIcon: '错误',
      },
    }).useTranslation(),
}));

describe('NoProvidersAvailable', () => {
  it('应该显示错误标题、描述与提示信息', () => {
    render(NoProvidersAvailable);

    expect(screen.getByText('无可用的模型供应商')).toBeInTheDocument();
    expect(screen.getByText('应用无法连接模型服务器')).toBeInTheDocument();
    expect(screen.getByText('请检查网络连接后重试')).toBeInTheDocument();
  });

  it('错误容器必须有 alert 角色', () => {
    const { container } = render(NoProvidersAvailable);

    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('错误图标必须有 img 角色和正确的标签', () => {
    const { container } = render(NoProvidersAvailable);

    const icon = container.querySelector('[data-testid="no-providers-icon"]');
    expect(icon).toHaveAttribute('role', 'img');
    expect(icon).toHaveAttribute('aria-label', '错误');
  });

  it('点击重新加载按钮应该调用 window.location.reload', async () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(NoProvidersAvailable);

    await fireEvent.click(screen.getByRole('button', { name: '重新加载' }));

    expect(reloadSpy).toHaveBeenCalled();
    reloadSpy.mockRestore();
  });
});
