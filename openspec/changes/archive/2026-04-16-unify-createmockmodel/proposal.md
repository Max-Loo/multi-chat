## Why

项目中存在 3 个独立的 `createMockModel` 定义（`helpers/fixtures/model.ts`、`fixtures/models.ts`、`helpers/mocks/testState.ts`），外加 2 个局部定义（`useExistingModels.test.tsx`、`useBasicModelTable.test.tsx`）。其中 `fixtures/models.ts` 是 `helpers/fixtures/model.ts` 的完整复制粘贴，`testState.ts` 的版本使用硬编码 ID 且默认值不同。这种碎片化导致维护成本高、行为不一致风险大，是测试基础设施重构中亟待消除的 DRY 违反。

## What Changes

- 删除 `fixtures/models.ts`（复制粘贴文件），4 个消费者改为从 `helpers/fixtures/model` 导入
- 从 `helpers/mocks/testState.ts` 移除 `createMockModel`，改为从 `helpers/fixtures/model` 导入并复用
- 重构 `useExistingModels.test.tsx` 和 `useBasicModelTable.test.tsx` 中的局部 `createMockModel`，改用统一的 `Partial<Model>` overrides 模式
- 为 `helpers/fixtures/model.ts` 中的 `createMockModel` 补充 `remark` 默认字段，统一三处实现的默认值覆盖范围
- 更新 `helpers/mocks/index.ts` 的重导出，确保 `createMockModel` 只从 fixtures 路径导出

## Capabilities

### New Capabilities

（无新能力引入）

### Modified Capabilities

- `test-factory-utilization`: 统一 `createMockModel` 的单一来源，消除三重定义和局部定义，所有测试文件从统一路径导入

## Impact

- **受影响文件**：12 个消费者测试文件的 import 路径需要更新
- **删除文件**：`src/__test__/fixtures/models.ts`
- **修改文件**：`src/__test__/helpers/mocks/testState.ts`（移除 `createMockModel`，改为 import）、`src/__test__/helpers/mocks/index.ts`（更新重导出来源为 fixtures）、`src/__test__/helpers/fixtures/model.ts`（补充 `remark` 默认值）、`src/__test__/components/ModelConfigForm.test.tsx`（import 路径改为 fixtures）
- **破坏性**：无。仅修改测试代码，不影响生产代码
