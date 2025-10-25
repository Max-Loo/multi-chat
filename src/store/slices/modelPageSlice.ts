import { useAppDispatch } from "@/hooks/redux";
import { ModelPageEnum } from "@/pages/Model/utils/enums";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// 模型表格页面状态接口定义
export interface ModelPageState {
  // 当前渲染的页面的key
  key: ModelPageEnum;
}

// 模型页面的初始状态
const initialState: ModelPageState = {
  key: ModelPageEnum.TABLE_PAGE,
}


// 模型页面管理的Redux
const modelPageSlice = createSlice({
  name: 'modelPage',
  initialState,
  reducers: {
    // 设置页面标识的key值
    setPageKey: (state, action: PayloadAction<ModelPageEnum>) => {
      state.key = action.payload
    },
  },
})

// 导出action
export const { setPageKey } = modelPageSlice.actions

/** 封装跳转逻辑hooks */
export const useNavToPage = () => {
  const dispatch = useAppDispatch()
  // 跳转到添加模型页面
  const navToAddPage = () => {
    dispatch(setPageKey(ModelPageEnum.ADD_PAGE))
  }
  // 跳转到添加模型页面
  const navToTablePage = () => {
    dispatch(setPageKey(ModelPageEnum.TABLE_PAGE))
  }

  return {
    navToAddPage,
    navToTablePage,
  }
}

// 导出reducer
export default modelPageSlice.reducer
