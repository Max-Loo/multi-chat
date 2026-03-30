# 规格：useIsSending Selector 优化

## 概述

将 `useIsSending` hook 中的 `runningChat` selector 从订阅整个嵌套对象缩小为当前选中聊天的路径，消除其他聊天的发送状态变化对 Detail 组件的间接重渲染影响。

## 背景

`useIsSending` 被 `Detail` 组件调用。即使 Detail 自身的 `runningChat` selector 已收窄为精确的 `chatId + modelId` 路径，`useIsSending` 仍然订阅了整个 `runningChat`，会抵消 Detail 的优化效果。

## 当前行为

```tsx
// useIsSending.ts:19
const runningChat = useAppSelector(state => state.chat.runningChat)

// useIsSending.ts:27
const chat = runningChat[selectedChat.id]
```

订阅了完整的 `runningChat` 嵌套对象，任何聊天/模型的运行数据变化都会产生新引用。

## 目标行为

```tsx
const currentChatRunning = useAppSelector(state =>
  state.chat.runningChat[selectedChat?.id]
)
```

- 仅当当前选中聊天的运行数据变化时，selector 返回新引用
- 其他聊天的发送状态变化不会触发使用 `useIsSending` 的组件重渲染

## 变更详情

### 删除

- 移除 `const runningChat = useAppSelector(state => state.chat.runningChat)`

### 新增

```tsx
const currentChatRunning = useAppSelector(state =>
  state.chat.runningChat[selectedChat?.id]
)
```

### 修改

```tsx
// 当前
const chat = runningChat[selectedChat.id]
const isSending = useMemo(() => {
  ...
}, [selectedChat, runningChat])

// 改为
const isSending = useMemo(() => {
  if (isNil(selectedChat)) {
    return false
  }
  if (isNil(currentChatRunning)) {
    return false
  }
  return Object.values(currentChatRunning).some(item => item.isSending)
}, [selectedChat, currentChatRunning])
```

## 边界情况

- `selectedChat` 为 `null` 时：`state.chat.runningChat[undefined]` → `undefined`，`isNil(currentChatRunning)` 检查返回 `false`
- 当前聊天无运行数据时：`currentChatRunning` 为 `undefined`，`isNil` 检查返回 `false`
- `selectedChat` 切换时：selector 路径自动切换，`useMemo` 因依赖变化重新计算

## 验收标准

- `useIsSending` 内部的 `useAppSelector` 不再订阅整个 `runningChat`
- `isSending` 在当前聊天有消息发送时正确返回 `true`
- `isSending` 在其他聊天有消息发送时不会触发使用它的组件重渲染
- 所有现有测试通过
