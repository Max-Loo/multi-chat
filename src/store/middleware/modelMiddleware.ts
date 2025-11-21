import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { createModel, deleteModel, editModel } from "../slices/modelSlice";
import { saveModels } from "../vaults/modelVault";

export const saveModelsMiddleware = createListenerMiddleware<RootState>()

saveModelsMiddleware.startListening({
  // 需要触发保存聊天记录的，都需要声明在这里
  matcher: isAnyOf(
    createModel,
    editModel,
    deleteModel,
  ),
  effect: async (_, listenerApi) => {
    await saveModels(listenerApi.getState().models.models)
  },
})