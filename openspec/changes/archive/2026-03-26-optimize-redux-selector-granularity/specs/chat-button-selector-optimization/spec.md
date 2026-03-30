# 规格：ChatButton Selector 优化

## 概述

将 `ChatButton` 组件内部的 `useAppSelector(selectedChatId)` 移除，改由父组件 `Sidebar` 订阅一次后通过 props 传入，消除 N 个子组件各自独立订阅全局状态导致的级联重渲染。

## 当前行为

```tsx
// ChatButton.tsx:38 — 每个 ChatButton 实例独立订阅
const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)
```

- N 个 `ChatButton` 各自持有独立的 Redux 订阅
- `selectedChatId` 变化时，所有 N 个实例的 selector 函数执行
- 即使 `memo` 比较函数最终返回 `true`（props 未变），组件函数体仍被调用一次

## 目标行为

```tsx
// Sidebar.tsx — 父组件订阅一次
const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)

// ChatButton — 通过 props 接收
<ChatButton chat={chat} isSelected={chat.id === selectedChatId} key={chat.id} />
```

- `selectedChatId` 变化时，只有 `Sidebar` 执行一次 selector
- `ChatButton` 通过 `isSelected` props 判断选中状态，`memo` 比较函数正常工作
- 删除操作中的 `selectedChatId` 判断改用 `isSelected` props

## 接口变更

### ChatButtonProps（修改）

```typescript
interface ChatButtonProps {
  chat: Chat
  isSelected: boolean  // 新增：是否为当前选中的聊天
}
```

### Sidebar（修改）

- 新增 `useAppSelector((state) => state.chat.selectedChatId)` 订阅
- 渲染 `ChatButton` 时传入 `isSelected={chat.id === selectedChatId}`

## 内部使用点

`selectedChatId` 在 `ChatButton` 内部有三处使用：

1. **第 126 行**：重命名视图的背景样式 `${chat.id === selectedChatId && 'bg-primary/20'}`
2. **第 166 行**：普通视图的背景样式 `${chat.id === selectedChatId ? 'bg-primary/20' : 'hover:bg-accent'}`
3. **第 78 行**：删除回调中判断 `if (chat.id === selectedChatId)`

以上三处均改为使用 `isSelected` props。

## memo 比较函数更新

当前的 `memo` 比较函数只比较 `id` 和 `name`，需要增加 `isSelected`：

```typescript
(prevProps, nextProps) => {
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.name === nextProps.chat.name &&
    prevProps.isSelected === nextProps.isSelected
  )
}
```

## 受影响的测试

需同步更新以下测试中 `ChatButton` 的渲染方式：

- `src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`

具体变更：
- `renderChatButton` 辅助函数需新增 `isSelected` 参数，传递给 `<ChatButton isSelected={isSelected} />`
- 选中状态测试（如"应该在选中状态时显示背景色"）需传 `isSelected={true}`
- 未选中状态测试（如"应该在未选中状态时不显示背景色"）需传 `isSelected={false}`
- "组件 memo 优化"测试中的 `rerender` 也需传入 `isSelected`
- 注意：store 中的 `selectedChatId` 对 `ChatButton` 不再生效，选中状态完全由 `isSelected` props 控制

## 验收标准

- `ChatButton` 内部不再包含任何 `useAppSelector` 调用
- `ChatButton` 内部不再导入 `useAppSelector`
- `Sidebar` 订阅 `selectedChatId` 并通过 `isSelected` props 传入
- 所有现有测试通过
- 功能行为不变：选中高亮、删除后清除 URL 参数、重命名时背景样式
