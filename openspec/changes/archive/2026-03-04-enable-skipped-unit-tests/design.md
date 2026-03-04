## Context

项目中存在 92 个被跳过的单元测试，分布在两个关键模块：

1. **chatService 测试（38 个用例）**：vi.mock() 在测试文件内定义，但 chatService.ts 模块在 mock 生效前已被加载并缓存，导致真实 DeepSeek SDK 被调用而非 Mock 数据
2. **masterKey 测试（54 个用例）**：Tauri/加密环境配置问题，导致测试环境初始化失败

这两个模块是核心业务逻辑（聊天服务、密钥管理），当前测试覆盖率为 0%，存在严重的测试保护缺失。

### 当前测试架构

```
src/__test__/
├── services/chatService.test.ts    # 38 个测试被 skip
├── store/keyring/masterKey.test.ts # 54 个测试被 skip
└── helpers/mocks/                  # 现有的 Mock 工厂
    ├── tauri.ts
    ├── crypto.ts
    └── ...
```

### 问题根因

**chatService 问题**：
- vi.mock() 仅在测试文件内定义，而 `chatService.ts` 及其依赖（Vercel AI SDK）在测试文件导入时已被加载并缓存
- Vitest 的模块系统优先使用已缓存的模块，导致后续定义的 vi.mock() 无法覆盖真实模块
- 需要在 `setup.ts` 中定义全局 mock，确保在所有测试文件加载前完成 mock 配置
- 异步生成器和元数据 Promise 的模拟结构需要精确匹配 Vercel AI SDK 的实际返回格式

**masterKey 问题**：
- 测试环境未正确初始化 Tauri API Mock
- Web Crypto API 在 happy-dom 环境中需要特定的 polyfill
- 测试间的状态隔离不完全

## Goals / Non-Goals

**Goals:**
- 修复 chatService.test.ts 中的 vi.mock() 实现，使 38 个测试用例通过
- 修复 masterKey.test.ts 的测试环境配置，使 54 个测试用例通过
- 确保测试覆盖率从 0% 提升到 80% 以上
- 建立 Vercel AI SDK Mock 的最佳实践文档
- 完善测试环境辅助工具，提高后续测试的可维护性

**Non-Goals:**
- 不从 vi.mock() 迁移到 MSW（MSW 不适合 SDK 级别的 Mock）
- 不修改生产代码逻辑（仅修复测试代码）
- 不重构整个测试架构（保持现有目录结构）
- 不添加新的业务功能测试（只修复现有被跳过的测试）

## Decisions

### Decision 1: 保持使用 vi.mock() 而非 MSW

**选择**：继续使用 vi.mock() 来 Mock Vercel AI SDK

**理由**：
- chatService 调用的是 SDK 函数（streamText, createDeepSeek 等），不是直接的 HTTP 请求
- MSW 只能拦截 HTTP 请求，无法拦截 JavaScript 函数调用
- vi.mock() 是 Vitest 提供的标准 Mock 机制，与项目测试准则一致

**替代方案考虑**：
- MSW：不适用，因为 MSW 工作在 HTTP 层，而 chatService 工作在 SDK 层
- 自定义 Mock 工厂：可以使用，但 vi.mock() 更简单直接

### Decision 2: 在 setup.ts 中配置全局 Mock

**选择**：在 `src/__test__/setup.ts` 中定义 Vercel AI SDK 和相关供应商 SDK 的全局 Mock

```typescript
// setup.ts - 全局 Mock 配置
vi.mock('ai', () => ({
  streamText: vi.fn(),
  generateId: vi.fn(() => 'mock-generated-id'),
}));

vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => vi.fn((modelId: string) => ({
    provider: 'deepseek',
    modelId,
    // 符合 LanguageModel 接口的最小实现
    specificationVersion: 'v1',
    doStream: vi.fn(),
    doGenerate: vi.fn(),
  }))),
}));

vi.mock('@ai-sdk/moonshotai', () => ({
  createMoonshotAI: vi.fn(() => vi.fn((modelId: string) => ({
    provider: 'moonshotai',
    modelId,
    specificationVersion: 'v1',
    doStream: vi.fn(),
    doGenerate: vi.fn(),
  }))),
}));

vi.mock('zhipu-ai-provider', () => ({
  createZhipu: vi.fn(() => vi.fn((modelId: string) => ({
    provider: 'zhipu',
    modelId,
    specificationVersion: 'v1',
    doStream: vi.fn(),
    doGenerate: vi.fn(),
  }))),
}));
```

