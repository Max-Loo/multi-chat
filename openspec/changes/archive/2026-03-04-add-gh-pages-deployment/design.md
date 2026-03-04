## Context

当前项目使用 Tauri + React + TypeScript 架构，支持桌面应用和 Web 版本。版本发布流程已部分自动化：
- `create-tag.yml`: PR 合并到 main 分支时检测 `package.json` 版本变化，自动创建 tag
- `build-and-release.yml`: tag 推送时自动构建多平台 Tauri 桌面应用（Windows、macOS、Linux）

但 Web 版本部署仍需手动执行 `pnpm deploy:gh-pages`，导致发布流程不一致。项目已配置 GitHub Pages 子路径（`/multi-chat/`），README 中也声明了自动部署能力，但实际缺失对应的 workflow。

现有部署脚本使用 `gh-pages` npm 包，执行流程：`pnpm web:build && gh-pages -d dist`，将构建产物推送到 `gh-pages` 分支。

## Goals / Non-Goals

**Goals:**
- 实现与桌面应用同步的 Web 版本自动部署
- 复用现有版本管理流程，无需额外的版本检测逻辑
- 优化 CI/CD 构建速度，使用缓存机制
- 保持与本地部署脚本的一致性，降低维护成本

**Non-Goals:**
- 不修改本地的 `gh-pages` 部署方式（CI 使用官方 Actions，本地继续使用 `pnpm deploy:gh-pages`）
- 不改变 GitHub Pages 的子路径配置 `/multi-chat/`
- 不影响现有的桌面应用构建流程

## Decisions

### 1. 触发方式选择：Tag 事件 vs 分支推送

**决策**: 使用 tag 推送事件（`v*.*.*`）触发部署

**理由**:
- **与桌面应用构建保持一致**: `build-and-release.yml` 也使用 tag 触发，确保版本发布时桌面和 Web 版本同步构建
- **语义化版本控制**: 只有正式版本才部署，避免 main 分支每次提交都触发部署
- **复用现有逻辑**: 利用 `create-tag.yml` 的版本检测机制，无需重复实现版本比较逻辑

**替代方案**: 直接监听 main 分支的 push 事件，比较前后 commit 的 `package.json` 版本
- **优点**: 更直接，减少一个 workflow
- **缺点**: 需要额外的版本比较逻辑，与现有流程不一致，可能重复部署

### 2. 部署工具：GitHub Pages 官方 Actions vs gh-pages 包

**决策**: 使用 GitHub Pages 官方 Actions（`actions/upload-pages-artifact` + `actions/deploy-pages`）

**理由**:
- **官方推荐**: GitHub 官方文档推荐的方式，符合最佳实践
- **更安全的权限**: 使用 `pages: write` + `id-token: write`，无需 `contents: write` 权限
- **更快的部署**: 直接使用 GitHub Pages 基础设施，部署速度更快
- **无需 gh-pages 分支**: 不创建和维护 gh-pages 分支，简化仓库结构
- **更好的集成**: 与 GitHub Actions 生态系统深度集成，支持并发控制、环境管理等高级特性
- **OIDC 认证**: 使用 OpenID Connect 进行身份验证，无需存储长期凭证

**替代方案**: 继续使用 `gh-pages` npm 包
- **优点**: 与本地部署命令一致
- **缺点**:
  - 需要 `contents: write` 权限（权限过高）
  - 需要配置 Git 用户身份
  - 需要维护 gh-pages 分支
  - 不是 GitHub 官方推荐方式
  - 部署速度较慢

**本地与 CI 兼容性**:
- **CI 环境**: 使用官方 Actions（新方案）
- **本地开发**: 继续使用 `pnpm deploy:gh-pages`（不变）
- 两者并存，互不影响

### 3. 缓存策略：pnpm action-setup 内置缓存

**决策**: 使用 `pnpm/action-setup@v4` 的 `cache_dependencies: true` 参数

**理由**:
- **官方支持**: pnpm 官方 action 内置功能，配置简单
- **自动管理**: 自动处理缓存键（基于 `pnpm-lock.yaml` hash）
- **多级缓存**: 缓存 pnpm store 和 node_modules，显著加快依赖安装
- **避免顺序依赖**: 不需要像 `setup-node` 的 `cache: 'pnpm'` 那样要求 pnpm 先安装

**缓存内容**:
```
~/.pnpm-store              # pnpm 全局包存储
node_modules/              # 项目依赖
```

### 4. Node.js 版本选择：22

**决策**: 使用 Node.js 22

**理由**:
- **与 build-and-release 一致**: 现有的 Tauri 构建 workflow 使用 Node 22
- **最新 LTS**: Node 22 是当前最新的 LTS 版本
- **构建兼容性**: 项目依赖已验证在 Node 22 上正常工作

### 5. 环境变量配置：CI=false

