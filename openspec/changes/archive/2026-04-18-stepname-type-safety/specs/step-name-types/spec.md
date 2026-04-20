## ADDED Requirements

### Requirement: StepName 联合类型定义
系统 SHALL 在 `src/services/initialization/types.ts` 中定义 `StepName` 联合类型，包含全部 9 个步骤名：`'keyringMigration' | 'i18n' | 'masterKey' | 'models' | 'chatList' | 'appLanguage' | 'transmitHistoryReasoning' | 'autoNamingEnabled' | 'modelProvider'`。

#### Scenario: 联合类型覆盖所有已注册步骤
- **WHEN** 开发者查看 `StepName` 类型定义
- **THEN** 该类型 SHALL 包含 `initSteps` 数组中所有步骤的 `name` 值，不多不少

### Requirement: InitStep.name 类型约束
`InitStep` 接口的 `name` 字段 SHALL 使用 `StepName` 类型，而非 `string`。

#### Scenario: 步骤配置使用非法名称时编译失败
- **WHEN** 开发者在 `initSteps` 中定义新步骤，`name` 赋值为不在 `StepName` 联合中的字符串
- **THEN** TypeScript 编译器 SHALL 报告类型错误

### Requirement: InitError.stepName 类型约束
`InitError` 接口的 `stepName` 字段 SHALL 使用 `StepName | undefined` 类型，而非 `string | undefined`。

#### Scenario: 错误比较使用非法步骤名时编译失败
- **WHEN** 开发者编写 `error.stepName === 'typoStepName'` 且该字符串不在 `StepName` 联合中
- **THEN** TypeScript 编译器 SHALL 报告类型错误

### Requirement: 步骤名常量导出
系统 SHALL 在 `src/config/initSteps.ts` 中为每个步骤名导出命名常量（如 `KEYRING_MIGRATION_STEP_NAME`、`I18N_STEP_NAME`、`MASTER_KEY_STEP_NAME` 等），所有步骤配置和错误匹配代码 SHALL 引用这些常量而非内联字面量。

#### Scenario: initSteps 配置引用常量
- **WHEN** 开发者查看 `initSteps` 数组
- **THEN** 每个步骤的 `name` 字段 SHALL 引用对应的导出常量

#### Scenario: FatalErrorScreen 使用常量比较
- **WHEN** 开发者查看 `FatalErrorScreen` 中的 `error.stepName === MASTER_KEY_STEP_NAME` 比较
- **THEN** 该比较 SHALL 使用导入的常量而非硬编码字符串 `'masterKey'`
