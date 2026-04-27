## MODIFIED Requirements

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
- **AND** 左侧名称区域必须设置 `flex-1 overflow-hidden`，确保名称过长时正确截断
- **AND** 右侧操作按钮必须设置 `shrink-0`，确保不被左侧内容压缩

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

#### Scenario: Desktop 模式下名称过长不压缩右侧按钮
- **WHEN** `layoutMode` 为 'desktop' 且聊天名称超过按钮可用宽度
- **THEN** 左侧名称区域使用 `flex-1 overflow-hidden` 约束宽度
- **AND** 名称文本使用 `truncate` 截断显示
- **AND** 右侧操作按钮保持固定尺寸，不被压缩

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

## ADDED Requirements

### Requirement: 聊天按钮名称区域的布局约束

聊天按钮的左侧名称区域必须在所有布局模式下正确约束宽度，防止挤压右侧操作按钮。

#### Scenario: 名称过长时正确截断
- **WHEN** 聊天名称长度超过按钮可用宽度
- **THEN** 左侧名称 `<span>` 通过 `flex-1 overflow-hidden` 占据剩余空间并隐藏溢出
- **AND** 内部文本通过 `truncate` 显示省略号截断
- **AND** 右侧操作按钮保持原始尺寸

#### Scenario: 快捷删除按钮激活时不被压缩
- **WHEN** Shift 键按下且鼠标悬停在聊天按钮上
- **THEN** 快捷删除按钮（`variant="destructive"`）保持固定尺寸
- **AND** 左侧名称正确截断，不挤压删除按钮

#### Scenario: 名称较短时布局正常
- **WHEN** 聊天名称长度小于按钮可用宽度
- **THEN** 名称完整显示，无截断
- **AND** 右侧操作按钮保持固定尺寸
- **AND** 布局与修复前一致，无视觉差异
