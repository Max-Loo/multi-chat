/**
 * 导航配置共享 Mock
 *
 * 提供 BottomNav 相关测试共享的导航配置 mock 数据，
 * 消除 BottomNav.test.tsx 和 bottom-nav.integration.test.tsx 中的重复定义。
 */

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
