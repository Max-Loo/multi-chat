/**
 * Store 插件存储模块 - 通用工具函数
 * 提供通用的 Store 创建、保存和加载函数
 * 使用 Store 兼容层，自动适配 Tauri 和 Web 环境
 */
import type { StoreCompat } from '@/utils/tauriCompat';

/**
 * 通用的保存数据到 Store 函数
 * @param store - StoreCompat 实例
 * @param key - 存储键
 * @param data - 要保存的数据
 * @param successMessage - 成功日志消息
 */
export const saveToStore = async <T>(
  store: StoreCompat,
  key: string,
  data: T,
  successMessage?: string
): Promise<void> => {
  try {
    await store.init();
    await store.set(key, data);
    await store.save();
    if (successMessage) {
      console.log(`成功${successMessage}到 ${key}`);
    }
  } catch (error) {
    console.error(`保存数据到 ${key} 失败:`, error);
    throw error;
  }
};

/**
 * 通用的从 Store 加载数据函数
 * @param store - StoreCompat 实例
 * @param key - 存储键
 * @param defaultValue - 默认值
 * @returns 加载的数据
 */
export const loadFromStore = async <T>(
  store: StoreCompat,
  key: string,
  defaultValue: T
): Promise<T> => {
  try {
    await store.init();
    const data = await store.get<T>(key);
    if (!data) {
      console.log(`${key} 数据不存在，返回默认值`);
      return defaultValue;
    }
    return data;
  } catch (error) {
    console.error(`从 ${key} 加载数据失败:`, error);
    return defaultValue;
  }
};
