## Context

### 当前状态

项目当前使用 Vitest 作为测试框架，位于 `src/__test__/` 目录下。现有的测试覆盖主要集中在：
- 加密工具函数（`crypto.test.ts`）
- 主密钥管理（`masterKey.test.ts`）
- 存储层（`modelStorage.test.ts`、`chatStorage.ts`）
- 测试辅助工具（`src/__test__/helpers/`）

### 缺失的测试覆盖

以下核心模块完全没有单元测试：
1. **`src/services/modelRemoteService.ts`**（420 行）- 远程数据获取服务
2. **`src/store/slices/modelProviderSlice.ts`**（180 行）- Redux 状态管理
3. **`src/store/middleware/chatMiddleware.ts`**（27 行）- 聊天持久化中间件
4. **`src/store/middleware/modelMiddleware.ts`**（14 行）- 模型持久化中间件

### 约束条件

- **测试框架**: 必须使用现有的 Vitest 框架
- **Mock 工具**: 利用项目现有的 `src/__test__/helpers/mocks/` Mock 工厂
- **测试环境**: happy-dom（已在 vite.config.ts 中配置）
- **语言**: 中文注释和测试描述
- **代码风格**: 遵循项目的 ESLint 和 TypeScript 严格模式

---

## Goals / Non-Goals

### Goals

1. **提供全面的单元测试覆盖**，确保核心服务层和状态管理的可靠性
2. **建立可维护的测试模式**，为后续类似模块的测试提供参考
3. **验证错误处理和边界条件**，特别是网络请求、重试机制和缓存降级
4. **确保测试独立性**，每个测试用例可独立运行，不依赖外部服务或文件系统

### Non-Goals

1. **不修改生产代码逻辑** - 测试仅验证现有行为，不改变功能
2. **不进行集成测试或 E2E 测试** - 仅关注单元级别的测试
3. **不优化性能** - 测试执行速度不是当前优先级（虽然应避免不必要的慢测试）
4. **不修改测试框架配置** - 使用现有的 Vitest 配置

---

## Decisions

### 1. Mock 策略选择

**决策**: 使用 **函数级 Mock** 而不是 HTTP 级 Mock

**理由**:
- `modelRemoteService.ts` 依赖 `@/utils/tauriCompat` 的 fetch 和 Store
- 直接 Mock fetch 函数比启动 HTTP mock server 更简单
- 可以精确控制超时、网络错误等场景
- 符合项目现有的 Mock 模式（见 `src/__test__/helpers/mocks/`）

**替代方案**:
- **MSW (Mock Service Worker)**: 过于重量级，需要额外依赖
- **nock**: 仅支持 Node.js，不兼容 Vitest 的 browser 环境

### 2. Redux Thunk 测试方法

**决策**: 使用 **Redux Toolkit 的 configureStore** + **Mock Thunk 依赖**

**理由**:
- 创建真实的 Redux store（包含 middleware）
- Mock 服务层函数（`fetchRemoteData`、`loadCachedProviderData`）
- 测试真实的 reducer 逻辑和 extraReducers 状态转换
- 可以验证 dispatch 的 action 序列

**实现示例**:
```typescript
const mockStore = configureStore({
  reducer: {
    modelProvider: modelProviderSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: { extraArgument: {} } }),
});

// Mock 服务层
vi.mock('@/services/modelRemoteService', () => ({
  fetchRemoteData: vi.fn(),
  saveCachedProviderData: vi.fn(),
  loadCachedProviderData: vi.fn(),
}));
```

### 3. Listener Middleware 测试方法

**决策**: 使用 **Redux Listener Middleware 的测试模式**

**理由**:
- 创建包含 listener middleware 的 store
- Mock 存储层函数（`saveModelsToJson`、`saveChatsToJson`）
- Dispatch action 后验证 effect 函数是否被调用
- 验证传入存储函数的参数是否正确

**实现示例**:
```typescript
const store = configureStore({
  reducer: {
    models: modelSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(saveModelsMiddleware.middleware),
});

// Mock 存储层
vi.mock('../storage', () => ({
  saveModelsToJson: vi.fn().mockResolvedValue(undefined),
}));

// 测试
await store.dispatch(createModel({ model: mockModel }));
expect(saveModelsToJson).toHaveBeenCalledWith(expect.any(Array));
```

### 4. 测试文件组织结构

**决策**: 按照源代码目录结构镜像组织测试文件

**理由**:
- 测试文件与源文件位置对应，易于查找
- 符合项目的现有结构（如 `src/__test__/store/storage/modelStorage.test.ts`）

