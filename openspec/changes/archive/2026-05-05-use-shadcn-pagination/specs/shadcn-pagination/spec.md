## ADDED Requirements

### Requirement: Pagination 组件使用 button 元素
Pagination 组件中的 PaginationLink 及其派生组件（PaginationPrevious、PaginationNext）底层 SHALL 使用 `<button>` 元素而非 `<a>` 元素，以适配 Tauri 桌面应用的交互模式。

#### Scenario: 按钮点击触发回调
- **WHEN** 用户点击 PaginationPrevious 或 PaginationNext
- **THEN** 触发 onClick 回调函数，不发生页面跳转

### Requirement: Pagination 仅保留图标模式
PaginationPrevious 和 PaginationNext SHALL 仅显示箭头图标，不显示文字标签（"Previous"/"Next"）。

#### Scenario: 翻页按钮仅显示图标
- **WHEN** 渲染 PaginationPrevious 或 PaginationNext
- **THEN** 仅显示 ChevronLeft/ChevronRight 图标，不包含任何文字内容

### Requirement: 边界状态禁用按钮
HistoryPager 在到达边界时 SHALL 禁用对应方向的翻页按钮，按钮始终渲染。

#### Scenario: 到达首页禁用上一页按钮
- **WHEN** 当前索引为 0（第一页）
- **THEN** PaginationPrevious 渲染但处于 disabled 状态

#### Scenario: 到达末页禁用下一页按钮
- **WHEN** 当前索引为 total - 1（最后一页）
- **THEN** PaginationNext 渲染但处于 disabled 状态

### Requirement: 历史计数器显示
HistoryPager SHALL 在翻页按钮之间显示当前版本号和总版本数，格式为 "当前/总数"。

#### Scenario: 显示版本计数
- **WHEN** 消息有多于 1 个历史版本
- **THEN** 在 Previous 和 Next 按钮之间显示 "n/m" 格式的计数器（n 为当前索引 + 1，m 为总版本数）

#### Scenario: 单版本不显示翻页器
- **WHEN** 消息仅有 1 个版本（total <= 1）
- **THEN** 整个 HistoryPager 不渲染
