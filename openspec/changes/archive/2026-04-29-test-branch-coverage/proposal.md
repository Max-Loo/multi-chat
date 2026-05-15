# 补强分支覆盖与错误路径测试

## 问题

项目行覆盖率 93.33%，但分支覆盖率只有 76.37%，差了 17 个百分点。大量代码被执行到了，但条件分支（if/else、catch、三元表达式）只有 happy path 被测试。

这意味着生产环境中真正需要保护的地方——错误处理、边界条件、状态异常——恰恰是测试最薄弱的区域。

## 当前最薄弱的区域

### 核心业务逻辑（最高优先级）

| 文件 | 行覆盖 | 分支覆盖 | 鸿沟 | 未覆盖的关键分支 |
|------|--------|---------|------|----------------|
| `chatSlices.ts` | 82.82% | 70.78% | 12% | `sendMessage.fulfilled` 的 appendHistory 失败路径；`generateChatName` 的 null payload；`deleteChat` 正在发送时的跳过；`setSelectedChatId` 的前一个聊天清理组合 |
| `chat/index.ts` | 69.23% | 71.42% | — | `MetadataCollectionError` 优雅降级；非 metadata 错误的 rethrow |
| `providerLoader.ts` | 85.71% | 50% | 36% | 网络恢复后的 `preloadProviders`；browser 环境检查的 false 分支 |
| `modelProviderSlice.ts` | 87.83% | 69.23% | 19% | `triggerSilentRefreshIfNeeded` 的 backgroundRefreshing 守卫；`rejectWithValue` 路径 |

### 条件渲染组件（中优先级）

| 文件 | 行覆盖 | 分支覆盖 | 鸿沟 |
|------|--------|---------|------|
| `NoProvidersAvailable.tsx` | 100% | 46.66% | 53% |
| `MobileDrawer/index.tsx` | 100% | 54.16% | 46% |
| `FatalErrorScreen/index.tsx` | 97% | 52.56% | 45% |
| `Chat/index.tsx` | 97% | 54.54% | 42% |

### Redux 状态组合（中优先级）

`chatSlices` 的 `extraReducers` 中多个 handler 存在嵌套条件分支，组合路径覆盖不全：

- `setSelectedChatIdWithPreload.fulfilled`：chatId 有无 × previousChatId 有无 × 正在发送与否 = 6 种组合
- `generateChatName.fulfilled`：payload null × metaIdx 找到 × activeChat 已加载 = 8 种组合

## 范围

### 三条并行轨道

**轨道 A：Error Path 补强（服务层 + Store）**
- `chat/index.ts` 的 `MetadataCollectionError` catch 路径和 rethrow 路径
- `chatSlices.ts` 的 `rejected` handler、null payload、状态异常组合
- `providerLoader.ts` 的网络恢复、环境检查分支
- `modelProviderSlice.ts` 的 `rejectWithValue` 和 backgroundRefreshing 路径

**轨道 B：条件渲染分支（组件层）**
- `NoProvidersAvailable` 不同 provider 状态下的渲染
- `FatalErrorScreen` 不同错误类型和重置路径
- `MobileDrawer` 开关状态条件
- `Chat/index.tsx` 条件渲染分支

**轨道 C：Redux 状态组合**
- `chatSlices` 的 `sendMessage`、`generateChatName`、`setSelectedChatIdWithPreload` 的完整分支组合

## 预期结果

- 分支覆盖率从 76% 提升到 82%+（核心模块 85%+）
- 每条新增测试都有明确的断言，覆盖具体的错误/边界场景
- 核心业务逻辑的回归保护力显著提升

## 非目标

- 不追求 100% 分支覆盖——一些环境依赖分支（`import.meta.env.DEV`、`typeof window`）在单测中难以覆盖
- 不调整覆盖率阈值
- 不涉及 UI 视觉回归测试

## 前置依赖

- **变更 1**（test-quality-cleanup）：伪测试清理完成后，新增测试才能基于干净的基线

## 关联变更

- **变更 1**（test-quality-cleanup）：清理伪测试
- **变更 3**（待创建，可选）：引入突变测试验证本次补强的有效性
