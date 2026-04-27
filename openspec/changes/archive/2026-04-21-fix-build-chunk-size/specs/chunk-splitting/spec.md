## ADDED Requirements

### Requirement: 包名精确提取
`manualChunks` 函数 MUST 从模块路径中提取实际的包名进行匹配，MUST NOT 在完整路径上使用 `id.includes()` 进行包名匹配。

#### Scenario: pnpm 路径中的 zod 依赖信息不影响 ai 包分类
- **WHEN** 模块路径为 `node_modules/.pnpm/ai@6.0.116_zod@4.3.6/node_modules/ai/dist/index.mjs`
- **THEN** 提取的包名 MUST 为 `ai`，MUST NOT 为 `zod` 或其他值

#### Scenario: @scope 包名正确提取
- **WHEN** 模块路径为 `node_modules/.pnpm/@ai-sdk+deepseek@2.0.24_zod@4.3.6/node_modules/@ai-sdk/deepseek/dist/index.mjs`
- **THEN** 提取的包名 MUST 为 `@ai-sdk/deepseek`

#### Scenario: 非 pnpm 路径也能正确提取
- **WHEN** 模块路径为 `node_modules/react/index.js`
- **THEN** 提取的包名 MUST 为 `react`

### Requirement: AI SDK 归入 vendor-ai chunk
`ai` 包和所有 `@ai-sdk/*` 包 MUST 归入 `vendor-ai` chunk，MUST NOT 归入其他 chunk。

#### Scenario: ai 包归入 vendor-ai
- **WHEN** 构建包含 `ai` 包的模块
- **THEN** 这些模块 MUST 出现在 `vendor-ai` chunk 中

#### Scenario: @ai-sdk scoped 包归入 vendor-ai
- **WHEN** 构建包含 `@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`@ai-sdk/gateway` 等 scoped 包
- **THEN** 这些模块 MUST 出现在 `vendor-ai` chunk 中

#### Scenario: zhipu-ai-provider 归入 vendor-ai
- **WHEN** 构建包含 `zhipu-ai-provider` 包
- **THEN** 该包 MUST 出现在 `vendor-ai` chunk 中

### Requirement: zod 包归入 vendor-zod chunk
只有 `zod` 包本身 MUST 归入 `vendor-zod` chunk，其他任何包 MUST NOT 因为路径中含有 "zod" 字符串而被归入此 chunk。

#### Scenario: vendor-zod 不包含 AI SDK
- **WHEN** 构建完成后
- **THEN** `vendor-zod` chunk 的 gzip 体积 MUST 小于 20KB

### Requirement: highlight.js 语言定义正确分类
highlight.js 语言定义 MUST 根据 `highlightLanguageIndex.ts` 中的预加载列表分类到正确的 chunk。

#### Scenario: 预加载语言归入 vendor-highlight-core
- **WHEN** 模块路径为 highlight.js 的预加载语言（javascript, typescript, python 等 15 种）
- **THEN** 这些语言 MUST 归入 `vendor-highlight-core` chunk

#### Scenario: 其他语言归入 vendor-highlight-languages
- **WHEN** 模块路径为 highlight.js 的非预加载语言
- **THEN** 这些语言 MUST 归入 `vendor-highlight-languages` chunk，MUST NOT 归入 `vendor` catch-all chunk
