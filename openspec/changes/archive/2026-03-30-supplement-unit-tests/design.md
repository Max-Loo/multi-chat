## Context

项目当前有 130+ 测试文件，核心业务逻辑（crypto、chat service、Redux）已有较好的测试覆盖。经过全面分析发现两类缺口：
1. 6 个工具函数/Hook/Redux slice 模块完全无测试
2. 4 个现有测试文件存在不完整或跳过的测试

本项目遵循行为驱动测试原则（见 `src/__test__/README.md`），只 mock 系统边界，不 mock 内部实现。

## Goals / Non-Goals

**Goals:**
- 为所有无测试的工具函数建立完整的单元测试覆盖
- 为无测试的 Redux slice 和 Hook 建立单元测试
- 修复现有测试中的不完整和跳过用例
- 确保新增测试遵循项目已有的测试模式和规范

**Non-Goals:**
- 不追求 100% 行覆盖率
- 不为 shadcn/ui 组件或纯类型/枚举文件添加测试
- 不重构现有测试文件的结构
- 不修改源代码逻辑

## Decisions

### 1. 新增测试的目录组织
**决策**：新测试文件放在 `src/__test__/` 对应子目录下，与源文件路径保持映射关系。

**理由**：与项目已有 130+ 测试文件的组织方式保持一致。

### 2. 纯函数测试策略
**决策**：`htmlEscape`、`urlUtils`、`constants`、`providerUtils` 直接调用函数测试，不使用任何 mock。

**理由**：纯函数无副作用，直接测试输入输出即可。这些是测试最简单且 ROI 最高的部分。

**注意**：`escapeHtml` 使用 `document.createElement` 依赖 DOM API，项目 vitest 默认环境为 `happy-dom`（见 `vite.config.ts`），可正常运行。`escapeHtmlManual` 为纯字符串操作，无 DOM 依赖。若未来修改默认测试环境，需为 `escapeHtml` 测试添加 `@vitest-environment happy-dom` 指令。

### 3. Hook 测试策略
**决策**：`useDebouncedFilter` 使用 `@testing-library/react` 的 `renderHook` + `vi.useFakeTimers()` 测试。

**理由**：与项目已有 hook 测试（如 `useDebounce.test.ts`）保持一致。

### 4. Redux Slice 测试策略
**决策**：极简 slice（<5 个 reducer，如 `modelPageSlices` 和 `settingPageSlices`）直接测试全部 reducer 和初始状态；复杂 slice 聚焦 edge case，基础 CRUD 留给集成测试覆盖。

**理由**：极简 slice 的 reducer 总数很少，全部测试成本极低且能保证完整覆盖。复杂 slice 遵循 `chatSlices.test.ts`、`modelSlice.test.ts` 中已确立的"切片测试聚焦 edge case"策略。

### 5. 现有测试修复策略
**决策**：
- `useIsChatSending`：补全最后一个不完整的测试用例
- `chatMiddleware`：新增自动命名触发逻辑测试，覆盖 4 个前置条件（非手动命名、全局开关、空标题、对话长度=2）、内存锁防并发、锁释放场景。监听的 action type 为 `'chatModel/sendMessage/fulfilled'`（非 `startSendChatMessage.fulfilled`，二者是不同 thunk：`sendMessage` 的 type prefix 是 `'chatModel/sendMessage'`，`startSendChatMessage` 的是 `'chatModel/startSendChatMessage'`）。不修复 skip 的用例，因其依赖完整 runningChat 状态。
- `providerFactory`：新增错误处理场景测试
- `appConfigMiddleware`：新增 setAutoNamingEnabled 持久化测试

**理由**：优先补充有实际业务价值的测试场景，skip 的用例保留其原始注释说明。

### 6. chatMiddleware 自动命名测试的隔离策略
**决策**：`generatingTitleChatIds` 是模块级 `Set<string>`，未导出，测试无法直接清除。采用以下隔离策略：
- 每个测试用例使用不同的 `chatId`，避免跨用例锁冲突
- 测试 "锁释放" 场景时，先触发自动命名（加入锁），再 dispatch `generateChatName.fulfilled`（释放锁），验证同一 chatId 可再次触发
- 测试 "锁防并发" 场景时，对同一 chatId 连续 dispatch 两次 `sendMessage/fulfilled`，验证只触发一次 `generateChatName`

**理由**：使用不同 chatId 是最简方案，无需 `vi.resetModules()` 重导入模块，也无需依赖 afterEach 清理。锁释放和防并存的专项测试覆盖了 Set 的完整生命周期。

### 7. chatMiddleware 自动命名测试数据构造
**决策**：自动命名 listener 需要较深的 state 树（`state.chat.chatList → chatModelList → chatHistoryList`）。测试数据构造要点：
- `action.meta.arg` 必须包含 `chat`（含 `id`）和 `model`（含 `id`）
- `state.chat.chatList` 中需包含匹配 `chat.id` 的 chat 对象，其 `chatModelList` 中需包含匹配 `model.id` 的 chatModel，且 `chatHistoryList.length === 2`
- `state.appConfig.autoNamingEnabled` 需按条件设置为 `true`/`false`
- 复用 `src/__test__/fixtures/` 中已有的 chat fixture 工厂函数构造基础数据

**理由**：明确 state 层级结构，避免实现时反复查看源码确认数据路径。

## Risks / Trade-offs

- [mock 数据膨胀] → 复用 `src/__test__/fixtures/` 下已有的 mock 工厂函数
- [timer 测试不稳定] → 严格使用 `vi.useFakeTimers()` + `vi.useRealTimers()` 配对，afterEach 中清理
- [Redux slice 测试冗余] → 只测 edge case，基础 reducer 操作由集成测试覆盖
- [`providerUtils` 测试 ROI 低] → `getProviderLogoUrl` 为单行模板字符串函数，测试价值有限，但为保持"所有无测试模块均有覆盖"的目标一致性，仍保留独立测试文件
- [`modelPageSlices` 与 `settingPageSlices` 测试冗余] → 两个 slice 结构完全相同（state、reducer 一致），测试将近乎相同。保持独立文件以与 Non-Goals 中"不重构现有测试文件结构"保持一致
