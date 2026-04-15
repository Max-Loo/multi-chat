## Context

当前测试隔离工具 `resetTestState()` 是同步函数，内部调用的 `clearIndexedDB()` 是异步操作，但通过 `void` 以 fire-and-forget 方式执行。同时 `resetIndexedDB` 选项默认为 `false`，即默认不清理 IndexedDB。这两个问题叠加，使得测试间 IndexedDB 状态泄漏成为可能。

此外 `verifyIsolation()` 仅检查 `localStorage.length`，未覆盖 IndexedDB 和 Mock 状态，隔离验证不完整。

下游所有使用 `resetTestState()` 和 `useIsolatedTest()` 的测试文件都需要适配异步调用。

## Goals / Non-Goals

**Goals:**

- 消除 IndexedDB 清理的竞态条件，确保清理完成后再开始下一个测试
- 使 IndexedDB 清理成为默认行为，减少测试间状态泄漏风险
- 扩展 `verifyIsolation()` 的检查范围，提升隔离验证的可信度

**Non-Goals:**

- 不重构现有的 `clearIndexedDB()` 实现逻辑本身（它已经正确实现，问题在于调用方式）
- 不引入新的测试框架或隔离库
- 不修改非测试代码

## Decisions

### 决策 1：将 `resetTestState()` 改为异步函数

**选择**：将签名从 `void` 改为 `Promise<void>`，内部 `await clearIndexedDB()`。

**备选方案**：

- A) 保持同步，在 `beforeEach`/`afterEach` 中单独 `await clearIndexedDB()` — 增加调用方复杂度，且与 `resetTestState` 的语义不一致
- B) 提供同步和异步两个版本 — API 膨胀，容易误用

**理由**：Vitest 的 `beforeEach`/`afterEach` 原生支持 async 回调，改为异步的迁移成本极低。统一为异步函数最简洁。

### 决策 2：`resetIndexedDB` 默认值改为 `true`

**选择**：默认清理 IndexedDB。

**理由**：默认不清理意味着大多数测试根本不会清理 IndexedDB，只有在显式传参时才清理——这与隔离的初衷矛盾。改为默认清理是更安全的默认行为。

### 决策 3：`verifyIsolation()` 改为异步并扩展检查范围

**选择**：将 `verifyIsolation()` 从同步 `() => boolean` 改为异步 `async () => Promise<boolean>`。新增 IndexedDB 状态检查。

**备选方案**：

- A) 保持同步，仅做尽力而为的检查 — `indexedDB.databases()` 是异步 API，同步无法真正验证 IndexedDB 状态
- B) 在 `resetTestState()` 内部记录清理标志，`verifyIsolation()` 检查标志 — 间接验证，无法检测外部代码造成的泄漏

**理由**：`verifyIsolation()` 需要调用 `indexedDB.databases()` 这是一个异步 API，同步函数无法获取结果。既然 `resetTestState()` 已经异步化，`verifyIsolation()` 保持一致是自然的。调用方（`isolation.test.ts`）改为 `await` 即可。

### 决策 4：IndexedDB 清理策略统一

**选择**：在 `clearIndexedDB()` 中优先使用 `indexedDB.databases()`，当该方法不可用时 fallback 到硬编码数据库名列表。

**背景**：项目中存在两个 `clearIndexedDB` 实现：
- `helpers/isolation/reset.ts` — 使用 `indexedDB.databases()` 遍历
- `helpers/integration/clearIndexedDB.ts` — 注释明确写了「fake-indexeddb 可能不支持 databases() 方法」，改用硬编码列表

**理由**：集成测试的作者已发现 `databases()` 在测试环境中不可靠。应统一策略：先尝试 `databases()`，失败则 fallback。同时将 `verifyIsolation()` 的 IndexedDB 检查也使用同样的 fallback 策略。Fallback 列表使用业务代码中实际定义的数据库名：`multi-chat-store`（定义在 `src/utils/tauriCompat/store.ts`）和 `multi-chat-keyring`（定义在 `src/utils/tauriCompat/keyring.ts`）。

**附加修改**：修复集成测试 `src/__test__/helpers/integration/clearIndexedDB.ts` 中硬编码数据库名的错误（原为 `['multichat', 'multichat-keyval']`，应为 `['multi-chat-store', 'multi-chat-keyring']`），使其与业务代码一致。

## Risks / Trade-offs

- **[Breaking Change]** `resetTestState()` 签名从同步变为异步 → 缓解：所有调用点都在 `beforeEach`/`afterEach` 中，Vitest 原生支持 async 回调，只需加 `await`
- **[性能]** 默认开启 IndexedDB 清理可能增加每个测试的执行时间 → 缓解：`clearIndexedDB()` 在无数据库时快速返回（~1ms），实际影响可忽略
- **[环境兼容]** `indexedDB.databases()` 在部分测试环境中不可靠（fake-indexeddb 已知不支持） → 缓解：使用 fallback 策略，不可用时退回到硬编码数据库名列表；`clearIndexedDB()` 内部已有 `typeof indexedDB === 'undefined'` 保护
- **[Breaking Change]** `verifyIsolation()` 从同步改为异步 → 缓解：仅在 `isolation.test.ts` 中使用，改为 `await` 即可
