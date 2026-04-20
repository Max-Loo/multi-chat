## 1. 构建配置修复

- [x] 1.1 修改 `vite.config.ts` 的 `manualChunks`：将 `config/initSteps` 合并到 `chunk-init` 匹配规则中，移除独立的 `chunk-initsteps` 规则
- [x] 1.2 移除 `lib/initialization` 失效匹配规则

## 2. 验证

- [x] 2.1 执行 `pnpm tauri build`，确认无 `Circular chunk` 构建错误
- [x] 2.2 执行 `pnpm tauri dev`，确认应用正常启动，无 TDZ 错误
