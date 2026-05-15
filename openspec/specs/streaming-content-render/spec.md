## 流式内容分割渲染

### REQUIREMENTS

### Requirement: 冻结/活跃分割渲染
StreamingContent 组件 SHALL 在流式期间将内容按安全段落边界分割为冻结块和活跃块。冻结块渲染一次后不再重新渲染，活跃块每次内容更新时重新渲染。冻结块计算 SHALL 使用 useMemo 替代渲染阶段 refs 副作用，通过 `prevSplitPointRef` 记录上一次分割点位置。useMemo 内只对新增部分调用 `generateCleanHtml`，保持 append-only 性能优势。持久冻结块列表通过 `frozenBlocksRef` 在渲染阶段追加 useMemo 返回的增量块。不在渲染路径中产生修改 prevSplitPointRef 的副作用。

#### Scenario: 流式期间新段落毕业为冻结块
- **WHEN** 流式内容中出现新的空行边界（非代码块内）
- **THEN** 该边界之前的最后一个活跃块被转为冻结块，其 HTML 被缓存且后续不再变化

#### Scenario: 无安全分割点时退化为活跃块
- **WHEN** 流式内容中尚未出现空行边界
- **THEN** 全部内容作为活跃块渲染，行为与未优化时一致

#### Scenario: 代码块内的空行不作为分割点
- **WHEN** 流式内容中的空行位于 fenced code block（``` 或 ~~~）内部
- **THEN** 该空行 SHALL NOT 被识别为安全分割点

#### Scenario: 流式期间冻结块增量累积
- **WHEN** isRunning 为 true 且 content 持续增长
- **THEN** useMemo 对比当前 splitPoint 与 prevSplitPointRef，仅对新增部分（content.slice(prevSplit, splitPoint)）调用 generateCleanHtml，追加到 frozenBlocksRef

#### Scenario: 流式结束时缓存正确清空
- **WHEN** isRunning 从 true 变为 false
- **THEN** useMemo 返回空增量，frozenBlocksRef 被清空，组件走 fullHtml 完整渲染路径

#### Scenario: 内容缩短时缓存重置
- **WHEN** 流式期间 content 长度缩短（编辑回退/重新生成）
- **THEN** useMemo 检测到 splitPoint < prevSplitPointRef，重置 prevSplitPointRef 为 0，frozenBlocksRef 清空，从当前内容重新开始累积

#### Scenario: 重渲染时不重复追加冻结块（幂等性保证）
- **WHEN** 父组件因无关状态变化触发重渲染，且 content 和 isRunning 未变化
- **THEN** useMemo 返回缓存结果，`lastAppendedStartRef` 检测 activeStart 未变化，跳过追加，frozenBlocksRef 内容不变

### Requirement: 冻结块 append-only 缓存
StreamingContent SHALL 使用 append-only 数组管理冻结块的 HTML 缓存。已缓存冻结块的 HTML 字符串 SHALL NOT 在后续渲染中被修改。

#### Scenario: 新冻结块追加到缓存
- **WHEN** 新的安全分割点出现且大于上次记录的分割位置
- **THEN** 仅提取新冻结的内容片段，生成 HTML 并追加到缓存数组末尾，不影响已有条目

#### Scenario: 消息切换时缓存重置
- **WHEN** 父组件的 React `key` 发生变化导致 StreamingContent 实例重新挂载
- **THEN** 冻结块缓存和分割点记录 SHALL 被清空（通过组件卸载/挂载自然实现）

#### Scenario: 内容缩短时缓存重置
- **WHEN** 当前安全分割点小于上次记录的分割位置
- **THEN** 冻结块缓存和分割点记录 SHALL 被清空并重新构建

### Requirement: 流式结束全量校正
StreamingContent SHALL 在 `isRunning` 变为 `false` 时，对完整内容执行一次 `generateCleanHtml` 渲染，替换所有冻结块和活跃块。

#### Scenario: 流式结束触发最终渲染
- **WHEN** `isRunning` 从 `true` 变为 `false`
- **THEN** 清除冻结块缓存，使用 `generateCleanHtml(完整内容)` 生成单个 div 渲染

#### Scenario: 非流式消息直接全量渲染
- **WHEN** `isRunning` 为 `false`
- **THEN** 直接使用 `generateCleanHtml(content)` 渲染，不执行分割逻辑

### Requirement: 与代码块异步高亮兼容
StreamingContent 的冻结/活跃分割 SHALL NOT 影响现有的代码块异步高亮机制（`updateCodeBlockDOM`）。

#### Scenario: 冻结块中的代码块被异步高亮
- **WHEN** 冻结块包含代码块且对应语言异步加载完成
- **THEN** `updateCodeBlockDOM` 通过全局 `document.querySelectorAll` SHALL 能定位到该代码块并更新其 `innerHTML`

### Requirement: 与复制按钮兼容
StreamingContent 的冻结/活跃分割 SHALL NOT 影响现有的代码块复制按钮机制。

#### Scenario: 冻结块中的复制按钮可点击
- **WHEN** 用户点击冻结块中代码块的复制按钮
- **THEN** 全局事件委托 SHALL 正确处理点击并复制代码内容
