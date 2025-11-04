import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { initializeModels } from "@/store/slices/modelSlice";
import { initializeChatList } from "@/store/slices/chatSlices";

// 初始化应用启动时候需要读取的数据
export const useInitializeAppData = () => {

  const dispatch = useAppDispatch()

  // 组件挂载时初始化模型数据
  useEffect(() => {
    dispatch(initializeModels());
    dispatch(initializeChatList())
  }, [dispatch]);
}