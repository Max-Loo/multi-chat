# 移除硬编码供应商注册，统一使用远程数据

## Why

当前项目中存在两套模型供应商注册机制：一套是硬编码的本地注册逻辑（`ProviderRegistry.ts`），另一套是从远程 API 动态获取数据的服务（`modelRemoteService.ts`）。这种双重机制导致以下问题：

1. **代码重复**：两套系统维护相同的供应商定义
2. **维护成本高**：添加新供应商需要同时修改两处代码
3. **参数命名不一致**：
   - `models.dev` API 使用 `id`、`api`、`name`
   - 内部接口使用 `providerKey`、`apiAddress`、`providerName`
   - 增加了理解和维护成本
4. **数据源不统一**：硬编码可能与上游 API 不同步

移除本地硬编码逻辑，统一使用远程数据，可以：
- ✅ 简化代码库，减少约 200-300 行代码
- ✅ 降低维护负担，单一数据源
- ✅ 确保数据结构与上游 API (`models.dev`) 保持一致
- ✅ 提高代码可维护性和可扩展性

## What Changes

### 核心变更

- **NEW** 创建独立的聊天服务层（`src/services/chatService.ts`）
  - 统一使用 OpenAI SDK 处理所有供应商的聊天请求
  - 支持流式响应和响应解析
  - 处理不同供应商的响应格式差异
- **BREAKING** 移除 `src/lib/factory/modelProviderFactory/ProviderRegistry.ts` 中的硬编码供应商注册逻辑
- **BREAKING** 移除所有对 `ProviderRegistry.registerAllProviders()` 的调用
- **BREAKING** 更新 `RemoteProviderData` 接口，参数命名与 `models.dev` API 对齐（`apiAddress` → `api`）
- 简化供应商初始化流程，只保留远程数据获取路径（远程 API → 缓存 → 动态注册）
- 删除不再使用的硬编码 Provider 类：
  - `DeepseekProvider.ts`
  - `KimiProvider.ts`
  - `BigModelProvider.ts`
- 删除不再使用的基类：
  - `BaseFetchApi.ts`（逻辑迁移到 `chatService.ts`）
  - `BaseApiAddress.ts`（逻辑简化或删除）

### 参数命名对齐

| models.dev API | 内部接口 (当前) | 内部接口 (对齐后) | 说明 |
|----------------|-----------------|-------------------|------|
| `id` (provider) | `providerKey` | `providerKey` ✅ | 保持不变 |
| `name` (provider) | `providerName` | `providerName` ✅ | 保持不变 |
| `api` | `apiAddress` | `api` 🔄 | 简化命名 |
| `models` | `models` | `models` ✅ | 保持不变 |
| `id` (model) | `modelKey` | `modelKey` ✅ | 保持不变 |
| `name` (model) | `modelName` | `modelName` ✅ | 保持不变 |

## Capabilities

### New Capabilities
- **独立聊天服务层**：创建 `chatService.ts`，统一处理所有供应商的聊天请求
  - 提供统一的 OpenAI SDK 客户端创建接口
  - 提供统一的流式聊天请求接口
  - 提供响应解析接口，支持多种供应商格式

### Modified Capabilities
- **供应商注册流程**：简化为只处理元数据，不再包含聊天请求逻辑
- **Redux Thunk**：从调用 `fetchApi.fetch()` 改为调用 `ChatService.streamChatCompletion()`

## 聊天服务层设计 🆕

### 设计目标

虽然移除了硬编码的供应商注册逻辑，但发送聊天请求的核心逻辑仍然需要使用 OpenAI SDK。为了保持代码的简洁性和可维护性，需要将这部分逻辑抽取到一个独立的服务层。

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│ Redux Thunk (chatSlices.ts)                                 │
│ - startSendChatMessage                                      │
│ - sendMessage                                              │
└────────────────────────┬────────────────────────────────────┘
                          │ 调用
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ URL 标准化模块 (urlNormalizer.ts) - 新增                   │
│ - normalize()  根据供应商规则标准化 URL                     │
└────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 独立聊天服务层 (chatService.ts) - 新增                     │
│ - createChatClient()  创建 OpenAI 客户端                    │
│ - streamChatCompletion()  流式聊天请求                       │
│ - parseStreamResponse()  解析响应（支持多种格式）           │
│ - buildMessages()  构建消息列表                             │
│ - mergeChunk()  合并流式响应块                               │
└────────────────────────┬────────────────────────────────────┘
                          │ 使用
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ OpenAI SDK                                                  │
│ - chat.completions.create()                                │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. urlNormalizer.ts（新建）

**位置**：`src/services/urlNormalizer.ts`

**职责**：
- 根据供应商的特定规则标准化 API URL
- 提供 URL 标准化策略接口
- 实现不同供应商的 URL 规范化逻辑

**设计模式**：策略模式

**核心接口**：

```typescript
/**
 * URL 标准化策略接口
 */
interface UrlNormalizationStrategy {
  /** 标准化 URL */
  normalize(url: string): string;
  /** 获取表单提示文案 */
  getDescription(): string;
}

/**
 * URL 标准化器
 */
export class UrlNormalizer {
  /**
   * 标准化 URL
   * @param url 原始 URL
   * @param providerKey 供应商标识符
   * @returns 标准化后的 URL
   */
  static normalize(url: string, providerKey: ModelProviderKeyEnum): string;

  /**
   * 获取表单提示文案
   */
  static getDescription(providerKey: ModelProviderKeyEnum): string;
}
```

**供应商策略**：

```typescript
// Kimi：需要 /v1 路径
class KimiNormalizationStrategy {
  normalize(url: string): string {
    if (!url.endsWith('/v1')) {
      url = url + '/v1';
    }
    return url;
  }
}

// 其他供应商：默认策略
class DefaultNormalizationStrategy {
  normalize(url: string): string {
    // 移除末尾的 / 或 #
    return url.replace(/[\/#]$/, '');
  }
}
```

#### 2. chatService.ts（新建）

**位置**：`src/services/chatService.ts`

**职责**：
- 创建和管理 OpenAI 客户端实例（支持开发环境代理）
- 发起流式聊天请求
- 解析流式响应数据（支持多种供应商格式）
- 构建消息列表（包含历史记录）
- 合并流式响应块（处理 content、reasoning_content 等字段）
- 处理信号中断和错误
- 提取 token 使用情况

**核心接口**：

