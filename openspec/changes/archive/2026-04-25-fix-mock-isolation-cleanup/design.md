## Context

测试系统的全局清理钩子位于 `setup/cleanup.ts`，当前使用 `vi.clearAllMocks()` 清理 mock 状态。该 API 只清除调用历史（calls、instances、results），但保留通过 `mockReturnValue()`、`mockImplementation()`、`mockResolvedValue()` 等方法设置的自定义实现。这意味着测试 A 对 mock 行为的修改会泄漏到测试 B。

受影响的 mock 主要来自两种模式：
1. 全局 `vi.mock()` 工厂（`setup/mocks.ts`）— 这些不受 `restoreAllMocks` 影响，因为 `vi.mock()` 是模块级 hoisting
2. 测试文件中 describe-scope 的 `vi.fn()` — 这些会被 `restoreAllMocks` 重置实现

当前 150 个测试文件全部通过，但存在隐性的状态依赖风险。

## Goals / Non-Goals

**Goals:**
- 消除测试间 mock 实现泄漏的系统性风险
- 确保 `afterEach` 完全隔离测试间的 mock 状态
- 修复 `cleanup.ts` 中的 DRY 违反（重复的错误模式列表）

**Non-Goals:**
- 不改变全局 `vi.mock()` 模块 Mock 的结构或行为
- 不添加 localStorage 全局清理（属于独立改进）
- 不处理跳过测试（skipped tests）的问题
- 不更新 README 文档中过时的目录结构（属于独立改进）

## Decisions

### 决策 1：选择 `vi.restoreAllMocks()` 而非 `vi.resetAllMocks()`

**选择**：`vi.restoreAllMocks()`

**理由**：
- `resetAllMocks()` 清除实现但不恢复 `vi.spyOn()` 的原始方法
- `restoreAllMocks()` 在 `resetAllMocks()` 基础上额外恢复 `vi.spyOn()` 到原始实现
- 对 `vi.fn()` 独立 mock，两者行为相同（都重置为空实现）
- `restoreAllMocks()` 提供更强的隔离保障，且测试文件不再需要手动 `mockRestore()`

**替代方案**：`vi.resetAllMocks()` — 更温和但不够彻底，`vi.spyOn()` 创建的间谍不会恢复原实现

### 决策 2：适配策略 — 将自定义实现移入 `beforeEach`

**选择**：将 describe-scope 的自定义实现移入 `beforeEach`

**理由**：
- 保持闭包引用模式不变（`vi.mock()` 工厂引用外部 `vi.fn()` 的模式）
- `beforeEach` 在每个测试前重新注入实现，`restoreAllMocks` 在 `afterEach` 重置，形成完整循环
- 改动最小化，不需要重构 mock 工厂结构

**替代方案**：在 `vi.mock()` 工厂内直接定义实现 — 不可行，因为工厂只执行一次，无法按测试定制行为

### 决策 3：提取 `expectedErrorPatterns` 为顶层常量

**选择**：提取到 `cleanup.ts` 模块顶层常量

**理由**：两个分支（window 和 process）完全相同，维护时需要同步修改两处，违反 DRY。提取为常量后只需维护一处。

## Risks / Trade-offs

- **[风险] 6 个测试文件适配不完整导致测试失败** → 迁移方案：每个文件逐个修改后运行完整测试套件验证；如有遗漏可通过 `git revert` 单个文件回滚
- **[风险] 未来新增测试文件可能不了解 `beforeEach` 约束** → 迁移方案：在测试 README 中补充约定说明，describe-scope 的 `vi.fn()` 如有自定义实现必须在 `beforeEach` 中重新设置
- **[权衡] `restoreAllMocks()` 比 `clearAllMocks()` 稍慢** → 可忽略，重置操作是 O(n) 遍历 mock 注册表，对 1788 个测试的运行时间影响 < 100ms
