## Why

`pnpm web:build` 构建产物中，`vendor-zod`（557KB）和 `vendor` catch-all（337KB）体积异常。根因是 pnpm 的存储路径（`.pnpm/<包名>@<版本>_<依赖>@<版本>/node_modules/<包名>/...`）包含依赖信息，导致 `manualChunks` 中的 `id.includes()` 匹配到错误的包。例如 AI SDK 路径 `ai@6.0.116_zod@4.3.6` 含 "zod"，被错误归入 `vendor-zod` chunk。

## What Changes

- 重构 `vite.config.ts` 中的 `manualChunks` 函数，使用精确的包名提取替代 `id.includes()` 字符串匹配
- 从 pnpm 路径中提取实际的包名（`/node_modules/<包名>/` 部分）再进行分类
- 将 AI SDK 从 `vendor-zod` 中分离到正确的 `vendor-ai` chunk
- 确保所有 `@ai-sdk/*` 包归入 `vendor-ai`
- 确保 highlight.js 语言定义正确分入 `vendor-highlight-core` 或 `vendor-highlight-languages`

## Capabilities

### New Capabilities

- `chunk-splitting`: 构建产物代码分割策略，定义各依赖包到 chunk 的精确映射规则

### Modified Capabilities

## Impact

- **文件变更**: `vite.config.ts`（`manualChunks` 函数重写）
- **构建产物**: 所有 vendor chunk 的大小和内容会发生变化，`vendor-zod` 预计从 557KB 降至约 14KB，`vendor-ai` 将包含正确的 AI SDK 代码
- **无运行时影响**: 仅影响构建产物的代码分割，不改变应用行为
- **无 API 变更**: 不影响任何公共接口
