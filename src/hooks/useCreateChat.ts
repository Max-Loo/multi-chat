import { useCallback } from "react";
import { useAppDispatch } from "./redux";
import { useNavigateToChat } from "./useNavigateToPage";
import { createChat } from "@/store/slices/chatSlices";
import { generateId } from "ai";

/**
 * @description 创建新聊天的 Hook
 */
export const useCreateChat = () => {
  const dispatch = useAppDispatch();
  const { navigateToChat } = useNavigateToChat();

  /**
   * @description 创建新的聊天并跳转
   */
  const createNewChat = useCallback(async () => {
    const chat = {
      id: generateId(),
      name: "",
    };

    dispatch(createChat({ chat }));
    navigateToChat({
      chatId: chat.id,
    });
  }, [dispatch, navigateToChat]);

  return { createNewChat };
};
