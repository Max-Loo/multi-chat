## REMOVED Requirements

### Requirement: mock 类型接口导出
**Reason**: `mocks/types.ts` 中 4 个接口（`TauriMockOptions`、`TauriMocks`、`CryptoMocks`、`StorageMocks`）是已删除工厂函数的遗留类型定义，在全项目中零消费者。这些类型曾经配合 `createTauriMocks()`、`createCryptoMocks()`、`createStorageMocks()` 使用，但工厂函数已在之前的清理中删除。
**Migration**: 无需迁移，这些类型从未被外部代码引用。

### Requirement: 未使用的 mock 工厂函数
**Reason**: 以下 mock 工厂函数/接口在全项目中零消费者：
- `createMediaQueryListMock`（`matchMedia.ts`）：仅被同文件的 `createMockMatchMedia` 内部使用，不应作为公共 API 导出
- `createPanelLayoutWrapper`（`panelLayout.tsx`）：零外部引用
- `AIError` 接口（`aiSdk.ts`）：零外部引用
**Migration**: 无需迁移。`createMediaQueryListMock` 的内部功能已由 `createMockMatchMedia` 覆盖。

### Requirement: 未使用的 fixture 工厂函数
**Reason**: 以下 fixture 工厂函数在全项目中零消费者：
- `fixtures/chat.ts` 中 8 个函数：`createReasoningMessage`、`createSystemMessage`、`createMessageWithUsage`、`createMockMessages`、`createMarkdownMessage`、`createLongMessage`、`createCodeMessage`、`getTestMessages`
- `fixtures/router.ts` 中 3 个函数：`getRouteStructure`、`getInvalidRoutes`、`getNestedRoutes`
**Migration**: 如果未来需要这些 fixture，可以从 git 历史恢复。
