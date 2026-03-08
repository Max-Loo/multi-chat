# Design: chatService 模块化重构技术设计

## Context

### 当前状态

**文件结构**：
```
src/services/
├── chatService.ts (431 行)          ← 当前单文件实现
└── modelRemoteService.ts (420 行)

src/__test__/services/
└── chatService.test.ts (1791 行)    ← 单个测试文件
```

**职责分析**：
- Provider 工厂（22 行）：创建供应商实例
- 消息转换（55 行）：StandardMessage ↔ AI SDK 格式
- 流式聊天（216 行）：核心处理逻辑
  - 流式事件处理（25 行）
  - 元数据收集（114 行）⚠️ 过于复杂
  - 错误处理（大量 try-catch）
- 类型定义（60 行）
- 依赖注入支持（78 行）

**问题识别**：
1. **单一职责违反**：`streamChatCompletion()` 承担 5+ 个职责
2. **高耦合**：元数据收集逻辑嵌入在流式处理中
3. **难以测试**：1791 行测试主要依赖集成测试
4. **难以扩展**：添加新元数据类型需要修改核心函数
5. **错误处理不当**：静默失败（`console.warn`），问题难以追踪

### 技术约束

- **框架和库**：
  - React 19 + TypeScript 5.9
  - Vercel AI SDK（`ai` 包）
  - 供应商 SDK：`@ai-sdk/deepseek`, `@ai-sdk/moonshotai`, `zhipu-ai-provider`
  - Redux Toolkit（状态管理）
  - Vitest（测试框架）

- **架构约束**：
  - 必须保持对外 API 兼容（`streamChatCompletion()` 签名）
  - 必须支持依赖注入（用于测试）
  - 必须使用 `@/` 别名导入
  - 必须使用中文注释

- **错误处理策略**：严格模式（fail-fast）

### 利益相关者

- **用户**：期望聊天功能正常工作，无感知变化
- **开发者**：需要清晰的代码结构，便于维护和扩展

## Goals / Non-Goals

**Goals:**
- 将 431 行的单文件拆分为 6 个职责清晰的模块
- 提升代码可读性（平均文件长度 60-200 行）
- 提升可测试性（单元测试覆盖率 >50%）
- 提升可维护性（修改元数据逻辑不影响其他模块）
- 提升可扩展性（添加新功能只需修改单个模块）
- 改进错误处理（严格模式，问题立即暴露）
- 保持 100% API 兼容性（函数签名、行为语义）

**Non-Goals:**
- 不修改聊天功能的业务逻辑
- 不改变 Redux 状态管理结构
- 不引入新的外部依赖
- 不改变现有的依赖注入机制
- 不优化性能（性能不是当前问题）

## Decisions

### 1. 模块拆分策略

**决策**：按职责拆分为 6 个模块，而非按层次拆分

**理由**：
- **按职责拆分**：每个模块对应一个明确的职责（SRP），易于理解和维护
- **按层次拆分**（如 core/providers/transformers）：过度设计，增加文件嵌套深度

**模块划分**：
```
src/services/chat/
├── types.ts                # 职责 1：类型定义
├── providerFactory.ts      # 职责 2：供应商创建
├── messageTransformer.ts   # 职责 3：消息转换
├── metadataCollector.ts    # 职责 4：元数据收集
├── streamProcessor.ts      # 职责 5：流式编排
└── index.ts                # 职责 6：对外 API
```

**替代方案考虑**：
- *按层次拆分（如 layer architecture）*：不采用，增加不必要的嵌套
- *按数据流拆分（如 pipeline）*：不采用，不符合当前架构模式

### 2. 元数据收集器设计

**决策**：创建独立的 `metadataCollector.ts` 模块，每个元数据类型一个函数

**理由**：
- 元数据收集逻辑占 114 行（290-404 行），是最大的复杂度来源
- 独立后可以单独测试、修改和扩展
- 可以被其他服务复用（如成本统计、用量分析）

**函数签名设计**：
```typescript
export async function collectProviderMetadata(
  metadata: Awaited<StreamResult>
): Promise<Record<string, Record<string, unknown>>>;

export async function collectWarnings(
  metadata: Awaited<StreamResult>
): Promise<Array<{ code?: string; message: string }>>;

export async function collectAllMetadata(
  result: StreamResult
): Promise<StandardMessageRawResponse>;
```

