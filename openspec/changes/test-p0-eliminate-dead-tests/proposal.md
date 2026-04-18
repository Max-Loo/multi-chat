## Why

测试套件中存在约 500 行零价值的测试代码：有直接测试第三方库（highlight.js）功能的文件、有完全重复的测试文件、有仅断言 JavaScript 语言语义（`typeof vi.fn() === 'function'`、`expect(store).toBeDefined()`）的测试用例。这些代码提供了虚假的覆盖率数据，浪费 CI 资源，并让开发者误以为关键路径已被测试覆盖。

## What Changes

- **删除** `src/__test__/utils/codeHighlight.test.ts`（431 行）—— 整个文件测试 highlight.js 库功能，项目自有高亮集成已由 `highlightLanguageManager.test.ts` 和 `markdown.test.ts` 覆盖
- **删除** `src/__test__/store/chatPageSlices.test.ts`（旧版本）—— 与 `store/slices/chatPageSlices.test.ts`（新版本）完全重复，新版本质量更高
- **删除** `src/__test__/utils/tauriCompat/http.test.ts`（90 行）—— 全部 8 个用例均为假阳性（`typeof fetch === 'function'`、`expect(input).toBeInstanceOf(URL/Request)` 等），无任何有价值的测试
- **删除** `src/__test__/utils/tauriCompat/os.test.ts`、`shell.test.ts`、`store.test.ts` 中的假阳性断言（约 18 个用例）—— 断言 `typeof lang === 'string'`、`expect(Promise).toBeInstanceOf(Promise)` 等 JavaScript 语言保证
- **删除** `src/__test__/hooks/useNavigateToExternalSite.test.ts` 中的 "Mock 验证测试" 块（4 个用例）—— 测试 mock 基础设施而非生产代码
- **删除** `src/__test__/hooks/useConfirm.test.tsx` 中的假阳性断言（2 个用例）—— 断言 `vi.fn()` 是 function 类型
- **重写** `src/__test__/pages/Chat/ChatPage.test.tsx` —— 3 个 `vi.mock` 路径指向不存在的目录结构，文件自身注释声称"不 Mock 子组件"但实际大量 mock，需重写为可运行状态或删除

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `tauri-compat-tests`: 移除假阳性断言，仅保留验证项目自有逻辑的测试用例
- `chat-page-tests`: 重写或删除因 mock 路径过时而无法运行的测试
- `test-code-cleanup`: 扩大清理范围，覆盖本轮识别的零价值测试代码

## Impact

- **删除文件**：3 个（`codeHighlight.test.ts`、旧版 `chatPageSlices.test.ts`、`http.test.ts`）
- **修改文件**：约 6 个（移除假阳性断言、重写过时测试）
- **预计减少**：~590 行测试代码
- **CI 影响**：减少约 38 个无效测试用例的执行时间
- **覆盖率**：名义行覆盖率可能下降，但实际有效覆盖率不变
