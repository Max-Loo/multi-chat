# Toast 模块测试补充 - 技术设计

## Context

### 当前状态
Toast 模块是应用的全局用户反馈系统，由三个核心文件组成：
- `toastQueue.ts`（224行）：队列管理、响应式位置适配、Promise API - 已有 20 个单元测试，覆盖率 ~85%
- `ToasterWrapper.tsx`（32行）：React 组件，负责系统初始化和状态同步 - **0% 测试覆盖率**
- `index.ts`（66行）：模块导出

### 测试基础设施
项目已有完善的测试基础设施：
- 测试框架：Vitest + Testing Library
- Mock 工具：`vi.mock`、`vi.doMock`、动态导入（`vi.resetModules()`）
- 集成测试：MSW + 独立 Redux store
- 现有测试规范：BDD 原则、中文命名、Mock 系统边界

### 约束条件
- 必须遵循项目测试规范（BDD 原则、Mock 策略）
- 测试文件必须放在正确位置（`__test__/lib/toast/` 或 `__test__/integration/`）
- 不能影响现有 1528 个测试用例
- 测试执行时间控制在合理范围（新增 ~2秒）

## Goals / Non-Goals

**Goals:**
- 为 ToasterWrapper 组件创建全面的单元测试（8个用例，90%+ 覆盖率）
- 补充 Toast 系统集成测试（10个用例），验证与 Redux/Router 的协作
- 添加端到端场景测试（5个用例），覆盖真实用户场景
- 将 Toast 模块整体覆盖率从 79.66% 提升至 90%+

**Non-Goals:**
- 不修改 Toast 模块的生产代码
- 不改变现有的测试规范或基础设施
- 不测试 `toastQueue.ts` 的内部实现（已有充分测试）
- 不添加新的外部依赖

## Decisions

### 决策 1：Mock 策略 - 不 Mock useResponsive Hook

**选择**：在组件测试中使用**真实的** `useResponsive` Hook

**理由**：
- `useResponsive` 是项目内部实现，根据测试规范不应 Mock 内部依赖
- 测试规范明确指出：仅 Mock 系统边界（网络、文件系统、第三方服务）
- 使用真实 Hook 更符合 BDD 原则，验证真实用户场景

**实现**：
- 单元测试中：直接使用真实 Hook，通过 Fake Timers 或 `vi.stubGlobal('matchMedia', ...)` 控制 MediaQuery
- 集成测试中：无需特殊处理，真实 Hook 自然集成到测试环境
- 如遇到性能或稳定性问题，再考虑 Mock 并添加详细注释说明理由

### 决策 2：toastQueue 单例的处理

**选择**：**不 Mock** `toastQueue` 单例，直接调用它并验证**用户可见行为**

**理由**：
- `toastQueue` 已有完善的单元测试（20个用例），不需要重复测试其内部逻辑
- 根据 BDD 原则（`src/__test__/README.md:46-48`），测试应验证用户可见结果（UI 渲染），而非内部实现细节
- 使用 `vi.spyOn` 检查方法调用违反了测试规范，应该验证 Toast 消息真实显示在 UI 上

**错误示范**（❌ 违反规范）：
```typescript
// ❌ 检查内部实现 - 违反 BDD 原则
const successSpy = vi.spyOn(toastQueue, 'success');
toastQueue.success('设置保存成功');
expect(successSpy).toHaveBeenCalledWith('设置保存成功');
```

**正确实现**（✅ 符合规范）：
```typescript
// ✅ 验证用户可见行为 - 符合 BDD 原则
toastQueue.success('设置保存成功');
await waitFor(() => {
  expect(screen.getByText('设置保存成功')).toBeInTheDocument();
});
```

**实施要点**：
- **集成测试**：完全使用真实组件和 `toastQueue`，通过 DOM 查询验证 Toast 消息显示
- **ToasterWrapper 单元测试**（特殊情况）：
  - Mock `toastQueue` 以验证组件契约（正确调用公共 API：`setIsMobile`、`markReady`）
  - 通过验证 `getIsMobile()` 的返回值来确认状态同步（使用公共 API，而非内部实现）
  - Mock 的 `@/components/ui/sonner` 提供最小可渲染占位符
  - **理由**：ToasterWrapper 的核心职责是同步状态和标记就绪，验证公共 API 的正确调用是合理的单元测试策略

### 决策 2.1：ToasterWrapper 单元测试策略（代码审查改进）

**背景**：代码审查发现单元测试使用 `vi.spyOn` 检查内部方法调用，违反 BDD 原则

