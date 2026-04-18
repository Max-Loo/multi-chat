/**
 * 密钥验证模块
 * 通过尝试解密 Store 中的加密数据来验证导入的密钥是否匹配
 */
import type { Model } from "@/types/model";
import { decryptField } from "@/utils/crypto";
import { getModelsStore, resetModelsStore, isModelEncrypted } from "@/store/storage/modelStorage";
import { loadFromStore } from "@/store/storage/storeUtils";

/**
 * 重置验证用的 store 实例（用于测试）
 */
export const resetVerificationStore = (): void => {
  resetModelsStore();
};

/**
 * 验证导入的密钥是否能解密 Store 中的加密数据
 * @param key 待验证的 hex 编码密钥
 * @returns true=匹配，false=不匹配，null=无加密数据
 */
export const verifyMasterKey = async (key: string): Promise<boolean | null> => {
  const models = await loadFromStore<Model[]>(getModelsStore(), 'models', []);

  const encryptedModel = models.find(isModelEncrypted);

  if (!encryptedModel || !encryptedModel.apiKey) {
    return null;
  }

  try {
    await decryptField(encryptedModel.apiKey, key);
    return true;
  } catch {
    return false;
  }
};
