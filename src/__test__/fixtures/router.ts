/**
 * Router 测试数据工厂
 *
 * 提供路由配置测试所需的 Mock 数据
 */

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

