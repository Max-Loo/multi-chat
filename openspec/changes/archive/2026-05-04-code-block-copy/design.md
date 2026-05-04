## Context

代码块渲染链路：`ChatBubble` → `generateCleanHtml(dirtyMarkdown)` → `markdown-it` 的 `highlight` 回调 → `<pre><code class="hljs ...">` HTML → `DOMPurify.sanitize()` → `dangerouslySetInnerHTML`。

关键约束：
- `highlight` 回调是同步函数，返回 HTML 字符串，无法使用 React 组件
- 复制按钮必须作为纯 HTML 注入到 `<pre>` 结构中
- `DOMPurify.sanitize()` 会过滤不安全的标签和属性，注入的 HTML 结构必须通过白名单
- `codeBlockUpdater.ts` 的异步 DOM 更新机制（`updateCodeBlockDOM`）会直接操作 `innerHTML`，不能破坏注入的按钮元素
- 代码块在 `Virtualizer` 中虚拟化渲染，复制按钮不能破坏虚拟化性能

## Goals / Non-Goals

**Goals:**
- 在每个代码块右上角显示复制按钮
- 点击后复制代码纯文本到剪贴板
- 复制成功后按钮显示"已复制"状态，2 秒后自动恢复
- 不破坏现有的代码高亮、异步加载、DOM 更新机制

**Non-Goals:**
- 不实现代码块折叠/展开
- 不实现代码块行号显示
- 不实现代码块语言标签显示（独立的增强功能）
- 不引入新的 npm 依赖

## Decisions

### 决策 1：纯 HTML + CSS 注入方案（不使用 React）

**选择**：在 `highlight` 回调中直接输出包含复制按钮的 HTML 结构，使用纯 CSS 定位按钮，用原生 DOM 事件处理复制逻辑。

HTML 结构：
```html
<div class="code-block-wrapper">
  <button class="code-copy-btn" data-code="base64编码的代码内容" title="复制代码">
    <svg><!-- Copy 图标 SVG --></svg>
  </button>
  <pre><code class="hljs ...">高亮代码</code></pre>
</div>
```

复制逻辑：使用全局事件委托（`document.addEventListener('click', ...)`），监听 `.code-copy-btn` 的点击事件，从 `data-code` 属性解码代码内容后调用 `copyToClipboard`。

**替代方案**：使用 `useEffect` + `useRef` 在 React 渲染后注入按钮 → 被否决，因为 ChatBubble 使用 `dangerouslySetInnerHTML`，且 Virtualizer 环境下 `useEffect` 时机不可控，与 `codeBlockUpdater` 的 DOM 操作冲突。

**替代方案**：使用 `rehype` 插件在 Markdown AST 层面注入 → 被否决，项目使用 `markdown-it` 而非 `remark/rehype` 生态。

**理由**：`highlight` 回调已有完整的代码块 HTML 生成逻辑，在此处注入是最自然的扩展点。全局事件委托避免为每个代码块绑定独立监听器。

### 决策 2：代码内容的传递方式

**选择**：使用 `data-code` 属性存储 Base64 编码的代码内容

将代码文本 `btoa(encodeURIComponent(code))` 编码后存入 `data-code`，点击时 `decodeURIComponent(atob(dataCode))` 解码。使用 `encodeURIComponent` 处理非 ASCII 字符（中文注释等），`btoa` 确保 HTML 属性安全。

**替代方案**：从 `<code>` 元素的 `textContent` 提取 → 被否决，`codeBlockUpdater` 的异步 DOM 更新会替换 `innerHTML`，但 `textContent` 始终包含原始代码文本。但考虑到 `highlight.js` 高亮后 `textContent` 是纯文本且可靠，实际上也可以使用此方案。

**最终选择**：优先从 `<code>` 元素的 `textContent` 提取（更简单），`data-code` 作为备用。

**修正决策**：直接从 `<button>` 的相邻 `<code>` 元素的 `textContent` 获取代码。无需 `data-code` 属性，简化 HTML 结构和编码/解码逻辑。

```html
<div class="code-block-wrapper">
  <button class="code-copy-btn" title="复制代码">
    <svg><!-- Copy 图标 --></svg>
  </button>
  <pre><code class="hljs ...">高亮代码</code></pre>
</div>
```

点击时：`button.parentElement.querySelector('code')?.textContent` 获取纯文本。

**理由**：`textContent` 不受 `innerHTML` 替换影响，`highlight.js` 高亮后 `textContent` 仍然是原始代码纯文本。无需 Base64 编码，减少复杂度。

### 决策 3：DOMPurify 兼容性

**选择**：配置 `DOMPurify` 允许 `button`、`svg`、`div` 标签和 `data-code`、`title`、`class` 属性

使用 `DOMPurify.sanitize()` 的 `ADD_TAGS` 和 `ADD_ATTR` 选项，将 `button`、`svg`、`path` 加入白名单，确保复制按钮不被过滤。

```typescript
DOMPurify.sanitize(html, {
  ADD_TAGS: ['button', 'svg', 'path'],
  ADD_ATTR: ['data-code', 'd', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
});
```

**理由**：`DOMPurify` 默认过滤 `button` 标签，必须显式允许。

### 决策 4：全局事件委托的注册时机

**选择**：在 `markdown.ts` 模块初始化时注册全局 click 事件委托

在模块顶层执行一次 `document.addEventListener('click', handleCodeCopyClick)`。事件委托函数检查点击目标是否为 `.code-copy-btn` 或其子元素，是则执行复制逻辑。

**理由**：模块级别注册一次，不依赖 React 生命周期。即使 ChatBubble 卸载，事件监听器不会泄漏（因为回调是无状态的，且 `document` 永远存在）。

## Risks / Trade-offs

- [DOMPurify 可能过滤 SVG 属性] → 缓解：提前测试所有需要的 SVG 属性，确保加入白名单
- [全局事件委托可能与未来其他按钮冲突] → 缓解：使用精确的 CSS 类选择器 `.code-copy-btn`，作用域极小
- [textContent 提取可能包含不期望的空白] → 缓解：使用 `textContent.trim()` 处理首尾空白
- [codeBlockUpdater 的 DOM 更新可能破坏按钮] → 缓解：`codeBlockUpdater` 只更新 `<code>` 的 `innerHTML`，不触碰父级 `<div>` 和 `<button>`
