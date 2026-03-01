# 技术设计：使用 ai-sdk 替换 openai 包

## Context

**当前状态**

项目当前使用 `openai` 包（v6.9.0）处理所有 AI 聊天请求。核心实现在 `src/services/chatService.ts` 中，使用 OpenAI SDK 的 `chat.completions.create()` 方法发起流式聊天请求。该实现存在以下特点：

- 通过自定义 baseURL 配置支持非 OpenAI 供应商（DeepSeek、Kimi、Zhipu）
- 手动实现流式响应块合并逻辑（`parseStreamResponse()` 函数）
- 手动解析不同供应商的 token 使用情况（处理 `cached_tokens` 等字段差异）
- 使用 `urlNormalizer.ts` 处理不同供应商的 URL 标准化规则
- `ModelProviderKeyEnum` 枚举包含 `OPEN_AI`、`DEEPSEEK`、`KIMI`、`BIG_MODEL` 四个值

**约束条件**

- 用户在应用设置中手动填写 API Key，运行时动态配置
- 开发环境需要使用 Vite 代理（`/api/proxy`）以绕过 CORS 限制
- 生产环境（Tauri 桌面应用）直接发起网络请求
- 必须保持 `StandardMessage` 返回格式不变，确保 Redux Thunk 和 UI 层无需修改
- 必须保持 `ChatService.streamChatCompletion()` 函数签名不变
- 应用支持 Tauri 桌面环境和 Web 浏览器环境（使用 `@/utils/tauriCompat` 的 fetch 函数）

**利益相关者**

- 前端开发者：维护 `ChatService` 和相关类型定义
- 用户：填写 API Key，使用聊天功能（期望无缝迁移，无感知变更）

## Goals / Non-Goals

**Goals:**

1. 将 `chatService.ts` 的底层实现从 OpenAI SDK 迁移到 Vercel AI SDK（ai-sdk）
2. 使用供应商官方的 ai-sdk provider 包（`@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`zhipu-ai-provider`），替代通用的 OpenAI SDK + baseURL 配置
3. 简化流式响应处理逻辑，利用 ai-sdk 的内置功能
4. 移除不再需要的 URL 标准化逻辑（`urlNormalizer.ts`）
5. 保持对 Redux Thunk 和 UI 层的透明性（无需修改调用代码）
6. 确保开发环境和生产环境的代理逻辑继续工作

**Non-Goals:**

- 修改 `StandardMessage` 接口定义（保持稳定）
- 修改 `ChatService.streamChatCompletion()` 的函数签名
- 修改 Redux Thunk 中的调用逻辑
- 修改 UI 层组件代码
- 更新或修改远程模型数据获取服务（`modelRemoteService.ts`）
- 更新或修改加密存储逻辑（`crypto.ts`、`masterKey.ts`）

## Decisions

### 决策 1：使用供应商特定的 ai-sdk provider 包

**选择**：为每个供应商使用其官方的 ai-sdk provider 包（`@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`zhipu-ai-provider`），而不是使用通用的 `@ai-sdk/openai` 包配合 baseURL 配置。

**理由**：

- **供应商特定的优化**：官方 provider 包针对供应商 API 的特殊行为进行了优化（如重试逻辑、错误处理、速率限制）
- **自动处理 API 差异**：不同供应商的 API 细节差异（如 URL 路径、请求头、响应格式）由官方 provider 自动处理，无需手动维护
- **更好的类型安全**：每个 provider 包包含供应商特定的类型定义，IDE 自动补全更准确
- **减少依赖**：不需要引入 `@ai-sdk/openai` 包作为中间层
- **未来可扩展性**：添加新供应商时，只需安装其官方 provider 包并添加对应的 `case` 分支

**替代方案**：

- 使用 `@ai-sdk/openai` 配合 baseURL：虽然可行，但失去了供应商特定的优化，且仍需手动处理 URL 标准化。

### 决策 2：使用工厂函数创建 provider 实例

**选择**：使用 `createDeepSeek({ apiKey })`、`createMoonshotAI({ apiKey })`、`createZhipu({ apiKey })` 等工厂函数动态创建 provider 实例。

**理由**：

- **动态 API Key**：用户的 API Key 在运行时从加密存储中读取，无法在构建时配置
- **灵活性**：同一用户可能使用不同供应商的 API Key，工厂函数支持动态切换
- **符合 ai-sdk 最佳实践**：官方推荐在需要动态配置时使用工厂函数

**替代方案**：

- 使用预配置的 `xxx()` 函数：不适用于此场景，因为无法在构建时获取用户 API Key。

### 决策 3：保持 `StandardMessage` 接口不变

**选择**：不修改 `StandardMessage` 接口定义，继续作为 `ChatService.streamChatCompletion()` 的返回格式。

