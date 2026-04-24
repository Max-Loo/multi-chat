## 1. 删除冗余 vi.clearAllMocks() 调用

- [x] 1.1 删除 `integration/` 目录下 5 个文件中的冗余清理调用（auto-naming、settings-change、app-loading、master-key-recovery、drawer-state）
- [x] 1.2 删除 `utils/` 目录下 6 个文件中的冗余清理调用（markdown、test-mock-env、crypto-storage、resetAllData、highlightLanguageManager、tauriCompat/http）
- [x] 1.3 删除 `tauriCompat/` 目录下 3 个文件中的冗余清理调用（keyringMigration、keyring、keyring 中多处）
- [x] 1.4 删除 `components/` 目录下 10 个文件中的冗余清理调用（KeyRecoveryDialog、FatalErrorScreen、Sidebar、MainApp、NoProvidersAvailable、ChatBubble.memo、ChatBubble、ModelSelect、ChatPanelHeader、InitializationController）
- [x] 1.5 删除 `hooks/` 目录下 4 个文件中的冗余清理调用（useCreateChat、useConfirm、useResetDataDialog、useNavigateToPage）
- [x] 1.6 删除 `pages/` 目录下 9 个文件中的冗余清理调用（useBoard、useSelectedChat、useIsSending、RunningBubble、NotFound、SettingPage、ModelProviderDisplay、KeyManagementSetting、ModelProviderSetting 及子组件）
- [x] 1.7 删除 `services/` 目录下 6 个文件中的冗余清理调用（streamProcessor、titleGenerator、chat/index、modelRemoteService、global、i18n、InitializationManager、i18nIntegration）
- [x] 1.8 删除 `store/` 目录下 8 个文件中的冗余清理调用（modelMiddleware、chatMiddleware、appConfigMiddleware、chatSlices、modelSlice、appConfigSlices、modelProviderSlice、chatStorage、keyVerification、masterKey）
- [x] 1.9 删除 `helpers/isolation/` 下 2 个文件中的冗余清理调用（reset.ts、isolation.test.ts）
- [x] 1.10 执行 `pnpm test` 验证全部测试通过

## 2. 合并双重 modelProvider fixtures

- [x] 2.1 将 `src/__test__/fixtures/modelProvider.ts` 中的 API 响应工厂（createDeepSeekApiResponse、createKimiApiResponse、createOpenAIApiResponse、createMockApiResponse）及其依赖的 Zod 校验逻辑（ModelsDevApiProviderSchema、validateModelsDevApiProvider、FixtureValidationError 类）迁移到 `src/__test__/helpers/fixtures/modelProvider.ts`。注意：不修改已有的 RemoteProviderData 工厂函数（createMockRemoteProvider、createDeepSeekProvider 等），保持其无校验行为
- [x] 2.2 更新 `modelRemoteService.test.ts` 的导入路径，从 `@/__test__/fixtures/modelProvider` 改为 `@/__test__/helpers/fixtures`
- [x] 2.3 更新 `modelProviderSlice.test.ts` 的导入路径，从 `@/__test__/fixtures/modelProvider` 改为 `@/__test__/helpers/fixtures`
- [x] 2.4 删除 `src/__test__/fixtures/modelProvider.ts`（该目录下仍有 `chat.ts`、`router.ts`、`test-data.json` 被 `helpers/fixtures/index.ts` 等文件引用，保留目录）
- [x] 2.5 执行 `pnpm test` 验证全部测试通过

## 3. 删除未使用的 helper 函数

- [x] 3.1 从 `src/__test__/helpers/testing-utils.tsx` 中删除 `createMockChatWithMessages` 函数（约第 39-71 行）
- [x] 3.2 从 `src/__test__/helpers/assertions/mock.ts` 中删除 `verifyMockCalls`（约第 17-25 行）和 `verifyMockCalledWith`（约第 26-44 行）
- [x] 3.3 执行 `pnpm test` 验证全部测试通过

## 4. 删除 mocks/redux.ts 转发模块

- [x] 4.1 修改 `src/__test__/helpers/mocks/index.ts`，将 `export * from './redux'` 替换为 `export { createModelSliceState } from './testState'`
- [x] 4.2 删除 `src/__test__/helpers/mocks/redux.ts` 文件
- [x] 4.3 执行 `pnpm test` 验证全部测试通过

## 5. 最终验证

- [x] 5.1 执行完整测试套件 `pnpm test`，确认 1785 个测试全部通过、无跳过数增加
- [x] 5.2 执行 `pnpm lint` 和 `pnpm tsc` 确认无类型错误和 lint 警告
