/**
 * 导航配置共享 Mock
 *
 * 提供 BottomNav 相关测试共享的导航配置 mock 数据，
 * 消除 BottomNav.test.tsx 和 bottom-nav.integration.test.tsx 中的重复定义。
 */

import { vi } from 'vitest';

/**
 * 创建 useNavigateToPage 模块 mock
 *
 * 同构 mock 模板收敛入口（7 个测试文件共用）：默认提供可断言的
 * navigateToChat / clearChatIdParam vi.fn()，需要文件级断言接线时经
 * vi.hoisted 创建变量后通过 overrides 注入。
 *
 * @param overrides 覆盖返回的 mock 函数
 */
export const createNavigateToPageModuleMock = (overrides?: {
  navigateToChat?: ReturnType<typeof vi.fn>;
  clearChatIdParam?: ReturnType<typeof vi.fn>;
}) => {
  const navigateToChat = overrides?.navigateToChat ?? vi.fn();
  const clearChatIdParam = overrides?.clearChatIdParam ?? vi.fn();
  return {
    useNavigateToChat: vi.fn(() => ({ navigateToChat, clearChatIdParam })),
  };
};

/**
 * 创建导航配置 mock 数据
 * @returns mock 的 NAVIGATION_ITEMS 数组
 */
export const createNavigationItemsMock = () => [
  {
    id: 'chat',
    path: '/chat',
    i18nKey: 'nav.chat',
    IconComponent: () => <svg data-testid="chat-icon" />,
    theme: {
      base: 'text-blue-400',
      active: 'bg-blue-100 text-blue-500',
      inactive: 'hover:text-blue-500 hover:bg-blue-100',
    },
  },
  {
    id: 'model',
    path: '/model',
    i18nKey: 'nav.model',
    IconComponent: () => <svg data-testid="model-icon" />,
    theme: {
      base: 'text-emerald-400',
      active: 'bg-emerald-100 text-emerald-500',
      inactive: 'hover:text-emerald-500 hover:bg-emerald-100',
    },
  },
  {
    id: 'setting',
    path: '/setting',
    i18nKey: 'nav.setting',
    IconComponent: () => <svg data-testid="setting-icon" />,
    theme: {
      base: 'text-violet-400',
      inactive: 'hover:text-violet-500 hover:bg-violet-100',
      active: 'bg-violet-100 text-violet-500',
    },
  },
];
