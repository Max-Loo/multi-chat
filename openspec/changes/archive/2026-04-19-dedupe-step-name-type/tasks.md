## 1. initSteps.ts 常量合并

- [x] 1.1 在 `src/config/initSteps.ts` 中创建 `STEP_NAMES` as const 对象，包含全部 9 个步骤名，并导出 `StepName` 类型
- [x] 1.2 删除 `initSteps.ts` 中 9 个独立的 `*_STEP_NAME` 常量导出
- [x] 1.3 将 `initSteps` 数组中所有 `name: *_STEP_NAME` 替换为 `name: STEP_NAMES.xxx`
- [x] 1.4 将 `dependencies` 字段中的裸字符串替换为 `STEP_NAMES.xxx` 引用

## 2. types.ts 导入更新

- [x] 2.1 删除 `src/services/initialization/types.ts` 中的 `StepName` 手动定义
- [x] 2.2 在 `types.ts` 中从 `@/config/initSteps` 导入 `StepName` 类型

## 3. 外部引用更新

- [x] 3.1 更新 `src/components/FatalErrorScreen/index.tsx`：将 `MASTER_KEY_STEP_NAME` 导入替换为 `STEP_NAMES`，比较改为 `STEP_NAMES.masterKey`
- [x] 3.2 更新 `src/services/initialization/index.ts`（无需变更，未重导出 `StepName`）

## 4. 验证

- [x] 4.1 运行 `pnpm tsc` 确认无类型错误
- [x] 4.2 运行 `pnpm lint` 确认无 lint 错误
