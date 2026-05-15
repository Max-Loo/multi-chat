## Why

测试系统中存在多处重复模式和低效实践：ResizeObserver polyfill 在 4 个文件中重复定义、2 个文件使用真实 `setTimeout` 等待（共 ~1s）、`crypto.test.ts` 约 20 个 Unicode 往返测试未参数化、Markdown 渲染相关的 highlight.js mock 可提取共享、3 个文件手动构造测试对象而非使用已有工厂、RTK 样板测试验证框架保证而非应用逻辑、`setup.ts` 中 barrel export 导致所有测试加载不必要代码。这些问题增加了维护成本并拖慢测试执行速度。

## What Changes

- 将 ResizeObserver 空 polyfill 移至 `setup.ts` 全局注册，删除 4 个文件中的重复定义
- 将 2 个文件中的真实 `setTimeout` 等待替换为 `vi.useFakeTimers()` + `vi.advanceTimersByTime()`
- 对 `crypto.test.ts` 约 20 个 Unicode 往返测试使用 `test.each` 参数化
- 提取 `highlight.js` mock 为共享模块（ChatBubble/ThinkingSection 共用）
- 统一 3 个手动构造测试对象的文件使用 `createMockMessage` 等已有工厂
- 移除 `chatPageSlices.test.ts` 中 RTK 框架样板测试（行 57-85）
- 删除 `setup.ts` 中 `export * from './helpers'` barrel export

## Capabilities

### New Capabilities

- `test-infrastructure-dedup`: 测试基础设施去重 — ResizeObserver polyfill 集中注册、highlight.js mock 共享提取、barrel export 清理
- `test-performance-optimization`: 测试性能优化 — fake timers 替换真实等待
- `test-parameterization`: 测试参数化 — crypto Unicode 往返测试使用 test.each

### Modified Capabilities

无（本次变更不修改任何 spec 级别的行为需求）

## Impact

- **测试文件**：约 10 个测试文件需要修改
- **setup.ts**：新增 ResizeObserver polyfill 注册，删除 barrel export
- **Mock 文件**：新增 `highlight.js` 共享 mock 模块
- **风险**：低 — 所有变更均为等价替换或清理，不改变测试逻辑
