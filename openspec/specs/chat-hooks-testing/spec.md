## ADDED Requirements

### Requirement: useBoard 二维数组布局
系统 SHALL 将 chatModelList 按 columnCount 切分为二维数组，并判断是否使用 Splitter 布局。

#### Scenario: 正常切分模型列表
- **WHEN** chatModelList 有 5 个模型，columnCount=2
- **THEN** board 为 [[model1, model2], [model3, model4], [model5]]

#### Scenario: 空模型列表
- **WHEN** chatModelList 为空数组
- **THEN** board 为空数组 []，shouldUseSplitter 为 false

#### Scenario: 模型数量等于 columnCount
- **WHEN** chatModelList 有 2 个模型，columnCount=2
- **THEN** board 为 [[model1, model2]]，shouldUseSplitter 取决于 isSplitter 和模型数量

#### Scenario: Splitter 布局判断
- **WHEN** isSplitter=true 且 chatModelList.length > 1
- **THEN** shouldUseSplitter 为 true
- **WHEN** isSplitter=false 或 chatModelList.length <= 1
- **THEN** shouldUseSplitter 为 false

### Requirement: useIsSending 发送状态汇总
系统 SHALL 汇总当前选中聊天所有窗口的发送状态。

#### Scenario: 无选中聊天时返回 false
- **WHEN** selectedChat 为 null
- **THEN** isSending 为 false

#### Scenario: 选中聊天无运行数据时返回 false
- **WHEN** selectedChat 存在但 runningChat 中无对应记录
- **THEN** isSending 为 false

#### Scenario: 任一窗口正在发送时返回 true
- **WHEN** runningChat 中有窗口的 isSending=true
- **THEN** isSending 为 true

#### Scenario: 所有窗口均未发送时返回 false
- **WHEN** runningChat 中所有窗口的 isSending=false
- **THEN** isSending 为 false

### Requirement: useSelectedChat 选中聊天规范化
系统 SHALL 规范化当前选中聊天数据，统一返回 null 而非 undefined。

#### Scenario: 有选中聊天时返回聊天数据
- **WHEN** useCurrentSelectedChat 返回有效 Chat 对象
- **THEN** selectedChat 为该 Chat 对象，chatModelList 为 chatModelList 数组

#### Scenario: 无选中聊天时返回 null 和空数组
- **WHEN** useCurrentSelectedChat 返回 undefined
- **THEN** selectedChat 为 null，chatModelList 为 []

#### Scenario: 聊天无 chatModelList 时返回空数组
- **WHEN** selectedChat 存在但 chatModelList 为 undefined
- **THEN** chatModelList 为 []
