/**
 * 底部导航栏集成测试（Vue 版）
 *
 * 测试目标：验证底部导航栏的渲染、点击导航与激活状态
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { BottomNav } from '@/components/BottomNav';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      navigation: { chat: '聊天', model: '模型', setting: '设置' },
      common: { a11y: { bottomNav: '底部导航' } },
    }).useTranslation(),
}));

vi.mock('@/composables/useResponsive', async () => {
  const { computed } = await import('vue');
  return {
    useResponsive: () => ({
      isMobile: computed(() => true),
      layoutMode: computed(() => 'mobile'),
    }),
  };
});

/** 创建带初始路径的内存路由 */
function createTestRouter(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/chat', component: { template: '<div />' } },
      { path: '/model', component: { template: '<div />' } },
      { path: '/setting', component: { template: '<div />' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  });
  router.push(initialPath);
  return router.isReady().then(() => router);
}

/** 渲染带路由与 Pinia 的 BottomNav */
async function renderBottomNav(initialPath = '/chat') {
  const router = await createTestRouter(initialPath);
  const result = render(BottomNav, {
    global: { plugins: [router] },
  });
  return { ...result, router };
}

describe('底部导航栏集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该渲染底部导航栏与三个导航项', async () => {
    await renderBottomNav();

    expect(screen.getByRole('navigation', { name: '底部导航' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '聊天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '模型' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument();
  });

  it('点击导航项应该触发路由跳转', async () => {
    const { router } = await renderBottomNav('/chat');

    await fireEvent.click(screen.getByRole('button', { name: '模型' }));
    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/model');
    });

    await fireEvent.click(screen.getByRole('button', { name: '设置' }));
    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/setting');
    });
  });

  it('在 /chat 路径时聊天按钮应该有激活标识', async () => {
    await renderBottomNav('/chat');

    expect(screen.getByRole('button', { name: '聊天' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: '模型' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('在 /model 路径时模型按钮应该有激活标识', async () => {
    await renderBottomNav('/model');

    expect(screen.getByRole('button', { name: '模型' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('在 /setting 路径时设置按钮应该有激活标识', async () => {
    await renderBottomNav('/setting');

    expect(screen.getByRole('button', { name: '设置' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('子路径 /model/add 时模型按钮应该激活', async () => {
    await renderBottomNav('/model/add');

    expect(screen.getByRole('button', { name: '模型' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('根路径 / 不应该激活任何按钮', async () => {
    await renderBottomNav('/');

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('aria-current', 'page');
    });
  });

  it('快速连续点击不应该抛出错误', async () => {
    const { router } = await renderBottomNav('/chat');

    await expect(
      Promise.all([
        fireEvent.click(screen.getByRole('button', { name: '模型' })),
        fireEvent.click(screen.getByRole('button', { name: '设置' })),
        fireEvent.click(screen.getByRole('button', { name: '聊天' })),
      ]),
    ).resolves.not.toThrow();

    expect(router.currentRoute.value.path).toBe('/chat');
  });
});
