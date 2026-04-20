## ADDED Requirements

### Requirement: createMockModel 单一来源约束

系统 SHALL 仅在 `src/__test__/helpers/fixtures/model.ts` 中定义 `createMockModel` 函数，所有测试文件 SHALL 从该文件直接导入。

#### Scenario: 不存在重复的 createMockModel 定义

- **WHEN** 在项目中搜索 `export const createMockModel` 或 `function createMockModel`
- **THEN** 仅 `src/__test__/helpers/fixtures/model.ts` 中存在定义
- **AND** `src/__test__/fixtures/models.ts` 文件不存在
- **AND** `src/__test__/helpers/mocks/testState.ts` 中不包含 `createMockModel` 定义

#### Scenario: 所有消费者从统一路径导入

- **WHEN** 检查所有测试文件中 `createMockModel` 的 import 来源
- **THEN** 所有导入均指向 `@/__test__/helpers/fixtures/model` 或通过 `@/__test__/helpers/mocks` 重导出（后者内部从 fixtures 导入）

#### Scenario: 局部定义已消除

- **WHEN** 检查 `useExistingModels.test.tsx` 和 `useBasicModelTable.test.tsx`
- **THEN** 这两个文件不包含局部 `createMockModel` 定义
- **AND** 使用从 fixtures 导入的 `createMockModel` 配合 `Partial<Model>` overrides 参数

### Requirement: createMockModel 默认值完整性

`createMockModel` SHALL 为 `Model` 类型的所有必需字段提供合理的默认值，包括 `remark` 字段。

#### Scenario: remark 字段有默认值

- **WHEN** 调用 `createMockModel()` 不传入参数
- **THEN** 返回的对象包含 `remark` 字段，值为空字符串 `''`

#### Scenario: 通过 overrides 覆盖任意字段

- **WHEN** 调用 `createMockModel({ id: 'custom-id', modelName: 'custom' })`
- **THEN** 返回的对象 `id` 为 `'custom-id'`，`modelName` 为 `'custom'`，其余字段使用默认值

## MODIFIED Requirements

### Requirement: 必须激活并改进现有的测试 Fixtures

系统 SHALL 激活当前未使用的测试 Fixtures，并改进其类型定义和使用文档。

**当前未使用的 Fixtures**：
- `src/__test__/fixtures/modelProvider.ts` (114 行，包含 `createMockRemoteProvider` 等工厂函数)
- `src/__test__/helpers/fixtures/model.ts`（`createMockModel` 唯一来源）
- `src/__test__/fixtures/store.ts`
- `src/__test__/fixtures/chatPanel.ts`

**注意**：原列表中的 `src/__test__/fixtures/models.ts` 已被删除，其功能已合并到 `helpers/fixtures/model.ts`。

#### Scenario: 激活 model Fixtures

- **WHEN** 编写与 Model 相关的测试
- **THEN** 测试 SHALL 使用 `createMockModel` 等工厂函数（从 `@/__test__/helpers/fixtures/model` 导入）
- **AND** 测试 SHALL NOT 手动构造 Model 数据对象
- **AND** 测试 SHALL NOT 定义局部的 `createMockModel` 函数
- **AND** 工厂函数 SHALL 支持 `Partial<Model>` overrides 参数自定义数据
