# Vite 8 迁移提案

## Why

Vite 8 是一个重大版本更新，主要变化是从 esbuild/Rollup 构建工具链迁移到 Rolldown/Oxc。Rolldown 是由 Vite 团队开发的新一代打包工具，旨在提供更快的构建速度和更好的性能。及时迁移可以确保项目保持与最新构建技术同步，并获得性能改进和 bug 修复。

## What Changes

- **BREAKING**: 升级 Vite 从 `^7.3.1` 到 `^8.0.0`
- 将 `build.rollupOptions` 重命名为 `build.rolldownOptions`
- 将 `manualChunks` 函数迁移到 `codeSplitting` 策略配置
- **BREAKING**: 默认浏览器目标变更（Chrome 107 → 111，Firefox 104 → 114，Safari 16.0 → 16.4）
- **BREAKING**: CommonJS 互操作性修复（影响从 CJS 模块导入的代码）

## Capabilities

### New Capabilities
*无* - 本次迁移是构建工具升级，不引入新的用户可见功能。

### Modified Capabilities
*无* - 本次迁移不改变应用的功能规格，仅改变构建工具实现。

## Impact

**影响的文件：**
- `package.json` - Vite 依赖版本升级
- `vite.config.ts` - 构建配置迁移（rollupOptions → rolldownOptions）

**影响的系统：**
- 开发服务器（`pnpm web:dev`）
- 生产构建（`pnpm web:build`）
- Tauri 构建（`pnpm build`）
- 测试运行（Vitest 4.x 已兼容 Vite 8）

**依赖兼容性：**
- React 19.2.4 - 兼容 ✓
- @vitejs/plugin-react 5.1.4 - 需验证
- @tailwindcss/vite 4.2.1 - 需验证（使用 Lightning CSS）
- Vitest 4.0.18 - 兼容 ✓

**潜在风险：**
- `codeSplitting` 配置语法错误可能导致构建失败
- CommonJS 依赖解析可能影响运行时行为
- 浏览器目标变更可能影响构建产物大小
