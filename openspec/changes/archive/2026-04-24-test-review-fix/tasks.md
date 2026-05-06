## 1. AI SDK Provider Mock 工厂提取

- [x] 1.1 在 `setup.ts` 中提取 `createMockAIProvider(providerName)` 工厂函数，包含 `specificationVersion`、`supportsImageUrls`、`doStream`、`doGenerate` 等全部属性
- [x] 1.2 将 `@ai-sdk/deepseek` 的 `vi.mock()` 改为调用 `createMockAIProvider('deepseek')`
- [x] 1.3 将 `@ai-sdk/moonshotai` 的 `vi.mock()` 改为调用 `createMockAIProvider('moonshotai')`
- [x] 1.4 将 `zhipu-ai-provider` 的 `vi.mock()` 改为调用 `createMockAIProvider('zhipu')`
- [x] 1.5 运行测试验证所有 AI SDK 相关测试通过

## 2. 共享 Mock 工厂创建

- [x] 2.1 创建 `helpers/mocks/scrollbar.ts`，导出 `createScrollbarMock` 工厂函数
- [x] 2.2 在 `setup.ts` 中注册 `globalThis.__createScrollbarMock`
- [x] 2.3 创建 `helpers/mocks/markdown.ts`，导出共享的 markdown-it mock（基于 ThinkingSection 的更完整版本）
- [x] 2.4 创建 `helpers/mocks/dompurify.ts`，导出共享的 dompurify mock
- [x] 2.5 在 `setup.ts` 中添加 `vi.mock('@/components/ui/skeleton', ...)` 全局 mock

## 3. 消费者文件 Mock 迁移

- [x] 3.1 迁移 `SettingPage.test.tsx` 使用 `globalThis.__createScrollbarMock()`
- [x] 3.2 迁移 `Detail.test.tsx` 使用 `globalThis.__createScrollbarMock()`
- [x] 3.3 迁移 `ChatSidebar.test.tsx` 使用 `globalThis.__createScrollbarMock()`
- [x] 3.4 迁移 `DetailScroll.test.tsx` 使用 `globalThis.__createScrollbarMock()`
- [x] 3.5 迁移 `GeneralSetting.test.tsx` 使用 `globalThis.__createScrollbarMock()`
- [x] 3.6 迁移 `ThinkingSection.test.tsx` 使用共享 markdown/dompurify mock（`ChatBubble.test.tsx` 保留使用真实库）
- [x] 3.8 迁移 `ChatButton.test.tsx` 使用 `globalThis.__createResponsiveMock()`
- [x] 3.9 迁移 `PageSkeleton.test.tsx` 使用 `globalThis.__createResponsiveMock()`
- [x] 3.10 迁移 `responsive-layout-switching.integration.test.tsx` 使用 `globalThis.__createResponsiveMock()`
- [x] 3.11 移除 `SkeletonMessage.test.tsx` 的内联 skeleton mock（依赖全局 mock）
- [x] 3.12 移除 `SkeletonList.test.tsx` 的内联 skeleton mock
- [x] 3.13 移除 `PageSkeleton.test.tsx` 的内联 skeleton mock
- [x] 3.14 移除 `PanelSkeleton.test.tsx` 的内联 skeleton mock

## 4. 冗余 Mock 声明移除

- [x] 4.1 移除 `keyVerification.test.ts` 中重复的 `storeUtils` mock 声明
- [x] 4.2 移除 `modelSlice.test.ts` 中重复的 `storeUtils` mock 声明
- [x] 4.3 移除 `app-loading.integration.test.ts` 中重复的 `storeUtils` mock 声明

## 5. 死代码清理

