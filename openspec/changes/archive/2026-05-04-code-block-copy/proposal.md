## Why

ChatBubble 中 AI 回复的代码块通过 `markdown-it` + `highlight.js` 渲染，但生成的 `<pre><code>` 元素只有展示能力，没有任何交互。用户无法复制代码内容，必须手动选中复制——在长代码块中体验极差。这是代码类对话场景的高频痛点。

## What Changes

- **新增** 代码块复制按钮：在每个 `<pre>` 块的右上角悬浮显示复制按钮
- **新增** 复制状态反馈：点击后按钮图标从"复制"变为"已复制"，短暂延迟后恢复
- **修改** `markdown.ts` 的 `highlight` 回调：在生成的 `<pre>` HTML 中注入复制按钮结构
- **修改** `markdown.css`（或 `main.css`）：新增代码块容器和复制按钮的样式

## Capabilities

### New Capabilities

- `code-block-copy`: 代码块复制按钮的交互行为，包括按钮渲染、复制执行和状态反馈

### Modified Capabilities

- `custom-chat-components`: 代码块渲染输出结构变更（`<pre>` 包裹容器增加按钮元素）

## Impact

- **修改文件**：
  - `src/utils/markdown.ts` — `highlight` 回调函数输出 HTML 结构变更
  - `src/main.css` — 新增代码块复制按钮样式
  - `src/locales/zh/chat.json`、`src/locales/en/chat.json`、`src/locales/fr/chat.json` — 新增复制按钮 tooltip 文案
- **无依赖变更**：使用已有的 `copyToClipboard` 工具函数和 `lucide-react` 图标
- **Breaking**: 无（纯增量变更）
