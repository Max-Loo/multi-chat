# 优化 highlight.js 代码高亮加载策略

## Why

当前项目中 highlight.js 采用完整引入方式，打包体积约为 **500KB**，占据了 vendor-markdown chunk 的绝大部分。这导致：

- **首屏加载时间延长**：500KB 的代码高亮库严重影响应用的初始加载速度
- **资源浪费**：实际使用中只需要 20-30 种语言，但打包了所有 190+ 种语言
- **用户体验受损**：桌面应用对启动速度敏感，过大的包体积影响性能表现

考虑到这是一个 AI 聊天应用，代码高亮是核心功能，但**具体需要渲染的语言由用户接收到的消息动态决定**，无法提前预知。因此需要一个既减小初始体积，又保证所有语言都能正常高亮的方案。

## What Changes

采用**混合策略：预加载 + 动态加载**的方案，优化 highlight.js 的体积和加载性能。

### 核心策略

```
┌────────────────────────────────────────────────────────────┐
│  混合加载策略                                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 预加载常见语言（约 10-15 种）                         │
│     • 打包到主 bundle，首屏即用                            │
│     • 覆盖 80%+ 的实际使用场景                             │
│     • 体积增加约 150KB（从 50KB 核心库到 150KB）           │
│                                                             │
│  2️⃣ 动态加载其他语言                                       │
│     • 首次遇到时按需加载语言包                             │
│     • 使用 Vite 的 `import.meta.glob` 实现代码分割        │
│     • 每个语言包约 5-20KB                                  │
│                                                             │
│  3️⃣ 两阶段渲染策略                                         │
│     • 阶段 1: 立即显示纯文本代码（避免白屏）               │
│     • 阶段 2: 加载完成后替换为高亮代码                     │
│     • 可选：显示 "⏳ 加载语法高亮..." 提示                 │
│                                                             │
│  4️⃣ 三级降级机制                                           │
│     • Level 1: 尝试加载指定语言                           │
│     • Level 2: 失败则使用 `highlightAuto()` 自动检测      │
│     • Level 3: 再失败则显示纯文本代码                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 预加载语言清单（建议）

基于 AI 聊天场景和测试覆盖，预加载以下 **10-15 种语言**：

| 语言 | highlight.js 名称 | 使用频率 |
|------|------------------|---------|
| JavaScript | `javascript` | ⭐⭐⭐⭐⭐ |
| TypeScript | `typescript` | ⭐⭐⭐⭐⭐ |
| Python | `python` | ⭐⭐⭐⭐⭐ |
| Java | `java` | ⭐⭐⭐⭐ |
| C++ | `cpp` | ⭐⭐⭐⭐ |
| HTML | `xml` | ⭐⭐⭐⭐ |
| CSS | `css` | ⭐⭐⭐⭐ |
| Bash | `bash` | ⭐⭐⭐ |
| JSON | `json` | ⭐⭐⭐ |
| Markdown | `markdown` | ⭐⭐⭐ |
| SQL | `sql` | ⭐⭐ |
| Go | `go` | ⭐⭐ |
| Rust | `rust` | ⭐⭐ |
| YAML | `yaml` | ⭐⭐ |
| C# | `csharp` | ⭐ |

**预期覆盖率**：约 80-85% 的代码块可以立即高亮（0 延迟）

### 技术实现要点

#### 1. 语言加载管理器（HighlightLanguageManager）

创建单例管理器，负责：

- **已加载语言缓存**：`Set<string>` 避免重复加载
- **加载中 Promise 缓存**：`Map<string, Promise<void>>` 避免并发请求
- **语言别名映射**：支持 `js` → `javascript`、`ts` → `typescript` 等
- **动态导入**：使用 `import.meta.glob` 预构建所有语言包

#### 2. 修改 markdown.ts 的 highlight 函数

**当前实现**：
```typescript
import hljs from "highlight.js";

highlight: function (str, lang) {
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(str, { language: lang }).value;
  }
  return hljs.highlightAuto(str).value;
}
```

**优化后实现（保持同步）**：
```typescript
import hljs from "highlight.js/lib/core";
import { preloadCommonLanguages } from "@/utils/highlightLanguageManager";

