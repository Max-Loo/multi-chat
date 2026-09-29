# 迁移基线（Phase 0，main @ dee9ba2）

记录时间：2026-09-29。本文件是 `feat/pure-web` 与 `feat/vue3-migration` 两个阶段的验收基线。

## 命令结果

| 命令 | 结果 |
| --- | --- |
| `pnpm validate`（oxlint + lint:i18n） | ✅ 通过 |
| `pnpm test:run`（单元测试） | ✅ 169 个测试文件，2391 通过，4 跳过 |
| `pnpm test:integration:run`（集成测试） | ✅ 9 个测试文件，93 通过 |
| `pnpm web:build` | ✅ 构建成功（5.51s），产物为纯静态资源 |

## 构建产物体积

- `dist/assets` JS 总计：**1868.6 KB**（1,913,400 字节）；CSS：66.8 KB。
- 首屏加载（entry + modulepreload，共 12 个 chunk）：**1256.4 KB 原始 / 375.5 KB gzip**。

### 首屏 chunk 明细

| Chunk | 原始 (KB) | gzip (KB) |
| --- | --- | --- |
| index（entry） | 3.1 | 1.5 |
| vendor-react | 193.2 | 60.7 |
| vendor（其他 node_modules） | 203.8 | 79.6 |
| vendor-radix | 93.0 | 27.1 |
| vendor-ui-utils | 27.3 | 8.7 |
| vendor-i18n | 48.6 | 15.9 |
| vendor-tauri | 4.7 | 1.6 |
| vendor-redux | 31.0 | 11.9 |
| vendor-zod | 77.9 | 21.1 |
| vendor-ai | 494.7 | 121.3 |
| vendor-icons | 7.9 | 3.1 |
| chunk-init | 101.3 | 32.1 |
| **合计** | **1256.4** | **375.5** |

### 体积分析报告

`rollup-plugin-visualizer` 已在 `vite.config.ts` 中配置，`pnpm web:build` 产出 `dist/stats.html`（约 1.5 MB）。
基线副本已存档为同目录 `baseline-stats.html`，供 Phase 2（任务 5.2）体积对比使用；对比指标以
"首屏加载 gzip 合计 ≤ 375.5 KB × 1.1 = **413 KB**" 为准。

## 备注

- 测试环境：macOS（darwin 27.0.0 arm64）、pnpm 12.6.0。
- 基线全部为绿，满足"基线不绿先修复再迁移"的前置条件。
