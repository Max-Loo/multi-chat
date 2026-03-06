# Highlight.js 动态加载策略 - 技术设计文档

## Context

### 当前状态

项目中 highlight.js 采用完整引入方式：

```typescript
// src/utils/markdown.ts
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

// 打包后体积约 500KB，包含所有 190+ 种语言
```

**问题**：
- 打包体积过大（500KB），占据 `vendor-markdown` chunk 的绝大部分
- 首屏加载时间延长约 200ms
- 实际使用中只需要 20-30 种语言，其余语言打包但未使用

### 约束条件

1. **功能完整性**：必须支持所有 highlight.js 语言（190+ 种），不能因优化减少功能
2. **用户体验**：不能引入白屏或明显的延迟感知
3. **技术栈**：基于 Vite + React + TypeScript，使用 markdown-it 渲染
4. **运行环境**：Tauri 桌面应用和 Web 环境（需要跨平台兼容）
5. **离线能力**：语言包必须打包到本地，不能依赖 CDN

### 利益相关者

- **最终用户**：期望快速加载应用，代码块立即高亮
- **开发者**：期望代码可维护，测试覆盖完整
- **构建系统**：期望打包体积小，代码分割合理

## Goals / Non-Goals

**Goals:**
- 减少 highlight.js 初始打包体积 **70%**（500KB → 150KB）
- 保持所有 190+ 种语言的完整支持
- 80%+ 的代码块实现 **0 延迟**高亮（预加载语言）
- 剩余 20% 代码块的首次加载延迟控制在 **200-500ms** 内
- 实现两阶段渲染，避免白屏
- 建立语言加载缓存机制，避免重复加载

**Non-Goals:**
- 不改变代码高亮的功能行为（API 保持不变）
- 不新增外部依赖
- 不修改 highlight.js 样式主题
- 不实现语言使用统计（埋点）- 留待未来优化
- 不实现 IndexedDB 持久化缓存（内存缓存已足够）

## Decisions

### 决策 1: 单例语言加载管理器（HighlightLanguageManager）

**选择**：创建单例类 `HighlightLanguageManager`，统一管理语言加载。

**理由**：
- **避免重复加载**：使用 `Set<string>` 缓存已加载语言
- **支持并发共享**：使用 `Map<string, Promise<void>>` 缓存加载中 Promise，多个代码块同时请求同一语言时共享请求
- **统一接口**：封装加载逻辑，调用方无需关心底层实现
- **语言别名**：统一处理 `js` → `javascript`、`ts` → `typescript` 等别名映射

**替代方案及拒绝理由**：
- **每次调用都加载** → 导致重复网络请求和性能问题
- **全局变量缓存** → 缺乏封装，容易造成状态污染
- **React Context** → 过度设计，语言加载是全局单例，不需要 React 生命周期

**实现要点**：
```typescript
class HighlightLanguageManager {
  private static instance: HighlightLanguageManager;
  private loadedLanguages = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  static getInstance(): HighlightLanguageManager {
    if (!HighlightLanguageManager.instance) {
      HighlightLanguageManager.instance = new HighlightLanguageManager();
    }
    return HighlightLanguageManager.instance;
  }

  async loadLanguage(lang: string): Promise<boolean> {
    // 检查缓存 → 返回 true
    // 检查正在加载 → 返回现有 Promise
    // 首次加载 → 动态 import + registerLanguage
  }
}
```

---

### 决策 2: 预加载 15 种常见语言

**选择**：在应用初始化时同步加载 15 种常见编程语言。

**清单**：
javascript, typescript, python, java, cpp, xml (html), css, bash, json, markdown, sql, go, rust, yaml, csharp

**理由**：
- **高覆盖率**：基于 AI 聊天场景和测试覆盖，这 15 种语言覆盖约 80-85% 的实际使用
- **平衡体积**：15 种语言约 100KB（加上核心库 50KB = 150KB 总体积），比完整版减少 70%
- **零延迟**：预加载语言可立即高亮，用户无感知
- **数据支持**：项目测试文件覆盖了 23 种语言，其中这 15 种为高频语言

