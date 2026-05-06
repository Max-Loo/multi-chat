## ADDED Requirements

### Requirement: 未使用的 mock 导出应当删除

`src/__test__/helpers/mocks/` 中未被任何测试文件直接引用的导出函数 MUST 被删除。仅被自测文件（如 `mocks.test.ts`）引用的导出也 MUST 被视为未使用。

#### Scenario: aiSdk 错误工厂清理

- **WHEN** 扫描 `helpers/mocks/aiSdk.ts` 的导出列表
- **THEN** 以下函数 MUST 被删除：`createMockStreamResultWithMetadata`、`createMockAISDKNetworkError`、`createMockAPIError`、`createMockTimeoutError`、`createMockAbortError`、`createMockAbortedStreamResult`、`createMockStreamTimeoutResult`、`StreamEventTypes`

#### Scenario: chatSidebar 状态工厂清理

- **WHEN** 扫描 `helpers/mocks/chatSidebar.ts` 的导出列表
- **THEN** 以下函数 MUST 被删除：`createMockUnnamedChat`、`createMockDeletedChat`、`createMockRenameState`、`createMockSearchState`、`createMockCollapsedState`、`createChatButtonMocks`、`createToolsBarMocks`

#### Scenario: router mock 清理

- **WHEN** 扫描 `helpers/mocks/router.ts` 的导出列表
- **THEN** 以下函数 MUST 被删除：`createMockSearchParams`、`createNestedRouteParams`、`createMockLocationWithQuery`、`createReactRouterMocksWithNestedParams`

#### Scenario: testState 未使用导出清理

- **WHEN** 扫描 `helpers/mocks/testState.ts` 的导出列表
- **THEN** `createSettingPageSliceState` MUST 从导出中移除（移除 `export` 关键字），保留函数定义供同文件 `createTestRootState()` 内部调用
- **AND** 该函数无外部消费者（仅被 `createTestRootState()` 在第 134 行调用）

### Requirement: 未使用的 fixture 文件应当删除

`src/__test__/helpers/fixtures/` 中无外部使用者的 fixture 文件 MUST 被删除。仅被自测文件引用的 fixture 也 MUST 被视为未使用。

#### Scenario: crypto fixture 整文件删除

- **WHEN** 扫描 `helpers/fixtures/crypto.ts` 的所有导出
- **THEN** 整个文件 MUST 被删除（包括 `createCryptoTestData` 及所有相关导出）
- **AND** `helpers/fixtures/` 的 barrel 文件（`index.ts`）中对应的重导出 MUST 一并删除

### Requirement: 删除未使用的 mock 工厂函数

`helpers/mocks/` 中完全未被任何测试文件或同模块内部函数调用的 mock 创建函数 MUST 被删除。

#### Scenario: Tauri 和 Storage mock 工厂清理

- **WHEN** 扫描 `helpers/mocks/tauri.ts` 和 `helpers/mocks/storage.ts`
- **THEN** `createTauriMocks()` 和 `createStorageMocks()` MUST 被删除（仅在 `mocks.test.ts` 自测中使用）

注意：`helpers/mocks/toast.ts` 中的 `createToastQueueMocks()` MUST NOT 被删除，因为它是 `createToastQueueModuleMock()` 的内部依赖，后者被 `setup.ts` 全局注册并被多个测试文件使用。
