## MODIFIED Requirements

### Requirement: 删除零价值测试文件

测试套件中 SHALL NOT 包含以下类型的文件：
- 测试第三方库功能而非项目代码的文件
- 与其他文件功能完全重复的旧版本文件
- mock 路径已过时且无法运行的测试文件

#### Scenario: codeHighlight.test.ts 删除

- **WHEN** `utils/codeHighlight.test.ts` 直接导入 highlight.js 并测试其高亮功能
- **THEN** 该文件 SHALL 被整体删除，因为 `highlightLanguageManager.test.ts` 和 `markdown.test.ts` 已正确覆盖项目的高亮集成

#### Scenario: 旧版 chatPageSlices.test.ts 删除

- **WHEN** `store/chatPageSlices.test.ts` 与 `store/slices/chatPageSlices.test.ts` 功能重复
- **THEN** 旧版本 SHALL 被删除，新版本质量更高且已覆盖相同逻辑

#### Scenario: ChatPage.test.tsx 删除

- **WHEN** `pages/Chat/ChatPage.test.tsx` 的 3 个 vi.mock 路径指向不存在的目录结构，且文件注释与实际代码矛盾
- **THEN** 该文件 SHALL 被删除，在后续变更中创建新的正确测试

### Requirement: 删除假阳性断言块

测试文件中 SHALL NOT 包含仅验证 mock 基础设施或 JavaScript 语言语义的测试用例。

#### Scenario: useNavigateToExternalSite Mock 验证测试删除

- **WHEN** `useNavigateToExternalSite.test.ts` 第 205-251 行包含 "Mock 验证测试" describe 块
- **THEN** 该 describe 块 SHALL 被整体删除

#### Scenario: useConfirm 假阳性断言删除

- **WHEN** `useConfirm.test.tsx` 第 124-156 行包含 `expect(typeof onOk).toBe('function')` 等断言
- **THEN** 这些断言 SHALL 被删除
