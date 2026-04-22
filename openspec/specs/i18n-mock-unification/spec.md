## ADDED Requirements

### Requirement: 所有测试文件必须使用统一的 i18n mock 工厂
测试文件 MUST 使用 `globalThis.__createI18nMockReturn` 工厂 mock `react-i18next`，而非手动编写 mock 实现。

#### Scenario: 新文件使用标准工厂
- **WHEN** 一个测试文件需要 mock `react-i18next`
- **THEN** 该文件 MUST 使用 `globalThis.__createI18nMockReturn(R)` 模式

#### Scenario: 不允许手动 i18n mock
- **WHEN** 检查测试文件中的 `vi.mock('react-i18next')` 实现
- **THEN** 该实现 MUST NOT 使用内联的 Proxy、手动 `t()` 函数、或自定义 mock 对象

### Requirement: i18n mock 行为转换后必须等价
从手动 mock 转换为标准工厂后，测试行为 MUST 保持等价。

#### Scenario: 转换后测试仍通过
- **WHEN** 将一个文件的手动 i18n mock 替换为标准工厂
- **THEN** 该文件的所有测试 MUST 仍通过

## MODIFIED Requirements

### Requirement: i18n-test-mock-factory 覆盖全部测试文件
`globalThis.__createI18nMockReturn` 工厂 MUST 被所有需要 mock `react-i18next` 的测试文件使用，覆盖率达 100%。

#### Scenario: 无遗漏的手动 mock
- **WHEN** 在测试目录中搜索 `vi.mock('react-i18next')` 调用
- **THEN** 所有匹配项 MUST 使用 `globalThis.__createI18nMockReturn` 模式
