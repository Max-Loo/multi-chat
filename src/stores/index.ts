/**
 * Pinia Store 统一入口
 *
 * 提供 pinia 实例工厂与插件安装（对应既有 src/store/index.ts 的角色，
 * 应用挂载时通过 app.use(pinia) 激活）。
 *
 * 插件对应关系（listener middleware → $onAction 订阅）：
 * - saveChatListMiddleware  → installChatPlugin
 * - saveModelsMiddleware    → installModelPlugin
 * - saveDefaultAppLanguage  → installAppConfigPlugin
 */
import { createPinia, type Pinia } from 'pinia';
import type { App } from 'vue';
import { installChatPlugin } from './plugins/chatPlugin';
import { installModelPlugin } from './plugins/modelPlugin';
import { installAppConfigPlugin } from './plugins/appConfigPlugin';

/**
 * 创建并配置应用级 Pinia 实例
 * 按顺序安装持久化与副作用插件
 */
export function createAppPinia(): Pinia {
  const pinia = createPinia();

  pinia.use(installChatPlugin);
  pinia.use(installModelPlugin);
  pinia.use(installAppConfigPlugin);

  // pinia 4 行为变化：无 app 实例时 use() 会将插件放入待安装队列（toBeInstalled），
  // 仅在 app.use(pinia) 时才真正安装。组件外使用（初始化流程、单元测试）需要
  // 手动冲刷队列，否则插件（持久化/自动命名等副作用）不会生效。
  // 真实应用挂载时 app.use(pinia) 会再次调用 install，队列为空，调用是幂等的。
  if (!pinia._a) {
    pinia.install({
      provide: () => {},
      config: { globalProperties: {} },
    } as unknown as App);
  }

  return pinia;
}

// 统一导出所有 store 的 use 函数
export { useChatStore } from './chatStore';
export { useModelStore } from './modelStore';
export { useModelProviderStore } from './modelProviderStore';
export { useAppConfigStore } from './appConfigStore';
export { useChatPageStore } from './chatPageStore';
export { useModelPageStore } from './modelPageStore';
export { useSettingPageStore } from './settingPageStore';
