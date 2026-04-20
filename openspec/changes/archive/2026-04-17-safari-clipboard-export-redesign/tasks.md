## 1. 重构导出状态管理

- [x] 1.1 将 `showExportWarning` 和 `isExporting` 两个状态替换为 `exportState: null | "warning" | string` 三态
- [x] 1.2 修改"导出密钥"按钮 onClick：将 exportState 设为 "warning" 以弹出安全警告对话框
- [x] 1.3 修改警告确认按钮 onClick：禁用按钮后异步调用 `exportMasterKey()`，成功时将 exportState 设为密钥值，失败时显示错误 toast 并重置为 null

## 2. 重构导出对话框 UI

- [x] 2.1 将 AlertDialog 改为双阶段模式：未获取密钥时显示安全警告确认，已获取密钥时显示密钥展示+复制按钮
- [x] 2.2 添加只读 Input 展示密钥（font-mono 等宽字体）
- [x] 2.3 添加"复制到剪贴板"按钮，onClick 直接使用缓存 key 调用 `copyToClipboard(exportedKey)`
- [x] 2.4 复制成功后显示成功 toast 并关闭对话框（重置 exportedKey 为 null）
- [x] 2.5 复制失败后显示错误 toast，保持对话框打开以便用户手动复制

## 3. 更新国际化文案

- [x] 3.1 在 `src/locales/zh/setting.json` 中新增/调整密钥展示对话框相关翻译 key
- [x] 3.2 在 `src/locales/en/setting.json` 中新增/调整对应英文翻译
- [x] 3.3 在 `src/locales/fr/setting.json` 中新增/调整对应法文翻译
- [x] 3.4 更新 `src/@types/translationResources.d.ts` 类型定义

## 4. 验证

- [x] 4.1 在 Chrome 中测试密钥导出完整流程
- [x] 4.2 在 Safari 中测试密钥导出完整流程，确认剪贴板操作正常
