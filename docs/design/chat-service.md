# 聊天服务层架构

本文档说明聊天服务层的模块化架构，包括流式响应处理、元数据收集和错误处理机制。

## 动机

为了统一处理不同 AI 供应商的请求，我们设计了一个模块化的聊天服务层：
- **供应商统一**：屏蔽不同供应商 API 的差异
- **流式响应**：支持实时流式输出，提升用户体验
- **元数据收集**：自动收集模型信息、token 使用量等
- **错误处理**：统一的错误处理和降级策略

## 架构

### 模块化设计

聊天服务层由 8 个核心模块组成：

```
index.ts (统一入口)
    ↓
providerFactory.ts (异步获取供应商)
    ↓
providerLoader.ts (SDK 按需加载)
    ↓
messageTransformer.ts (消息转换)
    ↓
streamText() (发起流式请求)
    ↓
streamProcessor.ts (流式响应处理)
    ↓
metadataCollector.ts (元数据收集)
    ↓
titleGenerator.ts (标题生成)
```

### 数据流

```
用户输入
    ↓
标准化消息格式 (messageTransformer)
    ↓
选择供应商 (providerFactory + providerLoader)
    ↓
发起流式请求 (streamText)
    ↓
处理流式事件 (streamProcessor)
    ↓
收集元数据 (metadataCollector)
    ↓
生成聊天标题 (titleGenerator)
    ↓
返回给用户界面
```

## 关键模块

### 1. index.ts（统一入口）

**位置**：`src/services/chat/index.ts`

**核心函数**：
```typescript
async function* streamChatCompletion(
  params: ChatRequestParams,
  options: { signal?: AbortSignal; dependencies?: AISDKDependencies }
): AsyncIterable<StandardMessage>
```

**职责**：
- 提供统一的聊天请求接口
- 使用 Vercel AI SDK 与供应商通信
- 支持 AbortSignal 中断请求
- 支持依赖注入（便于测试）

### 2. providerFactory.ts（供应商工厂）

**位置**：`src/services/chat/providerFactory.ts`

**核心函数**：
```typescript
async function getProvider(
  providerKey: string,
  apiKey: string,
  apiAddress: string
): Promise<ProviderFactory>
```

**职责**：
- 异步加载供应商 SDK（按需加载）
- 返回供应商特定的 provider 工厂函数
- 支持 mock provider（测试用）

### 3. providerLoader.ts（SDK 加载器）

**位置**：`src/services/chat/providerLoader.ts`

**职责**：
- 使用 ResourceLoader 按需加载供应商 SDK
- 缓存已加载的 SDK
- 预加载常用 SDK

**支持的平台**：
- deepseek
- moonshotai
- zhipuai

### 4. messageTransformer.ts（消息转换）

**位置**：`src/services/chat/messageTransformer.ts`

**核心函数**：
```typescript
function buildMessages(
  historyList: StandardMessage[],
  message: string,
  transmitHistoryReasoning: boolean
): CoreMessage[]
```

**职责**：
- 将应用消息格式转换为 AI SDK 格式
- 处理推理内容的包含/排除
- 确保消息格式符合供应商要求

### 5. streamProcessor.ts（流式处理器）

**位置**：`src/services/chat/streamProcessor.ts`

**核心函数**：
```typescript
async function* processStreamEvents(
  result: StreamTextResult,
  options: ProcessStreamOptions
): AsyncIterable<StandardMessage>
```

**职责**：
- 处理 AI SDK 的流式响应
- 节流控制（默认 50ms）
- 收集流式内容和元数据
- 错误处理和降级

### 6. metadataCollector.ts（元数据收集器）

**位置**：`src/services/chat/metadataCollector.ts`

**职责**：
- 从流式响应中提取元数据
- 收集 token 使用量
- 收集模型信息
- 处理元数据收集失败的降级

**降级策略**：
- 元数据收集失败时，保留已流式传输的内容
- 返回基本消息（raw: null）

### 7. titleGenerator.ts（标题生成）

**位置**：`src/services/chat/titleGenerator.ts`

**核心函数**：
```typescript
async function generateChatTitleService(
  conversationId: string,
  firstMessage: string,
  model: Model
): Promise<string>
```

**职责**：
- 基于首条消息生成聊天标题
- 使用流式响应快速生成
- 处理生成失败的情况

### 8. types.ts（类型定义）

**位置**：`src/services/chat/types.ts`

**关键类型**：
- `ChatRequestParams`: 聊天请求参数
- `AISDKDependencies`: AI SDK 依赖注入
- `ProcessStreamOptions`: 流式处理选项
- `MetadataCollectionError`: 元数据收集错误

## 错误处理

### 三级错误处理

| 错误类型 | 处理方式 | 示例 |
|---------|---------|------|
| **网络错误** | 显示 Toast，允许重试 | 超时、连接失败 |
| **供应商错误** | 显示错误消息，终止对话 | API 密钥无效、配额用尽 |
| **元数据错误** | 降级处理，保留内容 | 元数据解析失败 |

### MetadataCollectionError

```typescript
class MetadataCollectionError extends Error {
  constructor(message: string, public partialMetadata?: any) {
    super(message);
    this.name = "MetadataCollectionError";
  }
}
```

## 消息 ID 生成规则

- 如果提供了 `conversationId`：使用 `conversationId` 作为消息 ID
- 如果未提供：使用 `generateId()` 自动生成
- 确保流式响应的所有消息共享同一个 ID

## 实现位置

- **统一入口**：`src/services/chat/index.ts`
- **供应商工厂**：`src/services/chat/providerFactory.ts`
- **SDK 加载器**：`src/services/chat/providerLoader.ts`
- **消息转换**：`src/services/chat/messageTransformer.ts`
- **流式处理**：`src/services/chat/streamProcessor.ts`
- **元数据收集**：`src/services/chat/metadataCollector.ts`
- **标题生成**：`src/services/chat/titleGenerator.ts`
- **类型定义**：`src/services/chat/types.ts`

## 使用示例

### 基本使用

```typescript
import { streamChatCompletion } from '@/services/chat';

const response = streamChatCompletion(
  {
    model,
    historyList,
    message: 'Hello, AI!',
  },
  { signal }
);

for await (const msg of response) {
  console.log(msg.content); // 流式输出
}
```

### 带推理内容

```typescript
const response = streamChatCompletion(
  {
    model,
    historyList,
    message: 'Explain quantum physics',
    transmitHistoryReasoning: true, // 包含历史推理内容
  },
  { signal }
);
```

### 测试中使用（依赖注入）

```typescript
const response = streamChatCompletion(
  { model, historyList, message },
  {
    signal,
    dependencies: {
      streamText: mockStreamText,
      generateId: mockGenerateId,
    },
  }
);
```

## 设计原则

1. **模块化**：每个模块职责单一，易于测试和维护
2. **按需加载**：供应商 SDK 仅在需要时加载
3. **流式优先**：优先支持流式响应，提升用户体验
4. **错误隔离**：元数据错误不影响内容传输
5. **可测试性**：支持依赖注入，便于单元测试

## 注意事项

1. **AbortSignal 使用**：组件卸载时务必取消请求
2. **元数据降级**：元数据收集失败时不应中断内容传输
3. **供应商限制**：注意不同供应商的消息格式差异
4. **token 使用量**：监控 token 使用，避免超限
