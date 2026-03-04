# Purpose

本 capability 定义了 GitHub Pages 自动部署的规范。确保 Web 版本与桌面应用版本同步发布。

## Requirements

### Requirement: Tag 触发自动部署
当推送语义化版本 tag（格式 `v*.*.*`）到仓库时，系统 SHALL 自动触发 GitHub Pages 部署流程。

#### Scenario: 成功触发部署
- **WHEN** 开发者推送 tag `v1.0.0` 到仓库
- **THEN** 系统自动启动 `deploy-to-gh-pages` workflow
- **THEN** workflow 执行 Web 应用构建和部署

#### Scenario: Tag 格式不匹配
- **WHEN** 开发者推送非标准格式的 tag（如 `release-1.0.0`）
- **THEN** 系统不触发部署流程

#### Scenario: 手动触发部署
- **WHEN** 开发者在 GitHub Actions UI 中手动触发 workflow
- **THEN** 系统执行部署流程（无需 tag）

### Requirement: Web 应用构建
部署流程 SHALL 执行完整的 Web 应用构建，生成可用于 GitHub Pages 的静态资源。

#### Scenario: 成功构建 Web 应用
- **WHEN** workflow 的 build job 执行 `pnpm web:build` 命令
- **THEN** 系统构建应用生成静态资源
- **THEN** 构建产物输出到 `dist/` 目录
- **THEN** 构建使用正确的 base 路径 `/multi-chat/`

#### Scenario: 构建失败时中止部署
- **WHEN** 构建过程中出现错误（如类型错误、依赖缺失）
- **THEN** build job 立即终止并返回失败状态
- **THEN** deploy job 不会执行（因为 deploy job 依赖 build job）

### Requirement: 部署到 GitHub Pages
构建成功后，系统 SHALL 使用 GitHub Pages 官方 Actions 将构建产物部署到 GitHub Pages。

#### Scenario: 成功部署到 GitHub Pages
- **WHEN** build job 成功上传 artifact
- **THEN** deploy job 使用 `actions/deploy-pages` 将 artifact 部署到 GitHub Pages
- **THEN** GitHub Pages 自动发布网站
- **THEN** 用户可访问 `https://max-loo.github.io/multi-chat/`

#### Scenario: 部署使用 GitHub Pages 环境
- **WHEN** deploy job 执行部署
- **THEN** job 使用 `github-pages` 环境
- **THEN** 环境输出部署 URL（`${{ steps.deployment.outputs.page_url }}`）

#### Scenario: 部署记录在 Actions runs 中
- **WHEN** 部署成功完成
- **THEN** 部署历史保留在 GitHub Actions workflow runs 中
- **THEN** 可通过 Actions UI 查看历史部署记录

### Requirement: 权限管理
workflow SHALL 具有部署到 GitHub Pages 的必要权限。

#### Scenario: 正确配置 Pages 写入权限
- **WHEN** workflow 执行部署操作
- **THEN** workflow 拥有 `pages: write` 权限
- **THEN** workflow 拥有 `id-token: write` 权限（OIDC 认证）
- **THEN** workflow 可以成功部署到 GitHub Pages

#### Scenario: 权限不足时失败
- **WHEN** workflow 缺少必要的 Pages 写入权限
- **THEN** 部署操作失败
- **THEN** workflow 返回明确的权限错误信息

#### Scenario: 不需要 contents 写入权限
- **WHEN** workflow 执行部署操作
- **THEN** workflow 只需要 `contents: read` 权限
- **THEN** 不需要写入仓库内容的权限（更安全的权限模型）

### Requirement: 依赖安装优化
系统 SHALL 使用缓存机制加速依赖安装过程。

#### Scenario: 首次执行时建立缓存
- **WHEN** workflow 首次执行或缓存失效
- **THEN** 系统安装 pnpm 依赖（`pnpm install`）
- **THEN** 系统缓存 pnpm store 和 node_modules
- **THEN** 后续执行可使用缓存

#### Scenario: 缓存命中时加速安装
- **WHEN** workflow 执行且缓存有效（`pnpm-lock.yaml` 未变更）
- **THEN** 系统从缓存恢复依赖
- **THEN** 依赖安装时间显著减少（通常从 2-3 分钟降至 10-30 秒）

#### Scenario: 锁文件变更时更新缓存
- **WHEN** `pnpm-lock.yaml` 文件发生变化
- **THEN** 系统重新安装所有依赖
- **THEN** 系统更新缓存键以反映新的依赖状态

### Requirement: 版本同步
Web 版本部署 SHALL 与桌面应用构建并行触发，确保版本同步。

#### Scenario: Tag 推送时并行触发
- **WHEN** 开发者推送 version tag
- **THEN** `build-and-release.yml` workflow 触发（构建桌面应用）
- **THEN** `deploy-to-gh-pages.yml` workflow 同时触发（部署 Web 版本）
- **THEN** 两个 workflows 并行执行，互不阻塞

#### Scenario: 两者版本号一致
- **WHEN** tag `v1.0.0` 触发部署
- **THEN** 桌面应用版本为 `v1.0.0`
- **THEN** Web 版本对应的版本号也为 `v1.0.0`

### Requirement: 构建环境配置
workflow SHALL 使用与项目兼容的 Node.js 和 pnpm 版本。

#### Scenario: 使用 Node.js 22
- **WHEN** workflow 启动
- **THEN** 系统配置 Node.js 版本为 22
- **THEN** 构建环境与 `build-and-release.yml` 一致

#### Scenario: 使用 pnpm 10
- **WHEN** workflow 安装依赖
- **THEN** 系统使用 pnpm 版本 10
- **THEN** 与项目 `package.json` 和其他 workflows 保持一致

### Requirement: CI 环境变量配置
构建过程 SHALL 配置适当的环境变量以确保构建成功。

#### Scenario: 禁用 CI 严格模式
- **WHEN** workflow 执行构建
- **THEN** 设置环境变量 `CI=false`
- **THEN** Vite 构建警告不会导致构建失败

#### Scenario: 部署使用 OIDC 认证
- **WHEN** workflow 执行部署
- **THEN** deploy job 使用 `id-token: write` 权限进行 OIDC 认证
- **THEN** 不需要传递 GITHUB_TOKEN 环境变量
- **THEN** 使用 GitHub Actions 的内置身份验证机制

### Requirement: 部署状态反馈
workflow SHALL 提供清晰的执行状态和错误信息。

#### Scenario: 部署成功时显示摘要
- **WHEN** 部署成功完成
- **THEN** workflow 状态显示为绿色（成功）
- **THEN** workflow 摘要包含部署 URL 和版本信息

#### Scenario: 部署失败时显示错误详情
- **WHEN** 部署过程失败（构建或部署步骤）
- **THEN** workflow 状态显示为红色（失败）
- **THEN** workflow 日志包含详细的错误信息
- **THEN** GitHub 发送失败通知给相关开发者