**替代方案及拒绝理由**：
- **全量加载（190+ 种）** → 体积过大（500KB），违反优化目标
- **完全不预加载** → 所有语言都有延迟，用户体验差
- **预加载 30 种语言** → 体积增加至 250KB，收益递减

**实现要点**：
```typescript
// src/utils/highlightLanguageManager.ts
export function preloadCommonLanguages(): void {
  const commonLangs = [
    'javascript', 'typescript', 'python', 'java', 'cpp',
    'xml', 'css', 'bash', 'json', 'markdown',
    'sql', 'go', 'rust', 'yaml', 'csharp'
  ];

  commonLangs.forEach(lang => {
    import(`highlight.js/lib/languages/${lang}.js`).then(module => {
      hljs.registerLanguage(lang, module.default);
      manager.markAsLoaded(lang);
    });
  });
}
```

---

### 决策 3: 两阶段渲染策略（同步检查 + 异步更新 DOM）

**选择**：markdown-it 的 highlight 函数保持同步，先检查语言是否已加载，决定立即高亮或返回纯文本。异步加载完成后通过 DOM 更新替换为高亮代码。

**方案（修正版）**：
```typescript
// markdown-it 的 highlight 回调（必须是同步函数）
highlight: function (str, lang) {
  const manager = HighlightLanguageManager.getInstance();
  
  // 第一阶段：同步检查
  if (manager.isLoaded(lang)) {
    // 语言已加载 → 立即高亮并返回
    const result = manager.highlightSync(str, lang);
    return result;
  }
  
  // 语言未加载 → 启动异步加载（非阻塞）
  manager.loadLanguageAsync(lang).then(() => {
    const highlighted = manager.highlightSync(str, lang);
    updateCodeBlockDOM(str, lang, highlighted);
  }).catch(() => {
    // 加载失败，保持纯文本或尝试 highlightAuto
    const autoResult = hljs.highlightAuto(str);
    if (autoResult.language) {
      updateCodeBlockDOM(str, lang, autoResult.value);
    }
  });
  
  // 立即返回纯文本（不等待异步加载）
  return `<pre><code class="hljs language-${lang}">${escapeHtml(str)}</code></pre>`;
}
```

**理由**：
- **兼容 markdown-it 同步 API**：highlight 回调是同步函数，必须立即返回字符串
- **避免白屏**：第一阶段立即返回纯文本，内容立即可见
- **零延迟高亮**：预加载语言在第一阶段直接高亮，无需等待
- **渐进增强**：罕见语言从纯文本 → 高亮代码，视觉上可接受
- **性能友好**：DOM 更新在浏览器空闲时执行，不阻塞渲染

**替代方案及拒绝理由**：
- **异步函数返回 Promise** → markdown-it 不会等待 Promise，会显示 "[object Promise]"
- **React 组件方案** → 需要重构整个 markdown 渲染流程，将 markdown-it 替换为 react-markdown，改动较大
- **等待加载完成后渲染** → 引入白屏，用户体验差
- **全量预加载** → 体积增加至 500KB，违反优化目标

**关键设计要点**：

1. **同步高亮方法**：
```typescript
class HighlightLanguageManager {
  // 新增：同步高亮方法（语言必须已加载）
  highlightSync(code: string, lang: string): string {
    if (!this.loadedLanguages.has(lang)) {
      throw new Error(`Language ${lang} not loaded`);
    }
    return hljs.highlight(code, { language: lang }).value;
  }
  
  // 新增：同步检查方法
  isLoaded(lang: string): boolean {
    const resolvedLang = this.resolveAlias(lang);
    return this.loadedLanguages.has(resolvedLang);
  }
  
  // 修改：异步加载方法（不返回结果，仅触发加载）
  async loadLanguageAsync(lang: string): Promise<void> {
    const resolvedLang = this.resolveAlias(lang);
    
    if (this.loadedLanguages.has(resolvedLang)) {
      return;  // 已加载
    }
    
    if (this.loadingPromises.has(resolvedLang)) {
      return this.loadingPromises.get(resolvedLang);  // 正在加载中
    }
    
    // 首次加载
    const promise = this.doLoadLanguage(resolvedLang);
    this.loadingPromises.set(resolvedLang, promise);
    
    try {
      await promise;
      this.loadedLanguages.add(resolvedLang);
    } catch (error) {
      this.loadingPromises.delete(resolvedLang);
      throw error;
    }
  }
}
```

