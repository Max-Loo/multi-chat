## Purpose

聊天数据导出功能，支持导出活跃聊天和已删除聊天为 JSON 格式文件。

## Requirements

### Requirement: 导出聊天数据
系统 SHALL 提供聊天数据导出功能，支持导出活跃聊天和已删除聊天。

#### Scenario: 导出所有活跃聊天
- **WHEN** 用户触发导出功能
- **THEN** 系统 SHALL 从存储读取所有 `isDeleted` 不为 `true` 的聊天完整数据
- **AND** 系统 SHALL 将数据序列化为可读格式（JSON）
- **AND** 系统 SHALL 提供文件保存对话框供用户选择保存位置

#### Scenario: 导出已删除聊天
- **WHEN** 用户在导出界面选择包含已删除聊天
- **THEN** 系统 SHALL 从存储读取所有 `isDeleted: true` 的聊天数据
- **AND** 系统 SHALL 将已删除聊天与活跃聊天合并导出
- **AND** 系统 SHALL 在导出数据中保留 `isDeleted` 标记以区分状态

#### Scenario: 无已删除聊天可导出
- **WHEN** 用户选择导出已删除聊天
- **AND** 存储中不存在 `isDeleted: true` 的聊天
- **THEN** 系统 SHALL 提示用户没有可导出的已删除聊天
- **AND** 系统 SHALL 仅导出活跃聊天

### Requirement: 导出数据格式
导出的数据 SHALL 使用 JSON 格式，结构为 `{ chats: Chat[], exportedAt: string, version: string }`。

#### Scenario: 导出文件结构
- **WHEN** 用户完成导出
- **THEN** 导出文件 SHALL 是合法的 JSON
- **AND** `chats` 字段 SHALL 包含所有导出的 Chat 对象
- **AND** `exportedAt` 字段 SHALL 为 ISO 8601 格式的导出时间
- **AND** `version` 字段 SHALL 为应用版本号
