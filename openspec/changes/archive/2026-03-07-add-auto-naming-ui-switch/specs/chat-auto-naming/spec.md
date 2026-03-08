# 聊天标题自动生成功能规格（UI 控制增量）

## ADDED Requirements

### Requirement: 全局开关 UI 控制
系统必须在设置页面提供 UI 控件，允许用户切换自动命名功能的全局开关。

#### Scenario: 设置页面显示开关
- **WHEN** 用户导航到设置页面的通用设置
- **THEN** 系统显示自动命名开关组件
- **AND** 开关状态与 Redux store 中的 `autoNamingEnabled` 保持同步

#### Scenario: 用户切换开关状态
- **WHEN** 用户点击开关控件
- **THEN** 系统立即更新 Redux store 中的 `autoNamingEnabled` 状态
- **AND** 系统触发持久化到 localStorage
- **AND** UI 实时反映新的开关状态

#### Scenario: 显示功能说明
- **WHEN** 自动命名开关组件显示在设置页面
- **THEN** 系统在开关下方显示简要功能说明
- **AND** 说明文字包含：自动命名的作用、默认开启状态
