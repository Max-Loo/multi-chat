# adaptive-sidebar Specification

## Purpose
TBD - created by archiving change responsive-layout-system. Update Purpose after archive.
## Requirements
### Requirement: 主内容侧边栏响应式宽度

聊天主内容侧边栏必须根据布局模式自动调整宽度。

**实现方式**：ChatSidebar 容器保持 `w-full`，子组件（ChatButton、ToolsBar）通过 `useResponsive()` Hook 获取 `layoutMode` 并调整内部元素的样式（字体、图标、间距）。

#### Scenario: Desktop 模式下侧边栏样式
- **WHEN** `layoutMode` 为 'desktop'
- **THEN** ChatSidebar 容器宽度为 `w-full`（由父组件控制）
- **AND** ChatButton 使用正常字体（text-sm）和图标（h-8 w-8）
- **AND** ToolsBar 使用正常尺寸（h-8 w-8）

#### Scenario: Compact 模式下侧边栏样式
- **WHEN** `layoutMode` 为 'compact'
- **THEN** ChatSidebar 容器宽度为 `w-full`（由父组件控制）
- **AND** ChatButton 使用缩小字体（text-xs）和图标（h-7 w-7）
- **AND** ToolsBar 使用缩小尺寸（h-7 w-7）

#### Scenario: Compressed 模式下侧边栏样式
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** ChatSidebar 容器宽度为 `w-full`（由父组件控制）
- **AND** ChatButton 使用缩小字体（text-xs）和图标（h-7 w-7）
- **AND** ToolsBar 使用缩小尺寸（h-7 w-7）

#### Scenario: Mobile 模式下侧边栏集成到抽屉
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 聊天侧边栏不显示在主布局中
- **AND** 侧边栏作为抽屉的内容显示
- **AND** 抽屉宽度由内容决定（ChatSidebar 正常显示）
- **AND** ChatButton 使用正常字体和图标（与 Desktop 相同）

### Requirement: 主内容侧边栏布局模式切换

主内容侧边栏必须在布局模式切换时自动调整内部布局。

**实现方式**：子组件通过 `useResponsive()` Hook 监听 `layoutMode` 变化，自动调整样式。

#### Scenario: 从 Desktop 切换到 Compact
- **WHEN** 窗口宽度从 1280px 缩小到 900px
- **THEN** ChatButton 字体从 text-sm 缩小到 text-xs
- **AND** ChatButton 图标从 h-8 w-8 缩小到 h-7 w-7
- **AND** 过渡动画使用 CSS transition

#### Scenario: 从 Desktop 切换到 Compressed
- **WHEN** 窗口宽度从 1280px 缩小到 1100px
- **THEN** ChatButton 字体从 text-sm 缩小到 text-xs
- **AND** ChatButton 图标从 h-8 w-8 缩小到 h-7 w-7
- **AND** 过渡动画使用 CSS transition

#### Scenario: 从 Compact 切换到 Compressed
- **WHEN** 窗口宽度从 900px 缩小到 1100px
- **THEN** 侧边栏样式保持不变（都是缩小模式）
- **AND** 侧边导航栏保持显示（方案 A）

#### Scenario: 从 Compressed 切换到 Mobile
- **WHEN** 窗口宽度从 1100px 缩小到 700px
- **THEN** 侧边栏从主布局中隐藏
- **AND** 侧边栏内容移动到抽屉组件中
- **AND** 汉堡菜单按钮显示在左上角

#### Scenario: 从 Mobile 切换回 Desktop
- **WHEN** 窗口宽度从 600px 扩大到 1300px
- **THEN** 侧边栏从抽屉移回主布局
- **AND** ChatButton 恢复为正常字体和图标（text-sm, h-8 w-8）

### Requirement: Compact 模式下的布局优化

在 Compact 模式下，侧边栏必须缩小字体和图标，但保持布局结构。

#### Scenario: 聊天按钮缩小字体和图标
- **WHEN** `layoutMode` 为 'compact'
- **THEN** 聊天按钮文字大小从 `text-sm` (14px) 缩小到 `text-xs` (12px)
- **AND** 操作按钮从 `h-8 w-8` 缩小到 `h-7 w-7`
- **AND** 操作按钮内部图标从 `h-4 w-4` (16px) 缩小到 `h-3.5 w-3.5` (15px)
- **AND** 按钮内边距从 `py-2` 缩小到 `py-1.5`

#### Scenario: 工具栏缩小图标和间距
- **WHEN** `layoutMode` 为 'compact'
- **THEN** 工具栏按钮从 `h-8 w-8` 缩小到 `h-7 w-7`
- **AND** 图标从 16px 缩小到 15px
- **AND** 按钮间距缩小到 `gap-1`

### Requirement: Compressed 模式下的布局优化

在 Compressed 模式下，侧边栏必须优化空间利用，使用横向布局。

#### Scenario: 聊天按钮横向布局
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 聊天按钮使用 `flex-row` 布局（图标和文字在同一行）
- **AND** 图标和文字之间使用 `gap-1` 间距
- **AND** 按钮使用 `w-full` 填充侧边栏宽度

#### Scenario: 聊天名称文字截断
- **WHEN** 聊天名称长度超过侧边栏宽度（Compressed 模式）
- **THEN** 文字使用 `text-overflow: ellipsis` 截断
- **AND** 显示省略号（如 "聊天名称..."）
- **AND** 鼠标悬停时显示完整名称（tooltip）

