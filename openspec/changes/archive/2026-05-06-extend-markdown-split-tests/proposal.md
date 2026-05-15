## Why

`findSafeSplitPoint` 是流式增量渲染的核心算法，决定冻结/活跃块的切分边界。当前测试虽有 13 个用例，但主要集中在基本语法和代码块场景，缺少对流式增量输入模式、实际 LLM 输出模式以及 tasks.md 中标记为手动验证的边界场景的覆盖。纯手动验证这些场景容易遗漏回归问题，需要将它们转化为自动化单元测试。

## What Changes

- 补充流式增量场景的测试用例：模拟内容逐步追加、内容缩短回退、流式结束等模式
- 补充实际 LLM 输出模式测试：纯代码块消息、极短消息、消息切换时的结果一致性
- 补充复杂 Markdown 结构测试：列表、引用、标题、嵌套标记、HTML 标签内空行
- 补充极端边界测试：仅围栏标记、连续空行、长单行、CRLF 换行符
- 不修改 `findSafeSplitPoint` 的实现逻辑，仅扩展测试

## Capabilities

### New Capabilities

- `markdown-split-test-coverage`: 定义 `findSafeSplitPoint` 在流式增量、LLM 输出模式、复杂结构和极端边界场景下的预期行为规格

### Modified Capabilities

无。`findSafeSplitPoint` 的行为不变，仅扩展测试覆盖。

## Impact

- 文件: `src/__test__/utils/markdownSplit.test.ts`（新增测试用例）
- 不影响生产代码
- 不影响依赖项