**替代方案考虑**：
- *保持在 `streamChatCompletion()` 内部*：不采用，违反 SRP
- *使用类（MetadataCollector class）*：不采用，函数式更简单

### 3. 错误处理策略

**决策**：严格错误收集 + 降级方案

**实现**：
```typescript
// 步骤 1：元数据收集器抛出错误（严格收集）
export async function collectProviderMetadata(
  metadata: Awaited<StreamResult>
): Promise<Record<string, Record<string, unknown>>> {
  try {
    return await metadata.providerMetadata;
  } catch (error) {
    throw new MetadataCollectionError(
      'providerMetadata',
      error instanceof Error ? error.message : String(error),
      error
    );
  }
}

// 步骤 2：顶层捕获并提供降级（降级方案）
export async function* streamChatCompletion(...) {
  try {
    const rawResponse = await collectAllMetadata(result);
    yield { ..., raw: rawResponse };
  } catch (error) {
    // 降级方案：元数据收集失败时返回基本消息
    // 错误信息会被记录到 console，但聊天功能继续
    if (error instanceof MetadataCollectionError) {
      console.warn('Metadata collection failed:', error);
      yield { id, ..., content: '', reasoningContent: '', raw: null };
    } else {
      throw error; // 非元数据错误正常抛出
    }
  }
}
```

**理由**：
- **严格错误收集**：每个元数据收集失败立即抛出错误，便于定位问题
- **降级方案**：元数据错误不应中断聊天（用户体验优先）
- **详细日志**：错误记录到 `console.warn` 和 `raw.errors` 数组

**替代方案考虑**：
- *完全严格模式（抛出错误中断聊天）*：不采用，影响用户体验
- *完全保守模式（静默失败）*：不采用，问题难以追踪

### 4. 依赖注入模式

**决策**：保持现有的依赖注入接口（`AISDKDependencies`）

**实现**：
```typescript
export interface AISDKDependencies {
  streamText: typeof realStreamText;
  generateId: typeof realGenerateId;
}

export async function* streamChatCompletion(
  params: ChatRequestParams,
  options: {
    signal?: AbortSignal;
    dependencies?: AISDKDependencies;  // ← 依赖注入
  } = {}
): AsyncIterable<StandardMessage> {
  const { dependencies = defaultAISDKDependencies } = options;
  // 使用 dependencies.streamText 和 dependencies.generateId
}
```

**理由**：
- 保持与现有测试代码兼容（1791 行测试代码使用此接口）
- 无需修改测试策略

**替代方案考虑**：
- *使用 IoC 容器（如 InversifyJS）*：不采用，过度设计
- *移除依赖注入，使用 MSW*：不采用，需要重写所有测试

### 5. 流式处理编排

**决策**：创建 `streamProcessor.ts` 模块，负责流式事件处理的编排

**实现**：
```typescript
export async function* processStreamEvents(
  result: StreamResult,
  options: ProcessStreamOptions
): AsyncIterable<StandardMessage> {
  // 1. 迭代流事件
  for await (const part of result.fullStream) {
    // 处理 text-delta, reasoning-delta
    yield { ... };
  }

  // 2. 收集所有元数据
  const rawResponse = await collectAllMetadata(result);

  // 3. 返回最终消息
  yield { ..., raw: rawResponse };
}
```

**理由**：
- 将流式处理逻辑与元数据收集解耦
- 便于添加新的事件类型（如 `tool-call`, `image-delta`）

**替代方案考虑**：
- *保持在 `streamChatCompletion()` 内部*：不采用，函数过长（216 行）

### 6. 类型定义管理

**决策**：创建集中的 `types.ts` 文件

**导出类型**：
```typescript
// 配置类型
export interface ChatServiceConfig { ... }
export interface ChatRequestParams { ... }

// 依赖注入类型
export interface AISDKDependencies { ... }

// 错误类型
export class MetadataCollectionError extends Error { ... }

// 内部类型
export interface SensitiveDataConfig { ... }
export interface ProcessStreamOptions { ... }
```

**理由**：
- 类型定义集中管理，便于 IDE 自动导入
- 避免循环依赖
- 便于类型复用

