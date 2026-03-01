# Design: Chat Content Skeleton Loading

## Context

当前 ChatContent 组件在懒加载 ModelSelect 和 ChatPanel 时使用通用的 FullscreenLoading 组件作为 fallback。FullscreenLoading 是一个简单的全屏加载组件，只包含一个圆形脉冲动画和加载文本，不反映实际组件的内容结构。

**现有实现：**
- `src/pages/Chat/components/ChatContent/index.tsx` 的两处 Suspense 使用 `<FullscreenLoading />`
- FullscreenLoading 位于 `src/components/FullscreenLoading/index.tsx`，使用 shadcn/ui 的 Skeleton 组件

**组件结构分析：**
- **ModelSelect**: 顶部操作栏（已选模型标签、确认按钮、搜索框）+ 数据表格
- **ChatPanel**: 头部（聊天名称、列数控制、分割器开关）+ 聊天内容区域（多列消息气泡）+ 发送框（文本输入框、发送按钮）

## Goals / Non-Goals

**Goals:**
- 为 ModelSelect 和 ChatPanel 创建结构匹配的骨架屏组件
- 保持与项目现有 UI 风格一致（使用 shadcn/ui Skeleton 组件）
- 无缝集成到现有的 Suspense fallback 机制
- 不影响其他使用 FullscreenLoading 的场景

**Non-Goals:**
- 不修改 FullscreenLoading 组件的实现
- 不改变懒加载策略（仍使用 React.lazy 和 Suspense）
- 不实现骨架屏的动态内容（仅静态结构模拟）
- 不涉及 API 交互或数据流的修改

## Decisions

### 1. 骨架屏组件位置和命名

**决策**: 在各自的实际组件同目录下创建骨架屏组件

**理由**:
- 保持代码内聚性，骨架屏与实际组件在同一目录
- 便于同步维护：当实际组件布局变化时，骨架屏也容易更新
- 遵循项目现有的组件组织结构

**文件位置**:
- `src/pages/Chat/components/ChatContent/components/ModelSelectSkeleton.tsx`
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSkeleton.tsx`

### 2. 骨架屏结构详细程度

**决策**: 模拟主要结构元素，不过度细节化

**理由**:
- 过度细节化的骨架屏会增加维护成本（实际组件每次布局变化都需要同步更新骨架屏）
- 主要结构元素已足以提供良好的用户体验，让用户预知即将显示的内容类型
- 简化骨架屏减少代码复杂度

**ModelSelect 骨架屏结构**:
- 顶部操作栏（h-12 高度）
  - 左侧：2-3 个模拟 Badge（已选模型标签）
  - 右侧：1 个模拟 Button（确认按钮）+ 1 个模拟 Input（搜索框）
- 数据表格区域：3-5 行模拟表格行

**ChatPanel 骨架屏结构**:
- 头部（h-12 高度）：
  - 左侧：1 个模拟文本（聊天名称）
  - 右侧：1 个模拟 Switch + 1 个模拟 Input + 2 个模拟 Button（列数控制）
- 内容区域（flex-grow）：
  - 根据聊天模型数量显示相应数量的列
  - 每列显示 2-3 个模拟消息气泡（不同宽度的矩形）
- 发送框区域：
  - 1 个模拟 Textarea + 1 个圆形 Button（发送按钮）

### 3. 多列布局的骨架屏实现

**决策**: 使用 CSS Grid 或 Flexbox 动态渲染多列骨架屏

**理由**:
- ChatPanel 支持多列布局（基于 `chatModelList.length` 和 `columnCount`）
- 骨架屏应反映实际组件的列数配置
- 使用响应式布局确保与实际组件的视觉效果一致

**实现方式**:
- 接收 `columnCount` 参数（可选，默认为 1）
- 使用 `grid-cols-${columnCount}` 或动态 `style={{ gridTemplateColumns: ... }}`
- 每列独立显示消息气泡骨架

### 4. 骨架屏动画效果

**决策**: 使用 shadcn/ui Skeleton 的默认 pulse 动画

**理由**:
- 与 FullscreenLoading 的动画效果保持一致
- shadcn/ui Skeleton 已配置了合适的 pulse 动画（`animate-pulse`）
- 无需额外的动画逻辑，降低复杂度

## Risks / Trade-offs

### Risk 1: 实际组件布局变化导致骨架屏不一致
**风险**: 当 ModelSelect 或 ChatPanel 的布局结构发生变化时，骨架屏可能无法及时同步更新，导致加载状态与实际组件不匹配。

**缓解措施**:
- 在骨架屏组件顶部添加注释，提示开发者维护骨架屏与实际组件的一致性
- 在代码审查中检查骨架屏是否与实际组件布局匹配
- 保持骨架屏结构简单，减少同步维护的复杂度

### Risk 2: 骨架屏加载时间过短或过长
**风险**:
- 加载时间过短：骨架屏一闪而过，用户体验无明显改善
- 加载时间过长：骨架屏显示时间过长，用户等待焦虑

**缓解措施**:
- 骨架屏由 React Suspense 自动控制显示/隐藏，无需手动管理时长
- 优化懒加载组件的代码分割策略，确保合理的加载时间
- 如果加载时间过短，骨架屏的快速切换也比全屏加载动画更自然

### Trade-off: 骨架屏维护成本
**权衡**: 创建专用骨架屏增加了代码量和维护成本，但显著改善了用户体验。

**决策**: 接受这个权衡，理由是：
- 骨架屏组件简单，维护成本低
- 用户体验改善显著（提供内容预览）
- 代码复用性高（使用统一的 Skeleton 基础组件）

## Migration Plan

### 实施步骤

1. **创建 ModelSelectSkeleton 组件**
   - 文件：`src/pages/Chat/components/ChatContent/components/ModelSelectSkeleton.tsx`
   - 导出：`export default ModelSelectSkeleton`

2. **创建 ChatPanelSkeleton 组件**
   - 文件：`src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSkeleton.tsx`
   - 导出：`export default ChatPanelSkeleton`
   - 接收 `columnCount` 参数（可选，默认为 1）

3. **修改 ChatContent 组件**
   - 导入新的骨架屏组件
   - 替换第一处 Suspense fallback：`<Suspense fallback={<ModelSelectSkeleton />}>`
   - 替换第二处 Suspense fallback：`<Suspense fallback={<ChatPanelSkeleton />}>`

4. **测试**
   - 验证骨架屏在组件加载时正确显示
   - 验证骨架屏在组件加载完成后正确切换
   - 验证多列布局的 ChatPanel 骨架屏正确显示
   - 验证其他使用 FullscreenLoading 的场景不受影响

### 回滚策略

如果发现重大问题，可以通过简单的 Git revert 回滚到使用 FullscreenLoading 的版本。骨架屏组件文件可以保留（不影响回滚后的功能），或一并删除。

## Open Questions

1. **ChatPanelSkeleton 是否需要接收 `chatModelList` 参数以确定列数？**
   - **初步想法**: 接收 `columnCount` 参数即可，无需完整的 `chatModelList`
   - **待确认**: 是否需要在骨架屏中模拟列数控制 UI（Switch、Input、Button）

2. **是否需要为骨架屏添加渐进式显示效果（如逐行显示表格骨架）？**
   - **初步想法**: 不需要，简单的 pulse 动画已足够
   - **待确认**: 用户体验反馈

3. **骨架屏是否应该显示实际的聊天名称（从 selectedChat 传入）？**
   - **初步想法**: 不需要，骨架屏只模拟结构，不显示实际内容
   - **待确认**: 是否需要传递部分 props 到骨架屏以提供更真实的预览
