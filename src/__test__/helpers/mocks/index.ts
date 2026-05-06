/**
 * Mock 工厂模块导出
 *
 * 提供统一的 Mock 工厂函数，用于创建 Tauri API、加密、存储等模块的 Mock 实例
 */

export * from './toast';
export * from './storage';
export * from './router';
export * from './chatPanel';
export * from './chatSidebar';
export * from './aiSdk';
export {
  createModelSliceState,
  createMockModel,
  createChatSliceState,
  createChatPageSliceState,
  createAppConfigSliceState,
  createModelProviderSliceState,
  createModelPageSliceState,
  createTestRootState,
} from './testState';
// panelLayout 不在此处导出：它导入 react-redux 会在全局 setup 阶段触发 CJS/ESM 兼容性问题
// 需要的测试文件请直接 import from '@/__test__/helpers/mocks/panelLayout'
