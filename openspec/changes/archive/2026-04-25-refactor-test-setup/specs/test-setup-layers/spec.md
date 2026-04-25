## ADDED Requirements

### Requirement: 测试 setup 分层架构

测试 setup SHALL 由三个独立模块组成，按职责边界分离：

- `setup/base.ts` — 环境基础设施（Polyfill、jest-dom 扩展、globalThis 注册）
- `setup/mocks.ts` — 全局 vi.mock 调用（Tauri API、AI SDK、UI 组件）
- `setup/cleanup.ts` — 运行时清理钩子和错误抑制

每个模块 SHALL 只包含其职责范围内的代码，不交叉引用其他层的内容。

#### Scenario: 单元测试环境组合所有层

- **WHEN** Vitest 加载单元测试配置（vite.config.ts）
- **THEN** setup 入口文件 SHALL 依次引入 base.ts、mocks.ts、cleanup.ts

#### Scenario: 集成测试环境组合 base 和 cleanup

- **WHEN** Vitest 加载集成测试配置（vitest.integration.config.ts）
- **THEN** setup 入口文件 SHALL 引入 base.ts 和 cleanup.ts
- **THEN** 集成测试环境 SHALL NOT 引入 mocks.ts

### Requirement: 环境基础设施层内容

`setup/base.ts` SHALL 包含以下内容且仅包含以下内容：

- `fake-indexeddb/auto` 导入
- ResizeObserver polyfill
- jest-dom matchers 扩展（`expect.extend(matchers)`）
- `globalThis.__VITEST__` 环境标识
- 全部 9 个 globalThis mock 工厂注册

#### Scenario: base 模块包含完整的环境基础设施

- **WHEN** base.ts 被加载
- **THEN** `globalThis.ResizeObserver` SHALL 已被定义为可实例化的类
- **THEN** `expect` SHALL 已扩展 jest-dom matchers
- **THEN** `globalThis.__VITEST__` SHALL 为 true
- **THEN** `globalThis.__createI18nMockReturn` SHALL 已注册
- **THEN** `globalThis.__mockI18n` SHALL 已注册
- **THEN** `globalThis.__createMemoryStorageMock` SHALL 已注册
- **THEN** `globalThis.__createResponsiveMock` SHALL 已注册
- **THEN** `globalThis.__createTauriCompatModuleMock` SHALL 已注册
- **THEN** `globalThis.__createToastQueueModuleMock` SHALL 已注册
- **THEN** `globalThis.__createScrollbarMock` SHALL 已注册
- **THEN** `globalThis.__createMarkdownItMock` SHALL 已注册
- **THEN** `globalThis.__createDompurifyMock` SHALL 已注册

#### Scenario: base 模块不包含 vi.mock 调用

- **WHEN** base.ts 被加载
- **THEN** base.ts SHALL NOT 包含任何 `vi.mock()` 调用

### Requirement: 全局 Mock 层内容

`setup/mocks.ts` SHALL 包含所有全局 `vi.mock()` 调用，供单元测试使用：

- `@/store/storage/storeUtils` mock
- `@/utils/tauriCompat/shell` mock
- `@/utils/tauriCompat/os` mock
- `@/utils/tauriCompat/http` mock
- `@/utils/tauriCompat/store` mock
- `@/utils/tauriCompat/env` mock
- `@/utils/tauriCompat` 桶模块 mock
- `ai` SDK mock（含 streamText、generateText、generateId、createIdGenerator）
- `@ai-sdk/deepseek` mock
- `@ai-sdk/moonshotai` mock
- `zhipu-ai-provider` mock
- `@/components/ui/skeleton` mock

#### Scenario: mocks 模块提供完整的 AI SDK mock

- **WHEN** mocks.ts 被加载
- **THEN** `streamText` SHALL 返回包含 thenable 和 fullStream 的 mock 对象
- **THEN** `generateText` SHALL 返回包含 text、usage、finishReason 的 mock 结果
- **THEN** `generateId` SHALL 每次调用返回递增的唯一 ID

#### Scenario: mocks 模块不包含 afterEach 或 cleanup 逻辑

- **WHEN** mocks.ts 被加载
- **THEN** mocks.ts SHALL NOT 包含 `afterEach`、`beforeEach`、`cleanup` 调用

### Requirement: 清理层内容

`setup/cleanup.ts` SHALL 包含以下内容：

- `setupCustomAssertions()` 调用
- `afterEach` 钩子：执行 `cleanup()` 和 `vi.clearAllMocks()`
- unhandled rejection 抑制逻辑（window 和 process 两个环境）

#### Scenario: afterEach 自动清理 Mock 和 DOM

- **WHEN** 任意测试用例执行完毕
- **THEN** `cleanup()` SHALL 被调用以清理 @testing-library 渲染的 DOM
- **THEN** `vi.clearAllMocks()` SHALL 被调用以重置所有 mock 状态

#### Scenario: 集成测试获得自动清理能力

- **WHEN** 集成测试环境加载 cleanup.ts
- **THEN** 渲染 React 组件的集成测试 SHALL 在每个用例后自动清理 DOM
- **THEN** 所有 mock 状态 SHALL 在测试间自动重置

### Requirement: 集成测试 setup 不重复注册 globalThis

`integration/setup.ts` SHALL NOT 直接注册任何 globalThis mock 工厂。所有注册 SHALL 通过引入 `base.ts` 获得。

#### Scenario: 集成测试获得完整的 globalThis 注册

- **WHEN** 集成测试环境加载 base.ts
- **THEN** 集成测试 SHALL 可访问全部 9 个 globalThis mock 工厂
- **THEN** 集成测试 SHALL NOT 需要自己补充任何 mock 工厂注册

### Requirement: globals 配置统一

单元测试和集成测试配置 SHALL 统一启用 `globals: true`。

#### Scenario: 单元测试环境启用全局 API

- **WHEN** Vitest 使用 vite.config.ts 中的 test 配置
- **THEN** `globals` SHALL 为 true
- **THEN** 测试文件可直接使用 describe/it/expect/vi 无需显式 import

#### Scenario: 集成测试环境保持全局 API

- **WHEN** Vitest 使用 vitest.integration.config.ts
- **THEN** `globals` SHALL 为 true（保持现有行为）

### Requirement: 过时代码清理

重构 SHALL 清理以下过时内容：

- `setup.ts` 中 "jsdom" 注释 SHALL 修正为 "happy-dom"
- 注释掉的 `setupGlobalMocks` 调用 SHALL 被删除

#### Scenario: 过时注释被修正

- **WHEN** 重构完成
- **THEN** 代码中 SHALL NOT 存在引用 "jsdom" 的过时注释

#### Scenario: 注释掉的代码被删除

- **WHEN** 重构完成
- **THEN** 代码中 SHALL NOT 存在被注释掉的 `setupGlobalMocks` 调用
