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
 * 硬编码的数据库名称列表
 * 当 indexedDB.databases() 不可用时作为 fallback
 * 对应业务代码 src/utils/tauriCompat/store.ts 和 keyring.ts 中的定义
 */
const FALLBACK_DB_NAMES = ['multi-chat-store', 'multi-chat-keyring'];

/**
 * 删除指定名称的 IndexedDB 数据库
 * @param name 数据库名称
 */
const deleteDatabase = (name: string): Promise<void> => {
  return new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.addEventListener('success', () => resolve());
    request.addEventListener('error', () => resolve());
    request.addEventListener('blocked', () => resolve());
  });
};

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
    // 尝试使用 indexedDB.databases() 获取所有数据库
    if (typeof indexedDB.databases === 'function') {
      const databases = await indexedDB.databases();
      const dbNames = databases
        .map((db) => db.name)
        .filter((name): name is string => typeof name === 'string');

      if (dbNames.length > 0) {
        await Promise.all(dbNames.map(deleteDatabase));
        return;
      }
    }
  } catch {
    // indexedDB.databases() 抛出异常时走 fallback
  }

  // fallback: indexedDB.databases() 不可用、返回空列表或抛出异常时，使用硬编码数据库名列表
  await Promise.all(FALLBACK_DB_NAMES.map(deleteDatabase));
};

/**
 * 重置测试状态
 * @param options 重置选项
 */
export const resetTestState = async (options: ResetOptions = {}): Promise<void> => {
  const defaultOptions: ResetOptions = {
    resetLocalStorage: true,
    resetMocks: true,
    resetModules: false,
    resetIndexedDB: true,
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

  // 重置 IndexedDB（异步操作，等待完成）
  if (config.resetIndexedDB) {
    await clearIndexedDB();
  }
};

/**
 * 使用隔离测试钩子
 * 自动配置 beforeEach 和 afterEach 清理
 * @param options 配置选项
 */
export const useIsolatedTest = (options?: {
  /** beforeEach 回调 */
  onBeforeEach?: () => void | Promise<void>;
  /** afterEach 回调 */
  onAfterEach?: () => void | Promise<void>;
  /** 重置选项 */
  resetOptions?: ResetOptions;
}): void => {
  const { onBeforeEach, onAfterEach, resetOptions } = options ?? {};

  beforeEach(async () => {
    await resetTestState(resetOptions);
    await onBeforeEach?.();
  });

  afterEach(async () => {
    await resetTestState(resetOptions);
    await onAfterEach?.();
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
 * 检查 IndexedDB 中是否存在未清理的数据库
 * @returns 是否存在未清理的数据库
 */
const hasUncleanedDatabases = async (): Promise<boolean> => {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  try {
    if (typeof indexedDB.databases === 'function') {
      const databases = await indexedDB.databases();
      return databases.some((db) => typeof db.name === 'string' && db.name.length > 0);
    }

    // indexedDB.databases() 不可用时无法可靠检查，跳过 IndexedDB 检查
    return false;
  } catch {
    // indexedDB.databases() 抛出异常时跳过检查
    return false;
  }
};

/**
 * 验证测试隔离
 * 检测是否有状态泄漏，覆盖 localStorage 和 IndexedDB 两个维度
 * @returns 是否通过隔离验证
 */
export const verifyIsolation = async (): Promise<boolean> => {
  // 检查 localStorage 是否为空
  if (typeof localStorage !== 'undefined' && localStorage.length > 0) {
    console.warn('[verifyIsolation] localStorage 未清空，可能存在状态泄漏');
    return false;
  }

  // 检查 IndexedDB 是否为空
  const hasUncleanedDB = await hasUncleanedDatabases();
  if (hasUncleanedDB) {
    console.warn('[verifyIsolation] IndexedDB 中存在未清理的数据库，可能存在状态泄漏');
    return false;
  }

  return true;
};
