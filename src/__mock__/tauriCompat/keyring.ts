/**
 * Keyring 插件 Mock 实现
 * 用于测试环境，提供与真实 API 一致的接口
 */

import { vi } from 'vitest';

/**
 * Mock 数据存储
 */
const passwordData = new Map<string, string>();

/**
 * 生成存储键
 */
const getStorageKey = (service: string, user: string): string => {
  return `${service}:${user}`;
};

/**
 * Mock setPassword 函数
 */
export const setPassword = vi.fn().mockImplementation(
  async (service: string, user: string, password: string): Promise<void> => {
    const key = getStorageKey(service, user);
    passwordData.set(key, password);
  }
);

/**
 * Mock getPassword 函数
 */
export const getPassword = vi.fn().mockImplementation(
  async (service: string, user: string): Promise<string | null> => {
    const key = getStorageKey(service, user);
    return passwordData.get(key) ?? null;
  }
);

/**
 * Mock deletePassword 函数
 */
export const deletePassword = vi.fn().mockImplementation(
  async (service: string, user: string): Promise<void> => {
    const key = getStorageKey(service, user);
    passwordData.delete(key);
  }
);

/**
 * Mock isKeyringSupported 函数
 */
export const isKeyringSupported = vi.fn().mockReturnValue(true);
