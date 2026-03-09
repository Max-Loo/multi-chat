## Why

在完成阶段 1（补丁版本）和阶段 2（次版本）的依赖更新后，最后需要处理**高风险的主版本更新**（major versions）。主版本更新通常包含破坏性变更（BREAKING CHANGES），需要仔细评估风险、查阅变更日志并进行充分测试。

此变更将更新 4 个主版本依赖，确保项目能获得最新的功能特性，同时最小化破坏性变更的影响。

## What Changes

更新以下主版本依赖：

**构建工具**：
- ✅ **BREAKING**: `rollup-plugin-visualizer`: 6.0.5 → **7.0.1**
  - 主版本更新，可能包含 API 变更或配置格式变化
  - 需要验证 Vite 构建配置和 bundle 分析功能
  - **状态**: 已完成 ✅

**测试工具**：
- ⚠️ **BREAKING**: `fake-indexeddb`: 5.0.2 → **6.2.5**（已跳过）
  - 主版本更新，可能影响集成测试中的 IndexedDB mock 行为
  - 需要验证所有使用 IndexedDB 的测试
  - **状态**: 已跳过 ⚠️（详见 tasks.md "跳过更新记录"）

**开发工具**：
- ✅ **BREAKING**: `globals`: 16.4.0 → **17.4.0**
  - 全局类型定义的主版本更新
  - 可能影响 TypeScript 类型检查
  - **状态**: 已完成 ✅

- ✅ **BREAKING**: `@types/node`: 24.9.1 → **25.3.5**
  - Node.js 类型定义的主版本更新
  - 可能影响类型检查和构建流程
  - **状态**: 已完成 ✅

**总结**: 3/4 依赖更新成功，1 个依赖（fake-indexeddb）暂时跳过

## Capabilities

### New Capabilities
无（此变更不引入新功能）

### Modified Capabilities
无（依赖更新不改变应用级别的功能需求）

**注意**：这些是主版本更新，可能在实现层面影响现有功能，但不会改变应用的功能需求。具体的破坏性变更将在 design 阶段详细分析。

## Impact

**受影响的文件**：
- `package.json` - 更新依赖版本号
- `pnpm-lock.yaml` - 自动更新锁定文件
- 可能需要更新构建配置（如 `vite.config.ts`）
- 可能需要调整测试代码（如 IndexedDB mock 使用方式）

**测试策略**：
1. **更新前准备**：
   - 查阅每个依赖的 CHANGELOG 和迁移指南
   - 识别所有破坏性变更
   - 备份当前工作状态

2. **分步更新**：
   - 建议逐个更新并测试，而非批量更新
   - 每个依赖更新后运行完整测试套件：`pnpm test:all`
   - 运行类型检查：`pnpm tsc`
   - 运行 lint：`pnpm lint`
   - 验证构建流程：`pnpm web:build` 和 `pnpm tauri build`

3. **功能验证**：
   - 手动测试核心功能（聊天、模型管理、设置等）
   - 检查 bundle 分析器功能（`rollup-plugin-visualizer`）
   - 验证所有集成测试（特别是使用 IndexedDB 的测试）

**风险评估**：**高风险**
- 主版本更新通常包含破坏性变更
- 可能需要修改应用代码或配置
- 需要逐个更新并充分测试
- 建议在功能分支上进行，完成后合并

**回滚策略**：
- 通过 Git 快速回滚到更新前的版本
- 或使用 `pnpm update <package-name>@<old-version>` 恢复特定版本
- 保留更新前的测试结果作为基线对比

**时间估算**：
- 查阅文档和变更日志：1-2 小时
- 逐个更新和测试：2-4 小时（实际：3 个依赖）
- 处理破坏性变更：1-3 小时
- 总计：4-9 小时（取决于破坏性变更的数量）

**实际结果**：
- 3 个依赖成功更新（globals, @types/node, rollup-plugin-visualizer）
- 1 个依赖跳过（fake-indexeddb）
- 所有测试通过
- 构建成功