**理由**：

- **向后兼容**：Redux Thunk 和 UI 层无需修改，降低迁移风险
- **降低测试成本**：无需重写上层逻辑的测试用例
- **渐进式迁移**：可以独立验证 `ChatService` 的正确性，不影响其他模块

**实现策略**：

- 将 ai-sdk 的流式响应（`StreamTextResult`）转换为现有的 `StandardMessage` 格式
- 在 `streamChatCompletion()` 函数内部实现格式转换，对外透明

### 决策 4：移除 `urlNormalizer.ts` 模块

**选择**：删除 `src/services/urlNormalizer.ts` 模块及其相关引用。

**理由**：

- **不再需要**：供应商官方 provider 自动处理 URL 标准化（如 Kimi 的 `/v1` 路径）
- **简化维护**：减少手动维护 URL 规则的负担
- **降低错误风险**：避免因供应商 API 变更导致的 URL 标准化逻辑失效

**迁移步骤**：

1. 删除 `src/services/urlNormalizer.ts` 文件
2. 从 `src/services/chatService.ts` 中移除相关导入和使用

### 决策 5：使用 ai-sdk 的 `streamText` 函数

**选择**：使用 ai-sdk 的 `streamText()` 函数替代 OpenAI SDK 的 `chat.completions.create()`。

**理由**：

- **统一的 API**：`streamText()` 支持所有 ai-sdk provider，无需为每个供应商写不同的逻辑
- **简化的流式处理**：`streamText()` 返回的 `StreamTextResult` 提供 `textStream` 和 `fullStream`，自动处理数据块合并
- **内置工具调用支持**：未来如需添加 function calling 功能，`streamText()` 原生支持
- **更好的类型推断**：TypeScript 类型自动推断模型参数和响应格式

**代码结构**：

```typescript
import { streamText } from 'ai';

function streamChatCompletion(params: ChatParams, options: RequestOptions): AsyncGenerator<StandardMessage> {
  const provider = getProvider(params.providerKey, params.apiKey);
  const result = streamText({
    model: provider(params.model),
    messages: params.historyList,
    temperature: params.temperature,
  });

  // 将 result.textStream 转换为 StandardMessage 格式
  // ...
}
```

### 决策 6：使用 `@/utils/tauriCompat` 的 fetch 函数

**选择**：将 ai-sdk 的 fetch 配置指向 `@/utils/tauriCompat` 的 `getFetchFunc()`，确保跨平台兼容。

**理由**：

- **现有兼容层**：项目已实现 Tauri 和 Web 环境的 fetch 兼容层
- **开发环境代理**：开发环境自动使用 Vite 代理，绕过 CORS 限制
- **生产环境优化**：生产环境 Tauri 使用系统代理，Web 使用原生 fetch

**实现方式**：

```typescript
import { getFetchFunc } from '@/utils/tauriCompat';

const result = streamText({
  model: provider(modelId),
  messages,
  fetch: getFetchFunc(), // 注入兼容层 fetch 函数
});
```

## Architecture

### 新的 `ChatService` 架构

```
ChatService.streamChatCompletion()
    ↓
getProvider(providerKey, apiKey) → 返回供应商特定的 provider 工厂函数
    ↓
streamText({ model, messages, fetch })
    ↓
解析 ai-sdk 流式响应 → 转换为 StandardMessage 格式
    ↓
AsyncGenerator<StandardMessage> → 返回给 Redux Thunk
```

### 关键模块

#### 1. `getProvider()` 函数

```typescript
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';
import type { LanguageModelV1 } from 'ai';

function getProvider(providerKey: ModelProviderKeyEnum, apiKey: string, baseURL: string): (modelId: string) => LanguageModelV1 {
  const providerInstance = (() => {
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
  })();

  return (modelId: string) => providerInstance(modelId);
}
```

#### 2. `streamChatCompletion()` 函数

```typescript
import { streamText } from 'ai';
import { getFetchFunc } from '@/utils/tauriCompat';

async function* streamChatCompletion(
  params: ChatParams,
  options: RequestOptions
): AsyncGenerator<StandardMessage> {
  const provider = getProvider(params.providerKey, params.apiKey, params.baseURL);

  const result = streamText({
    model: provider(params.model),
    messages: params.historyList,
    temperature: params.temperature,
    fetch: getFetchFunc(),
    abortSignal: options.signal,
  });

  // 转换为 StandardMessage 格式
  for await (const textPart of result.textStream) {
    yield {
      role: 'assistant',
      content: textPart,
    };
  }

  // 解析 token 使用情况（从 result.usage）
  const { usage } = await result;
  // ... 处理 usage 数据
}
```

#### 3. URL 标准化逻辑移除