- [x] 5.1 删除 `verify-setup-mock.test.ts` 文件
- [x] 5.2 移除 38 个测试文件中的冗余 `cleanup()` 调用
- [x] 5.3 清理 `appConfigSlices.test.ts` 中已删除测试的注释块
- [x] 5.4 清理 `modelSlice.test.ts` 中已删除测试的注释块
- [x] 5.5 清理 `chatSlices.test.ts` 中已删除测试的注释块
- [x] 5.6 清理 `modelProviderSlice.test.ts` 中已删除测试的注释块
- [x] 5.7 修复 `setup.ts` 第 341-342 行的重复注释
- [x] 5.8 移除 `fixtures.test.ts` 中 5 处空 `beforeEach` 块
- [x] 5.9 移除 `test-keyring.test.ts` 中 7 处 `console.log` 调试残留

## 6. window.location 安全修复

- [x] 6.1 将 `FatalErrorScreen.test.tsx` 的 `Object.defineProperty` 改为 `vi.spyOn`
- [x] 6.2 将 `NoProvidersAvailable.test.tsx` 的 `Object.defineProperty` 改为 `vi.spyOn` 或添加恢复逻辑

## 7. FakeTimers 迁移

- [x] 7.1 迁移 `ProviderCardDetails.test.tsx` 的 6 处真实 setTimeout（文件中无 setTimeout，跳过）
- [x] 7.2 迁移 `app-loading.integration.test.ts` 的 4 处真实 setTimeout（集成测试 mock 内 setTimeout，保留现状避免干扰真实异步操作）
- [x] 7.3 迁移 `auto-naming.integration.test.ts` 的 3 处真实 setTimeout（同上）
- [x] 7.4 迁移 `modelStorage.test.ts` 的 1 处真实 setTimeout（集成测试使用真实 IndexedDB，保留现状）
- [x] 7.5 迁移 `resourceLoader.test.ts` 的 2 处真实 setTimeout
- [x] 7.6 迁移 `InitializationManager.test.ts` 的 3 处真实 setTimeout
- [x] 7.7 迁移 `modelMiddleware.test.ts` 的 1 处真实 setTimeout
- [x] 7.8 迁移 `initialization/integration.test.ts` 的 1 处真实 setTimeout（已使用 fakeTimers）
- [x] 7.9 迁移 `toastQueue.test.ts` 的 3 处真实 setTimeout（已使用 fakeTimers）
- [x] 7.10 迁移 `crypto.test.ts` 的 2 处真实 setTimeout（已使用 fakeTimers）

## 8. renderWithProviders 迁移

- [x] 8.1 检查并扩展 `renderWithProviders` 支持所有必要参数
- [x] 8.2 迁移 `toast-system.integration.test.tsx`
- [x] 8.3 迁移 `responsive-layout-switching.integration.test.tsx`
- [x] 8.4 迁移 `drawer-state.integration.test.tsx`
- [x] 8.5 迁移 `Layout.test.tsx`
- [x] 8.6 迁移 `chat-button-render-count.test.tsx`
- [x] 8.7 迁移 `ChatSidebar.test.tsx`
- [x] 8.8 迁移 `ChatContent.test.tsx`
- [x] 8.9 迁移 `ToolsBar.test.tsx`
- [x] 8.10 迁移 `ChatButton.test.tsx`

## 9. 测试命名统一

- [x] 9.1 去除 `ChatPanel.test.tsx` 中的编号前缀（`4.1.1` 等）
- [x] 9.2 去除 `ChatPanelSender.test.tsx` 中的编号前缀（`5.1`、`7.1` 等）
- [x] 9.3 去除 `useAutoResizeTextarea.test.tsx` 中的编号前缀（`4.2`、`4.6`）
- [x] 9.4 将 `test-indexeddb.test.ts` 中的英文测试名称改为中文
- [x] 9.5 将 `test-keyring.test.ts` 中的英文测试名称改为中文

## 10. 全量验证

- [x] 10.1 运行全量测试确认所有测试通过
- [x] 10.2 验证无新增的 console 输出或警告
- [x] 10.3 更新 `simplify-review.md` 中的修复状态
