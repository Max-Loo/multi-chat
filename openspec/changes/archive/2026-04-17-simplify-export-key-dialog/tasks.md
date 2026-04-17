## 1. 状态模型重构

- [x] 1.1 将 `exportState` 类型从 `null | "warning" | string` 简化为 `null | string`
- [x] 1.2 移除 `"warning"` 相关的条件分支（按钮 onClick、对话框 Footer 渲染逻辑）

## 2. 交互流程改造

- [x] 2.1 修改导出按钮 onClick：点击后直接调用 `handleExportKey()` 并设置对话框打开
- [x] 2.2 对话框加载态：获取密钥期间展示加载指示（禁用输入框 + 按钮显示 "..."）
- [x] 2.3 对话框内容区：移除安全警告文案，密钥就绪后直接展示 Input + 复制按钮

## 3. 清理

- [x] 3.1 移除对话框中 `exportState === "warning"` 的分支渲染代码
- [x] 3.2 确认 `exportSecurityWarning` 翻译 key 是否可安全移除（检查其他引用）