```typescript
/**
 * 聊天服务配置
 */
export interface ChatServiceConfig {
  /** API Key */
  apiKey: string;
  /** API 基础地址（原始 URL，会被标准化） */
  baseURL: string;
  /** 模型标识符 */
  model: string;
  /** 是否允许浏览器环境（Tauri 桌面应用需要） */
  dangerouslyAllowBrowser?: boolean;
  /** 供应商标识符（用于开发环境代理和 URL 标准化） */
  providerKey: ModelProviderKeyEnum;
}

/**
 * 聊天请求参数
 */
export interface ChatRequestParams {
  /** 模型配置 */
  model: Model;
  /** 历史聊天记录 */
  historyList: StandardMessage[];
  /** 最新的用户消息 */
  message: string;
}

/**
 * 流式响应（生成器）
 */
export type StreamChatResponse = AsyncIterable<StandardMessage>;

/**
 * 聊天服务类
 */
export class ChatService {
  /**
   * 创建 OpenAI 客户端
   * @param config 服务配置
   * @returns OpenAI 客户端实例
   */
  static createClient(config: ChatServiceConfig): OpenAI;

  /**
   * 发起流式聊天请求
   * @param params 请求参数
   * @param signal 取消信号
   * @returns 流式响应生成器
   */
  static async* streamChatCompletion(
    params: ChatRequestParams,
    { signal }: { signal?: AbortSignal } = {}
  ): StreamChatResponse;

  /**
   * 解析流式响应块
   * @param chunk OpenAI 流式响应块
   * @param providerKey 供应商标识符（用于处理格式差异）
   * @returns 标准化的消息对象
   */
  static parseStreamResponse(
    chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
    providerKey: ModelProviderKeyEnum
  ): StandardMessage;

  /**
   * 构建消息列表
   * @param historyList 历史聊天记录
   * @param message 最新的用户消息
   * @returns OpenAI 格式的消息列表
   */
  private static buildMessages(
    historyList: StandardMessage[],
    message: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  /**
   * 判断哪些字段的内容需要合并
   * @param key 字段名
   * @returns 是否需要合并内容
   */
  private static shouldMergeContent(key: string): boolean;

  /**
   * 合并流式响应块
   * @param tempChunk 之前的数据块
   * @param chunk 新的数据块
   * @returns 合并后的数据块
   */
  private static mergeChunk<T>(
    tempChunk: T | null,
    chunk: T
  ): T;
}
```

#### 2. 供应商响应格式适配器

虽然所有供应商都兼容 OpenAI API，但响应格式可能存在细微差异（如 `reasoning_content` 字段）。

**策略**：
- **完全统一的 OpenAI SDK 配置**：所有供应商使用相同的客户端配置
- **响应解析层的适配**：在 `parseStreamResponse` 方法中根据 `providerKey` 处理差异

**示例**：

```typescript
/**
 * 创建 OpenAI 客户端（支持开发环境代理）
 */
static createClient(config: ChatServiceConfig): OpenAI {
  // 1. 开发环境代理处理
  const baseURL = import.meta.env.DEV
    ? `${location.origin}/${config.providerKey}`  // Vite 代理
    : config.baseURL;

  // 2. URL 标准化（应用供应商特定规则）
  const normalizedBaseURL = UrlNormalizer.normalize(baseURL, config.providerKey);

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: normalizedBaseURL,
    dangerouslyAllowBrowser: config.dangerouslyAllowBrowser ?? true,
    fetch: getFetchFunc(),  // 使用兼容层的 fetch
  });
}

/**
 * 发起流式聊天请求（完整实现）
 */
static async* streamChatCompletion(
  params: ChatRequestParams,
  { signal }: { signal?: AbortSignal } = {}
): StreamChatResponse {
  const { model, historyList, message } = params;
  const client = this.createClient({
    apiKey: model.apiKey,
    baseURL: model.apiAddress,
    model: model.modelKey,
    providerKey: model.providerKey,
  });

  const response = await client.chat.completions.create({
    model: model.modelKey,
    messages: this.buildMessages(historyList, message),
    stream: true,
  }, { signal });

  let tempChunk: OpenAI.Chat.Completions.ChatCompletionChunk | null = null;

  for await (const chunk of response) {
    // 处理信号中断
    if (signal?.aborted) {
      break;
    }

    // 合并数据块
    tempChunk = this.mergeChunk(tempChunk, chunk);

    // 解析并返回
    yield this.parseStreamResponse(tempChunk, model.providerKey);
  }
}

/**
 * 构建消息列表
 */
private static buildMessages(
  historyList: StandardMessage[],
  message: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    ...historyList.map(history => ({
      role: history.role,
      content: history.content,
    } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
    { role: 'user', content: message },
  ];
}

/**
 * 判断哪些字段需要合并
 */
private static shouldMergeContent(key: string): boolean {
  return ['reasoning_content', 'content'].includes(key);
}

/**
 * 合并流式响应块
 */
private static mergeChunk<T>(
  tempChunk: T | null,
  chunk: T
): T {
  if (tempChunk === null) {
    return chunk;
  }

  return mergeWith(
    tempChunk as Record<string, unknown>,
    chunk as Record<string, unknown>,
    (targetValue, sourceValue, key) => {
      // 根据字段配置决定是否需要合并内容
      if (this.shouldMergeContent(key)) {
        const str = typeof targetValue === 'string' ? targetValue : '';
        if (typeof sourceValue === 'string') {
          return str + sourceValue;
        }
      }
      // 其他字段使用默认合并策略
    },
  ) as T;
}

/**
 * 解析流式响应块（支持不同供应商的特殊字段）
 */
static parseStreamResponse(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
  providerKey: ModelProviderKeyEnum
): StandardMessage {
  const { id, created, model, choices } = chunk;
  const { finish_reason, delta } = choices[0];

  // 基础消息结构
  const message: StandardMessage = {
    id,
    timestamp: created,
    modelKey: model,
    finishReason: finish_reason,
    role: getStandardRole(delta.role),
    content: delta.content || '',
    reasoningContent: '',  // 默认为空
    raw: JSON.stringify(chunk),
  };

  // 处理推理内容字段（如果存在）
  if ('reasoning_content' in delta && delta.reasoning_content) {
    message.reasoningContent = delta.reasoning_content;
  }

  // 处理 token 使用情况（不同供应商结构不同）
  if (choices[0].usage) {
    const usage = choices[0].usage;

    // Deepseek/Kimi：usage.cached_tokens
    if ('cached_tokens' in usage && typeof usage.cached_tokens === 'number') {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
        cached: usage.cached_tokens,
      };
    }
    // BigModel：usage.prompt_tokens_details.cached_tokens
    else if (
      'prompt_tokens_details' in usage &&
      usage.prompt_tokens_details &&
      typeof (usage.prompt_tokens_details as any).cached_tokens === 'number'
    ) {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
        cached: (usage.prompt_tokens_details as any).cached_tokens,
      };
    }
    // 标准格式（无 cached_tokens）
    else {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
      };
    }
  }

  return message;
}
```

### 调用方式

**修改前**（当前）：

```typescript
// chatSlices.ts
const { fetchApi } = getProviderFactory(model.providerKey).getModelProvider();

const fetchResponse = fetchApi.fetch(
  { model, historyList, message },
  { signal },
);

for await (const element of fetchResponse) {
  // ...
}
```

**修改后**：

```typescript
// chatSlices.ts
import { ChatService } from '@/services/chatService';

const fetchResponse = ChatService.streamChatCompletion(
  { model, historyList, message },
  { signal },
);

for await (const element of fetchResponse) {
  // ...
}
```

### 优势