2. **DOM 更新策略（使用 WeakRef 管理生命周期）**：
```typescript
// codeBlockUpdater.ts
interface PendingUpdate {
  codeElement: WeakRef<HTMLCodeElement>;
  plainText: string;
  language: string;
  timestamp: number;
}

const pendingUpdates = new Map<string, PendingUpdate>();

function updateCodeBlockDOM(code: string, lang: string, highlightedHtml: string) {
  // 生成唯一标识（基于代码内容和语言）
  const updateId = `${lang}:${hashString(code)}`;
  
  // 查找所有匹配的 code 元素
  const codeElements = document.querySelectorAll(`code[class*="language-${lang}"]`);
  
  codeElements.forEach(el => {
    const codeEl = el as HTMLCodeElement;
    
    // 检查元素是否仍在 DOM 中
    if (!document.contains(codeEl)) {
      return;
    }
    
    // 检查内容是否匹配
    if (codeEl.textContent === code) {
      // 使用 WeakRef 避免内存泄漏
      const weakRef = new WeakRef(codeEl);
      pendingUpdates.set(updateId, {
        codeElement: weakRef,
        plainText: code,
        language: lang,
        timestamp: Date.now()
      });
      
      // 更新 DOM
      codeEl.innerHTML = highlightedHtml;
      
      // 添加过渡动画类（可选）
      codeEl.classList.add('code-highlight-transition');
      
      // 5 秒后清理记录
      setTimeout(() => {
        pendingUpdates.delete(updateId);
      }, 5000);
    }
  });
}

// 组件卸载时调用（可选）
function cleanupPendingUpdates() {
  pendingUpdates.clear();
}
```

3. **错误处理和降级**：
```typescript
// 如果异步加载失败，降级为 highlightAuto
manager.loadLanguageAsync(lang).catch(() => {
  const autoResult = hljs.highlightAuto(str);
  if (autoResult.language) {
    updateCodeBlockDOM(str, lang, autoResult.value);
  }
  // 如果 highlightAuto 也失败，保持纯文本（已显示）
});
```

---

### 决策 4: Vite import.meta.glob 预构建语言包

**选择**：使用 Vite 的 `import.meta.glob` 预构建所有语言包，实现动态导入。

**配置**：
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-highlight-core': [
            'highlight.js/lib/core',
            'highlight.js/styles/atom-one-dark.css',
          ],
        },
      },
    },
  },
});

// src/utils/highlightLanguageManager.ts
const languageModules = import.meta.glob(
  'highlight.js/lib/languages/*.js'
);

