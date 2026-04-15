## Why

测试隔离工具 `resetTestState()` 中的 IndexedDB 清理存在可靠性缺陷：`clearIndexedDB()` 是异步操作但以 `void`（fire-and-forget）方式调用，且 `resetIndexedDB` 默认为 `false` 根本不触发清理。这导致后续测试可能在 IndexedDB 清理完成前就开始执行，造成测试间状态泄漏。

## What Changes

- **BREAKING**：`resetTestState()` 从同步函数改为异步函数（`void` → `Promise<void>`），确保 IndexedDB 清理完成后才返回
- `resetIndexedDB` 选项默认值从 `false` 改为 `true`，确保默认清理 IndexedDB
- `useIsolatedTest()` 内部的 `beforeEach`/`afterEach` 回调改为 `async`，`await resetTestState()`
- `verifyIsolation()` 改为异步函数，新增 IndexedDB 状态检查（使用 fallback 策略应对 `indexedDB.databases()` 不可用的情况）

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `test-environment-isolation`：`resetTestState()` 签名从同步改为异步；`resetIndexedDB` 默认值改为 `true`；`verifyIsolation()` 扩展检查范围

## Impact

- **受影响文件**：`src/__test__/helpers/isolation/reset.ts`（核心变更）、`src/__test__/helpers/integration/clearIndexedDB.ts`（修复硬编码数据库名 + 统一 fallback 策略）、`src/__test__/helpers/isolation/isolation.test.ts`（测试更新）
- **下游影响**：所有调用 `resetTestState()` 和 `useIsolatedTest()` 的测试文件需适配异步调用（添加 `await`）
- **兼容性**：Vitest 的 `beforeEach`/`afterEach` 原生支持 async 回调，无需框架层面修改