**决策**: 构建步骤设置 `CI: false` 环境变量

**理由**:
- **避免构建失败**: Vite 在 CI 环境下会将警告视为错误，可能导致构建失败
- **现有实践**: `deploy:gh-pages` 脚本在本地开发时也无需 CI 模式
- **灵活性**: 如需严格模式，可随时移除此配置

## Risks / Trade-offs

### Risk 1: 部署失败导致版本发布不完整
**描述**: 如果 GitHub Pages 部署失败，但桌面应用构建成功，用户可能访问到旧版本 Web 版本
**缓解措施**:
- workflow 失败会发送 GitHub 通知，开发者可及时介入
- 保留本地部署能力（`pnpm deploy:gh-pages`）作为备份方案
- 部署 job 依赖构建 job，构建失败不会触发部署

### Risk 2: GitHub Pages 配置问题
**描述**: 首次使用 GitHub Pages 官方 Actions 需要在仓库设置中配置 Source 为 "GitHub Actions"
**缓解措施**:
- 在部署步骤中添加详细的配置说明
- workflow 会自动检测配置问题并给出明确错误提示

### Risk 3: Artifact 大小限制
**描述**: GitHub Pages artifact 有 10GB 大小限制，虽然当前项目远小于此限制，但未来可能超限
**缓解措施**:
- 当前项目构建产物约 5-10MB，远低于限制
- 如超限，可优化构建配置（如代码分割、资源压缩）

### Risk 4: 构建时间增加
**描述**: 每次发布都需要构建 Web 版本，整体 CI 时间增加
**缓解措施**:
- 使用缓存优化依赖安装（预计节省 30-60 秒）
- 与 Tauri 构建并行执行，不延长总发布时间
- pnpm 使用 `--frozen-lockfile` 确保依赖一致性

### Risk 5: 缓存失效导致构建缓慢
**描述**: `pnpm-lock.yaml` 变更时缓存失效，首次运行较慢
**缓解措施**:
- 接受合理的首次构建时间（通常 2-3 分钟）
- GitHub Actions 缓存有 7 天过期时间，频繁发布可保持缓存有效

### Trade-off: 自动部署 vs 手动控制
**选择**: 自动部署（tag 触发）
**权衡**: 失去了手动控制部署时机的灵活性，但确保了版本发布的完整性和一致性

## Migration Plan

### 部署步骤

1. **创建 workflow 文件**
   - 在 `.github/workflows/` 目录下创建 `deploy-to-gh-pages.yml`
   - 使用两个 job：build（构建）和 deploy（部署）

2. **配置 GitHub Pages**
   - 进入仓库 Settings → Pages → Build and deployment
   - Source 设置为 "GitHub Actions"（首次使用需要）
   - 如果之前使用 gh-pages 分支，需要切换到 GitHub Actions 模式

3. **首次测试**
   - 创建测试 tag（如 `v0.2.1-test`）触发 workflow
   - 验证构建和部署成功
   - 检查 GitHub Pages 是否更新

4. **正式发布**
   - 在 `package.json` 中更新版本号
   - 创建 PR 并合并到 main 分支
   - `create-tag.yml` 自动创建 tag
   - `build-and-release.yml` 和 `deploy-to-gh-pages.yml` 并行触发

### 回滚策略

1. **Web 版本回滚**
   - 方法 1: 使用 GitHub Pages UI 重新部署特定版本
   - 方法 2: 本地执行 `pnpm deploy:gh-pages` 推送到 gh-pages 分支（需要将 Source 切回 gh-pages 分支）

2. **重新部署特定版本**
   - 使用 `workflow_dispatch` 手动触发部署
   - 或检出对应 tag，本地执行 `pnpm deploy:gh-pages`

3. **禁用自动部署**
   - 删除或禁用 `deploy-to-gh-pages.yml` workflow
   - 恢复手动部署流程

### 验证清单

- [ ] Workflow 文件语法正确
- [ ] 权限配置正确（pages: write + id-token: write）
- [ ] GitHub Pages Source 设置为 "GitHub Actions"
- [ ] 首次测试部署成功
- [ ] GitHub Pages 网站可访问
- [ ] 与桌面应用版本号一致
- [ ] 缓存功能正常工作
- [ ] 部署历史在 Actions runs 中可查看

## Open Questions

1. **是否需要部署预览环境？**
   - 当前设计只部署生产环境，是否需要为 PR 添加预览部署？
   - **状态**: 不在本变更范围内，未来可考虑

2. **是否需要部署状态徽章？**
   - 在 README 中添加 GitHub Pages 部署状态徽章？
   - **状态**: README 已有 GitHub Pages 链接徽章，状态徽章可选

3. **构建失败通知策略**
   - 是否需要额外的通知机制（如 Slack、Email）？
   - **状态**: 依赖 GitHub 默认通知，暂不添加额外通知
