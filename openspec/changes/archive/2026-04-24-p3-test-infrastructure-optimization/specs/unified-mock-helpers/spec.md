## MODIFIED Requirements

### Requirement: 新增 mockI18n 封装函数
系统 SHALL 在现有 `helpers/mocks/i18n.ts` 中新增 `mockI18n(keys?)` 封装函数，替代 46 个文件中内联的 `const R = {...}; return globalThis.__createI18nMockReturn(R)` 样板代码。

#### Scenario: 使用默认翻译创建 mock
- **WHEN** 调用 `mockI18n()` 不传参数
- **THEN** 返回包含高频默认翻译键的 `createI18nMockReturn` 结果

#### Scenario: 使用自定义翻译覆盖
- **WHEN** 调用 `mockI18n({ setting: { key: '自定义' } })`
- **THEN** 返回合并了默认翻译和自定义翻译的 `createI18nMockReturn` 结果

### Requirement: 共享 mockMatchMedia 辅助函数
系统 SHALL 提供 `createMockMatchMedia(matches?: boolean)` 辅助函数，替代 `useMediaQuery.test.ts` 和 `useResponsive.test.ts` 中的重复实现。

#### Scenario: 创建默认 matchMedia mock
- **WHEN** 调用 `createMockMatchMedia()`
- **THEN** 返回 `window.matchMedia` 的 mock 实现，默认 `matches: false`

#### Scenario: 创建指定匹配状态的 mock
- **WHEN** 调用 `createMockMatchMedia(true)`
- **THEN** 返回 `matches: true` 的 mock 实现

### Requirement: 迁移 3 个文件使用 createTypeSafeTestStore
系统 SHALL 迁移 3 个未使用 `createTypeSafeTestStore` 的测试文件。

#### Scenario: 组件测试迁移
- **WHEN** `ModelProviderSetting.test.tsx` 和 `AutoNamingSetting.test.tsx` 从直接 `configureStore` 迁移
- **THEN** 使用 `createTypeSafeTestStore` 并保持测试断言不变

#### Scenario: 废弃别名迁移
- **WHEN** `chat-button-render-count.test.tsx` 从 `createTestStore` 迁移
- **THEN** import 改为 `createTypeSafeTestStore` 并保持测试断言不变
