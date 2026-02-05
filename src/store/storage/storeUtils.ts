/**
 * Store 插件存储模块 - 通用工具函数
 * 提供通用的 Store 创建、保存和加载函数
 * 使用 Store 兼容层，自动适配 Tauri 和 Web 环境
 */
import { createLazyStore as createCompatStore, type StoreCompat } from '@/utils/tauriCompat';

/**
 * 设置存储类，扩展基本 Store 功能
 */
class SettingStore {
  private store: StoreCompat;

  constructor() {
    this.store = createCompatStore('.setting.dat');
  }

  /**
   * 初始化存储
   */
  async init(): Promise<void> {
    await this.store.init();
  }

  /**
   * 获取值
   * @param key 键
   * @returns 值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(key);
  }

  /**
   * 设置值
   * @param key 键
   * @param value 值
   */
  async set(key: string, value: unknown): Promise<void> {
    await this.store.set(key, value);
  }

  /**
   * 删除值
   * @param key 键
   */
  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  /**
   * 保存更改
   */
  async save(): Promise<void> {
    await this.store.save();
  }

  /**
   * 设置并保存值
   * @param key 键
   * @param value 值
   * @param message 错误信息
   */
  async setAndSave(key: string, value: unknown, message?: string): Promise<void> {
    try {
      await this.store.set(key, value);
      await this.store.save();
    } catch (error) {
      console.error(message, error);
      throw new Error(message, { cause: error });
    }
  }
}

/**
 * 创建 LazyStore 实例的工厂函数
 * @param filename - 存储文件名
 * @returns StoreCompat 实例
 */
export const createLazyStore = (filename: string): StoreCompat => {
  return createCompatStore(filename);
};

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

/**
 * 创建并导出设置存储实例
 */
export const settingStore = new SettingStore();
