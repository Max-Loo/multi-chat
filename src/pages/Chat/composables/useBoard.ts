/**
 * 聊天面板布局数据组合式函数（对应旧版 pages/Chat/hooks/useBoard.ts）
 *
 * @param columnCount 每行显示的列数（响应式）
 * @param isSplitter 是否启用可拖拽布局（响应式）
 */
import { computed, type ComputedRef } from 'vue';
import type { ChatModel } from '@/types/chat';
import { useSelectedChat } from './useSelectedChat';

/** 返回值 */
export interface UseBoardResult {
  /** 二维数组，每行最多 columnCount 个模型 */
  board: ComputedRef<ChatModel[][]>;
  /** 当前聊天的模型列表 */
  chatModelList: ComputedRef<ChatModel[]>;
  /** 是否应该使用 Splitter 布局 */
  shouldUseSplitter: ComputedRef<boolean>;
}

export function useBoard(
  columnCount: ComputedRef<number> | (() => number),
  isSplitter: ComputedRef<boolean> | (() => boolean),
): UseBoardResult {
  const { chatModelList } = useSelectedChat();

  const getColumnCount = (): number =>
    typeof columnCount === 'function' ? columnCount() : columnCount.value;
  const getIsSplitter = (): boolean =>
    typeof isSplitter === 'function' ? isSplitter() : isSplitter.value;

  // 将数组变成 n*m 的二维数组，每一行最多有 columnCount 个
  const board = computed<ChatModel[][]>(() => {
    const list: ChatModel[][] = [];
    const models = chatModelList.value;
    const cols = getColumnCount();
    for (let i = 0; i < models.length; i += cols) {
      list.push(models.slice(i, i + cols));
    }
    return list;
  });

  // 判断是否使用 Splitter 布局
  const shouldUseSplitter = computed(
    () => getIsSplitter() && chatModelList.value.length > 1,
  );

  return { board, chatModelList, shouldUseSplitter };
}
