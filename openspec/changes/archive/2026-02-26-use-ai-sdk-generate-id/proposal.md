## Why

统一使用 Vercel AI SDK 的工具函数，减少自定义工具函数和外部依赖的维护成本。项目已经依赖 `ai` 包，使用其内置的 `generateId` 和 `createIdGenerator` 可以：
- 保持代码一致性
- 避免重复实现相同的功能
- 移除 `uuid` 包依赖，减少 bundle 大小
- 统一 ID 生成逻辑，便于后续维护

## What Changes

- **移除自定义 generateId 函数**: 删除 `src/services/chatService.ts` 中的 `generateId()` 函数（line 17-19），改用 `import { generateId } from 'ai'`
- **替换 uuid.v4() 的使用**: 将以下文件中的 `uuid.v4()` 替换为 `ai.generateId`:
  - `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx` (line 38): 生成新聊天 ID
  - `src/pages/Model/components/ModelConfigForm.tsx` (line 115): 生成新模型 ID
  - `src/store/slices/chatSlices.ts` (line 83): 生成用户消息 ID（使用 `createIdGenerator` 处理前缀）
- **替换测试代码中的 ID 生成**: 更新 `src/__test__/helpers/fixtures/model.ts` 中的 `generateId()` 函数，使用 `import { createIdGenerator } from 'ai'` 生成带前缀的测试 ID
- **移除 uuid 包依赖**: 删除 `uuid` 包的导入语句
- **更新导入语句**: 在相关文件中添加正确的 `ai` 包导入

## Capabilities

### New Capabilities
无新增功能。

### Modified Capabilities
无功能需求变更。此变更仅涉及内部实现细节的优化，不改变任何对外行为或需求规范。

## Impact

**受影响的文件**:
- `src/services/chatService.ts`: 移除自定义 generateId 函数，改用 ai.generateId
- `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx`: 移除 uuid.v4()，使用 ai.generateId
- `src/pages/Model/components/ModelConfigForm.tsx`: 移除 uuid.v4()，使用 ai.generateId
- `src/store/slices/chatSlices.ts`: 移除 uuid.v4()，使用 createIdGenerator 处理带前缀的 ID
- `src/__test__/helpers/fixtures/model.ts`: 使用 createIdGenerator 生成测试 ID

**依赖**:
- 无新增依赖（`ai` 包已存在）
- 移除 `uuid` 包依赖（`pnpm remove uuid`）

**测试**:
- 需要验证 chatService 的 ID 生成功能正常工作
- 需要验证测试辅助函数生成的 ID 格式正确
- 需要验证聊天创建、模型配置等功能的 ID 生成正常
