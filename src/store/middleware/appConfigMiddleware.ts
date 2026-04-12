import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { RootState } from "..";
import { setAppLanguage, setTransmitHistoryReasoning, setAutoNamingEnabled, initializeAppLanguage } from "../slices/appConfigSlices";
import { LOCAL_STORAGE_LANGUAGE_KEY } from "@/services/global";
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from "@/utils/constants";
import { changeAppLanguage } from "@/services/i18n";
import { toastQueue } from '@/services/toast';

export const saveDefaultAppLanguage = createListenerMiddleware<RootState>()

saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,
    initializeAppLanguage.fulfilled,
  ),
  effect: async (action, listenerApi) => {
    // 根据 action 类型选择数据源，确保持久化的值准确可靠
    // - initializeAppLanguage.fulfilled: 使用 action.payload（直接来自 thunk 返回值，更可靠）
    // - setAppLanguage: 使用 store 中的值（可能有其他中间件或 reducer 修改）
    const isInitializeFulfilled = initializeAppLanguage.fulfilled.match(action);
    const langToPersist = isInitializeFulfilled
      ? action.payload as string
      : listenerApi.getState().appConfig.language;

    // 持久化到 localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, langToPersist);
    } catch (error) {
      console.warn('[LanguagePersistence] 持久化失败:', error);
    }

    // 只在用户主动切换语言时显示 Toast（初始化时不显示）
    if (action.type === 'appConfig/setAppLanguage') {
      const loadingToast = await toastQueue.loading('切换语言中...');

      try {
        const result = await changeAppLanguage(langToPersist);
        toastQueue.dismiss(loadingToast);

        if (result.success) {
          toastQueue.success('语言切换成功');
        } else {
          toastQueue.error(`语言切换失败: ${langToPersist}`);
        }
      } catch (error) {
        toastQueue.dismiss(loadingToast);
        console.error('Language change error:', error);
        toastQueue.error('语言切换失败，请重试');
      }
    }
  },
})

/**
 * 监听器：持久化是否传输推理内容的开关状态到 localStorage
 */
saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setTransmitHistoryReasoning,
  ),
  effect: async (_, listenerApi) => {
    const transmitHistoryReasoning = listenerApi.getState().appConfig.transmitHistoryReasoning
    localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, String(transmitHistoryReasoning))
  },
})

/**
 * 监听器：持久化自动命名功能开关状态到 localStorage
 */
saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAutoNamingEnabled,
  ),
  effect: async (_, listenerApi) => {
    const autoNamingEnabled = listenerApi.getState().appConfig.autoNamingEnabled
    localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, String(autoNamingEnabled))
  },
})