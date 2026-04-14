## Context

当前应用的加载时序如下：

1. 浏览器解析 `index.html`，渲染 HTML Spinner（硬编码颜色，白色背景）
2. `main.tsx` 作为 ES Module 异步加载，执行同步初始化代码设置 `.dark` class
3. React 渲染接管，显示初始化动画和主界面

问题出在阶段 1：Spinner 的 `<style>` 使用硬编码十六进制色值（`#f3f3f3`、`#4269C4`），`<body>` 使用浏览器默认白色背景。对于暗色系统偏好的用户，这段 0.5-2 秒的白色闪烁是第一帧就出错的体验问题。

约束条件：
- Spinner 必须在 JS 模块加载前显示（纯 HTML/CSS）
- 不能依赖 `main.css` 中的 CSS 变量（此时还未加载）
- inline `<script>` 必须极小（< 300 字节），不影响首屏渲染性能
- 不引入外部依赖

## Goals / Non-Goals

**Goals:**

- 暗色系统偏好的用户打开应用时，从第一帧起就看到暗色背景和适配暗色的 Spinner
- 消除「白底 → 暗底」的闪烁跳变
- 与后续 `main.tsx` 的同步初始化逻辑无缝衔接

**Non-Goals:**

- 不处理用户自定义主题偏好（`localStorage`）的 Spinner 响应——Spinner 阶段 localStorage 中可能有值也可能没有，仅响应系统偏好即可
- 不修改 Spinner 的形状、动画或布局
- 不处理 Canvas Logo 的暗色适配（属于独立问题）

## Decisions

### Decision 1: 使用 inline `<script>` 检测系统偏好

在 `<head>` 中、Spinner `<style>` **之前**添加一段 inline `<script>`，同步执行 `matchMedia("(prefers-color-scheme: dark)")` 检测系统偏好，并立即在 `<html>` 上设置 `.dark` class。

**替代方案及否决理由：**

| 方案 | 否决理由 |
|------|---------|
| 纯 CSS `@media (prefers-color-scheme: dark)` | 可行，但需要在 Spinner style 中维护两套颜色值，且无法复用 `.dark` class 选择器（后续 main.tsx 也依赖它） |
| 读取 localStorage 后再决定 | localStorage 中可能没有值（首次访问），而且 inline script 读 localStorage 会增加复杂度 |
| 使用 CSS 变量 + fallback | CSS 变量定义在 main.css 中，此时未加载 |

**选择 inline script 的理由：**
- 代码量极小（~100 字节）
- 同步执行，在任何渲染之前完成
- 复用 `.dark` class 机制，与后续 `main.tsx` 的 `classList.toggle("dark", ...)` 无缝衔接（main.tsx 会重新计算并设置，覆盖 inline script 的结果）

### Decision 2: Spinner 使用 CSS 变量 + `.dark` 选择器

将 Spinner 的 `<style>` 从硬编码十六进制色值改为使用 CSS 自定义属性，并在 `:root` 和 `.dark` 中分别定义浅色和暗色值。

```css
:root {
  --spinner-track: #e5e5e5;
  --spinner-bar: #4269C4;
  --spinner-bg: #ffffff;
}
.dark {
  --spinner-track: #444444;
  --spinner-bar: #6b8dd8;
  --spinner-bg: #1c1c1c;
}
```

**理由：** 变量方案使 `.dark` 切换自动生效，无需维护重复的 Spinner 结构。

### Decision 3: `<body>` 背景纳入 `.dark` 适配

在 Spinner style 中为 `body` 添加背景色，浅色为白色，暗色为深色，与 main.css 中定义的 `--background` 一致。

**理由：** 如果只改 Spinner 不改背景，暗色模式下 Spinner 适配了但 body 仍是白色，问题依然存在。

## Risks / Trade-offs

- **[inline script 阻塞解析]** → 风险极低：脚本仅执行一次 `matchMedia` + `classList.toggle`，耗时 < 1ms
- **[`.dark` class 被设置两次]** → inline script 设置一次，main.tsx 再设置一次。main.tsx 会考虑 localStorage 偏好重新计算，结果可能覆盖 inline script 的值。这是预期行为——inline script 只解决"首帧"问题，main.tsx 负责最终的准确状态
- **[CSS 变量与 main.css 中的定义重复]** → Spinner style 中的 CSS 变量仅用于首屏，main.css 加载后会被覆盖。这是可接受的临时重复
- **[用户偏好为浅色但系统为暗色]** → inline script 会暂时显示暗色（因为只看系统偏好），但 main.tsx 加载后会立即纠正为浅色。这个切换发生在 JS 加载的瞬间（< 100ms），用户几乎感知不到
