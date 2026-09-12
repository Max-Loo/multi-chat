/**
 * 通用测试工具函数
 *
 * 提供可复用的测试辅助函数，简化测试代码编写
 * 此文件重新导出项目中已有的测试工具函数，并提供额外的组合工具函数
 */

/**
 * 用于测试的类型强制转换，替代 as unknown as 模式
 * @param value 需要转换的值
 * @returns 强制转换为目标类型的值
 */
export function asTestType<T>(value: unknown): T {
  return value as T;
}

// 重新导出 Chat fixtures (从 @/__test__/fixtures/chat 导入)
export { createMockMessage } from '@/__test__/fixtures/chat';

// 重新导出 Chat Mocks (从 mocks/chatSidebar 导入)
export { createMockChat } from './mocks/chatSidebar';
