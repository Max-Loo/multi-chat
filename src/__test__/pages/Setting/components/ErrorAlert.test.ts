/**
 * ErrorAlert 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ErrorAlert.test.tsx，保留核心语义：
 * - error 非空时显示错误信息与前缀、错误图标
 * - error 为 null/空字符串时不渲染
 * - 边界情况（长文本、特殊字符）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import ErrorAlert from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ErrorAlert.vue';

describe('ErrorAlert（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示错误信息当 error 不为 null', () => {
    render(ErrorAlert, { props: { error: '网络连接失败' } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/刷新失败: 网络连接失败/)).toBeInTheDocument();
  });

  it('应该显示错误图标', () => {
    render(ErrorAlert, { props: { error: '网络连接失败' } });

    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();
  });

  it('不应该渲染任何内容当 error 为 null', () => {
    render(ErrorAlert, { props: { error: null } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('不应该渲染任何内容当 error 为空字符串', () => {
    render(ErrorAlert, { props: { error: '' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('应该处理长错误信息', () => {
    const longError = 'E'.repeat(500);
    render(ErrorAlert, { props: { error: longError } });

    expect(screen.getByText(new RegExp(longError))).toBeInTheDocument();
  });

  it('应该处理特殊字符', () => {
    render(ErrorAlert, { props: { error: '<script>alert("x")</script>' } });

    expect(
      screen.getByText(/刷新失败: <script>alert\("x"\)<\/script>/),
    ).toBeInTheDocument();
  });
});
