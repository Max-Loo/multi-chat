## Why

`helpers/mocks/i18n.ts` 中已有 `createI18nMockReturn`（通过 `globalThis.__createI18nMockReturn` 注册），但 46 个测试文件仍各自内联 `const R = {...}; return globalThis.__createI18nMockReturn(R)` 样板代码。`useMediaQuery` 和 `useResponsive` 测试有完全重复的 `matchMedia` mock。另有 3 个测试文件未使用 `createTypeSafeTestStore`（2 个组件测试直接调用 `configureStore`，1 个使用已废弃别名）。这些重复增加维护成本且易引入不一致。同时，`resourceLoader` retry 测试和 `ProviderCardDetails` UI 测试使用真实等待（~1.65s），可用 fakeTimers 替代以减少测试耗时。

## What Changes

- 在现有 `helpers/mocks/i18n.ts` 基础上新增 `mockI18n(keys?)` 封装函数，内含高频默认翻译键并自动合并自定义键，减少 46 个文件的 `const R = {...}` 样板
- 提取共享 `mockMatchMedia` 到 `helpers/mocks/matchMedia.ts`
- 迁移 3 个未使用 `createTypeSafeTestStore` 的文件（2 个组件测试 + 1 个废弃别名）
- 评估并迁移 `resourceLoader` retry 和 `ProviderCardDetails` UI 测试使用 `vi.useFakeTimers()` 替代真实等待

## Capabilities

### New Capabilities

- `unified-mock-helpers`: 共享 mock 辅助函数（i18n、matchMedia、createStore），减少 30+ 文件的重复样板代码

### Modified Capabilities

- `test-performance-optimization`: 迁移 resourceLoader retry 和 ProviderCardDetails 测试使用 fakeTimers，减少约 1.65s 真实等待

## Impact

- 新增 1 个共享 helper 文件（matchMedia.ts），增强 1 个现有文件（i18n.ts）
- 修改 46 个测试文件以使用 `mockI18n` 封装，3 个文件迁移至 `createTypeSafeTestStore`
- 不改变任何源代码行为
- 目标：减少 ~300 行重复测试代码，测试耗时减少 ~15%
