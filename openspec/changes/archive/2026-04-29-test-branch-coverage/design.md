## Context

项目行覆盖率 93.33%，但分支覆盖率只有 76.37%（差 17 个百分点）。核心业务逻辑中的 error path、Redux 状态组合分支、条件渲染分支大量未测试。

本变更依赖变更 1（test-quality-cleanup）完成后启动，确保在干净的测试基线上补强。

## Goals / Non-Goals

**Goals:**

- 补强 `chat/index.ts` 的 MetadataCollectionError 降级路径和 rethrow 路径
- 补强 `chatSlices.ts` extraReducers 中未覆盖的分支组合
- 补强 `providerLoader.ts` 的网络恢复和环境检查分支
- 补强 `modelProviderSlice.ts` 的 rejectWithValue 和 backgroundRefreshing 路径
- 补强条件渲染组件的关键分支（NoProvidersAvailable、FatalErrorScreen 等）
- 整体分支覆盖率从 76% 提升到 82%+

**Non-Goals:**

- 不追求 100% 分支覆盖——环境依赖分支（`import.meta.env.DEV`、`typeof window`）在单测中难以有意义地覆盖
- 不调整覆盖率阈值
- 不修改被测源代码
- 不引入新的测试工具或框架

## Decisions

### 决策 1：轨道划分策略

按代码层级和测试模式分为三条独立轨道，可并行推进：

```
轨道 A（服务层 + Store）— 最高优先级
  ├─ chat/index.ts: MetadataCollectionError catch + rethrow
  ├─ chatSlices.ts: extraReducers 分支组合
  ├─ providerLoader.ts: 网络恢复 + 环境检查
  └─ modelProviderSlice.ts: rejectWithValue + backgroundRefreshing

轨道 B（组件层）— 中优先级
  ├─ NoProvidersAvailable.tsx: 不同 provider 状态渲染
  ├─ FatalErrorScreen/index.tsx: 错误类型 + 重置路径
  ├─ MobileDrawer/index.tsx: 开关状态
  └─ Chat/index.tsx: 条件渲染

轨道 C（Redux 状态组合）— 中优先级
  └─ chatSlices: sendMessage/generateChatName/setSelectedChatId 完整组合
```

### 决策 2：chat/index.ts 错误路径测试方案

`streamChatCompletion` 函数（src/services/chat/index.ts:102-119）有两个未覆盖分支：

```
try {
  yield* processStreamEvents(...)
} catch (error) {
  if (error instanceof MetadataCollectionError) {  ← 分支 1: 未覆盖
    console.warn(...)
    return
  } else {                                         ← 分支 2: 未覆盖
    throw error
  }
}
```

**测试方案**：利用 `streamChatCompletion` 支持依赖注入（`dependencies` 参数），通过 mock `streamText` 让 `processStreamEvents` 抛出 `MetadataCollectionError` 或其他错误类型，验证降级和 rethrow 行为。

已有的集成测试 `index.integration.test.ts` 测了 happy path，需要在单元测试中补充 error path。

### 决策 3：chatSlices extraReducers 分支覆盖

通过审查源码（chatSlices.ts），识别出以下未覆盖分支及测试方案：

| 分支 | 位置 | 测试方案 |
|------|------|---------|
| `sendMessage.pending` re-entry（runningChat 已有 modelId） | 行 533-536 | 先 dispatch pending，再 dispatch pending 同一个 model，验证 isSending 被重置 |
| `sendMessage.fulfilled` appendHistoryToModel 失败 | 行 548 | fulfilled 时不将 chat 加入 activeChatData，验证 runningChat 不被清理 |
| `generateChatName.fulfilled` metaIdx 未找到 | 行 572 的 `if (metaIdx !== -1)` | 传入不存在的 chatId，验证不抛错 |
| `generateChatName.fulfilled` activeChat 未加载 | 行 578 的 `if (activeChat)` | 传入有 chatMetaList 但无 activeChatData 的场景 |
| `setSelectedChatIdWithPreload.fulfilled` 前一个聊天清理组合 | 行 597-601 | 构造 previousChatId + sendingChatIds 的不同组合 |
| `editChatName` 超长截断 | 行 409 | 传入 20+ 字符名称，验证截断 |
| `deleteChat` 正在发送时跳过 | 行 436-438 | 先设 sendingChatIds，再 dispatch deleteChat |
| `clearActiveChatData` 正在发送时跳过 | 行 460-462 | 先设 sendingChatIds，再 dispatch clearActiveChatData |

### 决策 4：providerLoader 测试方案

当前 `providerLoader.test.ts` 只测了加载和预加载的 happy path。需补充：

1. **网络恢复分支**：模拟 `window.online` 事件，验证 `handleNetworkRecover` 被触发并调用 `preloadProviders`
2. **`typeof window` false 分支**：这个分支在 happy-dom 中无法直接测试（window 始终存在），标记为环境依赖，不做强制覆盖

### 决策 5：条件渲染组件测试方案

组件分支覆盖低的根因是只测了默认 props 渲染。补强方案：

- **NoProvidersAvailable**（100% 行 / 46.66% 分支）：测有 providers、无 providers、加载中三种状态
- **FatalErrorScreen**（97% 行 / 52.56% 分支）：测不同 error 类型和 reset 回调
- **MobileDrawer**（100% 行 / 54.16% 分支）：测 open/close 状态切换

### 决策 6：modelProviderSlice 分支补强

需要阅读 `modelProviderSlice.ts` 的源码确定具体的未覆盖分支（`triggerSilentRefreshIfNeeded` 的 backgroundRefreshing 守卫、`rejectWithValue` 路径）。在 tasks 阶段再细化。

## Risks / Trade-offs

- **测试复杂度增加** → extraReducers 的分支组合测试需要精心构造 Redux state，使用 `createMockChat` 等工厂函数保持测试可读性
- **条件渲染测试依赖 mock 精度** → 组件测试需要精确 mock `useResponsive`、`useTranslation` 等 hook，mock 不准确会导致测试无效
- **环境依赖分支放弃覆盖** → `typeof window`、`import.meta.env.DEV` 等分支在单测环境中无法有意义地覆盖，接受这部分分支覆盖缺口
