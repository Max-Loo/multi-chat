# 单元测试补充方案 - 技术设计文档

## Context

### 当前状态

项目已有完善的测试基础设施：
- **测试框架**: Vitest v4.0.18，配置了并行执行（4 线程）
- **测试库**: React Testing Library（组件测试）、Redux Toolkit 测试工具（状态管理测试）
- **覆盖率工具**: @vitest/coverage-v8
- **现有测试**: 78 个测试文件，覆盖率 75.6% statements

**测试文件组织结构**：
```
src/__test__/
├── components/          # 组件测试
├── hooks/              # 自定义 Hooks 测试
├── store/              # Redux 状态管理测试
│   ├── middleware/     # 中间件测试
│   ├── slices/         # Slice 测试
│   └── storage/        # 存储层测试
├── pages/              # 页面级组件测试
├── utils/              # 工具函数测试
└── helpers/            # 测试辅助工具
    ├── fixtures/       # 测试数据 fixtures
    ├── isolation/      # 隔离测试工具
    └── mocks/          # Mock 工具
```

### 约束条件

1. **无 breaking changes**: 不能修改任何生产代码，仅添加测试
2. **保持一致性**: 遵循现有测试风格和命名规范
3. **性能考虑**: 测试执行时间不应显著增加（目标 <5 秒增量）
4. **维护性**: 测试代码应该易于理解和维护

### 利益相关者

- **开发者**: 需要清晰的测试文档和易于调试的测试
- **CI/CD**: 需要稳定的测试套件，避免 flaky tests
- **代码审查**: 需要测试作为重构安全网

## Goals / Non-Goals

**Goals:**
- 为 9 个核心模块补充完整的单元测试，覆盖主要场景和边界情况
- 保持测试代码质量和可维护性
- 提升整体测试覆盖率至 82% statements, 70% branches
- 建立可复用的测试 fixtures 和 mocks

**Non-Goals:**
- 不修改生产代码（仅添加测试）
- 不重写现有测试
- 不补充 E2E 测试（留待后续变更）
- 不追求 100% 覆盖率（关注核心业务逻辑）

## Decisions

### 1. 测试分层策略

**决策**: 采用三层测试金字塔

```
┌─────────────────────┐
│   E2E Tests (少量)   │  ← 不在本变更范围
├─────────────────────┤
│ Integration Tests    │  ← 已有 3 个，不扩展
├─────────────────────┤
│ Unit Tests (大量)    │  ← 本变更重点 (9 个模块)
└─────────────────────┘
```

**理由**:
- 单元测试运行快、反馈快、易于调试
- 已有集成测试覆盖跨模块场景
- E2E 测试成本高，独立规划

### 2. Mock 策略

**决策**: 按模块类型采用不同 Mock 策略

| 模块类型 | Mock 策略 | 理由 |
|---------|----------|------|
| **Redux** (middleware/slices) | Mock 外部依赖（localStorage, i18n） | 隔离 Redux 逻辑 |
| **组件** - Redux 连接 | Mock Redux store | 测试组件逻辑，不测试 Redux |
| **组件** - UI 交互 | Mock API/服务 | 避免外部依赖 |
| **工具函数** | 不需要 Mock | 纯函数，易于测试 |

**示例**:
```typescript
// Redux 中间件测试 - Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
global.localStorage = mockLocalStorage as any

// 组件测试 - Mock Redux store
const mockStore = configureStore({
  reducer: {
    modelProvider: () => ({ providers: mockProviders })
  }
})
```

### 3. 测试数据管理

**决策**: 扩展现有 `src/__test__/helpers/fixtures/` 目录

**新增 Fixtures**:
```typescript
// fixtures/modelProvider.ts - 扩展
export const mockProviderDetails: RemoteProviderData = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com',
  models: [
    { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
    { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' }
  ]
}

// fixtures/reduxState.ts - 新增
export const mockChatPageState = {
  isSidebarCollapsed: false,
  isShowChatPage: true
}
```

**理由**:
- 集中管理测试数据，易于维护
- 避免重复代码
- 保持测试数据一致性

### 4. 异步测试策略

