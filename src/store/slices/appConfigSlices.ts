import { getDefaultAppLanguage } from "@/lib/global";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY } from "@/utils/constants";

export interface AppConfigSliceState {
  // 当前应用的语言类型
  language: string;
  // 是否在历史消息中传输推理内容（默认 false）
  includeReasoningContent: boolean;
}

const initialState: AppConfigSliceState = {
  language: '',
  includeReasoningContent: false,
}

/**
 * 初始化应用的语言
 */
export const initializeAppLanguage = createAsyncThunk(
  'appConfig/language/initialize',
  async () => {
    try {
      return await getDefaultAppLanguage()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Fail to initialize language', { cause: error });
    }
  },
)

/**
 * 初始化是否传输推理内容的开关状态
 * @returns 从 localStorage 读取的开关状态，默认为 false
 */
export const initializeIncludeReasoningContent = createAsyncThunk(
  'appConfig/includeReasoningContent/initialize',
  async () => {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY);
      return storedValue === 'true';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Fail to initialize includeReasoningContent', { cause: error });
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
    setIncludeReasoningContent: (state, action: PayloadAction<boolean>) => {
      state.includeReasoningContent = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 初始化应用的语言，并保存到 store 中
      .addCase(initializeAppLanguage.fulfilled, (state, action) => {
        state.language = action.payload
      })
      // 初始化是否传输推理内容的开关状态
      .addCase(initializeIncludeReasoningContent.fulfilled, (state, action) => {
        state.includeReasoningContent = action.payload
      })
  },
})


export const {
  setAppLanguage,
  setIncludeReasoningContent,
} = appConfigSlice.actions;

/**
 * 选择器：获取是否传输推理内容的开关状态
 * @param state Redux store 的 RootState
 * @returns 当前开关状态（true 表示开启，false 表示关闭）
 */
export const selectIncludeReasoningContent = (state: { appConfig: AppConfigSliceState }) => state.appConfig.includeReasoningContent;

export default appConfigSlice.reducer;