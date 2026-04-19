## MODIFIED Requirements

### Requirement: 消息列表自动滚到底部
消息列表 SHALL 在新消息到来时自动滚动到底部，保持现有的"自动跟随"行为。使用 `shouldStickToBottom` ref 跟踪用户滚动位置，流式更新时据此决定是否自动跟随。`scrollToBottom` 回调 SHALL 保持引用稳定（依赖数组为空），通过 ref 读取最新的消息列表长度，避免流式 effect 因回调引用变化而频繁 teardown/setup。

#### Scenario: 流式生成新消息时自动跟随
- **WHEN** AI 正在流式生成消息且用户已在底部位置（shouldStickToBottom 为 true）
- **THEN** 系统 SHALL 自动滚动到底部以展示最新内容，且 scrollToBottom 回调引用在整个流式过程中保持不变

#### Scenario: 流式 effect 不因回调重建而频繁触发
- **WHEN** AI 正在流式生成消息，runningChatData 持续更新
- **THEN** 流式自动跟随 effect SHALL NOT 因 scrollToBottom 回调重建而执行 cleanup/setup 循环

#### Scenario: 用户向上滚动时不强制跟随
- **WHEN** 用户已向上滚动离开底部位置（shouldStickToBottom 为 false）
- **THEN** 系统 SHALL NOT 强制滚动到底部，而是显示"回到底部"按钮

#### Scenario: 点击回到底部按钮
- **WHEN** 用户点击"回到底部"按钮
- **THEN** 系统 SHALL 滚动到消息列表底部并展示最新消息

### Requirement: 滚动条自适应显示
消息列表和对话列表 SHALL 保持现有的滚动条自适应行为：滚动时显示细滚动条，停止后隐藏。滚动状态更新（`needsScrollbar`、`isAtBottom`）SHALL 在值未发生变化时跳过 React 协调，使用 functional updater 模式进行变更检测。

#### Scenario: 滚动时显示滚动条
- **WHEN** 用户在消息列表或对话列表中滚动
- **THEN** 系统 SHALL 显示细滚动条样式

#### Scenario: 停止滚动后隐藏滚动条
- **WHEN** 用户停止滚动超过 500ms
- **THEN** 系统 SHALL 隐藏滚动条

#### Scenario: 滚动位置未变化时不触发协调
- **WHEN** 用户在底部位置轻微滚动或触摸板误触发微幅滚动
- **THEN** 系统 SHALL NOT 因 needsScrollbar 或 isAtBottom 值未变而触发无意义的 React 重渲染

## REMOVED Requirements

（无移除的需求）
