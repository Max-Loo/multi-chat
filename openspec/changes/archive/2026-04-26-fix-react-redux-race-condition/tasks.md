## Tasks

- [x] **Task 1: 修改单元测试 Vitest 配置**
  文件: `vite.config.ts`
  将 `test.pool` 从 `"threads"` 改为 `"forks"`，移除 `singleThread`、`minThreads`、`maxThreads`、`useAtomics` 字段，添加 `poolOptions.forks.maxForks: 2`。同时更新第 69 行 react-redux 预构建注释。

- [x] **Task 2: 同步修改集成测试配置**
  文件: `vitest.integration.config.ts`
  添加 `pool: "forks"` 和 `poolOptions.forks.maxForks: 1`，保持集成测试串行语义。

- [x] **Task 3: 稳定性验证**
  验收标准: 连续运行 `pnpm test:run` 20 次，全部通过（0 失败）。记录平均执行时间，确认与修改前（~9s）差距在可接受范围内。

- [x] **Task 4: 运行集成测试**
  验收标准: `pnpm test:integration:run` 全部通过。