**替代方案考虑**：
- *分散在各个模块中*：不采用，难以查找和复用

## Architecture

### 模块依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                        index.ts                             │
│                      (对外 API 层)                           │
│  streamChatCompletion(), buildMessages(), getProvider()     │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┬──────────────┐
         │           │           │              │
         ▼           ▼           ▼              ▼
┌─────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────┐
│   types     │ │  provider  │ │  message  │ │    stream    │
│             │ │  Factory   │ │Transformer│ │  Processor   │
│ (类型定义)   │ │ (供应商)    │ │ (消息转换) │ │  (流式编排)   │
└─────────────┘ └────────────┘ └───────────┘ └──────┬───────┘
                                                   │
                                                   ▼
                                         ┌──────────────────┐
                                         │ metadataCollector│
                                         │  (元数据收集)     │
                                         └──────────────────┘
```

**依赖规则**：
- `index.ts` 可以依赖所有模块
- `streamProcessor.ts` 可以依赖 `metadataCollector.ts` 和 `types.ts`
- `metadataCollector.ts` 只依赖 `types.ts`
- `providerFactory.ts` 和 `messageTransformer.ts` 只依赖 `types.ts`
- `types.ts` 不依赖任何模块

### 数据流向图

```
Redux Thunk (sendMessage)
     │
     ▼
index.ts: streamChatCompletion()
     │
     ├──▶ providerFactory.getProvider()     → LanguageModel
     │
     ├──▶ messageTransformer.buildMessages() → ModelMessage[]
     │
     ├──▶ AI SDK streamText()                → StreamResult
     │
     ├──▶ streamProcessor.processStream()    ┐
     │    │                                 │
     │    ├──▶ 迭代流事件 (text-delta,      │
     │    │          reasoning-delta)       │
     │    │                                 │
     │    └──▶ metadataCollector.collectAllMetadata()
     │            ├─ collectProviderMetadata()
     │            ├─ collectWarnings()
     │            ├─ collectSources()
     │            ├─ collectResponseMetadata()
     │            ├─ collectRequestMetadata() (脱敏+截断)
     │            ├─ collectUsageMetadata()
     │            ├─ collectFinishReasonMetadata()
     │            └─ collectStreamStats()
     │                                         │
     └──▶ yield StandardMessage               ┘
          │
          ▼
Redux State (pushRunningChatHistory)
```

### 错误处理流程

```
streamChatCompletion()
     │
     ▼
streamProcessor.processStream()
     │
     ├──▶ 正常流程
     │    └──▶ yield StandardMessage (完整元数据)
     │
     └──▶ 元数据收集失败
          ├─ collectProviderMetadata() 抛出错误
          ├─ collectWarnings() 抛出错误
          ├─ collectSources() 抛出错误
          └─ ...
          │
          ▼
     index.ts 顶层 catch
          │
          ├─ console.warn('Metadata collection failed')
          └─ yield StandardMessage (raw: null) ← 降级方案
```

## Implementation Details

### 文件 1: types.ts (60 行)

**职责**：集中管理所有类型定义

**导出**：
```typescript
// 配置类型
export interface ChatServiceConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  dangerouslyAllowBrowser?: boolean;
  providerKey: ModelProviderKeyEnum;
}

export interface ChatRequestParams {
  model: Model;
  historyList: StandardMessage[];
  message: string;
  conversationId?: string;
  includeReasoningContent?: boolean;
}

// 依赖注入类型
export interface AISDKDependencies {
  streamText: typeof realStreamText;
  generateId: typeof realGenerateId;
}

// 错误类型
export class MetadataCollectionError extends Error {
  constructor(
    public field: string,
    message: string,
    public originalError?: unknown
  ) {
    super(`Failed to collect ${field}: ${message}`);
    this.name = 'MetadataCollectionError';
  }
}

// 内部类型
export interface SensitiveDataConfig {
  maxBodySize: number;
  sensitiveHeaders: string[];
  sensitiveFields: string[];
}

