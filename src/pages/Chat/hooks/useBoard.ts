import { useMemo } from "react";
import { ChatModel } from "@/types/chat";
import { useSelectedChat } from "./useSelectedChat";

/**
 * 聊天面板布局数据的 hook
 * @param columnCount 每行显示的列数
 * @param isSplitter 是否启用可拖拽布局
 * @returns board - 二维数组，每行最多 columnCount 个模型
 * @returns chatModelList - 当前聊天的模型列表
 * @returns shouldUseSplitter - 是否应该使用 Splitter 布局
 */
export function useBoard(columnCount: number, isSplitter: boolean) {
  const { chatModelList } = useSelectedChat();

  // 将数组变成 n*m 的二维数组，每一行最多有 columnCount 个
  const board = useMemo<ChatModel[][]>(() => {
    const list: ChatModel[][] = [];
    for (let i = 0; i < chatModelList.length; i += columnCount) {
      list.push(chatModelList.slice(i, i + columnCount));
    }
    return list;
  }, [columnCount, chatModelList]);

  // 判断是否使用 Splitter 布局
  const shouldUseSplitter = isSplitter && chatModelList.length > 1;

  return { board, chatModelList, shouldUseSplitter };
}
