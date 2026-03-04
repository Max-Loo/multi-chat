# 模型管理 UI 组件测试规格

## Purpose

定义模型管理 UI 组件的测试要求，包括 ModelSidebar、ProviderCardDetails 和 ModelSearch 组件的功能验证。

## Requirements

### Requirement: ModelSidebar 组件必须验证供应商列表渲染
ModelSidebar 组件必须从 Redux store 读取供应商列表并正确渲染。

#### Scenario: 渲染供应商列表
- **WHEN** 渲染 ModelSidebar 组件
- **AND** Redux store 包含 3 个供应商（DeepSeek、OpenAI、Kimi）
- **THEN** 必须渲染所有 3 个供应商的名称
- **THEN** 必须为每个供应商调用 onProviderClick 回调

#### Scenario: 渲染空供应商列表
- **WHEN** 渲染 ModelSidebar 组件
- **AND** Redux store 的供应商列表为空
- **THEN** 必须显示空状态提示
- **THEN** 不应渲染任何供应商项

#### Scenario: 渲染带选中状态的供应商列表
- **WHEN** 渲染 ModelSidebar 组件
- **AND** selectedProviderId prop 为 'deepseek'
- **THEN** DeepSeek 供应商必须显示选中样式
- **THEN** 其他供应商不应显示选中样式

### Requirement: ModelSidebar 组件必须验证文本搜索过滤功能
ModelSidebar 组件必须提供搜索框，允许用户通过文本过滤供应商列表。

#### Scenario: 通过搜索过滤供应商
- **WHEN** 用户在搜索框输入 "deep"
- **AND** 供应商列表包含 "DeepSeek"、"OpenAI"、"Kimi"
- **THEN** 必须仅显示 "DeepSeek"
- **THEN** 不应显示 "OpenAI" 和 "Kimi"

#### Scenario: 搜索大小写不敏感
- **WHEN** 用户在搜索框输入 "DEEP"
- **AND** 供应商列表包含 "DeepSeek"
- **THEN** 必须显示 "DeepSeek"

#### Scenario: 清空搜索显示所有供应商
- **WHEN** 用户在搜索框输入 "deep"
- **AND** 然后清空搜索框
- **THEN** 必须显示所有供应商
- **THEN** 过滤状态必须重置

#### Scenario: 搜索无匹配结果
- **WHEN** 用户在搜索框输入 "xyz"
- **AND** 没有供应商名称包含 "xyz"
- **THEN** 必须显示无结果提示
- **THEN** 不应渲染任何供应商项

### Requirement: ModelSidebar 组件必须验证选中状态切换
ModelSidebar 组件必须正确处理供应商的选中状态，并触发相应的回调。

#### Scenario: 点击供应商切换选中状态
- **WHEN** 用户点击 "DeepSeek" 供应商
- **THEN** 必须调用 onProviderSelect 回调
- **THEN** 回调参数必须为 'deepseek'（供应商 ID）

#### Scenario: 点击已选中供应商保持选中
- **WHEN** 用户再次点击已选中的 "DeepSeek" 供应商
- **THEN** 必须调用 onProviderSelect 回调
- **THEN** 组件不应阻止重复选择

### Requirement: ModelSidebar 组件必须验证返回按钮导航
ModelSidebar 组件必须提供返回按钮，允许用户返回上一级页面。

#### Scenario: 点击返回按钮触发导航
- **WHEN** 用户点击返回按钮
- **THEN** 必须调用 onBack 回调
- **THEN** 不应触发其他回调

#### Scenario: 返回按钮必须显示正确的图标
- **WHEN** 渲染 ModelSidebar 组件
- **THEN** 返回按钮必须包含箭头图标
- **THEN** 图标方向必须指向左侧

### Requirement: ModelSidebar 组件必须验证 Redux 连接
ModelSidebar 组件必须正确连接到 Redux store，并使用 useSelector 读取供应商数据。

#### Scenario: 组件必须从 Redux store 读取供应商列表
- **WHEN** Redux store 的 modelProvider 状态更新
- **THEN** 组件必须重新渲染以反映新的供应商列表
- **THEN** 不应保留旧的供应商数据

#### Scenario: 组件必须响应 Redux store 变化
- **WHEN** Redux store 添加新的供应商
- **THEN** 组件必须渲染新增的供应商
- **THEN** 必须更新供应商总数显示

### Requirement: ProviderCardDetails 组件必须验证搜索过滤逻辑
ProviderCardDetails 组件必须根据用户输入过滤模型列表。

