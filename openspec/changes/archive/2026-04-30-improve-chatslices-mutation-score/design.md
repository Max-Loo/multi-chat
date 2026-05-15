## Context

chatSlices.ts（677 行）是聊天状态管理的 Redux slice，包含 13 个同步 reducer 和 6 个异步 thunk。当前变异测试产生 270 个变异体，其中 82 个存活（Survived）、32 个无覆盖（NoCoverage），变异得分 56.93%。

现有测试文件 `chatSlices.test.ts`（851 行）已覆盖核心异步流，但存在三个结构性缺陷：
1. 部分同步 reducer（`setChatMetaList`、`pushRunningChatHistory`）缺少独立测试
2. 条件分支只测了正向路径，缺少反向路径验证
3. 断言粒度太粗（`toBeDefined` / `toMatchObject`），无法检测字段级变异

## Goals / Non-Goals

### Goals
- 将 chatSlices.ts 变异得分从 56.93% 提升至 75%+
- 补全 4 个 NoCoverage 代码路径的测试
- 为条件表达式存活变异补充反向分支测试
- 精确化 state 变更断言

### Non-Goals
- 不重构 chatSlices.ts 源码（仅补充测试）
- 不修改 Stryker 配置中的 `mutate` 范围
- 不处理其他文件（providerLoader、crypto、chat/index）的变异
- 不在 CI 中集成变异测试

## Technical Design

### 策略：按变异类型分三批补充测试

```
优先级 1：NoCoverage（+12%）
┌──────────────────────────────────────────────────────┐
│ 目标：覆盖 32 个无测试变异体                          │
│ 方法：为 4 个未覆盖代码路径新增独立 describe 块        │
│ 预期：直接消除 NoCoverage 变异体                      │
└──────────────────────────────────────────────────────┘

优先级 2：ConditionalExpression survived（+8%）
┌──────────────────────────────────────────────────────┐
│ 目标：杀死 34 个条件表达式存活变异                     │
│ 方法：每个 if 条件补充 "条件为假" 的反向测试用例       │
│ 关键：验证 state 在条件不满足时的精确值               │
└──────────────────────────────────────────────────────┘

优先级 3：ObjectLiteral/BlockStatement survived（+5%）
┌──────────────────────────────────────────────────────┐
│ 目标：杀死 25 个对象/代码块存活变异                    │
│ 方法：将宽泛断言改为逐字段 toEqual 验证               │
│ 关键：检查 state 变更后的完整字段内容                 │
└──────────────────────────────────────────────────────┘
```

### 具体测试补充计划

#### 优先级 1：NoCoverage 测试

| 测试目标 | 对应变异体 | 新增用例数 |
|----------|-----------|-----------|
| `initializeChatList` fulfilled 中的 filter 逻辑（L64） | #51 #52 #53 | 2 |
| `setSelectedChatIdWithPreload` 内部预加载逻辑（L168-L197） | #85 #91-L105 #107 | 4 |
| `generateChatName` async thunk 内部（L225、L232） | #114 #115 | 2 |
| `startSendChatMessage` async thunk 内部（L268） | #120 | 1 |
| `setChatMetaList` | #179 #178 | 2 |
| 其他散落 NoCoverage | #148 #161 #162 #248 #247 | 3 |

#### 优先级 2：条件分支反向测试

核心存活条件（需补充反向路径）：

- L148 `if (!chatId)` → 补充 chatId 为 null 时的返回值验证
- L158 `if (!chatData)` → 补充 chatData 已缓存时的跳过加载路径
- L160 `if (!loaded)` → 补充 loaded 为 null 时的返回值
- L171 `chatModelList.length === 0` → 补充非空列表时的预加载路径
- L225 `if (!autoNamingEnabled)` → 补充开关关闭时的跳过路径
- L274 `isNotNil(model) && !model.isDeleted && model.isEnable` → 补充 model 为 null / isDeleted / 未启用时跳过发送的路径
- L335-L339 `updateMetaInList` 索引查找和更新 → 补充 metaIdx 找不到时的跳过
- L409 `name.length > 20` → 补充恰好 20 字符时的不截断路径
- L436 `state.sendingChatIds[chat.id]` → 补充不在发送中时的正常删除
- L441 `filter` 条件 → 补充过滤后列表内容的精确验证
- L527 `isNil(state.runningChat[chat.id][model.id])` → 补充已存在时的更新路径
- L592 `if (chatId && chatData)` → 补充无 chatData 时的跳过路径

#### 优先级 3：断言精确化

现有测试中的宽泛断言模式：
```typescript
// 当前（无法杀死 ObjectLiteral 变异）
expect(state.activeChatData[chat.id]).toBeDefined()

// 改为（能检测对象被替换为 {} 的变异）
expect(state.activeChatData[chat.id]).toEqual({
  ...expectedFields,
  chatModelList: [...],
  updatedAt: expect.any(Number),
})
```

### 文件变更范围

| 文件 | 变更类型 | 预估变更量 |
|------|---------|-----------|
| `src/__test__/store/slices/chatSlices.test.ts` | 新增测试用例 | +300-400 行 |
| `src/store/slices/chatSlices.ts` | 补充 `setChatMetaList` 命名导出 | +1 行 |
| `stryker.config.json` | 调整并发数 | ±1 行 |

### 不涉及的文件

- chatSlices.ts 源码逻辑不修改（仅补充遗漏的命名导出）
- 不新增测试文件（所有测试追加到现有文件）
- 不修改 mock 策略

## Risks & Mitigations

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 新增测试导致变异测试运行时间过长 | 开发体验下降 | 监控运行时间，超过 10 分钟则调整 `concurrency` 或 `timeoutMS` |
| 精确断言过于脆弱 | 重构时测试易断 | 使用 `expect.any(Number)` 等宽松匹配动态值 |
| Redux Immer 草稿类型限制断言方式 | 无法直接 toEqual Immer draft | 使用 `store.getState()` 获取最终 state 后断言 |
