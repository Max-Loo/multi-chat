/**
 * 主密钥管理模块
 * 使用 Web Crypto API 生成密钥，使用 Keyring 兼容层存储密钥
 * Tauri 环境使用系统钥匙串，Web 环境使用 IndexedDB + AES-256-GCM 加密
 */
import { getPassword, setPassword, isTauri } from "@/utils/tauriCompat";
import { toast } from 'sonner';

// 服务名和账户名配置
const SERVICE_NAME = "com.multichat.app";
const ACCOUNT_NAME = "master-key";

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
    const key = await getPassword(SERVICE_NAME, ACCOUNT_NAME);
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
    const key = await getPassword(SERVICE_NAME, ACCOUNT_NAME);
    return key;
  } catch (error) {
    console.error("获取主密钥时出错:", error);

    // Web 环境可能因为 IndexedDB 不可用或解密失败而抛出错误
    if (!isTauri()) {
      throw new Error(
        "无法访问浏览器安全存储或密钥解密失败。可能原因：浏览器不支持 IndexedDB、存储空间不足，或密钥已损坏。建议清理浏览器数据或使用桌面版。",
        { cause: error }
      );
    }

    // Tauri 环境
    throw new Error(
      "无法访问系统安全存储，请检查钥匙串权限设置或重新启动应用",
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
    await setPassword(SERVICE_NAME, ACCOUNT_NAME, key);
  } catch (error) {
    console.error("存储主密钥时出错:", error);

    // Web 环境可能因为 IndexedDB 不可用或加密失败而抛出错误
    if (!isTauri()) {
      throw new Error(
        "无法将密钥存储到浏览器安全存储或密钥加密失败。可能原因：浏览器不支持 IndexedDB、存储空间不足，或 Web Crypto API 不可用。建议使用桌面版。",
        { cause: error }
      );
    }

    // Tauri 环境
    throw new Error(
      "无法将密钥存储到系统安全存储，请检查系统密钥环服务是否正常运行",
      { cause: error }
    );
  }
};

/**
 * 初始化主密钥（应用启动时调用）
 * 如果密钥存在则返回，如果不存在则生成新密钥并存储
 * 此函数应在应用启动的阻断式初始化阶段调用
 * @returns 返回主密钥（hex 编码）
 * @throws 当 keyring 不可用时抛出错误
 */
export const initializeMasterKey = async (): Promise<string> => {
  try {
    // 首先尝试获取已存在的密钥
    const existingKey = await getMasterKey();
    if (existingKey) {
      return existingKey;
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

    return newKey;
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

  toast.warning(message, {
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
