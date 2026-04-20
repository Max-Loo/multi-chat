/**
 * Mock 工厂模块导出
 *
 * 提供统一的 Mock 工厂函数，用于创建 Tauri API、加密、存储等模块的 Mock 实例
 */

export * from './tauri';
export * from './toast';
export * from './crypto';
export * from './storage';
export * from './types';
export * from './redux';
export * from './router';
export * from './rawResponse';
export * from './chatPanel';
export * from './chatSidebar';
export * from './aiSdk';
// testState 中的 createModelSliceState 已通过 ./redux 导出，此处使用具名导出避免重复
export {
  createMockModel,
  createChatSliceState,
  createChatPageSliceState,
  createAppConfigSliceState,
  createModelProviderSliceState,
  createSettingPageSliceState,
  createModelPageSliceState,
  createTestRootState,
} from './testState';
// panelLayout 不在此处导出：它导入 react-redux 会在全局 setup 阶段触发 CJS/ESM 兼容性问题
// 需要的测试文件请直接 import from '@/__test__/helpers/mocks/panelLayout'
