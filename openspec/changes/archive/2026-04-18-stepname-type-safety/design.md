## Why

初始化步骤名称（`stepName`）在 `InitStep.name`、`InitError.stepName`、`initSteps.ts` 的 `onError` 回调和 `FatalErrorScreen` 的错误匹配中均使用原始 `string` 类型。这些字符串必须彼此保持一致，但缺乏编译期保障——拼写错误或遗漏更新只能在运行时被发现。目前仅 `MASTER_KEY_STEP_NAME` 有导出常量，其余 8 个步骤名均为硬编码字面量。

## What Changes

- 定义 `StepName` 联合类型，包含全部 9 个初始化步骤名称
- 将 `InitStep.name` 的类型从 `string` 改为 `StepName`
- 将 `InitError.stepName` 的类型从 `string | undefined` 改为 `StepName | undefined`
- 在 `initSteps.ts` 中为每个步骤名导出常量（`KEYRING_MIGRATION_STEP_NAME`、`I18N_STEP_NAME` 等），替换硬编码字面量
- `FatalErrorScreen` 中的 `error.stepName === 'masterKey'` 改用常量比较
- 测试辅助函数通过 `TestInitStep = Omit<InitStep, 'name'> & { name: string }` 保持灵活性

## Capabilities

### New Capabilities
- `step-name-types`: 初始化步骤名称的类型安全常量与联合类型定义

### Modified Capabilities
<!-- 无既有 spec 的行为变更，仅为类型强化 -->

## Impact

- **类型文件**：`src/services/initialization/types.ts` — `InitStep`、`InitError` 接口变更
- **配置文件**：`src/config/initSteps.ts` — 步骤名从字面量改为常量引用
- **UI 组件**：`src/components/FatalErrorScreen/index.tsx` — stepName 比较改用常量
- **测试辅助**：`src/__test__/services/lib/initialization/fixtures.ts` — 定义 `TestInitStep` 类型，使测试辅助函数不受 `StepName` 联合类型约束
- **无运行时行为变更**，仅编译期类型约束增强
