## Why

当前单元测试 setup.ts（378 行）承担了 6 种职责（Polyfill、vi.mock、globalThis 注册、断言扩展、afterEach 清理、错误抑制），而集成测试 setup.ts（27 行）仅复制了其中 5 个 globalThis 注册和 jest-dom 扩展，缺少 cleanup、ResizeObserver、自定义断言、错误抑制等关键基础设施。这导致 5 个渲染 React 组件的集成测试没有自动 DOM 清理，存在状态泄漏风险。

## What Changes

- 将 `setup.ts` 的 6 种职责拆分为 3 个独立模块：`setup/base.ts`（环境 + 注册）、`setup/mocks.ts`（vi.mock 调用）、`setup/cleanup.ts`（清理 + 错误抑制）
- 将 `integration/setup.ts` 改为只引入 `base.ts` + `cleanup.ts`，不再重复注册 globalThis，获得完整的清理和断言能力
- 清理 `setup.ts` 中的过时注释（"jsdom" → "happy-dom"）和注释掉的代码
- 统一 `globals` 配置：单元测试和集成测试均启用 `globals: true`

## Capabilities

### New Capabilities

- `test-setup-layers`: 测试 setup 分层架构——将全局 setup 拆分为 base/mocks/cleanup 三层，两种测试环境按需组合

### Modified Capabilities

_无。本次重构不改变任何测试的断言行为或业务逻辑，仅重组基础设施代码。_

## Impact

- **文件变更**：
  - `src/__test__/setup.ts` → 瘦入口文件（3 行 import）
  - `src/__test__/setup/base.ts` → 新建
  - `src/__test__/setup/mocks.ts` → 新建
  - `src/__test__/setup/cleanup.ts` → 新建
  - `src/__test__/integration/setup.ts` → 瘦入口文件（2 行 import）
  - `vite.config.ts` → 添加 `globals: true`
  - `vitest.integration.config.ts` → 添加 `globals: true`、`deps.optimizer`
- **验证**：所有 1788 个单元测试 + 集成测试应全部通过，无行为变更
- **风险**：低。纯代码重组，不改变任何 mock 行为或断言逻辑
