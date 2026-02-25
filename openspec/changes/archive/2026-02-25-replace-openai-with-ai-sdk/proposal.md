# 提案：使用 ai-sdk 替换 openai 包

## Why

项目当前使用 `openai` 包（v6.9.0）处理所有 AI 聊天请求。虽然 OpenAI SDK 可以与兼容的供应商 API 通信，但 Vercel AI SDK（ai-sdk）提供了以下优势：

- **更统一的供应商抽象**：ai-sdk 设计为多供应商统一接口，简化了供应商切换和扩展
- **供应商特定的优化**：使用供应商官方的 ai-sdk provider 包（如 `@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`zhipu-ai-provider`）可以获得更好的性能和供应商特定功能支持
- **更简化的流式响应处理**：内置优化的流式响应处理，减少手动合并数据块的复杂性
- **更好的 React 集成**：提供 React hooks 和组件，简化前端集成
- **更好的工具调用支持**：原生支持 function calling，简化工具使用场景
- **更活跃的维护和更小的包体积**：ai-sdk 是 Vercel 官方维护的，针对现代应用优化

当前 `chatService.ts` 中手动处理流式响应块合并、token 使用情况解析等逻辑，这些在 ai-sdk 中已有更优雅的内置支持。

**架构决策**：针对不同的大模型供应商使用其对应的 ai-sdk provider 包，而不是统一使用 OpenAI SDK 的 baseURL 配置。这样可以：
- 获得供应商特定的性能优化
- 自动处理供应商之间的 API 差异
- 简化代码维护

## What Changes

- 移除 `package.json` 中的 `openai` 依赖（v6.9.0）
- 添加 `ai` 核心包和项目使用的供应商对应的 ai-sdk provider 包：
  - `@ai-sdk/deepseek` - 用于 DeepSeek 供应商
  - `@ai-sdk/moonshotai` (或 `moonshotai-ai-provider`) - 用于 Kimi (Moonshot AI) 供应商
  - `zhipu-ai-provider` (或 `@ai-sdk/zhipu`) - 用于 Zhipu (BigModel) 供应商
- 更新 `src/utils/enums.ts`：
  - 从 `ModelProviderKeyEnum` 枚举中移除 `OPEN_AI = 'openai'`
  - 保留 `DEEPSEEK`、`KIMI`、`BIG_MODEL` 三个枚举值
- 重构 `src/services/chatService.ts`：
  - 创建供应商客户端映射函数，根据 `providerKey` 返回对应的 ai-sdk provider 实例
  - 由于 apiKey 由用户填写，使用 `createXxx()` 形式的工厂函数
  - 使用供应商特定的导入，例如：
    ```typescript
    import { createDeepSeek } from '@ai-sdk/deepseek';
    import { createMoonshotAI } from '@ai-sdk/moonshotai';
    import { createZhipu } from 'zhipu-ai-provider';
    import { streamText } from 'ai';
    ```
  - 使用 ai-sdk 的 `streamText` 函数替代 OpenAI SDK 的 `chat.completions.create`
  - 简化流式响应处理逻辑（ai-sdk 自动处理数据块合并）
  - 保持 `StandardMessage` 返回格式不变（对上层透明）
- 更新相关的 TypeScript 类型定义以适配 ai-sdk 的类型
- 确保现有的开发环境代理逻辑继续工作（通过 ai-sdk 的 fetch 配置）

### 供应商客户端映射策略

**项目支持的三个供应商均使用官方 ai-sdk provider 包**：
- DeepSeek: 使用 `createDeepSeek({ apiKey })` 函数从 `@ai-sdk/deepseek`
- Kimi (Moonshot AI): 使用 `createMoonshotAI({ apiKey })` 函数从 `@ai-sdk/moonshotai`
- Zhipu (BigModel): 使用 `createZhipu({ apiKey })` 函数从 `zhipu-ai-provider`

**重要说明**：由于 apiKey 由用户在设置中填写，必须使用 `createXxx()` 工厂函数形式，而不是预配置的 `xxx()` 函数。

**示例代码结构**：
```typescript
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';
import { streamText } from 'ai';
import { ModelProviderKeyEnum } from '@/utils/enums';

function getProvider(providerKey: ModelProviderKeyEnum, apiKey: string, baseURL: string) {
  switch (providerKey) {
    case ModelProviderKeyEnum.DEEPSEEK:
      return createDeepSeek({ apiKey, baseURL });
    case ModelProviderKeyEnum.KIMI:
      return createMoonshotAI({ apiKey, baseURL });
    case ModelProviderKeyEnum.BIG_MODEL:
      return createZhipu({ apiKey, baseURL });
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}
```

**优势**：
- 每个供应商都有专门优化的 provider 实现
- 无需手动处理 URL 标准化（官方 provider 自动处理）
- 自动处理供应商之间的 API 差异
- 更好的类型安全和 IDE 支持
- 不依赖通用的 `@ai-sdk/openai` 包，减少不必要的依赖

## Capabilities

### New Capabilities
无新增能力。

### Modified Capabilities
- `chat-message-sending`: 实现层变更，但需求层面不变。
  - **变更说明**：`ChatService` 的内部实现从 OpenAI SDK 迁移到 ai-sdk，但对外 API（`streamChatCompletion` 函数签名和返回格式）保持不变。Redux Thunk 的调用方式无需修改。

## Impact

### 受影响的代码
- `src/utils/enums.ts` - 移除 `ModelProviderKeyEnum.OPEN_AI` 枚举值
- `src/services/chatService.ts` - 核心实现需要完全重写，使用供应商特定的 ai-sdk provider
- `src/services/urlNormalizer.ts` - 可能不再需要（所有供应商使用官方 provider，无需手动标准化 URL）
- `package.json` - 依赖变更（移除 `openai`，添加 `ai` 和相关 provider 包）
- `src/types/chat.ts` - 可能需要调整类型以适配 ai-sdk 的响应格式（但保持 `StandardMessage` 接口稳定）

### 受影响的依赖
- 移除：`openai@^6.9.0`
- 新增：`ai` (最新稳定版，Vercel AI SDK 核心包)
- 新增：`@ai-sdk/deepseek` (DeepSeek 官方 provider)
- 新增：`@ai-sdk/moonshotai` (Moonshot AI/Kimi 官方 provider)
- 新增：`zhipu-ai-provider` (Zhipu AI/BigModel 官方 provider)

### 受影响的系统
- 聊天消息发送系统（实现层变更，接口层稳定）
- Redux Thunk `sendMessage`（无需修改，继续调用 `ChatService.streamChatCompletion`）
- 所有依赖 `ChatService` 的上层组件（无影响）

### 兼容性
- **向后兼容**：对 Redux Thunk 和 UI 层完全透明，无需修改调用代码
- **数据兼容**：返回的 `StandardMessage` 格式保持不变，确保现有流式响应处理逻辑正常工作
