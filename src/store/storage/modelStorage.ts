/**
 * 模型存储模块
 * 负责模型数据的加密存储和加载
 */
import type { Model } from "@/types/model";
import { encryptField, decryptField } from "@/utils/crypto";
import { getMasterKey } from "@/store/keyring/masterKey";
import { createLazyStore, saveToStore, loadFromStore } from "./storeUtils";
import type { StoreCompat } from "@/utils/tauriCompat";
import { logger } from '@/utils/logger';

/**
 * 模型存储的 LazyStore 实例（模块级单例）
 */
let modelsStore: StoreCompat | null = null;

/**
 * 获取或创建 modelsStore 实例
 * @returns StoreCompat 实例
 */
const getModelsStore = (): StoreCompat => {
  if (!modelsStore) {
    modelsStore = createLazyStore('models.json');
  }
  return modelsStore;
};

/**
 * 重置 modelsStore 实例（用于测试）
 * 在测试环境中调用此函数来关闭旧的 store 连接
 */
export const resetModelsStore = (): void => {
  if (modelsStore) {
    try {
      modelsStore.close();
    } catch {
      // 忽略关闭错误（数据库可能已经不存在）
    }
    modelsStore = null;
  }
};

/**
 * 加密模型中的敏感字段
 * @param model - 模型对象
 * @param masterKey - 主密钥
 * @returns 加密后的模型对象
 */
const encryptModelSensitiveFields = async (
  model: Model,
  masterKey: string
): Promise<Model> => {
  const encryptedModel = { ...model };

  if (model.apiKey && model.apiKey.length > 0) {
    try {
      if (!model.apiKey.startsWith("enc:")) {
        encryptedModel.apiKey = await encryptField(model.apiKey, masterKey);
      }
    } catch (error) {
      logger.error(`加密模型 API 密钥失败`, error instanceof Error ? error : undefined, {
        modelId: model.id,
        modelName: model.nickname || model.id,
      });
      throw new Error(`无法加密模型 ${model.nickname || model.id} 的 API 密钥`, {
        cause: error,
      });
    }
  }

  return encryptedModel;
};

/**
 * 解密模型中的敏感字段
 * @param model - 模型对象
 * @param masterKey - 主密钥
 * @returns 解密后的模型对象
 */
const decryptModelSensitiveFields = async (
  model: Model,
  masterKey: string
): Promise<Model> => {
  const decryptedModel = { ...model };

  if (model.apiKey && model.apiKey.startsWith("enc:")) {
    try {
      decryptedModel.apiKey = await decryptField(model.apiKey, masterKey);
    } catch (error) {
      logger.error(`解密模型 API 密钥失败`, error instanceof Error ? error : undefined, {
        modelId: model.id,
      });
      decryptedModel.apiKey = "";
    }
  }

  return decryptedModel;
};

/**
 * 保存模型列表到 Store
 * 敏感字段（apiKey）会被加密
 * @param models - 模型列表
 */
export const saveModelsToJson = async (models: Model[]): Promise<void> => {
  const masterKey = await getMasterKey();
  if (!masterKey) {
    throw new Error("主密钥不存在，无法保存敏感数据");
  }

  const encryptedModels = await Promise.all(
    models.map((model) => encryptModelSensitiveFields(model, masterKey))
  );

  await saveToStore(getModelsStore(), 'models', encryptedModels, `保存 ${models.length} 个模型`);
};

/**
 * 从 Store 加载模型列表
 * 敏感字段（apiKey）会被解密
 * @returns 模型列表
 */
export const loadModelsFromJson = async (): Promise<Model[]> => {
  const storedModels = await loadFromStore<Model[]>(getModelsStore(), 'models', []);

  if (storedModels.length === 0) {
    return [];
  }

  const masterKey = await getMasterKey();
  if (!masterKey) {
    logger.warn("主密钥不存在，无法解密敏感数据，返回带空 apiKey 的模型");
    return storedModels.map((model) => ({
      ...model,
      apiKey: model.apiKey?.startsWith("enc:") ? "" : model.apiKey,
    }));
  }

  const decryptedModels = await Promise.all(
    storedModels.map((model) => decryptModelSensitiveFields(model, masterKey))
  );

  return decryptedModels;
};
