## 1. 基础设施准备

- [x] 1.1 在 `helpers/render/redux.tsx` 中新增 `renderHookWithProviders` 函数，支持 store 和 preloadedState 参数，返回 renderHook 结果和 store
- [x] 1.2 在 `helpers/mocks/testState.ts` 中新增 `createRunningChatEntry(chatId, modelId, overrides)` 辅助函数
- [x] 1.3 创建 `helpers/mocks/navigation.ts`，提取 BottomNav 共享的导航配置 mock

## 2. Hook 测试 wrapper 统一

- [x] 2.1 迁移 `hooks/useTypedSelectedChat.test.tsx`：删除本地 createWrapper，改用 renderHookWithProviders
- [x] 2.2 迁移 `hooks/useExistingModels.test.tsx`
- [x] 2.3 迁移 `hooks/useIsChatSending.test.ts`
- [x] 2.4 迁移 `hooks/useCurrentSelectedChat.test.tsx`
- [x] 2.5 迁移 `hooks/useExistingChatList.test.tsx`
- [x] 2.6 迁移 `hooks/useBasicModelTable.test.tsx`
- [x] 2.7 迁移 `hooks/redux.test.tsx`
- [x] 2.8 运行所有 hook 测试验证通过

## 3. Store 工厂整合

- [x] 3.1 重构 `helpers/mocks/panelLayout.tsx`：`createPanelLayoutStore` 改用 `createChatSliceState`/`createModelSliceState` 替代内联默认值
- [x] 3.2 运行 panelLayout 相关测试验证通过
- [x] 3.3 重构 `RunningChatBubble.test.tsx`：删除 `createMockChatModelForTest`，改用 `createMockPanelChatModel`
- [x] 3.4 重构 `RunningChatBubble.test.tsx`：将 13 处 `configureStore` 调用替换为 `createTypeSafeTestStore` + `createChatSliceState` + `createRunningChatEntry`
- [x] 3.5 运行 RunningChatBubble 测试验证通过

## 4. 测试质量修复

- [x] 4.1 精简 `ChatContent.test.tsx`：将 14 个测试合并为不超过 4 个有意义的行为测试
- [x] 4.2 运行 ChatContent 测试验证通过
- [x] 4.3 重构 `DetailTitle.test.tsx`：删除 `createTestModel` 和 `createTestChatModel`，改用 `createMockModel` 和 `createMockPanelChatModel`
- [x] 4.4 运行 DetailTitle 测试验证通过
- [x] 4.5 修复 `ChatPanel.test.tsx`：将字符串字面量 `{ type: 'chat/setSelectedChatId' }` 和 `{ type: 'chat/editChat' }` 分别替换为 `setSelectedChatId` 和 `editChat` action creator
- [x] 4.6 运行 ChatPanel 测试验证通过
- [x] 4.7 迁移 `BottomNav.test.tsx` 和 `bottom-nav.integration.test.tsx`：使用共享 navigation mock
- [x] 4.8 运行 BottomNav 相关测试验证通过

## 5. 注释清理

- [x] 5.1 清理 `Sidebar.test.tsx` 中约 14 处与测试标题重复的注释
- [x] 5.2 运行 Sidebar 测试验证通过

## 6. 最终验证

- [x] 6.1 运行完整测试套件 `pnpm test` 确保无回归
