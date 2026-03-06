# 优化方案修正说明

## 修正背景

在深度审查中发现了两个高优先级问题，需要对原方案进行修正。

## 修正的问题

### 问题 1：异步加载方案与 markdown-it 同步 API 不兼容 🚨

**原方案问题**：
- proposal.md 和 design.md 中提议的 `async function` 无法与 markdown-it 的同步 API 配合
- markdown-it 的 `highlight` 回调期望立即返回字符串，而不是 Promise
- 如果返回 Promise，markdown-it 会将其转换为 `"[object Promise]"` 并显示在页面上

**修正方案**：
采用**同步检查 + 异步更新 DOM** 的策略：

1. **第一阶段（同步）**：
   - markdown-it 的 `highlight` 函数保持同步
   - 检查语言是否已加载：`manager.isLoaded(lang)`
   - 如果已加载 → 立即调用 `highlightSync()` 返回高亮 HTML
   - 如果未加载 → 立即返回纯文本 HTML，同时启动异步加载

2. **第二阶段（异步）**：
   - 调用 `manager.loadLanguageAsync(lang)` 启动异步加载（非阻塞）
   - 在 `.then()` 中获取高亮结果
   - 通过 `updateCodeBlockDOM()` 更新 DOM 元素

**关键代码**：
```typescript
// ✅ 修正后：同步函数，立即返回字符串
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
```

### 问题 2：DOM 更新策略设计缺陷 🚨

**原方案问题**：
- 使用 `innerHTML` 字符串匹配查找元素不可靠
- 未处理组件卸载时的内存泄漏
- 直接操作 DOM 可能与 React 虚拟 DOM 不同步

**修正方案**：

1. **元素定位优化**：
   - 使用 `textContent` 匹配（比 `innerHTML` 更可靠）
   - 结合语言类名过滤：`code[class*="language-${lang}"]`
   - 添加唯一 ID 生成：`hashString(code)`

2. **生命周期管理**：
   - 使用 `WeakRef<HTMLCodeElement>` 存储元素弱引用
   - 在更新前检查 `document.contains(el)`
   - 或使用 `AbortController` 在组件卸载时取消更新

3. **错误处理**：
   - 添加元素存在性检查
   - 添加内容匹配验证
   - 处理并发更新冲突

**关键代码**：
```typescript
function updateCodeBlockDOM(code: string, lang: string, highlightedHtml: string) {
  const codeElements = document.querySelectorAll(`code[class*="language-${lang}"]`);

  codeElements.forEach(el => {
    // 检查元素是否仍在 DOM 中
    if (!document.contains(el)) return;

    // 检查内容是否匹配
    if (el.textContent === code) {
      el.innerHTML = highlightedHtml;
    }
  });
}
```

## 修改的文件

### 1. design.md

**修改位置**：决策 3（第 133-174 行）

**修改内容**：
- 将异步函数方案改为同步检查 + 异步更新方案
- 添加 `isLoaded()` 和 `highlightSync()` 方法
- 添加 `loadLanguageAsync()` 方法（不返回结果）
- 添加 WeakRef 生命周期管理
- 添加错误处理和降级机制

**新增内容**：
- 同步高亮方法的实现细节
- DOM 更新的完整策略（包括生命周期管理）
- markdown-it API 限制的详细说明

### 2. proposal.md

**修改位置**：
- 第 82-110 行（技术实现要点 - 修改 markdown.ts）
- 第 136-152 行（两阶段渲染实现）
- 第 194-200 行（边界情况处理）

**修改内容**：
- 更新 `highlight` 函数的实现示例（同步版本）
- 添加 `escapeHtml()` 工具函数
- 更新两阶段渲染的实现细节
- 添加组件卸载和元素不存在的边界情况

### 3. tasks.md

