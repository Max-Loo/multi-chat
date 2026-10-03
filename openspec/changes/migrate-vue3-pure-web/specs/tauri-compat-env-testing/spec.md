# Spec Delta

## MODIFIED Requirements

### Requirement: 测试环境隔离

`env` 模块的测试 SHALL 绕过全局 mock，直接测试真实逻辑。每个测试用例 SHALL 在独立的 `beforeEach`/`afterEach` 中清理对全局变量的修改，避免测试间污染。

#### Scenario: 绕过全局 mock 导入真实模块

- **WHEN** 测试文件导入 `@/utils/platform/env`
- **THEN** SHALL 通过 `vi.importActual` 或等效方式获取未被 mock 的真实模块实现

#### Scenario: 全局变量恢复

- **WHEN** 某个测试用例修改了 `globalThis.vitest`、`globalThis.__VITEST__` 等全局变量
- **THEN** `afterEach` SHALL 将这些变量恢复为测试前的状态

## REMOVED Requirements

### Requirement: isTauri 环境检测测试

**Reason**: `isTauri()` 函数及其 `window.__TAURI__` 检测逻辑随纯 Web 迁移整体移除，对应测试需求失效。
**Migration**: 无需替代——`isTestEnvironment()` 与 `getPBKDF2Iterations()` 的测试需求保留不变。
