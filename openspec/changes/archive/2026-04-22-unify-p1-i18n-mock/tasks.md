## 1. 准备

- [x] 1.1 检查 `globalThis.__createI18nMockReturn` 的实现，确认能覆盖 selector-based `t()` 的需求
- [x] 1.2 如需扩展工厂，先修改 `setup.ts` 中的工厂实现

## 2. 逐文件转换

- [x] 2.1 转换 `src/__test__/components/chat/ChatBubble.memo.test.tsx` 的 i18n mock
- [x] 2.2 转换 `src/__test__/pages/Chat/RunningBubble.test.tsx` 的 i18n mock
- [x] 2.3 转换 `src/__test__/pages/Chat/Detail.test.tsx` 的 i18n mock
- [x] 2.4 转换 `src/__test__/components/MainApp.test.tsx` 的 i18n mock
- [x] 2.5 转换 `src/__test__/components/KeyRecoveryDialog.test.tsx` 的 i18n mock
- [x] 2.6 转换 `src/__test__/integration/master-key-recovery.integration.test.tsx` 的 i18n mock

## 3. 验证

- [x] 3.1 运行全部 6 个文件的测试确认通过
- [x] 3.2 grep 确认无残留的手动 i18n mock
