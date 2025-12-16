import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { RootState } from "..";
import { setAppLanguage } from "../slices/appConfigSlices";
import { LOCAL_STORAGE_LANGUAGE_KEY } from "@/lib/global";
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