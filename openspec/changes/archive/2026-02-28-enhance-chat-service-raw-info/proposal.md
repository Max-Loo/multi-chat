## Why

当前 `chatService.ts` 在保存聊天消息时，`raw` 字段被硬编码为空字符串（见 `chatService.ts:212` 和 `chatService.ts:242`），丢失了供应商 API 返回的原始响应数据。这些原始数据对于以下场景至关重要：

1. **调试与问题诊断**：通过 `response.headers` 追踪请求 ID、速率限制信息；通过 `request.body` 重放请求
2. **成本优化**：通过 `usage.inputTokenDetails.cacheReadTokens` 分析缓存命中率，优化提示词设计
3. **推理模型支持**：通过 `reasoningTokens` 和 `reasoningContent` 理解 DeepSeek-R1 等推理模型的思考过程
4. **供应商差异分析**：通过 `providerMetadata` 对比不同供应商的实现差异
5. **审计日志**：保留完整的请求-响应对，满足合规性要求
6. **RAG 来源追踪**：通过 `sources` 保留 web search RAG 模型的参考来源，支持用户验证信息的准确性

随着支持的模型供应商增多、推理模型（如 DeepSeek-R1、K1 等）的普及，以及 RAG 功能的需求增加，保留原始 API 响应的需求变得更加迫切。

## What Changes

### 1. 数据结构设计

#### 1.1 `StandardMessage.raw` 字段类型定义

从空字符串改为结构化的原始响应对象，包含以下字段：

```typescript
interface StandardMessageRawResponse {
  /** 响应元数据 */
  response: {
    /** 供应商返回的响应 ID */
    id: string;
    /** 实际使用的模型标识符 */
    modelId: string;
    /** 供应商返回的响应时间戳 */
    timestamp: string;
    /** HTTP 响应头（用于调试、速率限制追踪） */
    headers?: Record<string, string>;
  };

  /** 请求元数据 */
  request: {
    /** 发送给供应商的请求体（JSON 字符串） */
    body: string;
  };

  /** Token 使用详细信息 */
  usage: {
    /** 输入 token 数量 */
    inputTokens: number;
    /** 输出 token 数量 */
    outputTokens: number;
    /** 总 token 数量 */
    totalTokens: number;
    /** 输入 token 详细信息 */
    inputTokenDetails?: {
      /** 缓存读取的 token 数 */
      cacheReadTokens?: number;
      /** 缓存写入的 token 数 */
      cacheWriteTokens?: number;
      /** 未缓存的 token 数 */
      noCacheTokens?: number;
    };
    /** 输出 token 详细信息 */
    outputTokenDetails?: {
      /** 文本生成的 token 数 */
      textTokens?: number;
      /** 推理过程的 token 数（如 DeepSeek-R1） */
      reasoningTokens?: number;
    };
    /** 供应商原始的 usage 数据（未标准化字段） */
    raw?: Record<string, unknown>;
  };

  /** 完成原因 */
  finishReason: {
    /** 标准化原因 */
    reason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other';
    /** 供应商原始的完成原因 */
    rawReason?: string;
  };

  /** 供应商特定元数据 */
  providerMetadata?: {
    /** 供应商名称（如 'deepseek'、'moonshotai'、'zhipu'） */
    [providerName: string]: Record<string, unknown>;
  };

  /** 警告信息 */
  warnings?: Array<{
    /** 警告代码 */
    code?: string;
    /** 警告消息 */
    message: string;
  }>;

  /** 流式事件统计（用于性能分析） */
  streamStats?: {
    /** 接收到的文本增量事件数 */
    textDeltaCount: number;
    /** 接收到的推理增量事件数 */
    reasoningDeltaCount: number;
    /** 总耗时（毫秒） */
    duration: number;
  };

  /** RAG 来源信息（用于 web search RAG 模型） */
  sources?: Array<{
    /** 来源类型 */
    sourceType: 'url';
    /** 来源 ID */
    id: string;
    /** 来源 URL */
    url: string;
    /** 来源标题 */
    title?: string;
    /** 供应商特定的元数据 */
    providerMetadata?: Record<string, unknown>;
  }>;
}
```

#### 1.2 修改 `StandardMessage` 类型定义

```typescript
export interface StandardMessage {
  // ... 现有字段

  /**
   * 原始响应数据（结构化对象）
   * BREAKING CHANGE: 从 `string | null` 改为 `StandardMessageRawResponse | null`
   */
  raw?: StandardMessageRawResponse | null;
}
```

