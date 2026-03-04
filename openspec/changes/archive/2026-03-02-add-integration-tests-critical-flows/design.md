# 集成测试补充方案 - 技术设计文档

## Context

### 当前状态

**现有集成测试**：
- 仅 3 个集成测试文件，集中在加密和存储模块
- 使用 Vitest + fake-indexeddb 进行测试
- 测试文件位于 `src/__test__/integration/`

**测试基础设施**：
```
src/__test__/
├── integration/
│   ├── crypto-masterkey.integration.test.ts   # 主密钥管理集成
│   ├── crypto-storage.integration.test.ts     # 加密存储集成
│   └── initialization/integration.test.ts     # 初始化流程集成
├── helpers/
│   ├── fixtures/          # 测试数据 fixtures
│   ├── isolation/         # 隔离测试工具
│   └── mocks/             # Mock 工具
└── setup.ts               # 测试设置
```

**关键发现**：
- ✅ 现有集成测试质量高，使用良好的隔离策略
- ❌ 缺少业务流程的端到端验证
- ❌ 缺少跨模块协作测试
- ❌ 缺少外部 API 集成测试（chatService）

### 约束条件

1. **无 breaking changes**: 不能修改生产代码
2. **测试隔离**: 集成测试必须相互独立，不能依赖执行顺序
3. **执行时间**: 集成测试允许较慢，但应控制在 20 秒内
4. **环境兼容**: 测试必须在 Tauri 和 Web 环境都能运行
5. **数据清理**: 每个测试后必须清理副作用（localStorage, IndexedDB）

### 利益相关者

- **开发者**: 需要清晰的集成测试文档和易于调试的测试失败信息
- **QA**: 需要集成测试覆盖关键用户场景
- **DevOps**: 需要稳定的 CI/CD 集成，避免 flaky tests

## Goals / Non-Goals

**Goals:**
- 为 3 个关键业务流程补充端到端集成测试
- 建立可复用的集成测试辅助工具和 Mock 策略
- 验证跨模块协作和数据流
- 为重构提供安全网

**Non-Goals:**
- 不修改生产代码
- 不补充 E2E 测试（使用 Playwright/Cypress，留待后续）
- 不追求 100% 场景覆盖（聚焦核心流程）
- 不替换现有单元测试（集成测试是补充，不是替代）

## Decisions

### 1. 集成测试分层策略

**决策**: 采用菱形测试策略

```
         ▲
        / \           E2E Tests (少量，Playwright)
       /   \          ← 不在本变更范围
      /-----\
     / Unit   \       单元测试（大量，已有 78 个）
    / Tests    \
   /           \
  / Integration \    集成测试（中等，新增 3-4 个）
 /_____________\
```

**原则**：
- 单元测试：快速反馈，覆盖函数和组件逻辑
- 集成测试：验证模块协作，覆盖关键业务流程
- E2E 测试：验证用户场景，覆盖核心路径（未来补充）

**理由**：
- 避免测试金字塔过于宽泛（太多单元测试）
- 避免测试沙漏过于狭窄（太少集成测试）
- 平衡测试覆盖率和维护成本

### 2. Mock 工具选择

**决策**: 分层 Mock 策略

| 层级 | Mock 策略 | 工具 | 理由 |
|------|----------|------|------|
| **外部 API** | Mock HTTP 请求 | MSW (Mock Service Worker) | 真实网络层，易于调试 |
| **存储层** | 使用真实实现 | fake-indexeddb (已安装) | 验证持久化逻辑 |
| **加密层** | 使用真实实现 | 真实 crypto.ts | 验证加密链路 |
| **Redux** | 使用真实 Store | configureStore | 验证状态管理 |
| **React 组件** | 真实渲染 | React Testing Library | 验证用户交互 |

**示例架构**：
```
┌─────────────────────────────────────┐
│   React Component (Real)            │  ← 真实渲染
├─────────────────────────────────────┤
│   Redux Store (Real)                │  ← 真实状态管理
├─────────────────────────────────────┤
│   Service Layer (Real)              │  ← 真实业务逻辑
├─────────────────────────────────────┤
│   HTTP Mock (MSW)                   │  ← Mock 外部 API
└─────────────────────────────────────┘
```

**为什么选择 MSW？**
- ✅ 拦截网络请求，无需修改代码
- ✅ 支持 REST 和 GraphQL
- ✅ 类型安全（TypeScript 支持）
- ✅ 易于调试（可查看所有请求）
- ✅ 与 Vitest 集成良好

