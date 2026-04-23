## MODIFIED Requirements

### Requirement: ChatPanel 组件渲染
系统 SHALL 能够正确渲染 ChatPanel 组件，并根据聊天模型列表动态生成聊天面板布局。测试 SHALL 使用语义化查询定位元素，SHALL NOT 使用条件守卫静默跳过断言。

#### Scenario: 单模型聊天面板渲染
- **WHEN** 选中的聊天包含 1 个模型
- **THEN** 系统应显示单个聊天面板
- **AND** 面板应包含头部、内容区域和发送框

#### Scenario: 多模型聊天面板网格布局
- **WHEN** 选中的聊天包含 3 个模型
- **THEN** 系统应按网格布局显示 3 个聊天面板
- **AND** 面板应按照 columnCount 参数排列

#### Scenario: 可调整大小的面板布局
- **WHEN** 用户启用 isSplitter 模式且聊天包含多个模型
- **THEN** 系统应显示可拖动调整大小的面板
- **AND** 面板应支持水平和垂直方向调整

#### Scenario: 分割模式下显示不同布局
- **WHEN** 启用分割模式
- **THEN** 测试 SHALL 使用 `getByRole('switch')` 定位开关并断言其存在
- **AND** MUST NOT 使用 `if (splitterSwitch)` 守卫包裹交互逻辑

#### Scenario: 切换聊天时重置分割模式
- **WHEN** 在分割模式下切换到不同聊天
- **THEN** 测试 SHALL 先用 `expect(element).toBeInTheDocument()` 确认开关存在
- **AND** 再执行点击交互，MUST NOT 使用条件守卫静默跳过

## ADDED Requirements

### Requirement: 发送失败时保持输入框内容
系统 SHALL 在消息发送失败时保留输入框中的文本内容，MUST NOT 清空输入框。

#### Scenario: 发送失败保留输入
- **WHEN** 用户在输入框输入文本并点击发送按钮
- **AND** `startSendChatMessage` action 以 rejected 状态完成
- **THEN** 输入框 SHALL 保留用户输入的文本
- **AND** MUST NOT 清空输入框内容
