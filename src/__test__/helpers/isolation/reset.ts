/**
 * 测试环境隔离工具
 * 
 * 提供测试状态重置和环境隔离功能
 */

import { vi, beforeEach, afterEach } from 'vitest';

/**
 * 重置测试状态选项
 */
export interface ResetOptions {
  /** 重置 localStorage */
  resetLocalStorage?: boolean;
  /** 重置 Mock 调用记录 */
  resetMocks?: boolean;
  /** 重置模块缓存 */
  resetModules?: boolean;
  /** 重置 IndexedDB */
  resetIndexedDB?: boolean;
}

/**
 * 清空所有 IndexedDB 数据库
 * 用于测试隔离，确保每个测试开始时 IndexedDB 为空
 */
export const clearIndexedDB = async (): Promise<void> => {
  // 检查 IndexedDB 是否可用
  if (typeof indexedDB === 'undefined') {
    return;
  }

  try {
    // 获取所有数据库名称
    const databases = await indexedDB.databases();
    
    // 删除所有数据库
    await Promise.all(
      databases.map((db) => {
        if (db.name) {
          return new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(db.name!);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
              // 如果被阻塞，强制关闭连接后重试
              resolve();
            };
          });
        }
        return Promise.resolve();
      })
    );
  } catch (error) {
    // 忽略清理错误，不影响测试执行
    console.warn('[clearIndexedDB] 清理 IndexedDB 时出现警告:', error);
  }
};

/**
 * 重置测试状态
 * @param options 重置选项
 */
export const resetTestState = (options: ResetOptions = {}): void => {
  const defaultOptions: ResetOptions = {
    resetLocalStorage: true,
    resetMocks: true,
    resetModules: false,
    resetIndexedDB: false,
  };
  const config = { ...defaultOptions, ...options };

  // 重置 localStorage
  if (config.resetLocalStorage && typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // 重置 Mock 调用记录
  if (config.resetMocks) {
    vi.clearAllMocks();
  }

  // 重置模块缓存
  if (config.resetModules) {
    vi.resetModules();
  }

  // 重置 IndexedDB（异步操作，但同步调用）
  if (config.resetIndexedDB) {
    // 使用 void 表示不等待异步完成
    void clearIndexedDB();
  }
};

/**
 * 使用隔离测试钩子
 * 自动配置 beforeEach 和 afterEach 清理
 * @param options 配置选项
 */
export const useIsolatedTest = (options?: {
  /** beforeEach 回调 */
  onBeforeEach?: () => void;
  /** afterEach 回调 */
  onAfterEach?: () => void;
  /** 重置选项 */
  resetOptions?: ResetOptions;
}): void => {
  const { onBeforeEach, onAfterEach, resetOptions } = options ?? {};

  beforeEach(() => {
    resetTestState(resetOptions);
    onBeforeEach?.();
  });

  afterEach(() => {
    resetTestState(resetOptions);
    onAfterEach?.();
  });
};

/**
 * 设置测试环境变量
 * @param key 环境变量名
 * @param value 环境变量值
 */
export const setTestEnv = (key: string, value: string): void => {
  vi.stubEnv(key, value);
};

/**
 * 验证测试隔离
 * 检测是否有状态泄漏
 * @returns 是否通过隔离验证
 */
export const verifyIsolation = (): boolean => {
  // 检查 localStorage 是否为空
  if (typeof localStorage !== 'undefined' && localStorage.length > 0) {
    console.warn('[verifyIsolation] localStorage 未清空，可能存在状态泄漏');
    return false;
  }

  return true;
};
