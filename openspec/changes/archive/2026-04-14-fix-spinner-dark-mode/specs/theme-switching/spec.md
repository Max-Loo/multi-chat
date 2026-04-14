## MODIFIED Requirements

### Requirement: 主题初始化无闪烁

系统必须在 React 渲染之前同步读取 localStorage 并设置 `.dark` class，首次渲染即使用正确的主题。此外，在 JS 模块加载之前的纯 HTML 阶段，系统必须通过 inline script 检测系统暗色偏好并设置 `.dark` class，确保 HTML Spinner 和 `<body>` 背景从第一帧起就响应系统主题偏好。

**RATIONALE**: 原需求仅覆盖 main.tsx 同步初始化阶段，但 HTML Spinner 在 main.tsx 加载前就已渲染。对于暗色系统偏好的用户，0.5-2 秒的白色闪烁破坏了暗色模式体验。inline script 以极小的代码量（< 300 字节）将防闪烁覆盖范围扩展到纯 HTML 阶段。

#### Scenario: 主题初始化无闪烁

- **WHEN** 应用启动
- **THEN** 必须在 React 渲染之前同步读取 localStorage 并设置 `.dark` class
- **AND** 首次渲染即使用正确的主题

#### Scenario: 纯 HTML 阶段响应系统暗色偏好

- **WHEN** 浏览器解析 `index.html`（JS 模块尚未加载）
- **AND** 操作系统偏好为暗色模式
- **THEN** inline script 必须在 Spinner 渲染前同步执行 `matchMedia("(prefers-color-scheme: dark)")`
- **AND** 检测到暗色偏好时必须在 `<html>` 元素上设置 `.dark` class
- **AND** `<body>` 背景必须显示为暗色（与 `main.css` 中 `--background` 暗色值一致）
- **AND** Spinner 的轨道和旋转条颜色必须适配暗色背景

#### Scenario: 纯 HTML 阶段浅色系统偏好

- **WHEN** 浏览器解析 `index.html`（JS 模块尚未加载）
- **AND** 操作系统偏好为浅色模式
- **THEN** `<html>` 元素不得有 `.dark` class
- **AND** `<body>` 背景必须为白色
- **AND** Spinner 显示浅色配色方案

#### Scenario: main.tsx 加载后覆盖 inline script 结果

- **WHEN** main.tsx 加载并执行同步初始化
- **AND** 用户在 localStorage 中存储了明确的主题偏好（如 "light"）
- **AND** 系统偏好为暗色
- **THEN** main.tsx 必须根据 localStorage 偏好重新计算并设置 `.dark` class
- **AND** 最终显示浅色主题（覆盖 inline script 设置的暗色）
