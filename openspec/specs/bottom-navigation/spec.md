# bottom-navigation Specification

## Purpose
TBD - created by archiving change responsive-layout-system. Update Purpose after archive.
## Requirements
### Requirement: 底部导航栏组件实现

系统必须实现底部导航栏组件，仅在 Mobile 模式下显示。

**实现方式**：方案 A - 统一使用侧边导航栏（≥768px 用侧边导航，<768px 用底部导航）

#### Scenario: 底部导航栏固定在底部
- **WHEN** Mobile 模式下渲染底部导航栏
- **THEN** 导航栏固定在屏幕底部
- **AND** 使用 `fixed bottom-0 left-0 right-0` 定位
- **AND** 高度为 64px（`h-16`）

#### Scenario: 底部导航栏仅在 Mobile 模式下显示
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 底部导航栏渲染
- **AND** 替代左侧全局导航栏（Sidebar）

#### Scenario: Desktop、Compact 和 Compressed 模式下不显示底部导航栏
- **WHEN** `layoutMode` 为 'desktop' 或 'compact' 或 'compressed'
- **THEN** 底部导航栏不渲染
- **AND** 不占用布局空间
- **AND** 使用左侧全局导航栏

### Requirement: 底部导航栏导航项

底部导航栏必须包含三个主要导航项。

#### Scenario: 包含 Chat 导航项
- **WHEN** 底部导航栏渲染
- **THEN** 第一个导航项为 "Chat"
- **AND** 显示图标（MessageSquare from lucide-react）
- **AND** 显示文字标签 "聊天"
- **AND** 点击时导航到 `/chat` 路由

#### Scenario: 包含 Model 导航项
- **WHEN** 底部导航栏渲染
- **THEN** 第二个导航项为 "Model"
- **AND** 显示图标（Bot from lucide-react）
- **AND** 显示文字标签 "模型"
- **AND** 点击时导航到 `/model` 路由

#### Scenario: 包含 Setting 导航项
- **WHEN** 底部导航栏渲染
- **THEN** 第三个导航项为 "Setting"
- **AND** 显示图标（Settings from lucide-react）
- **AND** 显示文字标签 "设置"
- **AND** 点击时导航到 `/setting` 路由

### Requirement: 导航项布局和样式

底部导航栏的导航项必须使用一致的布局和样式。

#### Scenario: 导航项均匀分布
- **WHEN** 底部导航栏渲染
- **THEN** 三个导航项使用 `flex justify-around` 均匀分布
- **AND** 每个导航项占据相等宽度
- **AND** 使用 `items-center` 垂直居中

#### Scenario: 导航项使用图标+文字垂直布局
- **WHEN** 导航项渲染
- **THEN** 使用 `flex-col` 垂直布局
- **AND** 图标在上，文字在下
- **AND** 图标和文字之间使用 `gap-1` 间距

#### Scenario: 导航项激活状态高亮
- **WHEN** 用户在某个页面（如 /chat）
- **THEN** 对应的导航项（Chat）显示激活状态
- **AND** 激活状态使用不同颜色（如蓝色背景或文字颜色）
- **AND** 使用 `bg-primary/20` 或类似类

#### Scenario: 导航项悬停效果
- **WHEN** 用户悬停在导航项上
- **THEN** 显示悬停效果（如背景色变化）
- **AND** 使用 `hover:bg-accent` 类
- **AND** 过渡动画使用 `transition-colors`

### Requirement: 底部导航栏样式和主题

底部导航栏必须与应用整体样式保持一致。

#### Scenario: 底部导航栏背景色
- **WHEN** 底部导航栏渲染
- **THEN** 背景色为白色（`bg-white`）
- **AND** 顶部边框为灰色（`border-t border-gray-200`）
- **AND** 与应用整体风格一致

#### Scenario: 底部导航栏层级
- **WHEN** 底部导航栏渲染
- **THEN** 使用 `z-50` 确保在其他内容之上
- **AND** 避免被主内容区域遮挡

#### Scenario: 底部导航栏阴影效果
- **WHEN** 底部导航栏渲染
- **THEN** 可选添加顶部阴影（`shadow-[0_-2px_10px_rgba(0,0,0,0.1)]`）
- **AND** 增强视觉层次感

### Requirement: 主内容区域适配底部导航栏

主内容区域必须在 Mobile 模式下为底部导航栏预留空间。

#### Scenario: 主内容区域添加底部 padding
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 主内容区域添加 `pb-16`（64px）底部 padding
- **AND** 确保内容不被底部导航栏遮挡

#### Scenario: Desktop 和 Compressed 模式下无底部 padding
- **WHEN** `layoutMode` 为 'desktop' 或 'compressed'
- **THEN** 主内容区域无底部 padding
- **AND** 使用 `pb-0` 或默认值