1. **解耦**：聊天请求逻辑不再依赖 Provider 架构
2. **简化**：移除了 `BaseFetchApi`、`BaseApiAddress` 等复杂的基类继承
3. **统一**：所有供应商使用相同的 OpenAI SDK 配置
4. **灵活**：易于扩展支持新的供应商
5. **可测试**：独立的服务层更容易编写单元测试

### 与 DynamicModelProvider 的关系

**DynamicModelProvider 的职责变更**：

- **变更前**：负责供应商注册 + 聊天请求逻辑（通过 `DynamicFetchApi`）
- **变更后**：仅负责供应商注册（元数据管理），不再包含聊天请求逻辑

**删除的文件**：
- `src/lib/factory/modelProviderFactory/base/BaseFetchApi.ts`
- `src/lib/factory/modelProviderFactory/base/BaseApiAddress.ts`
- `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts` 中的 `DynamicFetchApi` 类

**保留的文件**：
- `src/lib/factory/modelProviderFactory/base/ConfigurableModelProvider.ts`（可能不再需要，需要评估）
- `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`（简化版）

## Implementation Steps

### Phase 0: 创建 URL 标准化模块 🆕

**目标**：建立独立的 URL 标准化模块，处理供应商特定的路径规则

1. **创建 urlNormalizer.ts**
    ```bash
    # 创建新文件
    touch src/services/urlNormalizer.ts
    ```

2. **实现核心功能**
    - 定义 `UrlNormalizationStrategy` 接口
    - 实现 `DefaultNormalizationStrategy`（大多数供应商）
    - 实现 `KimiNormalizationStrategy`（需要 /v1 路径）
    - 实现 `UrlNormalizer` 类
    - 添加完整的中文注释

3. **编写单元测试**
    ```bash
    # 创建测试文件
    touch src/services/urlNormalizer.test.ts
    ```

4. **运行类型检查**
    ```bash
    pnpm tsc --noEmit
    ```

**验证清单**：
- [ ] `UrlNormalizer.normalize()` 对 Kimi 自动添加 `/v1` 路径
- [ ] `UrlNormalizer.normalize()` 对其他供应商不做特殊处理
- [ ] `UrlNormalizer.getDescription()` 返回正确的表单提示文案
- [ ] 单元测试覆盖率 > 80%

### Phase 0.5: 创建独立聊天服务层 🆕

**目标**：建立独立的聊天请求处理层

1. **创建 chatService.ts**
    ```bash
    # 创建新文件
    touch src/services/chatService.ts
    ```

2. **实现核心功能**
    - `createClient()`: 创建 OpenAI 客户端（支持开发环境代理）
    - `streamChatCompletion()`: 流式聊天请求（完整实现）
    - `parseStreamResponse()`: 响应解析（支持不同供应商的特殊字段）
    - `buildMessages()`: 构建消息列表
    - `mergeChunk()`: 合并流式响应块
    - `shouldMergeContent()`: 判断字段是否需要合并

3. **编写单元测试**
    ```bash
    # 创建测试文件
    touch src/services/chatService.test.ts
    ```

4. **运行类型检查**
    ```bash
    pnpm tsc --noEmit
    ```

**验证清单**：
- [ ] 开发环境下使用 Vite 代理（`${location.origin}/${providerKey}`）
- [ ] 生产环境下使用 URL 标准化（`UrlNormalizer.normalize()`）
- [ ] `parseStreamResponse()` 正确处理 Deepseek/Kimi/BigModel 的特殊字段
- [ ] `mergeChunk()` 正确合并 `content` 和 `reasoning_content` 字段
- [ ] 单元测试覆盖率 > 80%

### Phase 1: 准备工作 📋

**目标**：确保变更安全可追溯

1. **检查当前使用情况**
   ```bash
   # 搜索所有对 registerAllProviders 的引用
   grep -r "registerAllProviders" src/
   grep -r "ProviderRegistry" src/
   ```

2. **备份关键数据**（可选）
   - 备份当前的 `remote-cache.json` 缓存文件
   - 记录当前注册的供应商列表

### Phase 2: 参数命名对齐 🔧

**目标**：统一参数命名，减少理解成本

1. **更新类型定义**（`src/services/modelRemoteService.ts`）

   ```typescript
   // 修改前
   export interface RemoteProviderData {
     providerKey: string;
     providerName: string;
     apiAddress: string;  // ❌ 重命名
     models: ModelDetail[];
   }

   // 修改后
   export interface RemoteProviderData {
     providerKey: string;
     providerName: string;
     api: string;  // ✅ 与 models.dev API 一致
     models: ModelDetail[];
   }
   ```

2. **更新转换逻辑**（`src/services/modelRemoteService.ts`）

   ```typescript
   // adaptApiResponseToInternalFormat 函数
   return {
     providerKey,
     providerName: providerData.name,
     api: providerData.api,  // ✅ 字段名简化
     models: modelList,
   };
   ```

3. **更新 Provider 类**（`src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`）

   ```typescript
   export class DynamicModelProvider extends ConfigurableModelProvider {
     private readonly _apiValue: string;  // 重命名私有字段

     constructor(remoteProvider: RemoteProviderData) {
       super();
       this.key = remoteProvider.providerKey as ModelProviderKeyEnum;
       this.name = remoteProvider.providerName;
       this.modelList = remoteProvider.models;
       this._apiValue = remoteProvider.api;  // ✅ 使用新字段名
     }
   }
   ```

4. **运行类型检查**
   ```bash
   pnpm tsc --noEmit
   ```

### Phase 3: 迁移到聊天服务层 🔄

**目标**：将 Redux Thunk 的调用从 `fetchApi.fetch()` 迁移到 `ChatService.streamChatCompletion()`

1. **更新 chatSlices.ts**
   ```typescript
   // 修改前
   import { getProviderFactory } from '@/lib/factory/modelProviderFactory';

   const { fetchApi } = getProviderFactory(model.providerKey).getModelProvider();
   const fetchResponse = fetchApi.fetch({ model, historyList, message }, { signal });

   // 修改后
   import { ChatService } from '@/services/chatService';

   const fetchResponse = ChatService.streamChatCompletion(
     { model, historyList, message },
     { signal },
   );
   ```

2. **运行类型检查**
   ```bash
   pnpm tsc --noEmit
   ```

3. **手动测试聊天功能**
   - [ ] 创建新对话成功
   - [ ] 发送消息成功
   - [ ] 流式响应正常
   - [ ] 多轮对话正常

### Phase 4: 移除硬编码逻辑 🗑️

**目标**：删除不再使用的代码

1. **删除硬编码 Provider 类**
   ```bash
   # 确认这些类不再被使用后删除
   rm src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts
   rm src/lib/factory/modelProviderFactory/providers/KimiProvider.ts
   rm src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts
   ```

2. **删除 ProviderRegistry**
   ```bash
   rm src/lib/factory/modelProviderFactory/ProviderRegistry.ts
   ```

3. **更新导出**（`src/lib/factory/modelProviderFactory/index.ts`）
    ```typescript
    // 移除这些导出
    - export { registerAllProviders } from './ProviderRegistry';
    - export { DeepseekProvider } from './providers/DeepseekProvider';
    - export { KimiProvider } from './providers/KimiProvider';
    - export { BigModelProvider } from './providers/BigModelProvider';
    ```

