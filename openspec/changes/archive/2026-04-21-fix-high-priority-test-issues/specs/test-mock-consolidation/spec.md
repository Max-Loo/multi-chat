## ADDED Requirements

### Requirement: 内存存储 mock 共享工具

系统 SHALL 提供通过 `globalThis` 注册的内存存储 mock 工具，供 `vi.mock` 工厂函数使用。该工具 SHALL 基于 `Map` 实现 `init`、`get`、`set`、`delete`、`keys`、`save`、`close`、`isSupported` 方法，模拟真实存储行为（实际读写数据，而非 `vi.fn()` 桩函数）。

#### Scenario: 在 vi.mock 工厂中使用共享存储 mock

- **WHEN** 测试文件通过 `globalThis.__createMemoryStorageMock()` 调用共享工具
- **THEN** 返回的 mock 对象 SHALL 包含 `createLazyStore`、`keyring` 等完整存储接口，且数据实际可读写

#### Scenario: 替换三处重复的内联存储 mock

- **WHEN** `model-config.integration.test.ts`、`modelStorage.test.ts`、`settings-change.integration.test.ts` 中的内联存储 mock 被替换
- **THEN** 这三个文件的测试行为 SHALL 与替换前完全一致

### Requirement: sonner toast mock 辅助函数

系统 SHALL 提供 sonner toast mock 的 DOM 渲染辅助函数，将 6 个重复的函数体（`toast`、`success`、`error`、`warning`、`info`、`loading`）统一为单一实现。

#### Scenario: 精简 toast mock 实现

- **WHEN** `toast-system.integration.test.tsx` 中的 sonner mock 被重构
- **THEN** 6 个方法 SHALL 共享同一个 DOM 渲染辅助函数，总行数从约 60 行减少到约 15 行

#### Scenario: DOM 渲染行为不变

- **WHEN** 重构后的 toast mock 被调用
- **THEN** SHALL 在 `data-testid="toast-container"` 容器中创建带有 `data-testid="toast-message"` 的 div 元素，文本内容为传入的 message

### Requirement: 统一使用已有模型工厂函数

`model-config.integration.test.ts` SHALL 移除 `createTestModel` 函数，改用 `src/__test__/helpers/fixtures/model.ts` 中的 `createMockModel` 或 `createDeepSeekModel`，通过 `overrides` 参数调整字段。

#### Scenario: 替换 createTestModel

- **WHEN** 测试需要创建 Model 对象
- **THEN** SHALL 使用 `createMockModel` 或 `createDeepSeekModel`，不再定义本地工厂函数

#### Scenario: ID 生成确定性

- **WHEN** 使用 `createMockModel` 替代 `createTestModel`
- **THEN** Model ID SHALL 由 `createIdGenerator` 生成（稳定、可追踪），不再使用 `Math.random()`

### Requirement: 消除 beforeEach/afterEach 双重重置

`model-config.integration.test.ts` SHALL 仅在 `afterEach` 中执行状态重置（`resetModelsStore()` 和 `memoryStore.clear()`），移除 `beforeEach` 中的重复调用。

#### Scenario: 重置操作仅在 afterEach 执行

- **WHEN** 测试运行
- **THEN** `resetModelsStore()` 和 `memoryStore.clear()` SHALL 仅在 `afterEach` 中被调用一次

#### Scenario: 测试失败时仍能清理状态

- **WHEN** 某个测试抛出异常
- **THEN** `afterEach` 中的重置 SHALL 仍然执行，确保后续测试不受污染

### Requirement: toastQueue 测试状态隔离验证

`toast-system.integration.test.tsx` SHALL 确认 `vi.resetModules()` + `await import(...)` 动态导入模式已提供充分的测试隔离。每个测试获取的 `toastQueue` 为全新实例，内部状态（`queue`、`toastReady`）天然为初始值，无需额外重置。

#### Scenario: 动态导入确保状态隔离

- **WHEN** 测试通过 `await import('@/services/toast/toastQueue')` 获取 `toastQueue`
- **THEN** 获取的 SHALL 为全新的 `ToastQueue` 实例，`queue` 为空数组，`toastReady` 为 `false`

### Requirement: 清理冗余注释

`ChatPanel.test.tsx` SHALL 删除约 8 处仅复述代码行为的注释，保留解释设计意图、选择器理由、边界条件的注释。

#### Scenario: 仅保留有信息量的注释

- **WHEN** 审查 ChatPanel.test.tsx 中的注释
- **THEN** 每条保留的注释 SHALL 包含代码自身无法表达的信息（如"为什么"而非"做了什么"）