async function loadLanguage(lang: string) {
  const path = `highlight.js/lib/languages/${lang}.js`;
  const module = await languageModules[path]?.();

  if (module) {
    hljs.registerLanguage(lang, module.default);
    return true;
  }

  return false;
}
```

**理由**：
- **Vite 原生支持**：`import.meta.glob` 是 Vite 推荐的动态导入方式
- **代码分割**：每个语言包会被自动分割成独立 chunk（5-20KB）
- **构建时分析**：Vite 在构建时解析所有语言包路径，避免运行时路径拼接错误
- **Tree-shaking**：未使用的语言包不会被打包

**替代方案及拒绝理由**：
- **动态 require** (`import('highlight.js/lib/languages/' + lang + '.js')`) → Vite 不支持完全动态的路径拼接，会报错
- **手动编写 import 语句** → 需要为 190+ 种语言手动写 import，不现实
- **CDN 外部化** → 桌面应用需要离线能力，不能依赖 CDN

---

### 决策 5: 三级降级机制

**选择**：实现三级降级策略，确保在任何情况下都能显示代码。

**流程**：
```typescript
async highlight(code: string, lang: string): Promise<string> {
  // Level 1: 尝试加载指定语言
  const loaded = await this.loadLanguage(lang);
  if (loaded && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value;
  }

  // Level 2: 失败则使用 highlightAuto 自动检测
  if (hljs.getLanguage('plaintext')) {
    const result = hljs.highlightAuto(code);
    if (result.language) {
      return result.value;
    }
  }

  // Level 3: 再失败则显示纯文本（转义 HTML）
  return `<pre><code>${escapeHtml(code)}</code></pre>`;
}
```

**理由**：
- **健壮性**：即使语言包加载失败，用户也能看到代码
- **自动检测**：`highlightAuto` 可以识别部分语言（即使未加载完整包）
- **优雅降级**：从最佳体验（指定语言）→ 自动检测 → 纯文本，逐级降级

**替代方案及拒绝理由**：
- **加载失败就显示错误** → 用户看到错误提示，体验差
- **只尝试指定语言** → 无法处理未知语言
- **全部使用 highlightAuto** → 准确率不如指定语言

---

### 决策 6: 不实现 IndexedDB 持久化缓存

**选择**：仅使用内存缓存（Set + Map），不实现 IndexedDB 持久化。

**理由**：
- **收益有限**：语言包打包在本地，二次访问时从浏览器缓存加载很快（~10ms）
- **复杂度增加**：IndexedDB 需要异步 API、版本管理、错误处理
- **内存已足够**：15 种预加载语言 + 用户会话中加载的语言，内存占用可控（< 5MB）
- **Tauri 环境**：桌面应用通常长时间运行，内存缓存不会失效

**未来可选优化**：
- 如果数据显示用户频繁切换不同语言，可考虑添加 IndexedDB 缓存
- 可作为性能监控数据驱动决策

---

## Risks / Trade-offs

### 风险 1: 罕见语言首次加载延迟 200-500ms

**影响**：用户首次遇到罕见语言（如 Haskell、Lisp）时，会看到短暂的纯文本代码，然后替换为高亮代码。

**缓解措施**：
- ✅ 两阶段渲染：先显示纯文本，避免白屏
- ✅ 可选：在代码块右上角显示小字 "⏳ 加载语法高亮..."（如果用户反馈需要）
- ✅ 优化视觉：使用 CSS 过渡动画减少闪烁感
- 📊 监控数据：收集语言加载频率，如果某些"罕见"语言经常出现，可加入预加载清单

**权衡**：接受 20% 场景的短暂延迟，换取 70% 的体积减少和 80% 场景的零延迟。

---

### 风险 2: DOM 更新策略的设计挑战

**影响**：直接操作 DOM 更新代码块，需要处理多个技术挑战。

**挑战 1：元素定位不可靠**
- **问题**：通过 `innerHTML` 字符串匹配查找元素不够精确
- **缓解**：
  - ✅ 使用 `textContent` 匹配（更可靠）
  - ✅ 结合语言类名 `class*="language-${lang}"` 过滤
  - ✅ 如果仍有多个匹配，使用 `hashString(code)` 生成唯一 ID

**挑战 2：组件卸载时内存泄漏**
- **问题**：`setTimeout` 回调可能在组件卸载后仍尝试更新 DOM
- **缓解**：
  - ✅ 使用 `WeakRef<HTMLCodeElement>` 存储元素弱引用
  - ✅ 在更新前检查 `document.contains(el)`
  - ✅ 或使用 `AbortController` 在卸载时取消待处理的更新
  ```typescript
  const weakRef = new WeakRef(codeElement);
  if (!document.contains(codeElement)) return;  // 元素已卸载
  ```

**挑战 3：与 React 虚拟 DOM 不同步**
- **问题**：直接 DOM 操作与 React 的虚拟 DOM 不同步
- **缓解**：
  - ✅ 仅更新 `innerHTML`，不修改 DOM 结构
  - ✅ 更新操作在 `setTimeout(..., 0)` 中执行，确保 React 渲染完成
  - ✅ 测试验证：React 重新渲染时，DOM 更新不会被覆盖（通过 `dangerouslySetInnerHTML` 的值保持一致）

**挑战 4：视觉闪烁**
- **问题**：纯文本代码 → 高亮代码的瞬间，内容会发生变化
- **缓解**：
  - ✅ CSS 过渡：添加 `transition: opacity 0.2s ease`，使变化更平滑
  - ✅ 最小化 DOM 操作：仅更新必要的元素
  - ✅ 测试覆盖：验证 DOM 更新不会导致布局偏移

**备选方案**：
- 🔄 如果 DOM 更新证明不可行，可考虑 React 组件方案（代价是改动较大）

---

### 风险 3: 并发加载同一语言导致重复请求

**影响**：一条消息包含多个相同语言的代码块时，可能触发多次加载请求。

**缓解措施**：
- ✅ 单例模式 + Promise 缓存：`Map<string, Promise<void>>` 确保同一语言只加载一次
- ✅ 测试验证：编写并发测试用例，验证加载函数只被调用一次
- 📊 性能监控：添加日志监控语言加载次数，确保缓存生效

---

### 风险 4: Vite 构建失败或动态导入路径错误

**影响**：`import.meta.glob` 配置不当可能导致语言包无法正确分割。

**缓解措施**：
- ✅ 构建验证：运行 `pnpm web:build` 后检查 `dist/` 目录，确认语言包被正确分割
- ✅ 手动测试：在浏览器 DevTools Network 面板验证语言包按需加载
- ✅ 回退方案：如果动态导入失败，可临时改为预加载更多语言（体积增加但稳定性更高）
- 📝 文档：在 AGENTS.md 中记录 Vite 配置要点，避免未来误改

---

### 风险 5: 测试覆盖不足导致回归

**影响**：异步加载逻辑增加了测试复杂度，可能遗漏边界情况。

**缓解措施**：
- ✅ Mock 动态导入：使用 `vi.mock()` 模拟 `import()` 返回值
- ✅ 单元测试：覆盖 `HighlightLanguageManager` 的所有方法（加载、缓存、别名）
- ✅ 集成测试：验证 markdown 渲染的完整流程
- ✅ 手动测试：在不同场景下验证（首次访问、二次访问、并发加载、加载失败）

---

### 风险 6: markdown-it 的同步 API 与异步加载冲突

**影响**：markdown-it 的 `highlight` 函数是同步的，期望立即返回字符串，但动态加载是异步的。

**根本原因**：
- markdown-it 的 `highlight` 回调是同步函数，返回值会被直接使用
- 如果返回 Promise，markdown-it 会将其转换为字符串 `"[object Promise]"`
- markdown-it 的 `render()` 是同步的，整个 `generateCleanHtml()` 也是同步的
- React 组件在 render 阶段调用 `generateCleanHtml(content)`，期望立即得到 HTML 字符串

**已采用的解决方案**（决策 3）：
- ✅ **同步检查 + 异步更新 DOM**：
  - 第一阶段：同步检查语言是否已加载
  - 如果已加载：立即调用 `highlightSync()` 返回高亮 HTML
  - 如果未加载：立即返回纯文本，同时启动异步加载（非阻塞）
  - 异步加载完成后，通过副作用（DOM 更新）替换为高亮代码
- ✅ **保持 API 兼容**：highlight 函数保持同步，返回字符串
- ✅ **避免白屏**：第一阶段立即返回纯文本，内容立即可见

**技术细节**：
```typescript
// ✅ 正确：同步函数，立即返回字符串
highlight: function (str, lang) {
  if (manager.isLoaded(lang)) {
    return manager.highlightSync(str, lang);  // 同步返回
  }
  
  // 启动异步加载（不等待）
  manager.loadLanguageAsync(lang).then(() => {
    const highlighted = manager.highlightSync(str, lang);
    updateCodeBlockDOM(str, lang, highlighted);
  });
  
  // 立即返回纯文本
  return `<pre><code>${escapeHtml(str)}</code></pre>`;
}

