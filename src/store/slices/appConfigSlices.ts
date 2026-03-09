import { getDefaultAppLanguage } from "@/lib/global";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from "@/utils/constants";

export interface AppConfigSliceState {
  // 当前应用的语言类型
  language: string;
  // 是否在历史消息中传输推理内容（默认 false）
  transmitHistoryReasoning: boolean;
  // 是否启用自动命名功能（默认 true）
  autoNamingEnabled: boolean;
}

const initialState: AppConfigSliceState = {
  language: '',
  transmitHistoryReasoning: false,
  autoNamingEnabled: true,
}

/**
 * 初始化应用的语言
 */
export const initializeAppLanguage = createAsyncThunk(
  'appConfig/language/initialize',
  async () => {
    try {
      const result = await getDefaultAppLanguage()
      return result.lang
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Fail to initialize language', { cause: error });
    }
  },
)

/**
 * 初始化是否传输推理内容的开关状态
 * @returns 从 localStorage 读取的开关状态，默认为 false
 */
export const initializeTransmitHistoryReasoning = createAsyncThunk(
  'appConfig/transmitHistoryReasoning/initialize',
  async () => {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY);
      return storedValue === 'true';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Fail to initialize transmitHistoryReasoning', { cause: error });
    }
  },
)

/**
 * 初始化自动命名功能开关状态
 * @returns 从 localStorage 读取的开关状态，默认为 true
 */
export const initializeAutoNamingEnabled = createAsyncThunk(
  'appConfig/autoNamingEnabled/initialize',
  async () => {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY);
      // 如果 localStorage 中没有值或值为 'false'，则返回 false，否则返回 true
      return storedValue !== 'false';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Fail to initialize autoNamingEnabled', { cause: error });
    }
  },
)

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setAppLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
    setTransmitHistoryReasoning: (state, action: PayloadAction<boolean>) => {
      state.transmitHistoryReasoning = action.payload
    },
    setAutoNamingEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoNamingEnabled = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 初始化应用的语言，并保存到 store 中
      .addCase(initializeAppLanguage.fulfilled, (state, action) => {
        state.language = action.payload
      })
      // 初始化是否传输推理内容的开关状态
      .addCase(initializeTransmitHistoryReasoning.fulfilled, (state, action) => {
        state.transmitHistoryReasoning = action.payload
      })
      // 初始化自动命名功能开关状态
      .addCase(initializeAutoNamingEnabled.fulfilled, (state, action) => {
        state.autoNamingEnabled = action.payload
      })
  },
})


export const {
  setAppLanguage,
  setTransmitHistoryReasoning,
  setAutoNamingEnabled,
} = appConfigSlice.actions;

/**
 * 选择器：获取是否传输推理内容的开关状态
 * @param state Redux store 的 RootState
 * @returns 当前开关状态（true 表示开启，false 表示关闭）
 */
export const selectTransmitHistoryReasoning = (state: { appConfig: AppConfigSliceState }) => state.appConfig.transmitHistoryReasoning;

/**
 * 选择器：获取自动命名功能开关状态
 * @param state Redux store 的 RootState
 * @returns 当前开关状态（true 表示开启，false 表示关闭）
 */
export const selectAutoNamingEnabled = (state: { appConfig: AppConfigSliceState }) => state.appConfig.autoNamingEnabled;

export default appConfigSlice.reducer;