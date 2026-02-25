/**
 * Tauri API Mock 工厂
 * 
 * 提供统一的 Tauri 兼容层 Mock 创建函数
 */

import { vi } from 'vitest';
import type { TauriMocks, TauriMockOptions } from './types';

/**
 * 创建 Tauri API Mock
 * @param options Mock 配置选项
 * @returns Tauri Mock 对象
 */
export const createTauriMocks = (options: TauriMockOptions = {}): TauriMocks => {
  const defaultOptions: TauriMockOptions = {
    isTauri: true,
  };
  const config = { ...defaultOptions, ...options };

  // 创建 Shell Mock
  const shell = {
    open: vi.fn().mockResolvedValue(undefined),
    Command: {
      create: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
        isSupported: vi.fn().mockReturnValue(config.isTauri),
      }),
    },
  };

  // 创建 OS Mock
  const os = {
    locale: vi.fn().mockResolvedValue('zh-CN'),
    platform: vi.fn().mockResolvedValue('darwin'),
  };

  // 创建 HTTP Mock
  const http = {
    fetch: vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
    }),
    getFetchFunc: vi.fn().mockReturnValue(
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      })
    ),
  };

  // 创建 Store Mock
  const store = {
    createLazyStore: vi.fn().mockReturnValue({
      init: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      isSupported: vi.fn().mockReturnValue(true),
    }),
  };

  // 创建 Keyring Mock
  const keyring = {
    getPassword: vi.fn().mockResolvedValue(null),
    setPassword: vi.fn().mockResolvedValue(undefined),
    deletePassword: vi.fn().mockResolvedValue(undefined),
    isKeyringSupported: vi.fn().mockReturnValue(true),
  };

  // 创建环境检测 Mock
  const env = {
    isTauri: vi.fn().mockReturnValue(config.isTauri),
  };

  // 收集所有 Mock 函数
  const allMocks = [
    shell.open,
    shell.Command.create,
    os.locale,
    os.platform,
    http.fetch,
    http.getFetchFunc,
    store.createLazyStore,
    keyring.getPassword,
    keyring.setPassword,
    keyring.deletePassword,
    keyring.isKeyringSupported,
    env.isTauri,
  ];

  return {
    shell,
    os,
    http,
    store,
    keyring,
    env,
    
    /**
     * 重置所有 Mock
     */
    resetAll: () => {
      allMocks.forEach((mock) => {
        mock.mockClear();
        mock.mockReset();
      });
      // 重新设置默认返回值
      env.isTauri.mockReturnValue(config.isTauri);
    },

    /**
     * 更新配置
     * @param newOptions 新的配置选项
     */
    configure: (newOptions: TauriMockOptions) => {
      Object.assign(config, newOptions);
      env.isTauri.mockReturnValue(config.isTauri ?? true);
    },
  };
};
