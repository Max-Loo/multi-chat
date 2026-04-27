## Context

当前 `vite.config.ts` 中的 `manualChunks` 函数使用 `id.includes("包名")` 做路径匹配来分割构建产物。但 pnpm 的存储路径格式为 `.pnpm/<包名>@<版本>_<依赖名>@<版本>/node_modules/<包名>/...`，路径中包含依赖信息（如 `_zod@4.3.6`），导致 `id.includes()` 匹配到错误的包。

具体表现：
- `ai@6.0.116_zod@4.3.6/node_modules/ai/...` 路径含 "zod" → 整个 AI SDK（~500KB）被归入 `vendor-zod`
- `@ai-sdk/deepseek@2.0.24_zod@4.3.6/...` 路径含 "zod" → 同上
- `zhipu-ai-provider@0.2.2_zod@4.3.6/...` 路径含 "zod" → 同上
- `id.includes("ai")` 过于宽泛，可能匹配路径中含 "ai" 的无关包（如 `obtain`, `detail`）

## Goals / Non-Goals

**Goals:**
- 精确匹配包名，不受 pnpm 路径中依赖信息的干扰
- 将 AI SDK（~500KB）从 `vendor-zod` 移到 `vendor-ai`
- 确保 `vendor-zod` 只包含 zod 本身
- 确保 highlight.js 语言定义正确分类
- 保持现有的 chunk 分组策略（只修复匹配逻辑，不改变分组策略）

**Non-Goals:**
- 不改变 chunk 分组策略（不合并或拆分现有的 vendor 组）
- 不优化 chunk 内容（如 tree-shaking、按需加载等）
- 不引入新的构建工具或插件

## Decisions

### 决策 1：包名提取函数

从模块路径中提取实际包名，而非在整个路径上做字符串匹配。

**方案**：使用正则从路径中提取 `/node_modules/<包名>/` 部分（兼容 pnpm 的 `.pnpm/` 中间路径）。

```typescript
function getPackageName(id: string): string | null {
  const match = id.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/);
  return match ? match[1] : null;
}
```

**替代方案**：
- 使用 `id.split('node_modules/').pop()?.split('/')[0]` — 简单但对 `.pnpm` 路径可能不准确
- 使用 Vite 内置的包名解析 — 不存在此 API

**理由**：正则方案覆盖了 pnpm 和 npm/yarn 两种路径结构。捕获组 `(@[^/]+\/[^/]+|[^/]+)` 先尝试匹配 scoped 包（`@scope/name`），否则匹配普通包名，确保 `@ai-sdk/deepseek` 等完整提取。

### 决策 2：匹配策略改为包名全等比较

将 `id.includes("zod")` 改为 `pkg === "zod"` 或 `pkg.startsWith("@ai-sdk")` 的精确匹配。

**理由**：全等比较杜绝了子字符串误匹配的可能。

### 决策 3：chunk 分组映射表

用映射表替代 if-else 链，提升可读性和可维护性。

```typescript
const chunkMap: Record<string, string> = {
  "zod": "vendor-zod",
  "ai": "vendor-ai",
  "zhipu-ai-provider": "vendor-ai",
  "i18next": "vendor-i18n",
  "react-i18next": "vendor-i18n",
  // ...
};
```

**替代方案**：保留 if-else 结构 — 理由是部分包需要特殊逻辑（如 highlight.js 的语言分类），映射表无法完全替代。

**决策**：混合策略 — 简单的包名匹配用映射表，highlight.js 等需要特殊逻辑的保留条件判断。

## Risks / Trade-offs

- **[正则兼容性]** → 正则已在 macOS/Linux 的 pnpm 路径上验证，Windows 路径分隔符不同但 Vite 统一使用 `/`
- **[chunk 名称变化]** → 修复后 chunk hash 会变化，但不影响功能，浏览器缓存会自动失效
- **[新依赖加入]** → 未来添加新依赖时，若不在映射表中会落入 catch-all `vendor` chunk，需要手动补充。这是可接受的行为，与当前一致
