/**
 * Mock 工厂类型定义
 */

import { Mock } from 'vitest';

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
    open: Mock;
    Command: {
      create: Mock;
    };
  };
  /** OS 模块 Mock */
  os: {
    locale: Mock;
    platform: Mock;
  };
  /** HTTP 模块 Mock */
  http: {
    fetch: Mock;
    getFetchFunc: Mock;
  };
  /** Store 模块 Mock */
  store: {
    createLazyStore: Mock;
  };
  /** Keyring 模块 Mock */
  keyring: {
    getPassword: Mock;
    setPassword: Mock;
    deletePassword: Mock;
    isKeyringSupported: Mock;
  };
  /** 环境检测 Mock */
  env: {
    isTauri: Mock;
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
  encryptField: Mock;
  /** 解密字段 Mock */
  decryptField: Mock;
  /** 判断是否加密 Mock */
  isEncrypted: Mock;
  /** 重置所有 Mock */
  resetAll: () => void;
}

/**
 * 存储 Mock 对象
 */
export interface StorageMocks {
  /** 创建 Store Mock */
  createLazyStore: Mock;
  /** 保存到 Store Mock */
  saveToStore: Mock;
  /** 从 Store 加载 Mock */
  loadFromStore: Mock;
  /** 重置所有 Mock */
  resetAll: () => void;
}
