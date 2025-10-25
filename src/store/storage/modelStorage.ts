import { Store } from '@tauri-apps/plugin-store';
import { Model } from '@/types/model';
import { STORAGE_KEY } from '@/utils/constants';

// 全局存储实例
let store: Store | null = null;

// 获取存储实例（单例模式）
const getStore = async (): Promise<Store> => {
  if (!store) {
    store = await Store.load('model.json', {
      autoSave: false,
      defaults: {},
    });
  }
  return store!;
};

// 从本地存储加载模型数据
export const loadModels = async (): Promise<Model[]> => {
  try {
    const store = await getStore();
    const models = await store.get<Model[]>(STORAGE_KEY);
    return models || [];
  } catch (error) {
    console.error('Failed to load models:', error);
    throw new Error('Failed to load models from local storage');
  }
};

// 保存模型数据到本地存储
export const saveModels = async (models: Model[]): Promise<void> => {
  try {
    const store = await getStore();
    await store.set(STORAGE_KEY, models);
    await store.save();
  } catch (error) {
    console.error('Failed to save models:', error);
    throw new Error('Failed to save models to local storage');
  }
};