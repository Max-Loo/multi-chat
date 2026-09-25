# 精简基线备注（2026-09-25）

> 本文件为 simplify-test-code 变更的精简前基线存档，机械对比依据（design D7）。

## 测试通过数

- 单元测试（`pnpm test:run`）：**169 文件通过，2,391 用例通过**（另有 4 skipped）
- 集成测试（`pnpm test:integration:run`）：**9 文件通过，93 用例通过**

## 覆盖率基线（`pnpm test:coverage`，Istanbul，json-summary）

文件级完整副本：`coverage/coverage-baseline.json`（工作区，不入库）。
以下为 9 个模块（8 目录 + 全局汇总）的 lines / branches 百分比：

| 模块 | lines % | branches % |
| ------------ | ------- | ---------- |
| 全局（TOTAL） | 93.24 | 76.75 |
| hooks | 99.07 | 92.14 |
| services | 95.42 | 81.31 |
| store | 95.87 | 89.75 |
| utils | 92.23 | 92.31 |
| components | 83.09 | 65.77 |
| config | 100.00 | 75.00 |
| pages | 95.01 | 75.52 |
| router | 86.67 | 50.00 |

## 备注

- vite.config.ts 的 coverage reporter 原为 `["text", "html", "json", "lcov"]`，为满足 D7
  json-summary 机械对比要求，补充 `"json-summary"` reporter（阈值未动）。
- 每批回归后将 `coverage/coverage-summary.json` 用同一聚合口径对比本表，任何模块下降即阻塞合入。
