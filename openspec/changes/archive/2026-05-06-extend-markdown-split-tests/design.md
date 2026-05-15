## Context

`findSafeSplitPoint` 是流式增量渲染（streaming-incremental-render 变更）的核心函数。它逐行扫描 markdown 内容，跟踪 fenced code block 状态，返回代码块外最后一个空行的位置作为冻结/活跃块的切分边界。

现有 13 个测试用例覆盖了基本段落、代码块语法和部分边界情况。但 tasks.md 中标记的 4.1（流式渲染验证）、4.2（非流式场景）、4.3（边界情况）仍需手动验证，缺少对应的自动化测试。

`StreamingContent` 组件通过 `useRef` 缓存冻结块的 HTML，以 `findSafeSplitPoint` 的返回值作为切分点。如果切分逻辑在边界场景下行为异常，会导致渲染闪烁或内容丢失，而这些问题难以通过手动测试稳定复现。

## Goals / Non-Goals

**Goals:**
- 将 tasks.md 中手动验证场景转化为可自动运行的单元测试
- 覆盖流式增量输入模式（内容逐步追加、缩短回退）
- 覆盖实际 LLM 输出模式（纯代码块、极短消息、消息切换）
- 覆盖复杂 Markdown 结构（列表、引用、标题、HTML）
- 覆盖极端边界（仅围栏标记、CRLF、连续空行、超长行）

**Non-Goals:**
- 不修改 `findSafeSplitPoint` 的实现逻辑
- 不测试 `StreamingContent` 组件（仅测试纯函数）
- 不引入新的依赖或工具

## Decisions

### 测试组织方式：按场景分组 describe

沿用现有测试文件的 describe 分组模式，新增以下 describe 块：
- "流式增量场景" — 模拟内容逐步追加和缩短
- "LLM 输出模式" — 实际模型输出特征
- "复杂 Markdown 结构" — 列表/引用/标题/HTML
- "极端边界" — 特殊输入格式

**替代方案**：拆分为多个测试文件。**否决原因**：`findSafeSplitPoint` 是单一纯函数，按场景在同一文件内分组更便于维护和对比。

### 测试编写风格：使用 slice 断言

沿用现有模式：通过 `content.slice(0, result)` 和 `content.slice(result)` 来断言分割结果的两侧内容，而非直接断言位置数字。这种方式更直观、更易理解。

### 不引入参数化测试

现有测试使用独立的 `it` 块。继续沿用此风格，不引入 `test.each` 或类似参数化机制。每个用例有独立的描述和上下文，独立 it 块的可读性更好。

## Risks / Trade-offs

- **测试用例数量膨胀** → 新增约 15-20 个用例，总计约 30 个。控制每个用例有明确目的，避免重复覆盖。
- **CRLF 场景可能与平台相关** → 使用显式 `\r\n` 构造输入字符串，不依赖文件读取。
