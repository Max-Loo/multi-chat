# 升级 lucide-react 依赖版本

## Why

lucide-react 当前版本 0.563.0 已过时，存在 14 个版本的更新。升级到最新版本 0.577.0 可以获取最新的图标更新、错误修复和性能改进。

## What Changes

- 将 lucide-react 从 0.563.0 升级到 0.577.0
- 运行 `pnpm update lucide-react` 更新依赖
- 检查并验证所有使用 lucide-react 图标的组件仍然正常工作
- 检查破坏性变更（如有）并适配

## Capabilities

### New Capabilities
_无新功能需求_

### Modified Capabilities
_无功能需求变更（仅为依赖升级）_

## Impact

- **依赖**: `package.json` 中的 lucide-react 版本号将更新
- **组件**: 所有使用 lucide-react 图标的组件（搜索代码库中的 `lucide-react` 导入）
- **测试**: 可能需要更新相关测试（如有图标的破坏性变更）
- **构建**: 需要运行 `pnpm install` 更新 lockfile
