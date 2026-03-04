## Why

当前项目在 README 中声明支持 GitHub Pages 自动部署，但实际上缺少对应的 GitHub Actions workflow。开发者需要手动执行 `pnpm deploy:gh-pages` 才能部署 Web 版本，导致版本发布流程不完整。每次发布新版本时，桌面应用（通过 `build-and-release.yml`）自动构建，但 Web 版本需要手动部署，造成了发布流程的不一致性。

## What Changes

- **新增 GitHub Actions workflow**: 创建 `.github/workflows/deploy-to-gh-pages.yml`，在推送 version tag（`v*.*.*`）时自动执行 GitHub Pages 部署
- **自动化部署流程**: 使用 GitHub Pages 官方 Actions（`actions/upload-pages-artifact` + `actions/deploy-pages`），分离构建和部署为两个独立的 job
- **集成现有版本管理**: 复用 `create-tag.yml` 的版本检测逻辑，与 `build-and-release.yml` 并行触发，确保桌面应用和 Web 版本同步发布
- **添加构建缓存**: 使用 `pnpm/action-setup` 的缓存功能，加速依赖安装和构建过程
- **优化权限配置**: 使用更精细的权限（`pages: write` + `id-token: write`），无需 `contents: write`

## Capabilities

### New Capabilities
- `gh-pages-auto-deployment`: GitHub Pages 自动部署能力，涵盖部署触发条件、构建流程、权限管理、缓存策略等

### Modified Capabilities
（无现有规格需要修改）

## Impact

**新增文件**:
- `.github/workflows/deploy-to-gh-pages.yml`: GitHub Actions workflow 配置文件

**修改文件**:
- `README.md`: 更新部署说明（如果需要）

**依赖关系**:
- 复用现有的 `create-tag.yml` 版本管理逻辑
- 与 `build-and-release.yml` 并行触发，互不干扰

**权限配置**:
- GitHub Actions 需要配置 `pages: write` 和 `id-token: write` 权限
- 不需要 `contents: write` 权限（更安全的权限模型）

**部署流程变更**:
- **之前**: PR 合并 → 创建 tag → 手动执行 `pnpm deploy:gh-pages`
- **之后**: PR 合并 → 创建 tag → 自动部署（桌面应用 + Web 版本并行）
  - 使用 GitHub Pages 官方 Actions，不再操作 gh-pages 分支

**持续集成**:
- 所有 tag 推送事件都将触发部署
- 支持手动触发（`workflow_dispatch`）以便在需要时重新部署
- 本地部署命令 `pnpm deploy:gh-pages` 继续可用，不受影响