**替代方案考虑**：
- ❌ `vi.mock()` 逐个 mock 函数：维护成本高，容易遗漏
- ❌ `nock`：仅支持 Node.js，不支持浏览器环境
- ❌ 真实 API 调用：慢、不稳定、需要 API Key

### 3. 测试隔离策略

**决策**: 每个测试文件独立设置和清理

```typescript
// vitest.integration.config.ts (新建)
export default defineConfig({
  test: {
    // 集成测试配置
    setupFiles: ['./src/__test__/integration/setup.ts'],
    testTimeout: 30000,  // 30 秒超时
    maxConcurrency: 1,   // 串行执行，避免冲突
    isolate: true,       // 每个测试独立运行

    // 环境
    environment: 'happy-dom',
    globals: true,
  }
})
```

**每个测试文件的结构**：
```typescript
// chat-flow.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { HttpResponse } from 'msw'

describe('聊天流程集成测试', () => {
  const server = setupServer(/* handlers */)

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(async () => {
    // 清理 localStorage
    localStorage.clear()
    // 清理 IndexedDB
    await clearIndexedDB()
    // 重置 Redux store
    resetStore()
  })

  it('应该完成完整的聊天流程', async () => {
    // 1. 渲染聊天界面
    // 2. 发送消息
    // 3. 验证流式响应
    // 4. 验证 Redux 更新
    // 5. 验证持久化存储
  })
})
```

**隔离工具**：
```typescript
// src/__test__/helpers/integration/clearIndexedDB.ts
export async function clearIndexedDB(): Promise<void> {
  const databases = await indexedDB.databases()
  await Promise.all(
    databases.map(db => indexedDB.deleteDatabase(db.name!))
  )
}

// src/__test__/helpers/integration/resetStore.ts
export function resetStore(): void {
  // 清除所有 Redux 状态
  const store = getTestStore()
  store.dispatch({ type: 'RESET' })
}
```

### 4. 数据流验证策略

**决策**: 使用断言验证完整数据流

**聊天流程数据流**：
```
用户输入
  ↓
[Redux Action: sendMessage]
  ↓
[Middleware: 调用 chatService]
  ↓
[Service: streamChatCompletion]
  ↓
[MSW Mock: 返回流式响应]
  ↓
[Middleware: 处理流式数据]
  ↓
[Redux Action: addMessage]
  ↓
[Storage: chatStorage.saveChats]
  ↓
[UI: 渲染消息]
```

**测试断言**：
```typescript
it('应该验证完整数据流', async () => {
  const { store } = renderTestApp()

  // 1. 触发用户操作
  await userEvent.type(screen.getByRole('textbox'), '你好')
  await userEvent.click(screen.getByRole('button', { name: '发送' }))

  // 2. 验证 Redux 状态
  await waitFor(() => {
    expect(store.getState().chats.messages).toHaveLength(1)
  })

  // 3. 验证持久化存储
  const storedChats = await chatStorage.loadChats()
  expect(storedChats[0].messages).toHaveLength(1)

  // 4. 验证 UI 渲染
  expect(screen.getByText('你好')).toBeInTheDocument()
})
```

### 5. 测试数据管理

**决策**: 使用集成测试专用 Fixtures

```typescript
// src/__test__/helpers/integration/fixtures.ts
export const integrationFixtures = {
  // 完整的聊天会话
  chatSession: {
    id: 'test-chat-1',
    title: '测试对话',
    modelId: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: '你好',
        timestamp: getCurrentTimestamp()
      },
      {
        role: 'assistant',
        content: '你好！有什么可以帮助你的？',
        timestamp: getCurrentTimestamp()
      }
    ]
  },

  // 完整的模型配置
  modelConfig: {
    id: 'model-1',
    providerName: 'DeepSeek',
    providerKey: 'deepseek',
    nickname: 'DeepSeek Chat',
    apiKey: 'sk-test-123',
    apiAddress: 'https://api.deepseek.com',
    modelKey: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    isEnable: true,
  },

  // API 响应
  apiResponse: {
    streaming: true,
    chunks: [
      '你好',
      '！',
      '有什么',
      '可以',
      '帮助',
      '你的',
      '？'
    ]
  }
}
```

### 6. 性能优化策略

**决策**: 使用 Vitest 并行执行和测试分组

```typescript
// vitest.integration.config.ts
export default defineConfig({
  test: {
    // 仅集成测试串行执行
    maxConcurrency: 1,

    // 但测试文件之间并行
    fileParallelism: true,

    // 使用快照加速重复测试
    benchmark: true,
  }
})
```

