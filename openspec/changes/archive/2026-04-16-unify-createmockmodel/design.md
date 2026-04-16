## Context

当前项目中 `createMockModel` 存在于 3 个独立文件中，另有 2 个测试文件内建局部版本：

| 定义位置 | ID 策略 | 默认值风格 | 消费者数量 |
|---|---|---|---|
| `helpers/fixtures/model.ts` | `createIdGenerator` 动态唯一 | 真实值（OpenAI/gpt-4） | 4 |
| `fixtures/models.ts` | `createIdGenerator` 动态唯一 | 与上一行完全相同（复制粘贴） | 4 |
| `helpers/mocks/testState.ts` | 硬编码 `'test-model-1'` | 通用测试值 | 2 |
| `useExistingModels.test.tsx`（局部） | 位置参数 `id` | 精简字段 | — |
| `useBasicModelTable.test.tsx`（局部） | 位置参数 `id, nickname, providerKey` | 精简字段 | — |

权威定义应保留在 `helpers/fixtures/model.ts`，因为它使用动态唯一 ID、与 `createMockModels`/`createDeepSeekModel` 等配套工厂函数共存、且已有最多的配套函数。

## Goals / Non-Goals

**Goals:**

- 消除 `createMockModel` 的三重定义，统一为单一权威来源
- 删除复制粘贴文件 `fixtures/models.ts`
- 将所有消费者迁移到 `helpers/fixtures/model` 导入路径
- 统一两个局部定义为 `Partial<Model>` overrides 模式

**Non-Goals:**

- 不重构 `testState.ts` 中的其他工厂函数（`createModelSliceState` 等），它们可继续从 fixtures 导入 `createMockModel`
- 不引入 Zod 验证（属于 `test-factory-utilization` spec 的更大范围）
- 不创建新的变体工厂函数（如 `createDisabledModel` 等）

## Decisions

### 决策 1：保留 `helpers/fixtures/model.ts` 作为唯一定义

**理由**：该文件已包含 `createMockModels`、`createDeepSeekModel`、`createKimiModel`、`createEncryptedModel` 等配套函数，是完整的 Model fixtures 集合中心。使用 `createIdGenerator` 生成唯一 ID 是正确做法。

**替代方案**：保留 `testState.ts` 中的版本 → 否决，因为硬编码 ID 在多模型场景下会产生冲突。

### 决策 2：从 `testState.ts` 移除 `createMockModel`，改为导入

**理由**：`testState.ts` 的职责是提供 Redux slice 状态工厂（`createModelSliceState` 等），不应重复定义 Model 实体工厂。`createModelSliceState` 可从 fixtures 导入 `createMockModel` 来构建默认 models 列表。

**迁移方式**：`testState.ts` 采用"仅 import，不 re-export"策略——`import { createMockModel } from '@/__test__/helpers/fixtures/model'`。直接从 `testState` 导入 `createMockModel` 的消费者（`ModelConfigForm.test.tsx`）需改为从 fixtures 路径导入，避免引入不必要的间接层。

**影响**：`testState.ts` 中 `createModelSliceState` 的默认值会从硬编码 `'test-model-1'` 变为动态唯一 ID，这是正面的行为变化。

### 决策 3：删除 `fixtures/models.ts`，不保留重导出

**理由**：该文件是 `helpers/fixtures/model.ts` 的完整复制粘贴，无任何独特内容。直接修改 import 路径比维护重导出更清晰。

**替代方案**：将 `fixtures/models.ts` 改为重导出文件 → 否决，增加不必要的间接层。

### 决策 4：局部定义迁移到 overrides 模式

**理由**：`useExistingModels.test.tsx`（`createMockModel(id, isDeleted?)`）和 `useBasicModelTable.test.tsx`（`createMockModel(id, nickname, providerKey)`）使用位置参数，不如 `Partial<Model>` overrides 灵活。迁移后与全局工厂签名一致。

**迁移方式**：

`useExistingModels.test.tsx`（`createMockModel(id, isDeleted?)`）：
- `createMockModel('model-1')` → `createMockModel({ id: 'model-1' })`
- `createMockModel('model-1', false)` → `createMockModel({ id: 'model-1', isDeleted: false })`
- `createMockModel('model-1', true)` → `createMockModel({ id: 'model-1', isDeleted: true })`

注：`isDeleted` 是 `Model` 类型的可选字段（`isDeleted?: boolean`，见 `src/types/model.ts:39`），因此 `Partial<Model>` overrides 天然支持此字段。

`useBasicModelTable.test.tsx`（`createMockModel(id, nickname, providerKey)`）：
- `createMockModel('model-1', 'GPT-4', ModelProviderKeyEnum.DEEPSEEK)` → `createMockModel({ id: 'model-1', nickname: 'GPT-4', providerKey: ModelProviderKeyEnum.DEEPSEEK })`
- `isDeleted: true` 的 spread 用法（第 114 行）改为 `createMockModel({ id: 'model-2', nickname: 'Claude', providerKey: ModelProviderKeyEnum.MOONSHOTAI, isDeleted: true })`，消除 `as Model` 类型转换

## Risks / Trade-offs

- **[风险] `testState.ts` 默认值行为变化** → 硬编码 ID `'test-model-1'` 变为动态 ID，依赖特定 ID 值的测试可能需要更新。缓解：搜索所有引用 `'test-model-1'` 的断言，逐一确认。
- **[风险] 局部定义迁移可能改变测试语义** → 位置参数到 overrides 的转换需逐个验证字段映射。缓解：每个文件迁移后运行测试确认通过。
- **[权衡] 批量修改 import 路径** → 12 个文件的 import 路径变更量较大，但机械操作、风险低。
