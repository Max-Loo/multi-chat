## Context

项目已有完善的测试基础设施：vitest 框架、`@testing-library/react` 的 `renderHook`、mock 工厂（`createMockRootState`、`createMockStreamResult`）和 AI SDK mock 工具。现有 `streamProcessor.integration.test.ts` 已覆盖基本流式处理场景，但缺少节流逻辑和边界情况的测试。`codeBlockUpdater.ts` 和 Chat 页面 hooks 完全无测试覆盖。

## Goals / Non-Goals

**Goals:**
- 补充 `streamProcessor.ts` 的节流逻辑和边界情况单元测试
- 为 `codeBlockUpdater.ts` 添加完整的单元测试（DOM 更新、重试、清理）
- 为 Chat 页面 hooks（`useBoard`、`useIsSending`、`useSelectedChat`）添加单元测试
- 复用现有 mock 工厂和测试模式，保持一致性

**Non-Goals:**
- 不修改任何源代码实现
- 不测试 UI 组件的渲染行为
- 不测试类型定义文件（`types.ts`）
- 不重构现有测试文件

## Decisions

### 1. streamProcessor：扩展集成测试而非新建单元测试

**决策**：在现有 `streamProcessor.integration.test.ts` 中补充节流和边界测试，而非新建独立文件。

**理由**：已有文件已覆盖基本场景（事件累积、元数据收集、消息格式），且使用 `throttleInterval: 0` 禁用节流。补充测试时复用同一 mock 基础设施，避免重复。节流测试通过设置 `vi.useFakeTimers()` 和 `throttleInterval > 0` 来验证。

### 2. codeBlockUpdater：使用 happy-dom + vi.useFakeTimers

**决策**：在 `src/__test__/utils/codeBlockUpdater.test.ts` 创建测试文件，使用项目默认的 happy-dom 环境的 DOM API 和 `vi.useFakeTimers()` 控制 setTimeout 行为。

**理由**：`codeBlockUpdater.ts` 依赖 `document.querySelectorAll`、`WeakRef` 和 `setTimeout`，vitest 的 happy-dom 环境原生支持这些 API。使用 fake timers 可以精确控制重试延迟和清理超时，无需真实等待。

### 3. Chat hooks：使用 renderHook + Redux mock

**决策**：在 `src/__test__/pages/Chat/hooks/` 目录创建测试文件，使用 `renderHook` + `vi.mock('@/hooks/redux')` 模式。

**理由**：与现有 hook 测试模式（如 `useCreateChat.test.ts`）保持一致。这三个 hooks 依赖 Redux state，通过 mock `useAppSelector` 返回不同 state 来测试各分支逻辑。

## Risks / Trade-offs

- **[streamProcessor 节流测试的不稳定性]** → 使用 `vi.useFakeTimers({ shouldAdvanceTime: true })` 或 `vi.spyOn(Date, 'now')` 控制 `Date.now()` 返回值，同时控制 setTimeout 行为。`vi.useFakeTimers()` 默认不 mock `Date.now()`，需额外配置
- **[happy-dom WeakRef 兼容性]** → vitest/happy-dom 环境已支持 WeakRef，无需额外 polyfill
- **[Chat hooks 测试与 Redux 耦合]** → 使用现有 `createMockRootState` 工厂，保持 mock 数据一致性