**性能目标**：
- 单个集成测试文件 < 5 秒
- 全部集成测试 < 20 秒
- 内存占用 < 500MB

**优化措施**：
- 使用 `vi.useFakeTimers()` 加速定时器
- 使用 `msw` 而非真实网络请求
- 使用 `happy-dom` 而非真实浏览器
- 清理不必要的日志输出

### 7. 错误处理测试策略

**决策**: 覆盖关键错误场景

**聊天流程错误场景**：
1. ✅ API 超时 → 显示错误提示
2. ✅ API 返回错误 → 保存错误消息到 Redux
3. ✅ 网络断开 → 重试机制
4. ✅ 流式响应中断 → 保存已接收内容

**测试示例**：
```typescript
it('应该处理 API 错误', async () => {
  // Mock API 返回错误
  server.use(
    rest.post('/api/chat', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
    })
  )

  renderTestApp()

  // 发送消息
  await sendMessage('测试')

  // 验证错误提示
  await waitFor(() => {
    expect(screen.getByText(/请求失败/)).toBeInTheDocument()
  })

  // 验证错误保存到 Redux
  expect(store.getState().chats.error).not.toBeNull()
})
```

## Risks / Trade-offs

### Risk 1: MSW 与 Vitest 集成问题

**风险**: MSW 可能与 Vitest 的环境模拟冲突

**缓解措施**:
- 使用 `msw/node` 而非 `msw/browser`
- 在 `setupFiles` 中初始化 MSW server
- 使用 `beforeAll` 和 `afterAll` 管理 server 生命周期
- 参考 MSW 官方文档的 Vitest 集成指南

**备选方案**: 如果 MSW 不可用，回退到 `vi.mock()` 方式

### Risk 2: 测试执行时间过长

**风险**: 集成测试变慢，影响开发体验

**缓解措施**:
- 将集成测试与单元测试分离（不同 script）
- CI 中并行运行单元测试和集成测试
- 使用 `test.skip()` 临时跳过慢速测试
- 定期审查测试性能，移除不必要的等待

**Trade-off**: 测试完整性 vs 执行速度

### Risk 3: Flaky Tests（不稳定测试）

**风险**: 异步操作、定时器、Mock 可能导致测试不稳定

**缓解措施**:
- 使用 `waitFor()` 而非固定延迟
- 使用 `vi.useFakeTimers()` 控制定时器
- 使用 `server.resetHandlers()` 清理 Mock
- 设置合理的超时时间（30s）
- 避免测试间的依赖关系

**Trade-off**: 测试可靠性 vs 测试复杂度

### Risk 4: Mock 数据与真实数据不一致

**风险**: Mock 的 API 响应可能与真实 API 不一致

**缓解措施**:
- 定期更新 Mock 数据（从真实 API 获取）
- 使用真实 API 响应的样本数据
- 在文档中记录 Mock 数据的来源和更新时间
- 考虑使用契约测试（Pact）验证 API 契约

**Trade-off**: Mock 简化性 vs 真实性

### Risk 5: IndexedDB 清理不彻底

**风险**: 测试间数据污染

**缓解措施**:
- 使用 `clearIndexedDB()` 工具函数
- 在 `beforeEach` 中强制清理
- 使用唯一的数据库命名空间（`test-${testName}`）
- 验证清理是否成功

**Trade-off**: 测试隔离性 vs 测试复杂度

## Migration Plan

### 阶段 1: 基础设施准备（Day 1-2）

1. **安装依赖**
   ```bash
   pnpm add -D msw
   ```

2. **创建集成测试配置**
   ```bash
   # 创建配置文件
   touch vitest.integration.config.ts
   touch src/__test__/integration/setup.ts
   ```

3. **创建测试辅助工具**
   ```bash
   mkdir -p src/__test__/helpers/integration
   touch src/__test__/helpers/integration/clearIndexedDB.ts
   touch src/__test__/helpers/integration/resetStore.ts
   touch src/__test__/helpers/integration/fixtures.ts
   touch src/__test__/helpers/integration/testServer.ts
   ```

4. **配置 package.json scripts**
   ```json
   {
     "scripts": {
       "test": "vitest",                                    // 单元测试
       "test:integration": "vitest -c vitest.integration.config.ts",
       "test:all": "pnpm test && pnpm test:integration"
     }
   }
   ```

