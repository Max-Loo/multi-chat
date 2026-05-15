## Context

项目使用 Vitest@4.0.18 + happy-dom 运行 150 个测试文件（~1800 用例）。当前配置 `pool: "threads"` + `maxThreads: 2`，利用 Node.js worker_threads 实现并行。

`react-redux@9.2.0` 模块体顶部执行 `React.version.startsWith("19")`。在 worker_threads 模式下，ESM 模块图的解析存在竞态：当新 worker 线程初始化 `react-redux` 时，`React` 模块可能尚未完成解析，导致 `TypeError`。

实测数据：
- 多线程模式：25 次运行中 7 次失败（28%），每次失败文件不同
- 单线程模式：10 次运行全部通过（0%）

项目已有 `deps.optimizer.web.include` 预构建配置包含 `react` 和 `react-redux`，但无法消除此竞态。

## Goals / Non-Goals

**Goals:**
- 消除 react-redux 多线程竞态导致的间歇性测试失败
- 保持测试执行速度在可接受范围内（当前 ~9s）
- 最小化配置变更范围

**Non-Goals:**
- 不升级 react-redux 版本（属于独立决策，不在本次范围内）
- 不重构 globalThis mock 工厂模式
- 不改变测试文件结构或 mock 策略

## Decisions

### 决策 1：将 pool 从 "threads" 切换为 "forks"

**选择**: `pool: "forks"`

**理由**: forks 使用 `child_process.fork()` 创建独立进程，每个进程有完整的 V8 实例和独立的模块缓存，从根本上避免了 worker_threads 的 ESM 模块共享竞态。

**备选方案对比**:

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| `pool: "threads"` | 内存占用低 | 28% 失败率 | 排除 |
| `pool: "forks"` | 独立进程无竞态 | 内存略高 | **选择** |
| `--single-thread` | 0% 失败率 | 速度最慢 | 不可接受 |
| 升级 react-redux | 可能已修复 | 引入额外变更风险 | 独立评估 |

### 决策 2：同步修改集成测试配置

`vitest.integration.config.ts` 当前未指定 pool（使用 Vitest 默认值）。为保持一致性，显式设置 `pool: "forks"`。

### 决策 3：移除 maxThreads 配置

`maxThreads` 在 threads 池下控制 worker 线程数。切换到 forks 后改用 `poolOptions.forks.maxForks` 控制并发数，设为 2（与当前 maxThreads 一致）。

## Risks / Trade-offs

- **[内存占用]** forks 模式每个进程独立，内存高于 threads → 项目测试规模 150 文件 / ~9s 执行时间，内存增量可忽略
- **[CI 兼容性]** 某些 CI 环境（低内存 Docker）可能受影响 → 监控首次 CI 运行结果，必要时调低 maxForks
- **[执行速度]** forks 进程创建开销略高于线程复用 → 实测对比确认，预期增幅 < 2s
