## 1. Inline Script — 系统偏好检测

- [x] 1.1 在 `index.html` 的 `<head>` 中、Spinner `<style>` 之前，添加 inline `<script>`：同步执行 `matchMedia("(prefers-color-scheme: dark)")` 检测，暗色时在 `<html>` 上设置 `.dark` class

## 2. Spinner 样式 — CSS 变量化

- [x] 2.1 将 Spinner `<style>` 中的硬编码颜色（`#f3f3f3`、`#4269C4`）替换为 CSS 自定义属性（`--spinner-track`、`--spinner-bar`、`--spinner-bg`）
- [x] 2.2 在 `:root` 中定义浅色 Spinner 变量值
- [x] 2.3 在 `.dark` 中定义暗色 Spinner 变量值（深色轨道、适配暗底的旋转条色、暗色背景）
- [x] 2.4 在 Spinner style 中为 `<body>` 添加 `background: var(--spinner-bg)` 背景色

## 3. 验证

- [x] 3.1 浅色系统偏好下打开应用，确认首帧为白色背景 + 浅灰 Spinner
- [x] 3.2 暗色系统偏好下打开应用，确认首帧为暗色背景 + 适配暗色的 Spinner，无白色闪烁
- [x] 3.3 暗色系统偏好 + localStorage 存储了 "light" 时，确认 JS 加载后正确切换为浅色主题
- [x] 3.4 确认 inline script 不影响后续 `main.tsx` 的主题初始化逻辑
