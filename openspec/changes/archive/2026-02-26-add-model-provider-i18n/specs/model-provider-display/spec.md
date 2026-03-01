# Model Provider Display - 国际化增量规范

本文档是对 `openspec/specs/model-provider-display/spec.md` 的增量修改，添加国际化支持要求。

## MODIFIED Requirements

### Requirement: 显示供应商状态
系统 SHALL 为每个模型供应商显示其当前可用状态。

#### Scenario: 显示可用状态
- **WHEN** 供应商数据成功加载
- **THEN** 系统显示"可用"状态标识（绿色徽章）
- **AND** 状态标签文本使用当前语言（中文："可用"，英文："Available"）
- **AND** 显示支持的模型数量，数量统计文本使用当前语言

#### Scenario: 显示不可用状态
- **WHEN** 供应商数据加载失败或超时
- **THEN** 系统显示"不可用"状态标识（红色徽章）
- **AND** 状态标签文本使用当前语言（中文："不可用"，英文："Unavailable"）
- **AND** 显示错误原因，错误原因文本使用当前语言

### Requirement: 显示全局刷新控制
系统 SHALL 提供全局刷新按钮以重新获取所有供应商数据。

#### Scenario: 点击刷新按钮
- **WHEN** 用户点击刷新按钮
- **THEN** 系统发起网络请求获取最新数据
- **AND** 刷新按钮显示加载动画，按钮文本使用当前语言（中文："刷新中..."，英文："Refreshing..."）
- **AND** 刷新期间禁用按钮防止重复点击

#### Scenario: 刷新成功
- **WHEN** 刷新请求成功完成
- **THEN** 系统更新供应商列表显示
- **AND** 显示成功提示 Toast，消息文本使用当前语言
- **AND** 更新"最后更新时间"显示，标签文本使用当前语言

#### Scenario: 刷新失败
- **WHEN** 刷新请求失败
- **THEN** 系统显示错误提示 Toast，消息文本使用当前语言
- **AND** 保持之前加载的数据显示（如果有）
- **AND** 在错误区域显示详细错误信息，所有文本使用当前语言

### Requirement: 显示最后更新时间
系统 SHALL 显示供应商数据的最后更新时间。

#### Scenario: 显示更新时间
- **WHEN** 供应商数据加载完成
- **THEN** 系统显示最后更新时间
- **AND** 时间格式根据当前语言动态调整（中文使用 zh-CN locale，英文使用 en-US locale）
- **AND** "最后更新"标签文本使用当前语言（中文："最后更新"，英文："Last Update"）

## ADDED Requirements

### Requirement: 模型数量统计国际化
系统 SHALL 根据当前语言显示模型数量统计文本。

#### Scenario: 显示模型总数
- **WHEN** 供应商卡片展示时
- **THEN** 系统显示该供应商支持的模型总数
- **AND** 统计文本使用当前语言（中文："共 {{count}} 个模型"，英文："{{count}} models"）

#### Scenario: 显示搜索结果数量
- **WHEN** 用户在搜索框中输入关键词
- **THEN** 系统显示匹配的模型数量
- **AND** 结果文本使用当前语言（中文："找到 {{count}} 个模型"，英文："Found {{count}} models"）

### Requirement: 搜索功能国际化
系统 SHALL 提供国际化的搜索界面。

#### Scenario: 显示搜索框
- **WHEN** 用户展开供应商卡片详情
- **THEN** 系统显示搜索输入框
- **AND** 搜索框占位符文本使用当前语言（中文："搜索模型名称或 ID..."，英文："Search model name or ID..."）

#### Scenario: 显示搜索结果统计
- **WHEN** 搜索框有内容时
- **THEN** 系统显示搜索结果数量统计
- **AND** 统计文本使用当前语言和正确的数量插值

### Requirement: 供应商元数据国际化
系统 SHALL 使用当前语言显示供应商元数据标签。

#### Scenario: 显示 API 端点信息
- **WHEN** 用户查看供应商详情
- **THEN** 系统显示 API 端点地址
- **AND** "API 端点"标签文本使用当前语言（中文："API 端点:"，英文:"API Endpoint:"）

#### Scenario: 显示供应商 ID 信息
- **WHEN** 用户查看供应商详情
- **THEN** 系统显示供应商唯一标识符
- **AND** "供应商 ID"标签文本使用当前语言（中文："供应商 ID:"，英文:"Provider ID:"）

#### Scenario: 显示文档链接按钮
- **WHEN** 用户查看供应商详情
- **THEN** 系统显示查看文档的链接按钮
- **AND** 按钮文本使用当前语言（中文："查看文档"，英文:"View Docs"）

### Requirement: 供应商卡片交互提示国际化
系统 SHALL 使用当前语言显示用户交互提示。

#### Scenario: 显示点击提示
- **WHEN** 供应商卡片处于折叠状态
- **THEN** 系统显示提示用户点击展开的文本
- **AND** 提示文本使用当前语言（中文："点击查看详情"，英文："Click to view details"）

### Requirement: 错误消息国际化
系统 SHALL 使用当前语言显示所有错误消息。

#### Scenario: 显示刷新失败错误
- **WHEN** 刷新操作失败
- **THEN** 系统在错误提示区域显示错误信息
- **AND** 错误前缀文本使用当前语言（中文："刷新失败:"，英文："Refresh failed:"）
- **AND** 具体错误原因根据错误类型使用对应的当前语言翻译
