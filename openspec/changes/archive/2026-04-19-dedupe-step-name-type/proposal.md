## Why

步骤名在 `initSteps.ts` 中以 9 个独立常量维护，在 `types.ts` 中又以 `StepName` 联合类型手动列举了相同的 9 个字符串值。新增步骤时必须同时修改两处，且无编译期保障同步，存在遗漏风险。

## What Changes

- 将 `initSteps.ts` 中的 9 个独立 `*_STEP_NAME` 常量合并为单个 `as const` 对象 `STEP_NAMES`
- 从 `STEP_NAMES` 对象自动派生 `StepName` 联合类型，替换 `types.ts` 中的手动列举
- 更新 `initSteps.ts` 中 `dependencies` 字段使用 `STEP_NAMES.xxx` 而非裸字符串
- 更新所有外部导入点，从 `STEP_NAMES.xxx` 读取常量值

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `step-name-types`: 步骤名的单一事实来源从「常量 + 手动联合类型双处维护」改为「`as const` 对象自动派生」，`StepName` 类型定义位置从 `types.ts` 移至 `initSteps.ts`。

## Impact

- `src/config/initSteps.ts`：删除 9 个独立常量，新增 `STEP_NAMES` 对象并导出 `StepName` 类型
- `src/services/initialization/types.ts`：删除 `StepName` 定义，改为从 `initSteps.ts` 导入
- 所有导入 `StepName` 或 `*_STEP_NAME` 常量的文件需更新导入路径
- 无运行时行为变更，纯类型层面重构
