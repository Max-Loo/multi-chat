## 1. 核心函数改造

- [x] 1.1 将 `resetTestState()` 改为异步函数（`void` → `Promise<void>`），内部 `await clearIndexedDB()`
- [x] 1.2 将 `resetIndexedDB` 默认值从 `false` 改为 `true`
- [x] 1.3 在 `clearIndexedDB()`（`helpers/isolation/reset.ts`）中添加 `indexedDB.databases()` 的 fallback 策略：不可用时退回到硬编码数据库名列表 `['multi-chat-store', 'multi-chat-keyring']`
- [x] 1.4 修复 `clearIndexedDB()`（`helpers/integration/clearIndexedDB.ts`）中硬编码数据库名的错误：`['multichat', 'multichat-keyval']` → `['multi-chat-store', 'multi-chat-keyring']`，并添加与 isolation 版本一致的 fallback 策略
- [x] 1.5 将 `useIsolatedTest()` 的 `beforeEach`/`afterEach` 回调改为 `async`，`await resetTestState()`
- [x] 1.6 将 `onBeforeEach`/`onAfterEach` 回调类型改为 `() => void | Promise<void>`，内部统一 `await`

## 2. 隔离验证扩展

- [x] 2.1 将 `verifyIsolation()` 改为异步函数（`boolean` → `Promise<boolean>`）
- [x] 2.2 新增 IndexedDB 状态检查，使用与 `clearIndexedDB()` 一致的 fallback 策略

## 3. 调用点适配

- [x] 3.1 `isolation.test.ts` 中 `it()` 内的 4 处 `resetTestState()` 调用添加 `await`，对应 `it()` 回调改为 `async`
- [x] 3.2 `isolation.test.ts` 中 2 处 `verifyIsolation()` 调用添加 `await`，对应 `it()` 回调改为 `async`
- [x] 3.3 `beforeEach` 中的调用添加 `await`（LanguageSetting、GeneralSetting、SettingPage、ChatSidebar、ChatContent、ToolsBar、ChatButton 共 7 个文件）

## 4. 测试更新

- [x] 4.1 新增 `clearIndexedDB()` fallback 策略的测试用例
- [x] 4.2 新增 `verifyIsolation()` IndexedDB 检查的测试用例
- [x] 4.3 新增 `verifyIsolation()` IndexedDB fallback 的测试用例

## 5. 验证

- [x] 5.1 运行全部测试确认无回归
