## Why

当前 ChatPanelContent 中每个单元格都固定添加 `border-b` 和 `border-r`，导致最右侧和最底行的单元格在容器边缘也有多余边框，影响视觉整洁度。用户期望的 UI 是：只有相邻单元格之间才有分隔线，外边缘保持干净。

## What Changes

- 修改 `ChatPanelContent` 组件的边框逻辑
- 根据单元格在网格中的位置（行索引、列索引）动态决定是否显示边框
- 右边框：仅当单元格不是行末时显示
- 下边框：仅当单元格不在最后一行时显示

## Capabilities

### New Capabilities

- `chat-panel-conditional-borders`: 聊天面板网格布局的条件性边框渲染能力

### Modified Capabilities

无（这是新增 UI 行为，不修改现有 spec 级别的需求）

## Impact

- **影响文件**：`src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/index.tsx`
- **影响范围**：仅影响非 splitter 模式下的网格布局渲染
- **边界情况**：
  - 单个模型：无边框
  - 单行多个：仅垂直分隔线
  - 单列多个：仅水平分隔线
  - 不规则网格（最后一行不满）：正确处理
- **兼容性**：不影响 ResizablePanel 模式（splitter=true）
