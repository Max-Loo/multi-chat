## MODIFIED Requirements

### Requirement: 冻结块计算使用 useMemo 替代渲染阶段 refs 副作用
StreamingContent 组件 SHALL 使用 useMemo 计算增量冻结块，通过 `prevSplitPointRef` 记录上一次分割点位置。useMemo 内只对新增部分调用 `generateCleanHtml`，保持 append-only 性能优势。持久冻结块列表通过 `frozenBlocksRef` 在渲染阶段追加 useMemo 返回的增量块。不在渲染路径中产生修改 prevSplitPointRef 的副作用。

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
