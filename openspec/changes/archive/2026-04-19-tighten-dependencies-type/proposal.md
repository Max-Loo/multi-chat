## Why

`InitStep.name` 已收窄为 `StepName` 联合类型，但 `dependencies` 字段仍为 `string[]`，拼写错误不会被编译器捕获。前一个变更（`dedupe-step-name-type`）已将 `dependencies` 的值从裸字符串改为 `STEP_NAMES.xxx` 常量引用，但接口层面的类型定义未收紧，这是遗留的类型安全缺口。

## What Changes

- 将 `InitStep.dependencies` 的类型从 `string[]` 收紧为 `StepName[]`

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `step-name-types`: `InitStep.dependencies` 的类型从 `string[]` 收紧为 `StepName[]`，使依赖声明获得编译期拼写检查

## Impact

- `src/services/initialization/types.ts`：`dependencies?: string[]` → `dependencies?: StepName[]`
- `src/__test__/services/lib/initialization/fixtures.ts`：`TestInitStep` 需同步放宽 `dependencies` 为 `string[]`，避免测试文件编译失败
- 无运行时行为变更，纯类型层面收紧
- 生产代码中所有 `dependencies` 值已替换为 `STEP_NAMES.xxx`（类型为 `StepName` 字面量），不会引入编译错误
- 测试代码通过 `TestInitStep` 使用任意字符串作为依赖名，需在类型层面单独处理
