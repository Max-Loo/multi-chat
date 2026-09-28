# Spec Delta

## MODIFIED Requirements

### Requirement: Web 应用构建

部署流程 SHALL 执行完整的 Web 应用构建，生成可用于 GitHub Pages 的静态资源；Web 构建是项目唯一的构建产物（桌面应用构建已随 Tauri 移除而删除）。

#### Scenario: 成功构建 Web 应用

- **WHEN** workflow 的 build job 执行 `pnpm build` 命令（类型检查命令随框架切换由 `tsc` 调整为 `svelte-check`，构建入口保持 `pnpm build` 不变）
- **THEN** 系统构建应用生成静态资源
- **THEN** 构建产物输出到 `dist/` 目录
- **THEN** 构建使用正确的 base 路径 `/multi-chat/`

#### Scenario: 构建失败时中止部署

- **WHEN** 构建过程中出现错误（如类型错误、依赖缺失）
- **THEN** build job 立即终止并返回失败状态
- **THEN** deploy job 不会执行（因为 deploy job 依赖 build job）

## REMOVED Requirements

### Requirement: 版本同步

**Reason**: 桌面应用构建工作流（build-and-release）已随 Tauri 移除而删除，「Web 版本与桌面应用构建并行触发、两者版本号一致」的要求不再有意义；本变更完成其规格层收尾。

**Migration**: 版本号唯一来源收敛为 `package.json`；tag 触发的 Web 部署所含版本号与该 tag 一致（由「Tag 触发自动部署」要求保证），无需跨产物同步。
