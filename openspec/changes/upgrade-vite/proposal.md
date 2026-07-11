## Why

项目当前使用 Vite 7.3.2，而 Vite 8.0 已于 2026 年 3 月发布稳定版，当前最新为 8.1.4。Vite 8 将默认打包器从 Rollup 切换为 Rolldown 1.0，带来显著的构建性能提升（官方基准称 HMR 速度有数量级改善），同时提供了实验性的 full bundle mode。作为 Tauri 桌面应用，构建性能直接影响开发体验和发布效率，现在升级可以尽早享受性能红利并避免技术债累积。

## What Changes

- **BREAKING**：将 `vite` 依赖从 `^7.3.1` 升级到 `^8.1.4`，默认打包器从 Rollup 切换为 Rolldown 1.0（Rolldown 随 vite 包内置，无需单独安装）
- 保持 `@vitejs/plugin-react@^5.1.4`（当前已安装 5.2.0，其 peer dep 已支持 `vite: ^8.0.0`，无需 major 升级）
- 可选新增 `@vitejs/devtools@^0.3.4`（Vite 8 的**可选** peer dependency，提供开发者工具面板，不影响核心功能）
- 将 `vitest` 从 `^4.0.18` 更新到 `^4.1.10`（minor 更新，4.1.x 已原生支持 Vite 8）
- 将 `@vitest/coverage-istanbul` 和 `@vitest/ui` 从 `^4.x` 更新到 `^4.1.10`（minor 更新）
- 适配 Vite 8 的 API 变更：移除已废弃的配置项，使用新的替代方案
- 验证并适配 `manualChunks` 在 Rolldown 打包器下的行为一致性
- 验证 Tauri 开发服务器（`tauri dev` / `tauri build`）与新 Vite 版本的集成

## Capabilities

### New Capabilities
<!-- 本次升级不引入新的业务能力，仅涉及构建工具链的版本升级与适配 -->

### Modified Capabilities
- `chunk-splitting`：打包器从 Rollup 切换为 Rolldown，`manualChunks` 配置需要在新打包器下验证并保持分包行为一致

## Impact

- **构建工具链**：`vite`（major 升级）；`@vitejs/plugin-react` 保持 5.x（5.2.0 已支持 Vite 8，无需 major 升级）；`vitest` 及 `@vitest/*` 为 minor 更新
- **配置文件**：`vite.config.ts` 中的 `build.rollupOptions`、`test.deps.optimizer` 等配置需适配 Vite 8 的新 API
- **打包行为**：Rolldown 作为默认打包器，`manualChunks` 函数的调用方式和返回值处理可能发生变化
- **生态插件兼容性**：`@tailwindcss/vite@^4.2.1` 已支持 Vite 8（peer dep 含 `^8`）；`rollup-plugin-visualizer` 已支持 Rolldown 1.x（peer dep 含 `rolldown: 1.x`）；`@stryker-mutator/vitest-runner` 依赖 Vitest 内部 API，需验证
- **Tauri 集成**：开发服务器和构建流程需重新验证
- **测试基础设施**：Vitest minor 更新可能影响变异测试（Stryker）的运行
- **部署流程**：GitHub Pages 部署（`web:build`）需验证构建产物正确性
