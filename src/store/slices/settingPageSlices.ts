import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * 设置页面状态管理
 * @description 管理设置页面的抽屉打开/关闭状态
 */
export interface SettingPageSliceState {
  /** 移动端抽屉是否打开 */
  isDrawerOpen: boolean;
}

/**
 * 初始状态
 */
const initialState: SettingPageSliceState = {
  isDrawerOpen: false,
};

/**
 * 设置页面 Slice
 */
const settingPageSlice = createSlice({
  name: 'settingPage',
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

export const { toggleDrawer, setIsDrawerOpen } = settingPageSlice.actions;
export default settingPageSlice.reducer;
