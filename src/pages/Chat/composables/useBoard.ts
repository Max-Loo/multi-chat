/**
 * 聊天面板布局数据组合式函数（转写自 React pages/Chat/hooks/useBoard）
 *
 * @param columnCount 每行显示的列数（响应式）
 * @param isSplitter 是否启用可拖拽布局（响应式）
 * @returns board 二维数组，每行最多 columnCount 个模型
 * @returns chatModelList 当前聊天的模型列表
 * @returns shouldUseSplitter 是否应该使用 Splitter 布局
 */
import { computed, type Ref } from 'vue';
import type { ChatModel } from '@/types/chat';
import { useChatPageSelectedChat } from './useSelectedChat';

export function useBoard(
  columnCount: Ref<number> | (() => number),
  isSplitter: Ref<boolean> | (() => boolean),
): {
  board: Ref<ChatModel[][]>;
  chatModelList: ReturnType<typeof useChatPageSelectedChat>['chatModelList'];
  shouldUseSplitter: Ref<boolean>;
} {
  const { chatModelList } = useChatPageSelectedChat();

  const colCount = typeof columnCount === 'function' ? columnCount : () => columnCount.value;
  const useSplitter = typeof isSplitter === 'function' ? isSplitter : () => isSplitter.value;

  // 将数组变成 n*m 的二维数组，每一行最多有 columnCount 个
  const board = computed<ChatModel[][]>(() => {
    const list: ChatModel[][] = [];
    for (let i = 0; i < chatModelList.value.length; i += colCount()) {
      list.push(chatModelList.value.slice(i, i + colCount()));
    }
    return list;
  });

  // 判断是否使用 Splitter 布局
  const shouldUseSplitter = computed(
    () => useSplitter() && chatModelList.value.length > 1,
  );

  return { board, chatModelList, shouldUseSplitter };
}
