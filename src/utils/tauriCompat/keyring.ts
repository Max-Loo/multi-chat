/**
 * Tauri Keyring 插件兼容层
 * 提供统一的安全密钥存储 API 封装，自动检测运行环境并选择合适的实现
 * 在 Tauri 环境使用原生实现，在 Web 环境使用 IndexedDB + AES-256-GCM 加密实现
 */

import { getPassword as tauriGetPassword, setPassword as tauriSetPassword, deletePassword as tauriDeletePassword } from 'tauri-plugin-keyring-api';
import { isTauri, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';
import { initIndexedDB } from './indexedDB';
import { encrypt, decrypt, type PasswordRecord } from './crypto-helpers';
import { getCurrentTimestampMs } from '@/utils/utils';
import { bytesToBase64 } from '@/utils/crypto';

/**
 * Keyring 兼容接口
 * 提供与 Tauri Keyring 一致的 API
 */
interface KeyringCompat {
  setPassword: (service: string, user: string, password: string) => Promise<void>;
  getPassword: (service: string, user: string) => Promise<string | null>;
  deletePassword: (service: string, user: string) => Promise<void>;
  isSupported: () => boolean;
}

/**
 * Keyring 公开 API 接口
 * 受类型约束的统一入口，替代独立转发函数
 */
export interface KeyringPublicAPI extends KeyringCompat {
  resetState: () => void;
}

/**
 * IndexedDB 数据库名称和对象存储名称
 */
const DB_NAME = 'multi-chat-keyring';
const STORE_NAME = 'keys';

/**
 * localStorage 中存储种子的键名
 */
export const SEED_STORAGE_KEY = 'multi-chat-keyring-seed';

/**
 * 生成 256-bit 随机种子并存储到 localStorage
 * @returns {string} base64 编码的种子字符串
 */
const generateAndStoreSeed = (): string => {
  const array = new Uint8Array(32); // 256 bits = 32 bytes
  crypto.getRandomValues(array);
  const seed = bytesToBase64(array);
  localStorage.setItem(SEED_STORAGE_KEY, seed);
  return seed;
};

/**
 * 从 localStorage 获取种子，如果不存在则生成新种子
 * @returns {string} base64 编码的种子字符串
 */
const getOrCreateSeed = (): string => {
  const existingSeed = localStorage.getItem(SEED_STORAGE_KEY);
  if (existingSeed) {
    return existingSeed;
  }
  return generateAndStoreSeed();
};

/**
 * 使用 PBKDF2 从种子派生加密密钥（V2 方式）
 * 仅使用 seed 作为密钥材料，不依赖 navigator.userAgent
 * @param {string} seed - base64 编码的种子字符串
 * @returns {Promise<CryptoKey>} 派生的加密密钥
 */
const deriveEncryptionKey = async (seed: string): Promise<CryptoKey> => {
  // V2: 仅使用 seed，移除 userAgent 依赖
  const keyMaterial = seed;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(seed),
      iterations: getPBKDF2Iterations(),
      hash: PBKDF2_ALGORITHM,
    },
    key,
    { name: 'AES-GCM', length: DERIVED_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Tauri 环境的 Keyring 实现
 * 使用 tauri-plugin-keyring-api 的原生实现
 */
class TauriKeyringCompat implements KeyringCompat {
  /**
   * 设置密码
   * @param {string} service - 服务名
   * @param {string} user - 用户名
   * @param {string} password - 密码
   * @returns {Promise<void>}
   */
  async setPassword(service: string, user: string, password: string): Promise<void> {
    await tauriSetPassword(service, user, password);
  }

  /**
   * 获取密码
   * @param {string} service - 服务名
   * @param {string} user - 用户名
   * @returns {Promise<string | null>} 密码或 null
   */
  async getPassword(service: string, user: string): Promise<string | null> {
    return tauriGetPassword(service, user);
  }

  /**
   * 删除密码
   * @param {string} service - 服务名
   * @param {string} user - 用户名
   * @returns {Promise<void>}
   */
  async deletePassword(service: string, user: string): Promise<void> {
    await tauriDeletePassword(service, user);
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 在 Tauri 环境始终返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Web 环境的 Keyring 实现
 * 使用 IndexedDB + AES-256-GCM 加密实现
 */
export class WebKeyringCompat implements KeyringCompat {
  private db: IDBDatabase | null = null;
  private encryptionKey: CryptoKey | null = null;
  private currentSeed: string | null = null; // 跟踪当前使用的种子

  /**
   * 初始化 IndexedDB 数据库和加密密钥
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    try {
      // 初始化 IndexedDB
      this.db = await initIndexedDB(DB_NAME, STORE_NAME, ['service', 'user']);

      // 获取或生成种子，并派生加密密钥
      const seed = getOrCreateSeed();

      // 如果种子变化了，需要重新派生密钥
      if (this.currentSeed !== seed) {
        this.encryptionKey = await deriveEncryptionKey(seed);
        this.currentSeed = seed;
      }
    } catch (error) {
      console.error('初始化 Keyring 失败:', error);
      throw new Error('浏览器不支持安全存储或初始化失败', { cause: error });
    }
  }

  /**
   * 确保已初始化
   * @returns {Promise<void>}
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db || !this.encryptionKey) {
      await this.init();
    }
  }

  /**
   * 设置密码（加密后存储到 IndexedDB）
   * @param {string} service - 服务名
   * @param {string} user - 用户名
   * @param {string} password - 密码
   * @returns {Promise<void>}
   */
  async setPassword(service: string, user: string, password: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.encryptionKey) {
      throw new Error('加密密钥未初始化');
    }

    try {
      // 加密密码
      const { ciphertext, iv } = await encrypt(password, this.encryptionKey);

      // 存储到 IndexedDB
      const record: PasswordRecord = {
        service,
        user,
        encryptedPassword: ciphertext,
        iv,
        createdAt: getCurrentTimestampMs(),
      };

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.put(record);

        request.addEventListener('success', () => {
          resolve();
        });

        request.addEventListener('error', () => {
          reject(new Error(`存储密码失败: ${request.error}`));
        });
      });
    } catch (error) {
      console.error('设置密码失败:', error);
      throw new Error('密码加密或存储失败', { cause: error });
    }
  }

  /**
   * 获取密码（从 IndexedDB 读取并解密）
   * @param {string} service - 服务名
   * @param {string} user - 用户名
   * @returns {Promise<string | null>} 密码或 null
   */
  async getPassword(service: string, user: string): Promise<string | null> {
    await this.ensureInitialized();

    if (!this.encryptionKey) {
      throw new Error('加密密钥未初始化');
    }

    try {
      // 从 IndexedDB 读取
      const record = await new Promise<PasswordRecord | null>((resolve, reject) => {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get([service, user]);

        request.addEventListener('success', () => {
          resolve(request.result || null);
        });

        request.addEventListener('error', () => {
          reject(new Error(`读取密码失败: ${request.error}`));
        });
      });

      if (!record) {
        return null;
      }

      // 解密密码
      return decrypt(record.encryptedPassword, record.iv, this.encryptionKey);
    } catch (error) {
      console.error('获取密码失败:', error);
      throw new Error('密码读取或解密失败', { cause: error });
    }
  }

  /**
   * 删除密码
   * @param {string} service - 服务名
   * @param {string} user - 用户名
   * @returns {Promise<void>}
   */
  async deletePassword(service: string, user: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete([service, user]);

      request.addEventListener('success', () => {
        resolve();
      });

      request.addEventListener('error', () => {
        reject(new Error(`删除密码失败: ${request.error}`));
      });
    });
  }

  /**
   * 关闭数据库连接并重置状态
   * 用于测试环境清理或迁移后重置
   */
  resetState(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.encryptionKey = null;
    this.currentSeed = null;
  }

  /**
   * 关闭数据库连接并重置状态（向后兼容别名）
   * 用于测试环境清理
   */
  close(): void {
    this.resetState();
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 如果浏览器支持 IndexedDB 和 Web Crypto API 返回 true
   */
  isSupported(): boolean {
    return typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
  }
}

