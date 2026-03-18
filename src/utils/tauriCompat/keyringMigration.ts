/**
 * Keyring V1 → V2 迁移模块
 *
 * 处理从依赖 navigator.userAgent 的旧密钥派生方式迁移到仅依赖 seed 的新方式。
 *
 * ## 清理计划
 * - [ ] 当大多数用户已完成迁移后，移除本文件
 * - [ ] 同时移除 initSteps.ts 中的 keyringMigration 步骤
 * - [ ] 同时清理 localStorage['keyring-data-version'] 的读取逻辑
 * - [ ] 预计清理时间：待定（根据迁移覆盖率数据调整）
 */

import { isTauri } from './env';
import { resetWebKeyringState } from './keyring';

/**
 * 版本标记存储键名
 */
export const KEYRING_VERSION_KEY = 'keyring-data-version';

/**
 * 当前数据格式版本
 */
export const KEYRING_CURRENT_VERSION = '2';

/**
 * localStorage 中存储种子的键名
 */
const SEED_STORAGE_KEY = 'multi-chat-keyring-seed';

/**
 * IndexedDB 数据库名称
 */
const KEYRING_DB_NAME = 'multi-chat-keyring';
const STORE_DB_NAME = 'multi-chat-store';

/**
 * PBKDF2 密钥派生参数
 */
const PBKDF2_ALGORITHM = 'SHA-256';
const DERIVED_KEY_LENGTH = 256; // bits

/**
 * 检测是否在测试环境中运行
 */
const isTestEnvironment = (): boolean => {
  if (typeof (globalThis as Record<string, unknown>).vitest !== 'undefined') {
    return true;
  }
  if ((globalThis as Record<string, unknown>).__VITEST__) {
    return true;
  }
  if (typeof process !== 'undefined' && process.env?.VITEST) {
    return true;
  }
  try {
    const env = (import.meta as unknown as Record<string, unknown>).env as Record<string, unknown> | undefined;
    if (env?.VITEST === 'true') {
      return true;
    }
  } catch {
    // 忽略错误
  }
  return false;
};

/**
 * 获取 PBKDF2 迭代次数
 */
const getPBKDF2Iterations = (): number => {
  return isTestEnvironment() ? 1000 : 100000;
};

/**
 * 迁移结果类型
 */
export interface MigrationResult {
  /** 是否执行了迁移 */
  migrated: boolean;
  /** 是否重置了数据 */
  reset: boolean;
}

/**
 * 检查是否已完成 V2 迁移
 * @returns {boolean} 如果版本为 "2" 返回 true
 */
export const isMigrationToV2Complete = (): boolean => {
  try {
    const version = localStorage.getItem(KEYRING_VERSION_KEY);
    return version === KEYRING_CURRENT_VERSION;
  } catch {
    // localStorage 不可用时，假设需要迁移
    return false;
  }
};

/**
 * 标记迁移完成
 */
const markMigrationComplete = (): void => {
  try {
    localStorage.setItem(KEYRING_VERSION_KEY, KEYRING_CURRENT_VERSION);
  } catch {
    // localStorage 不可用时静默失败
    console.warn('[KeyringMigration] 无法写入版本标记到 localStorage');
  }
};

/**
 * V1 密钥派生函数（仅用于迁移）
 * 使用 navigator.userAgent + seed 作为密钥材料
 * @param {string} seed - base64 编码的种子字符串
 * @returns {Promise<CryptoKey>} 派生的加密密钥
 */
export const deriveEncryptionKeyV1 = async (seed: string): Promise<CryptoKey> => {
  // V1 方式：userAgent + seed
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
 * V2 密钥派生函数
 * 仅使用 seed 作为密钥材料
 * @param {string} seed - base64 编码的种子字符串
 * @returns {Promise<CryptoKey>} 派生的加密密钥
 */
export const deriveEncryptionKeyV2 = async (seed: string): Promise<CryptoKey> => {
  // V2 方式：仅 seed
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
 * 密码记录结构（存储在 IndexedDB 中）
 */
interface PasswordRecord {
  service: string;
  user: string;
  encryptedPassword: string;
  iv: string;
  createdAt: number;
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
        const keyPath = ['service', 'user'];
        db.createObjectStore(storeName, { keyPath });
      }
    });
  });
};

/**
 * 获取 IndexedDB 中的所有记录
 * @param {IDBDatabase} db - 数据库实例
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<PasswordRecord[]>} 所有记录
 */
const getAllRecords = async (db: IDBDatabase, storeName: string): Promise<PasswordRecord[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();

    request.addEventListener('success', () => {
      resolve(request.result || []);
    });

    request.addEventListener('error', () => {
      reject(new Error(`读取记录失败: ${request.error}`));
    });
  });
};

/**
 * 清除 IndexedDB 中的所有记录
 * @param {IDBDatabase} db - 数据库实例
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<void>}
 */
const clearStore = async (db: IDBDatabase, storeName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.clear();

    request.addEventListener('success', () => {
      resolve();
    });

    request.addEventListener('error', () => {
      reject(new Error(`清除数据失败: ${request.error}`));
    });
  });
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
 * 使用 AES-256-GCM 加密数据
 * @param {string} plaintext - 明文
 * @param {CryptoKey} key - 加密密钥
 * @returns {Promise<{ ciphertext: string; iv: string }>} 加密后的密文和 IV（base64 编码）
 */
