## Context

46 个测试文件各自内联 i18n mock 样板代码（`const R = {...}; return globalThis.__createI18nMockReturn(R)`），`helpers/mocks/i18n.ts` 已有 `createI18nMockReturn` 函数但缺少高频默认键封装。`useMediaQuery.test.ts` 和 `useResponsive.test.ts` 有完全重复的 `mockMatchMedia` 实现。3 个测试文件未使用已有的 `createTypeSafeTestStore`。`resourceLoader` retry 测试（~900ms）和 `ProviderCardDetails` UI 测试（~750ms）使用真实等待。

## Goals / Non-Goals

**Goals:**

- 在现有 `createI18nMockReturn` 基础上新增 `mockI18n(keys?)` 封装函数
- 提取共享 `mockMatchMedia` 函数
- 迁移 3 个文件使用 `createTypeSafeTestStore`
- 评估 fakeTimers 替代真实等待

**Non-Goals:**

- 不修改源代码
- 不改变测试行为（重构仅减少重复，不改变断言）
- 不引入新的测试框架或工具

## Decisions

### D1: 在现有 helpers/mocks/i18n.ts 基础上新增 mockI18n 封装

`createI18nMockReturn` 已存在且通过 `globalThis.__createI18nMockReturn` 注册。新增 `mockI18n(keys?)` 封装：内置高频默认翻译键（从 46 个测试文件中提取的公共键），允许通过参数覆盖或扩展。返回 `createI18nMockReturn(mergedResources)` 的结果。

### D2: mockMatchMedia 放在 helpers/mocks/matchMedia.ts

提取 `useMediaQuery.test.ts` 和 `useResponsive.test.ts` 中的重复实现，提供 `createMockMatchMedia(matches?: boolean)` 工厂。

### D3: 迁移 3 个文件使用 createTypeSafeTestStore

`createTypeSafeTestStore` 已在 `helpers/render/redux.tsx` 中实现，22 个文件已使用。剩余 3 个文件需迁移：
- `ModelProviderSetting.test.tsx`、`AutoNamingSetting.test.tsx`（直接调用 `configureStore`）
- `chat-button-render-count.test.tsx`（使用已废弃 `createTestStore` 别名）
注：6 个 slice 单元测试和 2 个 middleware 测试使用单 reducer `configureStore` 做隔离测试，不纳入迁移范围。

### D4: fakeTimers 仅评估，不强制迁移

`resourceLoader` retry 测试和 `ProviderCardDetails` UI 测试的真实等待有其价值（验证真实时序），fakeTimers 可能引入新的时序问题。先评估可行性，再决定是否迁移。注：`useDebounce.test.ts` 已使用 fakeTimers，无需迁移。

## Risks / Trade-offs

- **[风险]** 统一 mock 可能丢失个别文件的定制逻辑 → 提供 `overrides` 参数保持灵活性
- **[风险]** 大规模修改 30+ 文件可能引入回归 → 分批迁移，每批运行全量测试验证
- **[风险]** fakeTimers 与 happy-dom 可能存在兼容问题 → 先在单个测试文件中验证