// ❌ 错误：异步函数，markdown-it 不会等待
highlight: async function (str, lang) {
  return await manager.highlight(str, lang);  // 返回 Promise
}
// 结果：markdown-it 显示 "[object Promise]"
```

**备选方案**（如果当前方案证明不可行）：
- 🔄 **方案 A**：迁移到 `react-markdown`（支持异步高亮）
  - 代价：需要重构整个 markdown 渲染流程
  - 收益：原生支持异步，更符合 React 生态
- 🔄 **方案 B**：预加载更多语言（保守方案）
  - 预加载 30-40 种语言（体积 200-250KB）
  - 覆盖率 95%+，减少动态加载需求
  - 代价：体积增加，但实现简单

---

## Migration Plan

### 实施步骤

#### 阶段 1: 基础设施（1-2 天）
1. **创建语言加载管理器**
   - 实现 `HighlightLanguageManager` 单例类
   - 实现 `loadLanguage()` 方法，支持缓存和并发控制
   - 实现语言别名映射（`js` → `javascript` 等）
   - 编写单元测试

2. **配置 Vite**
   - 添加 `import.meta.glob` 预构建语言包
   - 优化 `manualChunks` 配置，分离 highlight.js 核心库
   - 验证构建输出

#### 阶段 2: 核心功能（1-2 天）
3. **修改 markdown.ts**
   - 将 `import hljs from "highlight.js"` 改为 `import hljs from "highlight.js/lib/core"`
   - 添加预加载逻辑，在应用初始化时加载 15 种常见语言
   - 修改 `highlight` 函数，使用 `HighlightLanguageManager`
   - 实现两阶段渲染：同步返回纯文本，异步更新 DOM
   - 实现三级降级机制

4. **创建 DOM 更新工具函数**
   - 实现 `updateCodeBlockElement()` 函数
   - 添加 CSS 过渡动画（可选）

#### 阶段 3: 测试与验证（1 天）
5. **更新测试文件**
   - 修改 `src/__test__/utils/markdown.test.ts`，支持异步高亮
   - 修改 `src/__test__/utils/codeHighlight.test.ts`，Mock 动态导入
   - 更新组件测试中的 mock
   - 添加并发加载测试用例

6. **手动测试**
   - 测试预加载语言（应立即高亮）
   - 测试罕见语言（应先显示纯文本，后替换为高亮）
   - 测试加载失败场景（网络断开、语言不存在）
   - 测试并发加载（多条消息同时包含相同语言）
   - 测试不同环境（Tauri、Web）

#### 阶段 4: 性能验证（0.5 天）
7. **构建分析**
   - 运行 `pnpm web:build`
   - 检查 `dist/stats.html`，确认 vendor-markdown chunk 减少至 150KB
   - 验证语言包被正确分割为独立 chunks
   - 测量首屏加载时间（Lighthouse）

8. **代码质量检查**
   - 运行 `pnpm lint`（oxlint）
   - 运行 `pnpm tsc`（类型检查）
   - 运行 `pnpm test:all`（所有测试通过）
   - 确认测试覆盖率不低于当前水平

---

### 回滚策略

**触发条件**：
- 构建失败或运行时错误无法快速修复
- 性能指标未达到预期（体积减少 < 50%）
- 用户体验严重退化（如大量闪烁、白屏）

**回滚步骤**：
1. Git revert 到变更前的 commit
2. 恢复 `src/utils/markdown.ts` 中的完整 import：`import hljs from "highlight.js"`
3. 删除 `src/utils/highlightLanguageManager.ts` 文件
4. 移除 Vite 配置中的 `import.meta.glob`
5. 运行 `pnpm test:all` 验证回滚成功

**时间成本**：约 15 分钟

---

## Open Questions

### 问题 1: 是否显示"加载语法高亮..."提示？

**背景**：罕见语言首次加载时，用户会看到纯文本代码 → 高亮代码的变化，可能疑惑发生了什么。

**选项**：
- A. 不显示提示（默认） - 静默加载，减少视觉干扰
- B. 显示小字提示 - 在代码块右上角显示 "⏳ 加载语法高亮..."，加载完成后消失

**建议**：先实现选项 A，根据用户反馈决定是否添加提示。

---

### 问题 2: 预加载语言清单是否需要数据支持？

**背景**：当前 15 种语言基于经验判断，可能需要实际使用数据验证。

**选项**：
- A. 当前清单已足够 - 基于 AI 聊天场景和测试覆盖，80% 覆盖率合理
- B. 添加埋点统计 - 收集语言使用频率，动态调整预加载清单
- C. 预加载更多语言 - 增加至 20-25 种，提升覆盖率至 90%+（体积约 200KB）

**建议**：先实现选项 A，如果性能指标达标（80% 覆盖率），无需额外优化。可选择性添加埋点（问题 5）。

---

### 问题 3: DOM 更新是否会导致 React 状态不同步？

**背景**：直接操作 DOM 更新代码块，可能与 React 的虚拟 DOM 产生冲突。

**分析**：
- markdown 渲染在 `useMarkdownRender.ts` hook 中完成，最终输出 HTML 字符串
- 使用 `dangerouslySetInnerHTML` 插入到 React 组件
- 直接 DOM 更新可能绕过 React 的 reconciliation

**缓解措施**：
- ✅ 更新操作在 `setTimeout(..., 0)` 中执行，确保 React 渲染完成
- ✅ 仅更新内容（`innerHTML`），不修改 DOM 结构
- ✅ 测试验证：在 React DevTools 中检查组件状态是否一致

**备选方案**：如果证明有问题，可改用 React 组件方案（决策 3 的备选）。

---

### 问题 4: 是否需要支持 CSS 过渡动画？

**背景**：纯文本 → 高亮代码的切换可能产生视觉闪烁，CSS 过渡可以平滑过渡。

**选项**：
- A. 不添加动画（默认） - 保持简单，减少视觉干扰
- B. 淡入淡出 - 添加 `opacity: 0` → `opacity: 1` 过渡
- C. 渐变高亮 - 从无颜色到有颜色的渐变

**建议**：先实现选项 A，手动测试时观察是否有明显闪烁。如果有，再添加选项 B。

**实现示例**（选项 B）：
```css
.code-highlight-transition {
  transition: opacity 0.2s ease-in-out;
}
.code-highlight-loading {
  opacity: 0.7;
}
```

---

### 问题 5: 是否添加性能监控埋点？

**背景**：需要数据验证优化效果和用户实际使用模式。

**监控指标**：
- 语言加载频率（每种语言的加载次数）
- 语言加载耗时（p50, p95, p99）
- 两阶段渲染的实际覆盖率（预加载语言命中次数 / 总高亮次数）
- DOM 更新是否成功（更新失败次数）

**选项**：
- A. 不添加埋点（默认） - 简化实现，依赖手动测试和构建分析
- B. 添加控制台日志 - 开发环境输出统计信息
- C. 集成分析工具 - 如 Google Analytics、Sentry（需要用户同意）

**建议**：先实现选项 B（控制台日志），在开发环境验证。如果需要生产环境数据，再考虑选项 C。

**实现示例**（选项 B）：
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`[HighlightJS] Loaded language: ${lang}, duration: ${duration}ms`);
  console.log(`[HighlightJS] Cache hit rate: ${cacheHits}/${totalRequests}`);
}
```

