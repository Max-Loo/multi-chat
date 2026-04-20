## 1. 类型定义

- [x] 1.1 在 `src/services/initialization/types.ts` 中定义 `StepName` 联合类型，包含全部 9 个步骤名
- [x] 1.2 将 `InitStep.name` 类型从 `string` 改为 `StepName`
- [x] 1.3 将 `InitError.stepName` 类型从 `string | undefined` 改为 `StepName | undefined`

## 2. 常量导出

- [x] 2.1 在 `src/config/initSteps.ts` 中为每个步骤名导出常量（`KEYRING_MIGRATION_STEP_NAME`、`I18N_STEP_NAME`、`MODELS_STEP_NAME`、`CHAT_LIST_STEP_NAME`、`APP_LANGUAGE_STEP_NAME`、`TRANSMIT_HISTORY_REASONING_STEP_NAME`、`AUTO_NAMING_ENABLED_STEP_NAME`、`MODEL_PROVIDER_STEP_NAME`），保留已有 `MASTER_KEY_STEP_NAME`
- [x] 2.2 将 `initSteps` 数组中所有步骤的 `name` 字段改为引用对应常量

## 3. 消费方更新

- [x] 3.1 在 `src/components/FatalErrorScreen/index.tsx` 中确认 `error.stepName` 比较已使用 `MASTER_KEY_STEP_NAME` 常量（如未使用则更新）
- [x] 3.2 在 `initSteps.ts` 的 `onError` 回调中使用步骤名常量替代硬编码字面量（注：当前 `onError` 回调未引用步骤名，确认后可跳过）

## 4. 测试适配

- [x] 4.1 在 `src/__test__/services/lib/initialization/fixtures.ts` 中定义测试用步骤类型 `TestInitStep = Omit<InitStep, 'name'> & { name: string }`，使测试辅助函数接受任意字符串作为步骤名
- [x] 4.2 将 `createMockInitStep`、`createSuccessfulStep`、`createFailingStep`、`createStepWithValue` 的参数和返回类型适配 `TestInitStep`，内部通过类型断言 `as InitStep` 兼容 `InitStep[]` 类型约束
- [x] 4.3 将 `createTestInitSteps` 的返回类型改为 `TestInitStep[]`，调用处按需使用 `as InitStep[]`

## 5. 验证

- [x] 5.1 运行 `pnpm tsc` 确认无类型错误（含测试文件）
- [x] 5.2 运行 `pnpm test` 确认所有测试通过
- [x] 5.3 运行 `pnpm lint` 确认无 lint 警告
