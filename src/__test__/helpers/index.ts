/**
 * 测试辅助工具统一导出
 *
 * 提供统一的 Mock 工厂、测试数据、断言和环境隔离工具
 */

// Mock 工厂
export * from './mocks';

// 测试数据工厂
export * from './fixtures';

// 自定义断言
export * from './assertions';

// 环境隔离
export * from './isolation';

// render 不在此处导出：render/index.ts 无导出内容，会触发 TS2306
// 需要的测试文件请直接 import from '@/__test__/helpers/render/redux'

// 通用测试工具函数
export * from './testing-utils';