- 删除 `src/services/urlNormalizer.ts`
- 从 `src/services/chatService.ts` 中移除相关导入

#### 4. 枚举更新

```typescript
// src/utils/enums.ts
export enum ModelProviderKeyEnum {
  DEEPSEEK = 'deepseek',
  KIMI = 'kimi',
  BIG_MODEL = 'bigmodel',
  // 移除 OPEN_AI = 'openai'
}
```

### 类型定义调整

无需修改 `src/types/chat.ts` 中的 `StandardMessage` 接口，但可能需要添加 ai-sdk 相关的类型导入：

```typescript
import type { CoreMessage } from 'ai';

// 可选：将 historyList 的类型从 CustomMessage[] 改为 CoreMessage[]
// 但为了最小化变更，可以先保持现有类型，在 streamChatCompletion 内部进行转换
```

## Risks / Trade-offs

### 风险 1：ai-sdk provider 包不存在或不可用

**风险**：某个供应商（如 Zhipu）的官方 ai-sdk provider 包可能不存在、未维护或功能不完整。

**缓解措施**：

- 在实施前验证所有三个供应商的 provider 包是否可用
- 检查 provider 包的版本活跃度和维护状态
- 如某个 provider 不可用，回退到使用 `@ai-sdk/openai` 配合 baseURL 配置

### 风险 2：ai-sdk 的 fetch 配置不兼容 Tauri 环境

**风险**：ai-sdk 的 `fetch` 配置可能与 `@/utils/tauriCompat` 的 fetch 函数不兼容，导致 Tauri 环境下网络请求失败。

**缓解措施**：

- 在开发环境优先测试 Tauri 桌面应用的网络请求
- 验证 `getFetchFunc()` 返回的函数签名是否符合 ai-sdk 的期望
- 如不兼容，考虑在 ai-sdk 外部封装一层 fetch 适配器

### 风险 3：流式响应格式转换引入 Bug

**风险**：将 ai-sdk 的 `textStream` 转换为 `StandardMessage` 格式时，可能出现数据丢失或格式错误。

**缓解措施**：

- 编写单元测试覆盖各种流式响应场景（空消息、长消息、多轮对话）
- 使用现有 OpenAI SDK 实现的响应数据作为基准，验证 ai-sdk 实现的一致性
- 在开发环境中手动测试三个供应商的实际聊天流程

### 风险 4：依赖版本冲突

**风险**：新增的 `ai` 和相关 provider 包可能与现有依赖（如 React、Vite）存在版本冲突。

**缓解措施**：

- 在实施前查看 `ai` 包的 peerDependencies 要求
- 使用 `pnpm install` 进行依赖安装，利用 pnpm 的依赖解析能力
- 构建项目并检查是否有 TypeScript 类型错误或构建警告

### 风险 5：远程模型数据获取服务的兼容性

**风险**：移除 `OPEN_AI` 枚举值后，`modelRemoteService.ts` 中的 `ALLOWED_MODEL_PROVIDERS` 白名单可能需要更新。

**缓解措施**：

- 检查 `src/utils/constants.ts` 中的 `ALLOWED_MODEL_PROVIDERS` 是否包含 `OPEN_AI`
- 如包含，从白名单中移除，但保留其他三个供应商
- 验证远程 API 数据加载和缓存功能正常工作

### Trade-off：更简化的代码 vs 学习新依赖

**权衡**：引入 ai-sdk 和多个 provider 包增加了依赖数量，开发者需要学习新的 API。

**优势**：

- 代码更简洁，减少手动维护 URL 标准化、流式响应合并等逻辑
- 供应商切换更容易，未来扩展新供应商的成本更低
- 利用官方优化，可能获得更好的性能和稳定性

**劣势**：

- 团队需要熟悉 ai-sdk 的 API 和最佳实践
- 多个 provider 包增加了 `node_modules` 体积（但 ai-sdk 本身体积小于 OpenAI SDK）

**结论**：长期来看，引入 ai-sdk 的收益大于成本。

## Migration Plan

### 阶段 1：依赖安装和类型准备（1-2 小时）

1. 安装 ai-sdk 核心包和供应商 provider 包：
   ```bash
   pnpm add ai @ai-sdk/deepseek @ai-sdk/moonshotai zhipu-ai-provider
   ```

2. 移除 openai 包：
   ```bash
   pnpm remove openai
   ```

3. 运行类型检查，确认无类型错误：
   ```bash
   pnpm tsc
   ```

4. 更新 `src/utils/enums.ts`，移除 `ModelProviderKeyEnum.OPEN_AI`

### 阶段 2：重构 `ChatService`（2-3 小时）

