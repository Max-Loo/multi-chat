## Purpose

验证 `ProviderHeader` 组件的日期格式化（中英文 locale）、loading 状态显示、刷新按钮交互以及无更新时间时的隐藏行为。

## Requirements

### Requirement: ProviderHeader 中文环境下格式化日期

当 `i18n.language` 为 `'zh'` 时，`formatLastUpdate` SHALL 使用 `zh-CN` locale 格式化 ISO 8601 日期字符串。

#### Scenario: 中文 locale 日期格式化
- **WHEN** `i18n.language` 为 `'zh'`，`lastUpdate` 为 `'2025-01-15T08:30:45.000Z'`
- **THEN** 格式化结果 SHALL 包含 `2025`、`01`、`15`、`30`、`45`（不包含时区相关的小时值，避免本地时区差异导致测试失败）

### Requirement: ProviderHeader 英文环境下格式化日期

当 `i18n.language` 为 `'en'` 时，`formatLastUpdate` SHALL 使用 `en-US` locale 格式化 ISO 8601 日期字符串。

> **注意**：现有 `mockI18n` 工厂硬编码 `language: 'zh'`，英文 locale 测试需直接 `vi.mock('react-i18next')` 并在返回对象中设置 `i18n: { language: 'en' }`。

#### Scenario: 英文 locale 日期格式化
- **WHEN** `i18n.language` 为 `'en'`，`lastUpdate` 为 `'2025-01-15T08:30:45.000Z'`
- **THEN** 格式化结果 SHALL 包含 `2025`、`01`、`15`、`30`、`45`
- **AND** 格式化结果 SHALL 与中文 locale 的格式化结果不同（验证 locale 切换生效）

### Requirement: ProviderHeader loading 状态下刷新按钮显示加载文本

当 `loading` 为 `true` 时，刷新按钮 SHALL 显示加载中文本（"refreshing" key）且图标包含 `animate-spin` 类。

#### Scenario: 加载状态
- **WHEN** `loading` 为 `true`
- **THEN** 刷新按钮 SHALL 显示加载中文本，RefreshCw 图标 SHALL 包含 `animate-spin` 类

#### Scenario: 非加载状态
- **WHEN** `loading` 为 `false`
- **THEN** 刷新按钮 SHALL 显示刷新文本，RefreshCw 图标 SHALL NOT 包含 `animate-spin` 类

### Requirement: ProviderHeader 点击刷新按钮触发 onRefresh

用户点击刷新按钮时 SHALL 调用 `onRefresh` 回调。

#### Scenario: 点击刷新
- **WHEN** 用户点击刷新按钮
- **THEN** SHALL 调用 `onRefresh`

### Requirement: ProviderHeader loading 时刷新按钮禁用

当 `loading` 为 `true` 时，刷新按钮 SHALL 处于 `disabled` 状态。

#### Scenario: 加载时按钮禁用
- **WHEN** `loading` 为 `true`
- **THEN** 刷新按钮 SHALL 具有disabled 属性

### Requirement: ProviderHeader 无 lastUpdate 时不显示更新时间

当 `lastUpdate` 为 `null` 时，组件 SHALL NOT 渲染更新时间文本。

#### Scenario: 无最后更新时间
- **WHEN** `lastUpdate` 为 `null`
- **THEN** DOM 中 SHALL NOT 存在更新时间相关的文本节点
