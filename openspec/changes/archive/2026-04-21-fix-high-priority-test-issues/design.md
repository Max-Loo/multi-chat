## Context

当前 `feat/test` 分支的测试代码经审查发现 6 个高优先级问题，涉及 5 个测试文件。问题集中在三个方面：**重复 mock 实现**（跨文件重复）、**测试状态管理缺陷**（双重重置、单例泄漏）、**冗余注释**。已有的 `helpers/mocks/` 和 `helpers/fixtures/` 提供了部分工具，但集成测试中因 `vi.mock` 工厂函数的限制而未被复用。

## Goals / Non-Goals

**Goals:**

- 消除 `createTestModel` 与 `createMockModel` 的重复，统一使用已有工厂函数
- 提取三处重复的内存存储 mock 为 `globalThis` 注册的共享工具，供 `vi.mock` 场景使用
- 精简 sonner mock 中 6 个完全相同的函数体为单一辅助函数
- 清理 `ChatPanel.test.tsx` 中仅复述代码行为的冗余注释
- 消除 `beforeEach`/`afterEach` 双重重置，统一防御性清理策略
- ~~修复 `toastQueue` 单例状态跨测试泄漏~~（已移除：`vi.resetModules()` + 动态导入已解决此问题）

**Non-Goals:**

- 不处理中低优先级问题（如 `mockResponsive` 模式重复、CSS 类名选择器等），留待后续迭代
- 不修改生产代码
- 不改变测试行为或断言逻辑，仅重构支撑代码

## Decisions

### 决策 1：共享 mock 工具的注册方式

**选择**：通过 `globalThis` 注册（与 `__createI18nMockReturn` 模式一致）

**理由**：`vi.mock` 工厂函数在模块作用域执行，无法直接引用测试文件中的变量。`globalThis` 是项目中已验证的模式（i18n mock），无需引入新机制。

**备选**：
- 在每个测试文件中直接调用 `createStorageMocks()` 并包装为 `vi.mock` 工厂 → 但需要在 `vi.hoisted` 中桥接，与直接用 `globalThis` 相比增加了样板代码
- 使用 `vi.mock` 的 `importOriginal` 参数 → 过于复杂，不适合此场景

### 决策 2：双重重置的统一策略

**选择**：保留 `afterEach` 中的清理，移除 `beforeEach` 中的重复调用

**理由**：`afterEach` 即使测试失败也能保证状态清理（防御性策略），`beforeEach` 中的重置是冗余操作。选一种策略即可，避免意图模糊。

### ~~决策 3：toastQueue 泄漏修复方式~~（已移除）

经二次校验，`toast-system.integration.test.tsx` 已通过 `vi.resetModules()` + `await import(...)` 动态导入确保每个测试获取全新的 `ToastQueue` 实例。内部 `queue` 和 `toastReady` 状态在新实例中天然为初始值，不存在跨测试泄漏。原方案要求为 `ToastQueue` 添加 `__resetForTesting` 方法，但这违反了"不修改生产代码"的 Non-Goals，且实际无需此方法。

### 决策 3（原决策 4）：createTestModel 替换方案

**选择**：直接使用已有的 `createMockModel`，通过 `overrides` 参数调整字段

**理由**：`createMockModel` 使用 `createIdGenerator` 生成稳定 ID，支持 `overrides` 参数覆盖任何字段，且已在 10+ 测试文件中验证。`createDeepSeekModel` 可直接用于 DeepSeek 场景。

## Risks / Trade-offs

- **[提取共享 mock 可能引入新 bug]** → 所有使用共享 mock 的测试必须通过，替换后逐一运行确认
- **[删除冗余注释可能误删有价值的上下文]** → 严格区分"复述代码行为"与"解释设计意图"，仅删除前者
- **[修改 5 个测试文件]** → 变更范围可控，每次修改后立即运行相关测试确认无回归
