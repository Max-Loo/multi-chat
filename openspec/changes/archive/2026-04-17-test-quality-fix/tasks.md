## 1. 移除冗余 spy 和消除 as any（低风险快速修复）

- [x] 1.1 移除 `useAdaptiveScrollbar.test.ts` 中 `clearTimeout` spy，删除相关断言，保留 fake timers + 状态断言
- [x] 1.2 替换 `useTypedSelectedChat.test.tsx` 中内联 action `as any` 为从 `@/store/slices/chatSlices` 导入的 `setSelectedChatId` action creator
- [x] 1.3 替换 `useIsChatSending.test.ts` 中 `setSelectedChatId` 的内联 action `as any` 为从 `@/store/slices/chatSlices` 导入的 action creator；`sendMessage/pending` 的内联 action 因 thunk 未导出无法替换，保留 `as any` 并添加注释说明
- [x] 1.4 修正 `ModelConfigForm.test.tsx` 中 4 处 `onFinish as any`，使用类型化 mock 函数

## 2. 迁移 useCreateChat 测试到真实 store

- [x] 2.1 重写 `useCreateChat.test.ts`：移除 `vi.mock('@/hooks/redux')`，改用 `renderHookWithProviders` + 真实 store
- [x] 2.2 更新断言：从验证 dispatch 参数改为验证 `store.getState()` 中的 state 变更
- [x] 2.3 验证所有测试用例通过

## 3. 减少 highlightLanguageManager testInternals 依赖

- [x] 3.1 删除 `_clearFailedLanguages()` 调用（`_resetInstance()` 已隐含此效果）
- [x] 3.2 将 `testInternals.resolveAlias` 直接测试改为通过 `isLoaded()` 间接验证
- [x] 3.3 将 `testInternals.loadingPromises` 直接断言改为通过 `loadLanguageModule` mock 调用计数间接验证
- [x] 3.4 验证测试覆盖率未下降

## 4. 添加 selector 测试

- [x] 4.1 创建 `src/__test__/store/selectors/chatSelectors.test.ts`
- [x] 4.2 编写 selectSelectedChat 的输入-输出测试（匹配、未选中、无匹配）
- [x] 4.3 编写 memoization 引用稳定性测试
- [x] 4.4 验证测试通过

## 5. 验证和收尾

- [x] 5.1 运行完整测试套件，确认 1761+ 个测试全部通过
- [x] 5.2 统计 `as any` 数量，确认从 40 处降至 33 处以内
- [x] 5.3 更新 `docs/design/test-quality-review.md` 中已修复问题清单
