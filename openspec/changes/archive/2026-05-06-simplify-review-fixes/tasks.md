## 1. i18n 基础设施

- [x] 1.1 在 `src/locales/zh/common.json`、`src/locales/en/common.json`、`src/locales/fr/common.json` 中新增 `a11y` 分组（11 个键值）
- [x] 1.2 更新 `src/@types/translationResources.d.ts` 中 `common` 接口添加 `a11y` 子类型声明

## 2. a11y 工具函数

- [x] 2.1 创建 `src/utils/a11y.ts`，实现 `handleActivationKeyDown(callback)` 函数
- [x] 2.2 将 `src/pages/Chat/components/Sidebar/components/ChatButton.tsx` 内联键盘处理器替换为 `handleActivationKeyDown`
- [x] 2.3 将 `src/pages/Setting/.../ProviderCard.tsx` 内联键盘处理器替换为 `handleActivationKeyDown`

## 3. aria-label 国际化迁移

- [x] 3.1 `src/components/BottomNav/index.tsx` — `aria-label` 迁移为 `t($ => $.common.a11y.bottomNav)`
- [x] 3.2 `src/components/Sidebar/index.tsx` — `aria-label` 迁移为 `t($ => $.common.a11y.mainNav)`
- [x] 3.3 `src/components/chat/ChatBubble.tsx` — 用户/助手消息 `aria-label` 迁移为 i18n
- [x] 3.4 `src/components/NoProvidersAvailable.tsx` — 错误图标 `aria-label` 确认使用 i18n
- [x] 3.5 `src/pages/Chat/components/ModelSelect/index.tsx` — 工具栏和清除按钮 `aria-label` 迁移
- [x] 3.6 `src/pages/Chat/components/Panel/Detail/index.tsx` — 聊天消息区域 `aria-label` 迁移
- [x] 3.7 `src/pages/Chat/index.tsx` — 聊天列表 `aria-label` 迁移 + data-testid 重命名为 `chat-sidebar-wrapper`
- [x] 3.8 `src/pages/Model/CreateModel/index.tsx` — 模型供应商 `aria-label` 迁移
- [x] 3.9 `src/pages/Model/CreateModel/components/ModelSidebar.tsx` — 导航 `aria-label` 迁移
- [x] 3.10 `src/pages/Setting/index.tsx` — 设置导航 `aria-label` 迁移
- [x] 3.11 `src/pages/Setting/components/SettingSidebar.tsx` — 设置导航 `aria-label` 迁移

## 4. data-testid 修复

- [x] 4.1 更新 `src/__test__/pages/Chat/ChatPage.test.tsx` 中 `chat-sidebar` 查询为 `chat-sidebar-wrapper`（`ChatSidebar.test.tsx` 查询的是内层组件的 `chat-sidebar` testid，不受影响，无需修改）

## 5. Sender 异步修复

- [x] 5.1 在 `src/pages/Chat/components/Panel/Sender.tsx` 的两个 `sendMessage(text)` 调用点（`onClickSendBtn` line 158、`onPressEnterBtn` line 192）添加 `.catch(console.error)`
- [x] 5.2 确认 `onClickSendBtn` 和 `onPressEnterBtn` 中的 `isSending` 守卫已覆盖并发场景（现有代码已满足，无需修改）

## 6. 效率优化

- [x] 6.1 `src/services/chat/providerLoader.ts` — `handleNetworkRecover` 仅重试 error 状态的 provider
- [x] 6.2 `src/utils/resourceLoader.ts` — `load()` 方法缓存检查从 `this.get(key)` 改为 `this.cache.has(key)`（语义更清晰，避免不必要的函数调用）
- [x] 6.3 `src/services/modelRemote/index.ts` — `createCacheStore()` 改为模块级单例 `remoteCacheStore`
- [x] 6.4 `src/store/storage/chatStorage.ts` — `saveChatAndIndex` 和 `deleteChatFromStorage` 均合并为单次 init + 批量 set + 单次 save

## 7. 代码清理

- [x] 7.1 删除 `src/services/i18n.ts` 中无调用者的废弃导出 `resetInitI18nForTest`
- [x] 7.2 `src/pages/Chat/components/Sidebar/components/ToolsBar.tsx` — 空 `<div></div>` 替换为 `<span aria-hidden="true" />`

## 8. 验证

- [x] 8.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 8.2 运行 `pnpm lint` 确认无 lint 错误
- [x] 8.3 运行 `pnpm test` 确认所有测试通过
