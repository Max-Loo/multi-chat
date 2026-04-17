/**
 * 主密钥管理模块
 * 使用 Web Crypto API 生成密钥，使用 Keyring 兼容层存储密钥
 * Tauri 环境使用系统钥匙串，Web 环境使用 IndexedDB + AES-256-GCM 加密
 */
import { keyring } from "@/utils/tauriCompat";
import { isTauri } from "@/utils/tauriCompat/env";
import { toastQueue } from '@/services/toast';
import { verifyMasterKey } from "@/store/keyring/keyVerification";

/** 服务名和账户名配置（keyring 存储标识） */
export const KEYRING_SERVICE_NAME = "com.multichat.app";
export const KEYRING_ACCOUNT_NAME = "master-key";

/** 密钥格式无效错误 */
export class InvalidKeyFormatError extends Error {
  constructor() {
    super('密钥格式无效，请输入 64 字符的 hex 编码字符串');
    this.name = 'InvalidKeyFormatError';
  }
}

/**
 * 生成 256-bit 随机密钥（32 字节）
 * 使用 Web Crypto API 的 crypto.getRandomValues()
 * @returns 返回 hex 编码的密钥字符串
 */
export const generateMasterKey = (): string => {
  const array = new Uint8Array(32); // 256 bits = 32 bytes
  crypto.getRandomValues(array);
  // 转换为 hex 字符串
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * 检查主密钥是否已存在
 * @returns 如果存在返回 true，否则返回 false
 */
export const isMasterKeyExists = async (): Promise<boolean> => {
  try {
    const key = await keyring.getPassword(KEYRING_SERVICE_NAME, KEYRING_ACCOUNT_NAME);
    return key !== null && key !== undefined && key.length > 0;
  } catch (error) {
    console.error("检查主密钥是否存在时出错:", error);
    return false;
  }
};

/**
 * 从 keyring 获取主密钥
 * @returns 返回密钥字符串，如果不存在返回 null
 */
export const getMasterKey = async (): Promise<string | null> => {
  try {
    const key = await keyring.getPassword(KEYRING_SERVICE_NAME, KEYRING_ACCOUNT_NAME);
    return key;
  } catch (error) {
    console.error("获取主密钥时出错:", error);

    // Web 环境可能因为 IndexedDB 不可用或解密失败而抛出错误
    if (!isTauri()) {
      throw new Error(
        "浏览器不支持安全存储或存储空间不足",
        { cause: error }
      );
    }

    // Tauri 环境
    throw new Error(
      "无法访问系统安全存储，请检查钥匙串权限设置",
      { cause: error }
    );
  }
};

/**
 * 将主密钥存储到 keyring
 * @param key - 要存储的密钥（hex 编码）
 */
export const storeMasterKey = async (key: string): Promise<void> => {
  try {
    await keyring.setPassword(KEYRING_SERVICE_NAME, KEYRING_ACCOUNT_NAME, key);
  } catch (error) {
    console.error("存储主密钥时出错:", error);

    // Web 环境可能因为 IndexedDB 不可用或加密失败而抛出错误
    if (!isTauri()) {
      throw new Error(
        "浏览器不支持安全存储或存储空间不足",
        { cause: error }
      );
    }

    // Tauri 环境
    throw new Error(
      "无法访问系统安全存储，请检查钥匙串权限设置",
      { cause: error }
    );
  }
};

/**
 * initializeMasterKey 返回值结构
 */
export interface InitializeMasterKeyResult {
  /** 主密钥（hex 编码） */
  key: string;
  /** 是否为新生成的密钥 */
  isNewlyGenerated: boolean;
}

/**
 * 初始化主密钥（应用启动时调用）
 * 如果密钥存在则返回，如果不存在则生成新密钥并存储
 * 此函数应在应用启动的阻断式初始化阶段调用
 * @returns 返回主密钥和是否为新生成的标记
 * @throws 当 keyring 不可用时抛出错误
 */
export const initializeMasterKey = async (): Promise<InitializeMasterKeyResult> => {
  try {
    // 首先尝试获取已存在的密钥
    const existingKey = await getMasterKey();
    if (existingKey) {
      return { key: existingKey, isNewlyGenerated: false };
    }

    // 密钥不存在，生成新密钥
    console.warn("⚠️  Master key does not exist, generating new key...");
    const newKey = generateMasterKey();

    // 存储新密钥
    await storeMasterKey(newKey);

    if (!isTauri()) {
      console.warn(
        "⚠️  A new master key has been generated and stored in browser secure storage (IndexedDB + encryption)."
      );
      console.warn(
        "⚠️  [IMPORTANT] Old encrypted data cannot be decrypted, you need to reconfigure API keys."
      );
      console.warn(
        "⚠️  Security notice: The web version has a lower security level than the desktop version, we recommend handling sensitive data in the desktop version."
      );
    } else {
      console.warn(
        "⚠️  A new master key has been generated and stored in system secure storage. Note: Old encrypted data cannot be decrypted, you need to reconfigure API keys."
      );
    }

    return { key: newKey, isNewlyGenerated: true };
  } catch (error) {
    console.error("Error getting or creating master key:", error);
    throw error;
  }
};

/**
 * 处理安全性警告提示（Web 环境首次使用）
 * 使用 Toast 永久显示，直到用户确认
 */
export const handleSecurityWarning = async (): Promise<void> => {
  // 只在 Web 环境显示
  if (isTauri()) {
    return;
  }

  // 检查用户是否已经确认过
  const dismissed = localStorage.getItem('multi-chat-security-warning-dismissed');
  if (dismissed === 'true') {
    return;
  }

  // 使用静态导入的 toast（统一项目中的 sonner 导入方式，优化构建产物）

  // 显示永久性 Toast 通知
  const message =
    'The web version has a lower security level than the desktop version. ' +
    'We strongly recommend handling sensitive data (such as API keys) in the desktop version for better protection.';

  toastQueue.warning(message, {
    duration: Infinity,
    action: {
      label: 'OK',
      onClick: () => {
        localStorage.setItem('multi-chat-security-warning-dismissed', 'true');
      }
    },
  });
};

/**
 * 导出主密钥（用于用户备份）
 * @returns 返回主密钥字符串
 */
export const exportMasterKey = async (): Promise<string> => {
  const key = await getMasterKey();
  if (!key) {
    throw new Error("主密钥不存在，无法导出");
  }
  return key;
};

/**
 * 验证 hex 格式密钥（64 字符）
 * @param key 待验证的密钥字符串
 * @returns 是否为有效的 hex 格式密钥
 */
const isValidHexKey = (key: string): boolean => {
  return /^[0-9a-f]{64}$/.test(key);
};

/**
 * 导入主密钥（用于从备份恢复）
 * 验证格式后替换当前密钥，不包含模型重新加载逻辑
 * 调用方需自行 dispatch initializeModels() 重新加载模型数据以验证密钥有效性
 * @param key 用户粘贴的 hex 编码密钥字符串
 * @throws 格式无效时抛出 InvalidKeyFormatError
 */
export const importMasterKey = async (key: string): Promise<void> => {
  if (!isValidHexKey(key)) {
    throw new InvalidKeyFormatError();
  }

  await storeMasterKey(key);
};

/**
 * 带验证的密钥导入结果
 */
export interface ImportKeyWithValidationResult {
  /** 是否导入成功 */
  success: boolean;
  /** 密钥是否与现有加密数据匹配（null 表示无加密数据，跳过验证） */
  keyMatched: boolean | null;
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * 带验证的密钥导入
 * 格式验证 → 验证匹配性 → 存储密钥
 * @param key 用户粘贴的 hex 编码密钥字符串
 * @param forceImport 是否跳过验证直接导入（用于"仍然导入"场景）
 */
export const importMasterKeyWithValidation = async (
  key: string,
  forceImport = false
): Promise<ImportKeyWithValidationResult> => {
  if (!isValidHexKey(key)) {
    return { success: false, keyMatched: null, error: '密钥格式无效，请输入 64 字符的 hex 编码字符串' };
  }

  try {
    const matchResult = await verifyMasterKey(key);

    if (!forceImport && matchResult === false) {
      return { success: false, keyMatched: false };
    }

    await storeMasterKey(key);
    return { success: true, keyMatched: matchResult };
  } catch {
    return {
      success: false,
      keyMatched: null,
      error: '密钥导入失败，无法写入安全存储',
    };
  }
};
