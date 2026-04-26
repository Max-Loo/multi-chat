## ADDED Requirements

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
导航区域 SHALL 使用 `<nav>` 语义元素并设置 `aria-label`。当前活跃导航项 SHALL 设置 `aria-current="page"`。

#### Scenario: 侧边栏导航
- **WHEN** 侧边栏包含主导航链接
- **THEN** 外层容器 SHALL 使用 `<nav>` 元素
- **THEN** SHALL 设置 `aria-label="主导航"`（或对应 i18n 文本）
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
聊天消息滚动容器 SHALL 设置 `role="log"` 和 `aria-label`，使屏幕阅读器能识别实时更新的消息区域。

#### Scenario: 聊天面板消息列表
- **WHEN** 聊天面板渲染消息列表
- **THEN** 消息滚动容器 SHALL 设置 `role="log"` 和 `aria-label="聊天消息"`（或对应 i18n 文本）

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
仅包含图标的按钮（无可见文本） SHALL 设置 `aria-label` 描述按钮功能。

#### Scenario: 菜单触发器按钮
- **WHEN** 按钮仅包含图标（如三点菜单、加号、减号）
- **THEN** SHALL 设置 `aria-label` 描述功能（如 `"更多操作"`、`"增加列数"`、`"减少列数"`）

#### Scenario: 滚动到底部按钮
- **WHEN** 聊天面板有"滚动到底部"按钮
- **THEN** SHALL 设置 `aria-label="滚动到底部"`（或对应 i18n 文本）

### Requirement: 初始化加载状态须有 aria-live
应用初始化过程的加载状态 SHALL 设置 `role="status"` 和 `aria-live="polite"`。

#### Scenario: 初始化进度显示
- **WHEN** 应用显示初始化加载进度
- **THEN** 进度容器 SHALL 设置 `role="status"` 和 `aria-live="polite"`
- **THEN** 进度百分比 SHALL 有可访问的文本描述