### 阶段 2: 聊天流程集成测试（Day 3-5）

**Day 3: 基础设置**
- 配置 MSW server
- 创建测试 fixtures
- 实现 `clearIndexedDB` 和 `resetStore` 工具

**Day 4: 核心流程**
- 实现完整聊天流程测试（发送 → 响应 → 存储）
- 验证 Redux 状态更新
- 验证持久化存储

**Day 5: 错误处理**
- 测试 API 错误场景
- 测试网络超时场景
- 测试流式响应中断

### 阶段 3: 模型配置集成测试（Day 6-8）

**Day 6: 基础流程**
- 测试添加模型流程（表单 → 加密 → 存储）
- 测试使用模型流程（解密 → API 调用）

**Day 7: 编辑和删除**
- 测试编辑模型流程
- 测试删除模型流程
- 验证加密数据清理

**Day 8: 跨平台兼容**
- 测试 Tauri 环境（系统钥匙串）
- 测试 Web 环境（IndexedDB）

### 阶段 4: 设置变更集成测试（Day 9-10）

**Day 9: 语言切换**
- 测试语言切换流程（Redux → i18n → localStorage）
- 验证 UI 重新渲染

**Day 10: 其他设置**
- 测试推理内容开关
- 测试设置持久化
- 测试跨平台一致性

### 阶段 5: 验证和优化（Day 11）

1. **运行完整测试套件**
   ```bash
   pnpm test:all
   pnpm test:coverage
   ```

2. **性能验证**
   - 检查测试执行时间
   - 优化慢速测试

3. **文档更新**
   - 更新 AGENTS.md
   - 添加集成测试指南

### Rollback 策略

**如果测试引入问题**：
1. **单个测试失败**: 使用 `test.skip()` 临时跳过，创建 issue 跟踪
2. **整体测试失败**: 回滚到上一个稳定版本，重新设计测试
3. **CI 失败**: 阻止合并，修复测试后再合并
4. **性能退化**: 优化测试或分离到独立的 CI job

## Open Questions

1. **Q: 是否需要 MSW，还是使用现有的 Mock 策略？**
   - **A**: 推荐 MSW，因为：
     - 更接近真实网络层
     - 易于维护和调试
     - 类型安全
   - 如果集成困难，可以回退到 `vi.mock()`

2. **Q: 是否需要测试真实的 API 调用（使用测试环境）？**
   - **A**: 不推荐。原因：
     - 需要维护测试环境和 API Key
     - 测试不稳定（依赖网络）
     - 执行慢
   - 使用 MSW Mock 更可靠

3. **Q: 如何处理需要真实 Tauri 环境的测试？**
   - **A**: 使用 `@tauri-apps/plugin-mock` 或 Mock Tauri API
   - 仅在最终验证时使用真实 Tauri 环境

4. **Q: 集成测试应该在 CI 中何时运行？**
   - **A**: 建议：
     - **每次 PR**: 运行单元测试
     - **合并前**: 运行单元测试 + 集成测试
     - **夜间构建**: 运行全部测试 + E2E 测试

5. **Q: 如何避免集成测试与单元测试重复？**
   - **A**: 遵循原则：
     - 单元测试验证函数/组件逻辑
     - 集成测试验证模块协作和数据流
     - 避免在集成测试中重复单元测试的场景

6. **Q: 是否需要测试并发场景（多个聊天同时进行）？**
   - **A**: 不在本次变更范围。原因：
     - 复杂度高，收益不确定
     - 可以后续补充压力测试
   - 当前聚焦单用户场景

## Implementation Notes

### 测试文件组织

```
src/__test__/integration/
├── setup.ts                    # 集成测试设置
├── chat-flow.integration.test.ts
├── model-config.integration.test.ts
├── settings-change.integration.test.ts
└── cross-platform.integration.test.ts (可选)

src/__test__/helpers/integration/
├── clearIndexedDB.ts           # IndexedDB 清理工具
├── resetStore.ts               # Redux store 重置工具
├── fixtures.ts                 # 集成测试 fixtures
└── testServer.ts               # MSW server 配置
```

### CI/CD 集成

**建议的 CI 配置**：
```yaml
# .github/workflows/test.yml
test:
  parallel:
    - unit-tests:
        run: pnpm test
    - integration-tests:
        run: pnpm test:integration

test-full:
  script: pnpm test:all
  only: [merge_requests]
```

### 监控和告警

- 测试执行时间监控
- Flaky test 检测
- 覆盖率趋势跟踪
