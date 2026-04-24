## 1. Crypto 测试重叠清理

- [x] 1.1 删除 `src/__test__/utils/crypto-simple.test.ts` 整个文件
- [x] 1.2 将 `crypto-storage.test.ts` 中 2 个边缘用例（无效 hex 密钥、奇数长度 hex 密钥）迁移到 `crypto.test.ts` 的边缘用例区域
- [x] 1.3 从 `crypto-storage.test.ts` 中删除约 17 个与 `crypto.test.ts` 重复的用例（基本加密/解密往返、错误密钥、密文格式验证、nonce 唯一性、isEncrypted 判断、空密钥/64 字符密钥验证等）
- [x] 1.4 将 `crypto-storage.test.ts` 重命名为 `crypto-storage-strategy.test.ts`，更新文件内 describe 描述以反映新定位
- [x] 1.5 验证全量测试通过

## 2. 未使用 mock/fixture 导出清理

- [x] 2.1 从 `helpers/mocks/aiSdk.ts` 中删除 8 个未使用的错误场景工厂函数和 `StreamEventTypes` 类型
- [x] 2.2 从 `helpers/mocks/chatSidebar.ts` 中删除 7 个未使用的状态工厂函数（`createMockUnnamedChat` 等）
- [x] 2.3 从 `helpers/mocks/router.ts` 中删除 4 个未使用的路由 mock 函数
- [x] 2.4 将 `helpers/mocks/testState.ts` 中的 `createSettingPageSliceState` 改为非导出内部函数（移除 `export` 关键字），该函数仅被同文件的 `createTestRootState()` 调用，不可删除函数定义
- [x] 2.5 删除 `helpers/fixtures/crypto.ts` 整个文件，并从 `helpers/fixtures/` 的 barrel 导出中移除对应引用
- [x] 2.6 从 `helpers/mocks/tauri.ts` 中删除未使用的 `createTauriMocks()`
- [x] 2.7 从 `helpers/mocks/storage.ts` 中删除未使用的 `createStorageMocks()`
- [x] 2.8 更新 `helpers/mocks/index.ts` barrel 文件，移除已删除函数的重导出
- [x] 2.9 更新 `helpers/mocks/mocks.test.ts` 自测文件，移除对已删除函数的测试用例
- [x] 2.10 验证全量测试通过

## 3. 集成测试 mock 策略审查与对齐

- [x] 3.1 确认 `master-key-recovery.integration.test.tsx` 的 react-i18next mock 已使用 `globalThis.__mockI18n()`（已对齐，仅验证）
- [x] 3.2 确认 `app-loading.integration.test.ts`（mock modelStorage/chatStorage）和 `auto-naming.integration.test.ts`（mock chat/chatStorage/titleGenerator）的 `vi.mock()` 调用针对尚无 globalThis 工厂函数的模块，当前方式可接受
- [x] 3.3 验证全量测试通过

## 4. 测试命名风格统一

- [x] 4.1 将 `integration/` 目录下 6 个 `.ts` 文件中的 `test()` 调用改为 `it()`：`settings-change`、`master-key-recovery`、`auto-naming`、`toast-system`、`model-config`、`app-loading`
- [x] 4.2 将 `utils/` 目录下 crypto 相关 `.ts` 文件中的 `test()` 调用改为 `it()`：`crypto-masterkey.integration.test.ts`、`crypto-storage-strategy.test.ts`（重定位后）
- [x] 4.3 将 `utils/test-mock-env.test.ts` 中的 `test()` 调用改为 `it()`
- [x] 4.4 验证全量测试通过