**理由**：
- Vitest 的模块缓存机制：当测试文件导入被测试模块时，其依赖已被加载并缓存
- 在测试文件内定义的 vi.mock() 执行时机太晚，无法覆盖已缓存的模块
- setup.ts 在所有测试文件之前执行，确保 mock 在模块加载前生效
- 符合 Vitest 官方推荐的全局 mock 配置方式

**替代方案考虑**：
- 在每个测试文件内定义 vi.mock()：不可行，已验证无法覆盖缓存的模块
- 使用 vi.doMock()：虽然可以动态 mock，但需要在每个测试用例中重新导入模块，维护成本高

### Decision 3: streamText Mock 返回结构

**选择**：返回包含以下结构的对象：

```typescript
{
  fullStream: AsyncGenerator,  // 用于 for await...of 遍历
  then: (callback) => Promise<{  // 用于 await 获取元数据
    finishReason: Promise<string>,
    usage: Promise<Usage>,
    response: Promise<Response>,
    request: Promise<Request>,
    providerMetadata: Promise<object>,
    warnings: Promise<Array>,
    sources: Promise<Array>,
  }>
}
```

**理由**：
- 完全匹配 Vercel AI SDK 的实际返回格式
- fullStream 需要是异步生成器，支持 for await...of 语法
- 元数据字段都需要是 Promise，因为 SDK 使用延迟解析

### Decision 4: 测试文件中的 Mock 行为配置

**选择**：在测试文件中使用 `beforeEach` 配置具体的 mock 返回值和行为

```typescript
// 测试文件中导入已 mock 的模块（从 setup.ts 全局 mock）
import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 配置 streamText 返回 mock 结果
    vi.mocked(streamText).mockReturnValue(createMockStreamResult([
      { type: 'text-delta', text: 'Hello' },
      { type: 'text-delta', text: ' World' },
    ]));
    
    // 配置 createDeepSeek 返回 mock provider
    vi.mocked(createDeepSeek).mockReturnValue(() => ({
      provider: 'deepseek',
      modelId: 'deepseek-chat',
    }));
  });
});
```

**理由**：
- setup.ts 提供基础 mock 结构，测试文件负责配置具体行为
- 使用 `vi.mocked()` 获得类型安全的 mock 函数
- `clearAllMocks()` 确保每个测试的独立性
- 不同测试可以配置不同的 mock 返回值，实现多样化测试场景

### Decision 5: 测试数据工厂模式

**选择**：创建专用的辅助函数来生成 Mock 数据

```typescript
// 辅助函数示例
function createMockStreamResult(streamItems: StreamItem[]) {
  async function* mockFullStream() {
    for (const item of streamItems) {
      yield item;
    }
  }
  
  return {
    fullStream: mockFullStream(),
    then: (callback) => callback(Promise.resolve({
      finishReason: Promise.resolve('stop'),
      // ...
    })),
  };
}
```

**理由**：
- 避免在测试代码中重复复杂的 Mock 逻辑
- 使测试代码更清晰，关注测试逻辑而非 Mock 细节
- 便于统一修改 Mock 结构（如果 SDK API 变化）

### Decision 6: 分阶段实施策略

**选择**：先修复 chatService，再修复 masterKey

**理由**：
- chatService 的问题更明确（Mock 实现错误）
- chatService 修复成功可以建立信心和方法论
- masterKey 可能涉及更复杂的 Tauri/加密环境配置
- 分阶段便于代码审查和回滚

## Risks / Trade-offs