export interface ProcessStreamOptions {
  conversationId: string;
  timestamp: number;
  modelKey: string;
  includeReasoningContent: boolean;
}
```

### 文件 2: providerFactory.ts (70 行)

**职责**：创建供应商特定的 provider 实例

**导出**：
```typescript
export function getProvider(
  providerKey: ModelProviderKeyEnum,
  apiKey: string,
  baseURL: string
): (modelId: string) => LanguageModel {
  const fetch = getFetchFunc();

  switch (providerKey) {
    case ModelProviderKeyEnum.DEEPSEEK:
      return createDeepSeek({ apiKey, baseURL, fetch });
    case ModelProviderKeyEnum.MOONSHOTAI:
      return createMoonshotAI({ apiKey, baseURL, fetch });
    case ModelProviderKeyEnum.ZHIPUAI:
    case ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN:
      return createZhipu({ apiKey, baseURL, fetch });
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}
```

**测试策略**：
- Mock `getFetchFunc()` 返回 fake fetch
- Mock 供应商 SDK 返回 fake provider
- 验证正确的 SDK 函数被调用

### 文件 3: messageTransformer.ts (80 行)

**职责**：StandardMessage ↔ AI SDK 消息格式转换

**导出**：
```typescript
export function buildMessages(
  historyList: StandardMessage[],
  message: string,
  includeReasoningContent: boolean = false
): ModelMessage[] {
  return [
    ...historyList.map(history => {
      // system 消息：content 必须是 string
      if (history.role === ChatRoleEnum.SYSTEM) {
        return { role: 'system', content: history.content };
      }

      // user 消息：content 是 Part 数组
      if (history.role === ChatRoleEnum.USER) {
        return {
          role: 'user',
          content: [{ type: 'text', text: history.content }]
        };
      }

      // assistant 消息：可能包含 reasoning
      if (history.role === ChatRoleEnum.ASSISTANT) {
        const parts: AssistantContent = [
          { type: 'text', text: history.content }
        ];

        if (includeReasoningContent && history.reasoningContent) {
          parts.push({
            type: 'reasoning',
            text: history.reasoningContent
          });
        }

        return { role: 'assistant', content: parts };
      }

      throw new Error(`Unknown role: ${history.role}`);
    }),
    { role: 'user', content: [{ type: 'text', text: message }] }
  ];
}
```

**测试策略**：
- 测试各种角色转换（system/user/assistant）
- 测试 reasoning 内容的包含/排除
- 测试边界情况（空消息、特殊字符）

### 文件 4: metadataCollector.ts (200 行) ⭐ 核心

**职责**：收集和转换所有元数据

**导出**：
```typescript
// 主函数
export async function collectAllMetadata(
  result: StreamResult
): Promise<StandardMessageRawResponse> {
  const metadata = await result;

  // 并行收集可能抛错的异步元数据（提升性能）
  const [providerMetadata, warnings, sources] = await Promise.all([
    collectProviderMetadata(metadata),
    collectWarnings(metadata),
    collectSources(metadata),
  ]);

  // 同步收集（不会抛错）或计算型元数据
  const responseMetadata = collectResponseMetadata(metadata);
  const requestMetadata = collectRequestMetadata(metadata);
  const usageMetadata = collectUsageMetadata(metadata);
  const finishReasonMetadata = collectFinishReasonMetadata(metadata);
  const streamStats = collectStreamStats(metadata);

  return {
    response: responseMetadata,
    request: requestMetadata,
    usage: usageMetadata,
    finishReason: finishReasonMetadata,
    providerMetadata,
    warnings,
    sources,
    streamStats,
  };
}

// 单个元数据收集函数（8 个）
export async function collectProviderMetadata(
  metadata: Awaited<StreamResult>
): Promise<Record<string, Record<string, unknown>>> {
  try {
    return await metadata.providerMetadata;
  } catch (error) {
    throw new MetadataCollectionError(
      'providerMetadata',
      error instanceof Error ? error.message : String(error),
      error
    );
  }
}

export async function collectWarnings(
  metadata: Awaited<StreamResult>
): Promise<Array<{ code?: string; message: string }>> {
  try {
    const rawWarnings = await metadata.warnings;
    return rawWarnings?.map(w => ({
      code: 'code' in w ? String(w.code) : w.type,
      message: 'message' in w ? w.message : `${w.type}: ${w.feature}${w.details ? ` (${w.details})` : ''}`,
    })) ?? [];
  } catch (error) {
    throw new MetadataCollectionError('warnings', error instanceof Error ? error.message : String(error), error);
  }
}

export async function collectSources(
  metadata: Awaited<StreamResult>
): Promise<Array<{ sourceType: 'url'; id: string; url: string; title?: string; providerMetadata?: Record<string, unknown> }> | undefined> {
  try {
    const rawSources = await metadata.sources;
    const transformedSources = rawSources
      ?.filter(s => s.sourceType === 'url')
      .map(s => ({
        sourceType: s.sourceType as 'url',
        id: s.id,
        url: s.url,
        title: s.title,
        providerMetadata: s.providerMetadata,
      }));
    // 空数组转换为 undefined
    return transformedSources && transformedSources.length > 0 ? transformedSources : undefined;
  } catch (error) {
    throw new MetadataCollectionError('sources', error instanceof Error ? error.message : String(error), error);
  }
}

export function collectResponseMetadata(
  metadata: Awaited<StreamResult>
): { id: string; modelId: string; timestamp: string; headers?: Record<string, string> } {
  const responseData = metadata.response;
  const headers = responseData.headers
    ? Object.fromEntries(
        Object.entries(responseData.headers).filter(
          ([key]) => !['authorization', 'Authorization', 'x-api-key', 'X-API-Key'].includes(key)
        )
      )
    : undefined;

  return {
    id: responseData.id,
    modelId: responseData.modelId,
    timestamp: responseData.timestamp.toISOString(),
    headers,
  };
}

export function collectRequestMetadata(
  metadata: Awaited<StreamResult>
): { body: string } {
  const requestData = metadata.request;
  let requestBody = typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body);

  // 移除敏感字段
  try {
    const parsedBody = JSON.parse(requestBody);
    if (parsedBody.apiKey) delete parsedBody.apiKey;
    if (parsedBody.api_key) delete parsedBody.api_key;
    if (parsedBody.authorization) delete parsedBody.authorization;
    if (parsedBody.Authorization) delete parsedBody.Authorization;
    requestBody = JSON.stringify(parsedBody);
  } catch {
    // 如果解析失败，保持原始字符串
  }

  // 限制请求体大小（10KB）
  const MAX_BODY_SIZE = 10240;
  if (requestBody.length > MAX_BODY_SIZE) {
    requestBody = requestBody.substring(0, MAX_BODY_SIZE) + '... (truncated)';
  }

  return { body: requestBody };
}

