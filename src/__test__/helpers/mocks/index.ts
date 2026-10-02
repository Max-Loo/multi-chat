/**
 * Mock 工厂模块导出
 *
 * 提供统一的 Mock 工厂函数，用于创建加密、存储等模块的 Mock 实例
 */

export * from './toast';
export * from './storage';
export * from './aiSdk';
export { createMockModel } from '@/__test__/helpers/fixtures/model';
export { createMockChat, asTestType } from '@/__test__/helpers/testing-utils';
