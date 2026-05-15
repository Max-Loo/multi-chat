## ADDED Requirements

### Requirement: isTauri 环境检测测试

系统 SHALL 提供单元测试验证 `isTauri()` 函数在不同环境下的返回值。

#### Scenario: window 上存在 __TAURI__ 属性时返回 true

- **WHEN** `window` 对象上存在 `__TAURI__` 属性
- **THEN** `isTauri()` SHALL 返回 `true`

#### Scenario: window 上不存在 __TAURI__ 属性时返回 false

- **WHEN** `window` 对象上不存在 `__TAURI__` 属性
- **THEN** `isTauri()` SHALL 返回 `false`

#### Scenario: window 为 undefined 时返回 false

- **WHEN** `typeof window` 为 `'undefined'`（如 SSR 环境）
- **THEN** `isTauri()` SHALL 返回 `false`

### Requirement: isTestEnvironment 多策略检测测试

系统 SHALL 提供单元测试验证 `isTestEnvironment()` 函数的多种检测策略。

#### Scenario: globalThis.vitest 存在时返回 true

- **WHEN** `globalThis.vitest` 不为 `undefined`
- **THEN** `isTestEnvironment()` SHALL 返回 `true`

#### Scenario: globalThis.__VITEST__ 为 truthy 时返回 true

- **WHEN** `globalThis.__VITEST__` 为 truthy 值
- **THEN** `isTestEnvironment()` SHALL 返回 `true`

#### Scenario: process.env.VITEST 存在时返回 true

- **WHEN** `process.env.VITEST` 为 truthy 值
- **THEN** `isTestEnvironment()` SHALL 返回 `true`

#### Scenario: import.meta.env.VITEST 为 'true' 时返回 true

- **WHEN** `import.meta.env.VITEST` 等于字符串 `'true'`
- **THEN** `isTestEnvironment()` SHALL 返回 `true`

#### Scenario: 所有检测策略均不满足时返回 false

- **WHEN** 四种检测策略的条件均不满足
- **THEN** `isTestEnvironment()` SHALL 返回 `false`

### Requirement: getPBKDF2Iterations 迭代次数测试

系统 SHALL 提供单元测试验证 `getPBKDF2Iterations()` 根据环境返回不同迭代次数。

#### Scenario: 测试环境返回低迭代次数

- **WHEN** 当前为测试环境
- **THEN** `getPBKDF2Iterations()` SHALL 返回 `1000`

#### Scenario: 非测试环境返回高迭代次数

- **WHEN** 当前非测试环境
- **THEN** `getPBKDF2Iterations()` SHALL 返回 `100000`

### Requirement: 测试环境隔离

env.ts 的测试 SHALL 绕过全局 mock，直接测试真实逻辑。每个测试用例 SHALL 在独立的 `beforeEach`/`afterEach` 中清理对全局变量的修改，避免测试间污染。

#### Scenario: 绕过全局 mock 导入真实模块

- **WHEN** 测试文件导入 `@/utils/tauriCompat/env`
- **THEN** SHALL 通过 `vi.importActual` 或等效方式获取未被 mock 的真实模块实现

#### Scenario: 全局变量恢复

- **WHEN** 某个测试用例修改了 `window.__TAURI__` 或 `globalThis.vitest` 等全局变量
- **THEN** `afterEach` SHALL 将这些变量恢复为测试前的状态
