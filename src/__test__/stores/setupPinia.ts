/**
 * Pinia store 测试公共工具
 *
 * 创建带全部插件的 Pinia 实例并激活，保证 store 与插件行为与生产一致。
 */
import { setActivePinia } from 'pinia';
import { createAppPinia } from '@/stores';

/**
 * 初始化测试用 Pinia（含全部插件）
 * 在每个用例的 beforeEach 中调用
 */
export function setupPinia(): void {
  setActivePinia(createAppPinia());
}
