## Context

项目测试基础设施已完善（见 `src/__test__/README.md`），包括 Mock 工厂、Fixtures、MSW handlers 等。但 P0 级别的核心模块缺少测试覆盖：

- `lib/toast/toastQueue.ts`：224 行，Toast 队列管理核心逻辑
- `lib/toast/index.ts`：Toast API 封装层
- `hooks/useCreateChat.ts`：创建聊天的业务 Hook

**约束**：
- 遵循项目行为驱动测试原则（测试用户可见行为，而非内部实现）
- 仅 Mock 系统边界（第三方库），不 Mock 内部实现
- 使用现有的测试辅助工具

## Goals / Non-Goals

**Goals:**
- 为 P0 模块添加完整的单元测试覆盖
- 覆盖正常路径和错误路径
- 覆盖边界条件和异步逻辑
- 测试文件遵循项目测试规范

**Non-Goals:**
- 不修改源代码逻辑
- 不为 P1/P2 级别模块添加测试（后续迭代）
- 不添加集成测试（已有单独的集成测试目录）

## Decisions

### D1: ToastQueue 测试策略 - 使用模块重新加载

**决策**：通过 `vi.resetModules()` 和动态导入实现测试隔离

**理由**：
- `ToastQueue` 类未导出（仅导出单例 `toastQueue`），无法直接实例化
- 使用 `vi.resetModules()` 可以在每次测试前重新加载模块，获得新的单例实例
- 配合 `vi.doMock('sonner')` 可以控制 sonner 的行为

**实现方式**：
```typescript
beforeEach(() => {
  vi.resetModules();
});

it('测试场景', async () => {
  vi.doMock('sonner', () => ({
    toast: {
      success: vi.fn(() => 'toast-id'),
    },
  }));
  
  const { toastQueue } = await import('@/lib/toast/toastQueue');
  // 使用 toastQueue 进行测试
});
```

**替代方案**：
- 修改源码导出 ToastQueue 类 → 违反"源代码逻辑不变"原则，不采用

### D2: Mock sonner 库

**决策**：Mock `sonner` 库的 `toast` 函数

**理由**：
- `sonner` 是第三方库，属于系统边界
- Mock 后可以验证调用参数，而非依赖真实 DOM 渲染
- 避免测试环境中的副作用

### D3: useCreateChat 测试使用 renderHook

**决策**：使用 `@testing-library/react` 的 `renderHook` 测试 Hook

**理由**：
- 项目已有此依赖
- 标准的 React Hook 测试方式
- 可以验证 Hook 返回值和副作用

### D4: Mock Redux 和 Router

**决策**：Mock `useAppDispatch` 和 `useNavigateToChat`

**理由**：
- 测试 Hook 的行为，而非 Redux 或 Router 的实现
- Mock 系统边界（Redux、Router 属于外部依赖）
- 可以验证 dispatch 和 navigate 的调用参数

**实现方式**：
```typescript
// Mock Redux hooks
vi.mock('@/hooks/redux', () => ({
  useAppDispatch: vi.fn(() => vi.fn()),
}));

// Mock Router hooks
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: vi.fn(() => ({
    navigateToChat: vi.fn(),
  })),
}));

// 使用 renderHook 测试
const { result } = renderHook(() => useCreateChat());
```

**注意**：由于使用了 vi.mock，不需要 Provider wrapper。如果未来改用真实 Redux store，则需要添加 wrapper。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| ToastQueue 内部状态难以验证 | 通过验证 toast 函数的调用参数间接验证状态 |
| 异步测试可能不稳定 | 使用 `vi.useFakeTimers()` 控制时间 |
| Mock 过度导致测试无意义 | 仅 Mock 系统边界，验证调用参数和次数 |
