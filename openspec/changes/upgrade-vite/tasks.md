## 1. 前置准备

- [x] 1.1 创建升级分支 `chore/upgrade-vite`
- [x] 1.2 在升级前运行 `pnpm web:build`，保存 `dist/stats.html` 作为 chunk 列表和体积的基准快照

## 2. 依赖升级

- [x] 2.1 升级 `vite` 到 `^8.1.4`（major，内置 Rolldown ~1.1.4）
- [x] 2.2 确认 `@vitejs/plugin-react@5.2.0` 无需修改（`^5.1.4` 已解析到 5.2.0，peer dep 已支持 Vite 8）
- [x] 2.3 更新 `vitest` 到 `^4.1.10`（minor，4.1.x 已原生支持 Vite 8）
- [x] 2.4 更新 `@vitest/coverage-istanbul` 到 `^4.1.10`（minor）
- [x] 2.5 更新 `@vitest/ui` 到 `^4.1.10`（minor）
- [x] 2.6 （可选）安装 `@vitejs/devtools@^0.3.4`（Vite 8 可选 peer dependency，提供开发者工具面板）
- [x] 2.7 运行 `pnpm install` 安装新依赖，检查 peer dependency 警告

## 3. 配置适配

- [x] 3.1 运行 `pnpm tsc` 检查类型错误，修复 Vite 8 API 变更导致的类型问题
- [x] 3.2 将 `build.rollupOptions.output.manualChunks` 迁移到 `build.rolldownOptions.output.advancedChunks`（Rolldown 的 manualChunks 语义与 Rollup 不同，需使用 priority + includeDependenciesRecursively 实现强制分包）
- [x] 3.3 检查 `test.deps.optimizer` 配置在 Vitest 4.1.x 下是否需要调整
- [x] 3.4 检查 `test.pool`、`test.maxForks` 等测试池配置的兼容性
- [x] 3.5 确认 `rollup-plugin-visualizer` 已升级到支持 Rolldown 1.x 的版本（peer dep 已兼容）
- [x] 3.6 验证 `@vitejs/plugin-react@5.2.0` 的 React Compiler 配置（`babel.plugins`）在 Rolldown 构建流程中正常工作
- [x] 3.7 确认 `@tailwindcss/vite@^4.2.1` 已兼容 Vite 8（peer dep 含 `^8`，无需额外操作）
- [x] 3.8 检查 Vite 8 迁移指南中的其他破坏性变更并逐项适配

## 4. 构建验证

- [x] 4.1 运行 `pnpm web:build` 验证 Web 构建流程
- [x] 4.2 与 1.2 的基准快照对比 chunk 列表，确认所有 vendor chunk 正确生成
- [x] 4.3 验证 `chunk-init` chunk 在 Rolldown 下正确生成（18.5KB，从基准 101KB 减小）
- [x] 4.4 验证 `vendor-highlight-core` 和 `vendor-highlight-languages` 分类正确
- [x] 4.5 验证 `vendor-ai`、`vendor-zod`、`vendor-react` 等 chunk 归属不变
- [x] 4.6 检查构建产物体积是否有异常变化
- [x] 4.7 验证 `dist/stats.html` 可视化报告正常生成（gzip 和 brotli 体积数据）

## 5. 测试验证

- [x] 5.1 运行 `pnpm test:run` 验证所有单元测试通过
- [x] 5.2 运行 `pnpm test:integration:run` 验证所有集成测试通过
- [ ] 5.3 运行 `pnpm test:mutation` 验证变异测试（Stryker）正常工作，重点关注 `@stryker-mutator/vitest-runner` 与 Vitest 4.1.10 的兼容性
- [x] 5.4 运行 `pnpm lint` 验证代码规范
- [ ] 5.5 验证覆盖率收集正常工作（`pnpm test:coverage`）

## 6. Tauri 集成验证

- [ ] 6.1 运行 `pnpm tauri dev` 验证开发服务器正常启动，确认 `localhost:1420` 端口绑定正确
- [ ] 6.2 验证 HMR 热更新功能正常工作，重点检查 HMR WebSocket 连接（特别是 `TAURI_DEV_HOST` 设置时的 mobile 场景）
- [ ] 6.3 运行 `pnpm tauri build` 验证生产构建流程
- [ ] 6.4 验证 GitHub Pages 部署构建（`BASE_PATH=/multi-chat/ pnpm web:build`）

> **注意**：Task 6 的 Tauri 集成验证需要在桌面环境中手动执行，CI 环境无法完整验证 GUI 应用启动和 HMR 连接。`pnpm web:build` 已验证构建流程正常，Tauri 特有的 dev server 和打包流程需用户本地验证。

## 7. 收尾

- [x] 7.1 更新 `package.json` 中的版本约束（如有需要）
- [x] 7.2 记录升级过程中遇到的问题和解决方案
- [ ] 7.3 提交变更并创建 PR
