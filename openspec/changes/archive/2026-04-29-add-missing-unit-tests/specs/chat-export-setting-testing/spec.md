## ADDED Requirements

### Requirement: 导出全部聊天成功路径测试

系统 SHALL 提供组件测试验证点击"导出全部"按钮后成功导出的完整流程。

#### Scenario: 导出全部聊天成功

- **WHEN** 用户点击"导出全部"按钮
- **AND** `exportAllChats` 成功返回聊天数据
- **THEN** 组件 SHALL 调用 `exportAllChats` 服务
- **AND** 触发文件下载（Blob + createObjectURL）
- **AND** 显示成功 toast 通知

### Requirement: 导出全部聊天失败路径测试

系统 SHALL 提供组件测试验证导出失败时的错误处理。

#### Scenario: 导出全部聊天失败

- **WHEN** 用户点击"导出全部"按钮
- **AND** `exportAllChats` 抛出异常
- **THEN** 组件 SHALL 显示错误 toast 通知
- **AND** loading 状态 SHALL 恢复为 `false`

### Requirement: 导出已删除聊天路径测试

系统 SHALL 提供组件测试验证导出已删除聊天的三种场景。

#### Scenario: 导出已删除聊天成功

- **WHEN** 用户点击"导出已删除"按钮
- **AND** `exportDeletedChats` 返回包含聊天数据的响应
- **THEN** 组件 SHALL 触发文件下载
- **AND** 显示成功 toast 通知

#### Scenario: 导出已删除聊天为空

- **WHEN** 用户点击"导出已删除"按钮
- **AND** `exportDeletedChats` 返回空数组
- **THEN** 组件 SHALL 显示"无已删除聊天"的 info toast
- **AND** 不触发文件下载

#### Scenario: 导出已删除聊天失败

- **WHEN** 用户点击"导出已删除"按钮
- **AND** `exportDeletedChats` 抛出异常
- **THEN** 组件 SHALL 显示错误 toast 通知
- **AND** loading 状态 SHALL 恢复为 `false`

### Requirement: Loading 状态测试

系统 SHALL 提供组件测试验证导出过程中按钮的 loading 状态。

#### Scenario: 导出过程中按钮显示 loading

- **WHEN** 导出请求正在进行中
- **THEN** 两个导出按钮 SHALL 同时处于 disabled 状态
- **AND** 导出完成后按钮 SHALL 恢复可用

### Requirement: 测试隔离策略

ChatExportSetting 组件测试 SHALL mock `exportAllChats`、`exportDeletedChats` 服务函数和 `toastQueue`，避免依赖真实存储和网络。

#### Scenario: Mock 外部依赖

- **WHEN** 测试文件初始化
- **THEN** SHALL mock `@/services/chatExport` 的导出函数
- **AND** SHALL mock `@/services/toast` 的 `toastQueue`
