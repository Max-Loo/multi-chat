## ADDED Requirements

### Requirement: AnimatedLogo 组件测试覆盖

AnimatedLogo 组件的测试 SHALL 验证以下行为：

- 组件渲染时创建 Canvas 元素
- 当系统设置 `prefers-reduced-motion` 时，不启动动画循环，仅渲染静态帧
- 组件卸载时 SHALL 清理动画帧和事件监听器
- 高 DPI 显示时 SHALL 正确缩放 Canvas

#### Scenario: 正常渲染 Canvas 动画

- **WHEN** AnimatedLogo 组件挂载且未设置 reduced-motion
- **THEN** 组件 SHALL 渲染一个 Canvas 元素并启动 requestAnimationFrame 循环

#### Scenario: reduced-motion 模式

- **WHEN** 系统偏好设置为 `prefers-reduced-motion: reduce`
- **THEN** 组件 SHALL 渲染 Canvas 但仅绘制静态帧，不启动动画循环

#### Scenario: 组件卸载清理

- **WHEN** AnimatedLogo 组件卸载
- **THEN** SHALL 取消所有 pending 的 animationFrame 并移除 ResizeObserver

### Requirement: canvas-logo 纯函数测试覆盖

canvas-logo.ts 中的纯函数 SHALL 验证以下行为：

- `createInitialState()` 返回正确的初始动画状态
- `updateState()` 根据时间差正确更新动画状态
- `calculateScale()` 根据容器尺寸返回正确的缩放比例

#### Scenario: 初始状态创建

- **WHEN** 调用 `createInitialState()`
- **THEN** SHALL 返回包含 eyeBrightness、bubbleDotsPhase、typingPhase 等字段的初始状态对象

#### Scenario: 缩放计算

- **WHEN** 给定容器宽度和高度调用 `calculateScale()`
- **THEN** SHALL 返回基于画布尺寸的正确缩放比例

### Requirement: FilterInput 组件测试覆盖

FilterInput 组件的测试 SHALL 验证以下行为：

- 渲染带有搜索图标的输入框
- 支持自定义 placeholder（默认使用 i18n 翻译）
- value 变化时触发 onChange 回调
- 支持 autoFocus 属性

#### Scenario: 渲染与交互

- **WHEN** FilterInput 渲染并传入 value、onChange
- **THEN** SHALL 显示输入框和搜索图标，输入时触发 onChange

#### Scenario: 自定义 placeholder

- **WHEN** 传入自定义 placeholder prop
- **THEN** SHALL 显示自定义 placeholder 而非默认翻译文本

### Requirement: OpenExternalBrowserButton 组件测试覆盖

OpenExternalBrowserButton 组件的测试 SHALL 验证以下行为：

- 当 `siteUrl` 为 undefined 时返回 null
- 当 `siteUrl` 有值时渲染按钮
- 点击时调用 `useNavigateToExternalSite` hook 的导航函数

#### Scenario: 无 URL 时不渲染

- **WHEN** siteUrl 为 undefined
- **THEN** 组件 SHALL 不渲染任何可见元素

#### Scenario: 有 URL 时点击导航

- **WHEN** siteUrl 为 "https://example.com" 且用户点击按钮
- **THEN** SHALL 调用导航函数并传入 "https://example.com"

### Requirement: ProviderLogo 组件测试覆盖

ProviderLogo 组件的测试 SHALL 验证以下行为：

- 图片加载成功时显示带 fade-in 效果的图片
- 图片加载失败时回退显示首字母
- 5 秒超时后回退显示首字母
- providerKey 变化时重置状态

#### Scenario: 图片加载成功

- **WHEN** 图片 URL 有效且加载完成
- **THEN** SHALL 显示图片并应用 fade-in 过渡效果

#### Scenario: 图片加载失败回退

- **WHEN** 图片加载触发 error 事件
- **THEN** SHALL 显示 provider 名称的首字母（大写）

#### Scenario: 加载超时回退

- **WHEN** 图片加载超过 5 秒
- **THEN** SHALL 回退显示首字母

### Requirement: Skeleton 系列组件测试覆盖

Skeleton 组件（PageSkeleton、SkeletonList、SkeletonMessage）的测试 SHALL 验证以下行为：

- PageSkeleton 在移动端和桌面端渲染不同布局结构
- SkeletonList 渲染指定数量的骨架项，支持自定义高度和间距
- SkeletonMessage 根据 isSelf 切换布局方向，渲染指定行数的骨架文本

#### Scenario: SkeletonList 数量控制

- **WHEN** 传入 count={3}
- **THEN** SHALL 渲染 3 个骨架项

#### Scenario: SkeletonMessage 自身消息布局

- **WHEN** isSelf=true 且 lines=3
- **THEN** SHALL 使用 flex-row-reverse 布局并渲染 3 行文本骨架

#### Scenario: PageSkeleton 响应式

- **WHEN** isMobile=true
- **THEN** SHALL 渲染移动端布局（无侧边栏）
