## MODIFIED Requirements

### Requirement: isContentEqual 使用全数组逐元素比较
ChatBubble 的 `isContentEqual` 函数 SHALL 对 string[] 类型进行全数组逐元素比较（`a.every((val, i) => val === b[i])`），而非仅比较末尾元素和长度。

#### Scenario: 数组中间元素变化时检测到差异
- **WHEN** prevProps.content 为 ["a", "b", "c"] 且 nextProps.content 为 ["a", "x", "c"]
- **THEN** isContentEqual 返回 false，触发重渲染

#### Scenario: 完全相同的数组返回 true
- **WHEN** prevProps.content 为 ["a", "b"] 且 nextProps.content 为 ["a", "b"]
- **THEN** isContentEqual 返回 true，跳过重渲染

### Requirement: currentContent/currentReasoning 使用 getContentAtIndex
ChatBubble 中 `currentContent` 和 `currentReasoning` 的 useMemo 计算 SHALL 使用 chatHistoryHelper 的 `getContentAtIndex` 函数，替代内联的数组索引访问逻辑。

#### Scenario: 数组内容按索引提取
- **WHEN** content 为 ["v1", "v2", "v3"] 且 historyIndex 为 1
- **THEN** 使用 `getContentAtIndex(content, 1)` 返回 "v2"

#### Scenario: 字符串内容直接返回
- **WHEN** content 为 "hello" 且 historyIndex 为 0
- **THEN** `getContentAtIndex(content, 0)` 返回 "hello"

## ADDED Requirements

### Requirement: 删除不必要的代码注释
ChatBubble、Detail/index、chatHistoryHelper、markdown.ts 中解释代码行为（WHAT）的注释 SHALL 被删除，仅保留解释非显而易见的 WHY 的注释。约 25 行注释需移除。

#### Scenario: 自明注释被删除
- **WHEN** 注释内容仅复述紧接的标识符或语句含义（如 `// 用户对话气泡` 紧接 `case ChatRoleEnum.USER`）
- **THEN** 该注释被删除

#### Scenario: WHY 注释被保留
- **WHEN** 注释解释了非显而易见的约束或变通方案（如流式保护逻辑的原因）
- **THEN** 该注释被保留

### Requirement: ThinkingSection 使用 div 替代无意义的 Card 包裹
ThinkingSection 中 `<Card className="mb-2 bg-transparent border-none shadow-none">` SHALL 替换为 `<div className="mb-2">`，因为 Card 的所有视觉特征（border、shadow、background）都被重置为无，多引入了一层无意义的 DOM 嵌套。

#### Scenario: ThinkingSection 渲染为简洁的 div
- **WHEN** ThinkingSection 组件渲染推理内容折叠区域
- **THEN** 使用 `<div className="mb-2">` 作为外层容器，不引入 Card 组件

### Requirement: generateCleanHtml 空字符串短路
`generateCleanHtml` 函数 SHALL 在输入为空字符串时直接返回空字符串，跳过 markdown-it 解析和 DOMPurify 过滤。

#### Scenario: 空字符串输入快速返回
- **WHEN** generateCleanHtml 接收空字符串 ""
- **THEN** 直接返回 ""，不执行 markdown 渲染管线

### Requirement: chatMiddleware action type 使用类型安全匹配
chatMiddleware 中 `action.type === 'chatModel/sendMessage/fulfilled'` 字符串硬编码 SHALL 替换为导入 `sendMessage` 后使用 `sendMessage.fulfilled.match(action)`（改用 `matcher` 字段替代 `predicate`，因为 currentState 和 previousState 均未使用）。

#### Scenario: sendMessage.fulfilled 触发标题生成
- **WHEN** sendMessage 异步 thunk 成功完成
- **THEN** 通过 `matcher: sendMessage.fulfilled.match` 匹配 action，效果与原字符串比较一致

#### Scenario: 其他 action 不触发
- **WHEN** 非 sendMessage.fulfilled 的 action 被 dispatch
- **THEN** matcher 返回 false，不触发标题生成逻辑