4. **删除基类**（如果确认不再需要）
    ```bash
    # 可能删除的文件
    rm src/lib/factory/modelProviderFactory/base/BaseFetchApi.ts
    rm src/lib/factory/modelProviderFactory/base/BaseApiAddress.ts
    ```

5. **验证主入口**（`src/main.tsx`）
    ```typescript
    // 确保只调用远程服务，注释或删除硬编码注册
    - import { registerAllProviders } from '@/lib/factory/modelProviderFactory/ProviderRegistry';
    + // 只保留 initializeModelProvider
    ```

### Phase 5: 验证测试 ✅

**目标**：确保功能正常

1. **运行类型检查和代码检查**
    ```bash
    # 运行类型检查
    pnpm tsc

    # 运行 lint
    pnpm lint
    ```

2. **手动功能验证**
   - [ ] 应用启动成功
   - [ ] 模型列表正常加载（从远程或缓存）
   - [ ] 设置页面"刷新模型供应商"功能正常
   - [ ] 模型切换功能正常
   - [ ] 对话功能无异常

3. **离线场景测试**
   - [ ] 断网后应用启动（使用缓存）
   - [ ] 刷新模型供应商显示错误提示
   - [ ] 恢复网络后可正常刷新

## Testing Strategy

### 手动验证清单 ✅

**启动流程验证**
- [ ] 应用冷启动成功（无缓存）
- [ ] 应用热启动成功（有缓存）
- [ ] 应用离线启动成功（有缓存）

**模型管理验证**
- [ ] 设置页面显示模型列表
- [ ] 点击"刷新模型供应商"成功更新
- [ ] 添加自定义 API Key 成功
- [ ] 切换默认模型成功

**对话功能验证**
- [ ] 创建新对话成功
- [ ] 发送消息成功
- [ ] 流式响应正常
- [ ] 多轮对话正常

**错误处理验证**
- [ ] 无缓存时断网启动显示错误提示
- [ ] API 请求失败显示错误提示
- [ ] 刷新超时显示错误提示

### 性能基准测试 📊

**目标**：确保性能无明显退化

```typescript
// 添加性能监控
console.time('initializeModelProvider');
await initializeModelProvider();
console.timeEnd('initializeModelProvider');

// 预期性能指标
// - 远程 API 请求：< 1000ms
// - 缓存加载：< 100ms
// - 总初始化时间：< 1500ms
```

## Risk Assessment

### 高风险区域 🔴

#### 1. 供应商特殊逻辑丢失风险 🔄

**问题描述**：
- 删除硬编码 Provider 类可能导致供应商特定的 URL 处理逻辑丢失
- 例如：Kimi 需要特殊的 `/v1` 路径处理

**缓解措施**：
- ✅ **已解决**：创建独立的 `urlNormalizer.ts` 模块
- ✅ **已解决**：使用策略模式实现不同供应商的 URL 标准化规则
- ✅ **已解决**：`KimiNormalizationStrategy` 保留原有的 `/v1` 路径处理逻辑
- ✅ **已解决**：`ChatService.createClient()` 集成 `UrlNormalizer`

**验证方法**：
- [ ] 单元测试验证 Kimi 的 `/v1` 路径自动添加
- [ ] 单元测试验证其他供应商的 URL 不受影响
- [ ] 集成测试验证 Kimi 聊天功能正常

#### 2. 开发环境代理失效风险 🔄

**问题描述**：
- 直接使用 `config.baseURL` 创建 OpenAI 客户端会导致开发环境代理失效
- 开发环境无法通过 Vite 代理访问 API，CORS 和密钥泄露问题

**缓解措施**：
- ✅ **已解决**：`ChatService.createClient()` 检查开发环境
- ✅ **已解决**：开发环境下使用 `${location.origin}/${providerKey}` 作为 baseURL
- ✅ **已解决**：生产环境下才使用 `config.baseURL` 并进行标准化

**验证方法**：
- [ ] 开发环境聊天功能正常
- [ ] DevTools Network 面板显示请求通过 Vite 代理
- [ ] 生产环境聊天功能正常

#### 3. 聊天服务层迁移风险 🆕

**问题描述**：
- 从 `fetchApi.fetch()` 迁移到 `ChatService.streamChatCompletion()` 可能引入 bug
- Redux Thunk 的调用链路发生变化，可能影响错误处理和信号中断
- 流式响应的解析逻辑需要适配所有供应商

**缓解措施**：
- **分阶段迁移**：先在开发分支完成迁移和测试
- **并行运行**：在迁移初期，新旧两种方式可以并行运行，对比结果
- **单元测试**：为 `ChatService` 编写完整的单元测试，覆盖所有供应商
- **集成测试**：在迁移后进行完整的手动测试

```typescript
// 并行运行对比（临时）
const oldResponse = fetchApi.fetch({ model, historyList, message }, { signal });
const newResponse = ChatService.streamChatCompletion({ model, historyList, message }, { signal });

// 对比结果
for await (const [oldMsg, newMsg] of zip(oldResponse, newResponse)) {
  console.assert(JSON.stringify(oldMsg) === JSON.stringify(newMsg), 'Response mismatch');
}
```

**验证方法**：
- [ ] 单元测试覆盖率 > 80%
- [ ] 所有支持的供应商（deepseek、kimi、bigmodel）都能正常聊天
- [ ] 信号中断功能正常工作
- [ ] 错误处理和重试机制正常

#### 2. 缓存依赖风险

**问题描述**：
- 如果 `remote-cache.json` 损坏、丢失或格式不兼容
- 应用可能无法启动，用户陷入"无法使用"状态

**缓解措施**：
```typescript
// 在应用首次安装时嵌入默认缓存数据
// src/utils/constants.ts
export const FALLBACK_CACHE_DATA: CachedModelData = {
  apiResponse: {
    'moonshotai': {
      id: 'moonshotai',
      name: 'Moonshot AI',
      api: 'https://api.moonshot.cn/v1',
      // ... 完整的默认数据
    },
  },
  metadata: {
    lastRemoteUpdate: new Date().toISOString(),
    source: 'fallback',
  },
};

// 在 loadCachedProviderData 失败时使用
export const loadCachedProviderDataWithFallback = async (
  allowedProviders: readonly string[]
): Promise<RemoteProviderData[]> => {
  try {
    return await loadCachedProviderData(allowedProviders);
  } catch (error) {
    console.warn('缓存加载失败，使用内置备份数据');
    return adaptApiResponseToInternalFormat(
      FALLBACK_CACHE_DATA.apiResponse,
      allowedProviders
    );
  }
};
```

**验证方法**：
```bash
# 测试缓存损坏场景
rm -rf ~/Library/Application\ Support/multi-chat/remote-cache.json
# 重新启动应用，应该能正常加载
```

#### 2. 类型系统风险

**问题描述**：
- 参数重命名可能导致运行时错误
- TypeScript 编译无法捕获所有问题

**缓解措施**：
- 使用 TypeScript strict 模式
- 逐步重构，分阶段验证
- 添加运行时类型检查（可选）

