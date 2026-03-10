# mobile-drawer Specification

## Purpose
TBD - created by archiving change responsive-layout-system. Update Purpose after archive.
## Requirements
### Requirement: 抽屉组件实现

系统必须使用 shadcn/ui 的 Sheet 组件实现移动端抽屉组件。

#### Scenario: 抽屉基于 shadcn/ui Sheet
- **WHEN** 渲染抽屉组件
- **THEN** 使用 shadcn/ui Sheet 组件（`src/components/ui/sheet.tsx`）
- **AND** Sheet 组件基于 `@radix-ui/react-dialog` 实现
- **AND** 组件已存在于项目中，无需额外安装

#### Scenario: 抽屉从左侧滑出
- **WHEN** 用户触发抽屉打开
- **THEN** 抽屉从左侧边缘滑入视图
- **AND** 使用 `side="left"` 属性
- **AND** 初始位置为 `-translate-x-full`（完全隐藏在左侧屏幕外）

#### Scenario: 抽屉宽度由内容决定
- **WHEN** 抽屉打开
- **THEN** 抽屉宽度由内容决定（`w-fit`）
- **AND** 移动端最大宽度为视窗宽度的 85%（`max-w-[85vw]`）
- **AND** 小屏幕及以上（≥640px）最大宽度为 md（448px，`sm:max-w-md`）
- **AND** 确保各页面的侧边栏在抽屉中正常显示（ChatSidebar 224px、SettingSidebar 256px、ModelSidebar 240px）

### Requirement: 抽屉内容为聊天主内容侧边栏

抽屉必须显示完整的聊天主内容侧边栏内容。

#### Scenario: 抽屉显示聊天列表
- **WHEN** 抽屉打开
- **THEN** 抽屉内容为 `ChatSidebar` 组件
- **AND** 包括工具栏（搜索、创建聊天按钮）
- **AND** 包括完整的聊天列表
- **AND** 布局与 Desktop 模式相同（垂直列表）

#### Scenario: 抽屉内的交互正常工作
- **WHEN** 用户在抽屉中点击聊天按钮
- **THEN** 正常导航到对应聊天
- **AND** 抽屉自动关闭
- **AND** 主内容区域更新为选中的聊天

#### Scenario: 抽屉内的搜索功能
- **WHEN** 用户在抽屉的搜索框中输入关键词
- **THEN** 聊天列表实时过滤
- **AND** 过滤结果在抽屉中显示
- **AND** 不影响主内容区域

### Requirement: 抽屉打开/关闭触发

抽屉必须通过多种方式打开和关闭。

#### Scenario: 点击汉堡菜单按钮打开抽屉
- **WHEN** 用户点击左上角的汉堡菜单按钮（Menu 图标）
- **THEN** 抽屉从左侧滑出
- **AND** Redux 状态 `isDrawerOpen` 设置为 true
- **AND** 显示半透明遮罩层

#### Scenario: 点击遮罩层关闭抽屉
- **WHEN** 抽屉打开时用户点击遮罩层（抽屉外的区域）
- **THEN** 抽屉向左滑出屏幕
- **AND** 遮罩层淡出
- **AND** Redux 状态 `isDrawerOpen` 设置为 false

#### Scenario: 按 ESC 键关闭抽屉
- **WHEN** 抽屉打开时用户按下 ESC 键
- **THEN** 抽屉关闭
- **AND** 焦点返回触发按钮（汉堡菜单按钮）
- **AND** Redux 状态 `isDrawerOpen` 设置为 false

#### Scenario: 点击抽屉内的关闭按钮
- **WHEN** 抽屉顶部有关闭按钮（X 图标）且用户点击
- **THEN** 抽屉关闭
- **AND** Redux 状态 `isDrawerOpen` 设置为 false

### Requirement: 抽屉动画和过渡效果

抽屉必须提供平滑的动画和过渡效果。

#### Scenario: 抽屉滑入动画
- **WHEN** 抽屉打开
- **THEN** 抽屉从 `-translate-x-full` 过渡到 `translate-x-0`
- **AND** 使用 `transition-transform duration-300 ease-in-out`
- **AND** 动画曲线为 ease-in-out（先慢后快再慢）

#### Scenario: 遮罩层淡入动画
- **WHEN** 抽屉打开
- **THEN** 遮罩层从 `opacity-0` 过渡到 `opacity-100`
- **AND** 使用 `transition-opacity duration-300`
- **AND** 遮罩层背景为半透明黑色（`bg-black/50`）

#### Scenario: 抽屉关闭动画
- **WHEN** 抽屉关闭
- **THEN** 抽屉从 `translate-x-0` 过渡到 `-translate-x-full`
- **AND** 遮罩层从 `opacity-100` 过渡到 `opacity-0`
- **AND** 动画完成后，抽屉从 DOM 中移除（unmount）

### Requirement: 抽屉打开时的背景滚动锁定

抽屉打开时必须锁定背景滚动，防止用户滚动主内容区域。

#### Scenario: 抽屉打开时背景不滚动
- **WHEN** 抽屉打开
- **THEN** 主内容区域的滚动被禁用
- **AND** document.body 设置 `overflow: hidden`
- **AND** 用户只能滚动抽屉内的内容

