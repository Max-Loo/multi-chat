# responsive-chat-button Specification

## Purpose
TBD - created by archiving change responsive-layout-system. Update Purpose after archive.
## Requirements
### Requirement: 聊天按钮三种布局模式

聊天按钮必须根据布局模式自动切换布局方式。

#### Scenario: Desktop 模式下垂直布局
- **WHEN** `layoutMode` 为 'desktop'
- **THEN** 聊天按钮使用垂直布局（`flex-col`）
- **AND** 图标在上，文字在下（多行显示）
- **AND** 操作按钮（⋮）在右上角
- **AND** 使用 `items-start` 左对齐

#### Scenario: Compressed 模式下横向布局
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 聊天按钮使用横向布局（`flex-row`）
- **AND** 图标和文字在同一行
- **AND** 操作按钮缩小并显示在右侧
- **AND** 使用 `items-center` 垂直居中

#### Scenario: Mobile 模式下垂直布局
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 聊天按钮使用垂直布局（`flex-col`）
- **AND** 布局与 Desktop 模式相同
- **AND** 操作按钮隐藏，使用长按触发菜单

### Requirement: Desktop 模式下的样式和交互

Desktop 模式下的聊天按钮必须保持现有的样式和交互。

#### Scenario: Desktop 模式下按钮宽度
- **WHEN** `layoutMode` 为 'desktop'
- **THEN** 按钮宽度为 100%（`w-full`）
- **AND** 左右 padding 为 `px-2`
- **AND** 上下 padding 为 `py-2`

#### Scenario: Desktop 模式下图标和文字布局
- **WHEN** `layoutMode` 为 'desktop'
- **THEN** 图标（MessageSquare）在上方
- **AND** 文字在下方，使用 `text-sm` 字号
- **AND** 文字左侧 padding 为 `pl-2`

#### Scenario: Desktop 模式下操作按钮
- **WHEN** `layoutMode` 为 'desktop'
- **THEN** 操作按钮（⋮）显示在右上角
- **AND** 按钮大小为 `h-8 w-8`
- **AND** 图标大小为 `h-4 w-4`
- **AND** 点击时打开 DropdownMenu

#### Scenario: Desktop 模式下悬停效果
- **WHEN** 用户悬停在聊天按钮上
- **THEN** 显示悬停背景（`hover:bg-accent`）
- **AND** 过渡动画使用 `transition-colors`

### Requirement: Compressed 模式下的样式和交互

Compressed 模式下的聊天按钮必须优化空间利用。

#### Scenario: Compressed 模式下按钮布局
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 图标和文字使用 `flex-row` 横向排列
- **AND** 图标和文字之间使用 `gap-1` 间距
- **AND** 使用 `items-center` 垂直居中

#### Scenario: Compressed 模式下文字截断
- **WHEN** 聊天名称长度超过按钮宽度
- **THEN** 文字使用 `text-overflow: ellipsis` 截断
- **AND** 显示省略号（如 "聊天名称..."）
- **AND** 使用 `truncate` Tailwind 类
- **AND** 文字使用 `text-sm` 字号

#### Scenario: Compressed 模式下图标样式
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 图标使用 `h-4 w-4` 大小
- **AND** 图标使用 `shrink-0` 防止收缩
- **AND** 图标与文字紧密排列

#### Scenario: Compressed 模式下操作按钮缩小
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 操作按钮缩小为 `h-6 w-6`
- **AND** 图标缩小为 `h-3 w-3`
- **AND** 保持可点击区域足够大（至少 44x44px）
- **AND** 使用 `shrink-0` 防止收缩

#### Scenario: Compressed 模式下按钮宽度
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 按钮宽度为 100%（`w-full`）
- **AND** 左右 padding 为 `px-2`
- **AND** 上下 padding 为 `py-2`

### Requirement: Mobile 模式下的样式和交互

Mobile 模式下的聊天按钮必须使用长按触发操作菜单。

#### Scenario: Mobile 模式下按钮布局
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 聊天按钮使用垂直布局（与 Desktop 相同）
- **AND** 图标在上，文字在下
- **AND** 不显示操作按钮（⋮）

