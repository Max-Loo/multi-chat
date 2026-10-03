import { createPinia } from 'pinia';
import type { ModelSliceState } from './models';
import type { ChatSliceState } from './chat';
import type { ChatPageSliceState } from './chatPage';
import type { AppConfigSliceState } from './appConfig';
import type { ModelProviderSliceState } from './modelProvider';
import type { SettingPageSliceState } from './settingPage';
import type { ModelPageSliceState } from './modelPage';

// 创建 Pinia 实例（在应用入口 main.ts 中通过 app.use(pinia) 注册）
export const pinia = createPinia();

// 领域状态类型导出（保持与迁移前一致的类型名）
export type {
  ModelSliceState,
  ChatSliceState,
  ChatPageSliceState,
  AppConfigSliceState,
  ModelProviderSliceState,
  SettingPageSliceState,
  ModelPageSliceState,
};
