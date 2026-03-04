# Design: 测试质量重构技术方案

> **术语说明**：本文档使用特定术语来描述测试类型和 Mock 工具。详见 [TERMS.md](./TERMS.md)。

## Context

### 当前状态

**测试代码债务严重**：
- **测试策略混乱**：22 处 TODO 标记需要从 `vi.mock` 迁移到 MSW，实际进展缓慢
- **类型安全缺失**：测试代码中存在 336 处 `any` 类型使用，主要集中：
  - Mock 对象定义（`as any`）
  - 测试 Fixtures 返回类型（未标注）
  - Redux store preloadedState（`as any`）
- **资源浪费**：
  - 6 个未使用的 Mock 实现文件（`src/__mock__/tauriCompat/*.ts`）
  - 4 个未使用的测试 Fixtures（`src/__test__/fixtures/*.ts`）
  - 1 个未使用的 Redux action（`clearSelectChatId`）
- **技术债务累积**：多个测试标记为"需重新实现"，但长期未处理

**基础设施现状**：
- Vitest 作为测试框架（单元测试 + 集成测试）
- MSW 已集成但未充分利用（`chat-flow.integration.test.ts` 标记了 CORS preflight 问题）
- `fake-indexeddb` 用于存储测试，但部分测试仍使用 Mock
- Redux 测试过度关注内部实现（测试 `pending` → `fulfilled` 状态转换）

### 约束条件

**项目约束**：
- **技术栈**：React 19 + Redux Toolkit + TypeScript + Vitest + MSW
- **测试环境**：Tauri 桌面应用 + Web 浏览器（需要跨平台兼容）
- **时间约束**：测试质量债务已成为快速发展期的瓶颈，需在 2-3 个迭代内完成主要改进

**质量约束**：
- **覆盖率目标**：保持当前测试覆盖率（~80%），不得下降
- **向后兼容**：不破坏现有测试接口（除非明确标记为 BREAKING）
- **性能约束**：MSW 替换 vi.mock 后，集成测试执行时间增加 < 20%

### 利益相关者

- **开发团队**：提高测试编写效率，减少维护成本
- **代码审查者**：减少测试相关的审查负担
- **新开发者**：提供更清晰的测试示例和文档

## Goals / Non-Goals

### Goals

1. **MSW 全面替代 vi.mock**：建立系统化的 MSW 迁移流程，替换 22 处 vi.mock 使用
2. **类型安全改进**：将测试代码中的 `any` 使用从 336 处减少到 50 处以内（保留 15%）
3. **激活测试资源**：激活 4 个未使用的 Fixtures，删除 6 个未使用的 Mock 文件
4. **CORS 问题修复**：解决 MSW CORS preflight 处理问题
5. **行为驱动测试**：重构 6 个 Slice 测试，聚焦用户可见行为

### Non-Goals

- **不改变生产代码架构**：所有改进仅限于测试代码，不影响生产 API
- **不引入新的测试框架**：继续使用 Vitest + MSW，不迁移到 Jest 或其他框架
- **不追求 100% 类型安全**：保留 15% 的 `any` 用于测试灵活性（如第三方库 Mock）
- **不改变测试覆盖率目标**：不强制提高覆盖率，重点是质量提升

## Decisions

### 决策 1：MSW Handlers 统一管理架构

**决策**：在 `src/__test__/msw/handlers/` 目录下集中管理所有 MSW handlers，按 API 供应商或功能模块组织。

**原因**：
- **可复用性**：handlers 可在多个测试中复用，避免重复定义
- **维护性**：集中管理便于更新（如 API 签名变化）
- **一致性**：统一的 handlers 格式和命名规范

**拒绝的方案**：
- ❌ **在每个测试文件中定义 handlers**：导致重复代码，难以维护
- ❌ **使用第三方 MSW handlers 库**：无法满足项目特定需求（如流式响应）

