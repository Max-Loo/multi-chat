## 1. Markdown 渲染层改造

- [x] 1.1 修改 `src/utils/markdown.ts` 的 `highlight` 回调 — 将所有 `<pre><code>` 输出包裹在 `<div class="code-block-wrapper">` 中，并在其中注入 `<button class="code-copy-btn">` 元素（含 SVG 复制图标）
- [x] 1.2 配置 `DOMPurify.sanitize()` 白名单 — 在 `generateCleanHtml` 中添加 `ADD_TAGS: ['button', 'svg', 'path']` 和必要的 `ADD_ATTR`，确保按钮和 SVG 图标不被过滤
- [x] 1.3 在 `src/utils/markdown.ts` 中注册全局 click 事件委托 — `document.addEventListener('click', handleCodeCopyClick)`，检测 `.code-copy-btn` 点击，从相邻 `<code>` 元素的 `textContent` 提取代码，调用 `copyToClipboard`

## 2. 复制状态反馈

- [x] 2.1 实现复制成功后的按钮状态变化 — 将 SVG 图标替换为"已复制"勾选图标，更新 `title` 属性
- [x] 2.2 实现状态自动恢复 — 使用 `setTimeout` 2 秒后将按钮图标和 `title` 恢复到初始状态

## 3. 样式

- [x] 3.1 在 `src/main.css` 中新增代码块容器样式 — `.code-block-wrapper` 使用 `position: relative`
- [x] 3.2 新增复制按钮样式 — `.code-copy-btn` 使用 `position: absolute; top; right` 定位在右上角，默认半透明，hover 时完全可见，适配暗色代码块背景
- [x] 3.3 新增复制按钮"已复制"状态样式 — 按钮变为成功色（如绿色）并短暂高亮

## 4. 国际化

- [x] 4.1 在 `src/locales/zh/chat.json` 中新增复制按钮相关文案（复制代码、已复制）
- [x] 4.2 在 `src/locales/en/chat.json` 中同步英文翻译
- [x] 4.3 在 `src/locales/fr/chat.json` 中同步法文翻译

## 5. 兼容性验证

- [x] 5.1 验证 `codeBlockUpdater` 异步 DOM 更新不破坏复制按钮 — 异步加载语言后 `innerHTML` 替换仅影响 `<code>` 元素，按钮不受影响
- [x] 5.2 验证预加载语言、异步加载语言、不支持语言三种场景下复制按钮均正常显示
- [x] 5.3 运行 `pnpm test` 确认所有测试通过
