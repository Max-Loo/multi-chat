## Context

当前项目使用 Vite 作为构建工具，生产构建后产生两个过大的 chunk 文件：
- `index-D6E4_MqK.js`: 1,338 KB
- `index-CWdUKH4n.js`: 1,065 KB

这两个文件远超 500 KB 的推荐限制，导致首屏加载时间过长。分析构建产物发现，大型依赖库（React、Redux Toolkit、Zod、Ant Design X、Vercel AI SDK、lucide-react 等）全部被打包进主 chunk。

项目当前没有配置 Vite 的 `manualChunks` 选项，所有 `node_modules` 依赖都被打包到同一个 chunk 中。

## Goals / Non-Goals

**Goals:**

- 将大型依赖分离到独立的 vendor chunk，减少主 chunk 体积
- 优化首屏加载性能，提升用户体验
- 建立可长期缓存的 vendor chunk 策略
- 配置合理的 chunk 大小警告限制（500 KB）

**Non-Goals:**

- 不涉及动态导入（dynamic imports）或路由级别的代码分割
- 不修改应用的业务逻辑或功能
- 不引入新的构建工具或插件

## Decisions

### 1. 使用 Vite `manualChunks` 进行代码分割

**选择原因：**
- Vite 原生支持，无需额外配置或插件
- 细粒度控制哪些模块打包到哪个 chunk
- 与现有构建流程无缝集成

**替代方案：**
- 使用 `vite-plugin-chunk-split`：功能更强大，但增加依赖和复杂度
- 使用动态导入：需要重构应用架构，工作量大

### 2. 依赖分组策略

基于依赖体积和更新频率，将依赖分为以下 8 个 chunk：

| Chunk 名称 | 包含的依赖 | 理由 |
|------------|------------|------|
| `vendor-react.js` | `react`, `react-dom` | React 是核心依赖，更新频率低，适合长期缓存 |
| `vendor-redux.js` | `@reduxjs/toolkit`, `react-redux` | Redux 状态管理，与 React 解耦 |
| `vendor-zod.js` | `zod` | 数据验证库，体积大（约 300 KB），独立分离 |
| `vendor-antd-x.js` | `@ant-design/x` | Ant Design X 组件库，UI 相关 |
| `vendor-ai.js` | `ai`, `@ai-sdk/deepseek`, `@ai-sdk/moonshotai` | AI SDK，功能独立，更新频率可能较高 |
| `vendor-icons.js` | `lucide-react` | 图标库，体积大，独立分离 |
| `vendor-radix.js` | `@radix-ui/*` | Radix UI 无样式组件库，与 Ant Design X 解耦 |
| `vendor.js` | 其他所有 `node_modules` 依赖 | 捕获所有剩余依赖 |

**分组原则：**
- 按功能分组（React、Redux、UI、AI）
- 按更新频率分组（核心依赖更新慢，业务依赖更新快）
- 按体积分组（大型依赖独立分离）

### 3. Chunk 大小警告限制

设置 `chunkSizeWarningLimit: 500`，遵循业界最佳实践。

### 大型核心库的例外情况

在实施过程中，发现以下大型核心库的 chunk 超过 500 KB 限制，但属于可接受的例外情况：

| Chunk 名称 | 实际体积 | 超出量 | 原因分析 | 是否需要优化 |
|------------|----------|--------|----------|--------------|
| `vendor-react.js` | 562 KB | +62 KB | React 19 核心库，包含 React 和 React-DOM，体积大但更新频率低，适合长期缓存 | 否（核心库，难以再分割） |
| `vendor-zod.js` | 539 KB | +39 KB | Zod 数据验证库，包含完整的类型定义和验证逻辑，体积较大但功能完整 | 否（单一功能库，分割收益低） |
| `vendor-markdown.js` | 1,041 KB | +541 KB | 包含 markdown-it、highlight.js、DOMpurify 三个库，其中 highlight.js 包含大量语言语法高亮规则 | **是（未来优化项）** |

**为何可以接受：**

1. **核心库特征**：这些是大型核心库，体积大但功能完整，难以进一步分割
2. **更新频率低**：React 和 Zod 更新频率低，可被浏览器长期缓存
3. **主 chunk 优化成功**：主 chunk 从 2,403 KB 降至 45 KB（98% 减少），已达优化目标
4. **性能影响可控**：这些库在应用启动时就需要加载，HTTP/2 多路复用下额外请求开销小

