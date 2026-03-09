## Why

在完成阶段 1（补丁版本更新）后，需要继续更新**次版本依赖**（minor versions）。次版本更新可能包含新功能、性能改进或潜在的破坏性变更，需要更谨慎的测试和验证。

此变更将更新 3 个中等风险的次版本依赖，确保项目获得最新的功能特性和修复。

## What Changes

更新以下次版本依赖：

**状态管理**：
- `@reduxjs/toolkit`: 2.9.1 → **2.11.2**（跨越 2 个次版本）
  - 可能包含新的 Redux Toolkit 特性和改进
  - 需要验证 Redux store 和 slices 的兼容性

**路由管理**：
- `react-router-dom`: 7.9.4 → **7.13.1**
  - React Router v7 的持续更新
  - 需要验证路由功能和导航逻辑

**构建工具**：
- `@tauri-apps/cli`: 2.9.0 → **2.10.1**（开发依赖）
  - Tauri CLI 的功能更新
  - 需要验证构建和开发流程

## Capabilities

### New Capabilities
无（此变更不引入新功能）

### Modified Capabilities
无（依赖更新不改变应用级别的功能需求）

**注意**：虽然这些是次版本更新，但通常不涉及破坏性变更。如有需要，将在 design 阶段详细分析变更日志。

## Impact

**受影响的文件**：
- `package.json` - 更新依赖版本号
- `pnpm-lock.yaml` - 自动更新锁定文件
- 无需修改应用代码（除非依赖有破坏性变更）

**测试策略**：
- 更新后运行完整测试套件：`pnpm test:all`
- 运行 lint 和类型检查：`pnpm lint` && `pnpm tsc`
- 手动验证核心功能：
  - Redux 状态管理（聊天列表、模型配置等）
  - 路由导航（聊天页面、设置页面等）
  - Tauri 构建：`pnpm tauri build`（验证构建流程）
- 检查控制台是否有警告或错误

**风险评估**：**中等风险**
- 次版本更新可能包含新功能或行为变化
- 需要查阅各依赖的 CHANGELOG
- 建议在更新后进行完整的功能测试
- 可通过 `pnpm update <package-name>` 单独更新并测试

**回滚策略**：
- 如遇问题，可通过 Git 快速回滚
- 或使用 `pnpm update <package-name>@<old-version>` 恢复特定版本