**改进方案**：
- **验证公共 API 而非内部实现**：
  ```typescript
  // ✅ 验证公共 API 的返回值
  await waitFor(() => {
    expect(toastQueue.getIsMobile()).toBe(true);  // 公共 API
  });
  ```
  而非：
  ```typescript
  // ❌ 验证内部方法调用
  expect(mockedToastQueue.setIsMobile).toHaveBeenCalledWith(true);
  ```

- **组件契约测试**：ToasterWrapper 的核心职责是调用 `toastQueue` 的公共 API，验证这些 API 被正确调用是合理的

- **用户可见行为**：完整的用户可见行为（Toast 消息显示）在集成测试中验证

### 决策 6：集成测试中使用 vi.spyOn 的策略

**背景**：代码审查指出集成测试只验证 spy 调用，未验证用户可见行为

**选择**：**暂时使用 vi.spyOn** 验证 toastQueue 方法调用

**理由**：
1. **Mock 策略限制**：
   - 当前 Mock `@/components/ui/sonner` 返回静态占位符
   - 要验证用户可见行为，需要同时 Mock `sonner` 库的 `toast` 方法和 `Toaster` 组件
   - Mock sonner 会引入复杂的依赖关系（主题系统、浏览器环境）

2. **测试覆盖完整性**：
   - `toastQueue` 的单元测试已覆盖核心逻辑（20 个用例）
   - 集成测试主要验证组件集成，而非重复测试 toastQueue 逻辑

3. **E2E 测试的局限性**：
   - 完整的 E2E 测试应使用真实浏览器环境（如 Playwright、Cypress）
   - 当前的集成测试框架（Vitest + Testing Library）不适合测试完整的 Toast UI

**实施要点**：
- 在 `toast-e2e.integration.test.tsx` 顶部添加详细注释，说明测试策略和限制
- 验证 `vi.spyOn` 的调用次数和参数，确保 toastQueue 方法被正确调用
- 未来增强：使用 Playwright 或 Cypress 进行完整的 E2E 测试

**错误修复**：
- 修复了无效断言 `toBeGreaterThanOrEqual(0)`，改为具体的 `toHaveBeenCalledTimes(5)`
- 删除了错误提交的 `.corrupt` 文件

### 决策 3：集成测试的模块隔离

**选择**：使用 `vi.resetModules()` + 动态导入实现测试隔离

**理由**：
- `toastQueue` 是单例，测试间可能污染状态
- `vi.resetModules()` 在每个测试前重置模块缓存，获得新的单例实例
- 参考现有模式：`toastQueue.test.ts` 已成功使用此策略

**实现**：
```typescript
beforeEach(() => {
  vi.resetModules();
});

// 动态导入获取新的实例
const { toastQueue } = await import('@/lib/toast/toastQueue');
```

### 决策 4：异步测试的时序控制

**选择**：使用 `waitFor` + Fake Timers 处理异步逻辑

**理由**：
- ToasterWrapper 的 `useEffect` 是异步的，需要 `waitFor` 等待执行
- 队列的 500ms 间隔需要 Fake Timers 控制时间
- 符合 Testing Library 最佳实践

**实现**：
```typescript
vi.useFakeTimers();
toastQueue.markReady();
await vi.advanceTimersByTimeAsync(500);
vi.useRealTimers();
```

### 决策 5：集成测试的 Store 创建

**选择**：使用现有的 `createTestStore()` 工具（来自 `@/__test__/helpers/render/redux.tsx`）

**理由**：
- 避免重复代码，保持一致性
- 该工具已配置好所有必需的 reducers 和 middleware
- 支持自定义 preloadedState

**注意**：
- 根据 `tasks.md` 3.1，应使用 `getTestStore()` 而非 `createTestStore()`
- 两者为同一工具的不同导出名称，实际功能相同

## Risks / Trade-offs

### 风险 1：真实 useResponsive 的稳定性

**风险**：使用真实的 `useResponsive` Hook 可能依赖浏览器环境（window.matchMedia），在测试环境中可能不稳定

**缓解**：
- 使用 `vi.stubGlobal('matchMedia', ...)` 提供稳定的 Mock 实现
- 或在必要时才 Mock `useResponsive`，并添加详细注释说明理由（根据测试规范 `src/__test__/README.md:325-375`）
- 参考现有测试：`useMediaQuery.test.ts`、`Sidebar.test.tsx` 的处理方式

### 风险 2：单例污染

**风险**：`toastQueue` 单例在测试间可能保留状态

