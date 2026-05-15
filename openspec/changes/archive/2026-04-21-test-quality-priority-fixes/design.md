## Context

`feat/test` 分支的两轮提交（`2db6245`、`e9ae5c4`）修复了假绿色测试和提取了部分共享 mock，但审查发现 6 个问题仍有较高修复价值。这些问题分为两类：mock 状态泄漏（正确性风险）和代码卫生（维护成本）。涉及 5 个测试文件和 1 个生产代码文件。

## Goals / Non-Goals

**Goals:**

- 消除 mock 状态跨测试泄漏的风险
- 消除 ToastQueue 单例在测试中的状态残留
- 减少测试代码中的重复定义和冗余调用
- 恢复被削弱的类型安全

**Non-Goals:**

- 不处理剩余 7 个「中」优先级的代码卫生问题（1.2、1.4、1.5、2.1、2.2、2.4、3.6）
- 不重构测试架构或提取更多共享工厂函数
- 不改动非测试相关的生产代码（ToastQueue 的 `reset()` 除外）

## Decisions

### 1. ToastQueue `reset()` 方法的可见性

**决策**：添加为公开方法，不使用 `@internal` 或条件导出。

**理由**：`ToastQueue` 是应用内单例，测试需要重置其内部状态。使用公开方法是 Vitest 项目的常见做法，引入条件导出会增加不必要的复杂度。方法命名 `reset()` 语义清晰，不会被误用在生产代码中。

### 2. sonner mock 简化策略

**决策**：使用 `Object.assign(renderToastToDom, { success: ..., error: ..., ... })` 模式。

**理由**：比 `Object.fromEntries` 更具可读性，每个方法名显式列出，便于后续维护者理解 mock 结构。

### 3. `createTestModel` 替换方式

**决策**：直接删除文件内的 `createTestModel` 函数定义，替换调用点为 `createDeepSeekModel`。

**理由**：两处的 `createTestModel` 默认值与 `createDeepSeekModel` 一致（DeepSeek 模型），语义完全等价，无需迁移参数。

## Risks / Trade-offs

- **`ToastQueue.reset()` 被生产代码误调用** → 方法名以测试意图命名，且生产代码中无调用场景，风险极低
- **`restoreAllMocks` 可能恢复掉需要跨测试保持的 mock** → 当前测试中无此需求，`beforeEach` 每次重新设置 mock，恢复是安全的
