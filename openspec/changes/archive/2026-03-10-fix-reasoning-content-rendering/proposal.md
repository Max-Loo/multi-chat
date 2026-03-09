# 修复推理内容渲染问题并重命名参数

## Why

当前存在一个语义混淆的 bug：`includeReasoningContent` 参数被错误地用于两个不同的场景。在 `streamProcessor.ts:72` 中，该参数被用于控制是否**保存**推理内容，导致当用户关闭此设置时，即使 API 返回了 `reasoning-delta` 事件，推理内容也不会被保存到 Redux store，从而无法在 UI 中显示。参数的实际含义应该是"在发送新消息时，是否将历史消息中的推理内容也传输给 AI"，与"保存当前对话的推理内容"是完全独立的两个概念。

## What Changes

- **修复条件判断错误**：移除 `streamProcessor.ts:72` 中 `if (includeReasoningContent)` 的条件判断，无条件保存 `reasoning-delta` 事件
- **完全重命名参数**：将所有 `includeReasoningContent` 相关内容重命名为 `transmitHistoryReasoning`
  - 服务层参数名
  - Redux state 字段名
  - Redux 相关函数名（`initializeIncludeReasoningContent` → `initializeTransmitHistoryReasoning`）
  - Redux 选择器和 action（`selectIncludeReasoningContent` → `selectTransmitHistoryReasoning`）
  - 国际化配置键名（`includeReasoningContent` → `transmitHistoryReasoning`）
- **更新所有引用**：同步修改类型定义、服务函数、Redux 层代码、UI 组件、国际化文件
- **更新测试用例**：修复依赖旧参数名的测试，特别是 `streamProcessor.integration.test.ts:229` 的错误测试用例
- **无数据迁移**：localStorage key 直接重命名，用户重新设置即可（非关键配置）

## Capabilities

### New Capabilities
无

### Modified Capabilities
- **reasoning-content-rendering**: 修改推理内容的渲染和保存逻辑
  - **当前行为**：`includeReasoningContent` 参数同时控制"传输历史推理"和"保存当前推理"
  - **新行为**：`transmitHistoryReasoning` 仅控制"传输历史推理"，当前推理内容无条件保存
  - **影响范围**：流式消息处理、Redux store、UI 渲染

## Impact

### 受影响的代码模块
- **服务层**（3个文件）：
  - `src/services/chat/streamProcessor.ts` - 移除条件判断
  - `src/services/chat/types.ts` - 重命名参数，移除 `ProcessStreamOptions.includeReasoningContent`
  - `src/services/chat/index.ts` - 更新参数传递
  - `src/services/chat/messageTransformer.ts` - 重命名函数参数

- **Redux 层**（3个文件）：
  - `src/store/slices/chatSlices.ts` - 更新变量名
  - `src/store/middleware/appConfigMiddleware.ts` - 更新注释和变量名
  - `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx` - 更新选择器和变量名

- **测试文件**（4个文件）：
  - `src/__test__/services/chat/streamProcessor.integration.test.ts` - 移除/更新测试用例
  - `src/__test__/services/chat/index.integration.test.ts` - 更新参数名
  - `src/__test__/integration/chat-flow.integration.test.ts` - 更新注释
  - `src/__test__/components/ChatPanelSender.test.tsx` - 更新 mock state

- **配置文件**（1个文件）：
  - `src/config/initSteps.ts` - 更新注释

### API 变更
- **Breaking**: `ChatRequestParams.includeReasoningContent` → `ChatRequestParams.transmitHistoryReasoning`
- **Breaking**: `ProcessStreamOptions.includeReasoningContent` 字段移除
- **兼容性**: Redux state 和 localStorage key 保持不变

### 依赖项变更
无外部依赖变更

### 系统影响
- **用户体验**：修复后，无论设置如何，推理内容都会被保存和显示
- **Token 消耗**：关闭 `transmitHistoryReasoning` 时，仍能节省 token（不发送历史推理），但当前推理仍会保存