**目录结构**:
```
src/__test__/
├── services/
│   └── modelRemoteService.test.ts
├── store/
│   ├── slices/
│   │   └── modelProviderSlice.test.ts
│   └── middleware/
│       ├── chatMiddleware.test.ts
│       └── modelMiddleware.test.ts
```

### 5. 异步测试模式

**决策**: 使用 **async/await + vi.waitFor**

**理由**:
- Vitest 原生支持 async 测试函数
- `vi.waitFor` 可以等待异步状态更新（Redux 状态变化）
- 适用于 Thunk 和 middleware 的异步操作

---

## Risks / Trade-offs

### 风险 1: Mock 复杂性过高

**风险描述**: `modelRemoteService.ts` 有多个依赖（fetch、Store、定时器），Mock 配置可能变得复杂

**缓解措施**:
- 创建专用的测试辅助函数（如 `createMockFetch`、`createMockStore`）
- 在 `src/__test__/helpers/mocks/` 中扩展 Mock 工厂
- 使用 `vi.fn().mockImplementation()` 提供灵活的 Mock 实现

### 风险 2: 测试与实现耦合

**风险描述**: 过度关注实现细节可能导致测试脆弱（重构时频繁失败）

**缓解措施**:
- 专注于**行为测试**而非实现细节
- 测试输入输出契约，而非内部函数调用
- 使用黑盒测试视角（从外部 API 验证行为）

### 风险 3: 异步测试不稳定

**风险描述**: 涉及超时、重试的异步测试可能出现竞态条件

**缓解措施**:
- 使用 Vitest 的 `vi.useFakeTimers()` 控制定时器
- 使用 `vi.waitFor()` 等待异步操作完成
- 避免硬编码等待时间（`vi.sleep()`），改用 `vi.advanceTimersByTime()`

### 风险 4: 测试执行时间过长

**风险描述**: 大量网络请求 Mock 和重试场景测试可能拖慢 CI/CD

**缓解措施**:
- 使用 `vi.useFakeTimers()` 加速超时测试
- 并行运行测试（Vitest 默认行为）
- 对慢测试添加 `test.slow()` 标记

---

## Migration Plan

### 实施步骤

1. **扩展 Mock 工厂**（可选，根据需要）
   - 在 `src/__test__/helpers/mocks/` 中添加 `modelRemoteService.ts` 专用 Mock
   - 创建 `createMockStore` 辅助函数

2. **创建 modelRemoteService 测试**
   - 测试文件: `src/__test__/services/modelRemoteService.test.ts`
   - 覆盖所有公开函数和错误场景
   - 使用 `vi.useFakeTimers()` 测试超时和重试

3. **创建 modelProviderSlice 测试**
   - 测试文件: `src/__test__/store/slices/modelProviderSlice.test.ts`
   - Mock `modelRemoteService` 函数
   - 测试所有 Thunk 和 reducer

4. **创建 Middleware 测试**
   - 测试文件: `src/__test__/store/middleware/chatMiddleware.test.ts`
   - 测试文件: `src/__test__/store/middleware/modelMiddleware.test.ts`
   - Mock 存储层函数
   - 验证 action 触发后的副作用

5. **运行测试并修复**
   - 执行 `pnpm test:run` 验证所有测试通过
   - 执行 `pnpm test:coverage` 检查覆盖率（目标 >80%）

### 回滚策略

- **测试代码独立于生产代码**，删除测试文件不影响应用功能
- 如果测试导致 CI 失败，可以暂时跳过：`test.skip()` 或 `describe.skip()`
- 保留测试文件但标记为 `.skip.ts` 以便后续修复

---

## Open Questions

1. **是否需要 Mock Vercel AI SDK 的 provider 函数？**
   - 当前 `modelRemoteService` 不依赖 AI SDK，但 `chatService` 依赖
   - **待定**: 本变更不涉及 `chatService`，留待后续变更

2. **是否需要测试私有辅助函数？**
   - 如 `combineSignals`、`adaptApiResponseToInternalFormat`
   - **建议**: 通过测试公开函数间接验证，不直接测试私有函数（除非复杂度极高）

3. **测试覆盖率目标？**
   - **建议**: 核心函数 >90%，整体 >80%
   - **待确认**: 是否需要严格执行覆盖率门槛（如 CI 中强制检查）

4. **是否需要添加性能基准测试？**
   - 如测试大量模型数据的加载性能
   - **建议**: 当前不添加，专注于功能正确性

---

## 参考资料

- **Vitest 官方文档**: https://vitest.dev/
- **Redux Toolkit 测试指南**: https://redux-toolkit.js.org/usage/usage-guide-writing-tests
- **项目现有测试**: `src/__test__/store/storage/modelStorage.test.ts`（参考模式）
- **AGENTS.md 测试辅助工具**: `src/__test__/helpers/` 目录说明
