/**
 * 密钥验证模块
 * 通过尝试解密 Store 中的加密数据来验证导入的密钥是否匹配
 */
import type { Model } from "@/types/model";
import { decryptField, isEncrypted } from "@/utils/crypto";
import { createLazyStore, loadFromStore } from "@/store/storage/storeUtils";
import type { StoreCompat } from "@/utils/tauriCompat";

/**
 * 验证用的 modelsStore 实例（避免污染 modelStorage 的模块级单例）
 */
let verificationStore: StoreCompat | null = null;

/**
 * 获取验证用的 modelsStore 实例
 */
const getVerificationStore = (): StoreCompat => {
  if (!verificationStore) {
    verificationStore = createLazyStore('models.json');
  }
  return verificationStore;
};

/**
 * 重置验证用的 store 实例（用于测试）
 */
export const resetVerificationStore = (): void => {
  if (verificationStore) {
    try {
      verificationStore.close();
    } catch {
      // 忽略关闭错误
    }
    verificationStore = null;
  }
};

/**
 * 验证导入的密钥是否能解密 Store 中的加密数据
 * @param key 待验证的 hex 编码密钥
 * @returns true=匹配，false=不匹配，null=无加密数据
 */
export const verifyMasterKey = async (key: string): Promise<boolean | null> => {
  try {
    const models = await loadFromStore<Model[]>(getVerificationStore(), 'models', []);

    const encryptedModel = models.find(
      (model) => model.apiKey && typeof model.apiKey === 'string' && isEncrypted(model.apiKey)
    );

    if (!encryptedModel || !encryptedModel.apiKey) {
      return null;
    }

    try {
      await decryptField(encryptedModel.apiKey, key);
      return true;
    } catch {
      return false;
    }
  } finally {
    verificationStore?.close();
    verificationStore = null;
  }
};
