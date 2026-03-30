## Context

当前 `chatSlices.ts` 中 `createChat` action 使用 `state.chatList.push()` 将新聊天追加到数组末尾。聊天列表渲染时无排序逻辑，直接按数组顺序展示。这导致新建的聊天出现在列表底部，用户需要滚动才能找到。

## Goals / Non-Goals

**Goals:**
- 新建聊天出现在列表头部

**Non-Goals:**
- 按最近活跃时间排序（需要给 Chat 类型增加时间戳字段）
- 修改已有聊天的排列顺序

## Decisions

**使用 `unshift` 替代 `push`**

将 `state.chatList.push(action.payload.chat)` 改为 `state.chatList.unshift(action.payload.chat)`。

- 替代方案 A：在渲染层（`useExistingChatList`）用 `.reverse()` 反转数组 — 会导致每次渲染都创建新数组，且语义不够直观
- 替代方案 B：给 `Chat` 类型加 `createdAt` 字段并按时间排序 — 过度设计，当前需求只需反转插入顺序

选择 `unshift` 是最直接、最小改动的方案。

## Risks / Trade-offs

- **已有用户的聊天顺序**: `chats.json` 中已有聊天顺序不变，仅影响新建聊天 — 无风险
- **持久化顺序变化**: 新建的聊天会存储在 JSON 数组头部 — 不影响功能，数组本身无序
- **重启后默认选中聊天变化**: `initializeChatList` 加载持久化数据后，初始化逻辑会选中 `chatList[0]`。改为 `unshift` 后，应用重启将默认选中最近创建的聊天而非最早创建的 — 这是符合用户直觉的正面变化
