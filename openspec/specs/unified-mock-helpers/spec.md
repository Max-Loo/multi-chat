# unified-mock-helpers Spec

## Purpose

规范高频共享 mock 辅助函数的提供方式：`mockI18n` 等封装工厂 SHALL 集中于 `helpers/mocks/` 层，消除测试文件内联的同构 mock 样板，保证 mock 行为一致且可经单一入口维护。

## Requirements

### Requirement: 新增 mockI18n 封装函数

系统 SHALL 在现有 `helpers/mocks/i18n.ts` 中新增 `mockI18n(keys?)` 封装函数，替代 46 个文件中内联的 `const R = {...}; return globalThis.__createI18nMockReturn(R)` 样板代码。

#### Scenario: 使用默认翻译创建 mock

- **WHEN** 调用 `mockI18n()` 不传参数
- **THEN** 返回包含高频默认翻译键的 `createI18nMockReturn` 结果

#### Scenario: 使用自定义翻译覆盖

- **WHEN** 调用 `mockI18n({ setting: { key: '自定义' } })`
- **THEN** 返回合并了默认翻译和自定义翻译的 `createI18nMockReturn` 结果

### Requirement: 迁移 3 个文件使用 createTypeSafeTestStore

系统 SHALL 迁移 3 个未使用 `createTypeSafeTestStore` 的测试文件。

#### Scenario: 组件测试迁移

- **WHEN** `ModelProviderSetting.test.tsx` 和 `AutoNamingSetting.test.tsx` 从直接 `configureStore` 迁移
- **THEN** 使用 `createTypeSafeTestStore` 并保持测试断言不变

#### Scenario: 废弃别名迁移

- **WHEN** `chat-button-render-count.test.tsx` 从 `createTestStore` 迁移
- **THEN** import 改为 `createTypeSafeTestStore` 并保持测试断言不变
