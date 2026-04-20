## 1. 消除 mock 子组件（3 个组件测试文件）

- [x] 1.1 重构 `GeneralSetting.test.tsx`：移除对 LanguageSetting、ModelProviderSetting、AutoNamingSetting 的 `vi.mock()`，渲染完整组件树（需提供 Redux Provider + i18n Provider + mock `toastQueue`），通过用户可见行为验证功能（子组件文本、交互反馈）
- [x] 1.2 重构 `SettingPage.test.tsx`：移除对 SettingSidebar 的 `vi.mock()`，渲染完整组件树，补充必要的 Provider（i18n、路由子路由配置），验证侧边栏真实渲染内容
- [x] 1.3 重构 `InitializationController.test.tsx`：移除对 FatalErrorScreen、NoProvidersAvailable 的 `vi.mock()`（保留对 shadcn/ui Progress 的 mock 作为第三方库例外），渲染真实子组件，验证错误 UI 的文本内容和进度 UI 的真实行为

## 2. 消除 spyOn 内部实现（2 个工具函数测试文件）

- [x] 2.1 重构 `highlightLanguageManager.test.ts`：将 5 处 `vi.spyOn(manager as any, 'doLoadLanguage')` 替换为 mock 外部依赖 `highlightLanguageIndex` 模块，通过公共 API（`isLoaded`、`hasFailedToLoad`）验证结果
- [x] 2.2 重构 `codeBlockUpdater.test.ts`：移除 12 处 `vi.spyOn(document, ...)` 调用，改用 happy-dom 真实 DOM 元素操作，通过 `innerHTML`/`textContent` 和 `getPendingUpdatesCount()` 验证结果，使用 fake timers 测试重试场景

## 3. 清理可疑 `as any`（约 25 处）

- [x] 3.1 替换 mock 路由 hooks 返回值中的 `as any`（约 8 处）：使用 `helpers/mocks/router.ts` 中的类型安全 mock 工具
- [x] 3.2 替换测试边界值中的 `null as any` / `undefined as any`（约 5 处）：使用 `as unknown as Type` 或类型守卫
- [x] 3.3 替换构造 mock store state 中的 `as any`（约 4 处）：使用 `createTestRootState()` 工厂函数
- [x] 3.4 替换传入不匹配枚举值中的 `as any`（约 4 处）：使用 `as unknown as Type` 类型断言链
- [x] 3.5 审查并替换其他分散的可疑 `as any`（约 4 处）

## 4. 验证与清理

- [x] 4.1 运行全量测试，确保所有修改后的测试通过且无回归
- [x] 4.2 确认 `as any` 总数从 61 处降至 40 处以下