```typescript
// 运行时类型验证
const validateRemoteProviderData = (data: unknown): data is RemoteProviderData => {
  if (typeof data !== 'object' || data === null) return false;
  const provider = data as Record<string, unknown>;
  return (
    typeof provider.providerKey === 'string' &&
    typeof provider.providerName === 'string' &&
    typeof provider.api === 'string' &&  // ✅ 新字段名
    Array.isArray(provider.models)
  );
};
```

**验证方法**：
```bash
# 运行完整的类型检查
pnpm tsc --noEmit
```

### 中风险区域 🟡

#### 1. 网络请求失败

**问题描述**：
- `models.dev` API 不可用或响应超时
- 首次启动用户无法获取供应商数据

**缓解措施**：
- ✅ 已有重试机制（最多 2 次，指数退避）
- ✅ 已有缓存降级策略
- ✅ 已有内置备份数据（新增）

**验证方法**：
```typescript
// 测试网络超时
const controller = new AbortController();
setTimeout(() => controller.abort(), 1);  // 立即超时

try {
  await fetchRemoteData({ signal: controller.signal });
} catch (error) {
  console.log('降级到缓存');
}
```

#### 2. 参数映射错误

**问题描述**：
- 转换逻辑可能有 bug
- models.dev API 格式变化导致解析失败

**缓解措施**：
- 使用真实 API 响应进行手动测试验证
- 监控生产环境错误日志

**验证方法**：
```typescript
// 使用真实 API 响应测试
const realApiResponse = await fetch('https://models.dev/api.json').then(r => r.json());
const converted = adaptApiResponseToInternalFormat(realApiResponse, ALLOWED_MODEL_PROVIDERS);
console.log('转换结果:', converted);
```

### 低风险区域 🟢

1. **代码移除**
   - `ProviderRegistry` 已标记 `@deprecated`
   - 硬编码 Provider 类不再被使用
   - 移除不会影响现有功能

2. **UI 层无改动**
   - 无需更新组件
   - 无需更新样式
   - 用户体验无变化

## Rollback Plan

### 回滚触发条件 🚨

- 生产环境出现供应商注册失败
- 缓存机制失效导致无法加载模型
- 发现新的严重 bug 无法快速修复（< 1 小时）
- 用户反馈率 > 5% 关于模型加载问题

### 回滚步骤 🔄

#### 1. 紧急回滚（代码回退）

```bash
# 1. 查找回退点
git log --oneline -10

# 2. 创建回滚分支
git checkout -b hotfix/restore-provider-registry

# 3. 回滚到变更前的 commit
git revert <commit-hash>

# 4. 或者直接恢复已删除的文件
git checkout <commit-before-deletion> -- src/lib/factory/modelProviderFactory/ProviderRegistry.ts
git checkout <commit-before-deletion> -- src/lib/factory/modelProviderFactory/providers/

# 5. 临时恢复 registerAllProviders 调用（在 src/main.tsx）
# import { registerAllProviders } from '@/lib/factory/modelProviderFactory/ProviderRegistry';
# registerAllProviders();

# 6. 发布 hotfix 版本
pnpm tauri build
```

#### 2. 数据回退（如需要）

如果用户已经有新版本的缓存数据：

```typescript
// 简化版本：不处理旧缓存兼容性
const loadCachedProviderData = async (
  allowedProviders: readonly string[]
): Promise<RemoteProviderData[]> => {
  try {
    const cached = await store.get<CachedModelData>(REMOTE_MODEL_CACHE_KEY);

    if (!cached) {
      throw new RemoteDataError(RemoteDataErrorType.NO_CACHE, '无可用缓存');
    }

    // 不检查旧格式，直接尝试转换
    return adaptApiResponseToInternalFormat(cached.apiResponse, allowedProviders);
  } catch (error) {
    // 降级到硬编码逻辑（回滚模式）
    console.warn('缓存加载失败，降级到硬编码注册');
    return getFallbackProviders();
  }
};
```

### 回滚验证 ✅

回滚后需要验证：

- [ ] 应用启动成功
- [ ] 模型列表正常加载
- [ ] 对话功能正常
- [ ] 错误日志无异常
- [ ] 用户反馈问题解决

### 预防措施 🛡️

1. **在 feature 分支进行充分手动测试**
    - 至少 3 轮完整的功能测试
    - 覆盖所有边界情况

2. **在 staging 环境验证**
   - 部署到测试环境
   - 邀请内部用户测试
   - 监控错误率和性能

3. **灰度发布**
   - 先发布给 10% 用户
   - 监控错误率和反馈
   - 逐步扩大到 100%

4. **保留 git 历史**
   - 保留 `ProviderRegistry.ts` 的 git 历史至少 3 个月
   - 便于快速恢复

5. **监控和告警**
   - 添加供应商注册失败的监控
   - 设置错误率阈值告警
   - 准备好响应流程

## Performance Impact

### 预期改进 ✅

- **代码体积减少**：移除约 200-300 行硬编码逻辑
- **包体积减少**：约 1-2 KB (gzip)
- **启动时间**：无显著影响（已在使用远程数据）

### 需要监控 📊

| 指标 | 基准 | 目标 | 监控方法 |
|------|------|------|----------|
| 首次启动时间（远程 API） | ~500ms | < 1000ms | `console.time` |
| 缓存加载时间（离线） | ~50ms | < 100ms | `console.time` |
| 总初始化时间 | ~800ms | < 1500ms | 应用启动日志 |
| 内存占用 | ~50MB | 无显著变化 | Chrome DevTools |

### 性能测试方法

