# 后续规格清理清单（followup-spec-cleanup）

依据 proposal「既有规格清理」决策：本变更完成后，由专门的规格清理变更批量修订以下既有规格。这些规格的场景文本仍引用 Tauri 环境（`isTauri()`、`window.__TAURI__`、`tauriCompat` 双环境分支、`src/utils/tauriCompat/` 路径、`@tauri-apps/*` 依赖等），在纯 Web + Vue 3 形态下已失效或表述过时。

本变更不逐个展开修订，以保持聚焦（见 proposal.md「决策与假设」）。

## 说明

- 以下计数为 grep 到的 `tauri` 字样出现次数（截至迁移完成时），供清理时评估工作量。
- 平台能力主规格（`tauri-plugin-web-compat`、`web-keyring-compat`、`web-store-compat`、`http-fetch-compat`、`os-locale-compat`、`gh-pages-auto-deployment`）已由本变更的 delta specs 覆盖（ADDED/MODIFIED/REMOVED），归档时合并，不在本清单内。

## A. 测试约定类（proposal 声明的约 22 个核心清单）

| # | 规格 | tauri 引用数 | 失效要点 |
| --- | --- | --- | --- |
| 1 | `custom-hooks-testing` | 8 | hooks 双环境测试场景；hooks 已迁为 composables |
| 2 | `tauri-compat-env-testing` | 11 | `isTauri()` 环境检测测试场景整体失效 |
| 3 | `tauri-compat-tests` | 2 | 兼容层双环境测试约定 |
| 4 | `master-key-unit-tests` | 22 | Tauri keyring 与 Web 降级双路径测试场景 |
| 5 | `masterkey-mutation-coverage` | 8 | 变异测试目标含 Tauri 分支 |
| 6 | `keyring-mutation-coverage` | 7 | 同上 |
| 7 | `store-mutation-coverage` | 1 | 同上 |
| 8 | `http-mutation-coverage` | 10 | tauriFetch 变异目标已删 |
| 9 | `shell-mutation-coverage` | 2 | shell 兼容层已整体删除 |
| 10 | `http-fetch-testing` | 7 | 双环境 fetch 测试场景 |
| 11 | `mock-strategy-configuration` | 12 | `__createTauriCompatModuleMock` 等 mock 约定 |
| 12 | `msw-migration` | 20 | Tauri 环境下的 MSW 场景描述 |
| 13 | `unified-mock-factory` | 14 | Tauri API mock 工厂约定 |
| 14 | `test-mock-factory-consolidation` | 6 | 同上 |
| 15 | `store-mock-unification` | 4 | 双环境存储 mock |
| 16 | `test-setup-layers` | 8 | setup 分层的 Tauri 相关约定 |
| 17 | `test-environment-isolation` | 1 | 环境隔离中的 Tauri 状态 |
| 18 | `test-configuration` | 1 | 配置中 tauriCompat 路径引用 |
| 19 | `test-dead-code-removal` | 3 | 面向 Tauri 移除的死代码清单 |
| 20 | `test-mock-data` | 1 | mock 数据中的 Tauri 形态 |
| 21 | `global-module-testing` | 1 | 全局模块测试中的 Tauri 场景 |
| 22 | `integration-test-coverage` | 1 | 集成覆盖清单中的 Tauri 项 |

## B. 其他引用 Tauri 场景的非测试类规格（一并纳入清理评估）

| 规格 | tauri 引用数 | 失效要点 |
| --- | --- | --- |
| `app-master-key` | 19 | 主密钥读写的 Tauri keyring 路径场景 |
| `crypto-masterkey-integration` | 11 | 双环境加密集成场景 |
| `secure-key-storage` | 15 | 原生钥匙串场景 |
| `field-level-encryption` | 5 | 双环境加密路径 |
| `json-data-persistence` | 2 | Tauri 文件持久化场景 |
| `keyring-migration` | 2 | 迁移流程中的 Tauri 分支 |
| `keyring-public-api` | 6 | 导出形态与路径（已改 `@/utils/platform`，场景文本待对齐） |
| `data-reset` | 2 | isTauri 分支收敛 |
| `clipboard-utils` | 1 | 剪贴板 Tauri API 场景 |
| `settings-change-integration` | 7 | Redux/双环境集成场景（本变更已重写为 Vue 版集成测试） |
| `model-config-integration` | 5 | Redux 集成场景（原集成测试已随 Redux 删除） |
| `chat-flow-integration` | 1 | 同上 |
| `remote-model-fetch` | 10 | 双环境 fetch 获取供应商数据场景 |
| `progressive-loading` | 1 | 懒加载中的 Tauri 引用 |
| `auto-resize-textarea` | 3 | React hooks 场景 |
| `shadcn-pagination` | 2 | React shadcn 组件场景 |
| `docs-structure` | 1 | 文档结构中的 Tauri 条目 |
| `独立聊天服务层` | 4 | 聊天服务层的 Tauri 兼容引用 |
| `storage-tests` | 12 | 双环境存储测试场景 |

## 清理建议

1. 逐规格移除 Tauri 环境场景（`#### Scenario: Tauri 环境…` 等），保留纯 Web 语义；涉及 REMOVED 需求的按 OpenSpec delta 规范出具 REMOVED 条目。
2. `tauri-compat-*`、`shell-mutation-coverage` 等以 Tauri 为存在前提的规格，评估整体废弃而非改写。
3. 测试约定类规格中的 mock 工厂名（`__createTauriCompatModuleMock` 等）需与现行 `src/__test__/setup/mocks.ts` 实际形态对齐。
4. 建议清理变更命名为 `spec-cleanup-post-vue3-web-migration`，与本变更归档衔接。