**决策**: 使用 Vitest 的原生异步测试支持

```typescript
// 防抖测试 - 使用 vi.useFakeTimers()
it('should debounce search input', async () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useDebouncedFilter('test', data))
  
  act(() => {
    vi.advanceTimersByTime(300)
  })
  
  await waitFor(() => {
    expect(result.current.filteredList).toHaveLength(expected)
  })
})
```

**理由**:
- Vitest 内置 timer mocking，无需额外依赖
- 比 jest.useFakeTimers() 更稳定
- 与 Vitest 的 async 机制兼容

### 5. 组件测试风格

**决策**: 采用 "用户视角" 测试（Behavior-Driven）

```typescript
// ✅ 好 - 测试用户行为
it('should filter providers when user types in search box', async () => {
  const user = userEvent.setup()
  render(<ModelSidebar {...props} />)
  
  await user.type(screen.getByPlaceholderText('搜索模型'), 'deep')
  
  expect(screen.getByText('DeepSeek')).toBeInTheDocument()
  expect(screen.queryByText('OpenAI')).not.toBeInTheDocument()
})

// ❌ 差 - 测试实现细节
it('should update filterText state', () => {
  // 测试内部状态，不是用户行为
})
```

**理由**:
- 符合 Testing Library 最佳实践
- 测试更稳定，不易因重构而失败
- 关注用户价值，而非实现细节

### 6. Redux 中间件测试方案

**决策**: 使用 Redux Toolkit 的 `createListenerMiddleware` 测试模式

```typescript
it('should persist language to localStorage when language changes', async () => {
  const store = configureStore({
    reducer: {
      appConfig: appConfigReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(saveDefaultAppLanguage.middleware),
  })

  store.dispatch(setAppLanguage('zh'))

  await waitFor(() => {
    expect(localStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_LANGUAGE_KEY,
      'zh'
    )
  })
})
```

**理由**:
- 测试真实的中间件集成，而非单元逻辑
- 验证副作用（localStorage、i18n）是否正确触发
- Redux Toolkit 官方推荐的测试方式

## Risks / Trade-offs

### Risk 1: 测试执行时间增加

**风险**: 新增 200+ 测试用例可能导致测试套件变慢

**缓解措施**:
- 使用 Vitest 的并行执行（已配置 4 线程）
- 将慢速测试（异步、防抖）标记为 `test.slow()`
- 使用 `vi.useFakeTimers()` 加速定时器测试

**Trade-off**: 测试覆盖率 vs 执行速度

### Risk 2: Mock 维护成本

**风险**: Mock 可能与真实实现脱节

**缓解措施**:
- Mock 最小化原则（只 mock 外部依赖）
- 定期验证 mock 与真实 API 的一致性
- 使用 TypeScript 确保类型安全
- 文档化 mock 行为（注释说明 mock 逻辑）

**Trade-off**: 测试隔离性 vs mock 维护成本

### Risk 3: 测试脆弱性（Flaky Tests）

**风险**: 异步测试、定时器测试可能不稳定

**缓解措施**:
- 使用 `waitFor()` 而非固定延迟
- 使用 `vi.useFakeTimers()` 控制定时器
- 为异步操作设置合理的 timeout
- 避免测试实现细节，聚焦用户行为

**Trade-off**: 测试可靠性 vs 测试复杂度

### Risk 4: 覆盖率假象

**风险**: 追求数字导致低质量测试

**缓解措施**:
- Code Review 关注测试质量，而非覆盖率数字
- 优先测试核心业务逻辑和边界情况
- 避免 "为了覆盖率而测试" 的无用测试
- 定期审查测试的有效性

**Trade-off**: 覆盖率数字 vs 测试有效性

## Migration Plan

### 阶段 1: 准备（Day 1）

1. **扩展测试辅助工具**
   ```bash
   # 创建新的 fixtures
   touch src/__test__/helpers/fixtures/reduxState.ts
   touch src/__test__/helpers/fixtures/modelProvider.ts
   ```

2. **配置测试环境**
   - 验证 Vitest 配置（已完成）
   - 确认测试超时设置（10s）
   - 配置 coverage 排除规则

