/**
 * Mock 工厂类型定义
 */

import { vi } from 'vitest';

/**
 * Tauri Mock 配置选项
 */
export interface TauriMockOptions {
  /** 是否为 Tauri 环境，默认 true */
  isTauri?: boolean;
}

/**
 * Tauri Mock 对象
 */
export interface TauriMocks {
  /** Shell 模块 Mock */
  shell: {
    open: ReturnType<typeof vi.fn>;
    Command: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  /** OS 模块 Mock */
  os: {
    locale: ReturnType<typeof vi.fn>;
    platform: ReturnType<typeof vi.fn>;
  };
  /** HTTP 模块 Mock */
  http: {
    fetch: ReturnType<typeof vi.fn>;
    getFetchFunc: ReturnType<typeof vi.fn>;
  };
  /** Store 模块 Mock */
  store: {
    createLazyStore: ReturnType<typeof vi.fn>;
  };
  /** Keyring 模块 Mock */
  keyring: {
    getPassword: ReturnType<typeof vi.fn>;
    setPassword: ReturnType<typeof vi.fn>;
    deletePassword: ReturnType<typeof vi.fn>;
    isKeyringSupported: ReturnType<typeof vi.fn>;
  };
  /** 环境检测 Mock */
  env: {
    isTauri: ReturnType<typeof vi.fn>;
  };
  /** 重置所有 Mock */
  resetAll: () => void;
  /** 更新配置 */
  configure: (options: TauriMockOptions) => void;
}

/**
 * 加密 Mock 对象
 */
export interface CryptoMocks {
  /** 加密字段 Mock */
  encryptField: ReturnType<typeof vi.fn>;
  /** 解密字段 Mock */
  decryptField: ReturnType<typeof vi.fn>;
  /** 判断是否加密 Mock */
  isEncrypted: ReturnType<typeof vi.fn>;
  /** 重置所有 Mock */
  resetAll: () => void;
}

/**
 * 存储 Mock 对象
 */
export interface StorageMocks {
  /** 创建 Store Mock */
  createLazyStore: ReturnType<typeof vi.fn>;
  /** 保存到 Store Mock */
  saveToStore: ReturnType<typeof vi.fn>;
  /** 从 Store 加载 Mock */
  loadFromStore: ReturnType<typeof vi.fn>;
  /** 重置所有 Mock */
  resetAll: () => void;
}