const encrypt = async (plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

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
 * 写入记录到 IndexedDB
 * @param {IDBDatabase} db - 数据库实例
 * @param {string} storeName - 对象存储名称
 * @param {PasswordRecord} record - 记录
 * @returns {Promise<void>}
 */
const putRecord = async (db: IDBDatabase, storeName: string, record: PasswordRecord): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.put(record);

    request.addEventListener('success', () => {
      resolve();
    });

    request.addEventListener('error', () => {
      reject(new Error(`存储记录失败: ${request.error}`));
    });
  });
};

/**
 * 生成新的随机种子
 * @returns {string} base64 编码的种子字符串
 */
const generateNewSeed = (): string => {
  const array = new Uint8Array(32); // 256 bits = 32 bytes
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

/**
 * 清除所有 Keyring 相关数据（用于迁移失败时重置）
 * @returns {Promise<void>}
 */
const clearAllKeyringData = async (): Promise<void> => {
  // 清除 localStorage
  try {
    localStorage.removeItem(SEED_STORAGE_KEY);
  } catch {
    // 忽略错误
  }

  // 清除 IndexedDB 数据库
  const databasesToClear = [KEYRING_DB_NAME, STORE_DB_NAME];

  for (const dbName of databasesToClear) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
        request.addEventListener('blocked', () => {
          // 数据库被阻塞，等待后继续
          setTimeout(() => resolve(), 1000);
        });
      });
    } catch {
      // 忽略错误
    }
  }
};

/**
 * 执行 V1 → V2 迁移
 *
 * 迁移流程：
 * 1. 检查是否已完成迁移，如果是则跳过
 * 2. 检查 IndexedDB 中是否有数据
 * 3. 如果有数据，尝试使用 V1 密钥解密
 * 4. 解密成功后，使用 V2 密钥重新加密
 * 5. 解密失败则清除所有数据并生成新种子
 * 6. 标记迁移完成
 *
 * @returns {Promise<MigrationResult>} 迁移结果
 */
/**
 * 返回"无需迁移"结果并输出日志
 */
const noMigrationNeeded = (): MigrationResult => {
  console.log('[KeyringMigration] 无需迁移');
  return { migrated: false, reset: false };
};

/**
 * 执行 V1 → V2 迁移
 *
 * @returns {Promise<MigrationResult>} 迁移结果
 */
export const migrateKeyringV1ToV2 = async (): Promise<MigrationResult> => {
  // Tauri 环境跳过迁移
  if (isTauri()) {
    return noMigrationNeeded();
  }

  // 检查是否已完成迁移
  if (isMigrationToV2Complete()) {
    return noMigrationNeeded();
  }

  // 检查 IndexedDB 是否可用
  if (typeof indexedDB === 'undefined') {
    markMigrationComplete();
    return noMigrationNeeded();
  }

  // 检查 localStorage 是否可用
  if (typeof localStorage === 'undefined') {
    markMigrationComplete();
    return noMigrationNeeded();
  }

  try {
    // 获取现有种子
    const existingSeed = localStorage.getItem(SEED_STORAGE_KEY);

    // 如果没有种子，说明是新用户，无需迁移
    if (!existingSeed) {
      markMigrationComplete();
      return noMigrationNeeded();
    }

    // 初始化 IndexedDB
    let db: IDBDatabase;
    try {
      db = await initIndexedDB(KEYRING_DB_NAME, 'keys');
    } catch {
      // 数据库初始化失败，可能不存在，视为新用户
      markMigrationComplete();
      return noMigrationNeeded();
    }

    // 获取所有记录
    const records = await getAllRecords(db, 'keys');

    // 如果没有记录，无需迁移
    if (records.length === 0) {
      db.close();
      markMigrationComplete();
      return noMigrationNeeded();
    }

    console.log(`[KeyringMigration] 开始迁移 ${records.length} 条记录...`);

    // 派生 V1 和 V2 密钥
    const v1Key = await deriveEncryptionKeyV1(existingSeed);
    const v2Key = await deriveEncryptionKeyV2(existingSeed);

    // 尝试迁移每条记录
    const migratedRecords: PasswordRecord[] = [];

    for (const record of records) {
      try {
        // 使用 V1 密钥解密
        const plaintext = await decrypt(record.encryptedPassword, record.iv, v1Key);

        // 使用 V2 密钥重新加密
        const { ciphertext, iv } = await encrypt(plaintext, v2Key);

        migratedRecords.push({
          ...record,
          encryptedPassword: ciphertext,
          iv,
        });
      } catch {
        // 解密失败，说明 userAgent 已变化或数据已损坏
        db.close();

        // 清除所有数据
        await clearAllKeyringData();

        // 生成新种子
        const newSeed = generateNewSeed();
        localStorage.setItem(SEED_STORAGE_KEY, newSeed);

        // 重置 WebKeyringCompat 实例状态，确保下次使用时重新初始化
        resetWebKeyringState();

        markMigrationComplete();
        console.warn('[KeyringMigration] 迁移失败，已重置数据');
        return { migrated: true, reset: true };
      }
    }

    // 清除旧数据并写入新数据
    await clearStore(db, 'keys');

    for (const record of migratedRecords) {
      await putRecord(db, 'keys', record);
    }

    db.close();

    // 重置 WebKeyringCompat 实例状态，确保下次使用时用新密钥初始化
    resetWebKeyringState();

    markMigrationComplete();
    console.log(`[KeyringMigration] 成功迁移 ${migratedRecords.length} 条记录`);
    return { migrated: true, reset: false };
  } catch (error) {
    console.error('[KeyringMigration] 迁移过程出错:', error);
    markMigrationComplete();
    return noMigrationNeeded();
  }
};
