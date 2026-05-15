## ADDED Requirements

### Requirement: useAutoResizeTextarea 覆盖 maxHeight 超出行为

测试 SHALL 验证当 textarea 内容超过 maxHeight 时，`isScrollable` 状态变为 true。

#### Scenario: 内容超出 maxHeight 时 isScrollable 为 true

- **WHEN** textarea 的 `scrollHeight` 超过 `maxHeight` 参数值
- **THEN** hook 返回的 `isScrollable` SHALL 为 true

### Requirement: useAutoResizeTextarea 覆盖高度回缩行为

测试 SHALL 验证当 textarea 值从多行变为单行时，高度正确回缩。

#### Scenario: 多行变单行时高度回缩

- **WHEN** textarea 值从多行文本变为单行文本
- **THEN** textarea 的高度 SHALL 回缩到 minHeight 或内容实际高度

### Requirement: useAutoResizeTextarea 覆盖动态参数变化

测试 SHALL 验证动态改变 minHeight/maxHeight 参数时行为正确。

#### Scenario: 动态改变 maxHeight

- **WHEN** `maxHeight` 参数从 240 变为 120
- **THEN** hook SHALL 根据新的 maxHeight 重新计算 isScrollable 状态
