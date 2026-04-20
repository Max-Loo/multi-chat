## ADDED Requirements

### Requirement: 跨浏览器剪贴板写入
系统 SHALL 提供一个 `copyToClipboard(text: string): Promise<void>` 函数，在所有主流浏览器和 Tauri webview 中可靠地将文本复制到剪贴板。

#### Scenario: 现代浏览器环境成功复制
- **WHEN** 在支持 Clipboard API 的浏览器中调用 `copyToClipboard("test")`
- **THEN** 函数 SHALL 使用 `navigator.clipboard.writeText()` 完成复制并正常返回

#### Scenario: Safari 环境回退复制
- **WHEN** 在 Safari 或 WKWebView 中调用 `copyToClipboard("test")`，且 `navigator.clipboard.writeText()` 抛出 `NotAllowedError`
- **THEN** 函数 SHALL 回退到 `document.execCommand('copy')` 方案完成复制并正常返回

#### Scenario: 剪贴板完全不可用
- **WHEN** Clipboard API 和 execCommand 均失败
- **THEN** 函数 SHALL 抛出错误，调用方可据此提示用户

### Requirement: execCommand fallback 实现安全
fallback 方案 SHALL 使用临时不可见的 textarea 元素，不得在页面上产生视觉闪烁或布局偏移。

#### Scenario: 临时元素不可见且被清理
- **WHEN** fallback 执行 `document.execCommand('copy')`
- **THEN** 创建的 textarea 元素 SHALL 设置为不可见（position:fixed + opacity:0 + 屏幕外定位），且复制完成后 SHALL 从 DOM 中移除

### Requirement: 密钥导出使用兼容剪贴板方案
密钥导出功能 SHALL 使用 `copyToClipboard` 工具函数替代直接调用 `navigator.clipboard.writeText()`。

#### Scenario: Safari 上导出密钥成功
- **WHEN** 用户在 Safari 浏览器中点击导出密钥并确认安全警告
- **THEN** 密钥 SHALL 成功复制到剪贴板，并显示导出成功提示

#### Scenario: Chrome 上导出密钥成功
- **WHEN** 用户在 Chrome 浏览器中点击导出密钥并确认安全警告
- **THEN** 密钥 SHALL 成功复制到剪贴板，并显示导出成功提示
