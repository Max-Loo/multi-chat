## Why

当前聊天输入框的布局存在以下问题：
1. 推理内容开关和发送按钮分列两行，垂直空间利用率低
2. 文本框高度固定（max-h-80），无法根据内容自动调整，导致短文本时浪费空间，长文本时滚动体验不佳
3. 外层容器的顶部边框在视觉上造成不必要的分隔感

重构后，输入框将更紧凑、更现代，文本输入体验更流畅。

## What Changes

- 将「推理内容开关」从文本框上方移动到文本框底部工具栏的左侧
- 将「发送按钮」从文本框右侧移动到文本框底部工具栏的右侧
- 工具栏与 Textarea 区域分开（Textarea 在上，工具栏在下），避免工具栏遮挡输入内容
- 去除外层容器的顶部边框（`border-t`）
- 文本框使用细灰色边框（`border border-gray-300`），去除阴影效果
- 文本框高度根据内容自动调整，最小 60px（约 2.5 行），最大 192px（8 行）
- 超过最大高度后，文本框显示滚动条
- 外层容器使用紧凑内边距（px-3 py-2），Textarea 使用 p-2，工具栏无额外内边距
- 发送按钮缩小为 h-8 w-8，与推理开关按钮高度保持一致
- 创建可复用的 `useAutoResizeTextarea` hook 管理自动高度逻辑

## Capabilities

### New Capabilities

- `auto-resize-textarea`: 文本框根据内容自动调整高度的能力，支持最小/最大高度限制，超出后显示滚动条

### Modified Capabilities

无。本次变更为纯 UI 重构，不影响现有功能的需求层面。

## Impact

**受影响的文件**：
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx` - 主要重构目标
- `src/hooks/useAutoResizeTextarea.ts` - 新建 hook 文件

**受影响的 UI**：
- 聊天输入框的整体布局和样式
- 推理内容开关的位置
- 发送按钮的位置

**兼容性考虑**：
- Tauri macOS 使用 WebKit（Safari），不支持 CSS `field-sizing: content`，需使用 JavaScript 方案
- Safari 中文输入法兼容性逻辑（已有）保持不变
