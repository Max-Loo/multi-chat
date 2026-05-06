## 1. 共享工厂函数实现

- [x] 1.1 创建 `createResponsiveMock(overrides?)` 辅助函数，返回包含 `layoutMode`、`width`、`height`、`isMobile`、`isCompact`、`isCompressed`、`isDesktop` 的可变对象，注册到 `globalThis.__createResponsiveMock`
- [x] 1.2 创建 `createTauriCompatModuleMock(storeMap?)` 工厂函数，返回完整的 `vi.mock('@/utils/tauriCompat')` mock 对象（含 `isTauri`、`createLazyStore`、`keyring`），注册到 `globalThis.__createTauriCompatModuleMock`
- [x] 1.3 创建 `createToastQueueModuleMock()` 工厂函数，包装已有的 `createToastQueueMocks` 为 `vi.mock` 兼容的模块对象，注册到 `globalThis.__createToastQueueModuleMock`
- [x] 1.4 在 `setup.ts` 中注册上述三个 globalThis 工厂

## 2. 测试文件迁移 — tauriCompat mock

- [x] 2.1 迁移 `model-config.integration.test.ts`：替换内联 `vi.mock('@/utils/tauriCompat')` 为 `globalThis.__createTauriCompatModuleMock(memoryStore)`
- [x] 2.2 迁移 `settings-change.integration.test.ts`：替换内联 `vi.mock('@/utils/tauriCompat')` 为 `globalThis.__createTauriCompatModuleMock()`

## 3. 测试文件迁移 — useResponsive mock（7 个文件）

- [x] 3.1 迁移 `Layout.test.tsx`：替换内联 `mockResponsive` 定义为 `globalThis.__createResponsiveMock()`
- [x] 3.2 迁移 `BottomNav.test.tsx`
- [x] 3.3 迁移 `SettingPage.test.tsx`
- [x] 3.4 迁移 `ToolsBar.test.tsx`
- [x] 3.5 迁移 `drawer-state.integration.test.tsx`
- [x] 3.6 迁移 `bottom-nav.integration.test.tsx`
- [x] 3.7 迁移 `chat-button-render-count.test.tsx`

## 4. 测试文件迁移 — toast mock（5 个文件）

- [x] 4.1 迁移 `ModelSelect.test.tsx`
- [x] 4.2 迁移 `MainApp.test.tsx`
- [x] 4.3 迁移 `appConfigMiddleware.test.ts`
- [x] 4.4 迁移 `pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`
- [x] 4.5 迁移 `chat-button-render-count.test.tsx`

## 5. 代码质量修复

- [x] 5.1 移除 `Layout.test.tsx` 中 `getByTestId`/`getByRole` 后冗余的 `toBeInTheDocument()` 断言

## 6. 效率优化

- [x] 6.1 合并 `crypto-storage.test.ts` 中两个 100 次加密测试为一个测试用例
- [x] 6.2 提取 `ChatPanel.test.tsx` 中重复的 store 创建模式为 `renderChatPanel(modelCount, overrides?)` 辅助函数
- [x] 6.3 将 `Layout.test.tsx` 的 store 创建提升到 `describe` 级别共享

## 7. 验证

- [x] 7.1 运行 `pnpm test` 确认所有测试通过
- [x] 7.2 运行 `pnpm tsc` 确认无类型错误
