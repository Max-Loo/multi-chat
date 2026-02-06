/**
 * Tauri Keyring 插件兼容层
 * 提供统一的安全密钥存储 API 封装，自动检测运行环境并选择合适的实现
 * 在 Tauri 环境使用原生实现，在 Web 环境使用 IndexedDB + AES-256-GCM 加密实现
 */

import { getPassword as tauriGetPassword, setPassword as tauriSetPassword, deletePassword as tauriDeletePassword } from 'tauri-plugin-keyring-api';
import { isTauri } from './env';

/**
 * IndexedDB 数据库名称和对象存储名称
 */
const DB_NAME = 'multi-chat-keyring';
const STORE_NAME = 'keys';

/**
 * localStorage 中存储种子的键名
 */
const SEED_STORAGE_KEY = 'multi-chat-keyring-seed';

/**
 * PBKDF2 密钥派生参数
 */
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_ALGORITHM = 'SHA-256';
const DERIVED_KEY_LENGTH = 256; // bits

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
 * 密码记录结构（存储在 IndexedDB 中）
 */
interface PasswordRecord {
  service: string;
  user: string;
  encryptedPassword: string; // base64 编码的密文
  iv: string; // base64 编码的初始化向量
  createdAt: number; // 时间戳
}

/**
 * 初始化 IndexedDB 数据库
 * @param {string} dbName - 数据库名称
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<IDBDatabase>} IndexedDB 数据库实例
 */
const initIndexedDB = async (dbName: string, storeName: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.addEventListener('error', () => {
      reject(new Error(`无法打开 IndexedDB 数据库: ${request.error}`));
    });

    request.addEventListener('success', () => {
      resolve(request.result);
    });

    request.addEventListener('upgradeneeded', (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        // 使用复合主键：service + user
        const keyPath = ['service', 'user'];
        db.createObjectStore(storeName, { keyPath });
      }
    });
  });
};

/**
 * 生成 256-bit 随机种子并存储到 localStorage
 * @returns {string} base64 编码的种子字符串
 */
const generateAndStoreSeed = (): string => {
  const array = new Uint8Array(32); // 256 bits = 32 bytes
  crypto.getRandomValues(array);
  const seed = btoa(String.fromCharCode(...array));
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
 * 使用 PBKDF2 从种子派生加密密钥
 * @param {string} seed - base64 编码的种子字符串
 * @returns {Promise<CryptoKey>} 派生的加密密钥
 */
const deriveEncryptionKey = async (seed: string): Promise<CryptoKey> => {
  const keyMaterial = navigator.userAgent + seed;

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
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_ALGORITHM,
    },
    key,
    { name: 'AES-GCM', length: DERIVED_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * 使用 AES-256-GCM 加密数据
 * @param {string} plaintext - 明文
 * @param {CryptoKey} key - 加密密钥
 * @returns {Promise<{ ciphertext: string; iv: string }>} 加密后的密文和 IV（base64 编码）
 */
const encrypt = async (plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // 生成随机 IV（12 字节是 GCM 推荐长度）
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

/**
 * 使用 AES-256-GCM 解密数据
 * @param {string} ciphertext - base64 编码的密文
 * @param {string} iv - base64 编码的 IV
 * @param {CryptoKey} key - 解密密钥
 * @returns {Promise<string>} 解密后的明文
 */
const decrypt = async (ciphertext: string, iv: string, key: CryptoKey): Promise<string> => {
  const encryptedData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  );
  const decoder = new TextDecoder();
  
  return decoder.decode(decrypted);
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
class WebKeyringCompat implements KeyringCompat {
  private db: IDBDatabase | null = null;
  private encryptionKey: CryptoKey | null = null;

  /**
   * 初始化 IndexedDB 数据库和加密密钥
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    try {
      // 初始化 IndexedDB
      this.db = await initIndexedDB(DB_NAME, STORE_NAME);

      // 获取或生成种子，并派生加密密钥
      const seed = getOrCreateSeed();
      this.encryptionKey = await deriveEncryptionKey(seed);
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
        createdAt: Date.now(),
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
 * 设置密码
 * @param {string} service - 服务名
 * @param {string} user - 用户名
 * @param {string} password - 密码
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * import { setPassword } from '@/utils/tauriCompat';
 * 
 * await setPassword('com.multichat.app', 'master-key', 'my-secret-key');
 * ```
 */
export const setPassword = async (service: string, user: string, password: string): Promise<void> => {
  await keyringCompat.setPassword(service, user, password);
};

/**
 * 获取密码
 * @param {string} service - 服务名
 * @param {string} user - 用户名
 * @returns {Promise<string | null>} 密码或 null
 * 
 * @example
 * ```typescript
 * import { getPassword } from '@/utils/tauriCompat';
 * 
 * const key = await getPassword('com.multichat.app', 'master-key');
 * ```
 */
export const getPassword = async (service: string, user: string): Promise<string | null> => {
  return keyringCompat.getPassword(service, user);
};

/**
 * 删除密码
 * @param {string} service - 服务名
 * @param {string} user - 用户名
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * import { deletePassword } from '@/utils/tauriCompat';
 * 
 * await deletePassword('com.multichat.app', 'master-key');
 * ```
 */
export const deletePassword = async (service: string, user: string): Promise<void> => {
  await keyringCompat.deletePassword(service, user);
};

/**
 * 检查 Keyring 功能是否可用
 * @returns {boolean} 如果功能可用返回 true
 * 
 * @example
 * ```typescript
 * import { isKeyringSupported } from '@/utils/tauriCompat';
 * 
 * if (isKeyringSupported()) {
 *   // 使用 Keyring 功能
 * }
 * ```
 */
export const isKeyringSupported = (): boolean => {
  return keyringCompat.isSupported();
};

/**
 * 导出 Keyring 兼容接口类型供外部使用
 */
export type { KeyringCompat };