### 2. 函数实现修改

#### 2.1 修改 `streamChatCompletion()` 函数

**核心改动**：

1. **流式数据收集增强**：
   - 统计 `text-delta` 和 `reasoning-delta` 事件数量
   - 记录流式处理的开始和结束时间

2. **元数据收集增强**：
   - 收集 `result.request`（请求体）
   - 收集 `result.response`（响应元数据）
   - 收集 `result.usage`（完整的 token 使用信息，包括详细字段）
   - 收集 `result.providerMetadata`（供应商特定元数据）
   - 收集 `result.warnings`（警告信息）
   - 收集 `result.reasoning` 或 `result.reasoningText`（最终推理内容）

3. **构建结构化 `raw` 对象**：
   - 在最终消息 yield 时，将所有收集的数据组装成 `StandardMessageRawResponse` 结构

**实现要点**：

```typescript
export async function* streamChatCompletion(
  params: ChatRequestParams,
  { signal }: { signal?: AbortSignal } = {}
): AsyncIterable<StandardMessage> {
  const { model, historyList, message, conversationId = generateId(), includeReasoningContent = false } = params;

  // 获取供应商特定的 provider
  const provider = getProvider(model.providerKey, model.apiKey, model.apiAddress);

  // 使用 ai-sdk 的 streamText 发起流式请求
  const result = streamText({
    model: provider(model.modelKey),
    messages: buildMessages(historyList, message, includeReasoningContent),
    abortSignal: signal,
  });

  // 流式数据收集
  let content = '';
  let reasoningContent = '';
  const timestamp = getCurrentTimestamp();
  const modelKey = model.modelKey;
  const streamStartTime = Date.now();

  // 流式事件统计
  let textDeltaCount = 0;
  let reasoningDeltaCount = 0;

  // 迭代完整流（包含文本、推理内容等所有事件）
  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        content += part.text;
        textDeltaCount++;
        break;
      case 'reasoning-delta':
        reasoningContent += part.text;
        reasoningDeltaCount++;
        break;
      default:
        break;
    }

    yield {
      id: conversationId,
      timestamp,
      modelKey,
      finishReason: null,
      role: ChatRoleEnum.ASSISTANT,
      content: content,
      reasoningContent,
      raw: null,
    };
  }

  const streamEndTime = Date.now();

  // 等待完成，获取元数据
  const metadata = await result;

  // 收集 sources 数据（RAG 来源信息）
  const sources = await metadata.sources;

  // 收集完整的原始响应数据
  const rawResponse: StandardMessageRawResponse = {
    response: {
      id: (await metadata.response).id,
      modelId: (await metadata.response).modelId,
      timestamp: (await metadata.response).timestamp.toISOString(),
      headers: (await metadata.response).headers,
    },
    request: {
      body: (await metadata.request).body,
    },
    usage: {
      inputTokens: (await metadata.usage).inputTokens ?? 0,
      outputTokens: (await metadata.usage).outputTokens ?? 0,
      totalTokens: (await metadata.usage).totalTokens ?? 0,
      inputTokenDetails: (await metadata.usage).inputTokenDetails,
      outputTokenDetails: (await metadata.usage).outputTokenDetails,
      raw: (await metadata.usage).raw,
    },
    finishReason: {
      reason: await metadata.finishReason,
      rawReason: await metadata.rawFinishReason,
    },
    providerMetadata: await metadata.providerMetadata,
    warnings: await metadata.warnings,
    streamStats: {
      textDeltaCount,
      reasoningDeltaCount,
      duration: streamEndTime - streamStartTime,
    },
    sources: sources?.map((source) => ({
      sourceType: source.sourceType,
      id: source.id,
      url: source.url,
      title: source.title,
      providerMetadata: source.providerMetadata,
    })),
  };

  // 返回最终消息（包含完整的 raw 数据）
  yield {
    id: conversationId,
    timestamp,
    modelKey,
    finishReason: rawResponse.finishReason.reason,
    role: ChatRoleEnum.ASSISTANT,
    content: content,
    reasoningContent: reasoningContent || (await metadata.reasoningText),
    usage: {
      inputTokens: rawResponse.usage.inputTokens,
      outputTokens: rawResponse.usage.outputTokens,
    },
    raw: rawResponse,
  };
}
```

### 3. 实现策略

#### 3.1 渐进式实现

