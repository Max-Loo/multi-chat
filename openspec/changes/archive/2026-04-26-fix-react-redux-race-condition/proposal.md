## Why

Vitest 多线程模式下，`react-redux@9.2.0` 在 worker 线程初始化时存在 ESM 模块竞态：`React` 对象在 `react-redux` 模块体执行时尚未解析完成，导致 `React.version.startsWith("19")` 抛出 `TypeError: Cannot read properties of undefined`。实测约 28% 的全量测试运行会触发此失败，且每次失败的测试文件不同（已观察到 8+ 个不同文件），严重损害 CI 稳定性。

## What Changes

- 将 Vitest 单元测试的 `pool` 从 `"threads"` 切换为 `"forks"`，消除 worker_threads 的 ESM 模块初始化竞态
- 在集成测试配置 `vitest.integration.config.ts` 中同步应用相同修改
- 验证切换后测试套件稳定性和执行时间可接受

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `test-configuration`: 修改 Vitest 并行执行策略，从 threads 切换为 forks
- `test-setup-layers`: 确认三层 setup 在 forks 模式下无兼容性问题
- `vitest-framework`: 确保测试框架在 forks 池模式下稳定运行

## Impact

- **受影响文件**: `vite.config.ts`（test.pool 配置）、`vitest.integration.config.ts`（同步修改）
- **依赖**: 无新增依赖，仅修改 Vitest 内置配置
- **风险**: forks 模式内存占用略高于 threads（每个 fork 是独立进程），但项目测试规模（150 文件 / ~1800 用例）在可接受范围内
- **验证方式**: 连续运行全量测试套件 20+ 次，确认 0 失败
