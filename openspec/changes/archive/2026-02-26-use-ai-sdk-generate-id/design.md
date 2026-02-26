## Context

当前项目中存在多种 ID 生成方式：
1. `crypto.randomUUID()` - 在 `chatService.ts` 中使用
2. `uuid.v4()` - 在 3 个组件/文件中使用（ToolsBar、ModelConfigForm、chatSlices）
3. 自定义带前缀的 ID 生成 - 在测试辅助代码中使用

这种不一致性增加了维护成本，并且 `uuid` 包增加了 bundle 大小。项目已经依赖 Vercel AI SDK (`ai` 包)，该包提供了内置的 `generateId` 和 `createIdGenerator` 工具函数。

## Goals / Non-Goals

**Goals:**
- 统一全项目的 ID 生成逻辑，使用 Vercel AI SDK 的工具函数
- 移除 `uuid` 包依赖，减少 bundle 大小
- 保持现有功能不变，确保 ID 格式兼容性
- 优化带前缀 ID 的生成方式（如用户消息 ID）

**Non-Goals:**
- 不改变 ID 的语义或用途
- 不修改现有的 ID 验证或比较逻辑
- 不影响现有的数据结构或存储格式

## Decisions

### 1. 使用 `ai.generateId` 替代 `crypto.randomUUID()` 和 `uuid.v4()`

**选择**: 使用 `import { generateId } from 'ai'`

**理由**:
- 项目已依赖 `ai` 包，无需新增依赖
- `ai.generateId` 生成与 Vercel AI SDK 兼容的 ID 格式
- API 简单，直接调用即可，无需配置
- 与 AI SDK 的其他功能保持一致性

**替代方案**:
- 继续使用 `crypto.randomUUID()`: 原生 API，性能好，但需要自定义封装
- 使用 `nanoid`: 更小的 bundle，但需要新增依赖
- **结论**: `ai.generateId` 是最佳选择，因为项目已依赖 `ai` 包

### 2. 使用 `createIdGenerator` 处理带前缀的 ID

**选择**: 使用 `import { createIdGenerator } from 'ai'` 生成带前缀的 ID

**理由**:
- 在 `chatSlices.ts` 中，用户消息 ID 需要添加 `USER_MESSAGE_ID_PREFIX` 前缀
- 在测试代码中，需要生成 `test-model-{n}` 格式的 ID
- `createIdGenerator` 提供了统一的前缀处理方式
- 避免手动字符串拼接，减少错误风险

**实现示例**:
```typescript
// chatSlices.ts
import { createIdGenerator } from 'ai';

const generateUserMessageId = createIdGenerator({ prefix: USER_MESSAGE_ID_PREFIX });
const userId = generateUserMessageId(); // 生成带前缀的 ID
```

### 3. 一次性替换所有 ID 生成逻辑

**选择**: 在单个 PR 中完成所有替换

**理由**:
- 变更范围明确，影响文件有限（5 个文件）
- 降低迁移复杂度，避免混合使用
- 可以一次性验证所有功能的正确性

**替代方案**:
- 渐进式迁移: 增加维护成本，可能导致不一致
- **结论**: 一次性替换更合适

## Risks / Trade-offs

### 风险 1: ID 格式不兼容
**描述**: `ai.generateId` 生成的 ID 格式可能与 `uuid.v4()` 或 `crypto.randomUUID()` 不同

**缓解措施**:
- ID 在项目中仅用作唯一标识符，不依赖特定格式
- 现有代码没有对 ID 格式的验证或解析逻辑
- 测试覆盖所有 ID 生成场景

### 风险 2: 测试 ID 生成逻辑变化
**描述**: 测试辅助函数从计数器改为随机 ID 可能影响测试可预测性

**缓解措施**:
- 使用 `createIdGenerator` 保持前缀格式
- 如果测试需要确定性 ID，可以在测试中单独保留计数器逻辑
- 验证所有测试通过

### 风险 3: 依赖移除导致的问题
**描述**: 移除 `uuid` 包可能影响其他未检测到的使用

**缓解措施**:
- 使用 `pnpm why uuid` 检查依赖关系
- 运行完整的测试套件
- 如果发现问题，可以回滚变更

## Migration Plan

### 步骤

1. **代码替换** (按顺序执行):
   - 在所有需要修改的文件中添加 `import { generateId } from 'ai'` 或 `import { createIdGenerator } from 'ai'`
   - 替换 `src/services/chatService.ts` 中的 `generateId()` 函数
   - 替换 `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx` 中的 `uuidv4()`
   - 替换 `src/pages/Model/components/ModelConfigForm.tsx` 中的 `uuidv4()`
   - 替换 `src/store/slices/chatSlices.ts` 中的 `uuidv4()`（使用 `createIdGenerator` 处理前缀）
   - 替换 `src/__test__/helpers/fixtures/model.ts` 中的自定义 `generateId()`

2. **移除依赖**:
   ```bash
   pnpm remove uuid
   ```

3. **验证**:
   - 运行 `pnpm tsc` 验证类型检查
   - 运行 `pnpm lint` 验证代码规范
   - 运行 `pnpm test` 验证测试通过
   - 手动测试聊天创建、模型配置等功能

4. **清理**:
   - 检查是否有其他未使用的导入
   - 更新相关文档（如有必要）

### 回滚策略

如果出现问题：
- 使用 `git revert` 回滚变更
- 重新安装 `uuid` 包: `pnpm add uuid`
- 恢复所有导入语句和函数调用

## Open Questions

无（这是一个简单且明确的实现优化）