export function collectUsageMetadata(
  metadata: Awaited<StreamResult>
): { inputTokens: number; outputTokens: number; totalTokens: number; inputTokenDetails?: unknown; outputTokenDetails?: unknown; raw?: unknown } {
  const usage = metadata.usage;
  return {
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    inputTokenDetails: usage?.inputTokenDetails,
    outputTokenDetails: usage?.outputTokenDetails,
    raw: usage?.raw,
  };
}

export function collectFinishReasonMetadata(
  metadata: Awaited<StreamResult>
): { reason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'; rawReason: string | null | undefined } {
  const finalFinishReason = metadata.finishReason;
  const rawFinishReason = metadata.rawFinishReason;
  return {
    reason: (finalFinishReason ?? 'other') as 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other',
    rawReason: rawFinishReason,
  };
}

export function collectStreamStats(
  metadata: Awaited<StreamResult>
): { textDeltaCount: number; reasoningDeltaCount: number; duration: number } {
  // 流式统计需要在流式处理过程中计算
  // 这里返回默认值，实际统计在 streamProcessor 中完成
  return {
    textDeltaCount: 0,
    reasoningDeltaCount: 0,
    duration: 0,
  };
}
```

**测试策略**：
- Mock AI SDK 的 `StreamResult` 对象
- 测试每个收集函数的正常流程
- 测试每个收集函数的错误流程（抛出 `MetadataCollectionError`）
- 测试 `collectAllMetadata()` 的完整流程

### 文件 5: streamProcessor.ts (150 行)

**职责**：编排流式处理逻辑

**导出**：
```typescript
export async function* processStreamEvents(
  result: StreamResult,
  options: ProcessStreamOptions
): AsyncIterable<StandardMessage> {
  const { conversationId, timestamp, modelKey, includeReasoningContent } = options;

  // 1. 迭代流事件
  let content = '';
  let reasoningContent = '';
  let finishReason: string | null = null;
  let usageInfo: StandardMessage['usage'] | undefined;

  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        content += part.text;
        break;
      case 'reasoning-delta':
        reasoningContent += part.text;
        break;
      default:
        break;
    }

    yield {
      id: conversationId,
      timestamp,
      modelKey,
      finishReason,
      role: ChatRoleEnum.ASSISTANT,
      content,
      reasoningContent,
      raw: null,
    };
  }

  // 2. 收集所有元数据
  const rawResponse = await collectAllMetadata(result);

  // 3. 解析 usage
  finishReason = rawResponse.finishReason.reason;
  if (rawResponse.usage) {
    usageInfo = {
      inputTokens: rawResponse.usage.inputTokens ?? 0,
      outputTokens: rawResponse.usage.outputTokens ?? 0,
    };
  }

  // 4. 返回最终消息
  yield {
    id: conversationId,
    timestamp,
    modelKey,
    finishReason,
    role: ChatRoleEnum.ASSISTANT,
    content,
    reasoningContent,
    usage: usageInfo,
    raw: rawResponse,
  };
}
```

**测试策略**：
- 使用 MSW 创建 mock 流式响应
- 测试流式事件的迭代和累积
- 测试元数据收集的调用
- 集成测试（使用真实的 AI SDK）

### 文件 6: index.ts (80 行)

**职责**：统一导出和对外 API

**导出**：
```typescript
// 对外 API（保持签名不变）
export async function* streamChatCompletion(
  params: ChatRequestParams,
  options: {
    signal?: AbortSignal;
    dependencies?: AISDKDependencies;
  } = {}
): AsyncIterable<StandardMessage> {
  const { signal, dependencies = defaultAISDKDependencies } = options;
  const { streamText: streamTextFn, generateId: generateIdFn } = dependencies;
  const {
    model,
    historyList,
    message,
    conversationId = generateIdFn(),
    includeReasoningContent = false
  } = params;

  // 1. 获取 provider
  const provider = getProvider(model.providerKey, model.apiKey, model.apiAddress);

  // 2. 构建消息
  const messages = buildMessages(historyList, message, includeReasoningContent);

  // 3. 调用 AI SDK
  const result = streamTextFn({
    model: provider(model.modelKey),
    messages,
    abortSignal: signal,
  });

  // 4. 处理流式响应
  try {
    yield* processStreamEvents(result, {
      conversationId,
      timestamp: getCurrentTimestamp(),
      modelKey: model.modelKey,
      includeReasoningContent,
    });
  } catch (error) {
    // 降级方案：元数据收集失败时返回基本消息
    if (error instanceof MetadataCollectionError) {
      console.warn('Metadata collection failed, returning message without metadata:', error);
      // 注意：此时流式处理可能已经部分完成，content 可能不为空
      // 实际实现中需要在 streamProcessor 中跟踪已流式传输的内容
      yield {
        id: conversationId,
        timestamp: getCurrentTimestamp(),
        modelKey: model.modelKey,
        finishReason: null,
        role: ChatRoleEnum.ASSISTANT,
        content: '', // TODO: 考虑保留已流式传输的内容
        reasoningContent: '',
        raw: null,
      };
    } else {
      throw error; // 非元数据错误正常抛出
    }
  }
}

