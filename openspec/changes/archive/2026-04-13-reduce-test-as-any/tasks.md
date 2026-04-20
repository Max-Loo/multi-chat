## 1. 基础设施：Slice 默认状态工厂函数

- [x] 1.1 创建 `src/__test__/helpers/mocks/testState.ts`，实现 `createChatSliceState()`、`createChatPageSliceState()`、`createAppConfigSliceState()`、`createModelProviderSliceState()`、`createSettingPageSliceState()`、`createModelPageSliceState()` 六个工厂函数
- [x] 1.2 更新 `src/__test__/helpers/mocks/redux.ts` 中的 `createModelSliceState` 使用新的统一导出
- [x] 1.3 实现 `createTestRootState(overrides?)` 函数，组合所有 slice 工厂
- [x] 1.4 重写 `src/__test__/helpers/render/redux.tsx` 中的 `createTestStore` 为 `createTypeSafeTestStore`，包含完整 7 个 reducer 映射，支持 `preloadedState` 和 `reducerOverrides` 参数，消除内部 `as any`
- [x] 1.5 从 `helpers/mocks/testState.ts` 和 `helpers/render/redux.tsx` 统一导出，更新 `helpers/index.ts`

## 2. AIError 扩展类型

- [x] 2.1 在 `src/__test__/helpers/mocks/aiSdk.ts` 中定义 `AIError` 接口，扩展 `Error` 添加 `statusCode`、`response`、`code` 属性
- [x] 2.2 将 `createMockAISDKNetworkError`、`createMockAPIError`、`createMockTimeoutError` 的返回类型改为 `AIError`，消除内部 `as any`

## 3. HighlightLanguageManager 测试访问器

- [x] 3.1 在 `src/utils/highlightLanguageManager.ts` 中新增 `@internal` 标注的 `testInternals` getter，暴露 `loadedLanguages`、`resolveAlias`、`loadingPromises`、`failedLanguages`、`doLoadLanguage`
- [x] 3.2 更新 `src/__test__/utils/highlightLanguageManager.test.ts`，将 14 处 `(manager as any).xxx` 替换为 `manager.testInternals.xxx`

## 4. Hooks 测试替换

- [x] 4.1 替换 `hooks/useIsChatSending.test.ts` 中的 `as any`（5 处）
- [x] 4.2 替换 `hooks/useTypedSelectedChat.test.tsx` 中的 `as any`（4 处）
- [x] 4.3 替换 `hooks/useCurrentSelectedChat.test.tsx` 中的 `as any`（4 处）
- [x] 4.4 替换 `hooks/useBasicModelTable.test.tsx` 中的 `as any`（4 处）
- [x] 4.5 替换其余 hooks 测试文件中的 `as any`（useExistingChatList、useExistingModels 等）

## 5. Store 测试替换

- [x] 5.1 替换 `store/middleware/chatMiddleware.test.ts` 中的 `as any`（3 处）
- [x] 5.2 替换 `store/slices/` 下各文件中的 `as any`（chatSlices、modelProviderSlice 等）

## 6. 组件测试替换

- [x] 6.1 替换 `components/ChatPanelSender.test.tsx` 中的 `as any`（6 处）
- [x] 6.2 替换 `components/ModelConfigForm.test.tsx` 中的 `as any`（6 处）
- [x] 6.3 替换 `components/ChatPanel.test.tsx` 中的 `as any`（4 处）
- [x] 6.4 替换 `components/ChatPanelHeader.test.tsx` 中的 `as any`（5 处）
- [x] 6.5 替换 `components/ChatPanelContentDetail.test.tsx` 中的 `as any`（4 处）
- [x] 6.6 替换 `components/DetailTitle.test.tsx` 中的 `as any`（2 处）
- [x] 6.7 替换 `components/Sidebar/Sidebar.test.tsx` 中的 `as any`（2 处）
- [x] 6.8 替换 `components/MobileDrawer.test.tsx`、`components/Layout.test.tsx`、`components/ModelSelect.test.tsx` 等其余组件中的 `as any`

## 7. Pages 测试替换

- [x] 7.1 替换 `pages/Model/ModelTable/ModelTable.test.tsx` 中的 `as any`（5 处）
- [x] 7.2 替换 `pages/Model/components/EditModelModal.test.tsx` 中的 `as any`（7 处）
- [x] 7.3 替换 `pages/Model/ModelTable/components/ModelProviderDisplay.test.tsx` 中的 `as any`（5 处）
- [x] 7.4 替换 `pages/Chat/` 下各测试文件中的 `as any`

## 8. Router 和 Service 测试替换

- [x] 8.1 评估 `router/routeConfig.test.ts` 中 14 处 `(router.routes[0] as any).children` 是否可通过 React Router 公开 API 替代，若不可则保留并添加注释
- [x] 8.2 替换 `services/lib/initialization/ExecutionContext.test.ts` 中的 `as any`（8 处）
- [x] 8.3 替换 `services/lib/i18n/tSafely.test.ts` 中的 `as any`（5 处）
- [x] 8.4 替换 `services/chat/titleGenerator.test.ts` 中的 `as any`（4 处）

## 9. Integration 测试替换

- [x] 9.1 替换 `integration/auto-naming.integration.test.ts` 中的 `as any`（4 处）
- [x] 9.2 替换 `integration/responsive-layout-switching.integration.test.tsx`、`bottom-nav.integration.test.tsx`、`drawer-state.integration.test.tsx` 中的 `as any`

## 10. 验证与清理

- [x] 10.1 运行全量测试，确保所有测试通过
- [x] 10.2 统计剩余 `as any` 数量，确认减少比例达 71%（194 → 56 处），剩余主要为第三方库类型不完整（react-router、AI SDK、i18n TFunction）、vi.spyOn 私有方法、测试错误处理/无效输入等难以消除的场景
- [x] 10.3 对剩余的 `as any` 逐个审查，确认每处有清晰的注释说明保留理由
