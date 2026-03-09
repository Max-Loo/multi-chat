import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { RootState } from "..";
import { setAppLanguage, setTransmitHistoryReasoning, setAutoNamingEnabled } from "../slices/appConfigSlices";
import { LOCAL_STORAGE_LANGUAGE_KEY } from "@/lib/global";
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from "@/utils/constants";
import { changeAppLanguage } from "@/lib/i18n";
import { toast } from 'sonner';

export const saveDefaultAppLanguage = createListenerMiddleware<RootState>()

saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,
  ),
  effect: async (_, listenerApi) => {
    const currentLang = listenerApi.getState().appConfig.language
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, currentLang)

    // 显示 loading Toast
    const loadingToast = toast.loading('切换语言中...');

    try {
      // 调用 changeAppLanguage() 并处理返回的 Promise
      const result = await changeAppLanguage(currentLang);

      // 先 dismiss loading Toast
      toast.dismiss(loadingToast);

      // 根据返回结果显示不同的 Toast
      if (result.success) {
        toast.success('语言切换成功');
      } else {
        toast.error(`语言切换失败: ${currentLang}`);
      }
    } catch (error) {
      // dismiss loading Toast
      toast.dismiss(loadingToast);

      // 记录错误并显示错误 Toast
      console.error('Language change error:', error);
      toast.error('语言切换失败，请重试');
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