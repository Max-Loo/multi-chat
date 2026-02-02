/**
 * 主密钥管理模块
 * 使用 Web Crypto API 生成密钥，使用 tauri-plugin-keyring 存储密钥
 */
import { getPassword, setPassword } from "tauri-plugin-keyring-api";

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
    console.warn("主密钥不存在，正在生成新密钥...");
    const newKey = generateMasterKey();

    // 存储新密钥
    await storeMasterKey(newKey);

    console.warn(
      "已生成新的主密钥并存储到系统安全存储。注意：旧加密数据将无法解密，需要重新配置 API 密钥。"
    );

    return newKey;
  } catch (error) {
    console.error("获取或创建主密钥时出错:", error);
    throw error;
  }
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
