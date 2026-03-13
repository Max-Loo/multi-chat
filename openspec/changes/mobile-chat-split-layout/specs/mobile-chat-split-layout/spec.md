## ADDED Requirements

### Requirement: 移动端聊天支持主副分屏布局
系统 SHALL 在移动端（屏幕宽度 < 768px）为主聊天提供完整交互功能，为副聊天提供缩小预览功能。

#### Scenario: 竖屏显示主副聊天
- **WHEN** 屏幕宽度 < 768px 且屏幕方向为竖向
- **THEN** 副聊天 SHALL 显示在主聊天上方，水平排列
- **THEN** 主聊天 SHALL 占据剩余空间，支持完整交互

#### Scenario: 横屏显示主副聊天
- **WHEN** 屏幕宽度 < 768px 且屏幕方向为横向
- **THEN** 副聊天 SHALL 显示在主聊天左侧，垂直排列
- **THEN** 主聊天 SHALL 占据剩余空间，支持完整交互

### Requirement: 主聊天状态管理
系统 SHALL 维护一个主聊天标识符 (`primaryModelId`)，默认为聊天列表的第一个。

#### Scenario: 初始化主聊天
- **WHEN** 移动端分屏模式激活且聊天列表不为空
- **THEN** `primaryModelId` SHALL 设置为 `chatModelList[0].modelId`

#### Scenario: 主聊天列表变化时重置
- **WHEN** `chatModelList` 发生变化
- **THEN** `primaryModelId` SHALL 更新为新列表的第一个模型 ID

### Requirement: 主副聊天切换
系统 SHALL 允许用户点击副聊天将其其与主聊天交换位置。

#### Scenario: 点击副聊天切换主聊天
- **WHEN** 用户点击任意副聊天
- **THEN** 该副聊天 SHALL 成为主聊天
- **THEN** 原主聊天 SHALL 成为副聊天

### Requirement: 单聊天时正常显示
- **WHEN** 聊天列表只有一个聊天
- **THEN** 系统 SHALL 正常全屏显示该聊天，不使用主副分屏布局
