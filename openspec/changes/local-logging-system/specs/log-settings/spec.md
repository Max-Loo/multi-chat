# log-settings 规格说明

日志设置能力，包括级别配置、清除日志等用户可配置项。

## ADDED Requirements

### Requirement: 日志设置入口

系统 SHALL 在设置页面提供日志管理入口。

#### Scenario: 访问日志设置
- **WHEN** 用户进入设置页面
- **THEN** 系统 SHALL 显示日志管理区域

### Requirement: 显示日志状态

系统 SHALL 显示当前日志存储状态。

#### Scenario: 显示日志大小
- **WHEN** 用户查看日志设置
- **THEN** 系统 SHALL 显示当前日志占用的存储空间

#### Scenario: 显示保留策略
- **WHEN** 用户查看日志设置
- **THEN** 系统 SHALL 显示日志保留天数（30 天）

### Requirement: 清除日志

系统 SHALL 允许用户手动清除所有日志。

#### Scenario: 清除确认
- **WHEN** 用户点击"清除日志"按钮
- **THEN** 系统 SHALL 显示确认对话框，提示此操作不可撤销

#### Scenario: 确认清除
- **WHEN** 用户确认清除日志
- **THEN** 系统 SHALL 删除所有日志文件并更新存储空间显示

#### Scenario: 取消清除
- **WHEN** 用户取消清除操作
- **THEN** 系统 SHALL 保留所有日志，不做任何更改

### Requirement: 清除结果反馈

系统 SHALL 在清除完成后提供反馈。

#### Scenario: 清除成功
- **WHEN** 日志清除成功
- **THEN** 系统 SHALL 显示成功提示

#### Scenario: 清除失败
- **WHEN** 日志清除失败
- **THEN** 系统 SHALL 显示错误提示，说明失败原因