#### Scenario: Mobile 模式下长按触发菜单
- **WHEN** 用户在聊天按钮上长按 500ms
- **THEN** 显示操作菜单（重命名、删除）
- **AND** 菜单位置在按钮附近
- **AND** 使用 DropdownMenu 或类似组件

#### Scenario: Mobile 模式下点击导航
- **WHEN** 用户点击聊天按钮（非长按）
- **THEN** 导航到对应聊天详情
- **AND** 不触发操作菜单
- **AND** 与 Desktop/Compressed 模式行为一致

#### Scenario: Mobile 模式下操作按钮隐藏
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 不显示操作按钮（⋮）
- **AND** 减少视觉干扰
- **AND** 所有操作通过长按触发

### Requirement: 聊天按钮选中状态

聊天按钮必须在所有模式下正确显示选中状态。

#### Scenario: 选中的聊天按钮高亮显示
- **WHEN** 某个聊天被选中
- **THEN** 对应的聊天按钮显示高亮背景
- **AND** 使用 `bg-primary/20` 类
- **AND** 在所有布局模式下保持一致

#### Scenario: 未选中的聊天按钮默认样式
- **WHEN** 聊天未被选中
- **THEN** 聊天按钮使用默认背景（透明）
- **AND** 悬停时显示 `hover:bg-accent`

#### Scenario: 选中状态在布局模式切换时保持
- **WHEN** 布局模式从 Desktop 切换到 Compressed
- **THEN** 选中的聊天保持选中状态
- **AND** 高亮显示在新布局模式下

### Requirement: 聊天按钮可访问性

聊天按钮必须符合可访问性标准。

#### Scenario: 聊天按钮键盘导航
- **WHEN** 用户使用 Tab 键
- **THEN** 可以在聊天按钮之间导航
- **AND** 焦点样式明显可见
- **AND** 支持 Enter 键激活

#### Scenario: 聊天按钮 ARIA 标签
- **WHEN** 聊天按钮渲染
- **THEN** 按钮有 `aria-label` 描述聊天名称
- **AND** 选中状态使用 `aria-pressed` 或 `aria-selected`
- **AND** 操作按钮有 `aria-label` 描述功能

#### Scenario: 长按操作的屏幕阅读器支持
- **WHEN** 用户使用屏幕阅读器
- **THEN** 长按操作被明确说明
- **AND** 提示用户"长按查看更多选项"

### Requirement: 聊天按钮性能优化

聊天按钮必须确保良好的性能。

#### Scenario: 聊天按钮使用 React.memo
- **WHEN** 聊天列表渲染
- **THEN** 使用 React.memo 优化聊天按钮
- **AND** 只有聊天名称或选中状态变化时才重新渲染
- **AND** 减少不必要的渲染

#### Scenario: 长按防抖
- **WHEN** 用户按下聊天按钮
- **THEN** 500ms 后触发长按操作
- **AND** 如果在 500ms 内释放，不触发长按
- **AND** 避免误触发

#### Scenario: 操作菜单延迟渲染
- **WHEN** 聊天按钮渲染
- **THEN** 操作菜单（DropdownMenu）延迟渲染
- **AND** 只在点击时才创建菜单
- **AND** 减少初始渲染开销

### Requirement: 聊天按钮在不同模式下的功能一致性

聊天按钮必须在所有模式下提供相同的核心功能。

#### Scenario: 所有模式下都可以导航到聊天
- **WHEN** 用户点击聊天按钮
- **THEN** 导航到对应的聊天详情
- **AND** 功能在 Desktop/Compressed/Mobile 模式下一致

#### Scenario: 所有模式下都可以重命名聊天
- **WHEN** 用户触发重命名操作
- **THEN** 可以重命名聊天
- **AND** Desktop/Compressed: 点击操作按钮 → 重命名
- **AND** Mobile: 长按 → 重命名

#### Scenario: 所有模式下都可以删除聊天
- **WHEN** 用户触发删除操作
- **THEN** 可以删除聊天
- **AND** 显示确认对话框
- **AND** 功能在所有模式下一致

### Requirement: 聊天按钮的重命名功能

重命名功能必须在所有模式下正常工作。

#### Scenario: Desktop 模式下重命名
- **WHEN** 用户在 Desktop 模式下点击操作按钮 → 重命名
- **THEN** 聊天按钮变为输入框
- **AND** 输入框宽度适应按钮宽度
- **AND** 显示确认和取消按钮

