# Design: 自定义 Hooks 测试实现

## Context

### 当前状态
项目当前测试覆盖率为 49.63%，其中自定义 Hooks 目录（`src/hooks/`）下的 10 个文件完全未测试（0% 覆盖率）。这些 Hooks 在应用中被广泛使用，包括：
- 工具类 Hooks（`useDebounce`、`useConfirm`）
- 导航类 Hooks（`useNavigateToPage`、`useNavigateToExternalSite`）
- 数据选择器 Hooks（`useCurrentSelectedChat`、`useExistingChatList`、`useExistingModels`）
- UI 交互 Hooks（`useAdaptiveScrollbar`、`useBasicModelTable`）
- Redux 类型化 Hooks（`redux.ts`）

### 约束条件
- **测试框架**：项目已使用 Vitest + React Testing Library，需保持一致性
- **测试辅助工具**：项目已有完善的 Mock 工厂和测试工具（`src/__test__/helpers/`、`src/__test__/utils/`），应优先复用
- **时间戳规范**：使用 `@/utils/utils` 的 `getCurrentTimestamp()` 而非 `Date.now()`
- **Mock 规范**：使用 `createTauriMocks` 创建统一的 Mock 对象

### 利益相关者
- **开发团队**：需要清晰的测试用例以便后续维护和重构
- **代码质量**：提高整体测试覆盖率，减少回归风险
- **CI/CD 流水线**：测试用例需要快速且可靠

---

## Goals / Non-Goals

**Goals:**
1. 为 10 个自定义 Hooks 添加完整的单元测试，覆盖率达到 80%+
2. 测试用例清晰、可维护，遵循项目现有的测试模式
3. 复用项目现有的测试辅助工具和 Mock 工厂
4. 确保测试执行速度快，不影响开发体验

**Non-Goals:**
1. 不修改 Hooks 的源代码实现（除非发现 bug）
2. 不添加新的测试依赖库
3. 不测试第三方库（如 React Router、i18next）的行为
4. 不添加集成测试或 E2E 测试（仅单元测试）

---

## Decisions

### 决策 1：使用 `@testing-library/react` 的 `renderHook` 测试自定义 Hooks

**选择理由**：
- React Testing Library 是项目现有测试框架
- `renderHook` 专为测试 Hooks 设计，提供了隔离的测试环境
- 自动处理 Hook 的挂载和卸载生命周期
- 支持在测试中更新 Hook 的参数

**替代方案**：
- *手动创建测试组件*：需要更多样板代码，不易维护
- *直接测试使用 Hook 的组件*：混淆了 Hook 和组件的测试职责

**实现示例**：
```typescript
import { renderHook, act } from '@testing-library/react';

test('useDebounce 应延迟更新值', () => {
  const { result } = renderHook(() => useDebounce('test', 500));
  expect(result.current).toBe('test');

  act(() => {
    // 更新值
  });
});
```

---

### 决策 2：Redux Hooks 测试使用 Mock Store

**选择理由**：
- `useAppSelector` 和 `useAppDispatch` 依赖 Redux store
- 使用 Mock store 可以完全控制测试环境
- 避免真实的 Redux store 带来的副作用
- 测试更快速、更隔离

**实现方案**：
```typescript
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '@/store';

const mockStore = configureStore({
  reducer: rootReducer,
  preloadedState: {
    // Mock state
  },
});

wrapper: ({ children }) => (
  <Provider store={mockStore}>{children}</Provider>
)
```

**替代方案**：
- *使用真实的 Redux store*：引入不必要的复杂性和副作用

---

### 决策 3：Tauri 兼容层 Hooks 测试两种环境

**选择理由**：
- `useNavigateToExternalSite` 在 Tauri 和 Web 环境行为不同
- 需要验证两种环境下的正确性
- 使用 `createTauriMocks` 切换环境

**实现方案**：
```typescript
describe('Tauri 环境', () => {
  beforeEach(() => {
    const mocks = createTauriMocks({ isTauri: true });
    // 测试 Tauri 行为
  });
});

describe('Web 环境', () => {
  beforeEach(() => {
    const mocks = createTauriMocks({ isTauri: false });
    // 测试 Web 行为
  });
});
```

---

### 决策 4：测试文件组织结构

**选择理由**：
- 与项目现有测试结构保持一致
- 便于查找和维护
- 符合测试覆盖率工具的默认配置

**目录结构**：
```
src/__test__/hooks/
├── useDebounce.test.ts
├── useConfirm.test.tsx
├── useNavigateToPage.test.ts
├── useCurrentSelectedChat.test.ts
├── useExistingChatList.test.ts
├── useExistingModels.test.ts
├── useAdaptiveScrollbar.test.ts
├── useBasicModelTable.test.tsx
├── useNavigateToExternalSite.test.ts
└── redux.test.ts
```

**命名规范**：
- 测试文件名与源文件名对应，添加 `.test.ts` 或 `.test.tsx` 后缀
- 使用 `.test.tsx` 如果 Hook 返回 JSX（如 `useConfirm` 的 Provider）

---

### 决策 5：使用 Fake Timers 测试时间相关逻辑

