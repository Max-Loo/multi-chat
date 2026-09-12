/**
 * Vue NotFound 页面测试
 *
 * 行为基线与迁移前 React 版一致：
 * - 渲染 404 图标、大号数字、标题与描述（i18n）
 * - 返回按钮点击返回上一页（router.back 语义）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mockGo = vi.hoisted(() => vi.fn());

vi.mock('vue-router', () => ({
  useRouter: () => ({ go: mockGo, back: mockGo, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    common: {
      pageNotFound: '页面未找到',
      pageNotFoundDescription: '页面描述',
      goBack: '返回上一页',
    },
  }));

import NotFound from '@/pages/NotFound.vue';

describe('NotFound（Vue 版）', () => {
  beforeEach(() => {
    mockGo.mockClear();
  });

  it('渲染 404 大号数字与错误图标', () => {
    render(NotFound);

    expect(screen.getByText('404')).toBeVisible();
    expect(screen.getByRole('img', { name: 'error' })).toBeVisible();
  });

  it('渲染 i18n 标题与描述', () => {
    render(NotFound);

    expect(screen.getByText('页面未找到')).toBeVisible();
    expect(screen.getByText('页面描述')).toBeVisible();
  });

  it('点击返回按钮返回上一页', async () => {
    render(NotFound);

    const backButton = screen.getByRole('button', { name: '返回上一页' });
    expect(backButton).toBeEnabled();

    await fireEvent.click(backButton);

    expect(mockGo).toHaveBeenCalledWith(-1);
  });
});
