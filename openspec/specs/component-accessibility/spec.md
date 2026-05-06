# Spec: 组件无障碍性

## Purpose

定义组件级别的无障碍（Accessibility）要求，确保所有交互元素、导航区域、状态展示对辅助技术（屏幕阅读器等）友好可访问。

## Requirements

### Requirement: 可点击容器须有无障碍交互支持
使用 `<div>` 或 `<span>` 实现的可点击交互容器 SHALL 添加 `tabIndex={0}` 并处理 Enter/Space 键盘事件。当容器内部不包含其他交互元素时，SHALL 添加 `role="button"`；当容器内部包含其他交互元素（如按钮、下拉菜单）时，SHALL NOT 添加 `role="button"`，改为通过 `aria-selected` 等全局属性表达状态（`role="button"` 与 `<button>` 有相同的交互元素嵌套限制）。

#### Scenario: 不含嵌套交互元素的可点击容器
- **WHEN** 可点击容器内部不包含按钮、下拉菜单等交互元素
- **THEN** SHALL 添加 `role="button"` 和 `tabIndex={0}`
- **THEN** SHALL 处理 `onKeyDown` 中的 Enter 和 Space 键

#### Scenario: 含嵌套交互元素的可点击容器
- **WHEN** 可点击容器内部包含按钮、下拉菜单等交互元素（如聊天列表项包含 DropdownMenu）
- **THEN** SHALL NOT 添加 `role="button"`（避免嵌套交互元素违反 ARIA 规则）
- **THEN** SHALL 添加 `tabIndex={0}` 和 `onKeyDown`（Enter/Space 触发 onClick）
- **THEN** SHALL 通过 `aria-selected` 等全局属性表达组件状态

### Requirement: 导航区域使用语义化元素
导航区域 SHALL 使用 `<nav>` 语义元素并设置 `aria-label`。当前活跃导航项 SHALL 设置 `aria-current="page"`。`aria-label` 的值 SHALL 通过 i18n 翻译函数获取，SHALL NOT 硬编码。

#### Scenario: 侧边栏导航
- **WHEN** 侧边栏包含主导航链接
- **THEN** 外层容器 SHALL 使用 `<nav>` 元素
- **THEN** SHALL 设置 `aria-label` 通过 `t()` 获取翻译文本（如 `t($ => $.common.a11y.mainNav)`）
- **THEN** 活跃导航项 SHALL 设置 `aria-current="page"`

#### Scenario: 设置页面侧栏导航
- **WHEN** 设置页面有分类导航列表
- **THEN** SHALL 使用 `<nav>` 元素包裹导航列表
- **THEN** 活跃项 SHALL 设置 `aria-current="page"`

### Requirement: 页面布局 landmark 角色
页面布局 SHALL 使用 landmark role 或语义化元素标识主要区域。

#### Scenario: 主内容区域
- **WHEN** 页面有主内容展示区域
- **THEN** SHALL 使用 `<main>` 元素或 `role="main"`

#### Scenario: 侧栏辅助区域
- **WHEN** 页面有辅助性侧栏（如聊天列表、模型列表）
- **THEN** SHALL 使用 `<aside>` 元素或 `role="complementary"` 并设置 `aria-label`

### Requirement: 聊天消息区域使用 log 角色
聊天消息滚动容器 SHALL 设置 `role="log"` 和 `aria-label`，使屏幕阅读器能识别实时更新的消息区域。`aria-label` SHALL 通过 i18n 翻译函数获取。

#### Scenario: 聊天面板消息列表
- **WHEN** 聊天面板渲染消息列表
- **THEN** 消息滚动容器 SHALL 设置 `role="log"` 和 `aria-label` 通过 `t()` 获取翻译文本

### Requirement: 错误状态使用 alert 角色
全屏错误状态或关键错误提示 SHALL 设置 `role="alert"`。

#### Scenario: 无可用提供者错误页面
- **WHEN** 用户未配置任何模型提供者
- **THEN** 错误页面容器 SHALL 设置 `role="alert"`

### Requirement: 骨架屏组件对辅助技术隐藏
所有骨架屏（Skeleton）加载组件 SHALL 设置 `aria-hidden="true"` 以避免屏幕阅读器朗读无意义内容。

