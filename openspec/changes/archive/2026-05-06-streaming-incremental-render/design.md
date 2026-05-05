## Context

当前 ChatBubble 和 ThinkingSection 通过 `dangerouslySetInnerHTML` 渲染 markdown 内容。流式响应期间（~50ms 节流），`generateCleanHtml` 对完整累积内容执行 markdown-it 解析 + DOMPurify 消毒，产出的 HTML 字符串发生变化后 React 直接 `innerHTML = newHtml`，销毁并重建该 div 下所有 DOM 节点。

随着消息内容增长，已确认的段落和代码块被反复销毁重建。对于一个 5000 字的消息流式 5 秒（约 100 tick），总解析量约 250,000 字符，且 DOM 操作量与 tick 数成正比。

现有优化层：streamProcessor 50ms 节流、ChatBubble `React.memo` + `arePropsEqual`、代码块异步高亮 + 全局 DOM 补丁、语言预加载。但均未解决「已渲染内容不变但被反复重建」的核心问题。

## Goals / Non-Goals

**Goals:**
- 流式期间，已渲染完毕的内容段落 DOM 节点不再被销毁重建
- `generateCleanHtml` 仅处理当前活跃段落（非全量内容）
- 流式结束后渲染结果与未优化时完全一致
- 代码块异步高亮和复制按钮机制无需修改

**Non-Goals:**
- 不修改 `generateCleanHtml` 接口或 markdown-it 配置
- 不引入新的外部依赖
- 不改变 ChatBubble 对外 Props 接口
- 不修改流式处理器的节流策略

## Decisions

### 决策 1：多块 append-only 冻结方案

**选择**: 将内容按段落边界分割为多个独立 `<div>`，每个冻结块渲染一次后不再变化

**备选方案**:
- **单个冻结 div**: 新块毕业时整个冻结 HTML 变化 → React 仍会 `innerHTML = newHtml` 替换整个冻结区，违背优化初衷
- **Ref 直接操作 DOM**: 绕过 React 声明式模型，风险高且维护困难
- **不渲染 markdown（流式结束后再渲染）**: 用户体验差，失去即时反馈

**理由**: 多块方案下每个冻结 `<div>` 的 `__html` 字符串在创建后不变，React diff 时字符串相等直接跳过 DOM 操作。活跃块仅包含最后一个未完成段落，内容短、重渲染开销小。

### 决策 2：安全分割点 = 空行边界（代码块感知）

**选择**: 逐行扫描内容，跟踪 fenced code block 状态（``` 和 ~~~），在代码块外的空行处标记安全分割点

**理由**: markdown 的 `\n\n` 是段落分隔符，在代码块外总是安全的块边界。代码块内的 `\n\n` 不应作为分割点。逐行扫描复杂度 O(n)，足够轻量。

### 决策 3：流式结束时执行一次完整渲染

**选择**: `isRunning` 变为 `false` 时，清除冻结块缓存，对完整内容执行一次 `generateCleanHtml` 渲染

**理由**: 分块渲染和整体渲染在列表、引用块等结构上可能有微妙视觉差异（如两个 `<ul>` vs 一个 `<ul>` 的间距不同）。一次性全量渲染仅在流式结束时触发一次，可接受。

### 决策 4：封装为独立 StreamingContent 组件

**选择**: 新建 `StreamingContent` 组件，接收 `content` 和 `isRunning` props，内部管理分割和缓存逻辑。缓存重置由父组件通过 React `key` 机制触发——当 `messageId` 变化时父组件渲染 `<StreamingContent key={messageId} .../>`，React 卸载旧实例并挂载新实例，`useRef` 自动重置，无需向组件传递额外标识 prop。

**理由**: ChatBubble 和 ThinkingSection 都需要此优化，抽取为独立组件避免重复代码。React `key` 是处理组件实例重置的惯用方式，保持 StreamingContent 接口最简（仅 `content` + `isRunning`），且 ThinkingSection 可通过 ChatBubble 层面的 `key={messageId}` 同样获得重置保障。

## Risks / Trade-offs

- **[列表/引用块视觉差异]** 分块渲染时 loose list 被拆为多个 `<ul>` → 多出间距 → **缓解**: 流式结束后全量渲染校正，差异仅存在于流式过程中
- **[代码块内含 ``` 字符串]** 跟踪代码块状态可能误判 → **缓解**: 与 markdown-it 本身的解析限制一致，极端情况罕见
- **[messageId 切换时缓存残留]** 快速切换消息时 `frozenBlocksRef` 可能保留旧数据 → **缓解**: 检测 messageId 变化时重置缓存
- **[content 缩短]** 编辑回退导致 `splitPoint` 小于上次记录 → **缓解**: 检测到缩短时重置整个缓存
