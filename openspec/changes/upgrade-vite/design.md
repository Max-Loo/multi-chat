## Context

项目是 Tauri + React + TypeScript 桌面应用，当前使用 Vite 7.3.2 构建。Vite 8.0 于 2026 年 3 月发布，将默认打包器从 Rollup 切换为 Rolldown 1.0（基于 Rust 的高性能打包器，内置于 vite 包中 `rolldown: ~1.1.4`）。项目重度依赖 `manualChunks` 进行精细的分包控制（15+ 个 vendor chunk），并且使用 `rollup-plugin-visualizer` 进行产物分析。此次升级需要确保打包器切换不破坏现有分包策略，同时适配 Vite 8 的 API 变更及新增的 peer dependency 链。

**当前工具链版本**：
- `vite`: 7.3.2
- `vitest`: 4.1.5
- `@vitejs/plugin-react`: 5.2.0
- `@vitest/coverage-istanbul`: 4.1.5
- `@vitest/ui`: 4.0.18

**目标工具链版本**（经 npm 验证）：
- `vite`: ^8.1.4（major 升级，内置 Rolldown ~1.1.4，无需单独安装）
- `@vitejs/plugin-react`: 保持 ^5.1.4（当前已安装 5.2.0，其 peer dep 已支持 `vite: ^8.0.0`，无需 major 升级）
- `vitest`: ^4.1.10（minor 更新，4.1.x 已原生支持 Vite 8）
- `@vitest/coverage-istanbul`: ^4.1.10（minor 更新）
- `@vitest/ui`: ^4.1.10（minor 更新）
- `@vitejs/devtools`: ^0.3.4（**可选**，Vite 8 的 optional peer dependency，提供开发者工具面板）

**Node.js 引擎要求**：Vite 7→8 之间无变化（均为 `^20.19.0 || >=22.12.0`），当前环境 Node v24.16.0 完全满足。

## Goals / Non-Goals

**Goals:**
- 将 Vite 升级到 8.1.4，享受 Rolldown 带来的构建性能提升
- 保持 `@vitejs/plugin-react` 5.x（5.2.0 已支持 Vite 8），最小化依赖变更范围
- 保持现有 `manualChunks` 分包策略在 Rolldown 下的行为一致性
- 确保所有测试（单元、集成、变异）、构建、部署流程正常工作
- 适配 Vite 8 的 API 变更，移除废弃配置

**Non-Goals:**
- 不重构前端业务代码
- 不调整现有的分包策略（chunk 归属规则保持不变）
- 不启用 Vite 8.1 的实验性 full bundle mode（保持稳定性优先）
- 不更换测试框架或覆盖率工具

## Decisions

### 决策 1：直接升级而非渐进式迁移

**选择**：一次性将 Vite 从 7.3.2 升级到 8.1.4

**理由**：Vite 8 已发布 4 个月（至 2026年7月），生态已趋于稳定。渐进式迁移（如先使用 `rolldown-vite` 兼容包）会增加维护成本，且项目没有复杂的自定义 Rollup 插件。

**备选方案**：先安装 `rolldown-vite` 作为过渡，验证后再切换到正式版。放弃此方案因为增加了不必要的中间状态。

### 决策 2：将 `manualChunks` 迁移到 Rolldown 的 `advancedChunks` API

**选择**：将 `build.rollupOptions.output.manualChunks` 迁移到 `build.rolldownOptions.output.advancedChunks`

**理由**：实施过程中发现，Rolldown 虽然兼容 `manualChunks` 配置（不报错），但其语义与 Rollup 不同。Rolldown 将 `manualChunks` 转换为内部的 `advancedChunks.groups`，但 `advancedChunks` 受 `minSize`/`minShareCount` 等阈值约束——低于阈值的包不会单独拆分，而是被合并到其他 chunk 中。这导致：

- `vendor-zod`（78KB）、`vendor-i18n`（49KB）、`vendor-ui-utils`（27KB）等 chunk 缺失，依赖被错误并入其他 chunk
- `chunk-init` 从 101KB 暴涨到 600KB（被注入了大量本应独立的模块）
- `vendor-highlight-languages` 缺失（highlight.js 语言文件路径从 `/lib/languages/` 变为 `/es/languages/`）

通过迁移到 `advancedChunks` 原生 API 并设置 `minSize: 0`，可以恢复强制分包行为，同时适配路径格式变化。

**迁移要点**：
1. 将 `manualChunks(id)` 函数转换为 `advancedChunks.groups` 数组，每个 group 使用 `test` 匹配 + `name` 命名
2. 设置 `minSize: 0` 绕过默认最小体积阈值，恢复强制分包
3. 更新 highlight.js 语言路径匹配：从 `/lib/languages/` 改为 `/es/languages/`
4. `getPackageName` 函数保持不变（Rolldown 传入的 id 仍为绝对路径，正则匹配有效）

**备选方案**：通过 `build.rolldownOptions` 或保留 `rollup-plugin-visualizer` 兼容性来继续使用 Rollup 引擎。放弃此方案因为会失去 Rolldown 的性能优势，且 Vite 8 已将 Rolldown 作为默认打包器。

### 决策 3：`rollup-plugin-visualizer` 的兼容性确认

**选择**：保留 `rollup-plugin-visualizer`，无需替换

**理由**：经 npm 验证，`rollup-plugin-visualizer` 的 peerDependencies 已同时支持 Rollup 和 Rolldown：`{ rolldown: '1.x || ^1.0.0-beta || ^1.0.0-rc', rollup: '2.x || 3.x || 4.x' }`。该插件已官方兼容 Rolldown 1.x，升级后继续使用即可。

**验证方式**：升级后运行 `pnpm web:build`，确认 `dist/stats.html` 正常生成且包含 gzip/brotli 体积数据。