#### Scenario: 抽屉关闭时恢复背景滚动
- **WHEN** 抽屉关闭
- **THEN** 主内容区域的滚动恢复
- **AND** document.body 移除 `overflow: hidden`
- **AND** 保持关闭前的滚动位置

#### Scenario: 抽屉内部可滚动
- **WHEN** 抽屉打开且聊天列表高度超过抽屉高度
- **THEN** 用户可以滚动抽屉内的聊天列表
- **AND** 滚动不影响主内容区域
- **AND** 使用 `overflow-y-auto` 样式

### Requirement: 抽屉焦点管理

抽屉必须正确管理焦点，确保可访问性。

#### Scenario: 打开抽屉时焦点进入抽屉
- **WHEN** 用户点击汉堡菜单按钮打开抽屉
- **THEN** 焦点移动到抽屉内的第一个可聚焦元素（如搜索框）
- **AND** 使用 shadcn/ui Sheet 组件自动管理的焦点 trap

#### Scenario: 关闭抽屉时焦点返回触发按钮
- **WHEN** 抽屉关闭
- **THEN** 焦点返回到汉堡菜单按钮
- **AND** 用户可以继续键盘导航

#### Scenario: 焦点 trap 在抽屉内
- **WHEN** 抽屉打开时用户使用 Tab 键
- **THEN** 焦点只在抽屉内的元素之间循环
- **AND** 不会 tab 到主内容区域
- **AND** 使用 shadcn/ui Sheet 组件的内置焦点 trap

### Requirement: 抽屉状态管理

抽屉状态必须通过 Redux store 管理。

#### Scenario: 抽屉状态存储在 Redux
- **WHEN** 抽屉打开或关闭
- **THEN** Redux store 中的 `chatPage.isDrawerOpen` 更新
- **AND** 状态类型为 boolean
- **AND** 其他组件可以访问此状态

#### Scenario: 切换抽屉状态的 action
- **WHEN** 组件需要切换抽屉状态
- **THEN** 调用 Redux action `toggleDrawer()`
- **AND** action 自动翻转 `isDrawerOpen` 的值
- **AND** 触发相关组件重新渲染

#### Scenario: 手动设置抽屉状态
- **WHEN** 组件需要明确打开或关闭抽屉
- **THEN** 可以调用 `setIsDrawerOpen(true)` 或 `setIsDrawerOpen(false)`
- **AND** 提供 action creators 用于精确控制

### Requirement: 抽屉仅在 Mobile 模式下可用

抽屉组件必须在 Mobile 模式下渲染，其他模式下不显示。

#### Scenario: Desktop、Compact 和 Compressed 模式下不渲染抽屉
- **WHEN** `layoutMode` 为 'desktop' 或 'compact' 或 'compressed'
- **THEN** 抽屉组件不渲染
- **AND** 汉堡菜单按钮不显示
- **AND** 主内容侧边栏直接显示在主布局中

#### Scenario: Mobile 模式下渲染抽屉
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 抽屉组件渲染
- **AND** 汉堡菜单按钮显示在左上角（各页面的 Header 组件中）
- **AND** 主内容侧边栏仅在抽屉打开时显示

### Requirement: 抽屉 ARIA 属性和可访问性

抽屉必须符合 ARIA 无障碍标准。

#### Scenario: 抽屉容器有正确的 ARIA 角色
- **WHEN** 抽屉渲染
- **THEN** 抽屉容器有 `role="dialog"` 或 `role="navigation"`
- **AND** 使用 shadcn/ui Sheet 组件提供的默认 ARIA 角色（基于 Radix Dialog）

#### Scenario: 汉堡菜单按钮有 ARIA 标签
- **WHEN** 汉堡菜单按钮渲染
- **THEN** 按钮有 `aria-label="打开聊天列表"`
- **AND** 抽屉打开时更新为 `aria-label="关闭聊天列表"`
- **AND** 使用 `aria-expanded` 表示状态

#### Scenario: 遮罩层有正确的 ARIA 属性
- **WHEN** 遮罩层渲染
- **THEN** 遮罩层有 `aria-hidden="true"`
- **AND** 不影响屏幕阅读器的焦点

### Requirement: 抽屉性能优化

抽屉必须确保良好的性能，不阻塞主线程。

#### Scenario: 抽屉使用 Portal 渲染
- **WHEN** 抽屉渲染
- **THEN** 使用 React Portal 渲染到 `document.body`
- **AND** 避免 z-index 层级问题
- **AND** 使用 shadcn/ui Sheet 组件的内置 Portal（基于 Radix Dialog）

#### Scenario: 抽屉关闭时延迟卸载
- **WHEN** 抽屉关闭
- **THEN** 延迟 300ms 后卸载抽屉内容（等待动画完成）
- **AND** 使用 `unmountOnExit` 或类似机制
- **AND** 避免动画卡顿

#### Scenario: 抽屉打开时不阻塞主线程
- **WHEN** 抽屉打开
- **THEN** 打开动画使用 CSS transform（GPU 加速）
- **AND** 不使用 JavaScript 动画
- **AND** 保持 60 FPS

