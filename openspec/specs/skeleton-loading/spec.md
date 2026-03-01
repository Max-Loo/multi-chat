# Spec: Skeleton Loading

## ADDED Requirements

### Requirement: ModelSelect 组件骨架屏
系统必须在 ModelSelect 组件懒加载时显示与实际组件布局匹配的骨架屏。

#### Scenario: ModelSelect 骨架屏显示正确的结构布局
- **WHEN** 用户进入聊天页面且该聊天未配置模型时
- **THEN** 系统显示包含以下元素的骨架屏：
  - 顶部操作栏区域（高度与实际操作栏一致）
  - 已选模型标签预览区域（左侧）
  - 确认按钮和搜索框区域（右侧）
  - 数据表格区域（模拟表格行和列结构）

#### Scenario: ModelSelect 骨架屏加载完成后切换到实际组件
- **WHEN** ModelSelect 组件代码加载完成
- **THEN** 系统将骨架屏替换为实际的 ModelSelect 组件
- **AND** 切换过程无闪烁或视觉跳动

### Requirement: ChatPanel 组件骨架屏
系统必须在 ChatPanel 组件懒加载时显示与实际组件布局匹配的骨架屏。

#### Scenario: ChatPanel 骨架屏显示正确的结构布局
- **WHEN** 用户进入聊天页面且该聊天已配置模型
- **THEN** 系统显示包含以下元素的骨架屏：
  - 头部控制区域（列数控制、分割器开关）
  - 聊天消息内容区域（模拟消息气泡布局）
  - 底部发送框区域（输入框和发送按钮）

#### Scenario: ChatPanel 骨架屏支持多列布局预览
- **WHEN** 聊天配置了多个模型（列数 > 1）
- **THEN** 骨架屏应显示相应数量的消息列
- **AND** 每列的骨架屏结构应独立显示

#### Scenario: ChatPanel 骨架屏加载完成后切换到实际组件
- **WHEN** ChatPanel 组件代码加载完成
- **THEN** 系统将骨架屏替换为实际的 ChatPanel 组件
- **AND** 切换过程无闪烁或视觉跳动

### Requirement: 骨架屏组件复用性
骨架屏组件应使用 shadcn/ui 的 Skeleton 基础组件构建，保持与项目 UI 风格一致。

#### Scenario: 骨架屏使用统一的 Skeleton 基础组件
- **WHEN** 开发者创建 ModelSelectSkeleton 或 ChatPanelSkeleton
- **THEN** 必须使用 `@/components/ui/skeleton` 的 Skeleton 组件
- **AND** 骨架屏的动画效果应与 FullscreenLoading 保持一致（使用 pulse 动画）

#### Scenario: 骨架屏不影响现有加载组件
- **WHEN** 其他组件继续使用 FullscreenLoading
- **THEN** FullscreenLoading 的行为和样式保持不变
- **AND** 不影响其他使用 FullscreenLoading 的场景

### Requirement: 懒加载集成
骨架屏必须正确集成到 React Suspense 的 fallback 机制中。

#### Scenario: ChatContent 正确使用 ModelSelectSkeleton
- **WHEN** ChatContent 渲染 ModelSelect 的 Suspense 边界
- **THEN** fallback 属性应为 `<ModelSelectSkeleton />` 组件
- **AND** 不应再使用 `<FullscreenLoading />`

#### Scenario: ChatContent 正确使用 ChatPanelSkeleton
- **WHEN** ChatContent 渲染 ChatPanel 的 Suspense 边界
- **THEN** fallback 属性应为 `<ChatPanelSkeleton />` 组件
- **AND** 不应再使用 `<FullscreenLoading />`
