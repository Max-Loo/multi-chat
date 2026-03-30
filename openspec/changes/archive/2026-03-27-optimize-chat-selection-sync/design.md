## Context

当前创建新聊天的流程：

```
useCreateChat.createNewChat()
  → dispatch(createChat({ chat }))     // 添加到 chatList
  → navigateToChat({ chatId })         // 更新 URL
  → ChatPage useEffect                 // 监听 URL 变化
  → dispatch(setSelectedChatIdWithPreload(chatId))  // 异步设置 selectedChatId
```

**问题分析**：

1. **时序问题**：从 URL 变化到 `selectedChatId` 更新需要经历 React 渲染周期 + useEffect 执行
2. **预加载无意义**：`setSelectedChatIdWithPreload` 会预加载 SDK，但新聊天没有模型，预加载直接返回
3. **状态不一致窗口**：在 useEffect 执行前，`selectedChatId` 可能是旧值或 null

## Goals / Non-Goals

**Goals:**

- 在创建新聊天时立即同步设置 `selectedChatId`
- 减少状态不一致的时间窗口
- 简化代码逻辑

**Non-Goals:**

- 不改变 URL 作为状态源的设计
- 不修改 ChatPage 的 useEffect 逻辑（仍然需要处理 URL 变化）
- 不修改切换已有聊天的逻辑

## Decisions

### Decision 1: 在 useCreateChat 中直接调用 setSelectedChatId

**选择**：在 `useCreateChat` 中添加 `dispatch(setSelectedChatId(chat.id))`

**理由**：
- 同步操作，立即生效
- 新聊天没有模型，不需要预加载
- 与现有 URL → useEffect 链路并行，不冲突

**替代方案**：
- ❌ 移除 useEffect 中的同步逻辑 → 会破坏其他入口（如 URL 直接访问）
- ❌ 使用 setSelectedChatIdWithPreload → 对新聊天无意义

### Decision 2: 保留 ChatPage 的 useEffect 逻辑

**选择**：不做修改

**理由**：
- 处理其他入口场景（URL 直接访问、浏览器后退/前进）
- 与 useCreateChat 的直接设置不冲突（设置相同的值）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 重复设置 selectedChatId | 无害操作，Redux 会检测到值相同，不触发重新渲染 |
| 代码冗余 | 可接受的冗余，保持 URL 同步机制的完整性 |

## 维护提示

**两套选中逻辑的职责边界**：

| 场景 | 触发路径 | 使用的方法 | 说明 |
|------|----------|-----------|------|
| 创建新聊天 | `useCreateChat` | `setSelectedChatId`（同步） | 新聊天无模型，无需预加载 |
| 切换已有聊天 | `ChatPage useEffect` | `setSelectedChatIdWithPreload`（异步） | 预加载对应供应商 SDK |
| URL 直接访问 | `ChatPage useEffect` | `setSelectedChatIdWithPreload`（异步） | 处理浏览器前进/后退等场景 |

**调用顺序要求**：

在 `useCreateChat.createNewChat()` 中，必须按以下顺序执行：
1. `dispatch(createChat({ chat }))` - 先将聊天添加到 chatList
2. `dispatch(setSelectedChatId(chat.id))` - 再同步设置选中状态
3. `navigateToChat({ chatId: chat.id })` - 最后更新 URL

此顺序确保在 URL 变化触发 useEffect 之前，`selectedChatId` 已经被正确设置。

## Migration Plan

无需迁移，纯代码修改，无数据变更。

**部署步骤**：
1. 修改 `useCreateChat.ts`
2. 更新相关测试
3. 验证创建新聊天的流程