**阶段 1：基础数据收集**（必须实现）
- `response.id`, `response.modelId`, `response.timestamp`
- `request.body`
- `usage.inputTokens`, `usage.outputTokens`, `usage.totalTokens`
- `finishReason.reason`, `finishReason.rawReason`

**阶段 2：增强数据收集**（推荐实现）
- `response.headers`
- `usage.inputTokenDetails`, `usage.outputTokenDetails`
- `providerMetadata`
- `warnings`
- `streamStats`
- `sources`（RAG 来源信息）

**阶段 3：高级特性**（可选实现）
- `usage.raw`（供应商原始数据）
- `steps`（多步骤生成信息）
- `files`（生成的文件）

#### 3.2 错误处理

- 如果某个元数据字段获取失败（如网络错误导致响应不完整），记录错误但不中断消息流
- 在 `raw` 对象中添加 `errors` 字段记录收集过程中的错误
- 保持向后兼容：如果 `raw` 为 `null`，UI 应正常显示消息内容

#### 3.3 数据压缩策略

考虑到 `raw` 数据可能较大（特别是 `request.body` 和 `response.headers`），实施以下策略：

1. **选择性存储**：
   - 对于历史消息，可以选择只保留关键字段（如 `usage`、`finishReason`）
   - 通过配置项控制是否保存完整的 `request.body` 和 `response.headers`

2. **数据清理**：
   - 移除 `headers` 中的敏感信息（如 `Authorization`）
   - 限制 `body` 的大小（如超过 10KB 时截断）

3. **可选压缩**：
   - 对 `raw` 数据进行 JSON 序列化后使用 gzip 压缩
   - 在读取时解压缩

### 4. 向后兼容性

#### 4.1 数据迁移策略

1. **现有数据处理**：
   - 对于 `raw` 为空字符串或 `null` 的旧消息，保持不变
   - 新消息使用结构化的 `StandardMessageRawResponse`

2. **UI 适配**：
   - 检查 `raw` 是否为对象类型，如果是则显示详细信息
   - 如果 `raw` 为 `null` 或空字符串，显示"无原始数据"提示

3. **API 兼容性**：
   - 导出辅助函数 `formatRawResponse(raw)`，用于将结构化数据转换为人类可读的格式
   - 提供 `isEnhancedRawResponse(raw)` 类型守卫，用于判断 `raw` 是否为新格式

#### 4.2 类型定义兼容

```typescript
// 类型守卫
export function isEnhancedRawResponse(raw: unknown): raw is StandardMessageRawResponse {
  return typeof raw === 'object' && raw !== null && 'response' in raw;
}

// 格式化函数
export function formatRawResponse(raw: StandardMessageRawResponse | null | undefined): string {
  if (!raw) return '无原始数据';
  return JSON.stringify(raw, null, 2);
}
```

## Capabilities

### New Capabilities
- `chat-raw-data-preservation`: 定义聊天消息中原始响应数据的收集、存储和访问规范。包括：
  - 完整的请求-响应元数据收集
  - 供应商特定字段映射
  - 与加密存储的集成
  - 流式事件统计和性能分析
  - 推理模型支持（reasoning tokens 和内容）
  - RAG 来源信息收集（sources）

### Modified Capabilities
- `chat-message-sending`: 现有的聊天消息发送功能需要在返回的 `StandardMessage` 中包含完整的原始响应数据，而非空字符串。

## Impact

### 受影响的代码

**核心修改**：
- `src/services/chatService.ts`:
  - 修改 `streamChatCompletion()` 函数，收集完整的原始响应数据
  - 新增流式事件统计逻辑
  - 构建 `StandardMessageRawResponse` 对象

**类型定义**：
- `src/types/chat.ts`:
  - 新增 `StandardMessageRawResponse` 接口
  - 修改 `StandardMessage.raw` 字段类型
  - 新增类型守卫和辅助函数

**测试修改**：
- `src/__tests__/services/chatService.test.ts`:
  - 更新 Mock 数据以匹配新的 `raw` 结构
  - 新增原始数据收集的测试用例
  - 测试流式事件统计逻辑

### API 兼容性

**现有功能**：
- 消息加载、显示、导出等功能需要适配新的 `raw` 格式
- 提供类型守卫 `isEnhancedRawResponse()` 用于格式判断
- 提供 `formatRawResponse()` 辅助函数用于格式化显示

