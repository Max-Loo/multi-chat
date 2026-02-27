## Why

当前构建产物中存在两个过大的 chunk 文件（`index-D6E4_MqK.js`: 1,338 KB，`index-CWdUKH4n.js`: 1,065 KB），远超推荐的 500 KB 限制。分析发现，大型依赖库（React、Redux Toolkit、Zod、Ant Design X、Vercel AI SDK、lucide-react 等）全部被打包进主 chunk，缺乏有效的代码分割策略。这导致首屏加载时间过长，用户体验不佳。

## What Changes

- **配置 Vite manualChunks**：在 `vite.config.ts` 中添加 `build.rollupOptions.output.manualChunks` 配置
- **分离大型依赖到独立 vendor chunk**：
  - `vendor-react.js`: React 和 React-DOM
  - `vendor-redux.js`: Redux Toolkit 和 React-Redux
  - `vendor-zod.js`: Zod 数据验证库（约 300 KB）
  - `vendor-antd-x.js`: Ant Design X 组件库
  - `vendor-ai.js`: Vercel AI SDK（`ai`、`@ai-sdk/deepseek`、`@ai-sdk/moonshotai`）
  - `vendor-icons.js`: lucide-react 图标库
  - `vendor-radix.js`: Radix UI 组件库
  - `vendor.js`: 其他 node_modules 依赖
- **设置 chunk 大小警告限制**：将 `chunkSizeWarningLimit` 设置为 500 KB

## Capabilities

### New Capabilities
无（此变更为构建配置优化，不涉及新功能或对外 API）

### Modified Capabilities
无（此变更不影响功能规格，仅优化构建产物）

## Impact

- **构建产物**：预计主 chunk 体积减少 60-70%
  - `index-D6E4_MqK.js`: 从 1,338 KB 减少到约 400-500 KB
  - `index-CWdUKH4n.js`: 从 1,065 KB 减少到约 200-300 KB
- **首屏加载性能**：预计提升 40-60% 的加载速度
- **缓存策略**：vendor chunk 变化频率低，可被浏览器长期缓存，进一步提升后续访问速度
- **构建配置**：修改 `vite.config.ts`，添加 `build.rollupOptions` 配置
- **依赖关系**：无新增或移除依赖
- **测试影响**：需要验证应用所有功能正常工作（构建、运行、路由跳转等）
