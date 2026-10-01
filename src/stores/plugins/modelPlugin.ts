/**
 * 模型数据持久化插件（Pinia）
 *
 * 对应既有 Redux listener middleware：src/store/middleware/modelMiddleware.ts
 * 模型增删改后自动保存到存储。
 */
import type { PiniaPluginContext } from 'pinia';
import { saveModelsToJson } from '@/store/storage';

/** 需要触发模型持久化的 action 名称集合 */
const PERSIST_ACTIONS = new Set(['createModel', 'editModel', 'deleteModel']);

export function installModelPlugin(context: PiniaPluginContext): void {
  // 仅作用于 models store
  if (context.store.$id !== 'models') {
    return;
  }

  context.store.$onAction(({ name, after }) => {
    if (!PERSIST_ACTIONS.has(name)) {
      return;
    }

    after(() => {
      void saveModelsToJson(context.store.models);
    });
  });
}
