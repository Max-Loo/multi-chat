## Why

`src/utils/utils.ts` 行覆盖率 54.5%、分支覆盖率 0%，拖累 `src/utils/` 模块整体表现。根因是两个未测试导出：`getStandardRole` 是零调用者的死代码，`cn` 是第三方库（clsx + tailwind-merge）的一行薄包装。补测试无法带来实质质量收益，应通过删除死代码和排除不可测项来解决。

## What Changes

- 删除 `getStandardRole` 函数（`src/utils/utils.ts` 行 33-48）：全仓库零调用者，属于死代码
- 将 `cn` 函数加入覆盖率排除列表：不含业务逻辑，测试等于测试第三方库
- 将 `highlightLanguageIndex.ts` 加入覆盖率排除列表：纯动态 import 映射（46 个 switch case），已被 `highlightLanguageManager.test.ts` 完整 mock

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `coverage-threshold-policy`：扩展「不可测代码排除」要求，新增 `cn` 和 `highlightLanguageIndex` 两个排除项

## Impact

- **代码变更**：`src/utils/utils.ts` 删除 `getStandardRole` 函数（含 `ChatRoleEnum` 导入）
- **配置变更**：`vite.config.ts` 的 `coverage.exclude` 新增 2 项
- **覆盖率影响**：`src/utils/` 模块行覆盖率预计从 ~86% 提升到 ~100%（排除 cn 后）
- **无破坏性变更**：`getStandardRole` 无调用者，删除不影响任何功能
