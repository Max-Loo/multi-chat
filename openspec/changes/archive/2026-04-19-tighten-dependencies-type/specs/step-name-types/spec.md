## ADDED Requirements

### Requirement: InitStep.dependencies 类型约束
`InitStep` 接口的 `dependencies` 字段 SHALL 使用 `StepName[]` 类型，而非 `string[]`。

#### Scenario: dependencies 使用非法步骤名时编译失败
- **WHEN** 开发者在 `initSteps` 中为某步骤的 `dependencies` 赋值包含不在 `StepName` 联合中的字符串
- **THEN** TypeScript 编译器 SHALL 报告类型错误

#### Scenario: dependencies 空数组或省略仍然合法
- **WHEN** 开发者定义一个无依赖的步骤，省略 `dependencies` 字段或赋值为空数组
- **THEN** TypeScript 编译器 SHALL 不报错
