# 错误处理 UI 组件测试规格

## ADDED Requirements

### Requirement: NoProvidersAvailable 组件必须验证错误信息展示
NoProvidersAvailable 组件必须在无可用模型供应商时显示友好的错误提示。

#### Scenario: 渲染错误提示信息
- **WHEN** 渲染 NoProvidersAvailable 组件
- **THEN** 必须显示错误标题（如 "无可用模型供应商"）
- **THEN** 必须显示错误描述（如 "请检查网络连接或稍后重试"）
- **THEN** 必须显示错误图标或插图

#### Scenario: 错误信息支持国际化
- **WHEN** 应用语言为中文
- **THEN** 错误信息必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** 错误信息必须显示英文文本

#### Scenario: 组件必须正确渲染样式
- **WHEN** 渲染 NoProvidersAvailable 组件
- **THEN** 错误容器必须有正确的样式类名
- **THEN** 错误图标必须可见
- **THEN** 文本必须可读且布局合理

### Requirement: NoProvidersAvailable 组件必须验证 reload 功能
NoProvidersAvailable 组件必须提供重新加载按钮，允许用户刷新供应商列表。

#### Scenario: 点击重新加载按钮触发回调
- **WHEN** 用户点击"重新加载"按钮
- **THEN** 必须调用 onReload 回调
- **THEN** 按钮应显示加载状态（如果提供 loading prop）

#### Scenario: 重新加载按钮必须有正确的文本
- **WHEN** 渲染 NoProvidersAvailable 组件
- **THEN** 按钮必须显示"重新加载"或类似文本
- **THEN** 按钮文本必须支持国际化

#### Scenario: 加载状态下禁用重新加载按钮
- **WHEN** isLoading prop 为 true
- **THEN** 重新加载按钮必须禁用
- **THEN** 按钮应显示加载指示器（如 spinner）

### Requirement: NoProvidersAvailable 组件必须验证可访问性
NoProvidersAvailable 组件必须符合基本的可访问性标准。

#### Scenario: 错误信息必须对屏幕阅读器可读
- **WHEN** 渲染 NoProvidersAvailable 组件
- **THEN** 错误信息必须有正确的 ARIA 属性（如 role="alert"）
- **THEN** 屏幕阅读器必须能读取错误内容

#### Scenario: 重新加载按钮必须可键盘访问
- **WHEN** 用户使用 Tab 键导航
- **THEN** 重新加载按钮必须可获得焦点
- **WHEN** 按钮获得焦点时按 Enter 或 Space
- **THEN** 必须触发 onReload 回调

### Requirement: ModelProviderDisplay 组件必须验证正常状态渲染
ModelProviderDisplay 组件必须在有供应商图标时显示图标和名称。

#### Scenario: 渲染带图标的供应商
- **WHEN** 渲染 ModelProviderDisplay 组件
- **AND** props 包含 providerName="DeepSeek" 和 iconUrl="https://..."
- **THEN** 必须显示供应商图标
- **THEN** 必须显示供应商名称 "DeepSeek"
- **THEN** 图标必须加载正确

#### Scenario: 图标加载失败时显示默认图标
- **WHEN** 渲染 ModelProviderDisplay 组件
- **AND** iconUrl 指向的图片无法加载
- **THEN** 必须显示默认图标或占位符
- **THEN** 供应商名称仍必须显示

#### Scenario: 多个供应商组件应独立渲染
- **WHEN** 同时渲染多个 ModelProviderDisplay 组件
- **THEN** 每个组件必须显示各自的供应商信息
- **THEN** 组件之间不应相互影响

### Requirement: ModelProviderDisplay 组件必须验证降级状态渲染
ModelProviderDisplay 组件必须在无图标时仅显示文本。

#### Scenario: 无图标时仅显示供应商名称
- **WHEN** 渲染 ModelProviderDisplay 组件
- **AND** props 不包含 iconUrl 或 iconUrl 为空
- **THEN** 必须不渲染图标元素
- **THEN** 必须仅显示供应商名称文本
- **THEN** 文本样式必须正确

#### Scenario: 图标 URL 为 null 或 undefined
- **WHEN** iconUrl prop 为 null
- **THEN** 必须仅显示供应商名称
- **WHEN** iconUrl prop 为 undefined
- **THEN** 必须仅显示供应商名称

### Requirement: ModelProviderDisplay 组件必须验证 Redux selector
ModelProviderDisplay 组件必须通过 Redux selector 获取供应商数据。

#### Scenario: 组件必须从 Redux store 读取供应商数据
- **WHEN** Redux store 更新供应商信息
- **THEN** 组件必须重新渲染以反映新的供应商数据
- **THEN** 不应保留旧的供应商数据

#### Scenario: 组件必须使用 useSelector hook
- **WHEN** 渲染 ModelProviderDisplay 组件
- **THEN** 必须使用 useSelector 从 Redux store 读取数据
- **THEN** selector 必须正确选择供应商数据

### Requirement: ErrorAlert 组件必须验证错误信息展示
ErrorAlert 组件必须显示错误标题和描述。

#### Scenario: 渲染错误标题和描述
- **WHEN** 渲染 ErrorAlert 组件
- **AND** props 包含 title="错误" 和 message="操作失败"
- **THEN** 必须显示错误标题 "错误"
- **THEN** 必须显示错误描述 "操作失败"
- **THEN** 必须显示错误图标

#### Scenario: 错误信息支持国际化
- **WHEN** 应用语言为中文
- **THEN** 错误信息必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** 错误信息必须显示英文文本

#### Scenario: 可选的错误描述
- **WHEN** 渲染 ErrorAlert 组件
- **AND** props 不包含 message 或 message 为空
- **THEN** 必须仅显示错误标题
- **THEN** 不应显示描述区域

