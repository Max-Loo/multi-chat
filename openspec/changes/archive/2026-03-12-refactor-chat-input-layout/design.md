## Context

当前 `ChatPanelSender` 组件的布局采用传统的「上方控件 + 下方输入框 + 右侧按钮」模式。这种布局在桌面端尚可，但存在空间利用率和视觉体验的问题。

**当前布局**：
```
┌─────────────────────────────────────┐
│ [推理内容开关]                        │ ← 独立一行
├─────────────────────────────────────┤
│ ┌───────────────────────┐  ┌───┐   │
│ │                       │  │ ↑ │   │
│ │  Textarea (max-h-80)  │  └───┘   │
│ └───────────────────────┘          │
└─────────────────────────────────────┘
```

**目标布局**：
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  Textarea (自动高度，最多10行)   │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ [推理开关]              ┌───┐      │
│                         │ ↑ │      │
│                         └───┘      │
└─────────────────────────────────────┘
  ↑ Textarea 区域      ↑ 工具栏区域（独立）
```

**约束条件**：
- Tauri macOS 使用 WebKit（Safari），不支持 CSS `field-sizing: content`
- 需保持 Safari 中文输入法兼容性（已有逻辑不变）
- 需保持 Enter 发送 / Shift+Enter 换行的行为

## Goals / Non-Goals

**Goals:**
- 实现文本框自动高度调整（2.5 行 ~ 10 行）
- 将推理开关和发送按钮放置在文本框底部的独立工具栏区域
- 工具栏与 Textarea 区域完全分开，互不遮挡
- 使用细灰色边框，去除阴影，提升视觉简洁度
- 创建可复用的 `useAutoResizeTextarea` hook

**Non-Goals:**
- 不改变消息发送的核心逻辑
- 不改变推理内容开关的功能行为
- 不添加新的 UI 组件或功能

## Decisions

### 1. 自动高度实现方案

**决策**：使用 JavaScript + React Hook 实现，而非纯 CSS `field-sizing: content`

**原因**：
- Tauri macOS 的 WebKit 不支持 `field-sizing: content`
- Hook 方案兼容性最佳，可在所有浏览器中正常工作
- 封装为 Hook 后可在其他地方复用

**替代方案**：
- 纯 CSS `field-sizing: content` - 兼容性不足
- 使用第三方库（如 react-textarea-autosize）- 引入额外依赖，本项目需求简单

**实现要点**：
```typescript
// 关键：先重置高度，再计算
textarea.style.height = 'auto';
const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
textarea.style.height = `${newHeight}px`;
```

### 2. 布局定位策略

**决策**：使用 `flex flex-col` 布局，Textarea 和工具栏垂直排列

**原因**：
- 工具栏与 Textarea 区域完全分开，互不遮挡
- 无需为工具栏预留 padding 空间
- 更符合直觉的文档流布局
- 避免绝对定位带来的遮挡问题

**结构**：
```jsx
<div className="flex flex-col">
  <Textarea className="py-3" />  {/* 无需额外 padding */}
  <div className="flex justify-between px-2 py-2 bg-background">
    <Button>推理开关</Button>
    <SendButton />
  </div>
</div>
```

### 3. 高度限制参数

**决策**：最小高度 60px（约 2.5 行），最大高度 192px（8 行）

**原因**：
- 8 行约 192px（假设行高 24px），适合大多数输入场景
- 最小 2.5 行避免单行时显得过于局促
- 平衡显示空间与输入体验

### 4. 边框样式

**决策**：整个 ChatPanelSender 外层容器使用细灰色边框（`border border-gray-300 rounded-lg`），Textarea 本身无边框、无阴影、无聚焦效果

**原因**：
- 外层容器的细灰色边框提供清晰的视觉边界，又不显得突兀
- Textarea 无边框、无阴影、无聚焦效果，视觉更简洁、扁平
- 外层容器有 `rounded-lg` 圆角，Textarea 使用 `rounded-none` 避免重复
- 与整体设计风格保持一致

### 5. 工具栏背景处理

**决策**：工具栏使用 `bg-background` 背景色，与外层容器保持一致

**原因**：
- 工具栏独立出来后，需要有自己的背景色
- 使用 `bg-background` 保持视觉一致性
- 明确区分 Textarea 区域和工具栏区域

### 6. 内边距处理

**决策**：外层容器使用 `px-3 py-2`（12px/8px 内边距），Textarea 使用 `p-2`，工具栏无额外内边距

**原因**：
- 紧凑的内边距保持组件简洁
- 单一的内边距控制，简化样式管理
- 文字距离边框有 `12px` 的水平间距（`px-3`）
- 外层容器不设置外边距，由父组件控制布局间距

## Risks / Trade-offs

### 风险 1：工具栏遮挡文本
**Mitigation**：通过 `pb-12`（48px）预留足够空间，工具栏位于预留区域内，不会遮挡用户输入的有效内容。

### 风险 2：高度计算抖动
**Mitigation**：使用 `transition-all` 平滑过渡，配合 `requestAnimationFrame` 时机（React 的 useEffect 已处理）。

### 风险 3：小屏幕上工具栏拥挤
**Mitigation**：保持工具栏元素紧凑，测试不同屏幕尺寸。按钮尺寸已统一为 h-8，视觉更协调。

### 风险 4：边框样式不够明显
**Mitigation**：使用 `border border-gray-300` 提供清晰的视觉边界，同时保持简洁。placeholder 文字也会引导用户注意输入区域。
