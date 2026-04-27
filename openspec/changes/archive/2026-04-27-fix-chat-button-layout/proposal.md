## Why

聊天名称过长时，ChatButton 组件中左侧名称区域未能正确约束宽度，导致右侧操作按钮（更多菜单 / 快捷删除）被压缩变形。truncate 样式因缺少 `flex-1` 和 `overflow-hidden` 而无法生效。

## What Changes

- 修复 ChatButton 组件中左侧名称区域的 flex 布局，确保 `truncate` 在名称过长时正确截断
- 确保右侧操作按钮始终保持固定尺寸，不被左侧内容挤压

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `responsive-chat-button`: 调整 ChatButton 的布局约束要求，确保名称区域在 flex 容器中正确收缩，右侧按钮不被压缩

## Impact

- `src/pages/Chat/components/Sidebar/components/ChatButton.tsx` — 修改 JSX className
- 纯 CSS 布局修复，不涉及逻辑变更，不影响 API、依赖或状态管理
