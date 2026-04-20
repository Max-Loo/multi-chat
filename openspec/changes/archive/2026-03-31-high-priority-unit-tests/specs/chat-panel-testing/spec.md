## ADDED Requirements

### Requirement: Grid 组件测试覆盖

Grid 组件的测试 SHALL 验证以下行为：

- 根据 board 数据渲染正确行列数的面板
- 应用正确的边框样式（右侧边框、底部边框）

#### Scenario: 多行多列渲染

- **WHEN** board 为 2 行 3 列的 ChatModel 数组
- **THEN** SHALL 渲染 2 行，每行 3 个 Detail 组件，并应用正确的边框样式

### Requirement: Splitter 组件测试覆盖

Splitter 组件的测试 SHALL 验证以下行为：

- 渲染正确数量的 ResizablePanel 和 ResizableHandle
- 根据 board 数据计算 defaultSize

#### Scenario: 面板尺寸分配

- **WHEN** board 为 2 行 2 列
- **THEN** 每行 defaultSize SHALL 为 50，每列 defaultSize SHALL 为 50

### Requirement: PanelSkeleton 组件测试覆盖

PanelSkeleton 组件的测试 SHALL 验证以下行为：

- 渲染 Header 骨架
- 根据 columnCount 渲染对应数量的列
- 骨架消息气泡交替对齐

#### Scenario: 多列骨架渲染

- **WHEN** columnCount=2
- **THEN** SHALL 渲染 2 列骨架面板

### Requirement: Detail 滚动行为测试补充

Detail 组件的测试 SHALL 补充验证以下现有测试未覆盖的行为：

- 内容超出容器时显示"滚动到底部"按钮
- 滚动到底部后隐藏该按钮
- ResizeObserver 触发滚动状态重新检测

#### Scenario: 滚动到底部按钮显示

- **WHEN** 内容超出容器高度且用户向上滚动
- **THEN** SHALL 显示"滚动到底部"按钮

#### Scenario: 滚动到底部后按钮隐藏

- **WHEN** 用户点击"滚动到底部"按钮
- **THEN** SHALL 滚动到底部并隐藏该按钮

### Requirement: RunningBubble 组件测试覆盖

RunningBubble 组件的测试 SHALL 验证以下行为：

- 未发送时返回空内容
- 无 chatData 时返回空内容
- 历史为空时显示 spinner
- 有内容时渲染 ChatBubble

#### Scenario: 非发送状态

- **WHEN** isSending 为 false
- **THEN** SHALL 不渲染任何可见内容

#### Scenario: 有运行内容

- **WHEN** isSending 为 true 且有运行内容
- **THEN** SHALL 渲染 ChatBubble 组件

#### Scenario: 等待首字

- **WHEN** isSending 为 true 但历史为空
- **THEN** SHALL 显示 spinner 加载指示器

### Requirement: Title 组件测试覆盖

Title 组件的测试 SHALL 验证以下行为：

- 从 Redux store 查找模型信息
- 模型不存在时显示 destructive 状态
- 显示昵称+模型名称（格式：`nickname (modelName)`）
- 已删除/已禁用模型显示对应状态 Badge
- Tooltip 显示完整模型信息

#### Scenario: 模型存在且有昵称

- **WHEN** 模型存在于 store 且有 nickname
- **THEN** SHALL 显示 "nickname (modelName)" 格式

#### Scenario: 模型不存在

- **WHEN** 模型 ID 在 store 中找不到
- **THEN** SHALL 显示 destructive 颜色的 Badge

#### Scenario: 已禁用模型

- **WHEN** 模型存在但 status 为 disabled
- **THEN** SHALL 显示 secondary 颜色的 Badge
