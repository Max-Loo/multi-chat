# 精简基线存档

记录日期：2026-09-25（commit 448f73d8 之后、批次①删除之前）

## 测试通过基线

| 维度 | 文件数 | 用例数 |
| ---- | ------ | ------ |
| 单元测试（`pnpm test:run`） | 169 全部通过 | 2,391 通过 + 4 skipped |
| 集成测试（`pnpm test:integration:run`） | 9 全部通过 | 93 通过 |

## 覆盖率基线（`pnpm test:coverage`，Istanbul，按模块聚合 lines/branches）

原始逐文件数据见 `coverage/coverage-baseline.json`（自 `coverage/coverage-summary.json` 复制）。

| 模块 | lines | branches |
| ---------- | ------- | -------- |
| hooks | 99.07% | 92.14% |
| services | 95.42% | 81.31% |
| store | 95.87% | 89.75% |
| utils | 92.23% | 92.31% |
| components | 83.09% | 65.77% |
| config | 100.00% | 75.00% |
| pages | 95.01% | 75.52% |
| router | 86.67% | 50.00% |
| **全局（total）** | **93.24%** | **76.75%** |

验收规则（design D7）：每批回归后重新生成 `coverage/coverage-summary.json` 并按上表逐模块对比，任何模块 lines 或 branches 低于基线即阻塞该批。

## vite.config.ts 变更

`coverage.reporter` 数组追加 `"json-summary"`（产出 `coverage/coverage-summary.json` 模块汇总），阈值未动。