/**
 * Keyring 兼容层实例
 * 根据运行环境自动选择合适的实现
 */
const keyringCompat: KeyringCompat = isTauri()
  ? new TauriKeyringCompat()
  : new WebKeyringCompat();

/**
 * 创建 Keyring 公开 API 实例的工厂函数
 * 通过 duck typing 分发 resetState（Web 环境调用实际方法，Tauri 环境为空操作）
 * @param impl - Keyring 兼容层实例
 * @returns KeyringPublicAPI 实例
 */
const createKeyringAPI = (impl: KeyringCompat): KeyringPublicAPI => ({
  setPassword: (service, user, password) => impl.setPassword(service, user, password),
  getPassword: (service, user) => impl.getPassword(service, user),
  deletePassword: (service, user) => impl.deletePassword(service, user),
  isSupported: () => impl.isSupported(),
  resetState: () => {
    if ('resetState' in impl) {
      (impl as WebKeyringCompat).resetState();
    }
  },
});

/**
 * Keyring 公开 API 实例
 * 受 KeyringPublicAPI 接口约束的统一入口
 *
 * @example
 * ```typescript
 * import { keyring } from '@/utils/tauriCompat';
 *
 * if (keyring.isSupported()) {
 *   await keyring.setPassword('com.multichat.app', 'master-key', 'my-secret-key');
 *   const key = await keyring.getPassword('com.multichat.app', 'master-key');
 * }
 * ```
 */
export const keyring: KeyringPublicAPI = createKeyringAPI(keyringCompat);

/**
 * 导出 Keyring 兼容接口类型供外部使用
 */
export type { KeyringCompat };
