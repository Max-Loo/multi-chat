# Spec Delta

## REMOVED Requirements

### Requirement: 隔离钩子函数

**Reason**: `useIsolatedTest()` 仅被 `helpers/isolation/isolation.test.ts` 自测引用，全项目无运行时消费者（批次①任务 2.3 删除）。项目内测试统一经全局 `setup/cleanup.ts` 的 afterEach 钩子完成清理，按文件封装的隔离钩子属零引用死代码。

**Migration**: 如未来需要按文件定制隔离钩子，可从 git 历史恢复 `helpers/isolation/reset.ts` 中的实现；或直接在文件级 `beforeEach`/`afterEach` 中 `await resetTestState()`。

### Requirement: 环境变量隔离

**Reason**: `setTestEnv()` 仅被自测引用（任务 2.3 删除）。现有测试经 `globalThis.__VITEST__` 标识与 mocks 层完成环境隔离，无测试级环境变量注入的消费者。

**Migration**: 需要测试级环境变量时使用 Vitest 原生 `vi.stubEnv()` / `vi.unstubAllEnvs()`。

### Requirement: 隔离验证工具

**Reason**: `verifyIsolation()` 仅被自测引用（任务 2.3 删除）。隔离正确性已由「覆盖率守恒 + 全量回归」验收机制（见 test-suite-slimming）保障，运行时验证工具属零引用死代码。

**Migration**: 需要时从 git 历史恢复；或以一次性脚本比对 `localStorage.length` 与 IndexedDB 数据库列表。
