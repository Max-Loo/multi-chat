## 设计

### 核心改动

创建 `src/store/selectors/chatSelectors.ts`，包含：

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

const selectSelectedChatId = (state: RootState) => state.chat.selectedChatId;
const selectChatList = (state: RootState) => state.chat.chatList;

export const selectSelectedChat = createSelector(
  [selectSelectedChatId, selectChatList],
  (selectedChatId, chatList) =>
    selectedChatId ? chatList.find(c => c.id === selectedChatId) : undefined
);
```

`selectSelectedChatId` 和 `selectChatList` 作为 `createSelector` 的 input selectors，不单独导出——它们仅供内部组合使用，外部消费方只需 `selectSelectedChat`。

### hook 简化

```typescript
// 之前
const selectedChatId = useAppSelector(state => state.chat.selectedChatId)
const chatList = useAppSelector(state => state.chat.chatList)
const selectedChat = useMemo(() => { ... find ... }, [selectedChatId, chatList])

// 之后
const selectedChat = useAppSelector(selectSelectedChat)
return selectedChat ?? null
```

### 为什么不创建更多 selector

简单 selector（如 `selectChatList`、`selectModelsLoading`）只是 `state => state.xxx.yyy`，跟直接写在组件中没有运行时差异，封装收益有限。只有需要 `createSelector` 做 memoization 的场景才值得抽成独立 selector。