### Requirement: ErrorAlert 组件必须验证重试按钮
ErrorAlert 组件必须提供重试按钮（如果提供 onRetry 回调）。

#### Scenario: 渲染重试按钮
- **WHEN** 渲染 ErrorAlert 组件
- **AND** props 包含 onRetry 回调
- **THEN** 必须显示"重试"按钮
- **THEN** 按钮文本必须支持国际化

#### Scenario: 点击重试按钮触发回调
- **WHEN** 用户点击"重试"按钮
- **THEN** 必须调用 onRetry 回调
- **THEN** 不应触发其他回调

#### Scenario: 无重试回调时不显示按钮
- **WHEN** 渲染 ErrorAlert 组件
- **AND** props 不包含 onRetry 回调
- **THEN** 不应渲染重试按钮
- **THEN** 仅显示错误信息

#### Scenario: 重试按钮必须有正确的样式
- **WHEN** 渲染 ErrorAlert 组件
- **THEN** 重试按钮必须有主要按钮样式
- **THEN** 按钮必须可点击
- **THEN** 按钮必须有 hover 状态

### Requirement: ErrorAlert 组件必须验证关闭功能
ErrorAlert 组件必须允许用户关闭错误提示（如果提供 onClose 回调）。

#### Scenario: 渲染关闭按钮
- **WHEN** 渲染 ErrorAlert 组件
- **AND** props 包含 onClose 回调
- **THEN** 必须显示关闭按钮（X 图标）
- **THEN** 关闭按钮位置必须合理（如右上角）

#### Scenario: 点击关闭按钮触发回调
- **WHEN** 用户点击关闭按钮
- **THEN** 必须调用 onClose 回调
- **THEN** 不应触发 onRetry 回调

#### Scenario: 无关闭回调时不显示关闭按钮
- **WHEN** 渲染 ErrorAlert 组件
- **AND** props 不包含 onClose 回调
- **THEN** 不应渲染关闭按钮

#### Scenario: 关闭按钮必须有正确的样式
- **WHEN** 渲染 ErrorAlert 组件
- **THEN** 关闭按钮必须有图标按钮样式
- **THEN** 按钮必须可点击
- **THEN** 按钮必须有 hover 状态

### Requirement: NotFound 组件必须验证页面渲染
NotFound 组件必须在 404 错误时显示友好的提示页面。

#### Scenario: 渲染 404 页面
- **WHEN** 渲染 NotFound 组件
- **THEN** 必须显示 "404" 大号数字或文本
- **THEN** 必须显示 "页面未找到" 或类似标题
- **THEN** 必须显示错误描述（如 "您访问的页面不存在"）
- **THEN** 必须显示 404 插图或图标

#### Scenario: 页面必须有正确的布局
- **WHEN** 渲染 NotFound 组件
- **THEN** 内容必须垂直和水平居中
- **THEN** 页面必须有适当的内边距和外边距
- **THEN** 响应式布局必须正确（移动端和桌面端）

#### Scenario: 页面样式必须美观
- **WHEN** 渲染 NotFound 组件
- **THEN** 必须使用主题颜色
- **THEN** 文本必须有良好的可读性
- **THEN** 必须有适当的间距

### Requirement: NotFound 组件必须验证导航按钮
NotFound 组件必须提供导航按钮，允许用户返回首页或上一页。

#### Scenario: 渲染"返回首页"按钮
- **WHEN** 渲染 NotFound 组件
- **THEN** 必须显示"返回首页"按钮
- **THEN** 按钮文本必须支持国际化

#### Scenario: 点击"返回首页"按钮导航
- **WHEN** 用户点击"返回首页"按钮
- **THEN** 必须导航到首页（/ 路径）
- **THEN** 必须使用 React Router 的 navigate 函数

#### Scenario: 渲染"返回上一页"按钮
- **WHEN** 渲染 NotFound 组件
- **AND** 浏览器历史记录中有上一页
- **THEN** 必须显示"返回上一页"按钮
- **THEN** 按钮文本必须支持国际化

#### Scenario: 点击"返回上一页"按钮导航
- **WHEN** 用户点击"返回上一页"按钮
- **THEN** 必须导航到浏览器历史记录的上一页
- **THEN** 必须使用 navigate(-1) 函数

### Requirement: NotFound 组件必须验证国际化文本
NotFound 组件的所有文本必须支持国际化。

#### Scenario: 页面标题支持国际化
- **WHEN** 应用语言为中文
- **THEN** 页面标题必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** 页面标题必须显示英文文本

#### Scenario: 页面描述支持国际化
- **WHEN** 应用语言为中文
- **THEN** 页面描述必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** 页面描述必须显示英文文本

#### Scenario: 按钮文本支持国际化
- **WHEN** 应用语言为中文
- **THEN** 按钮文本必须显示中文文本
- **WHEN** 应用语言切换为英文
- **THEN** 按钮文本必须显示英文文本

### Requirement: NotFound 组件必须验证可访问性
NotFound 组件必须符合基本的可访问性标准。

#### Scenario: 404 信息必须对屏幕阅读器可读
- **WHEN** 渲染 NotFound 组件
- **THEN** 页面必须有正确的语义化 HTML（如 main、h1）
- **THEN** 屏幕阅读器必须能读取 404 信息

#### Scenario: 导航按钮必须可键盘访问
- **WHEN** 用户使用 Tab 键导航
- **THEN** 导航按钮必须可获得焦点
- **WHEN** 按钮获得焦点时按 Enter 或 Space
- **THEN** 必须触发导航

#### Scenario: 页面必须有正确的 ARIA 属性
- **WHEN** 渲染 NotFound 组件
- **THEN** 页面必须有 role="main" 属性
- **THEN** 标题必须有正确的 aria-label