#### Scenario: 骨架屏装饰元素
- **WHEN** 渲染骨架屏加载占位符
- **THEN** 最外层容器 SHALL 设置 `aria-hidden="true"`

### Requirement: 可展开内容须有 aria-expanded
可展开/折叠的交互元素 SHALL 设置 `aria-expanded` 属性。

#### Scenario: 思考过程展开折叠
- **WHEN** 思考过程区域有展开/折叠按钮
- **THEN** 按钮 SHALL 设置 `aria-expanded={isExpanded}`

#### Scenario: 提供者卡片展开详情
- **WHEN** 提供者卡片可展开查看详情
- **THEN** 卡片 SHALL 设置 `aria-expanded={isExpanded}`

### Requirement: 图标按钮须有 aria-label
仅包含图标的按钮（无可见文本） SHALL 设置 `aria-label` 描述按钮功能。`aria-label` 的文本 SHALL 通过 i18n 翻译函数获取，SHALL NOT 硬编码。

#### Scenario: 菜单触发器按钮
- **WHEN** 按钮仅包含图标（如三点菜单、加号、减号）
- **THEN** SHALL 设置 `aria-label` 描述功能
- **THEN** `aria-label` 的值 SHALL 通过 `t()` 翻译函数获取
- **THEN** SHALL NOT 使用硬编码中文字符串

#### Scenario: 滚动到底部按钮
- **WHEN** 聊天面板有"滚动到底部"按钮
- **THEN** SHALL 设置 `aria-label` 通过 i18n 获取文本

#### Scenario: 错误图标
- **WHEN** 错误提示中的图标使用 `role="img"`
- **THEN** `aria-label` SHALL 通过 i18n 获取文本
- **THEN** SHALL NOT 使用硬编码字符串

### Requirement: 初始化加载状态须有 aria-live
应用初始化过程的加载状态 SHALL 设置 `role="status"` 和 `aria-live="polite"`。

#### Scenario: 初始化进度显示
- **WHEN** 应用显示初始化加载进度
- **THEN** 进度容器 SHALL 设置 `role="status"` 和 `aria-live="polite"`
- **THEN** 进度百分比 SHALL 有可访问的文本描述

### Requirement: 页面区域 landmark 的 aria-label 国际化
所有使用 `<aside>` 或 landmark role 的区域 SHALL 设置 `aria-label`，且值 SHALL 通过 i18n 翻译函数获取。涉及区域包括：聊天列表、模型供应商列表、设置导航、模型供应商导航、底部导航、聊天消息详情。

#### Scenario: 聊天列表侧栏
- **WHEN** 聊天页面渲染侧栏区域
- **THEN** `<aside>` 元素 SHALL 设置 `aria-label` 通过 i18n 获取翻译文本

#### Scenario: 模型供应商侧栏
- **WHEN** 创建模型页面渲染供应商列表
- **THEN** `<aside>` 元素 SHALL 设置 `aria-label` 通过 i18n 获取翻译文本

#### Scenario: 聊天消息气泡
- **WHEN** 渲染用户消息或助手消息气泡
- **THEN** 消息容器 SHALL 设置 `aria-label` 通过 i18n 获取翻译文本（区分用户/助手）

### Requirement: 可点击容器使用共享键盘激活处理器
使用 `<div>` 模拟按钮行为的可点击容器 SHALL 使用 `handleActivationKeyDown` 工具函数处理 Enter/Space 键盘事件，SHALL NOT 内联手写键盘处理逻辑。

#### Scenario: 聊天列表项键盘交互
- **WHEN** 聊天列表项使用 `<div>` 实现点击交互
- **THEN** SHALL 使用 `handleActivationKeyDown(callback)` 处理键盘事件
- **AND** SHALL NOT 内联 `if (e.key === 'Enter' || e.key === ' ')` 逻辑

#### Scenario: 提供者卡片键盘交互
- **WHEN** 提供者卡片使用 `<div>` 实现展开/折叠交互
- **THEN** SHALL 使用 `handleActivationKeyDown(callback)` 处理键盘事件
- **AND** SHALL NOT 内联键盘事件处理逻辑