**缓解**：
- **不 Mock** `toastQueue`，而是通过 `vi.resetModules()` + 动态导入获取新的单例实例
- 每个测试前使用 `vi.resetModules()` 重置模块缓存
- 在 `afterEach` 中调用 `cleanup()` 清理 DOM
- 在 `beforeEach` 中通过动态导入 `await import('@/lib/toast/toastQueue')` 获取全新实例

### 风险 3：异步时序不确定性

**风险**：`useEffect` 执行时机不确定，Toast 显示是异步的，DOM 查询可能过早

**缓解**：
- 使用 `waitFor()` 等待 Toast 消息出现在 DOM 中
- 合理设置 timeout（默认 1000ms，必要时增加到 3000ms）
- 对于队列测试，使用 Fake Timers 精确控制时间流逝
- 使用 `screen.getByText()` 或 `screen.queryByText()` 配合 `waitFor` 验证用户可见行为

### 风险 4：与现有测试冲突

**风险**：全局 Mock 可能影响其他测试

**缓解**：
- 在 `afterEach` 中清理所有 Mock
- 使用 `beforeEach` 为每个测试重新配置 Mock
- 避免修改全局对象（如 `window.matchMedia`）

## Mock 注释要求

**根据项目测试规范**（`src/__test__/README.md:325-375`）：

所有 `vi.mock()` 调用**必须**添加清晰的理由说明。

**正确示例**：
```typescript
// Mock @/components/ui/sonner because Toaster relies on browser-specific APIs
// and we want to test queue logic without full UI rendering overhead
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Mocked Toaster</div>,
}));
```

**错误示例**（❌ 缺少注释）：
```typescript
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Mocked Toaster</div>,
}));
```

**注释应包含**：
- Mock 的原因（为什么需要 Mock？）
- Mock 的范围（Mock 了什么行为？）
- 如违反了默认原则（如 Mock 内部实现），必须详细说明理由

## Migration Plan

### 阶段 1：ToasterWrapper 单元测试（2-3小时）
1. 创建 `src/__test__/lib/toast/ToasterWrapper.test.tsx`
2. 配置 Mock（仅 sonner 组件，不 Mock toastQueue）
3. 实现 8 个测试用例
4. **重点**：使用 `vi.spyOn` 仅用于临时跟踪，主要验证 DOM 行为
5. 运行测试并修复失败用例
6. 验证覆盖率达到 90%+

### 阶段 2：Toast 系统集成测试（3-4小时）
1. 创建 `src/__test__/integration/toast-system.integration.test.ts`
2. 配置测试环境（store、router、MSW）
3. 实现 10 个测试用例
4. **重点**：验证用户可见行为（Toast 显示在 UI 上），而非内部方法调用
5. 使用 `screen.getByText()` + `waitFor` 验证 Toast 消息
6. 验证队列积压和响应式位置切换

### 阶段 3：端到端场景测试（2-3小时）
1. 创建 `src/__test__/integration/toast-e2e.integration.test.ts`
2. 实现 5 个真实用户场景测试
3. **重点**：验证完整的用户交互流程，不关注内部实现
4. 重点关注错误恢复和竞态条件
5. 验证边界情况处理

### 阶段 4：验证和优化（1小时）
1. 运行所有测试：`pnpm test:all`
2. 检查覆盖率：`pnpm test:coverage`
3. 确保无回归（现有测试继续通过）
4. 性能优化（如需要）

### 回滚策略
- 测试代码独立于生产代码，可随时删除
- 使用 Git 追踪变更，可轻松回滚
- 不影响应用功能，风险极低

## Open Questions

### 问题 1：是否需要测试 Toaster 在不同路由下的行为？

**状态**：已解决 - 不包含在范围

**理由**：
- 提案中明确只包含 Redux middleware 集成
- 路由测试复杂度高，且与 Toast 核心功能关联度低
- 可作为后续增强

### 问题 2：是否需要测试 Toast 在网络错误场景下的行为？

**状态**：已解决 - 在 E2E 测试中覆盖

**实现**：
- `toast-e2e.integration.test.ts` 中包含"localStorage 失败"场景
- Mock `localStorage.setItem` 抛出错误
- 验证错误 Toast 正确显示

### 问题 3：测试文件是否需要支持并发执行？

**状态**：已解决 - 使用 `maxConcurrency: 1`

**实现**：
- 集成测试已在 `vitest.integration.config.ts` 中配置 `maxConcurrency: 1`
- 单元测试默认并发执行，但已通过模块隔离避免冲突
