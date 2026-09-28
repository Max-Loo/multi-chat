# Spec Delta

## REMOVED Requirements

### Requirement: tauriCompat 测试仅验证项目自有逻辑

**Reason**: 该要求针对 `src/utils/tauriCompat/` 兼容层测试文件（http.test.ts、os.test.ts、shell.test.ts、store.test.ts）的测试质量约束。前序平台层收敛已将该目录整体更名为 `src/platform/` 并移除全部 Tauri 分支，tauriCompat 测试文件不复存在，本能力失去约束对象；「不写同义反复断言、仅验证项目自有逻辑」的质量约束由 `behavior-driven-testing` 等既有测试能力继续覆盖，且随本变更迁移后的 `src/platform/` 测试沿用同一约定。

**Migration**: 无需迁移。平台层测试已随目录更名迁移至 `@/platform` 路径并沿用既有测试约定；本变更同时清除测试基础设施中残留的 Tauri Mock（`src/__test__/helpers/mocks/` 中的 Tauri Mock 工厂）与 `stryker.config.json` 中指向 tauriCompat 路径的失效排除项。
