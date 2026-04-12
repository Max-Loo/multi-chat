## Why

`src/lib/` 和 `src/services/` 的职责边界模糊：`lib/` 中包含了 `i18n.ts`（服务层初始化）、initialization（编排服务）、global.ts（有状态工具）等不符合 "lib = 纯工具库" 语义的模块。唯一的纯工具 `cn()` 已在 `src/utils/` 的同类型文件中出现。合并后目录结构更清晰，`src/utils/` 专注纯工具函数，`src/services/` 统一承载业务服务和基础设施。

## What Changes

- 将 `lib/utils.ts` 中的 `cn()` 合入 `src/utils/utils.ts`，删除 `lib/utils.ts`
- 将 `lib/global.ts` 移至 `src/services/global.ts`
- 将 `lib/i18n.ts` 移至 `src/services/i18n.ts`
- 将 `lib/toast/` 移至 `src/services/toast/`
- 将 `lib/initialization/` 移至 `src/services/initialization/`
- 更新所有受影响文件的 import 路径（`@/lib/xxx` → `@/services/xxx`）
- 删除 `src/lib/` 目录

## Capabilities

### New Capabilities
- `merge-lib-into-services`：lib 目录合并为 services 目录，统一服务层入口

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- **导入路径**：所有引用 `@/lib/i18n`、`@/lib/global`、`@/lib/toast`、`@/lib/initialization`、`@/lib/utils` 的文件都需要更新
  - `@/lib/i18n` → `@/services/i18n`
  - `@/lib/global` → `@/services/global`
  - `@/lib/toast` → `@/services/toast`
  - `@/lib/initialization` → `@/services/initialization`
  - `@/lib/utils` → `@/utils/utils`
- **测试文件**：`__test__` 目录中的测试文件也需要更新导入路径
- **设计文档**：`docs/design/` 中的文档索引（i18n-system、initialization）需要更新文件路径
- **API 和功能**：无外部 API 变更，纯内部重构
