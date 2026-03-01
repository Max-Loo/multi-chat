import { configureStore, EnhancedStore } from '@reduxjs/toolkit'
import modelReducer from '@/store/slices/modelSlice'
import chatReducer from '@/store/slices/chatSlices'
import chatPageReducer from '@/store/slices/chatPageSlices'
import appConfigReducer from '@/store/slices/appConfigSlices'
import modelProviderReducer from '@/store/slices/modelProviderSlice'
import { saveDefaultAppLanguage } from '@/store/middleware/appConfigMiddleware'
import type { RootState } from '@/store'

/**
 * Redux store 重置工具
 * 用于集成测试中创建和重置 Redux store
 */

let testStore: EnhancedStore<RootState> | null = null

/**
 * 获取测试用的 Redux store
 * 每次调用返回新的 store 实例
 */
export function getTestStore(): EnhancedStore<RootState> {
  if (!testStore) {
    testStore = configureStore({
      reducer: {
        models: modelReducer,
        chat: chatReducer,
        chatPage: chatPageReducer,
        appConfig: appConfigReducer,
        modelProvider: modelProviderReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }).prepend(saveDefaultAppLanguage.middleware),
    })
  }
  return testStore
}

/**
 * 重置 Redux store
 * 清除所有状态
 */
export function resetStore(): void {
  if (testStore) {
    testStore.dispatch({ type: 'RESET' })
  }
  testStore = null
}

/**
 * 清理测试 store
 * 在测试结束后调用
 */
export function cleanupStore(): void {
  testStore = null
}