#### Scenario: 操作按钮进一步缩小
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 聊天按钮的操作按钮（⋮）从 `h-8 w-8` 缩小到 `h-6 w-6`
- **AND** 图标从 `h-4 w-4` (16px) 缩小到 `h-3 w-3` (14px)
- **AND** 保持可点击区域足够大（至少 44x44px）

#### Scenario: 工具栏进一步缩小
- **WHEN** `layoutMode` 为 'compressed'
- **THEN** 工具栏按钮从 `h-8 w-8` 缩小到 `h-6 w-6`
- **AND** 图标从 16px 缩小到 14px
- **AND** 按钮间距保持 `gap-1`

### Requirement: 主内容侧边栏状态保持

主内容侧边栏必须在布局模式切换时保持用户状态。

#### Scenario: 选中的聊天保持
- **WHEN** 用户选中某个聊天
- **THEN** 布局模式切换时，选中状态不变
- **AND** 选中的聊天在主内容侧边栏中高亮显示

#### Scenario: 搜索状态保持
- **WHEN** 用户在主内容侧边栏中输入搜索关键词
- **THEN** 布局模式切换时，搜索关键词保留
- **AND** 过滤结果在所有布局模式下一致

**未来需求（V2）**：
- **滚动位置保持**：在布局模式切换时保持 ChatSidebar 的滚动位置（当前版本未实现）
  - 实现方式：使用 `useRef` 保存和恢复滚动位置
  - 参考设计文档：`design.md:402-435`
  - 原因：当前版本优先实现核心响应式功能，滚动位置保持将在后续版本中添加

### Requirement: Mobile 模式下的抽屉集成

在 Mobile 模式下，主内容侧边栏必须集成到抽屉组件中。

#### Scenario: 抽屉内容为完整主内容侧边栏
- **WHEN** `layoutMode` 为 'mobile' 且抽屉打开
- **THEN** 抽屉显示完整的聊天主内容侧边栏（包括搜索、聊天列表、创建按钮）
- **AND** 布局与 Desktop 模式相同（垂直列表）
- **AND** 不使用 Compressed 模式的横向布局

#### Scenario: 抽屉宽度为 80%
- **WHEN** Mobile 模式下打开抽屉
- **THEN** 抽屉宽度为屏幕宽度的 80%
- **AND** 最大宽度不超过 400px
- **AND** 使用 `w-[80%] max-w-[400px]` Tailwind 类

#### Scenario: 抽屉从左侧滑出
- **WHEN** 用户点击汉堡菜单按钮
- **THEN** 抽屉从左侧滑出
- **AND** 使用 `transition-transform duration-300 ease-in-out`
- **AND** 初始状态为 `-translate-x-full`

### Requirement: 主内容侧边栏可访问性

主内容侧边栏必须符合可访问性标准。

#### Scenario: 键盘导航支持
- **WHEN** 用户使用 Tab 键
- **THEN** 可以在主内容侧边栏的聊天按钮之间导航
- **AND** 选中的按钮有明显的焦点样式

#### Scenario: ARIA 标签
- **WHEN** 主内容侧边栏渲染
- **THEN** 主内容侧边栏容器有 `role="navigation"` 或 `role="complementary"`
- **AND** 聊天列表有 `aria-label="聊天列表"`
- **AND** 每个聊天按钮有 `aria-label` 描述聊天名称

#### Scenario: 屏幕阅读器支持
- **WHEN** 用户使用屏幕阅读器
- **THEN** 侧边栏状态变化（展开/折叠）被通知
- **AND** 选中的聊天被明确读出

### Requirement: 主内容侧边栏性能

主内容侧边栏必须确保在各种模式下性能良好。

#### Scenario: 虚拟滚动优化
- **WHEN** 聊天列表包含 100+ 个聊天
- **THEN** 使用虚拟滚动（react-window 或类似库）
- **AND** 只渲染可见区域的聊天按钮
- **AND** 滚动性能保持 60 FPS

#### Scenario: 布局切换不触发数据加载
- **WHEN** 布局模式切换
- **THEN** 不重新加载聊天列表数据
- **AND** 不触发网络请求
- **AND** 仅重新渲染组件

#### Scenario: 防抖搜索输入
- **WHEN** 用户在侧边栏搜索框中输入
- **THEN** 搜索过滤使用 300ms 防抖
- **AND** 避免频繁的列表重新渲染

### Requirement: 主内容侧边栏样式一致性

主内容侧边栏必须在所有布局模式下保持视觉一致性。

#### Scenario: 颜色主题一致
- **WHEN** 在不同布局模式下
- **THEN** 主内容侧边栏背景色、边框颜色、文字颜色保持一致
- **AND** 使用相同的 Tailwind 颜色类

#### Scenario: 间距系统一致
- **WHEN** 在不同布局模式下
- **THEN** 主内容侧边栏的间距使用相同的倍数（基于 4px 网格）
- **AND** Compressed 模式下按比例缩小（如 gap-2 → gap-1）

#### Scenario: 图标样式一致
- **WHEN** 在不同布局模式下
- **THEN** 所有图标使用相同的库（lucide-react）
- **AND** 图标大小按比例缩放
- **AND** 图标颜色保持一致

