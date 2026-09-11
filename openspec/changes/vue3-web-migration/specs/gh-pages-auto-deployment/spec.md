# GitHub Pages 自动部署规范（增量）

## MODIFIED Requirements

### Requirement: Web 应用构建

部署流程 SHALL 执行完整的 Web 应用构建，生成可用于 GitHub Pages 的静态资源。

#### Scenario: 成功构建 Web 应用

- **WHEN** workflow 的 build job 执行 `pnpm build` 命令
- **THEN** 系统构建应用生成静态资源
- **THEN** 构建产物输出到 `dist/` 目录
- **THEN** 构建使用正确的 base 路径 `/multi-chat/`

#### Scenario: 构建失败时中止部署

- **WHEN** 构建过程中出现错误（如类型错误、依赖缺失）
- **THEN** build job 立即终止并返回失败状态
- **THEN** deploy job 不会执行（因为 deploy job 依赖 build job）

### Requirement: 构建环境配置

workflow SHALL 使用与项目兼容的 Node.js 和 pnpm 版本。

#### Scenario: 使用 Node.js 22

- **WHEN** workflow 启动
- **THEN** 系统配置 Node.js 版本为 22
- **THEN** 构建环境与项目本地开发环境一致

#### Scenario: 使用 pnpm 10

- **WHEN** workflow 安装依赖
- **THEN** 系统使用 pnpm 版本 10
- **THEN** 与项目 `package.json` 和其他 workflows 保持一致

## REMOVED Requirements

### Requirement: 版本同步

**Reason**: 桌面应用构建发布流程（`build-and-release.yml`）随 Tauri 移除而删除，"Web 版本与桌面版本并行发布、版本同步"的语义不复存在。

**Migration**: 版本号仍以语义化版本 tag 为唯一来源，由"Tag 触发自动部署"需求承接；`update-version` 脚本仅维护 `package.json` 与 Tauri 无关的版本引用。
