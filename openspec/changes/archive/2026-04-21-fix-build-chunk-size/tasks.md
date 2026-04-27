## 1. 包名提取工具函数

- [x] 1.1 在 `vite.config.ts` 中实现 `getPackageName(id)` 函数，使用正则从路径中提取实际包名，兼容 pnpm `.pnpm/` 中间路径
- [x] 1.2 验证函数对关键路径的匹配正确性：`ai@6.0.116_zod@4.3.6/node_modules/ai/...`、`@ai-sdk+deepseek@2.0.24_zod@4.3.6/node_modules/@ai-sdk/deepseek/...`、`node_modules/react/...`

## 2. 重构 manualChunks 函数

- [x] 2.1 将 `manualChunks` 中的 `id.includes()` 调用替换为 `getPackageName(id)` + 包名精确匹配
- [x] 2.2 用映射表（`Record<string, string>`）重构简单的包名→chunk 映射，替代 if-else 链
- [x] 2.3 保留 highlight.js 语言定义的特殊分类逻辑（预加载语言 vs 其他语言）
- [x] 2.4 确保所有原有 chunk 分组均使用精确匹配，包括：vendor-react, vendor-redux, vendor-router, vendor-i18n, vendor-zod, vendor-markdown, vendor-highlight-core, vendor-ai（含 `ai`、`@ai-sdk/*`、`zhipu-ai-provider`）, vendor-icons, vendor-radix, vendor-ui-utils, vendor-tauri, vendor-tanstack, vendor

## 3. 验证构建产物

- [x] 3.1 执行 `pnpm web:build`，确认构建成功无错误
- [x] 3.2 验证 `vendor-zod` chunk gzip 体积小于 20KB
- [x] 3.3 验证 `vendor-ai` chunk 包含 AI SDK 代码且体积明显大于修复前（34KB）
- [x] 3.4 验证 highlight.js 非预加载语言归入 `vendor-highlight-languages` chunk
- [x] 3.5 确认不再出现 "Some chunks are larger than 500 kB" 的构建警告
