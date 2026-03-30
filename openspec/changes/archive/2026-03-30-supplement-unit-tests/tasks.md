## 1. 新增纯函数单元测试

- [x] 1.1 创建 `src/__test__/utils/htmlEscape.test.ts` — 测试 escapeHtml 和 escapeHtmlManual 的特殊字符转义、空字符串、CJK/emoji、两种实现一致性
- [x] 1.2 创建 `src/__test__/utils/urlUtils.test.ts` — 测试 clearUrlSearchParams 的清除参数、空参数列表、不存在的 key、不修改原对象
- [x] 1.3 创建 `src/__test__/utils/constants.test.ts` — 测试 getLanguageConfig 查找、SUPPORTED_LANGUAGE_LIST/Set 完整性、LANGUAGE_MIGRATION_MAP 映射
- [x] 1.4 创建 `src/__test__/utils/providerUtils.test.ts` — 测试 getProviderLogoUrl 的 URL 拼接

## 2. 新增 Hook 和 Redux Slice 单元测试

- [x] 2.1 创建 `src/__test__/hooks/useDebouncedFilter.test.ts` — 测试防抖过滤、空文本、延迟行为、清理 cancel
- [x] 2.2 创建 `src/__test__/store/slices/modelPageSlices.test.ts` — 测试 toggleDrawer、setIsDrawerOpen、初始状态
- [x] 2.3 创建 `src/__test__/store/slices/settingPageSlices.test.ts` — 测试 toggleDrawer、setIsDrawerOpen、初始状态

## 3. 修复现有测试缺口

- [x] 3.1 修复 `src/__test__/hooks/useIsChatSending.test.ts` — 补全最后一个测试用例，验证 runningChat 状态变化时 isSending 正确更新
- [x] 3.2 补充 `src/__test__/store/middleware/chatMiddleware.test.ts` — 新增自动命名触发逻辑测试：四条件全部满足时触发、各条件不满足时不触发、内存锁防并发（同一 chatId 连续 dispatch 两次 `sendMessage/fulfilled`，验证只触发一次 `generateChatName`）、fulfilled/rejected 后锁释放（监听 `'chatModel/sendMessage/fulfilled'` 而非 `startSendChatMessage.fulfilled`）。每个用例使用不同 chatId 隔离模块级 `generatingTitleChatIds` Set 状态
- [x] 3.3 补充 `src/__test__/services/chat/providerFactory.test.ts` — 新增错误处理场景测试：无效 providerKey 抛出增强错误（包含 key 信息和原始 cause）、SDK 加载失败时抛出增强错误
- [x] 3.4 补充 `src/__test__/store/middleware/appConfigMiddleware.test.ts` — 新增 setAutoNamingEnabled 持久化测试

## 4. 验证

- [x] 4.1 运行 `pnpm test` 确认所有新增和修改的测试通过