---

## 附录

### A. 预加载语言清单详细数据

| 语言 | highlight.js 名称 | 包大小 | 估计使用频率 | 理由 |
|------|------------------|--------|------------|------|
| JavaScript | `javascript` | ~12KB | ⭐⭐⭐⭐⭐ | Web 开发核心语言 |
| TypeScript | `typescript` | ~15KB | ⭐⭐⭐⭐⭐ | 项目自身语言 |
| Python | `python` | ~10KB | ⭐⭐⭐⭐⭐ | AI/数据科学热门 |
| Java | `java` | ~14KB | ⭐⭐⭐⭐ | 企业开发主流 |
| C++ | `cpp` | ~11KB | ⭐⭐⭐⭐ | 系统编程常用 |
| HTML | `xml` | ~8KB | ⭐⭐⭐⭐ | 标记语言基础 |
| CSS | `css` | ~9KB | ⭐⭐⭐⭐ | 样式表必备 |
| Bash | `bash` | ~7KB | ⭐⭐⭐ | DevOps 脚本 |
| JSON | `json` | ~5KB | ⭐⭐⭐ | 数据交换格式 |
| Markdown | `markdown` | ~6KB | ⭐⭐⭐ | 文档编写 |
| SQL | `sql` | ~8KB | ⭐⭐ | 数据库查询 |
| Go | `go` | ~9KB | ⭐⭐ | 云原生热门 |
| Rust | `rust` | ~10KB | ⭐⭐ | 系统编程新兴 |
| YAML | `yaml` | ~6KB | ⭐⭐ | 配置文件 |
| C# | `csharp` | ~11KB | ⭐ | .NET 生态 |