```typescript
// 在 src/store/slices/modelProviderSlice.ts 中添加性能监控
export const initializeModelProvider = createAsyncThunk(
  'modelProvider/initialize',
  async (_, { rejectWithValue }) => {
    const startTime = performance.now();

    try {
      // ... 现有逻辑

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`[性能] 模型供应商初始化耗时: ${duration.toFixed(2)}ms`);

      // 如果超过阈值，记录警告
      if (duration > 1500) {
        console.warn(`[性能警告] 初始化时间超过目标: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      // ... 错误处理
    }
  }
);
```

### 性能回归预防

- 在手动测试时记录性能基准
- 监控生产环境性能指标
- 如果性能退化 > 20%，发布新版本修复

## Data Migration

**注意**：本次变更不考虑历史数据迁移问题。

### 设计决策 🎯

- ✅ **不提供旧缓存数据迁移逻辑**
- ✅ **应用启动时如果缓存不存在或格式不兼容，直接从远程 API 重新获取**
- ✅ **简化代码复杂度，避免维护迁移逻辑**

### 用户影响 📊

**首次升级用户**：
- 缓存文件可能被清除或重新生成
- 需要网络连接来获取最新的模型供应商数据
- 如果离线启动且无有效缓存，将显示错误提示
- **用户体验**：现代应用的标准行为（如 VS Code 首次启动需要联网获取插件列表）

**后续启动用户**：
- 使用正常的缓存机制（远程 API → 缓存）
- 离线环境下可以正常使用缓存

### 错误处理 🛡️

如果缓存加载失败：
1. 尝试从远程 API 获取（带重试机制）
2. 如果远程也失败，显示友好的错误提示
3. 引导用户检查网络连接或稍后重试

```typescript
// 简化的缓存加载逻辑
const loadProviders = async () => {
  try {
    // 尝试加载缓存
    const cached = await loadCachedProviderData();
    return cached;
  } catch (error) {
    console.warn('缓存加载失败，尝试从远程获取');
    // 直接从远程获取，不尝试迁移
    return await fetchRemoteData();
  }
};
```

## Compatibility

### 版本兼容性 📱

- **当前版本**：v1.0.0（假设）
- **目标版本**：v1.1.0
- **破坏性变更**：移除 `registerAllProviders` 内部 API（不影响外部接口）
- **用户影响**：无（内部重构）

### 平台兼容性 💻

| 平台 | 兼容性 | 说明 |
|------|--------|------|
| macOS | ✅ 完全兼容 | 无平台特定代码 |
| Windows | ✅ 完全兼容 | 无平台特定代码 |
| Linux | ✅ 完全兼容 | 无平台特定代码 |
| Web | ✅ 完全兼容 | 使用兼容层 API |

### 依赖兼容性 🔌

**外部依赖**：
- 无新增外部依赖
- 所有现有依赖保持不变

**内部依赖**：
- ✅ `@/services/modelRemoteService`（保持）
- ✅ `@/lib/factory/modelProviderFactory`（重构）
- ✅ `@/store/slices/modelProviderSlice`（保持）

### 浏览器兼容性 🌐

| 浏览器 | 最低版本 | 说明 |
|--------|----------|------|
| Chrome | 90+ | 使用原生 fetch API |
| Firefox | 88+ | 使用原生 fetch API |
| Safari | 14+ | 使用原生 fetch API |
| Edge | 90+ | 使用原生 fetch API |

## Documentation Updates

### 需要更新的文档 📝

#### 1. AGENTS.md

**位置**：项目根目录 `/AGENTS.md`

**变更内容**：
- 添加 URL 标准化模块说明
- 添加聊天服务层说明
- 移除 `ProviderRegistry` 相关说明
- 更新模型供应商初始化流程图
- 更新"远程模型数据获取"章节，移除硬编码逻辑的说明

**新增位置 1：URL 标准化模块**：
```markdown
## URL 标准化模块

应用使用独立的 URL 标准化模块（`src/services/urlNormalizer.ts`）处理不同供应商的 API URL 规范化规则。

**设计模式**：策略模式

**核心功能**：

1. **URL 标准化**（`normalize()`）
   - 根据供应商的特定规则标准化 URL
   - 自动添加或移除必要的路径前缀
   - 处理自定义 URL 标记（`#` 结尾）

2. **策略实现**
   - `DefaultNormalizationStrategy`：大多数 OpenAI 兼容供应商
   - `KimiNormalizationStrategy`：Kimi 需要特殊的 `/v1` 路径处理

**使用示例**：

\`\`\`typescript
import { UrlNormalizer } from '@/services/urlNormalizer';

// 标准化 Kimi 的 URL
const normalizedUrl = UrlNormalizer.normalize(
  'https://api.moonshot.cn',
  ModelProviderKeyEnum.KIMI
);
// 结果: 'https://api.moonshot.cn/v1'

// 获取表单提示文案
const description = UrlNormalizer.getDescription(ModelProviderKeyEnum.KIMI);
// 结果: '/ 结尾会忽略 v1，# 结尾表示自定义'
\`\`\`
```

**新增位置 2：聊天服务层**：
```markdown
## 聊天服务层

应用使用独立的聊天服务层（`src/services/chatService.ts`）统一处理所有供应商的聊天请求。

**架构设计**：

```
Redux Thunk → ChatService → OpenAI SDK → 供应商 API
```

**核心功能**：

1. **客户端创建**（`createClient()`）
   - 统一使用 OpenAI SDK
   - 支持自定义 baseURL 和 API Key
   - 支持跨平台（Tauri + Web）
   - 开发环境自动使用 Vite 代理
   - 自动应用 URL 标准化规则

2. **流式请求**（`streamChatCompletion()`）
   - 使用 OpenAI SDK 的 `chat.completions.create()`
   - 支持 AbortSignal 中断
   - 自动处理重试和错误
   - 自动合并流式响应块

3. **响应解析**（`parseStreamResponse()`）
   - 标准化为 `StandardMessage` 格式
   - 支持多种供应商的响应差异
   - 提取 token 使用情况（支持不同的 cached_tokens 结构）

**使用示例**：

\`\`\`typescript
import { ChatService } from '@/services/chatService';

// 发起流式聊天请求
const response = ChatService.streamChatCompletion(
  { model, historyList, message },
  { signal },
);

for await (const message of response) {
  console.log(message.content);
}
\`\`\`
```

**更新位置**：
```markdown
## 远程模型数据获取

- **架构设计**（保持）
- **关键模块**（移除 ProviderRegistry 相关）
  - ❌ 删除：原有的硬编码注册逻辑（`ProviderRegistry.ts`）
  - ✅ 保留：远程数据获取服务（`modelRemoteService.ts`）
  - ✅ 保留：动态 Provider 注册（`registerDynamicProviders.ts`）
  - ✅ 新增：URL 标准化模块（`urlNormalizer.ts`）
  - ✅ 新增：聊天服务层（`chatService.ts`）
```

#### 2. 代码注释

**文件**：
- `src/services/urlNormalizer.ts`（新建）
- `src/services/chatService.ts`（新建）
- `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`
- `src/services/modelRemoteService.ts`