// 初始化时预加载常见语言（阻塞或异步取决于实现）
preloadCommonLanguages();

highlight: function (str, lang) {
  const manager = HighlightLanguageManager.getInstance();
  
  // 第一阶段：同步检查语言是否已加载
  if (manager.isLoaded(lang)) {
    // 预加载语言 → 立即高亮（0 延迟）
    return manager.highlightSync(str, lang);
  }
  
  // 罕见语言 → 启动异步加载 + DOM 更新
  manager.loadLanguageAsync(lang).then(() => {
    const highlighted = manager.highlightSync(str, lang);
    updateCodeBlockDOM(str, lang, highlighted);
  }).catch(() => {
    // 加载失败 → 降级为 highlightAuto
    const autoResult = hljs.highlightAuto(str);
    if (autoResult.language) {
      updateCodeBlockDOM(str, lang, autoResult.value);
    }
  });
  
  // 立即返回纯文本（不等待异步加载）
  return `<pre><code class="hljs language-${lang}">${escapeHtml(str)}</code></pre>`;
}
```

#### 3. Vite 配置优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // highlight.js 核心库 + 预加载语言
          'vendor-highlight-core': [
            'highlight.js/lib/core',
            'highlight.js/styles/atom-one-dark.css',
          ],
          // 动态语言包会被自动分割到独立 chunks
        },
      },
    },
  },
});
```

#### 4. 两阶段渲染实现

**方案：同步检查 + 异步更新 DOM（与 markdown-it 同步 API 兼容）**

```typescript
// markdown.ts 中的 highlight 回调（保持同步）
highlight: function (str, lang) {
  const manager = HighlightLanguageManager.getInstance();
  
  // 第一阶段：同步检查
  if (manager.isLoaded(lang)) {
    // 预加载语言 → 立即高亮并返回
    return `<pre><code class="hljs language-${lang}">${manager.highlightSync(str, lang)}</code></pre>`;
  }
  
  // 第二阶段：罕见语言 → 异步加载 + DOM 更新
  manager.loadLanguageAsync(lang)
    .then(() => {
      const highlighted = manager.highlightSync(str, lang);
      updateCodeBlockDOM(str, lang, highlighted);
    })
    .catch(() => {
      // 降级：highlightAuto
      const autoResult = hljs.highlightAuto(str);
      if (autoResult.language) {
        updateCodeBlockDOM(str, lang, autoResult.value);
      }
    });
  
  // 立即返回纯文本（不阻塞）
  return `<pre><code class="hljs language-${lang}">${escapeHtml(str)}</code></pre>`;
}

// codeBlockUpdater.ts 中的 DOM 更新函数
function updateCodeBlockDOM(code: string, lang: string, highlightedHtml: string) {
  const codeElements = document.querySelectorAll(`code[class*="language-${lang}"]`);
  
  codeElements.forEach(el => {
    // 检查元素是否仍在 DOM 中（防止组件卸载后更新）
    if (!document.contains(el)) return;
    
    // 检查内容是否匹配（避免更新错误的代码块）
    if (el.textContent === code) {
      el.innerHTML = highlightedHtml;
    }
  });
}
```

**选项 B：React 组件方案（更优雅）**

创建 `<CodeHighlight>` 组件，内部处理加载状态：

```typescript
function CodeHighlight({ code, language }) {
  const [html, setHtml] = useState(plainText(code));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded(language)) {
      setHtml(highlight(code, language));
    } else {
      setIsLoading(true);
      loadLanguage(language).then(() => {
        setHtml(highlight(code, language));
        setIsLoading(false);
      });
    }
  }, [code, language]);

  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: html }} />
      {isLoading && <span className="text-xs">⏳ 加载语法高亮...</span>}
    </pre>
  );
}
```

### 性能对比

| 指标 | 当前方案 | 优化后方案 | 改善 |
|------|---------|-----------|------|
| **初始打包体积** | 500KB | 150KB | ⬇️ 70% |
| **首屏加载时间** | ~200ms | ~60ms | ⬇️ 70% |
| **0 延迟高亮覆盖率** | 100% | 80-85% | -15% |
| **罕见语言加载延迟** | 0ms | 200-500ms | ⚠️ 新增 |
| **95 分位延迟** | 0ms | ~40ms | +40ms |

