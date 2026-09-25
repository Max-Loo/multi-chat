/**
 * 测试环境隔离工具
 * 
 * 提供测试状态重置和环境隔离功能
 */

import { vi } from 'vitest';

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
