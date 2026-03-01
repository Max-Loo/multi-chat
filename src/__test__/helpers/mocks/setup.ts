/**
 * Mock 全局配置
 * 
 * 提供统一的 Mock 初始化和配置入口
 */

import { createTauriMocks } from './tauri';
import type { TauriMockOptions } from './types';

// 全局 Mock 实例
let globalMocks: ReturnType<typeof createTauriMocks> | null = null;

/**
 * 默认 Mock 策略配置
 */
export const defaultMockStrategy = {
  /** 默认 Mock 的 Tauri 模块 */
  autoMockModules: ['shell', 'os', 'http', 'store'] as const,
  /** 不自动 Mock 的模块（需要真实实现） */
  noAutoMockModules: ['keyring'] as const,
};

/**
 * Mock 配置选项
 */
export interface MockConfigOptions extends TauriMockOptions {
  /** 是否自动应用 Mock 到模块 */
  autoApply?: boolean;
}

/**
 * 设置全局 Mock
 * @param options Mock 配置选项
 */
export const setupGlobalMocks = (options: MockConfigOptions = {}): void => {
  const defaultOptions: MockConfigOptions = {
    isTauri: true,
    autoApply: false,
  };
  const config = { ...defaultOptions, ...options };

  // 创建全局 Mock 实例
  globalMocks = createTauriMocks(config);

  // 如果需要自动应用 Mock
  if (config.autoApply) {
    // 自动 Mock 模块（通过 vi.mock）
    // 注意：这里不实际调用 vi.mock，因为它们需要在模块加载前设置
    // 实际的 Mock 需要在 setup.ts 中通过 vi.mock() 设置
  }
};

/**
 * 获取全局 Mock 实例
 * @returns 全局 Mock 实例
 */
export const getGlobalMocks = (): ReturnType<typeof createTauriMocks> => {
  if (!globalMocks) {
    throw new Error('全局 Mock 未初始化，请先调用 setupGlobalMocks()');
  }
  return globalMocks;
};

/**
 * 重置全局 Mock
 */
export const resetGlobalMocks = (): void => {
  if (globalMocks) {
    globalMocks.resetAll();
  }
};

/**
 * 更新全局 Mock 配置
 * @param options 新的配置选项
 */
export const configureGlobalMocks = (options: TauriMockOptions): void => {
  if (globalMocks) {
    globalMocks.configure(options);
  }
};
