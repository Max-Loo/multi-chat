## Context

3 个测试架构问题经源码验证确认：

1. **无效 RESET action**: `resetStore.ts` 行 54 的 `testStore.dispatch({ type: 'RESET' })` 无任何 reducer 处理，dispatch 后立即 `testStore = null`，dispatch 调用无意义
2. **错位的集成测试**: `drawer-state.integration.test.tsx` 中 11 个 `TODO(单元测试迁移)` 标记的测试，渲染了 ChatPage/SettingPage/CreateModel 完整组件，但断言仅检查 Redux state。经比对目标 slice 测试文件：
   - `settingPageSlices.test.ts` 已有 3 个等效测试（初始状态、toggleDrawer、setIsDrawerOpen）
   - `modelPageSlices.test.ts` 已有 3 个等效测试（初始状态、toggleDrawer、setIsDrawerOpen）
   - `chatPageSlices.test.ts` 已验证初始状态含 `isDrawerOpen: false`，但缺少 toggleDrawer/setIsDrawerOpen 及边界测试
   - 结论：7 个重复（直接删除），4 个新增（迁移到 chatPageSlices.test.ts）
3. **单线程瓶颈**: `vite.config.ts` 行 71 的 `maxThreads: 1` 限制 113 个单元测试文件全部串行执行

## Goals / Non-Goals

**Goals:**
- 消除无效代码，确保 `resetStore` 语义正确
- 将 Redux 纯逻辑测试归入正确的测试层级，消除重复测试
- 提升测试执行速度

**Non-Goals:**
- 不重构集成测试的整体架构
- 不一次性将 `maxThreads` 调到很高（渐进式增加）
- 不修改测试的断言内容

## Decisions

### Decision 1: resetStore 清理

**选择**: 移除无效的 `dispatch({ type: 'RESET' })`，仅保留 `testStore = null`。

**理由**: 无任何 reducer 处理 `RESET` action，dispatch 调用是纯噪声。`testStore = null` 已足够表达"重置"语义。

### Decision 2: Redux 测试迁移策略（已修正）

**选择**: 将 11 个 TODO 标记测试分类处理——7 个重复测试直接删除，4 个新增测试迁移到 `chatPageSlices.test.ts`。

**理由**: 经比对目标 slice 测试文件中的已有测试：
- `settingPageSlices.test.ts` 已有 3 个等效测试（初始状态、toggleDrawer、setIsDrawerOpen），迁移会制造重复
- `modelPageSlices.test.ts` 已有 3 个等效测试，迁移会制造重复
- `chatPageSlices.test.ts` 已验证初始状态含 `isDrawerOpen: false`（1 个重复），但缺少 4 个新测试：
  - dispatch toggleDrawer 切换抽屉状态
  - dispatch setIsDrawerOpen 设置抽屉状态
  - 重复 dispatch toggleDrawer 正确切换
  - setIsDrawerOpen 覆盖当前状态

**步骤**:
1. 比对每个 TODO 测试与目标 slice 文件中的已有测试
2. 标记重复测试（settingPage 3 个、modelPage 3 个、chatPage 初始状态 1 个）→ 直接删除
3. 迁移 chatPage 的 4 个新测试到 `chatPageSlices.test.ts`，移除组件渲染代码，改用 reducer 直接测试风格（与文件中已有测试风格一致）
4. 在原集成测试文件中删除所有已处理测试和 TODO 注释

### Decision 3: 多线程配置

**选择**: 将 `maxThreads` 从 1 增加到 2，运行完整测试套件验证稳定性。

**理由**: Vitest worker threads 拥有独立模块作用域，现有测试未发现对 localStorage 等共享外部资源的写冲突。先保守地设为 2 验证，通过后再考虑增加。

## Risks / Trade-offs

- **[风险] 多线程暴露并发 mock 竞态** → 如测试失败，回退 `maxThreads: 1` 并记录失败的测试文件
- **[风险] 迁移后集成测试覆盖率下降** → 7 个重复测试已有 slice 单元测试覆盖；4 个新迁移测试在 slice 层等效覆盖
