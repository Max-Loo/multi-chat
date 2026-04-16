## ADDED Requirements

### Requirement: i18n mock 工厂参考实现
`helpers/mocks/i18n.ts` SHALL 提供 `createI18nMockReturn` 函数，接受翻译资源对象作为参数，返回符合 `vi.mock('react-i18next')` 签名的 mock 对象。该函数 SHALL 同时支持字符串键和选择器函数两种 `t()` 调用模式。

#### Scenario: 使用字符串键调用 t()
- **WHEN** 测试代码调用 `t('common.title')`
- **THEN** mock 函数 SHALL 直接返回该字符串键作为翻译结果

#### Scenario: 使用选择器函数调用 t()
- **WHEN** 测试代码调用 `t((resources) => resources.common.title)`
- **THEN** mock 函数 SHALL 将传入的翻译资源对象代入选择器函数并返回结果

### Requirement: 标准化 mock 模板
`helpers/mocks/i18n.ts` 的 JSDoc SHALL 包含可直接复制到测试文件中的标准化模板代码，使用 `vi.hoisted` 内联定义工厂，每个测试文件的 mock 定义 SHALL 不超过 10 行有效代码。

#### Scenario: 测试文件使用标准模板
- **WHEN** 测试文件使用 JSDoc 中的模板定义 react-i18next mock
- **THEN** mock 块 SHALL 不超过 10 行有效代码，且完整支持 `useTranslation` 的 `t` 和 `i18n` 属性

### Requirement: 现有 mock 块迁移
所有使用 `vi.mock('react-i18next')` 的测试文件 SHALL 使用标准化模板替换内联的冗长 mock 定义。迁移后每个测试 SHALL 保持与迁移前完全相同的行为。

#### Scenario: 迁移后测试行为不变
- **WHEN** 将某个测试文件的 react-i18next mock 从内联定义替换为标准模板
- **THEN** 该文件中的所有测试用例 SHALL 产生与迁移前相同的通过/失败结果
