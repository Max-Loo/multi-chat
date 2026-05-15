## MODIFIED Requirements

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

### Requirement: 聊天消息区域使用 log 角色
聊天消息滚动容器 SHALL 设置 `role="log"` 和 `aria-label`，使屏幕阅读器能识别实时更新的消息区域。`aria-label` SHALL 通过 i18n 翻译函数获取。

#### Scenario: 聊天面板消息列表
- **WHEN** 聊天面板渲染消息列表
- **THEN** 消息滚动容器 SHALL 设置 `role="log"` 和 `aria-label` 通过 `t()` 获取翻译文本

### Requirement: 图标按钮须有 aria-label
仅包含图标的按钮（无可见文本） SHALL 设置 `aria-label` 描述按钮功能。`aria-label` 的文本 SHALL 通过 i18n 翻译函数获取，SHALL NOT 硬编码。

#### Scenario: 菜单触发器按钮
- **WHEN** 按钮仅包含图标（如三点菜单、加号、减号）
- **THEN** SHALL 设置 `aria-label` 描述功能
- **THEN** `aria-label` 的值 SHALL 通过 `t()` 翻译函数获取
- **THEN** SHALL NOT 使用硬编码中文字符串

#### Scenario: 错误图标
- **WHEN** 错误提示中的图标使用 `role="img"`
- **THEN** `aria-label` SHALL 通过 i18n 获取文本
- **THEN** SHALL NOT 使用硬编码字符串

## ADDED Requirements

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