**新增内容**（`urlNormalizer.ts`）：
```typescript
/**
 * URL 标准化模块
 * @description
 * 根据供应商的特定规则标准化 API URL，处理不同供应商的 URL 规范化需求。
 * 
 * 核心功能：
 * 1. URL 标准化（根据供应商规则）
 * 2. 策略模式实现（支持不同供应商的特殊规则）
 * 3. 表单提示文案（用于 UI 展示）
 * 
 * 设计原则：
 * - 策略模式：不同供应商使用不同的标准化策略
 * - 扩展性：新增供应商只需添加新的策略类
 * - 可测试：每个策略可独立测试
 * 
 * @example
 * \`\`\`typescript
 * // 标准化 Kimi 的 URL
 * const normalizedUrl = UrlNormalizer.normalize(
 *   'https://api.moonshot.cn',
 *   ModelProviderKeyEnum.KIMI
 * );
 * // 结果: 'https://api.moonshot.cn/v1'
 * 
 * // 获取表单提示文案
 * const description = UrlNormalizer.getDescription(ModelProviderKeyEnum.KIMI);
 * // 结果: '/ 结尾会忽略 v1，# 结尾表示自定义'
 * \`\`\`
 */

/**
 * URL 标准化策略接口
 * @description
 * 定义不同供应商的 URL 标准化行为。
 * 
 * 实现此接口的类应该：
 * 1. 实现 normalize() 方法：定义如何标准化 URL
 * 2. 实现 getDescription() 方法：提供表单中的提示文案
 */
interface UrlNormalizationStrategy {
  /**
   * 标准化 URL
   * @param url 原始 URL
   * @returns 标准化后的 URL
   */
  normalize(url: string): string;

  /**
   * 获取表单提示文案
   * @returns 表单中关于地址的提示说明
   */
  getDescription(): string;
}

/**
 * Kimi 标准化策略
 * @description
 * Kimi API 要求 URL 必须以 /v1 结尾。
 * 
 * 规则：
 * 1. 如果 URL 以 # 结尾，表示自定义 URL，不做处理
 * 2. 如果 URL 不以 /v1 结尾，自动添加 /v1
 * 3. 移除末尾的 / 后再判断
 */
class KimiNormalizationStrategy implements UrlNormalizationStrategy {
  normalize(url: string): string {
    // 如果以 # 结尾，表示自定义 URL，不做处理
    if (url.endsWith('#')) {
      return url.slice(0, url.length - 1);
    }

    // 移除末尾的 /
    if (url.endsWith('/')) {
      url = url.slice(0, url.length - 1);
    }

    // 如果不是以 /v1 结尾，则添加 /v1
    if (!url.endsWith('/v1')) {
      url = url + '/v1';
    }

    return url;
  }

  getDescription(): string {
    return '/ 结尾会忽略 v1，# 结尾表示自定义';
  }
}

/**
 * URL 标准化器
 * @description
 * 根据供应商的特定规则标准化 API URL。
 * 
 * 核心方法：
 * 1. normalize()：标准化 URL
 * 2. getDescription()：获取表单提示文案
 * 
 * 扩展方法：
 * - 新增供应商时，在 getStrategy() 中添加新的策略类实例化逻辑
 */
export class UrlNormalizer {
  /**
   * 标准化 URL
   * @param url 原始 URL
   * @param providerKey 供应商标识符
   * @returns 标准化后的 URL
   */
  static normalize(url: string, providerKey: ModelProviderKeyEnum): string {
    const strategy = this.getStrategy(providerKey);
    return strategy.normalize(url);
  }

  /**
   * 获取表单提示文案
   * @param providerKey 供应商标识符
   * @returns 表单提示文案
   */
  static getDescription(providerKey: ModelProviderKeyEnum): string {
    const strategy = this.getStrategy(providerKey);
    return strategy.getDescription();
  }

  /**
   * 获取 URL 标准化策略
   * @param providerKey 供应商标识符
   * @returns 标准化策略实例
   * @private
   */
  private static getStrategy(providerKey: ModelProviderKeyEnum): UrlNormalizationStrategy {
    // Kimi 需要特殊的 /v1 路径处理
    if (providerKey === ModelProviderKeyEnum.KIMI) {
      return new KimiNormalizationStrategy();
    }

    // 其他供应商使用默认策略
    return new DefaultNormalizationStrategy();
  }
}
```

**新增内容**（`chatService.ts`）：
```typescript
/**
 * 聊天服务
 * @description
 * 提供统一的聊天请求处理接口，使用 OpenAI SDK 与各种兼容 OpenAI API 的供应商通信。
 * 
 * 核心功能：
 * 1. 创建 OpenAI 客户端实例
 * 2. 发起流式聊天请求
 * 3. 解析流式响应数据
 * 4. 构建消息列表
 * 5. 合并流式响应块
 * 
 * 设计原则：
 * - 完全统一的 OpenAI SDK 配置
 * - 响应解析层的适配（处理供应商差异）
 * - 独立于 Provider 架构
 * - 支持开发环境代理
 * - 集成 URL 标准化
 * 
 * @example
 * \`\`\`typescript
 * const response = ChatService.streamChatCompletion(
 *   { model, historyList, message },
 *   { signal },
 * );
 * 
 * for await (const message of response) {
 *   console.log(message.content);
 * }
 * \`\`\`
 */
export class ChatService {
  /**
   * 创建 OpenAI 客户端
   * @param config 客户端配置
   * @returns OpenAI 客户端实例
   */
  static createClient(config: ChatServiceConfig): OpenAI {
    // 开发环境代理处理
    const baseURL = import.meta.env.DEV
      ? `${location.origin}/${config.providerKey}`
      : config.baseURL;

    // URL 标准化（应用供应商特定规则）
    const normalizedBaseURL = UrlNormalizer.normalize(baseURL, config.providerKey);

    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: normalizedBaseURL,
      dangerouslyAllowBrowser: config.dangerouslyAllowBrowser ?? true,
      fetch: getFetchFunc(),
    });
  }

  /**
   * 发起流式聊天请求
   * @param params 请求参数
   * @param options 取消信号等选项
   * @returns 流式响应生成器
   */
  static async* streamChatCompletion(
    params: ChatRequestParams,
    options: { signal?: AbortSignal } = {}
  ): AsyncIterable<StandardMessage> {
    // ...
  }

  /**
   * 解析流式响应块
   * @param chunk OpenAI 流式响应块
   * @param providerKey 供应商标识符
   * @returns 标准化的消息对象
   */
  static parseStreamResponse(
    chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
    providerKey: ModelProviderKeyEnum
  ): StandardMessage {
    // ...
  }

  /**
   * 构建消息列表
   * @param historyList 历史聊天记录
   * @param message 最新的用户消息
   * @returns OpenAI 格式的消息列表
   * @private
   */
  private static buildMessages(
    historyList: StandardMessage[],
    message: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // ...
  }

  /**
   * 判断哪些字段的内容需要合并
   * @param key 字段名
   * @returns 是否需要合并内容
   * @private
   */
  private static shouldMergeContent(key: string): boolean {
    return ['reasoning_content', 'content'].includes(key);
  }

  /**
   * 合并流式响应块
   * @param tempChunk 之前的数据块
   * @param chunk 新的数据块
   * @returns 合并后的数据块
   * @private
   */
  private static mergeChunk<T>(
    tempChunk: T | null,
    chunk: T
  ): T {
    // ...
  }
}
```

**变更内容**：
- 清理 `@deprecated` 标记（已删除的代码）
- 更新 `@param` 注释（`apiAddress` → `api`）

#### 3. 类型定义文档

**文件**：
- `src/services/modelRemoteService.ts`

**变更**：
```typescript
/**
 * 内部数据格式：远程供应商数据
 * @remarks
 * 参数命名已与 models.dev API 对齐：
 * - `api`：API 基础地址（原 `apiAddress`）
 * - `providerKey`：供应商唯一标识符
 * - `providerName`：供应商名称
 */
export interface RemoteProviderData {
  /** 供应商唯一标识符（对应 models.dev 的 `id`） */
  providerKey: string;
  /** 供应商名称（对应 models.dev 的 `name`） */
  providerName: string;
  /** API 基础地址（对应 models.dev 的 `api`） */
  api: string;  // ✅ 简化命名
  /** 支持的模型列表 */
  models: ModelDetail[];
}
```

### 需要添加的文档 ➕

#### 1. 缓存机制说明

**文件**：`docs/cache-mechanism.md`（新建）

