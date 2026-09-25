# i18n-mock-unification Spec

## Purpose

规范 `react-i18next` mock 的统一模式：测试文件 MUST 使用共享工厂而非手写 mock 实现，转换后测试行为保持等价，消除逐文件的 Proxy、手动 `t()` 等不一致实现。

## Requirements

### Requirement: 所有测试文件必须使用统一的 i18n mock 工厂

react-i18next 的纯默认 mock SHALL 由全局 setup（`setup/i18n.ts`，经 `setup/mocks.ts` 引入，单元与集成测试均生效）统一提供；测试文件 MUST NOT 为纯默认行为逐份声明 `vi.mock('react-i18next')`。需要自定义翻译键的文件 MUST 通过 `globalThis.__mockI18n(自定义键)` 工厂覆盖；依赖真实 react-i18next 行为的文件 MUST 使用 `vi.unmock('react-i18next')` 并附 Mock 注释说明理由。

#### Scenario: 新文件使用标准工厂

- **WHEN** 一个测试文件需要 mock `react-i18next`
- **THEN** 纯默认行为由全局 setup 提供而无需声明；需要自定义键时 MUST 且仅 MUST 使用 `globalThis.__mockI18n(...)` 模式

#### Scenario: 自定义键经工厂覆盖

- **WHEN** 一个测试文件需要自定义翻译键
- **THEN** 该文件的 `vi.mock('react-i18next')` 实现 MUST 且仅 MUST 调用 `globalThis.__mockI18n(...)` 工厂

#### Scenario: 不允许手动 i18n mock

- **WHEN** 检查测试文件中的 `vi.mock('react-i18next')` 实现
- **THEN** 该实现 MUST NOT 使用内联的 Proxy、手动 `t()` 函数、或自定义 mock 对象

### Requirement: i18n mock 行为转换后必须等价

从手动 mock 转换为标准工厂后，测试行为 MUST 保持等价。

#### Scenario: 转换后测试仍通过

- **WHEN** 将一个文件的手动 i18n mock 替换为标准工厂
- **THEN** 该文件的所有测试 MUST 仍通过

### Requirement: i18n-test-mock-factory 覆盖全部测试文件

全局默认 mock MUST 对全部单元测试与集成测试生效；残留的文件级 `vi.mock('react-i18next')` 声明 MUST 仅存在于需要自定义翻译键的文件中，且全部使用 `globalThis.__mockI18n` 模式，覆盖率 100%。

#### Scenario: 无遗漏的手动 mock

- **WHEN** 在测试目录中搜索 `vi.mock('react-i18next')` 调用
- **THEN** 所有匹配项 MUST 使用 `globalThis.__mockI18n` 模式并携带自定义翻译键

#### Scenario: 依赖真实行为的显式恢复

- **WHEN** 一个测试文件依赖真实 react-i18next 行为（如 i18n 初始化逻辑本身）
- **THEN** 该文件 MUST 声明 `vi.unmock('react-i18next')` 并附 Mock 注释说明理由
