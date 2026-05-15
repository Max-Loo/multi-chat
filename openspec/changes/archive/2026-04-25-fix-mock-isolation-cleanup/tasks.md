## 1. 核心修复

- [x] 1.1 将 `src/__test__/setup/cleanup.ts` 中 `vi.clearAllMocks()` 替换为 `vi.restoreAllMocks()`
- [x] 1.2 提取 `cleanup.ts` 中重复的 `expectedErrorPatterns` 为模块顶层 `EXPECTED_ERROR_PATTERNS` 常量，window 和 process 分支引用同一常量

## 2. 测试文件适配

- [x] 2.1 修复 `src/__test__/config/initSteps.test.ts` — 将 `mockDispatch` 的自定义实现 `(args) => args[0]` 移入 `beforeEach`
- [x] 2.2 修复 `src/__test__/integration/master-key-recovery.integration.test.tsx` — 将 `mockResetAllData` 的 `mockResolvedValue(undefined)` 移入 `beforeEach`
- [x] 2.3 修复 `src/__test__/components/chat/ChatBubble.memo.test.tsx` — 将 `mockGenerateCleanHtml` 的自定义实现移入 `beforeEach`
- [x] 2.4 修复 `src/__test__/pages/Chat/ChatSidebar.test.tsx` — 将 `mockUseResponsive` 的自定义实现移入 `beforeEach`
- [x] 2.5 修复 `src/__test__/pages/Chat/ChatPage.test.tsx` — 将 `mockResponsive` 的自定义实现移入 `beforeEach`
- [x] 2.6 修复 `src/__test__/pages/Setting/LanguageSetting.test.tsx` — 将 `mockChangeAppLanguage` 的 `mockResolvedValue` 移入 `beforeEach`

## 3. 验证

- [x] 3.1 运行完整单元测试套件（`pnpm test --run`），确认 150 个文件全部通过
- [x] 3.2 运行集成测试套件（`pnpm test:integration:run`），确认集成测试通过
- [x] 3.3 检查测试输出中无新增 stderr 警告或错误