**选择理由**：
- `useDebounce` 依赖 `setTimeout` 和 `clearTimeout`
- 真实定时器会导致测试慢且不稳定
- Vitest 内置支持 Fake Timers

**实现方案**：
```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('防抖延迟', () => {
  const { result } = renderHook(() => useDebounce('value', 500));
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe('value');
});
```

---

### 决策 6：Context Provider Hooks 测试策略

**选择理由**：
- `useConfirm` 依赖 `ConfirmProvider` Context
- 需要测试 Provider 的正确性和错误处理

**实现方案**：
```typescript
import { renderHook } from '@testing-library/react';
import { ConfirmProvider } from '@/hooks/useConfirm';

const wrapper = ({ children }) => (
  <ConfirmProvider>{children}</ConfirmProvider>
);

// 测试正常使用
test('应显示确认对话框', () => {
  const { result } = renderHook(() => useConfirm(), { wrapper });
  // ...
});

// 测试 Context 外使用报错
test('Context 外应抛出错误', () => {
  expect(() => renderHook(() => useConfirm())).toThrow();
});
```

---

## Risks / Trade-offs

### 风险 1：React Hooks 闭包陷阱
**描述**：Hooks 测试可能遇到闭包过时的值，导致测试失败

**缓解措施**：
- 使用 `act()` 包装所有状态更新
- 使用 `waitFor` 等待异步操作完成
- 确保测试中正确处理 Hook 的依赖数组

### 风险 2：Mock 复杂度
**描述**：某些 Hooks 依赖多个模块（Redux、Router、i18next），Mock 可能复杂

**缓解措施**：
- 优先使用项目现有的 Mock 工厂
- 对于简单 Mock，使用 `vi.mock()` 直接 Mock 模块
- 对于复杂 Mock，创建辅助函数减少重复代码

### 风险 3：测试执行时间
**描述**：Mock 定时器和异步操作可能导致测试变慢

**缓解措施**：
- 使用 Fake Timers 替代真实定时器
- 并行运行测试（Vitest 默认行为）
- 避免不必要的 `waitFor` 超时时间

### 风险 4：覆盖率和质量平衡
**描述**：追求覆盖率可能忽视测试质量

**缓解措施**：
- 优先测试关键业务逻辑和边界情况
- 代码审查时关注测试用例的质量，而不仅仅是覆盖率数字
- 使用 TDD 方法：先写失败的测试，再实现功能（如果修改源代码）

---

## Migration Plan

### 实施步骤

**阶段 1：测试辅助工具验证**
- 验证 `createTauriMocks`、`createMockModel` 等工具是否满足需求
- 如有需要，扩展测试辅助工具

**阶段 2：核心 Hooks 测试（高优先级）**
1. `useDebounce.test.ts` - 独立性高，无外部依赖
2. `useConfirm.test.tsx` - 验证 Context Provider 模式
3. `useNavigateToPage.test.ts` - 验证 Router Mock

**阶段 3：数据选择器 Hooks 测试**
4. `useCurrentSelectedChat.test.ts`
5. `useExistingChatList.test.ts`
6. `useExistingModels.test.ts`
7. `redux.test.ts`

**阶段 4：UI 和兼容性 Hooks 测试（中优先级）**
8. `useNavigateToExternalSite.test.ts` - Tauri/Web 双环境测试
9. `useAdaptiveScrollbar.test.ts`
10. `useBasicModelTable.test.tsx`

**阶段 5：验证和优化**
- 运行完整测试套件，确保无回归
- 检查测试覆盖率是否达到 80%+ 目标
- 代码审查和重构

### 部署策略
- **无需渐进式部署**：纯测试代码变更，不涉及生产环境
- **CI/CD 集成**：确保所有测试在 CI 中通过
- **文档更新**：在 AGENTS.md 中更新测试统计信息

### 回滚策略
- **无风险**：测试代码变更不影响生产代码
- **回滚方法**：直接删除新增的测试文件即可

---

## Open Questions

### Q1: 是否需要测试 Hooks 的性能？
**状态**：已解决

**决策**：不进行专门的性能测试。理由：
- Hooks 相对简单，性能瓶颈不明显
- 性能测试更适合集成测试或性能测试套件
- 单元测试专注于功能正确性

### Q2: `useAdaptiveScrollbar` 涉及 DOM 操作，如何测试？
**状态**：待解决

**待验证**：
- 需要查看该 Hook 的具体实现
- 如果直接操作 DOM，可能需要 `@testing-library/jest-dom` 的辅助函数
- 如果依赖浏览器 API，可能需要 Mock `window` 对象

### Q3: 测试数据是否需要统一管理？
**状态**：已解决

**决策**：复用项目现有的测试数据工厂（`createMockModel` 等），无需新建。

---

## References

- **项目测试规范**：`AGENTS.md` - 测试辅助工具章节
- **React Testing Library 文档**：https://testing-library.com/docs/react-testing-library/intro/
- **Vitest 文档**：https://vitest.dev/
- **项目现有测试示例**：
  - `src/__test__/components/`
  - `src/__test__/store/slices/`