### 阶段 2: P0 模块测试（Days 2-6）

**每日完成 1 个模块**:

| Day | 模块 | 预计测试用例数 |
|-----|------|---------------|
| Day 2 | `appConfigMiddleware.test.ts` | 20-25 |
| Day 3 | `chatPageSlices.test.ts` | 15-20 |
| Day 4 | `ModelSidebar.test.tsx` | 30-35 |
| Day 5 | `ProviderCardDetails.test.tsx` | 25-30 |
| Day 6 | `ModelSearch.test.tsx` | 20-25 |

### 阶段 3: P1 模块测试（Days 7-10）

**每日完成 1 个模块**:

| Day | 模块 | 预计测试用例数 |
|-----|------|---------------|
| Day 7 | `NoProvidersAvailable.test.tsx` | 15-20 |
| Day 8 | `ModelProviderDisplay.test.tsx` | 10-15 |
| Day 9 | `ErrorAlert.test.tsx` | 12-15 |
| Day 10 | `NotFound.test.tsx` | 10-12 |

### 阶段 4: 验证和优化（Day 11）

1. **运行完整测试套件**
   ```bash
   pnpm test:run
   pnpm test:coverage
   ```

2. **验证覆盖率目标**
   - Statements > 82%
   - Branches > 70%
   - Functions > 78%

3. **代码审查和优化**
   - 移除重复测试
   - 优化慢速测试
   - 更新测试文档

### Rollback 策略

**如果测试引入问题**:
1. 回滚单个测试文件（删除问题文件）
2. CI 失败时自动阻止合并
3. 使用 `test.skip()` 临时跳过问题测试
4. 创建 issue 跟踪修复

## Open Questions

1. **Q: 是否需要测试可访问性（a11y）？**
   - **A**: 不在本变更范围。可使用 `jest-axe` 后续补充。

2. **Q: 如何测试国际化（i18n）文本？**
   - **A**: Mock `useTranslation` hook，验证 key 而非具体文本。示例：
     ```typescript
     vi.mock('react-i18next', () => ({
       useTranslation: () => ({
         t: (key: string) => key
       })
     }))
     ```

3. **Q: 测试文件是否需要 100% 覆盖模块的所有功能？**
   - **A**: 不是。优先测试：
     - 核心业务逻辑
     - 边界情况（空值、错误）
     - 用户交互路径
     - 可维护性：简单展示组件（如纯 UI）可降低覆盖率要求

4. **Q: 如何处理测试中的第三方依赖（如 Redux Toolkit）？**
   - **A**: 优先使用官方推荐的测试工具：
     - `@reduxjs/toolkit` 的 `configureStore`
     - `@testing-library/react` 的 `render` 和 `screen`
     - 仅在必要时 mock 第三方库

5. **Q: 是否需要为每个测试文件添加 README 或文档？**
   - **A**: 不是。测试代码应该是自文档化的（良好的命名、清晰的断言）。复杂测试可添加注释说明意图。

## Implementation Notes

### 测试文件模板

基于项目现有测试风格，每个测试文件应包含：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Mock 外部依赖
vi.mock('@/lib/i18n', () => ({ changeAppLanguage: vi.fn() }))
vi.mock('@/utils/tauriCompat/store', () => ({
  setItem: vi.fn()
}))

describe('<ModuleName>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('核心功能', () => {
    it('should ...', () => { })
  })

  describe('边界情况', () => {
    it('should handle empty data', () => { })
  })

  describe('用户交互', () => {
    it('should respond to user action', async () => { })
  })
})
```

### 命名规范

- **测试文件**: `<ModuleName>.test.tsx` (组件) 或 `.test.ts` (逻辑)
- **测试套件**: `describe('<ModuleName>', () => { })`
- **测试用例**: `it('should <expected behavior> when <condition>', () => { })`
- **中文描述**: 按项目规范，使用中文描述（"应该...当..."）

### CI/CD 集成

现有 CI 配置已包含测试步骤，无需修改：
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:run

- name: Generate coverage
  run: pnpm test:coverage
```

新增测试会自动纳入 CI 流程。