**[Risk] Vercel AI SDK 版本升级导致 Mock 失效**
→ **Mitigation**: 
- 在 README 中记录当前使用的 SDK 版本
- 升级 SDK 时同步更新 Mock 实现
- 将 SDK 版本锁定在 package.json 中，避免意外升级

**[Risk] 修复过程中发现新的测试问题**
→ **Mitigation**:
- 在修复前运行完整的测试套件，建立基线
- 每次只修改少量测试，逐步验证
- 如果发现复杂问题，拆分为独立的变更处理

**[Risk] Mock 实现过于复杂，难以维护**
→ **Mitigation**:
- 创建专门的辅助函数封装 Mock 逻辑
- 添加详细的注释说明 Mock 结构
- 编写文档说明如何 Mock Vercel AI SDK

**[Risk] 测试执行时间增加**
→ **Mitigation**:
- vi.mock() 的开销很小，预计不会显著增加执行时间
- 如果确实变慢，可以考虑并行执行或使用 vitest 的缓存功能
- 这不是本变更的主要关注点，可以在后续优化

**[Trade-off] Mock 精确度 vs. 维护成本**
- Mock 越精确，越能捕获真实问题，但维护成本越高
- 我们选择在关键路径（chatService）保持高精确度，其他部分使用简化 Mock

**[Trade-off] 测试覆盖率 vs. 开发速度**
- 修复测试会增加一些开发时间
- 但这是必要的投资，可以提高代码质量和重构信心

## Migration Plan

### Phase 1: 准备阶段
1. 分析现有的 chatService.test.ts，理解 Mock 实现的问题
2. 研究 Vercel AI SDK 的实际 API 返回格式
3. 设计正确的 Mock 结构和辅助函数

### Phase 2: chatService 修复
1. 在 `setup.ts` 中添加 `vi.mock('ai', ...)` 全局 mock
2. 在 `setup.ts` 中添加 `vi.mock('@ai-sdk/deepseek', ...)` 全局 mock
3. 在 `setup.ts` 中添加 `vi.mock('@ai-sdk/moonshotai', ...)` 全局 mock
4. 在 `setup.ts` 中添加 `vi.mock('zhipu-ai-provider', ...)` 全局 mock
5. 创建或更新 `createMockStreamTextResult` 辅助函数
6. 更新测试文件中的 `beforeEach` 配置，使用 `vi.mocked()` 设置 mock 行为
7. 移除 `describe.skip`，运行测试验证修复
8. 如有失败的测试，逐个修复

### Phase 3: masterKey 修复
1. 分析 masterKey.test.ts 的测试环境配置问题
2. 修复 Tauri API Mock 配置
3. 修复 Web Crypto API Mock 配置
4. 确保测试间状态隔离正确
5. 移除 `describe.skip`，运行测试验证修复

### Phase 4: 文档和优化
1. 在 README.md 中添加 Vercel AI SDK Mock 最佳实践
2. 更新覆盖率阈值配置（如果需要）
3. 运行完整测试套件，确保没有回归

### Rollback Strategy
- 每次修改都是独立的 commit，可以随时回滚
- 如果发现问题，优先回滚到上一个 working 状态
- 分阶段实施使得可以单独回滚 chatService 或 masterKey 的修改

## Open Questions

1. **masterKey 的具体失败原因**：需要实际运行测试并查看详细错误信息来确定是 Tauri Mock 问题还是加密 API 问题
2. **是否需要添加新的测试用例**：当前 focus 是修复现有测试，但可能需要补充一些边界条件测试
3. **测试覆盖率目标**：proposal 中提到的 80% 覆盖率是否足够？是否需要更高的标准？
4. **是否需要创建新的 Mock 辅助工具**：评估现有的 helpers/mocks/ 是否满足需求，是否需要添加新的工厂函数

## 实施建议

1. **从小处开始**：先修复一个简单的测试用例，验证方法有效后再批量修复
2. **频繁验证**：每修复几个测试就运行一次，避免一次性修改太多导致难以定位问题
3. **记录过程**：如果遇到 tricky 的问题，记录下来便于后续文档编写
4. **代码审查**：建议在修复完 chatService 后进行一次审查，确保方向正确再继续 masterKey
