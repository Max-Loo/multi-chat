## Why

密钥导出功能在 Safari 浏览器（及 Tauri macOS WKWebView）上无法使用。当前实现先 `await exportMasterKey()`（异步读取 IndexedDB），再调用剪贴板 API，Safari 在此 async gap 后丢失用户手势上下文，导致 `navigator.clipboard.writeText()` 和 `document.execCommand('copy')` 均抛出 `NotAllowedError`。现有的 `clipboard.ts` fallback 方案无法解决此问题，因为回退时手势上下文同样已丢失。

## What Changes

- 将密钥导出的「安全警告确认对话框 → 自动复制」流程，改为「安全警告确认 → 展示密钥 + 复制按钮」模式
- 用户点击复制按钮时，密钥已在 React state 中，剪贴板写入在同步用户手势上下文中执行，消除 async gap
- 展示密钥的输入框同时提供手动选中 + Cmd+C 的终极 fallback

## Capabilities

### New Capabilities
- `key-export-display`: 密钥导出的展示+复制 UI 模式，包含安全警告确认、密钥展示输入框和复制按钮，解决 Safari async gap 导致剪贴板操作失败的问题

### Modified Capabilities

（无现有 capability 的需求变更）

## Impact

- **修改文件**: `src/pages/Setting/components/KeyManagementSetting/index.tsx`（导出流程 UI 重构）
- **可能修改**: `src/locales/` 下的翻译文件（新增/修改 UI 文案）
- **保持不变**: `src/utils/clipboard.ts`（工具函数本身无需修改）
- **保持不变**: `src/store/keyring/masterKey.ts`（密钥获取逻辑无需修改）
- **兼容性**: 所有主流浏览器及 Tauri webview，Safari 问题彻底解决
- **无破坏性变更**