### 边界情况处理

1. **语言名称不匹配**：建立别名映射表（`js` → `javascript`）
2. **并发加载同一语言**：使用单例模式，共享加载 Promise
3. **网络失败**：降级为 `plaintext` 或 `highlightAuto`
4. **Vite 动态导入限制**：使用 `import.meta.glob` 预构建
5. **多次渲染同一代码块**：缓存高亮结果，避免重复计算
6. **组件快速卸载**：使用 `WeakRef` 或 `AbortController` 管理元素生命周期，防止内存泄漏
7. **DOM 更新时元素不存在**：在更新前检查 `document.contains(el)`

## Capabilities

### New Capabilities

无新功能能力，这是性能优化变更。

### Modified Capabilities

无需求变更，现有 spec 不需要修改。

**说明**：此变更优化了代码高亮的加载策略，但不改变功能行为。用户仍然可以高亮所有 highlight.js 支持的语言（190+ 种），只是加载时机不同。因此无需创建或修改 spec。

## Impact

### 受影响的代码模块

**核心修改**：
- `src/utils/markdown.ts` - 修改 highlight 函数，使用动态加载
- `src/utils/highlightLanguageManager.ts` - **新建**，语言加载管理器
- `vite.config.ts` - 添加 `import.meta.glob` 配置，优化代码分割

**测试文件修改**：
- `src/__test__/utils/markdown.test.ts` - 调整测试，支持异步高亮
- `src/__test__/utils/codeHighlight.test.ts` - Mock 动态导入
- `src/__test__/components/chat/ChatBubble.test.tsx` - 更新 mock 方式

**样式文件**：
- 保持 `highlight.js/styles/atom-one-dark.css` 不变

### UI 组件

**无需修改**（如果采用选项 A：同步渲染 + 异步更新）：
- 现有组件自动受益，无需改动

**可能需要修改**（如果采用选项 B：React 组件方案）：
- 将 `markdown.ts` 的 highlight 函数改为返回 React 组件
- 或创建 `<AsyncCodeHighlight>` 组件替换内联 HTML

### 外部依赖

- ✅ 无新增依赖
- ✅ highlight.js 版本保持 `11.11.1` 不变

### 兼容性

- ✅ **向后兼容**：所有现有功能保持不变
- ✅ **Web 环境**：动态导入在 Web 和 Tauri 环境均可用
- ✅ **离线能力**：语言包打包到本地，无需网络

### 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 罕见语言首次加载延迟 | 用户体验稍差 | 两阶段渲染 + 加载提示 |
| 并发加载性能 | 多个代码块可能卡顿 | 单例模式 + Promise 共享 |
| Vite 构建失败 | 动态导入路径问题 | 使用 `import.meta.glob` |
| 测试覆盖不足 | Mock 复杂度增加 | 完善 Mock 策略 |

## Success Criteria

### 定量指标

- ✅ **打包体积减少 70%**：vendor-markdown chunk 从 500KB 降至 150KB
- ✅ **首屏加载时间减少 70%**：Lighthouse 性能分数提升
- ✅ **代码覆盖率保持**：测试覆盖率不低于当前水平

### 定性指标

- ✅ **用户体验**：80%+ 的代码块立即高亮（0 延迟）
- ✅ **无白屏**：两阶段渲染确保内容立即可见
- ✅ **降级优雅**：加载失败时仍能显示代码
- ✅ **代码质量**：通过所有 lint 和 typecheck

## Open Questions

1. **预加载语言清单**：上述 15 种语言是否合理？是否需要根据实际使用数据调整？
2. **加载提示 UI**：是否显示 "⏳ 加载语法高亮..." 提示？还是静默加载？
3. **缓存策略**：是否将已加载语言缓存到 IndexedDB？（二次访问更快）
4. **React 组件方案**：采用选项 A（DOM 更新）还是选项 B（React 组件）？
5. **性能监控**：是否添加统计埋点，监控语言使用频率？
