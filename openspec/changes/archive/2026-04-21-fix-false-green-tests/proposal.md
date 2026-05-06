## Why

项目中存在三类假绿测试：`waitFor` 未 `await` 导致断言永不执行、`expect(true).toBe(true)` 空断言、以及多个测试名称声称验证不同行为但断言完全相同。这些测试在 CI 中永远通过但实际未验证任何行为，给团队以虚假的测试覆盖信心，掩盖了潜在的回归风险。

## What Changes

- **修复 ChatPanel.test.tsx**：为第 157 行和第 333 行的 `waitFor()` 添加 `await`，使内部断言能够正确执行
- **修复 ModelSelect.test.tsx**：将第 87-90 行的 `expect(true).toBe(true)` 替换为验证组件实际渲染行为的断言
- **重写 Layout.test.tsx**：为 8 个空洞测试补充匹配其描述的真实断言（Flexbox 布局、屏幕高度、移动端适配、Sidebar 渲染、Suspense 包裹等），或将功能重复的测试合并

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `chat-panel-testing`: 修复 2 处 `waitFor` 未 `await` 导致的静默假绿测试
- `test-quality-fix`: 修复 ModelSelect 和 Layout 中的空断言与空洞测试，确保每个测试验证其描述的行为

## Impact

- **测试文件**（仅修改测试代码，不涉及生产代码）：
  - `src/__test__/components/ChatPanel.test.tsx`
  - `src/__test__/components/ModelSelect.test.tsx`
  - `src/__test__/components/Layout.test.tsx`
- **CI 行为变化**：修复后部分原本静默通过的测试可能开始失败（如果被测行为确实存在 bug），这是预期行为
- **无生产代码影响**：本变更仅涉及测试代码
