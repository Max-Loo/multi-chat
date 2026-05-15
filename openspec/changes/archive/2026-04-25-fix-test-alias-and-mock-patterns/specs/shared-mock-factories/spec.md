## ADDED Requirements

### Requirement: highlight.js 共享 mock 工厂

`helpers/mocks/highlight.ts` 必须（MUST）导出 `createHighlightJsMock()` 工厂函数，通过 `setup/base.ts` 注册到 `globalThis.__createHighlightJsMock`。所有需要 mock `highlight.js` 的测试文件必须（MUST）使用此工厂，而非 `require()` 导入。

#### Scenario: 工厂函数返回完整的 highlight.js mock 对象

- **WHEN** `createHighlightJsMock()` 被调用
- **THEN** 返回包含 `default.highlight`、`default.highlightAuto`、`default.getLanguage` 方法的 mock 对象

#### Scenario: 工厂通过 globalThis 在 vi.mock 中使用

- **WHEN** 测试文件使用 `vi.mock('highlight.js', () => globalThis.__createHighlightJsMock())`
- **THEN** mock 正确注册且测试通过

#### Scenario: ChatBubble 和 ThinkingSection 使用共享工厂

- **WHEN** 扫描 `ChatBubble.test.tsx` 和 `ThinkingSection.test.tsx`
- **THEN** 不包含 `require('@/__test__/helpers/mocks/highlight')` 调用
- **AND** 使用 `globalThis.__createHighlightJsMock()` 替代
