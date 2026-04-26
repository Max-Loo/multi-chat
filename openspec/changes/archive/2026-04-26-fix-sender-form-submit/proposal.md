## Why

Sender.tsx 的外层容器从 `<div>` 改为 `<form>` 后，未添加 `onSubmit` 处理器。HTML 规范中 `<button>` 在 `<form>` 内默认 `type="submit"`，导致用户点击发送按钮时浏览器触发页面刷新，丢失当前聊天上下文。这是影响用户数据的运行时 bug，需立即修复。

## What Changes

- 为 `Sender.tsx` 的 `<form>` 元素添加 `onSubmit={(e) => e.preventDefault()}`，阻止浏览器默认表单提交行为

## Capabilities

### New Capabilities

无

### Modified Capabilities

无（修复 bug，不改变行为规格）

## Impact

- **受影响文件**: `src/pages/Chat/components/Panel/Sender.tsx`（第 197 行）
- **影响范围**: 仅影响 Sender 组件的表单提交行为
- **风险评估**: 极低。添加 `e.preventDefault()` 是纯防御性修复，不改变任何现有逻辑
