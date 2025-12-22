/**
 * 创建测试用的应用配置数据
 * @param overrides 覆盖默认属性
 * @returns 应用配置对象
 */
export const createMockAppConfig = (overrides: Record<string, unknown> = {}) => {
  return {
    language: 'en',
    ...overrides,
  };
};