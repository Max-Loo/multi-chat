/**
 * 响应式布局模式切换集成测试
 *
 * 测试目标：验证不同布局模式下组件渲染差异
 * - Desktop 模式：渲染 Sidebar，无底部导航
 * - Mobile 模式：无 Sidebar，渲染底部导航（<nav>）
 * - 各断点边界正确处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { EnhancedStore } from '@reduxjs/toolkit';
import Layout from '@/components/Layout';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createTestRootState, createAppConfigSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { RootState } from '@/store';

// Mock react-i18next
vi.mock('react-i18next', () => globalThis.__mockI18n());

// 响应式状态 mock（通过 globalThis.__createResponsiveMock 创建可变对象）
const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

/**
 * 设置响应式状态
 */
function setResponsiveMode(mode: 'desktop' | 'compact' | 'compressed' | 'mobile') {
  const configs = {
    desktop: { layoutMode: 'desktop', width: 1280, isMobile: false, isCompact: false, isCompressed: false, isDesktop: true },
    compact: { layoutMode: 'compact', width: 900, isMobile: false, isCompact: true, isCompressed: false, isDesktop: false },
    compressed: { layoutMode: 'compressed', width: 1100, isMobile: false, isCompact: false, isCompressed: true, isDesktop: false },
    mobile: { layoutMode: 'mobile', width: 600, isMobile: true, isCompact: false, isCompressed: false, isDesktop: false },
  };
  Object.assign(mockResponsive, configs[mode]);
}

/**
 * 创建测试用 Redux Store
 */
function createLayoutTestStore(): EnhancedStore<RootState> {
  return createTypeSafeTestStore(createTestRootState({
    appConfig: createAppConfigSliceState({ language: 'zh' }),
    chatPage: createChatPageSliceState({ isShowChatPage: true }),
  }));
}

/**
 * 渲染 Layout 组件
 */
function renderLayout(store: EnhancedStore<RootState>) {
  return renderWithProviders(<Layout />, { store });
}

describe('响应式布局模式切换集成测试', () => {
  let store: EnhancedStore<RootState>;

  beforeEach(() => {
    store = createLayoutTestStore();
    setResponsiveMode('desktop');
  });

  
  describe('Desktop 模式', () => {
    it('应该渲染 Sidebar 且无底部导航', () => {
      setResponsiveMode('desktop');
      renderLayout(store);

      const layoutRoot = screen.getByTestId('layout-root');
      // Desktop 模式下 main 不是第一个子元素（Sidebar 在前面）
      const main = screen.getByRole('main');
      const children = Array.from(layoutRoot.children);
      expect(children.indexOf(main)).toBeGreaterThan(0);
      // 无底部导航（排除 Sidebar 的 nav）
      expect(screen.queryByRole('navigation', { name: '底部导航' })).toBeNull();
    });
  });

  describe('Mobile 模式', () => {
    it('应该渲染底部导航且无 Sidebar', () => {
      setResponsiveMode('mobile');
      renderLayout(store);

      const layoutRoot = screen.getByTestId('layout-root');
      // Mobile 模式下 main 是第一个子元素（无 Sidebar）
      const main = screen.getByRole('main');
      expect(layoutRoot.children[0]).toBe(main);
      // 有底部导航
      expect(screen.getByRole('navigation', { name: '底部导航' })).toBeInTheDocument();
    });
  });

  describe('模式切换', () => {
    it('Desktop 和 Mobile 布局结构不同', () => {
      // Desktop 模式
      setResponsiveMode('desktop');
      const { unmount: unmountDesktop } = renderLayout(store);
      expect(screen.queryByRole('navigation', { name: '底部导航' })).toBeNull();
      unmountDesktop();

      // Mobile 模式
      setResponsiveMode('mobile');
      renderLayout(store);
      expect(screen.getByRole('navigation', { name: '底部导航' })).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该正确处理断点边界值 768px', () => {
      Object.assign(mockResponsive, { layoutMode: 'compact', width: 768, isMobile: false, isCompact: true, isCompressed: false, isDesktop: false });
      renderLayout(store);
      expect(screen.getByTestId('layout-root')).toBeInTheDocument();
    });

    it('应该正确处理断点边界值 1024px', () => {
      Object.assign(mockResponsive, { layoutMode: 'compressed', width: 1024, isMobile: false, isCompact: false, isCompressed: true, isDesktop: false });
      renderLayout(store);
      expect(screen.getByTestId('layout-root')).toBeInTheDocument();
    });

    it('应该正确处理断点边界值 1280px', () => {
      setResponsiveMode('desktop');
      renderLayout(store);
      expect(screen.getByTestId('layout-root')).toBeInTheDocument();
    });
  });
});
