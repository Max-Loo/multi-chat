## Why

当前模型服务商（DeepSeek、Kimi、Zhipu）不支持 Vercel AI SDK 的 `type: 'reasoning'` 消息格式，导致推理内容传输功能无效。为避免用户困惑，需要暂时隐藏推理内容开关 UI，待模型服务商支持后再恢复显示。

## What Changes

- **UI 隐藏**：在 `ChatPanelSender` 组件中隐藏推理内容开关（第 163-181 行）
- **保留逻辑**：保留 `includeReasoningContent` 状态管理和相关 Redux 逻辑
- **临时措施**：此为临时隐藏方案，不删除任何代码或功能

## Capabilities

### New Capabilities
无新功能引入。

### Modified Capabilities
无功能需求变更。仅 UI 层面的隐藏，不涉及功能规格调整。

## Impact

**受影响的代码**:
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx` (第 163-181 行)

**不受影响的部分**:
- Redux 状态管理 (`appConfigSlices`)
- 聊天服务层 (`chatService.ts`)
- 数据模型和类型定义

**用户体验**:
- 用户界面更简洁，避免无效功能的困扰
- 后续模型服务商支持推理内容后，可快速恢复显示
