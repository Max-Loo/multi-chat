import { Model } from '@/types/model';
import { getRecord, getVault, insertRecord } from '.';

const enum VaultKeyEnum {
  models = 'models',
}

const VAULT_NAME = 'modelVault.hold'

// 从保险库中获取模型列表数据
export const loadModels = async (): Promise<Model[]> => {
  try {
    const {
      client,
    } = await getVault(VAULT_NAME)
    const store = client.getStore()
    const modelsStr = await getRecord(store, VaultKeyEnum.models)

    const models: Model[] = modelsStr ? JSON.parse(modelsStr) : []

    return models
  } catch (error) {
    console.error('Failed to get model list', error);
    throw new Error('Failed to load model list from local storage', { cause: error })
  }
}

// 向保险库中保存模型列表数据
export const saveModels = async (models: Model[]): Promise<void> => {
  try {
    const {
      stronghold,
      client,
    } = await getVault(VAULT_NAME)

    const store = client.getStore()
    await insertRecord(store, VaultKeyEnum.models, JSON.stringify(models))

    await stronghold.save()
  } catch (error) {
    console.error('Failed to save model list', error);
    throw new Error('Failed to save model list to local storage', { cause: error })
  }
}