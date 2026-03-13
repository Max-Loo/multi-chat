## ADDED Requirements

### Requirement: 移动端分屏布局检测
系统 SHALL 在移动端（<768px）使用主副聊天分屏布局，而非现有的可拖拽分屏或棋盘布局。

#### Scenario: 移动端激活主副分屏
- **WHEN** 屏幕宽度 < 768px 且有多个聊天
- **THEN** 系统 SHALL 使用主副聊天分屏布局

#### Scenario: 桌面端保持现有布局
- **WHEN** 屏幕宽度 >= 768px
- **THEN** 系统 SHALL 使用现有的可拖拽分屏或棋盘布局

### Requirement: 屏幕方向自适应
系统 SHALL 根据屏幕方向（竖屏/横屏）调整副聊天位置。

#### Scenario: 竖屏副聊天在上方
- **WHEN** 屏幕方向为竖屏（portrait）
- **THEN** 副聊天 SHALL 显示在主聊天上方，水平排列

#### Scenario: 横屏副聊天在左侧
- **WHEN** 屏幕方向为横屏（landscape）
- **THEN** 副聊天 SHALL 显示在主聊天左侧，垂直排列

### Requirement: 主聊天状态管理
系统 SHALL 维护当前主聊天的标识符，默认为聊天列表第一个。

#### Scenario: 初始化主聊天
- **WHEN** 进入移动端分屏模式
- **THEN** 主聊天 SHALL 默认为聊天列表的第一个聊天

#### Scenario: 主聊天跟随聊天列表变化
- **WHEN** 聊天列表发生变化
- **THEN** 主聊天 SHALL 重置为新列表的第一个聊天

### Requirement: 主副聊天切换
系统 SHALL 支持用户点击副聊天将其与主聊天交换位置。

#### Scenario: 点击副聊天切换为主聊天
- **WHEN** 用户点击任意副聊天
- **THEN** 该副聊天 SHALL 成为主聊天，原主聊天 SHALL 成为副聊天

### Requirement: 副聊天内容展示
副聊天 SHALL 使用与缩小的比例展示聊天内容，复用 ChatPanelContentDetail 组件。副聊天区域约占总可用空间的 30%。

#### Scenario: 副聊天渲染聊天内容
- **WHEN** 渲染副聊天
- **THEN** 副聊天 SHALL 使用 ChatPanelContentDetail 组件渲染内容

#### Scenario: 副聊天区域占比
- **WHEN** 有 2-3 个聊天
- **THEN** 副聊天区域 SHALL 约占总可用空间（高度或宽度）的 30%，主聊天占 70%

### Requirement: 单聊天正常显示
- **WHEN** 只有一个聊天
- **THEN** 系统 SHALL 正常全屏显示该聊天，不使用主副分屏布局

### Requirement: 移动端忽略桌面端布局参数
移动端模式下，系统 SHALL 忽略 columnCount 和 isSplitter props，使用主副分屏布局。

#### Scenario: 移动端忽略桌面端参数
- **WHEN** 屏幕宽度 < 768px
- **THEN** 系统 SHALL 忽略 columnCount 和 isSplitter，使用主副分屏布局

### Requirement: 副聊天滚动位置保持
系统 SHALL 在组件内临时保存各副聊天的滚动位置，切换时不丢失阅读进度。

#### Scenario: 保存副聊天滚动位置
- **WHEN** 用户滚动副聊天内容
- **THEN** 系统 SHALL 保存该副聊天的滚动位置

#### Scenario: 恢复副聊天滚动位置
- **WHEN** 副聊天切换为主聊天后再次变为副聊天
- **THEN** 系统 SHALL 恢复之前保存的滚动位置
