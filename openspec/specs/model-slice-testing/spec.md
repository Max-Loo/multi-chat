# Model Slice Testing Specification

## ADDED Requirements

### Requirement: 模型列表初始化测试
测试系统 SHALL 验证 `initializeModels` async thunk 能正确从存储加载模型列表并更新 Redux store 状态。

#### Scenario: 成功初始化模型列表
- **WHEN** 调用 `initializeModels.fulfilled` action 并传入模型列表数据
- **THEN** 系统 SHALL 将模型列表更新到 store.state.models.models
- **THEN** 系统 SHALL 将 loading 状态设置为 false
- **THEN** 系统 SHALL 将 initializationError 设置为 null

#### Scenario: 初始化失败
- **WHEN** 调用 `initializeModels.rejected` action
- **THEN** 系统 SHALL 将 loading 状态设置为 false
- **THEN** 系统 SHALL 设置 initializationError 为错误信息

#### Scenario: 初始化开始
- **WHEN** 调用 `initializeModels.pending` action
- **THEN** 系统 SHALL 将 loading 状态设置为 true
- **THEN** 系统 SHALL 将 initializationError 设置为 null

### Requirement: 模型管理 reducers 测试
测试系统 SHALL 验证所有模型管理相关的 reducers 能正确更新 Redux store 状态。

#### Scenario: 创建新模型
- **WHEN** 调用 `createModel` action 并传入新模型对象
- **THEN** 系统 SHALL 将新模型添加到 models 数组末尾

#### Scenario: 编辑模型
- **WHEN** 调用 `editModel` action 并传入更新的模型对象
- **THEN** 系统 SHALL 在 models 数组中找到对应 ID 的模型
- **THEN** 系统 SHALL 用新模型对象替换旧模型对象（保持数组位置）

#### Scenario: 软删除模型
- **WHEN** 调用 `deleteModel` action 并传入要删除的模型对象
- **THEN** 系统 SHALL 在 models 数组中找到对应 ID 的模型
- **THEN** 系统 SHALL 将该模型的 isDeleted 字段设置为 true
- **THEN** 系统 SHALL 不从 models 数组中移除该模型

#### Scenario: 清除操作错误
- **WHEN** 调用 `clearError` action
- **THEN** 系统 SHALL 将 error 字段设置为 null

#### Scenario: 清除初始化错误
- **WHEN** 调用 `clearInitializationError` action
- **THEN** 系统 SHALL 将 initializationError 字段设置为 null

### Requirement: 软删除逻辑测试
测试系统 SHALL 验证模型的软删除逻辑能正确标记删除状态而不移除数据。

#### Scenario: 软删除不影响数组长度
- **WHEN** 执行模型软删除操作
- **THEN** models 数组的长度 SHALL 保持不变
- **THEN** 被删除的模型 SHALL 保留在数组中

#### Scenario: 软删除标记不可见
- **WHEN** 模型的 isDeleted 字段设置为 true
- **THEN** 该模型 SHALL 被过滤掉，不显示在 UI 中
- **THEN** 该模型 SHALL 不参与聊天发送等操作

### Requirement: 模型列表过滤测试
测试系统 SHALL 验证能够正确过滤出未删除的模型列表。

#### Scenario: 获取未删除的模型列表
- **WHEN** models 数组中包含已删除和未删除的模型
- **THEN** 系统 SHALL 只返回 isDeleted 为 false 的模型列表
- **THEN** 已删除的模型 SHALL 不出现在过滤后的列表中

### Requirement: 模型状态管理测试
测试系统 SHALL 验证模型状态管理的完整生命周期。

#### Scenario: 初始状态验证
- **WHEN** 创建 Redux store 时
- **THEN** models SHALL 为空数组
- **THEN** loading SHALL 为 false
- **THEN** error SHALL 为 null
- **THEN** initializationError SHALL 为 null

#### Scenario: 状态转换序列
- **WHEN** 按顺序调用 pending、fulfilled actions
- **THEN** loading 状态 SHALL 按正确顺序转换（true → false）
- **THEN** 数据 SHALL 正确加载到 store 中

### Requirement: 模型查找测试
测试系统 SHALL 验证能通过 ID 正确查找模型。

#### Scenario: 通过 ID 查找存在的模型
- **WHEN** 在 models 数组中查找存在的模型 ID
- **THEN** 系统 SHALL 返回对应的模型对象

#### Scenario: 通过 ID 查找不存在的模型
- **WHEN** 在 models 数组中查找不存在的模型 ID
- **THEN** 系统 SHALL 返回 undefined

#### Scenario: 查找已删除的模型
- **WHEN** 在 models 数组中查找 isDeleted 为 true 的模型
- **THEN** 系统 SHALL 仍能找到该模型（软删除不移除数据）

### Requirement: 错误处理测试
测试系统 SHALL 验证模型管理相关的错误处理机制。

#### Scenario: 存储加载失败
- **WHEN** `loadModelsFromJson` 抛出异常
- **THEN** 系统 SHALL 捕获异常并设置 initializationError
- **THEN** 错误信息 SHALL 包含失败原因

#### Scenario: 错误状态清理
- **WHEN** 操作失败后调用 clearError 或 clearInitializationError
- **THEN** 对应的错误字段 SHALL 被重置为 null