**总计**：约 140KB（未压缩），加上核心库 50KB = 190KB。gzip 后约 150KB。

---

### B. Vite 构建配置示例

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Highlight.js 核心库独立打包
          if (id.includes('highlight.js/lib/core')) {
            return 'vendor-highlight-core';
          }
          // 预加载语言打包到 core chunk
          if (id.includes('highlight.js/lib/languages') &&
              ['javascript', 'typescript', 'python', 'java', 'cpp',
               'xml', 'css', 'bash', 'json', 'markdown',
               'sql', 'go', 'rust', 'yaml', 'csharp']
               .some(lang => id.includes(`/languages/${lang}.js`))) {
            return 'vendor-highlight-core';
          }
          // 其他语言动态分割
          if (id.includes('highlight.js/lib/languages')) {
            return 'vendor-highlight-languages';
          }
        },
      },
    },
  },
});
```

**说明**：
- `vendor-highlight-core`: 核心库 + 15 种预加载语言（约 150KB）
- `vendor-highlight-languages`: 其他语言包，按需分割（每个 5-20KB）

---

### C. 测试策略

**单元测试**：
- `HighlightLanguageManager` 的所有方法
- 语言别名映射逻辑
- 缓存机制（加载状态、Promise 共享）
- 降级机制（三级 fallback）

**集成测试**：
- markdown 渲染完整流程
- 预加载语言立即高亮
- 罕见语言两阶段渲染
- 并发加载同一语言
- 加载失败降级

**组件测试**：
- `ChatBubble` 组件中的代码块渲染
- `ThinkingSection` 组件中的代码块渲染

**性能测试**：
- 构建体积对比（优化前后）
- 首屏加载时间（Lighthouse）
- 语言加载耗时（p50, p95, p99）

---

### D. 参考资源

- [highlight.js 官方文档 - 按需引入](https://highlightjs.org/usage/)
- [Vite import.meta.glob 文档](https://vitejs.dev/guide/features.html#glob-import)
- [Vite 代码分割最佳实践](https://vitejs.dev/guide/build.html#chunking-strategies)
- [Webpack 动态导入 vs Vite import.meta.glob](https://blog.logrocket.com/conditional-imports-vite/)