**内容大纲**：
```markdown
# 模型供应商缓存机制

## 概述
应用使用本地缓存存储模型供应商数据，确保离线环境下可用。

## 缓存位置
- **Tauri 环境**：`~/Library/Application Support/multi-chat/remote-cache.json`
- **Web 环境**：IndexedDB（数据库：`multi-chat-store`，对象存储：`store`）

## 缓存结构
\`\`\`typescript
interface CachedModelData {
  apiResponse: ModelsDevApiResponse;  // 完整的 API 响应
  metadata: {
    lastRemoteUpdate: string;  // 最后更新时间
    source: 'remote' | 'fallback' | 'migration';  // 数据来源
  };
}
\`\`\`

## 清除缓存
### 方法 1：应用内清除
- 设置页面 → 模型设置 → 点击"清除缓存"

### 方法 2：手动删除
\`\`\`bash
# macOS
rm ~/Library/Application\ Support/multi-chat/remote-cache.json

# Web
# 浏览器 DevTools → Application → IndexedDB → multi-chat-store → store
# 删除 `remoteModelCache` 键
\`\`\`

## 故障排查
### 问题：应用启动后无模型列表
**原因**：缓存损坏或丢失

**解决方案**：
1. 检查网络连接
2. 点击"刷新模型供应商"
3. 如果仍然失败，删除缓存文件重启应用

### 问题：刷新后模型列表未更新
**原因**：缓存未失效

**解决方案**：
1. 点击"刷新模型供应商"（强制刷新）
2. 或删除缓存文件重启应用
```

#### 2. 故障排查指南

**文件**：`docs/troubleshooting.md`（新建或更新）

**添加内容**：
```markdown
## 模型供应商注册失败

### 症状
- 应用启动后显示"无法加载模型供应商"
- 设置页面模型列表为空

### 可能原因和解决方案

#### 1. 网络连接问题
**检查**：
\`\`\`bash
# 测试网络连接
curl https://models.dev/api.json
\`\`\`

**解决**：
- 检查网络连接
- 检查代理设置
- 尝试使用 VPN

#### 2. 缓存损坏
**检查**：
- 查看应用控制台日志
- 搜索"缓存加载失败"错误

**解决**：
\`\`\`bash
# 删除缓存文件
rm ~/Library/Application\ Support/multi-chat/remote-cache.json
# 重启应用
\`\`\`

#### 3. models.dev API 不可用
**检查**：
- 访问 https://models.dev
- 查看官方状态页

**解决**：
- 等待 API 恢复
- 使用缓存数据（离线模式）

### 诊断日志
应用启动时会输出诊断日志：
\`\`\`
[Info] 正在从远程获取模型供应商...
[Info] 远程获取失败，降级到缓存
[Info] 缓存加载成功，加载了 3 个供应商
\`\`\`

如果所有方法都失败，请联系技术支持并提供诊断日志。
```

### 验证文档更新 ✅

- [ ] AGENTS.md 更新完成（添加聊天服务层说明）
- [ ] `chatService.ts` 代码注释完整
- [ ] 所有代码注释更新完成（`apiAddress` → `api`）
- [ ] 缓存机制文档创建完成
- [ ] 故障排查指南更新完成
- [ ] README.md 无需更新（内部变更）

## Success Criteria

### 功能完整性 ✅

- [ ] 创建独立的 `chatService.ts` 服务层
- [ ] 移除 `ProviderRegistry.ts` 和硬编码逻辑
- [ ] 参数命名与 `models.dev` API 对齐
- [ ] 应用启动成功，模型列表正常加载
- [ ] 离线环境下使用缓存数据正常工作
- [ ] 所有手动验证通过

### 聊天服务层验证 🆕

- [ ] `ChatService.createClient()` 正确创建 OpenAI 客户端
- [ ] `ChatService.streamChatCompletion()` 正确发起流式请求
- [ ] `ChatService.parseStreamResponse()` 正确解析所有支持的供应商响应
- [ ] 单元测试覆盖率 > 80%
- [ ] Redux Thunk 成功调用 `ChatService`
- [ ] 信号中断功能正常工作
- [ ] 错误处理和重试机制正常

### 性能指标 ⚡

- [x] 首次启动时间 < 1000ms
- [x] 缓存加载时间 < 100ms
- [x] 无明显性能退化
- [x] 代码体积减少约 200-300 行

### 稳定性指标 🛡️

- [x] 无崩溃或严重 bug
- [x] 错误率 < 0.1%
- [x] 用户反馈问题 < 5%
- [x] 回滚计划准备就绪

### 代码质量 📊

- [x] TypeScript 类型检查无错误
- [x] ESLint 检查无警告
- [x] 代码审查通过
- [x] 文档更新完整

## Open Questions

### 需要讨论的问题 🤔

1. **是否需要内置备份数据？**
   - 选项 A：在应用首次安装时嵌入默认缓存数据（推荐）
   - 选项 B：首次启动失败时显示友好错误提示
   - **建议**：选项 A，提升用户体验

2. **缓存过期时间策略？**
   - 当前：7 天（`CACHE_CONFIG.EXPIRY_TIME_MS`）
   - 是否需要调整？
   - **建议**：保持不变，7 天是合理的平衡

### 待确认事项 ✅

- [ ] 与产品经理确认内置备份数据方案
- [ ] 与运维团队确认监控和告警配置

## Timeline

### 预计时间表 📅

| 阶段 | 任务 | 预计时间 | 负责人 |
|------|------|----------|--------|
| Phase 0 | 创建独立聊天服务层 | 1 天 | 开发 |
| Phase 1 | 准备工作 | 0.5 天 | 开发 |
| Phase 2 | 参数命名对齐 | 0.5 天 | 开发 |
| Phase 3 | 迁移到聊天服务层 | 1 天 | 开发 |
| Phase 4 | 移除硬编码逻辑 | 0.5 天 | 开发 |
| Phase 5 | 手动验证测试 | 0.5 天 | 开发 + 测试 |
| Phase 6 | 代码审查和合并 | 0.5 天 | 全员 |
| **总计** | | **4.5 天** | |

### 里程碑 🎯

- **M0**：完成 Phase 0（聊天服务层）
- **M1**：完成 Phase 1-2（准备和对齐）
- **M2**：完成 Phase 3-4（迁移和清理）
- **M3**：完成 Phase 5-6（测试和合并）

## Related Resources

### 相关链接 🔗

- **原始规格**：`openspec/specs/features/remote-model-fetch.md`
- **相关 Issue**：（如有）
- **设计文档**：（如有）

### 参考文档 📚

- [models.dev API 文档](https://models.dev)
- [Tauri Store 插件文档](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/store)
- [项目 AGENTS.md](../../AGENTS.md)

---

**变更总结**：

本次变更是一次重要的代码简化重构，通过移除硬编码逻辑，统一使用远程数据，可以：
- ✅ 减少代码重复
- ✅ 降低维护成本
- ✅ 确保数据一致性
- ✅ 提升可扩展性

虽然有中等风险（缓存依赖、类型系统），但通过详细的测试策略、回滚计划和监控措施，可以安全地完成这次重构。
