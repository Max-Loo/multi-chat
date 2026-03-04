## 1. 创建 GitHub Actions Workflow

- [x] 1.1 创建 `.github/workflows/deploy-to-gh-pages.yml` 文件
- [x] 1.2 配置 workflow 触发条件（tag `v*.*.*` 和 `workflow_dispatch`）
- [x] 1.3 配置 workflow 权限（`pages: write` + `id-token: write`）
- [x] 1.4 配置并发控制（`concurrency`）

## 2. 配置构建 Job（build）

- [x] 2.1 添加 Checkout 步骤（`actions/checkout@v6`）
- [x] 2.2 配置 Node.js 22 环境（`actions/setup-node@v6`）
- [x] 2.3 安装 pnpm 10 并启用缓存（`pnpm/action-setup@v4`）
- [x] 2.4 添加依赖安装步骤（`pnpm install --frozen-lockfile`）
- [x] 2.5 添加构建步骤（`pnpm web:build`）
- [x] 2.6 配置构建环境变量（`CI=false`）
- [x] 2.7 上传构建产物（`actions/upload-pages-artifact@v4`）

## 3. 配置部署 Job（deploy）

- [x] 3.1 配置 job 依赖（`needs: build`）
- [x] 3.2 配置 GitHub Pages 环境（`environment: github-pages`）
- [x] 3.3 添加部署步骤（`actions/deploy-pages@v4`）
- [x] 3.4 配置输出 URL（`url: ${{ steps.deployment.outputs.page_url }}`）

## 4. 配置 GitHub Pages

- [x] 4.1 验证 workflow YAML 语法正确性
- [x] 4.2 在仓库设置中配置 Source 为 "GitHub Actions"
- [x] 4.3 确认仓库 Actions 权限配置（Settings → Actions → General）

## 5. 验证和测试

- [x] 5.1 创建测试 tag（如 `v0.2.1-test`）触发首次部署
- [x] 5.2 验证 GitHub Actions workflow 执行成功
- [x] 5.3 验证 build job 构建成功并上传 artifact
- [x] 5.4 验证 deploy job 部署成功
- [x] 5.5 验证 GitHub Pages 网站可正常访问
- [x] 5.6 验证网站版本号与 tag 一致
- [x] 5.7 验证部署 URL 在 workflow 摘要中正确显示

## 6. 文档更新（可选）

- [x] 6.1 更新 README.md 的部署说明
- [x] 6.2 更新 README 说明使用 GitHub Pages 官方 Actions
- [x] 6.3 确认 README 中的自动部署声明与实际一致
- [x] 6.4 添加 workflow 徽章到 README

## 7. 验证并行部署

- [x] 7.1 更新 `package.json` 版本号
- [x] 7.2 创建 PR 并合并到 main 分支
- [x] 7.3 验证 `create-tag.yml` 自动创建 tag
- [x] 7.4 验证 `build-and-release.yml` 和 `deploy-to-gh-pages.yml` 并行触发
- [x] 7.5 确认桌面应用和 Web 版本版本号一致

## 8. 清理和优化（可选）

- [x] 8.1 删除测试 tag（如 `v0.2.1-test`）
- [x] 8.2 删除旧的 gh-pages 分支（如果存在且不再需要）
- [x] 8.3 监控 workflow 执行时间和缓存效果
- [x] 8.4 根据需要调整缓存策略或并发设置
