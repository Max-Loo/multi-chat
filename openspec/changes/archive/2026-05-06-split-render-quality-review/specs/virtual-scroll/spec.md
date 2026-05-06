## MODIFIED Requirements

### Requirement: messagePairs 仅依赖历史消息列表
Detail 组件中 `messagePairs` 的 useMemo 依赖 SHALL 从 `displayList` 改为 `historyList`。消息配对关系仅由历史消息决定，流式追加的临时消息不改变已有配对。

#### Scenario: 流式期间配对关系保持稳定
- **WHEN** 流式 token 持续到达导致 displayList 重建
- **THEN** messagePairs 保持不变（因为 historyList 未变），ChatBubble 的 memo 保护生效

#### Scenario: 历史消息变化时配对关系更新
- **WHEN** 新消息完成流式生成并写入 historyList
- **THEN** messagePairs 重新计算包含新消息的配对关系

### Requirement: historyCallbacks 依赖改为 historyList
Detail 组件中 `historyCallbacks` 的 useMemo SHALL 依赖 `historyList` 而非 `messagePairs`，内部通过 `messagePairsRef` 读取最新配对数据。historyList 变化时重建回调（覆盖新消息 ID），流式期间 historyList 不变则回调引用稳定。

#### Scenario: 流式期间回调引用保持稳定
- **WHEN** 流式 token 到达导致 displayList 和 messagePairs 重建
- **THEN** historyCallbacks 中的回调函数引用不变（因为 historyList 未变），通过 ref 读取最新的 messagePairs

#### Scenario: 新消息加入后回调正确更新
- **WHEN** 新消息完成流式生成并写入 historyList
- **THEN** historyCallbacks 重建，新消息 ID 有对应的回调条目，配对同步功能正常

### Requirement: handleCopy 使用 Map 查找消除 historyList 依赖
Detail 组件中 `handleCopy` 回调 SHALL 通过预计算的 `Map<string, StandardMessage>` 查找消息，而非 `historyList.find()`，消除对整个 historyList 的依赖。

#### Scenario: handleCopy 在流式期间引用稳定
- **WHEN** 流式 token 到达
- **THEN** handleCopy 的 useCallback 依赖不包含 historyList，引用保持稳定

#### Scenario: handleCopy 正确复制消息内容
- **WHEN** 用户点击复制按钮
- **THEN** 通过 Map.get(messageId) 找到对应消息并复制 getCurrentContent(message.content)