1. 在 `src/services/chatService.ts` 中导入 ai-sdk 相关模块：
   ```typescript
   import { streamText } from 'ai';
   import { createDeepSeek } from '@ai-sdk/deepseek';
   import { createMoonshotAI } from '@ai-sdk/moonshotai';
   import { createZhipu } from 'zhipu-ai-provider';
   import { getFetchFunc } from '@/utils/tauriCompat';
   ```

2. 实现 `getProvider()` 函数（见架构部分）

3. 重写 `streamChatCompletion()` 函数：
   - 使用 `streamText()` 替代 `chat.completions.create()`
   - 实现 `textStream` 到 `StandardMessage` 的转换
   - 移除手动流式响应合并逻辑
   - 解析 `result.usage` 获取 token 使用情况

4. 移除 `urlNormalizer.ts` 的导入和使用

### 阶段 3：更新白名单和清理（30 分钟）

1. 检查并更新 `src/utils/constants.ts` 中的 `ALLOWED_MODEL_PROVIDERS`：
   - 移除 `'openai'`（如存在）
   - 保留 `'deepseek'`、`'kimi'`、`'bigmodel'`

2. 删除 `src/services/urlNormalizer.ts` 文件

3. 搜索并移除代码库中所有对 `urlNormalizer` 的引用

### 阶段 4：测试和验证（2-3 小时）

1. **单元测试**（如有）：
   - 运行现有测试用例，确保全部通过
   - 如有失败的测试，修复或更新以适配 ai-sdk

2. **集成测试**（开发环境）：
   - 启动应用：`pnpm tauri dev`
   - 测试三个供应商的聊天功能：
     - DeepSeek：发送消息，验证流式响应正常
     - Kimi：发送消息，验证流式响应正常
     - Zhipu：发送消息，验证流式响应正常
   - 验证 token 使用情况显示正确
   - 验证错误处理（如 API Key 无效）

3. **构建测试**（生产环境）：
   - 运行构建命令：`pnpm tauri build`
   - 检查构建日志，确认无错误或警告
   - 在 Tauri 桌面应用中重复上述聊天功能测试

4. **Web 环境测试**：
   - 部署到 Web 服务器或使用本地 Web 服务器
   - 验证浏览器环境下的聊天功能和代理逻辑

### 阶段 5：文档更新（30 分钟）

1. 更新 `AGENTS.md`：
   - 在"聊天服务层"部分，说明使用 ai-sdk 而非 OpenAI SDK
   - 更新代码示例，展示 `getProvider()` 和 `streamText()` 的用法
   - 移除或更新"URL 标准化模块"部分

2. 更新 `README.md`（如需要）：
   - 如 README 中提到了技术栈，更新为使用 Vercel AI SDK

### 回滚策略

如迁移过程中出现不可逆的问题，按以下步骤回滚：

1. 恢复 `package.json`：
   ```bash
   git checkout package.json pnpm-lock.yaml
   pnpm install
   ```

2. 恢复 `src/services/chatService.ts`：
   ```bash
   git checkout src/services/chatService.ts
   ```

3. 恢复 `src/utils/enums.ts`：
   ```bash
   git checkout src/utils/enums.ts
   ```

4. 恢复 `src/utils/constants.ts`：
   ```bash
   git checkout src/utils/constants.ts
   ```

5. 重新运行测试确保应用正常工作

## Open Questions

1. **Q: Zhipu 的官方 provider 包名称是什么？**
   - 需要验证 npm 包名称是 `zhipu-ai-provider` 还是 `@ai-sdk/zhipu` 或其他名称。
   - **行动**：在实施前搜索 npm registry 或 ai-sdk 官方文档。

2. **Q: ai-sdk 的 `fetch` 配置是否完全兼容 `@/utils/tauriCompat` 的 fetch 函数？**
   - 需要验证函数签名和返回类型是否匹配。
   - **行动**：在阶段 2 实施时进行测试，如不兼容，编写适配器函数。

3. **Q: `result.usage` 的格式是否与 OpenAI SDK 的 `usage` 相同？**
   - 需要确认 ai-sdk 的 token 使用情况数据结构。
   - **行动**：查看 ai-sdk 文档或实际运行测试，验证 `usage` 字段结构。

4. **Q: 是否需要修改 `src/types/chat.ts` 中的 `ChatParams` 接口？**
   - 当前 `ChatParams` 包含 `providerKey`、`model`、`historyList`、`message` 等字段。
   - **行动**：在实施时验证 ai-sdk 的 `streamText()` 参数是否与现有类型兼容，如不兼容，调整类型定义。

5. **Q: ai-sdk 如何处理 AbortSignal？**
   - OpenAI SDK 直接支持 `abortSignal` 参数。
   - **行动**：查看 ai-sdk 文档，确认 `streamText()` 是否支持 `abortSignal` 或类似的中断机制。
