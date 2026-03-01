## Context

### 当前状态

应用使用 React Router v6 的 `useSearchParams()` 和 `useNavigate()` hooks 进行路由管理。当用户点击聊天时，`navigateToChat()` 函数会将 `chatId` 设置为 URL 查询参数：

```typescript
navigate(`/chat?chatId=${chatId}`)
```

在 `ChatPage` 组件中，`useEffect` 监听 URL 查询参数的变化，并同步到 Redux state：

```typescript
useEffect(() => {
  const chatId = searchParams.get('chatId')
  if (chatId) {
    dispatch(setSelectedChatId(chatId))
  }
}, [dispatch, searchParams])
```

### 问题根源

当用户删除聊天时，`chatSlices.ts` 的 `deleteChat` reducer 会：

1. 将被删除的聊天标记为 `isDeleted = true`
2. 如果删除的是当前选中的聊天，将 `state.selectedChatId` 设置为 `null`

**但是**，这个操作只更新了 Redux state，没有同步清除 URL 查询参数。这导致：

- URL 仍然包含 `?chatId=xxx`
- 用户刷新页面后，`useEffect` 会从 URL 读取已删除的 `chatId` 并尝试设置到 Redux state
- 虽然聊天已被标记为删除，但用户体验不佳

### 约束条件

- **不修改 Redux state 管理**：`deleteChat` reducer 的逻辑保持不变
- **不影响现有路由配置**：不需要修改 `router/index.tsx`
- **最小化代码变更**：仅在必要的文件中添加逻辑

## Goals / Non-Goals

**Goals:**
- 删除聊天时同步清除 URL 查询参数中的 `chatId`
- 确保删除操作失败时 URL 和 Redux state 保持不变
- 提供可复用的导航辅助函数

**Non-Goals:**
- 修改 Redux state 的结构或 reducer 逻辑
- 改变路由配置或导航模式
- 实现撤销/重做功能

## Decisions

### 决策 1：在 UI 层处理 URL 同步，而非 Redux 层

**选择**：在 `ChatButton.tsx` 的 `handleDelete` 函数中处理 URL 清除

**理由**：
- **关注点分离**：Redux 层负责状态管理，UI 层负责路由导航
- **灵活性**：不同场景下可能需要不同的导航行为（例如删除后跳转到其他聊天）
- **简单性**：不需要在 Redux 中引入路由依赖（保持 Redux 纯净）

**替代方案**：
- 在 Redux middleware 中监听 `deleteChat` action 并清除 URL
  - ❌ 增加了 Redux 和路由的耦合
  - ❌ 难以处理删除失败的回滚场景
- 在 `ChatPage` 组件中监听 `selectedChatId` 变化并同步 URL
  - ❌ 会导致双向同步，增加复杂度
  - ❌ 无法区分是用户操作还是程序修改

### 决策 2：提供独立的导航辅助函数

**选择**：在 `useNavigateToPage.ts` 中新增 `navigateToChatWithoutParams()` 函数

**理由**：
- **复用性**：未来可能有其他场景需要清除查询参数
- **一致性**：与现有的 `navigateToChat()` 函数保持一致的命名和组织方式
- **可测试性**：独立的函数更容易进行单元测试

**实现**：
```typescript
export const useNavigateToChat = () => {
  const navigate = useNavigate()

  const navigateToChatWithoutParams = () => {
    navigate('/chat')
  }

  return { navigateToChat, navigateToChatWithoutParams }
}
```

### 决策 3：仅在删除当前选中的聊天时清除 URL

**选择**：检查 `chat.id === selectedChatId` 再决定是否调用导航函数

**理由**：
- **符合用户预期**：删除非当前聊天时，用户仍在查看当前聊天，不应改变 URL
- **避免不必要的导航**：减少路由变化，提升性能
- **匹配 Redux 行为**：Redux 只在删除当前聊天时清除 `selectedChatId`

**实现**：
```typescript
const handleDelete = () => {
  const onOk = () => {
    try {
      dispatch(deleteChat({ chat }))
      toast.success('删除成功')

      // 如果删除的是当前选中的聊天，清除 URL 查询参数
      if (chat.id === selectedChatId) {
        navigateToChatWithoutParams()
      }
    } catch {
      toast.error('删除失败')
    }
  }

  modal.warning({
    title: '确认删除',
    description: '删除后无法恢复',
    onOk,
  })
}
```

### 决策 4：使用 try-catch 确保删除失败时不修改 URL

**选择**：将 `navigateToChatWithoutParams()` 放在 `try` 块中，仅当 `dispatch(deleteChat())` 成功时才调用

**理由**：
- **原子性**：要么删除和 URL 清除都成功，要么都失败
- **用户体验**：删除失败时，用户仍然停留在当前聊天，不会产生困惑
- **符合规格要求**：Spec 要求"删除操作失败时不修改 URL"

**风险缓解**：
- 如果 `dispatch(deleteChat())` 抛出异常，`catch` 块会捕获并显示错误提示
- 导航函数不会在错误情况下被调用

## Risks / Trade-offs

### Risk 1: 时间窗口问题

**风险**：在 `dispatch(deleteChat())` 和 `navigateToChatWithoutParams()` 之间，如果有其他代码读取 `selectedChatId`，可能会读取到不一致的状态。

**缓解**：
- React 的批处理机制确保状态更新和导航在同一渲染周期内完成
- 这是一个短暂的瞬间，用户不会感知到中间状态
- 即使有时间窗口，也不会影响功能正确性（最多是一次额外的渲染）

### Risk 2: 并发删除问题

**风险**：如果用户快速连续删除多个聊天，可能会出现导航覆盖问题。

**缓解**：
- `useConfirm()` hook 提供的确认对话框会阻止快速操作
- 用户必须手动确认每次删除操作
- 这不是高频操作，不需要过度优化

### Trade-off: 导航历史记录

**权衡**：每次删除当前聊天都会在浏览器历史记录中添加新记录（`/chat`）。

**影响**：
- 用户点击浏览器后退按钮可能会回到已删除的聊天 URL
- 但由于聊天已被标记为 `isDeleted`，不会导致功能错误

**未来优化**（可选）：
- 使用 `navigate('/chat', { replace: true })` 替换当前历史记录
- 但这可能会影响用户的后退导航体验，暂时不采用

## Migration Plan

### 部署步骤

1. **修改 `src/hooks/useNavigateToPage.ts`**
   - 新增 `navigateToChatWithoutParams()` 函数

2. **修改 `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`**
   - 在 `handleDelete` 函数中添加 URL 清除逻辑
   - 添加 `chat.id === selectedChatId` 条件判断

3. **测试验证**
   - 测试删除当前选中的聊天，验证 URL 变为 `/chat`
   - 测试删除非当前选中的聊天，验证 URL 保持不变
   - 测试删除失败场景，验证 URL 不被修改
   - 测试刷新页面后不加载已删除的聊天

### 回滚策略

如果出现问题，可以快速回滚：
1. 恢复 `ChatButton.tsx` 的原始代码（移除导航调用）
2. 保留 `useNavigateToPage.ts` 中的新增函数（不影响功能）

### 兼容性

- **向后兼容**：不破坏现有的导航逻辑
- **渐进式增强**：仅在删除操作中添加新的同步行为
- **不影响其他功能**：其他使用 `navigateToChat()` 的场景不受影响

## Open Questions

**无**。这是一个简单明确的 bug 修复，所有技术决策都已经确定。