**目录结构**：
```
src/__test__/msw/
├── handlers/
│   ├── deepseek.ts       # DeepSeek API handlers
│   ├── kimi.ts           # Moonshot AI (Kimi) API handlers
│   ├── zhipu.ts          # ZhipuAI API handlers
│   ├── models-dev.ts     # models.dev API handlers
│   └── index.ts          # 统一导出所有 handlers
├── setup.ts              # MSW server 配置
└── types.ts              # Handler 类型定义
```

**Handler 工厂模式**：

```typescript
// src/__test__/msw/handlers/deepseek.ts
import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';

// 类型定义
interface StreamOptions {
  response?: ReadableStream;
  delay?: number; // 响应延迟（毫秒）
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// 默认流式响应
const createDefaultStream = (text: string): ReadableStream => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      // 模拟逐字返回
      const words = text.split('');
      for (const word of words) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', text: word })}\n\n`));
        await delay(10); // 模拟网络延迟
      }
      controller.close();
    },
  });
};

export const deepSeekHandlers = {
  /**
   * 成功场景：返回流式响应
   * @example
   * server.use(deepSeekHandlers.success({ response: customStream }));
   * server.use(deepSeekHandlers.success({ delay: 1000 }));
   */
  success: (options: StreamOptions = {}) =>
    http.post('https://api.deepseek.com/v1/chat/completions', async () => {
      const { response, delay: responseDelay = 0 } = options;

      if (responseDelay > 0) {
        await delay(responseDelay);
      }

      const stream = response ?? createDefaultStream('你好！我是 DeepSeek。');

      return HttpResponse.stream(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }),

  /**
   * 网络错误场景：模拟网络连接失败
   * @example
   * server.use(deepSeekHandlers.networkError());
   */
  networkError: () =>
    http.post('https://api.deepseek.com/v1/chat/completions', () => {
      return HttpResponse.error();
    }),

  /**
   * 超时场景：模拟 API 请求超时
   * @example
   * server.use(deepSeekHandlers.timeout({ delay: 30000 }));
   */
  timeout: (options: { delay: number } = { delay: 30000 }) =>
    http.post('https://api.deepseek.com/v1/chat/completions', async () => {
      await delay(options.delay);
      return HttpResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }),

  /**
   * 服务器错误场景：模拟 5xx 错误
   * @example
   * server.use(deepSeekHandlers.serverError({ status: 500, message: 'Internal Server Error' }));
   */
  serverError: (options: { status: number; message: string } = { status: 500, message: 'Internal Server Error' }) =>
    http.post('https://api.deepseek.com/v1/chat/completions', () => {
      return HttpResponse.json(
        { error: options.message },
        { status: options.status }
      );
    }),
};

// 导出 handlers 数组（方便 setupServer 使用）
export const deepSeekHandlersList = [
  deepSeekHandlers.success(),
];
```

**使用示例**：

```typescript
// chat-flow.integration.test.ts
import { server } from '@/__test__/msw/setup';
import { deepSeekHandlers } from '@/__test__/msw/handlers/deepseek';

describe('聊天流程集成测试', () => {
  beforeEach(() => {
    // 默认使用成功场景
    server.use(deepSeekHandlers.success());
  });

  test('应该显示流式响应 当用户发送消息', async () => {
    // 使用默认流式响应
    const { user } = setupTest();
    await user.click(getByText('发送'));

    await waitFor(() => {
      expect(screen.getByText('你好！我是 DeepSeek。')).toBeInTheDocument();
    });
  });

  test('应该显示错误提示 当网络失败', async () => {
    // 覆盖为网络错误场景
    server.use(deepSeekHandlers.networkError());

    const { user } = setupTest();
    await user.click(getByText('发送'));

    await waitFor(() => {
      expect(screen.getByText(/网络错误/)).toBeInTheDocument();
    });
  });

  test('应该显示超时提示 当请求超时', async () => {
    // 覆盖为超时场景（30 秒）
    server.use(deepSeekHandlers.timeout({ delay: 30000 }));

    const { user } = setupTest();
    await user.click(getByText('发送'));

    await waitFor(() => {
      expect(screen.getByText(/请求超时/)).toBeInTheDocument();
    }, { timeout: 35000 });
  });
});
```

### 决策 2：类型安全改进的渐进式策略

**决策**：分 4 个阶段逐步改进类型安全，每个阶段验证测试覆盖率未下降。

**原因**：
- **风险控制**：避免大规模改动导致测试失败
- **可验证性**：每个阶段都有明确的指标（覆盖率、any 数量）
- **可并行性**：不同开发者可并行处理不同阶段

**阶段划分**：
1. **第一阶段**：为所有 Fixtures 添加类型定义（减少 ~100 处 any）
2. **第二阶段**：为 Mock 对象添加类型接口（减少 ~150 处 any）
3. **第三阶段**：为 Redux store preloadedState 添加类型（减少 ~50 处 any）
4. **第四阶段**：清理剩余的 any，添加注释说明（减少 ~36 处 any）

**类型定义策略**：
```typescript
// ❌ 错误：使用 any
const mockResult = { fullStream: ... } as any;

// ✅ 正确：定义类型接口
interface MockStreamTextResult {
  fullStream: AsyncIterable<StreamPart>;
  finishReason: Promise<string>;
  usage: Promise<Usage>;
}
const mockResult = { fullStream: ... } as MockStreamTextResult;

// ✅ 使用 Vitest 的 Mocked 类型
import { mocked } from 'vitest';
const mockStreamText = mocked(streamText);
mockStreamText.mockReturnValueOnce(mockResult);
```

**拒绝的方案**：
- ❌ **一次性替换所有 any**：风险过高，难以定位问题
- ❌ **使用 @ts-ignore 绕过类型检查**：违反类型安全目标

### 决策 3：测试 Fixtures 的激活和改进策略

**决策**：优先激活 `modelProvider.ts` Fixtures（高价值），评估其他 Fixtures 的用途，删除低价值文件。

**原因**：
- **高 ROI**：`modelProvider.ts` 包含完整的工厂函数（114 行），可立即减少重复代码
- **渐进式**：先激活高价值 Fixtures，再评估其他文件
- **数据驱动**：使用 `knip` 工具检测使用情况，避免主观判断

**Fixtures 改进方案**：
```typescript
// src/__test__/fixtures/modelProvider.ts (改进后)
import { z } from 'zod';
import { ModelProviderKeyEnum } from '@/utils/enums';

// 添加 Zod schema 验证
const RemoteProviderDataSchema = z.object({
  providerKey: z.nativeEnum(ModelProviderKeyEnum),
  providerName: z.string(),
  api: z.string().url(),
  models: z.array(z.object({
    modelKey: z.string(),
    modelName: z.string(),
  })),
});

// 明确标注类型
export const createDeepSeekProvider = (
  overrides?: Partial<RemoteProviderData>
): RemoteProviderData => {
  const provider = {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com/v1',
    models: [
      { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
      { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
    ],
    ...overrides,
  };

  // 验证数据结构
  const result = RemoteProviderDataSchema.safeParse(provider);
  if (!result.success) {
    throw new FixtureValidationError('Invalid Provider data', result.error);
  }

  return provider;
};
```

**拒绝的方案**：
- ❌ **删除所有未使用 Fixtures**：可能丢失有价值的数据工厂
- ❌ **激活所有 Fixtures**：浪费精力维护低价值代码

### 决策 4：行为驱动测试的重构范围

**决策**：重构 6 个 Slice 测试，移除对内部状态转换的测试（如 `pending` → `fulfilled`），增加集成测试补偿。

**原因**：
- **聚焦价值**：测试用户可见行为（最终状态），而非实现细节（状态转换）
- **减少脆性**：重构时不因状态管理逻辑变化而失败
- **补偿机制**：通过集成测试验证 Redux 行为

**重构范围**：
- `src/__test__/store/slices/modelSlice.test.ts`
- `src/__test__/store/slices/chatSlices.test.ts`
- `src/__test__/store/slices/appConfigSlices.test.ts`
- `src/__test__/store/slices/chatPageSlices.test.ts`
- `src/__test__/store/slices/modelProviderSlice.test.ts`

**重构示例**：
```typescript
// ❌ 错误：测试内部状态转换
test('应该设置 loading 为 true 当请求 pending', () => {
  store.dispatch(initializeModels());
  expect(store.getState().models.loading).toBe(true);
});

// ✅ 正确：测试用户可见行为
test('应该显示加载指示器 当加载模型', () => {
  const { getByTestId } = renderWithProviders(<ModelPage />);
  expect(getByTestId('model-loading-spinner')).toBeInTheDocument();
});

// 集成测试补偿（chat-flow.integration.test.ts）
test('应该完成模型加载流程 当用户访问模型页面', async () => {
  const { user } = setupTest();
  await user.click(getByText('模型管理'));
  await waitFor(() => {
    expect(getAllByTestId('model-card')).toHaveLength(3);
  });
});
```

**拒绝的方案**：
- ❌ **删除所有 Slice 测试**：失去快速反馈机制
- ❌ **保留所有状态转换测试**：违背行为驱动原则

### 决策 5：CORS Preflight 问题的解决方案

**决策**：在 MSW server 配置中使用 `onUnhandledRequest: 'bypass'`，忽略未处理的 OPTIONS 请求。

**原因**：
- **简单有效**：一行配置解决问题，无需为每个 API 添加 OPTIONS handler
- **性能优化**：避免拦截所有请求，只处理必要的路由
- **兼容性**：适用于所有浏览器和 Node.js 环境

**实现方案**：
```typescript
// src/__test__/msw/setup.ts
import { setupServer } from 'msw/node';
import { HttpResponse } from 'msw';
import { deepSeekHandlers, kimiHandlers, zhipuHandlers } from './handlers';

export const server = setupServer(
  ...deepSeekHandlers.success(),
  ...kimiHandlers.success(),
  ...zhipuHandlers.success(),
);

// 关键配置
server.listen({
  onUnhandledRequest: 'bypass',  // 忽略未处理的请求（包括 OPTIONS）
});

// 在 vitest.integration.config.ts 中导入
export default defineConfig({
  test: {
    setupFiles: ['./src/__test__/integration/setup.ts'],
    // ...
  },
});
```

**拒绝的方案**：
- ❌ **为每个 API 添加 OPTIONS handler**：重复代码，维护成本高
- ❌ **禁用 CORS 检查**：不符合浏览器安全模型

## Risks / Trade-offs

### 风险 1：MSW 迁移导致测试执行时间增加

**描述**：MSW 替换 vi.mock 后，集成测试需要启动 HTTP server，可能增加 10-20% 执行时间。

**缓解措施**：
- **MSW server 复用**：在 `beforeAll` 中统一初始化，每个测试仅覆盖特定 handlers
- **并行执行**：Vitest 默认并行执行独立测试
- **性能监控**：在 CI 中记录测试执行时间，超过阈值时告警

### 风险 2：类型安全改进可能遗漏边界情况

**描述**：添加类型定义后，某些测试可能因类型不匹配而失败，需要额外调试时间。

**缓解措施**：
- **渐进式迁移**：分阶段进行，每个阶段都有明确的验证步骤
- **类型审查**：代码审查时重点检查类型定义的准确性
- **回退机制**：如果某个阶段导致大量测试失败，回退到上一阶段

### 风险 3：Fixtures 激活可能引入数据不一致

**描述**：如果 Fixtures 生成的数据与实际 API 返回不一致，测试可能通过但生产环境失败。

**缓解措施**：
- **Zod 验证**：使用 Zod schema 验证 Fixtures 数据结构
- **定期同步**：每个迭代审查 Fixtures 与真实 API 的一致性
- **真实数据备份**：保留部分使用真实 API 的集成测试

### 风险 4：行为驱动测试重构可能降低覆盖率

**描述**：移除状态转换测试后，某些边界条件可能未被覆盖。

**缓解措施**：
- **集成测试补偿**：增加集成测试覆盖用户可见行为
- **覆盖率监控**：每个阶段运行 `pnpm test:coverage`，确保覆盖率未下降
- **关键单元测试保留**：保留性能关键路径和安全相关的单元测试

## Migration Plan

### 阶段 1：MSW 基础设施建立（1 周）

**目标**：建立 MSW handlers 统一管理模式，修复 CORS preflight 问题。

**步骤**：
1. **创建 MSW handlers 目录结构**（1 天）
   - 创建 `src/__test__/msw/handlers/` 目录
   - 创建 `setup.ts` 配置 MSW server
   - 创建 `types.ts` 定义 Handler 类型

2. **实现 API 供应商 Handlers**（2 天）
   - 实现 `deepseek.ts` handlers（success, networkError, timeout）
   - 实现 `kimi.ts` handlers
   - 实现 `zhipu.ts` handlers
   - 实现 `models-dev.ts` handlers

3. **修复 CORS Preflight 问题**（1 天）
   - 在 `vitest.integration.config.ts` 中配置 `onUnhandledRequest: 'bypass'`
   - 验证 `chat-flow.integration.test.ts` 通过
   - 移除 "TODO: 修复 MSW CORS preflight 处理问题" 注释

4. **编写 MSW Handlers 单元测试**（2 天）
   - 为每个 handler 编写测试，验证正确拦截请求
   - 确保handlers 覆盖率 ≥ 80%

**验证标准**：
- ✅ MSW server 正确启动和关闭
- ✅ CORS preflight 请求不再报错
- ✅ 所有 handlers 有单元测试

### 阶段 2：MSW 迁移（1 周）

**目标**：替换集成测试中的 vi.mock（如 `modelStorage.test.ts`、`masterKey.test.ts`），建立标准的 MSW 使用模式。

**步骤**：
1. **迁移 modelStorage.test.ts**（3 天）
    - 使用 `fake-indexeddb` 替代 Mock
    - 使用 MSW 模拟 Tauri 文件系统 API
    - 验证存储加密逻辑正确性
    - 添加边界条件测试（如数据损坏）

2. **迁移 masterKey.test.ts**（2 天）
    - 使用 MSW 模拟 Tauri 钥匙串 API
    - 验证密钥生成、存储、获取流程
    - 测试密钥格式验证

3. **迁移其他集成测试**（2 天）
    - `modelRemoteService.test.ts`（如有 vi.mock）
    - 其他集成测试中的 vi.mock

4. **验证测试覆盖率**（半天）
    - 运行 `pnpm test:coverage`
    - 确保覆盖率未下降
    - 补充缺失的测试

5. **清理 TODO 注释**（半天）
    - 删除 `chatService.test.ts` 第 14 行的 TODO（保留 vi.mock 是正确的）
    - 删除 `chatSlices.test.ts` 第 141 行的 TODO（将在 BDD 阶段处理）

**验证标准**：
- ✅ 集成测试中的 vi.mock 替换为 MSW
- ✅ 单元测试保留 vi.mock（如 `chatService.test.ts`）
- ✅ TODO 注释已清理或转为具体任务
- ✅ 测试覆盖率 ≥ 80%
- ✅ 所有测试通过

### 阶段 3：类型安全改进（2 周）

**目标**：将 `any` 使用从 336 处减少到 50 处以内。

**步骤**：
1. **第一阶段：Fixtures 类型定义**（3 天）
   - 为 `modelProvider.ts` Fixtures 添加类型
   - 为其他 Fixtures 添加类型
   - 使用 Zod 验证数据结构

2. **第二阶段：Mock 对象类型接口**（5 天）
   - 为 `chatService.test.ts` 的 Mock 对象定义接口
   - 为其他测试的 Mock 对象定义接口
   - 使用 `Mocked<T>` 替代 `as any`

3. **第三阶段：Redux Store 类型**（3 天）
   - 为 `createTestStore` 添加类型推断
   - 为 `preloadedState` 添加 `Partial<RootState>` 类型
   - 验证所有 Redux 测试的类型安全

4. **第四阶段：清理剩余 any**（3 天）
   - 为保留的 `any` 添加注释说明
   - 删除不必要的 `any`
   - 验证最终 `any` 数量 ≤ 50

**验证标准**：
- ✅ `any` 使用 ≤ 50 处
- ✅ 所有 Fixtures 有类型定义
- ✅ 测试覆盖率 ≥ 80%

### 阶段 4：Fixtures 和 Mock 清理（1 周）

**目标**：激活未使用的 Fixtures，删除未使用的 Mock 文件。

**步骤**：
1. **激活 modelProvider Fixtures**（2 天）
   - 在 `modelProviderSlice.test.ts` 中使用 Fixtures
   - 在 `modelRemoteService.test.ts` 中使用 Fixtures
   - 验证数据一致性

2. **评估其他 Fixtures**（1 天）
   - 分析 `models.ts`, `store.ts`, `chatPanel.ts` 的价值
   - 决定激活或删除
   - 更新文档

3. **删除未使用的 Mock 文件**（1 天）
   - 删除 `src/__mock__/tauriCompat/*.ts`（6 个文件）
   - 运行 `pnpm analyze:unused` 验证无引用
   - 删除 `clearSelectChatId` action

4. **编写 Fixtures 使用文档**（1 天）
   - 创建 `src/__test__/fixtures/README.md`
   - 为每个 Fixture 添加 JSDoc 注释
   - 提供使用示例

**验证标准**：
- ✅ 未使用文件已删除
- ✅ Fixtures 使用率 ≥ 80%
- ✅ 文档完整

### 阶段 5：行为驱动测试重构（2 周）

**目标**：重构 6 个 Slice 测试，聚焦用户可见行为。

**步骤**：
1. **分析现有 Slice 测试**（2 天）
   - 识别测试内部实现的部分
   - 标记可删除的测试用例
   - 保留关键单元测试

2. **重构 modelSlice 测试**（2 天）
   - 删除 `pending` → `fulfilled` 状态转换测试
   - 增加集成测试补偿（`model-config.integration.test.ts`）
   - 验证用户可见行为

3. **重构其他 Slice 测试**（6 天）
   - `chatSlices.test.ts`
   - `appConfigSlices.test.ts`
   - `chatPageSlices.test.ts`
   - `modelProviderSlice.test.ts`

4. **验证重构效果**（2 天）
   - 运行所有测试
   - 验证覆盖率未下降
   - 测试脆性降低（重构组件后测试仍通过）

**验证标准**：
- ✅ Slice 测试聚焦用户可见行为
- ✅ 集成测试补偿关键场景
- ✅ 测试覆盖率 ≥ 80%

### 阶段 6：最终验证和文档（1 周）

**目标**：验证所有改进，更新文档，完成迁移。

**步骤**：
1. **运行完整测试套件**（1 天）
   - 单元测试：`pnpm test:run`
   - 集成测试：`pnpm test:integration:run`
   - 覆盖率：`pnpm test:coverage`

2. **性能基准测试**（1 天）
   - 记录测试执行时间
   - 对比迁移前后的性能
   - 确保增加 < 20%

3. **更新文档**（2 天）
   - 更新 `src/__test__/README.md`
   - 添加 MSW 使用指南
   - 添加行为驱动测试最佳实践

4. **团队培训**（2 天）
   - MSW Handlers 使用培训
   - 类型安全最佳实践培训
   - Fixtures 使用培训

5. **清理和归档**（1 天）
   - 移除所有 TODO 注释
   - 归档旧测试代码（如果需要）
   - 提交最终的 PR

**验证标准**：
- ✅ 所有测试通过
- ✅ 测试覆盖率 ≥ 80%
- ✅ 性能增加 < 20%
- ✅ 文档完整

### 回滚策略

**如果某个阶段失败**：
1. **回退到上一阶段**：保留上一阶段的代码，丢弃当前阶段的更改
2. **创建 Issue 追踪**：记录失败原因和后续计划
3. **调整计划**：根据实际情况调整后续阶段的范围

**如果整个迁移失败**：
1. **回滚所有更改**：使用 `git revert` 回滚所有提交
2. **保留关键改进**：如 CORS 问题修复，单独提交
3. **重新评估方案**：收集反馈，调整技术方案

## 技术决策记录

### 决策 001：MSW Handlers 参数化配置

**问题**：handlers 应该支持多少参数化配置？

**决策**：初始版本支持三种核心场景
- **success**: 正常流式响应（支持自定义响应体）
- **networkError**: 网络错误场景
- **timeout**: 超时场景（支持自定义延迟）

**理由**：
- 覆盖 90% 的测试需求
- 保持简单，易于维护
- 后续可根据实际需求扩展

**示例**：
```typescript
// 场景 1: 正常响应
server.use(deepSeekHandlers.success({ response: customStream }));

// 场景 2: 网络错误
server.use(deepSeekHandlers.networkError());

// 场景 3: 超时（30 秒）
server.use(deepSeekHandlers.timeout({ delay: 30000 }));
```

### 决策 002：Fixtures 数据验证策略

**问题**：Zod 验证是否影响测试性能，是否需要禁用？

**决策**：**始终启用 Zod 验证**

**理由**：
- 测试环境性能不是首要考虑（< 5% 影响可接受）
- 数据一致性更重要（早期发现结构错误）
- 防止 Fixtures 与真实 API 数据不一致

**验证策略**：
```typescript
export const createMockModel = (overrides?: Partial<Model>): Model => {
  const model = { /* 默认数据 */ };
  const result = ModelSchema.safeParse(model);
  if (!result.success) {
    throw new FixtureValidationError('Invalid Model', result.error);
  }
  return result.data;
};
```

### 决策 003：行为驱动测试重构范围

**问题**：是否所有 Slice 测试都需要重构，还是保留部分状态转换测试？

**决策**：选择性重构，保留关键测试

**保留的场景**：
- **性能关键路径**：如模型加载、消息发送的核心状态转换
- **安全相关逻辑**：如加密、验证的状态转换
- **复杂计算**：如数据处理算法的中间状态

**重构的场景**：
- **UI 相关状态**：如 `loading`、`error` 等显示状态
- **用户操作响应**：如按钮点击后的状态变化
- **可观察行为**：如数据更新后的最终状态

**重构示例**：
```typescript
// ❌ 删除：测试内部实现
test('应该设置 loading 为 true 当请求 pending', () => {
  store.dispatch(fetchModels());
  expect(store.getState().models.loading).toBe(true);
});

// ✅ 保留：测试关键性能指标
test('应该在 100ms 内完成模型加载', async () => {
  const startTime = performance.now();
  await store.dispatch(fetchModels());
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100);
});

// ✅ 新增：集成测试补偿
test('应该显示加载指示器 当加载模型', async () => {
  const { getByTestId } = renderWithProviders(<ModelPage />);
  expect(getByTestId('model-loading-spinner')).toBeInTheDocument();
});
```

### 决策 004：测试执行时间增加的可接受范围

**问题**：如果 MSW 导致测试执行时间增加超过 20%，是否需要优化？

**决策**：分阶段优化策略

**阈值设定**：
- **< 20%**：可接受，无需优化
- **20% - 50%**：评估并优化 MSW handlers 复用
- **> 50%**：必须优化，考虑：
  - 增加 CI 并行度
  - 优化 handlers 实现
  - 评估是否有不必要的集成测试

**优化策略**：
```typescript
// ❌ 错误：每个测试创建新的 server
beforeEach(() => {
  const server = setupServer(/* handlers */);
  server.listen();
});

// ✅ 正确：复用 server，仅在需要时覆盖
// setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

// 测试文件
test('测试场景 1', () => {
  server.use(customHandler); // 仅覆盖当前测试需要的 handler
});
```
   - **决策**：如果增加 > 20%，考虑优化 handlers 复用策略，或增加 CI 并行度
