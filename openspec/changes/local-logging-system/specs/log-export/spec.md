# log-export 规格说明

日志导出能力，支持导出为 JSON 格式文件。

## ADDED Requirements

### Requirement: 导出日志

系统 SHALL 允许用户导出日志文件。

#### Scenario: 导出全部日志
- **WHEN** 用户点击"导出日志"按钮
- **THEN** 系统 SHALL 生成包含所有日志条目的 JSON 文件

#### Scenario: 导出文件命名
- **WHEN** 导出日志文件
- **THEN** 文件名 SHALL 使用格式 multi-chat-logs-YYYY-MM-DD.json

### Requirement: 导出格式

导出的日志 SHALL 为有效的 JSON 数组格式。

#### Scenario: JSON 数组格式
- **WHEN** 导出日志
- **THEN** 文件内容 SHALL 为 JSON 数组，每个元素是一条日志条目

#### Scenario: 按时间排序
- **WHEN** 导出日志
- **THEN** 日志条目 SHALL 按时间戳升序排列

### Requirement: 导出脱敏

导出的日志 SHALL 已完成敏感信息脱敏。

#### Scenario: 导出内容已脱敏
- **WHEN** 用户导出日志
- **THEN** 导出的日志内容 SHALL 与存储时脱敏后的内容一致

### Requirement: 导出反馈

系统 SHALL 在导出完成时提供用户反馈。

#### Scenario: 导出成功提示
- **WHEN** 日志导出成功
- **THEN** 系统 SHALL 显示成功提示并触发文件下载

#### Scenario: 导出失败提示
- **WHEN** 日志导出失败
- **THEN** 系统 SHALL 显示错误提示，说明失败原因

### Requirement: 无日志时的处理

系统 SHALL 在没有日志时提供明确提示。

#### Scenario: 无日志可导出
- **WHEN** 用户尝试导出但没有任何日志
- **THEN** 系统 SHALL 提示"暂无日志可导出"