**向后兼容**：
- 旧消息的 `raw` 字段为空字符串或 `null`，保持不变
- 新消息使用结构化的 `StandardMessageRawResponse`
- UI 层需要同时支持两种格式

### 存储影响评估

**数据量估算**：
- `request.body`: 约 500-2000 字节（取决于历史消息长度）
- `response.headers`: 约 200-500 字节
- `usage` 详细信息: 约 100-200 字节
- `providerMetadata`: 约 100-500 字节（取决于供应商）
- `warnings`: 约 50-200 字节（如果有）
- `streamStats`: 约 50 字节
- `sources`: 约 500-2000 字节（取决于来源数量，每个来源约 100-200 字节）

**总计**：每条消息约增加 1-6 KB（未压缩，包含 sources 时）

**性能影响**：
- **加密开销**：`raw` 数据会被加密存储，加密时间与数据大小成正比
- **存储空间**：假设用户有 1000 条历史消息，额外占用约 1-4 MB
- **读取性能**：加载历史聊天时，需要解密每条消息的 `raw` 数据

**优化策略**：
1. **选择性存储**：通过配置项控制是否保存完整的 `request.body` 和 `response.headers`
2. **数据清理**：移除 `headers` 中的敏感信息和重复字段
3. **延迟加载**：UI 层按需加载 `raw` 数据（如点击"查看详细信息"时）
4. **数据压缩**：对 `raw` 数据进行 gzip 压缩（可选）

### 供应商差异处理

**标准化字段**（使用 ai-sdk 的统一接口）：
- `usage.inputTokens`, `usage.outputTokens`, `usage.totalTokens`
- `finishReason`（标准化为枚举值）
- `response.id`, `response.modelId`, `response.timestamp`
- `request.body`

**供应商特定字段**（通过 `providerMetadata` 保留）：
- DeepSeek: `reasoningTokens`、特定的速率限制信息
- MoonshotAI: 特定的模型版本信息
- Zhipu: 特定的 API 版本信息

**错误处理**：
- 如果某个供应商不支持某个字段（如 `reasoningTokens`），该字段为 `undefined`
- 如果获取元数据失败，记录错误但不中断消息流
- 在 `raw` 对象中添加 `errors` 字段记录收集过程中的错误

### 安全性考虑

**敏感信息过滤**：
- `request.body` 可能包含 API Key，需要在存储前移除或替换为占位符
- `response.headers` 可能包含 `Authorization` 头，需要过滤
- `providerMetadata` 可能包含敏感信息，需要审查

**访问控制**：
- `raw` 数据可能包含供应商的内部信息，需要谨慎展示
- 在 UI 层提供"开发者模式"开关，默认不显示详细的技术信息

### 未来扩展性

**工具调用支持**（预留字段）：
- 当支持工具调用时，可以扩展 `raw` 结构以包含 `toolCalls` 和 `toolResults`
- 从 `result.fullStream` 中收集 `tool-call`、`tool-call-delta`、`tool-result` 事件

**多步骤生成**（预留字段）：
- 当支持多步骤生成时，可以扩展 `raw` 结构以包含 `steps`
- 从 `result.steps` 中获取每一步的详细信息

## Testing Plan

### 单元测试

**测试用例**：

1. **基础数据收集测试**：
   - 验证 `response.id`、`response.modelId`、`response.timestamp` 正确收集
   - 验证 `request.body` 正确收集且不包含敏感信息
   - 验证 `usage` 的所有字段正确映射

2. **流式事件统计测试**：
   - 验证 `textDeltaCount` 和 `reasoningDeltaCount` 正确统计
   - 验证 `duration` 在合理范围内

3. **供应商差异测试**：
    - 测试 DeepSeek、MoonshotAI、Zhipu 三个供应商的原始数据收集
    - 验证 `providerMetadata` 正确保存供应商特定字段
    - 验证 `warnings` 正确收集

4. **RAG Sources 测试**：
    - 验证 web search RAG 模型的 `sources` 数据正确收集
    - 验证 `sources` 包含正确的 URL、title 和 id
    - 验证 `providerMetadata` 正确保存供应商特定的元数据
    - 测试无 sources 的普通聊天消息不影响数据收集

5. **错误处理测试**：
    - 模拟网络错误，验证错误不中断消息流
    - 验证 `raw` 对象中的 `errors` 字段正确记录错误

4. **错误处理测试**：
   - 模拟网络错误，验证错误不中断消息流
   - 验证 `raw` 对象中的 `errors` 字段正确记录错误