#### Scenario: Compressed 模式下重命名
- **WHEN** 用户在 Compressed 模式下点击操作按钮 → 重命名
- **THEN** 聊天按钮变为输入框
- **AND** 输入框宽度适应压缩的按钮宽度
- **AND** 文字在输入框中显示完整（不截断）

#### Scenario: Mobile 模式下重命名
- **WHEN** 用户在 Mobile 模式下长按 → 重命名
- **THEN** 聊天按钮变为输入框
- **AND** 输入框宽度适应按钮宽度
- **AND** 与 Desktop 模式行为一致

#### Scenario: 重命名输入框焦点管理
- **WHEN** 重命名输入框显示
- **THEN** 输入框自动获得焦点
- **AND** 光标移动到文字末尾
- **AND** 支持键盘 Enter 确认、Esc 取消

### Requirement: 聊天按钮的删除功能

删除功能必须在所有模式下正常工作。

#### Scenario: Desktop 模式下删除
- **WHEN** 用户在 Desktop 模式下点击操作按钮 → 删除
- **THEN** 显示确认对话框
- **AND** 对话框显示聊天名称
- **AND** 确认后删除聊天

#### Scenario: Compressed 模式下删除
- **WHEN** 用户在 Compressed 模式下点击操作按钮 → 删除
- **THEN** 显示确认对话框
- **AND** 行为与 Desktop 模式一致

#### Scenario: Mobile 模式下删除
- **WHEN** 用户在 Mobile 模式下长按 → 删除
- **THEN** 显示确认对话框
- **AND** 行为与 Desktop 模式一致

#### Scenario: 删除当前选中的聊天
- **WHEN** 用户删除当前选中的聊天
- **THEN** 聊天被删除
- **AND** 导航回聊天列表页面
- **AND** 清除 URL 中的 chatId 参数

### Requirement: 聊天按钮的工具提示（Tooltip）

聊天按钮必须在需要时显示工具提示。

#### Scenario: Compressed 模式下文字截断时显示 Tooltip
- **WHEN** 聊天名称被截断（显示"..."）
- **THEN** 鼠标悬停时显示完整名称
- **AND** Tooltip 位置在按钮上方
- **AND** 使用 @radix-ui/react-tooltip

#### Scenario: Desktop 和 Mobile 模式下不显示 Tooltip
- **WHEN** 聊天名称完整显示（未截断）
- **THEN** 不显示 Tooltip
- **AND** 避免不必要的提示

### Requirement: 聊天按钮的加载状态

聊天按钮必须在需要时显示加载状态。

#### Scenario: 聊天列表加载时显示骨架屏
- **WHEN** 聊天列表正在加载
- **THEN** 显示 5 个骨架屏按钮
- **AND** 骨架屏高度与真实按钮一致（`h-11`）
- **AND** 使用 `animate-pulse` 动画

#### Scenario: 重命名时显示加载状态
- **WHEN** 用户确认重命名
- **THEN** 确认按钮显示加载状态（禁用+spinner）
- **AND** 防止重复提交
- **AND** 重命名完成后恢复正常

#### Scenario: 删除时显示加载状态
- **WHEN** 用户确认删除
- **THEN** 确认按钮显示加载状态（禁用+spinner）
- **AND** 防止重复提交
- **AND** 删除完成后关闭对话框

### Requirement: 聊天按钮的错误处理

聊天按钮必须正确处理错误情况。

#### Scenario: 重命名失败时显示错误提示
- **WHEN** 重命名操作失败（网络错误、权限错误）
- **THEN** 显示 Toast 错误提示
- **AND** 输入框保持打开，用户可以重试
- **AND** 不丢失用户输入的文字

#### Scenario: 删除失败时显示错误提示
- **WHEN** 删除操作失败
- **THEN** 显示 Toast 错误提示
- **AND** 聊天不被删除
- **AND** 用户可以重试

#### Scenario: 导航失败时保持当前状态
- **WHEN** 点击聊天按钮时导航失败
- **THEN** 保持当前聊天列表状态
- **AND** 显示错误提示（可选）
- **AND** 不影响其他按钮的操作