**修改位置**：
- 第 7-26 行（任务 1.1 - 创建语言加载管理器）
- 第 52-68 行（任务 2.1 - 修改 markdown.ts）
- 第 70-88 行（任务 2.2 - 实现 DOM 更新工具）

**修改内容**：
- 添加 `isLoaded()` 方法到任务清单
- 添加 `highlightSync()` 方法到任务清单
- 修改 `loadLanguageAsync()` 方法的签名（返回 `Promise<void>`）
- 添加 `escapeHtml()` 工具函数任务
- 更新 DOM 更新函数的参数（`code: string, lang: string, highlightedHtml: string`）
- 添加 WeakRef 和 AbortController 生命周期管理任务
- 添加元素存在性检查任务

### 4. 新增：pocs/highlight-async-loading/（任务 0）

**新增内容**：
- 添加技术验证原型（POC）任务组
- 包含 6 个子任务，用于验证关键技术方案
- 在完整实施前先创建最小可复现示例

### 5. design.md（风险部分）

**修改位置**：风险 2（第 301-310 行）和风险 6（第 348-356 行）

**修改内容**：
- 扩展风险 2 的描述，详细说明 DOM 更新的 4 个技术挑战
- 扩展风险 6 的描述，添加 markdown-it API 限制的根本原因分析
- 添加技术细节示例（✅ 正确 vs ❌ 错误）
- 添加备选方案（react-markdown、预加载更多语言）

## 技术要点总结

### 核心原则

1. **保持 markdown-it 同步 API**：
   - `highlight` 回调必须是同步函数
   - 必须立即返回字符串（不能是 Promise）
   - 使用副作用（DOM 更新）实现异步加载

2. **元素生命周期管理**：
   - 使用 `WeakRef` 避免内存泄漏
   - 在更新前检查元素是否存在
   - 或使用 `AbortController` 取消待处理的更新

3. **错误处理和降级**：
   - 语言加载失败 → 降级为 `highlightAuto()`
   - DOM 元素不存在 → 跳过更新
   - 内容不匹配 → 跳过更新

### 关键方法签名

```typescript
class HighlightLanguageManager {
  // 同步检查
  isLoaded(lang: string): boolean;

  // 同步高亮（语言必须已加载）
  highlightSync(code: string, lang: string): string;

  // 异步加载（不返回结果）
  loadLanguageAsync(lang: string): Promise<void>;
}

// DOM 更新工具
function updateCodeBlockDOM(
  code: string,
  lang: string,
  highlightedHtml: string
): void;

// HTML 转义工具
function escapeHtml(str: string): string;
```

## 影响评估

### 正面影响

1. **技术可行性**：修正后的方案与 markdown-it 的 API 完全兼容
2. **稳定性提升**：通过生命周期管理避免内存泄漏
3. **可靠性提升**：通过元素检查避免错误更新

### 负面影响

1. **复杂度增加**：需要管理 DOM 更新的生命周期
2. **测试难度增加**：需要测试组件卸载场景
3. **维护成本**：需要理解同步/异步混合模式

### 风险评估

- **技术风险**：🟢 低（POC 将验证可行性）
- **实现风险**：🟡 中（需要仔细处理生命周期）
- **维护风险**：🟡 中（需要详细的文档和注释）

## 下一步行动

1. **创建 POC**（任务 0）：
   - 验证同步检查 + 异步更新 DOM 方案
   - 验证 WeakRef 生命周期管理
   - 验证 Vite 配置

2. **如果 POC 成功**：
   - 继续完整实施（任务 1-7）

3. **如果 POC 失败**：
   - 重新评估技术方案
   - 考虑迁移到 `react-markdown`
   - 或采用保守方案（预加载 30-40 种语言）

## 参考资料

- [markdown-it 文档 - highlight 选项](https://github.com/markdown-it/markdown-it#syntax-highlighting)
- [Vite import.meta.glob 文档](https://vitejs.dev/guide/features.html#glob-import)
- [WeakRef MDN 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [AbortController MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