5. **向后兼容性测试**：
   - 验证旧消息（`raw` 为空字符串）正常显示
   - 验证新消息（`raw` 为对象）正常显示
   - 验证类型守卫 `isEnhancedRawResponse()` 正确判断

### 集成测试

**测试场景**：

1. **端到端聊天流程**：
   - 发送消息并接收流式响应
   - 验证最终消息包含完整的 `raw` 数据
   - 验证消息正确保存到存储

2. **加密存储集成**：
   - 验证 `raw` 数据正确加密
   - 验证 `raw` 数据正确解密
   - 验证加密后的 `raw` 数据不可读

3. **UI 层集成**：
   - 验证"查看详细信息"功能正确显示 `raw` 数据
   - 验证"开发者模式"开关正确控制 `raw` 数据显示

### 性能测试

**测试指标**：

1. **加密性能**：
   - 测试不同大小的 `raw` 数据（1KB、2KB、4KB）的加密时间
   - 对比修改前后的消息保存时间

2. **存储空间**：
   - 测试 1000 条消息的存储空间占用
   - 对比启用/禁用 `raw` 数据收集的空间差异

3. **读取性能**：
   - 测试加载 100、500、1000 条历史消息的时间
   - 对比启用/禁用 `raw` 数据收集的加载时间

### 测试数据

**Mock 数据**：
```typescript
const mockRawResponse: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-123',
    modelId: 'deepseek-chat',
    timestamp: '2024-01-01T00:00:00.000Z',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-123',
    },
  },
  request: {
    body: '{"model":"deepseek-chat","messages":[...]}',
  },
  usage: {
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150,
    inputTokenDetails: {
      cacheReadTokens: 20,
      cacheWriteTokens: 0,
      noCacheTokens: 80,
    },
    outputTokenDetails: {
      textTokens: 40,
      reasoningTokens: 10,
    },
  },
  finishReason: {
    reason: 'stop',
    rawReason: 'stop',
  },
  providerMetadata: {
    deepseek: {
      version: '2024-01-01',
    },
  },
  warnings: [],
  streamStats: {
    textDeltaCount: 50,
    reasoningDeltaCount: 10,
    duration: 1500,
  },
  sources: [
    {
      sourceType: 'url',
      id: 'src-1',
      url: 'https://example.com/article1',
      title: 'Example Article 1',
      providerMetadata: {
        score: 0.95,
      },
    },
    {
      sourceType: 'url',
      id: 'src-2',
      url: 'https://example.com/article2',
      title: 'Example Article 2',
      providerMetadata: {
        score: 0.87,
      },
    },
  ],
};
```

## Implementation Steps

### 阶段 1：准备阶段（预计 1-2 天）

1. **创建新的类型定义文件**：
   - 在 `src/types/chat.ts` 中新增 `StandardMessageRawResponse` 接口
   - 新增类型守卫和辅助函数

2. **更新测试 Mock 数据**：
   - 创建 `__tests__/mocks/rawResponse.ts` 文件
   - 定义不同供应商的 Mock 原始响应数据

### 阶段 2：核心实现（预计 2-3 天）

3. **修改 `streamChatCompletion()` 函数**：
   - 添加流式事件统计逻辑
   - 收集完整的原始响应数据
   - 构建 `StandardMessageRawResponse` 对象

4. **更新单元测试**：
   - 新增原始数据收集的测试用例
   - 更新现有的 Mock 数据和断言

### 阶段 3：集成与优化（预计 1-2 天）

5. **集成加密存储**：
   - 确保 `raw` 数据正确加密和解密
   - 测试加密性能影响

6. **实施优化策略**：
   - 添加敏感信息过滤逻辑
   - 实现选择性存储配置（可选）

### 阶段 4：UI 层适配（预计 1-2 天）

7. **添加"查看详细信息"功能**：
   - 在消息详情中添加"查看原始数据"按钮
   - 实现原始数据的格式化显示

8. **测试端到端流程**：
   - 测试完整的聊天流程
   - 验证向后兼容性

### 阶段 5：文档与发布（预计 1 天）

9. **更新文档**：
   - 更新 AGENTS.md 和 README.md
   - 添加 `raw` 数据结构说明

10. **代码审查与发布**：
    - 进行代码审查
    - 合并到主分支
    - 发布新版本

**总计**：约 6-10 个工作日
