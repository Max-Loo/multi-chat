# GitHub Actions Workflow 配置说明

## 问题描述

使用 `GITHUB_TOKEN` 创建的 tag 不会触发新的 workflow，这是 GitHub Actions 的安全限制。

## 解决方案

需要使用 Personal Access Token (PAT) 来替代 `GITHUB_TOKEN`。

## 设置步骤

1. **创建 Personal Access Token**
   - 进入 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 点击 "Generate new token (classic)"
   - 设置 Token 名称（如：workflow-trigger-token）
   - 选择过期时间（建议设置为 90 天或 1 年）
   - 选择权限范围：
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
   - 生成 token 并复制（⚠️ 只显示一次）

2. **添加 Repository Secret**
   - 进入你的仓库 Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: 粘贴你生成的 Personal Access Token
   - 点击 "Add secret"

3. **验证配置**
   - 确保 `PAT_TOKEN` 已在仓库的 Secrets 中设置
   - workflow 文件已经更新为使用 `${{ secrets.PAT_TOKEN }}`

## 注意事项

- Personal Access Token 有安全风险，请妥善保管
- 建议设置合理的过期时间，定期更新
- 如果 Token 过期，需要重新生成并更新 Repository Secret
- 使用 PAT 创建的 tag 将会正确触发 `build-and-release.yml` workflow

## 工作流程

1. `create-tag.yml` 被触发（当推送到 `feat/build-and-release` 分支）
2. 创建新的 tag 并使用 PAT 推送
3. `build-and-release.yml` 检测到新的 tag 推送并自动触发
4. 开始构建和发布流程