// 工具函数导出（供测试使用）
export { buildMessages } from './messageTransformer';
export { getProvider } from './providerFactory';

// 类型导出
export type { ChatServiceConfig, ChatRequestParams, AISDKDependencies } from './types';
```

## Testing Strategy

### 单元测试（4 个文件，~950 行）

**1. providerFactory.test.ts (150 行)**
```typescript
describe('providerFactory', () => {
  it('应该创建 DeepSeek provider', () => {
    const provider = getProvider(ModelProviderKeyEnum.DEEPSEEK, 'sk-xxx', 'https://api.deepseek.com');
    expect(provider).toBeDefined();
  });

  it('应该在未知供应商时抛出错误', () => {
    expect(() => getProvider('unknown' as any, 'sk-xxx', 'https://api.example.com'))
      .toThrow('Unsupported provider');
  });
});
```

**2. messageTransformer.test.ts (200 行)**
```typescript
describe('messageTransformer', () => {
  it('应该转换 system 消息', () => {
    const historyList: StandardMessage[] = [
      { id: '1', role: ChatRoleEnum.SYSTEM, content: 'You are helpful', ... }
    ];
    const result = buildMessages(historyList, 'Hello');
    expect(result[0]).toEqual({ role: 'system', content: 'You are helpful' });
  });

  it('应该在开关开启时包含 reasoning 内容', () => {
    // ...
  });
});
```

**3. metadataCollector.test.ts (400 行)**
```typescript
describe('metadataCollector', () => {
  it('应该收集 provider metadata', async () => {
    const mockResult = createMockStreamResult();
    const metadata = await collectProviderMetadata(await mockResult);
    expect(metadata).toBeDefined();
  });

  it('应该在收集失败时抛出 MetadataCollectionError', async () => {
    const mockResult = createMockStreamResult({ throwOnProviderMetadata: true });
    await expect(collectProviderMetadata(await mockResult))
      .rejects.toThrow(MetadataCollectionError);
  });

  it('应该收集所有元数据', async () => {
    const mockResult = createMockStreamResult();
    const rawResponse = await collectAllMetadata(mockResult);
    expect(rawResponse).toHaveProperty('response');
    expect(rawResponse).toHaveProperty('request');
    expect(rawResponse).toHaveProperty('usage');
  });
});
```

**4. streamProcessor.integration.test.ts (300 行)**
```typescript
describe('streamProcessor', () => {
  it('应该处理流式事件', async () => {
    const mockStream = createMockStream([
      { type: 'text-delta', text: 'Hello' },
      { type: 'text-delta', text: ' World' },
    ]);
    const mockResult = createMockStreamResult({ fullStream: mockStream });

    const messages = [];
    for await (const msg of processStreamEvents(mockResult, options)) {
      messages.push(msg);
    }

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Hello');
    expect(messages[1].content).toBe('Hello World');
  });
});
```

### 集成测试（1 个文件，~500 行）

**index.integration.test.ts (500 行)**
```typescript
describe('index - streamChatCompletion', () => {
  it('应该完成完整的流式聊天流程', async () => {
    const mockStreamText = vi.fn();
    const mockGenerateId = vi.fn(() => 'test-id');

    // 模拟流式响应
    mockStreamText.mockReturnValue(createMockStreamResult());

    const messages = [];
    for await (const msg of streamChatCompletion(params, {
      dependencies: { streamText: mockStreamText, generateId: mockGenerateId }
    })) {
      messages.push(msg);
    }

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].role).toBe(ChatRoleEnum.ASSISTANT);
  });

  it('应该在元数据收集失败时返回降级消息', async () => {
    const mockStreamText = vi.fn();
    mockStreamText.mockReturnValue(createMockStreamResult({
      throwOnMetadata: true,
    }));

    const messages = [];
    for await (const msg of streamChatCompletion(params, {
      dependencies: { streamText: mockStreamText }
    })) {
      messages.push(msg);
    }

    expect(messages[0].raw).toBeNull(); // 降级消息
  });
});
```

## Performance Considerations

- **无性能回归**：模块化拆分不影响运行时性能
- **元数据收集并行化**：使用 `Promise.all` 并行收集多个元数据（providerMetadata, warnings, sources）
- **流式处理保持不变**：仍然使用 `for await` 迭代流，性能与当前实现一致

## Security Considerations

- **敏感数据脱敏**：`collectRequestMetadata()` 继续过滤 API 密钥
- **请求体截断**：继续限制请求体大小（10KB）
- **不引入新的安全风险**：仅重构内部实现，不改变数据处理逻辑

## Migration Guide

### 步骤 1：更新导入路径

全局搜索替换：
```
from: '@/services/chatService'
to:   '@/services/chat'
```

### 步骤 2：运行类型检查

```bash
pnpm tsc
```

### 步骤 3：运行测试

```bash
pnpm test
```

### 步骤 4：手动验证

启动应用并测试聊天功能：
```bash
pnpm tauri dev
```

## Rollback Plan

如果重构后出现问题：

1. 删除 `src/services/chat/` 目录
2. 从 Git 恢复 `src/services/chatService.ts`
3. 恢复 `src/__test__/services/chatService.test.ts`
4. 全局搜索替换 `from '@/services/chat'` → `from '@/services/chatService'`
5. 重启应用

预计回滚时间：< 10 分钟
