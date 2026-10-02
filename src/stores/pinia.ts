/**
 * 应用级 Pinia 单例
 *
 * 初始化流程（initSteps，组件外）与应用挂载（main.ts）必须共享同一个
 * Pinia 实例，否则初始化阶段加载的数据（聊天列表、语言配置等）不会
 * 出现在应用使用的 store 中。模块级缓存保证 getAppPinia() 全局唯一。
 */
import type { Pinia } from 'pinia';
import { createAppPinia } from './index';

let appPinia: Pinia | null = null;

/**
 * 获取应用级 Pinia 单例
 * 首次调用时创建并安装持久化/自动命名插件（含组件外使用的队列冲刷）
 */
export function getAppPinia(): Pinia {
  if (!appPinia) {
    appPinia = createAppPinia();
  }
  return appPinia;
}