**未来优化方向（优先级：低）：**

1. **Markdown chunk 细分**：可将 `markdown-it`、`highlight.js`、`DOMpurify` 分离为独立 chunk
   - 预期效果：`vendor-markdown.js` 从 1,041 KB 降至 ~300-400 KB
   - 实施成本：中等（需要测试分离后的加载顺序）
   - 收益评估：低（Markdown 功能仅在聊天详情页使用，非首屏关键路径）

2. **Zod 按需加载**：使用动态导入按需加载 Zod（如果使用场景允许）
   - 预期效果：`vendor-zod.js` 从 539 KB 降至 0 KB（移出首屏）
   - 实施成本：高（需要重构类型验证逻辑）
   - 收益评估：低（Zod 在模型配置等关键路径使用）

3. **React 替代方案**：考虑使用轻量级 React 替代方案（如 Preact）
   - 预期效果：`vendor-react.js` 从 562 KB 降至 ~200-300 KB
   - 实施成本：极高（需要重写大量组件和兼容性测试）
   - 收益评估：中（但引入兼容性风险）

**当前决策：暂不优化**

理由：
- 当前主 chunk 已达优化目标（45 KB），首屏加载性能显著提升
- 大型核心库的超出量在可接受范围内（最大 +541 KB）
- 用户可选择跳过手动功能测试，优先降低变更风险
- 未来可根据实际性能监控数据和用户反馈决定是否进一步优化

### 4. 实现方式

在 `vite.config.ts` 中添加 `build.rollupOptions.output.manualChunks` 配置：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // vendor 分组逻辑
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
```

## Risks / Trade-offs

### 风险 1：HTTP 请求增加

**描述**：将依赖分离到多个 chunk 会导致 HTTP 请求增加（从 2 个增加到最多 10 个）。

**缓解措施**：
- 现代 HTTP/2 协议支持多路复用，额外请求开销较小
- 长期缓存的收益超过额外请求的开销
- 可根据实际性能测试结果调整分组策略

### 风险 2：依赖版本升级可能破坏 chunk 分组

**描述**：如果新增依赖没有匹配到现有的分组规则，可能被打包到 `vendor.js`，导致 `vendor.js` 过大。

**缓解措施**：
- 在 CI/CD 中添加 chunk 大小检查，超过阈值时构建失败
- 定期审查构建产物，必要时调整分组规则

### 风险 3：运行时错误

**描述**：代码分割可能导致模块加载顺序问题或依赖缺失。

**缓解措施**：
- Vite 和 Rollup 会自动处理依赖关系
- 本地开发环境和生产构建都需要全面测试
- 验证所有功能（路由跳转、状态管理、AI 聊天等）

## Migration Plan

### 部署步骤

1. **修改配置**：在 `vite.config.ts` 中添加 `manualChunks` 配置
2. **本地测试**：运行 `pnpm build` 验证构建产物，检查 chunk 大小
3. **功能测试**：运行生产构建，验证所有功能正常
4. **性能测试**：使用 Lighthouse 对比优化前后的性能指标
5. **部署**：提交代码，部署到生产环境

### 回滚策略

如果生产环境出现严重问题：
1. 立即回滚到上一个版本
2. 删除 `manualChunks` 配置
3. 重新部署

### 验证清单

- [ ] 构建成功，无错误或警告
- [ ] 主 chunk（`index-*.js`）体积减少到 500 KB 以下
- [ ] 所有 vendor chunk 体积合理（不超过 500 KB）
- [ ] 应用启动正常，无控制台错误
- [ ] 所有路由和功能正常工作
- [ ] Lighthouse 性能评分提升

## Open Questions

1. **是否需要进一步细化 `vendor.js`？**
   - 当前 `vendor.js` 包含所有未匹配的依赖，可能仍然较大
   - 需要在构建后查看实际体积，必要时添加更多分组规则

2. **是否需要使用 `vite-plugin-chunk-split` 插件？**
   - 如果手动分组策略不够灵活，可以考虑使用该插件
   - 但优先使用 Vite 原生方案，减少依赖

3. **是否需要为供应商提供额外的分组规则？**
   - 如果未来支持更多 AI 供应商（如 OpenAI、Anthropic），可能需要调整 `vendor-ai.js` 的分组规则
