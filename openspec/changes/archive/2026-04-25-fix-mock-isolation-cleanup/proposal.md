## Why

测试系统全局 `afterEach` 使用 `vi.clearAllMocks()` 仅清除调用历史，不清除 mock 实现。当某个测试通过 `mockReturnValue()`/`mockImplementation()`（非 Once 版本）修改全局 mock 行为后，该实现会泄漏到后续测试，造成难以排查的测试间状态污染。

## What Changes

- **BREAKING**: 将 `setup/cleanup.ts` 全局 `afterEach` 中的 `vi.clearAllMocks()` 替换为 `vi.restoreAllMocks()`，彻底隔离测试间的 mock 状态
- 修复 6 个测试文件中 describe-scope `vi.fn()` 声明模式，将自定义实现移入 `beforeEach`，确保每次测试前重新注入
- 提取 `cleanup.ts` 中重复的 `expectedErrorPatterns` 数组为顶层常量，消除 DRY 违反

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `test-setup-layers`: 清理层的 `afterEach` 行为从 `clearAllMocks` 变更为 `restoreAllMocks`，需要更新对应规格中的清理行为要求

## Impact

- **核心改动**：`src/__test__/setup/cleanup.ts`（1 行核心修改 + DRY 重构）
- **适配改动**（6 个测试文件）：
  - `src/__test__/config/initSteps.test.ts` — `mockDispatch` 实现
  - `src/__test__/integration/master-key-recovery.integration.test.tsx` — `mockResetAllData` 实现
  - `src/__test__/components/chat/ChatBubble.memo.test.tsx` — `mockGenerateCleanHtml` 实现
  - `src/__test__/pages/Chat/ChatSidebar.test.tsx` — `mockUseResponsive` 实现
  - `src/__test__/pages/Chat/ChatPage.test.tsx` — `mockResponsive` 实现
  - `src/__test__/pages/Setting/LanguageSetting.test.tsx` — `mockChangeAppLanguage` 实现
- **规格更新**：`openspec/specs/test-setup-layers/spec.md` 中清理层行为描述
