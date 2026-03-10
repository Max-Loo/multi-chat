import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * 模型页面状态管理
 * @description 管理模型页面的抽屉打开/关闭状态
 */
export interface ModelPageSliceState {
  /** 移动端抽屉是否打开 */
  isDrawerOpen: boolean;
}

/**
 * 初始状态
 */
const initialState: ModelPageSliceState = {
  isDrawerOpen: false,
};

/**
 * 模型页面 Slice
 */
const modelPageSlice = createSlice({
  name: 'modelPage',
  initialState,
  reducers: {
    /**
     * 切换移动端抽屉开关状态
     */
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },

    /**
     * 设置移动端抽屉开关状态
     */
    setIsDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isDrawerOpen = action.payload;
    },
  },
});

export const { toggleDrawer, setIsDrawerOpen } = modelPageSlice.actions;
export default modelPageSlice.reducer;
