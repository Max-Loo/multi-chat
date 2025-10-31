import { LazyStore } from '@tauri-apps/plugin-store';


// 各种全局储存实例，都使用懒加载
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
      await super.set(key, value)
      await settingStore.save();
    } catch (error) {
      console.error(message, error)
      throw new Error(message)
    }
  }
}


// 创建并导出
export const settingStore = new LazySettingStore()