## Why

密钥导出功能在 Safari 浏览器上失败。`navigator.clipboard.writeText()` 在经过 `await` 异步操作后调用时，Safari 会丢失用户手势上下文并抛出 `NotAllowedError`。Chrome 和 Firefox 对此更宽松，因此问题仅在 Safari 上复现。此问题同时影响 Safari 浏览器用户和 Tauri macOS 桌面端（使用 WKWebView）。

## What Changes

- 新增 `copyToClipboard` 工具函数，优先使用 Clipboard API，失败时回退到 `document.execCommand('copy')` 方案
- 修改密钥导出流程，使用新工具函数替代直接调用 `navigator.clipboard.writeText()`

## Capabilities

### New Capabilities
- `clipboard-utils`: 跨浏览器兼容的剪贴板写入工具函数，包含 Clipboard API + execCommand fallback 策略

### Modified Capabilities

（无现有 capability 的需求变更）

## Impact

- **新增文件**: `src/utils/clipboard.ts`
- **修改文件**: `src/pages/Setting/components/KeyManagementSetting/index.tsx`（替换剪贴板调用）
- **影响范围**: 仅密钥导出功能的剪贴板写入逻辑
- **兼容性**: 所有主流浏览器（Chrome、Firefox、Safari、Edge）及 Tauri webview
- **无 breaking changes**
