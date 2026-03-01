import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { RootState } from "..";
import { setAppLanguage, setIncludeReasoningContent } from "../slices/appConfigSlices";
import { LOCAL_STORAGE_LANGUAGE_KEY } from "@/lib/global";
import { LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY } from "@/utils/constants";
import { changeAppLanguage } from "@/lib/i18n";

export const saveDefaultAppLanguage = createListenerMiddleware<RootState>()

saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,
  ),
  effect: async (_, listenerApi) => {
    const currentLang = listenerApi.getState().appConfig.language
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, currentLang)
    await changeAppLanguage(currentLang)
  },
})

/**
 * 监听器：持久化是否传输推理内容的开关状态到 localStorage
 */
saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setIncludeReasoningContent,
  ),
  effect: async (_, listenerApi) => {
    const includeReasoningContent = listenerApi.getState().appConfig.includeReasoningContent
    localStorage.setItem(LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY, String(includeReasoningContent))
  },
})