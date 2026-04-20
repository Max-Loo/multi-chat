## 1. 统一权威定义

- [x] 1.1 为 `helpers/fixtures/model.ts` 中的 `createMockModel` 添加 `remark: ''` 默认字段
- [x] 1.2 验证 `helpers/fixtures/model.ts` 中所有工厂函数（`createMockModels`、`createDeepSeekModel` 等）的测试通过

## 2. 删除复制粘贴文件

- [x] 2.1 将 `fixtures/models.ts` 的 4 个消费者 import 路径改为 `@/__test__/helpers/fixtures/model`
  - `store/storage/modelStorage.test.ts`
  - `store/slices/modelSlice.test.ts`
  - `store/slices/chatSlices.test.ts`
  - `integration/app-loading.integration.test.ts`
- [x] 2.2 删除 `src/__test__/fixtures/models.ts`
- [x] 2.3 运行这 4 个测试文件确认全部通过

## 3. 迁移 testState.ts

- [x] 3.1 在 `helpers/mocks/testState.ts` 中删除 `createMockModel` 定义，改为从 `@/__test__/helpers/fixtures/model` 导入
- [x] 3.2 更新 `createModelSliceState` 等依赖 `createMockModel` 的函数，确认默认值行为正确
- [x] 3.3 更新 `helpers/mocks/index.ts` 中 `createMockModel` 的重导出来源，改为从 `@/__test__/helpers/fixtures/model` 导入
- [x] 3.4 将 `ModelConfigForm.test.tsx` 的 `import { createMockModel } from '@/__test__/helpers/mocks/testState'` 改为 `import { createMockModel } from '@/__test__/helpers/fixtures/model'`
- [x] 3.5 验证 `ModelConfigForm.test.tsx` 和 `DetailTitle.test.tsx` 测试通过

## 4. 消除局部定义

- [x] 4.1 重构 `useExistingModels.test.tsx`：删除局部 `createMockModel`，改用从 fixtures 导入 + overrides 模式
- [x] 4.2 重构 `useBasicModelTable.test.tsx`：删除局部 `createMockModel`，改用从 fixtures 导入 + overrides 模式
- [x] 4.3 验证这两个测试文件全部通过

## 5. 全局验证

- [x] 5.1 运行 `pnpm test` 确认全部测试通过
- [x] 5.2 运行 `pnpm lint` 确认无 lint 错误
- [x] 5.3 全局搜索确认不存在重复的 `createMockModel` 定义