### 决策 4：Vite 8 API 变更的适配

**选择**：逐项检查并适配 Vite 8 迁移指南中的破坏性变更

**已知需关注的配置项**：
- `build.rollupOptions` → 验证在 Rolldown 下是否需改用 Rolldown 特定配置
- `test.deps.optimizer.web` → 验证 Vitest 4.1.x 的依赖优化 API
- 浏览器基线要求更新到 2026-01-01（对 Tauri 桌面应用无影响，WebView 已满足）

**处理方式**：升级后运行 `pnpm tsc` 和 `pnpm web:build`，根据 TypeScript 和 Vite 的报错逐项修复。

### 决策 5：`@vitejs/plugin-react` 保持 5.x（不升级到 6.x）

**选择**：保持 `@vitejs/plugin-react@^5.1.4`（当前已安装 5.2.0），不升级到 6.x

**理由**：经 npm 验证，`@vitejs/plugin-react@5.2.0` 的 peerDependencies 已包含 `vite: '^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0'`，**已经支持 Vite 8**。5.2.0 内置了 `@babel/core` 来处理 Babel 转换（包括 React Compiler），不需要引入 `@rolldown/plugin-babel`。由于 `^5.1.4` 的 semver 范围已解析到 5.2.0，`package.json` 无需修改。

**备选方案（路径 B，本次不采用）**：升级到 `@vitejs/plugin-react@^6.0.3` + 新增 `@rolldown/plugin-babel`。6.x 移除了内置 `@babel/core`，改为依赖 Rolldown 原生的 Babel 插件处理。这是架构层面的优化（减少 Babel 依赖），但增加了新依赖和配置复杂度，且收益有限，不在本次升级范围内。

**验证方式**：升级 Vite 8 后，确认 `babel-plugin-react-compiler` 仍通过 plugin-react 5.2.0 的内置 `@babel/core` 正常工作。

### 决策 6：Vitest minor 更新

**选择**：将 Vitest 及其生态包通过 `pnpm update` 更新到 4.1.10

**理由**：经 npm 验证，Vitest 4.1.x 已原生支持 Vite 8（peer dep 为 `vite: '^6.0.0 || ^7.0.0 || ^8.0.0'`），无需 major 升级。当前的 `^4.0.18` / `^4.1.5` 版本约束通过 `pnpm update` 即可更新到 4.1.10，属于 minor/patch 范围，风险较低。

**验证方式**：运行 `pnpm test:run`、`pnpm test:integration:run` 和 `pnpm test:mutation`，确保所有测试通过。变异测试（Stryker）深度依赖 Vitest 内部 API，需重点验证。

## Risks / Trade-offs

- **[Rolldown 的 `manualChunks` 行为差异]** → 通过对比升级前后的构建产物 chunk 列表进行验证；若差异不可接受，回退到 Rollup 或使用 `advancedChunks`
- **[`@vitejs/plugin-react@5.2.0` 在 Vite 8 下的兼容性]** → 虽 peer dep 声明支持 Vite 8，但需验证 `babel-plugin-react-compiler` 通过内置 `@babel/core` 在 Rolldown 构建流程中正常工作
- **[`@stryker-mutator/vitest-runner` 与 Vitest 4.1.10 兼容性]** → 变异测试深度依赖 Vitest 内部 API，minor 更新仍可能影响；运行 `pnpm test:mutation` 全量验证
- **[Tauri 开发服务器集成问题]** → 验证 `pnpm tauri dev` 和 `pnpm tauri build` 正常工作，重点检查端口 1420 绑定和 HMR 连接
- **[未知 API 变更导致构建失败]** → 在独立分支上操作，保留 `package.json` 和 `vite.config.ts` 的原始版本以便快速回退
- **[GitHub Pages 部署产物异常]** → 验证 `BASE_PATH` 环境变量和 `web:build` 产物的正确性

## Migration Plan

1. **创建分支**：在独立分支上进行升级操作
2. **记录基准快照**：在升级前运行 `pnpm web:build`，保存 `dist/stats.html` 作为 chunk 列表和体积的基准快照
3. **升级 Vite**：`pnpm add -D vite@^8.1.4`（`@vitejs/plugin-react@5.2.0` 无需修改，已在 `^5.1.4` 范围内）
4. **更新 Vitest 生态**：`pnpm update vitest @vitest/coverage-istanbul @vitest/ui`
5. **（可选）安装开发工具**：`pnpm add -D @vitejs/devtools@^0.3.4`（Vite 8 可选 peer dependency）
6. **验证 TypeScript**：运行 `pnpm tsc`，修复类型错误
7. **验证构建**：运行 `pnpm web:build`，与基准快照对比 chunk 产物，检查 `dist/stats.html`
8. **验证测试**：运行 `pnpm test:run`、`pnpm test:integration:run` 和 `pnpm test:mutation`
9. **验证 Tauri**：运行 `pnpm tauri dev` 确认开发服务器和 HMR 正常
10. **验证部署**：检查 `web:build` 产物结构是否适配 GitHub Pages

**回退策略**：如果升级导致严重问题无法快速修复，`git checkout -- package.json vite.config.ts && pnpm install` 即可恢复到 Vite 7。

## Open Questions

- Vite 8 是否需要额外的 Rolldown 配置项来优化构建？（取决于实际构建结果）
- Vitest 4.1.10 更新后 `pool: "forks"` 和 `deps.optimizer` 配置是否需要调整？（需验证测试运行结果）
- `@vitejs/plugin-react@5.2.0` 在 Rolldown 构建流程中 `babel-plugin-react-compiler` 是否正常工作？（需验证构建产物中 Compiler 优化是否生效）