#### Scenario: 通过搜索过滤模型
- **WHEN** 用户在搜索框输入 "chat"
- **AND** 模型列表包含 "deepseek-chat"、"deepseek-coder"、"gpt-4"
- **THEN** 必须仅显示包含 "chat" 的模型
- **THEN** 不应显示 "deepseek-coder" 和 "gpt-4"

#### Scenario: 搜索空字符串显示所有模型
- **WHEN** 用户清空搜索框
- **THEN** 必须显示所有模型
- **THEN** 过滤条件必须重置

### Requirement: ProviderCardDetails 组件必须验证防抖功能
ProviderCardDetails 组件必须对搜索输入应用 300ms 防抖，避免频繁触发过滤。

#### Scenario: 快速连续输入仅在停止后触发过滤
- **WHEN** 用户在 100ms 内连续输入 3 个字符
- **THEN** 不应在每次输入时触发过滤
- **THEN** 应在最后一次输入后 300ms 触发一次过滤

#### Scenario: 防抖期间更新输入框值
- **WHEN** 用户输入搜索文本
- **THEN** 输入框必须立即显示输入值
- **THEN** 过滤结果应在防抖延迟后更新

#### Scenario: 防抖计时器重置
- **WHEN** 用户输入 "d"
- **AND** 在 200ms 后输入 "e"
- **AND** 在 200ms 后输入 "e"
- **THEN** 防抖计时器必须在每次输入时重置
- **THEN** 过滤应在最后一次输入后 300ms 触发

### Requirement: ProviderCardDetails 组件必须验证模型列表渲染
ProviderCardDetails 组件必须正确渲染过滤后的模型列表。

#### Scenario: 渲染模型列表
- **WHEN** 渲染 ProviderCardDetails 组件
- **AND** props 包含 5 个模型
- **THEN** 必须渲染所有 5 个模型
- **THEN** 每个模型必须显示模型名称

#### Scenario: 渲染空模型列表
- **WHEN** 渲染 ProviderCardDetails 组件
- **AND** props 的模型列表为空
- **THEN** 必须显示空状态提示
- **THEN** 不应渲染任何模型项

#### Scenario: 过滤后显示结果数量
- **WHEN** 用户搜索过滤模型
- **AND** 过滤后有 3 个结果
- **THEN** 必须显示 "找到 3 个模型" 或类似文本
- **THEN** 不应显示未过滤的总数

### Requirement: ModelSearch 组件必须验证搜索框输入
ModelSearch 组件必须提供搜索框，并正确处理用户输入。

#### Scenario: 输入搜索文本
- **WHEN** 用户在搜索框输入 "test"
- **THEN** 搜索框必须显示 "test"
- **THEN** 必须调用 onSearchChange 回调，参数为 "test"

#### Scenario: 清空搜索框
- **WHEN** 用户清空搜索框
- **THEN** 搜索框必须为空
- **THEN** 必须调用 onSearchChange 回调，参数为 ""

#### Scenario: 搜索框必须有 placeholder 文本
- **WHEN** 渲染 ModelSearch 组件
- **THEN** 搜索框必须显示 placeholder（如 "搜索模型"）
- **THEN** placeholder 文本必须支持国际化

### Requirement: ModelSearch 组件必须验证结果统计显示
ModelSearch 组件必须显示搜索结果的统计信息。

#### Scenario: 显示搜索结果数量
- **WHEN** 搜索过滤后返回 5 个结果
- **THEN** 必须显示 "5 个结果" 或类似文本
- **THEN** 文本必须实时更新

#### Scenario: 无搜索结果时显示提示
- **WHEN** 搜索过滤后返回 0 个结果
- **THEN** 必须显示 "无结果" 或类似提示
- **THEN** 提示文本必须支持国际化

### Requirement: ModelSearch 组件必须验证事件冒泡阻止
ModelSearch 组件必须阻止搜索框的事件冒泡，避免触发父组件的事件。

#### Scenario: 点击搜索框不触发父组件事件
- **WHEN** 用户点击搜索框
- **THEN** 必须调用 event.stopPropagation()
- **THEN** 不应触发父组件的点击事件

#### Scenario: 输入文本不触发父组件事件
- **WHEN** 用户在搜索框输入文本
- **THEN** 不应触发父组件的输入事件
- **THEN** 搜索框应独占输入事件

### Requirement: ModelSearch 组件必须验证国际化文本
ModelSearch 组件的所有文本必须支持国际化。

#### Scenario: 搜索框 placeholder 支持国际化
- **WHEN** 应用语言为中文
- **THEN** placeholder 必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** placeholder 必须显示英文文本

#### Scenario: 结果统计文本支持国际化
- **WHEN** 应用语言为中文
- **THEN** 结果统计必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** 结果统计必须显示英文文本
