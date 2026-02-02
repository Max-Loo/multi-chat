/**
 * Store 插件存储模块 - 通用工具函数
 * 提供通用的 Store 创建、保存和加载函数
 */
import { LazyStore } from '@tauri-apps/plugin-store';

/**
 * 各种全局储存实例，都使用懒加载
 */
class LazySettingStore extends LazyStore {
  constructor() {
    super('.setting.dat', {
      autoSave: false,
      defaults: {},
    });
  }

  /**
   * @description 设置并保存值
   * @param key 键
   * @param value 值
   * @param message 错误信息
   */
  async setAndSave(key: string, value: unknown, message?: string): Promise<void> {
    try {
      await super.set(key, value);
      await settingStore.save();
    } catch (error) {
      console.error(message, error);
      throw new Error(message, { cause: error });
    }
  }
}

/**
 * 创建 LazyStore 实例的工厂函数
 * @param filename - 存储文件名
 * @returns LazyStore 实例
 */
export const createLazyStore = (filename: string): LazyStore => {
  class CustomLazyStore extends LazyStore {
    constructor() {
      super(filename, { autoSave: false, defaults: {} });
    }
  }
  return new CustomLazyStore();
};

/**
 * 通用的保存数据到 Store 函数
 * @param store - LazyStore 实例
 * @param key - 存储键
 * @param data - 要保存的数据
 * @param successMessage - 成功日志消息
 */
export const saveToStore = async <T>(
  store: LazyStore,
  key: string,
  data: T,
  successMessage?: string
): Promise<void> => {
  try {
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
 * @param store - LazyStore 实例
 * @param key - 存储键
 * @param defaultValue - 默认值
 * @returns 加载的数据
 */
export const loadFromStore = async <T>(
  store: LazyStore,
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

/**
 * 创建并导出设置存储实例
 */
export const settingStore = new LazySettingStore();
