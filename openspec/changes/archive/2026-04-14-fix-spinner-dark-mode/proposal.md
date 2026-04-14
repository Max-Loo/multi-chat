## Why

`index.html` 中的 HTML Spinner 使用硬编码的十六进制颜色（`#f3f3f3`、`#4269C4`）和浏览器默认白色背景，在 JS 加载前渲染。对于操作系统偏好为暗色模式的用户，应用启动时会先显示白色背景的 Spinner，然后在 main.tsx 执行后突然跳变为暗色——这段约 0.5-2 秒的白色闪烁严重破坏暗色模式体验，且这是用户打开应用后的第一个视觉印象。

## What Changes

- 在 `index.html` 的 `<head>` 中添加一段同步 inline `<script>`，在 Spinner 渲染前检测系统暗色偏好并设置 `.dark` class
- 将 Spinner 的 inline `<style>` 改为响应 `.dark` class 的 CSS 变量方案，使 Spinner 颜色自动适配浅色/暗色主题
- 将 `<body>` 背景色也纳入 `.dark` 适配范围，确保首帧即显示正确的背景色

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `theme-switching`: 扩展「主题初始化无闪烁」需求，覆盖 JS 加载前的纯 HTML 阶段，确保从第一帧起 Spinner 和背景色就响应系统暗色偏好

## Impact

- `index.html`：修改 Spinner 的 `<style>` 和添加 inline `<script>`
- 无 API、依赖或构建系统变更
- 不影响后续 React 渲染阶段的主题逻辑