#### Scenario: 滚动到底部时内容可见
- **WHEN** 用户滚动主内容区域到底部
- **THEN** 最后的内容完全可见
- **AND** 不被底部导航栏遮挡
- **AND** 底部 padding 确保足够的空白

### Requirement: 底部导航栏路由导航

底部导航栏必须正确处理路由导航。

#### Scenario: 点击导航项跳转到对应路由
- **WHEN** 用户点击 "Chat" 导航项
- **THEN** 使用 React Router 导航到 `/chat`
- **AND** 如果已在 `/chat` 路由，不重复导航
- **AND** 导航项显示激活状态

#### Scenario: 当前路由对应的导航项激活
- **WHEN** 用户在 `/model` 路由
- **THEN** "Model" 导航项显示激活状态
- **AND** 其他导航项显示非激活状态
- **AND** 激活状态通过 `useLocation()` 检测

#### Scenario: 导航到当前路由时不刷新页面
- **WHEN** 用户在 `/chat` 路由时点击 "Chat" 导航项
- **THEN** 页面不刷新
- **AND** 组件不重新挂载
- **AND** 避免不必要的渲染

### Requirement: 底部导航栏国际化支持

底部导航栏必须支持多语言。

#### Scenario: 导航项文字标签国际化
- **WHEN** 用户切换语言（如从中文切换到英文）
- **THEN** 导航项文字标签更新为对应语言
- **AND** "聊天" → "Chat"
- **AND** 使用 `useTranslation()` Hook

#### Scenario: 图标不随语言变化
- **WHEN** 用户切换语言
- **THEN** 导航项图标保持不变
- **AND** 图标不依赖语言设置

### Requirement: 底部导航栏可访问性

底部导航栏必须符合可访问性标准。

#### Scenario: 底部导航栏 ARIA 角色
- **WHEN** 底部导航栏渲染
- **THEN** 容器使用原生 `<nav>` 元素（隐式 `role="navigation"`）
- **AND** 有 `aria-label="底部导航"`，与 Sidebar 的"主导航"区分

#### Scenario: 导航项按钮可访问性
- **WHEN** 导航项按钮渲染
- **THEN** 每个按钮有 `aria-label` 描述（如 "导航到聊天"）
- **AND** 使用 `<button>` 元素（可键盘访问）
- **AND** 支持焦点样式

#### Scenario: 键盘导航支持
- **WHEN** 用户使用 Tab 键
- **THEN** 可以在导航项之间导航
- **AND** 焦点样式明显可见
- **AND** 支持焦点 trap（可选）

#### Scenario: 语义化查询可定位
- **WHEN** 测试中使用 `screen.getByRole('navigation', { name: '底部导航' })`
- **THEN** 能唯一匹配到底部导航栏组件
- **AND** 不会与 Sidebar 的 `<nav aria-label="主导航">` 混淆

### Requirement: 底部导航栏性能优化

底部导航栏必须确保良好的性能。

#### Scenario: 底部导航栏懒加载
- **WHEN** 应用初始化
- **THEN** 底部导航栏仅在 Mobile 模式下渲染
- **AND** Desktop/Compressed 模式下不渲染（`md:hidden`）
- **AND** 减少不必要的渲染

#### Scenario: 导航项按钮防抖
- **WHEN** 用户快速点击导航项
- **THEN** 不触发多次导航
- **AND** 使用防抖或节流（可选）
- **AND** 避免路由跳转过快

#### Scenario: 底部导航栏不阻塞主线程
- **WHEN** 底部导航栏渲染
- **THEN** 不阻塞主线程
- **AND** 使用 React.memo 优化（可选）
- **AND** 避免不必要的重新渲染

### Requirement: 底部导航栏和全局 Sidebar 的关系

底部导航栏和全局 Sidebar 必须在不同模式下正确显示。

**方案 A 实现**：所有 ≥768px 的模式（Desktop/Compact/Compressed）统一使用侧边导航栏，仅 Mobile 模式使用底部导航栏。

#### Scenario: Mobile 模式下只显示底部导航栏
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 全局 Sidebar 隐藏
- **AND** 底部导航栏显示
- **AND** 导航功能由底部导航栏提供

#### Scenario: Desktop、Compact 和 Compressed 模式下只显示全局 Sidebar
- **WHEN** `layoutMode` 为 'desktop' 或 'compact' 或 'compressed'
- **THEN** 全局 Sidebar 显示（左侧垂直导航）
- **AND** 底部导航栏隐藏
- **AND** 导航功能由全局 Sidebar 提供

#### Scenario: 导航功能一致性
- **WHEN** 在不同布局模式下
- **THEN** 导航功能保持一致（Chat/Model/Setting）
- **AND** 只是显示位置不同（左侧 vs 底部）
- **AND** 用户体验无缝切换

