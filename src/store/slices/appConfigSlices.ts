import { getDefaultAppLanguage } from "@/lib/global";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AppConfigSliceState {
  // 当前应用的语言类型
  language: string;
}

const initialState: AppConfigSliceState = {
  language: '',
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

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setAppLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 初始化应用的语言，并保存到 store 中
      .addCase(initializeAppLanguage.fulfilled, (state, action) => {
        state.language = action.payload
      })
  },
})


export const {
  setAppLanguage,
} = appConfigSlice.actions;

export default appConfigSlice.reducer;