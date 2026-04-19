## MODIFIED Requirements

### Requirement: StepName 联合类型定义
系统 SHALL 在 `src/config/initSteps.ts` 中定义 `as const` 对象 `STEP_NAMES`，包含全部 9 个步骤名作为键值对。`StepName` 联合类型 SHALL 从 `STEP_NAMES` 自动派生：`type StepName = (typeof STEP_NAMES)[keyof typeof STEP_NAMES]`。`src/services/initialization/types.ts` SHALL 从 `initSteps.ts` 导入 `StepName`，不再手动列举。

#### Scenario: 联合类型覆盖所有已注册步骤
- **WHEN** 开发者查看 `StepName` 类型定义
- **THEN** 该类型 SHALL 等价于 `STEP_NAMES` 对象所有值的联合类型，与 `initSteps` 数组中所有步骤的 `name` 值一一对应

#### Scenario: 新增步骤只需修改一处
- **WHEN** 开发者在 `STEP_NAMES` 对象中添加新步骤名条目
- **THEN** `StepName` 类型 SHALL 自动包含该新值，无需在 `types.ts` 中手动追加

### Requirement: 步骤名常量导出
系统 SHALL 在 `src/config/initSteps.ts` 中导出 `STEP_NAMES` 常量对象。所有步骤配置和错误匹配代码 SHALL 通过 `STEP_NAMES.xxx` 访问步骤名，不再使用独立的 `*_STEP_NAME` 常量。

#### Scenario: initSteps 配置引用 STEP_NAMES
- **WHEN** 开发者查看 `initSteps` 数组
- **THEN** 每个步骤的 `name` 字段 SHALL 引用 `STEP_NAMES.xxx` 而非独立的导出常量

#### Scenario: dependencies 引用 STEP_NAMES
- **WHEN** 开发者查看 `initSteps` 中带 `dependencies` 的步骤
- **THEN** `dependencies` 数组 SHALL 使用 `STEP_NAMES.xxx` 引用而非裸字符串字面量

#### Scenario: FatalErrorScreen 使用 STEP_NAMES 比较
- **WHEN** 开发者查看 `FatalErrorScreen` 中的错误步骤名比较
- **THEN** 该比较 SHALL 使用 `STEP_NAMES.masterKey` 而非 `MASTER_KEY_STEP_NAME`
