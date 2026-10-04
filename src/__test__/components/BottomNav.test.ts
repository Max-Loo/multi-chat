/**
 * BottomNav 组件测试
 *
 * 验证仅移动端渲染、导航项点击与激活高亮
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { BottomNav } from '@/components/BottomNav';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  currentPath: '/chat',
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: routerMock.currentPath }),
  useRouter: () => ({ push: routerMock.push }),
}));

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      navigation: { chat: '聊天', model: '模型', setting: '设置' },
      common: { a11y: { bottomNav: '底部导航' } },
    }).useTranslation(),
}));

// useResponsive mock：可变 isMobile
const responsiveMock = vi.hoisted(() => ({ isMobile: true }));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => responsiveMock,
}));

describe('BottomNav 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMock.currentPath = '/chat';
    responsiveMock.isMobile = true;
  });

  it('应该在桌面模式下不渲染', () => {
    responsiveMock.isMobile = false;

    const { container } = render(BottomNav);

    expect(container.querySelector('nav')).toBeNull();
  });

  it('应该在移动端模式渲染三个导航项', () => {
    render(BottomNav);

    expect(screen.getByRole('button', { name: '聊天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '模型' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument();
  });

  it('点击导航按钮应该导航到对应路径', async () => {
    render(BottomNav);

    await fireEvent.click(screen.getByRole('button', { name: '模型' }));
    await fireEvent.click(screen.getByRole('button', { name: '设置' }));

    expect(routerMock.push).toHaveBeenCalledWith('/model');
    expect(routerMock.push).toHaveBeenCalledWith('/setting');
  });

  it('当前路径的导航项应该有 aria-current 高亮', () => {
    routerMock.currentPath = '/model';
    render(BottomNav);

    expect(screen.getByRole('button', { name: '模型' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: '聊天' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('导航容器应该有可访问性标签', () => {
    render(BottomNav);

    expect(
      screen.getByRole('navigation', { name: '底部导航' }),
    ).toBeInTheDocument();
  });
});
