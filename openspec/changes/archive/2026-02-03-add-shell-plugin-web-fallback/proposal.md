## Why

当前项目已集成 `@tauri-apps/plugin-shell` 插件（lib.rs:10），但该插件仅限于 Tauri 桌面环境。当应用在 Web 端运行时（通过 `pnpm web:dev` 或 `pnpm web:build`），Shell 插件 API 不可用，会导致运行时错误。为了支持应用同时在桌面和 Web 环境中运行，需要为 Tauri 插件提供 Web 端的降级方案。

## What Changes

- **新增 Shell 插件的 Web 降级适配层**
  - 创建统一的 Shell API 封装，自动检测运行环境
  - 在 Tauri 环境使用 `@tauri-apps/plugin-shell` 的原生实现
  - 在 Web 环境使用浏览器原生 API 或功能降级（noop/no-operation）
- **实现环境检测工具函数**
  - 提供 `isTauri()` 函数判断当前运行环境
- **更新现有代码以使用统一 API**（如果已有使用 Shell 插件的代码）
  - 将直接调用 Shell 插件的代码替换为统一 API
- **添加 Web 环境的类型兼容**
  - 确保类型定义在两种环境下都能正确工作
- **文档更新**
  - 更新 AGENTS.md 说明跨平台兼容性模式

## Capabilities

### New Capabilities
- `tauri-plugin-web-compat`: Tauri 插件的 Web 端降级和兼容层，提供统一的 API 封装，支持在桌面和 Web 环境中无缝切换

### Modified Capabilities
（无 - 本次变更不涉及修改现有 spec 级别的功能需求）

## Impact

**受影响的代码**:
- 前端：新增 `src/utils/tauriCompat.ts`（或类似路径）用于统一 API 封装
- 前端：更新任何直接使用 `@tauri-apps/plugin-shell` 的代码
- 构建配置：可能需要调整 Vite 配置以确保正确的环境变量注入

**新增依赖**:
- 无需额外 npm 包（使用条件导入和特性检测）

**向后兼容性**:
- 完全向后兼容 - 现有的 Tauri 桌面功能不受影响
- Web 端获得基本功能支持（某些高级 Shell 功能可能不可用）

**测试影响**:
- 需要在 Web 环境测试降级行为
- 需要在 Tauri 环境验证原生功能未受影响
