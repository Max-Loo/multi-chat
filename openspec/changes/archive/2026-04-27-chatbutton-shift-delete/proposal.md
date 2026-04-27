## Why

当前删除聊天需要两步操作：点击「⋯」更多按钮 → 在下拉菜单中选择「删除」→ 确认对话框。对于高级用户频繁管理聊天列表的场景，操作路径过长。Shift + 悬停快捷删除提供一种 modifier guard 保护的一步删除方式，减少操作步骤。

## What Changes

- ChatButton 组件新增 Shift 键状态追踪（全局 keydown/keyup 监听）
- ChatButton 组件新增鼠标悬停状态追踪（mouseEnter/mouseLeave）
- 当 Shift + 悬停同时满足时，DropdownMenu 替换为红色背景、白色垃圾桶图标的删除按钮
- 点击该删除按钮直接执行删除，跳过确认对话框
- 删除按钮提供 aria-label 无障碍提示
- 按钮尺寸跟随 isNormalSize 响应式逻辑

## Capabilities

### New Capabilities
- `shift-quick-delete`: ChatButton 的 Shift+悬停快捷删除交互能力

### Modified Capabilities
（无现有能力的需求变更）

## Impact

- **代码文件**：`src/pages/Chat/components/Sidebar/components/ChatButton.tsx`（唯一修改文件）
- **依赖**：无新增依赖，使用现有 `trash2` icon（lucide-react）和 `Button` 组件
- **API**：无 API 变更，复用现有 `deleteChat` action
- **可访问性**：新增 aria-label，对屏幕阅读器友好
