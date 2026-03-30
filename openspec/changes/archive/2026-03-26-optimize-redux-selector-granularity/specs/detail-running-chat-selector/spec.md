# 规格：Detail RunningChat Selector 优化

## 概述

将 `Detail` 组件中的 `runningChat` selector 从订阅整个嵌套对象缩小为精确的 `chatId + modelId` 路径，消除其他聊天/模型的发送状态变化对本组件的干扰。

## 当前行为

```tsx
// Detail/index.tsx:32
const runningChat = useAppSelector(state => state.chat.runningChat)
```

`runningChat` 的类型为 `Record<string, Record<string, { isSending, history, errorMessage }>>`。组件订阅了整个嵌套对象，任何层级的任何变化都会产生新引用，触发重渲染。

`runningChat` 在 `Detail` 内部有两处使用：

1. **第 121 行**：作为 `useEffect` 的依赖，用于监听内容变化触发 `ResizeObserver`
2. **第 167 行**：读取 `runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage` 展示错误信息

## 目标行为

```tsx
// 替换为精确路径的 selector
const runningChatData = useAppSelector(state =>
  state.chat.runningChat[selectedChat?.id]?.[chatModel.modelId]
)
```

- 仅当当前选中聊天的当前模型的运行数据变化时，selector 返回新引用
- 其他聊天或其他模型的发送状态变化不会触发本组件重渲染

## 使用点适配

### 1. ResizeObserver useEffect 依赖（第 121 行）

```tsx
// 当前
}, [historyList, runningChat, checkScrollStatus])

// 改为
}, [historyList, runningChatData, checkScrollStatus])
```

语义不变——仍然在运行数据变化时触发滚动状态检测，但不再因无关数据变化而触发。

**行为变化说明**：收窄后，同一 chat 下其他 `modelId` 的数据变化不再触发 ResizeObserver 重连。这是可接受的，因为 `ResizeObserver` 已通过监听 DOM 尺寸变化覆盖了内容溢出检测场景，`runningChatData` 变化触发重连只是额外的保险。如果未来出现"内容变化未引起尺寸变化时滚动状态未更新"的边缘问题，可在 useEffect 中添加一个单独的 `state.chat.runningChat[selectedChat?.id]`（chatId 级别）依赖作为兜底。

### 2. 错误信息展示（第 167-175 行）

```tsx
// 当前
runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage

// 改为直接使用 runningChatData
runningChatData?.errorMessage
```

不再需要手动做嵌套访问，因为 selector 已经精确到目标路径。

## 边界情况

- `selectedChat` 为 `null` 时：`undefined?.[modelId]` 安全返回 `undefined`，行为不变
- `runningChat[selectedChatId]` 不存在时：同样安全返回 `undefined`
- `chatModel.modelId` 不存在时：selector 返回 `undefined`，错误 Alert 不渲染

## 受影响的测试

需同步更新 `Detail` 相关测试中的 mock：

- `src/__test__/components/ChatPanelContentDetail.test.tsx`（第 66 行 `runningChat?: any`）
- `src/__test__/components/ChatPanel.test.tsx`（多处 `runningChat: {}`）

## 验收标准

- `Detail` 组件内部的 `useAppSelector` 不再订阅整个 `runningChat`
- 错误信息展示功能正常
- ResizeObserver 在运行数据变化时正确触发
- 所有现有测试通过
