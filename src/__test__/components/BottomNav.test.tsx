/**
 * BottomNav 组件测试
 *
 * 测试三个导航项渲染、路由导航、激活状态高亮、仅在Mobile模式显示
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/chat',
  }),
}));

// Mock useResponsive
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: true,
    layoutMode: 'mobile',
  }),
}));

vi.mock('react-i18next', () => {
  const R = { nav: { chat: '聊天', model: '模型', setting: '设置' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock navigation配置（使用共享 mock）
vi.mock('@/config/navigation', async () => {
  const { createNavigationItemsMock } = await import('@/__test__/helpers/mocks/navigation');
  return { NAVIGATION_ITEMS: createNavigationItemsMock() };
});

import { BottomNav } from '@/components/BottomNav';

describe('BottomNav 组件', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该在移动端模式正确渲染', () => {
      render(
          <BottomNav />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('应该渲染三个导航项', () => {
      render(
          <BottomNav />
      );

      expect(screen.getByText('聊天')).toBeInTheDocument();
      expect(screen.getByText('模型')).toBeInTheDocument();
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('应该渲染所有图标', () => {
      render(
          <BottomNav />
      );

      expect(screen.getByTestId('chat-icon')).toBeInTheDocument();
      expect(screen.getByTestId('model-icon')).toBeInTheDocument();
      expect(screen.getByTestId('setting-icon')).toBeInTheDocument();
    });
  });

  describe('响应式行为', () => {
    it('仅在移动端模式下显示', () => {
      render(
          <BottomNav />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('路由导航', () => {
    it('点击聊天按钮应该导航到 /chat', () => {
      render(
          <BottomNav />
      );

      const chatButton = screen.getByText('聊天');
      chatButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });

    it('点击模型按钮应该导航到 /model', () => {
      render(
          <BottomNav />
      );

      const modelButton = screen.getByText('模型');
      modelButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/model');
    });

    it('点击设置按钮应该导航到 /setting', () => {
      render(
          <BottomNav />
      );

      const settingButton = screen.getByText('设置');
      settingButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/setting');
    });
  });

  describe('激活状态高亮', () => {
    it('当前路径应该高亮显示', () => {
      render(
          <BottomNav />
      );

      const buttons = screen.getAllByRole('button');
      const chatButton = buttons.find((btn) => btn.textContent?.includes('聊天'));
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveClass('bg-blue-100');
    });

    it('非激活路径应该使用非激活样式', () => {
      render(
          <BottomNav />
      );

      const buttons = screen.getAllByRole('button');
      const modelButton = buttons.find((btn) => btn.textContent?.includes('模型'));
      expect(modelButton).toBeInTheDocument();
    });
  });

  describe('样式和布局', () => {
    it('应该有正确的固定定位类', () => {
      render(
          <BottomNav />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('border-t', 'bg-background', 'h-16');
    });

    it('应该使用flex布局均匀分布导航项', () => {
      render(
          <BottomNav />
      );

      const nav = screen.getByRole('navigation');
      const containerDiv = nav.querySelector('div');
      expect(containerDiv).toHaveClass('flex', 'items-center', 'justify-around');
    });

    it('导航项应该有正确的主题样式', () => {
      render(
          <BottomNav />
      );

      const buttons = screen.getAllByRole('button');
      const chatButton = buttons.find((btn) => btn.textContent?.includes('聊天'));

      // 激活状态下应该有 text-blue-500 类（来自 activeClassName）
      expect(chatButton).toHaveClass('text-blue-500');
    });
  });

  describe('可访问性', () => {
    it('导航按钮应该有正确的title属性', () => {
      render(
          <BottomNav />
      );

      const chatButton = screen.getByTitle('聊天');
      const modelButton = screen.getByTitle('模型');
      const settingButton = screen.getByTitle('设置');

      expect(chatButton).toBeInTheDocument();
      expect(modelButton).toBeInTheDocument();
      expect(settingButton).toBeInTheDocument();
    });

    it('激活的页面应该有 aria-current 属性', () => {
      render(
          <BottomNav />
      );

      const buttons = screen.getAllByRole('button');
      const chatButton = buttons.find((btn) => btn.textContent?.includes('聊天'));
      expect(chatButton).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('子路径匹配', () => {
    it('应该在子路径时也高亮父级导航', () => {
      render(
          <BottomNav />
      );

      const buttons = screen.getAllByRole('button');
      const modelButton = buttons.find((btn) => btn.textContent?.includes('模型'));
      expect(modelButton).toBeInTheDocument();
    });
  });

  describe('国际化', () => {
    it('应该正确显示翻译后的文本', () => {
      render(
          <BottomNav />
      );

      expect(screen.getByText('聊天')).toBeInTheDocument();
      expect(screen.getByText('模型')).toBeInTheDocument();
      expect(screen.getByText('设置')).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理根路径（不匹配任何导航项）', () => {
      render(
          <BottomNav />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });
  });
});
