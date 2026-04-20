## Context

密钥导出功能使用 `navigator.clipboard.writeText()` 将主密钥复制到剪贴板。该 API 在 Safari 中要求调用必须在用户手势的同步上下文中完成。当前实现先 `await exportMasterKey()`（异步读取 IndexedDB/keyring），再调用 clipboard API，导致 Safari 丢失用户手势上下文并抛出 `NotAllowedError`。

此问题影响 Safari 浏览器用户及 macOS Tauri 桌面端（WKWebView）。

## Goals / Non-Goals

**Goals:**
- 在所有主流浏览器（Chrome、Firefox、Safari、Edge）及 Tauri webview 中可靠地复制文本到剪贴板
- 提供一个可复用的剪贴板工具函数，供项目其他场景使用
- 保持现有功能行为不变，仅修复兼容性问题

**Non-Goals:**
- 不引入 Tauri clipboard 插件依赖（仅浏览器端修复即可覆盖所有场景）
- 不修改密钥导出的整体流程或 UI 交互
- 不处理剪贴板读取操作

## Decisions

### 1. 使用 Clipboard API + execCommand fallback 策略

**决策**：创建 `copyToClipboard(text)` 函数，优先使用 `navigator.clipboard.writeText()`，捕获异常后回退到 `document.execCommand('copy')`。

**替代方案**：
- *预获取密钥*：在用户点击导出时就异步获取密钥，确认时同步调用 clipboard。**放弃原因**：在用户确认安全警告前就读取密钥，违反安全警告对话框的设计意图。
- *仅使用 execCommand*：直接用 execCommand 替代 Clipboard API。**放弃原因**：execCommand 已废弃，Chrome/Firefox 环境下应优先使用现代 API。

**理由**：渐进式 fallback 策略在所有环境下都能工作。execCommand 虽已废弃但所有主流浏览器仍完整支持，且作为 fallback 仅在 Safari 等受限环境触发。

### 2. execCommand fallback 实现：临时 textarea 方案

**决策**：创建不可见的 textarea 元素，填入文本后选中并执行 `document.execCommand('copy')`，完成后移除元素。

**理由**：这是 execCommand 复制文本的标准做法，兼容性最好。

### 3. 工具函数放置位置

**决策**：新建 `src/utils/clipboard.ts`。

**理由**：剪贴板操作是通用工具能力，放在 utils 目录符合项目现有结构（参考 `src/utils/crypto.ts`、`src/utils/utils.ts`）。

## Risks / Trade-offs

- **[execCommand 废弃风险]** → 短期内不会移除（所有主流浏览器仍支持）。若未来移除，Safari 端需改用其他方案（如显示文本让用户手动复制）。
- **[Safari 安全策略收紧]** → 若 Safari 进一步限制 execCommand，fallback 可能也失效。目前无此迹象，且 execCommand('copy') 在 Safari 中运行良好。
