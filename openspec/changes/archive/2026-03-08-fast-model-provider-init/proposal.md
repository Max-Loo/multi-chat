## Why

应用启动时 modelProvider 初始化会阻塞整个初始化流程，每次都先尝试远程请求（5 秒超时 + 最多 2 次重试，最长可达 12 秒），即使有缓存数据也会等待网络请求完成。这导致应用启动时间过长，影响用户体验。

## What Changes

- **修改 `initializeModelProvider` Thunk**：优先检查缓存，有缓存则立即返回（< 100ms），无缓存才等待远程请求
- **新增 `silentRefreshModelProvider` Thunk**：在初始化完成后异步触发，后台静默刷新数据，失败时不显示错误提示
- **修改 `main.tsx`**：在初始化流程完成后立即触发后台刷新
- **更新测试**：为快速路径和后台刷新添加单元测试和集成测试

## Capabilities

### New Capabilities
- `fast-model-provider-init`: 快速模型供应商初始化能力，实现"缓存优先 + 后台刷新"的启动策略

### Modified Capabilities
- 无

## Impact

**受影响的代码**：
- `src/store/slices/modelProviderSlice.ts` - 修改 `initializeModelProvider` 实现，新增 `silentRefreshModelProvider`
- `src/main.tsx` - 在初始化完成后触发后台刷新
- `src/__test__/store/slices/modelProviderSlice.test.ts` - 新增快速路径和后台刷新测试
- 集成测试 - 验证快速启动场景

**受影响的系统**：
- 应用启动流程 - modelProvider 从同步阻塞改为快速返回
- 数据新鲜度 - 通过后台刷新保持数据及时性
- 错误处理 - 无缓存场景已有 `NoProvidersAvailable` 组件处理

**依赖变更**：
- 无新增外部依赖

**性能影响**：
- 有缓存场景（90%+）：启动时间从 5-12 秒降低到 < 100ms
- 无缓存场景：保持不变（仍需等待远程请求）
