# Spec Delta

## MODIFIED Requirements

### Requirement: 测试 setup 分层架构

测试 setup SHALL 按职责边界分为四个独立模块：

- `setup/base.ts` — 环境基础设施（Polyfill、jest-dom 扩展、globalThis 注册）
- `setup/i18n.ts` — react-i18next 纯默认全局 mock（复用 `globalThis.__mockI18n` 工厂，规避 vi.mock 工厂的 hoisting 限制）
- `setup/mocks.ts` — 全局 vi.mock 调用（Tauri API、AI SDK、UI 组件；经 `import './i18n'` 引入 i18n 层）
- `setup/cleanup.ts` — 运行时清理钩子和错误抑制

每个模块 SHALL 只包含其职责范围内的代码，不交叉引用其他层的内容（i18n 层作为例外：它是 mocks 层的组成部分，由 mocks.ts 显式引入，也可被集成 setup 独立引入）。

#### Scenario: 单元测试环境组合所有层

- **WHEN** Vitest 加载单元测试配置（vite.config.ts）
- **THEN** setup 入口文件 SHALL 依次引入 base.ts、mocks.ts、cleanup.ts（react-i18next 默认 mock 经 mocks.ts 内的 `import './i18n'` 生效）

#### Scenario: 集成测试环境组合 base 和 cleanup

- **WHEN** Vitest 加载集成测试配置（vitest.integration.config.ts）
- **THEN** setup 入口文件 SHALL 引入 base.ts、i18n.ts 和 cleanup.ts
- **THEN** 集成测试环境 SHALL NOT 引入 mocks.ts

### Requirement: 环境基础设施层内容

`setup/base.ts` SHALL 包含以下内容且仅包含以下内容：

- `fake-indexeddb/auto` 导入
- ResizeObserver polyfill
- jest-dom matchers 扩展（`expect.extend(matchers)`）
- `globalThis.__VITEST__` 环境标识
- 全部 12 个 globalThis mock 工厂注册

#### Scenario: base 模块包含完整的环境基础设施

- **WHEN** base.ts 被加载
- **THEN** `globalThis.ResizeObserver` SHALL 已被定义为可实例化的类
- **THEN** `expect` SHALL 已扩展 jest-dom matchers
- **THEN** `globalThis.__VITEST__` SHALL 为 true
- **THEN** `globalThis.__mockI18n` SHALL 已注册
- **THEN** `globalThis.__createMemoryStorageMock` SHALL 已注册
- **THEN** `globalThis.__createResponsiveMock` SHALL 已注册
- **THEN** `globalThis.__createTauriCompatModuleMock` SHALL 已注册
- **THEN** `globalThis.__createToastQueueModuleMock` SHALL 已注册
- **THEN** `globalThis.__createScrollbarMock` SHALL 已注册
- **THEN** `globalThis.__createMarkdownItMock` SHALL 已注册
- **THEN** `globalThis.__createDompurifyMock` SHALL 已注册
- **THEN** `globalThis.__createHighlightJsMock` SHALL 已注册
- **THEN** `globalThis.__createNavigateToPageModuleMock` SHALL 已注册
- **THEN** `globalThis.__createSonnerToastModuleMock` SHALL 已注册
- **THEN** `globalThis.__createSimpleVirtuaMock` SHALL 已注册

#### Scenario: base 模块不包含 vi.mock 调用

- **WHEN** base.ts 被加载
- **THEN** base.ts SHALL NOT 包含任何 `vi.mock()` 调用

### Requirement: 全局 Mock 层内容

`setup/mocks.ts` SHALL 包含所有全局 `vi.mock()` 调用，供单元测试使用：

- react-i18next 纯默认全局 mock（经 `import './i18n'` 引入）
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

#### Scenario: mocks 模块提供 react-i18next 默认 mock

- **WHEN** mocks.ts 被加载
- **THEN** react-i18next SHALL 已被纯默认 mock（`globalThis.__mockI18n()` 行为），测试文件无需为默认行为逐份声明

#### Scenario: mocks 模块提供完整的 AI SDK mock

- **WHEN** mocks.ts 被加载
- **THEN** `streamText` SHALL 返回包含 thenable 和 fullStream 的 mock 对象
- **THEN** `generateText` SHALL 返回包含 text、usage、finishReason 的 mock 结果
- **THEN** `generateId` SHALL 每次调用返回递增的唯一 ID

#### Scenario: mocks 模块不包含 afterEach 或 cleanup 逻辑

- **WHEN** mocks.ts 被加载
- **THEN** mocks.ts SHALL NOT 包含 `afterEach`、`beforeEach`、`cleanup` 调用
