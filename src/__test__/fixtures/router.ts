/**
 * Router 测试数据工厂
 * 
 * 提供路由配置测试所需的 Mock 数据
 */

import type { RouteObject } from 'react-router-dom';

/**
 * 获取路由配置结构数据
 * @returns 路由配置对象
 * @example
 * ```ts
 * const routes = getRouteStructure();
 * expect(routes[0].path).toBe('/');
 * ```
 */
export const getRouteStructure = (): RouteObject[] => [
  {
    path: '/',
    element: 'Layout',
    children: [
      {
        index: true,
        element: 'Navigate to chat',
      },
      {
        path: 'chat',
        element: 'ChatPage',
      },
      {
        path: 'model',
        element: 'ModelPage',
        children: [
          {
            index: true,
            element: 'Navigate to table',
          },
          {
            path: 'table',
            element: 'ModelTable',
          },
          {
            path: 'add',
            element: 'CreateModel',
          },
        ],
      },
      {
        path: 'setting',
        element: 'SettingPage',
        children: [
          {
            index: true,
            element: 'Navigate to common',
          },
          {
            path: 'common',
            element: 'GeneralSetting',
          },
        ],
      },
      {
        path: '*',
        element: 'Navigate to 404',
      },
      {
        path: '404',
        element: 'NotFound',
      },
    ],
  },
];

/**
 * 获取所有路由路径
 * @returns 路由路径数组
 * @example
 * ```ts
 * const routes = getAllRoutes();
 * expect(routes).toContain('/chat');
 * expect(routes).toContain('/model/table');
 * ```
 */
export const getAllRoutes = (): string[] => [
  '/',
  '/chat',
  '/model',
  '/model/table',
  '/model/add',
  '/setting',
  '/setting/common',
  '/404',
];

/**
 * 获取重定向规则
 * @returns 重定向规则映射
 * @example
 * ```ts
 * const rules = getRedirectRules();
 * expect(rules['/']).toBe('/chat');
 * ```
 */
export const getRedirectRules = (): Record<string, string> => ({
  '/': '/chat',
  '/model': '/model/table',
  '/setting': '/setting/common',
  '*': '/404',
});

/**
 * 获取无效路由路径（用于测试错误处理）
 * @returns 无效路由路径数组
 * @example
 * ```ts
 * const invalidRoutes = getInvalidRoutes();
 * expect(invalidRoutes).toContain('/invalid');
 * ```
 */
export const getInvalidRoutes = (): string[] => [
  '/invalid',
  '/model/invalid',
  '/setting/invalid',
  '/deeply/nested/invalid/path',
];

/**
 * 获取嵌套路由测试数据
 * @returns 嵌套路由路径和预期父路由
 * @example
 * ```ts
 * const nestedRoutes = getNestedRoutes();
 * expect(nestedRoutes[0].path).toBe('/model/table');
 * expect(nestedRoutes[0].parent).toBe('/model');
 * ```
 */
export const getNestedRoutes = (): Array<{ path: string; parent: string }> => [
  { path: '/model/table', parent: '/model' },
  { path: '/model/add', parent: '/model' },
  { path: '/setting/common', parent: '/setting' },
];
