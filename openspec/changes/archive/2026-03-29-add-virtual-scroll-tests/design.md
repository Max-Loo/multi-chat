## Context

虚拟滚动功能已通过 `virtua` 库实现在两个核心组件中：
- **Detail**（`src/pages/Chat/components/Panel/Detail/index.tsx`）：使用 `Virtualizer` 虚拟化消息列表
- **Sidebar**（`src/pages/Chat/components/Sidebar/index.tsx`）：使用 `VList` 虚拟化对话列表

当前测试状态：
- Sidebar 已有基础测试，但 virtua mock 为简单透传 div，未验证虚拟化行为
- Detail 组件零测试覆盖
- RunningBubble、ChatBubble memo 比较函数无测试

项目测试基础设施已完善：vitest + @testing-library/react + Redux Provider 封装 + MSW + fixture 工厂。现有 mock 工厂集中在 `src/__test__/helpers/mocks/`。

## Goals / Non-Goals

**Goals:**
- 提供可复用的高级 virtua mock，能验证"只渲染可见项"的核心虚拟化行为
- Detail 组件达到核心行为覆盖（虚拟化渲染、固定元素、滚动到底部、流式自动跟随）
- RunningBubble 组件覆盖渲染状态（selector 收窄通过代码审查验证）
- ChatBubble memo 比较函数覆盖关键 props 变化检测

**Non-Goals:**
- 不测试 virtua 库本身的正确性（那是第三方库的职责）
- 不做 E2E 或集成测试级别的虚拟滚动验证
- 不测试 `useAdaptiveScrollbar` hook（已有独立测试）
- 不测试 Sidebar 的虚拟化行为（结构简单，优先级低）

## Decisions

### 1. virtua mock 策略：可配置的渲染范围计算器

**选择**：创建 `createVirtuaMock()` 工厂函数，通过配置 `viewportHeight`、`itemHeight`、`overscan` 参数来计算可见范围，只渲染范围内的子元素。

**理由**：简单透传 mock 无法验证虚拟化核心行为（只渲染可见项）。真实 DOM 测量方案在 jsdom 中不可行（所有元素高度为 0）。

**替代方案**：
- 真实引入 virtua 运行 → jsdom 缺少完整 DOM 测量能力，不可控
- 完全透传 div → 无法验证虚拟化，等于没测

**实现思路**：
```typescript
// src/__test__/helpers/mocks/virtua.ts
interface VirtuaMockConfig {
  viewportHeight: number;   // 视口高度（默认 600）
  itemHeight: number;       // 每项高度（默认 80）
  overscan?: number;        // 超出视口的渲染项数（默认 2）
}

// 工厂函数返回值：Mock 组件 + 测试辅助函数
function createVirtuaMock(config?: Partial<VirtuaMockConfig>) {
  let state = { startIndex: 0, endIndex: 0 };
  // 闭包变量：保存 MockVirtualizer 接收的最新 onScroll 回调
  let latestOnScroll: ((offset: number) => void) | null = null;

  const MockVirtualizer = ({ children, onScroll, ...props }) => {
    // 每次 render 时将 onScroll 存入闭包，供 scrollTo 调用
    latestOnScroll = onScroll ?? null;
    /* 根据配置计算可见范围 */
  };
  const MockVList = ({ children, ...props }) => { /* 包装 MockVirtualizer */ };

  return {
    MockVirtualizer,
    MockVList,
    scrollTo: (index: number) => {
      /* 更新 state 中的可见范围 */
      /* 通过 latestOnScroll 回调通知组件 */
      latestOnScroll?.(index * config.itemHeight);
    },
    getRenderedRange: () => ({ ...state }),
  };
}
```
- `MockVirtualizer` 组件：接收 children，根据 config 计算可见范围，只渲染 `[startIndex, endIndex]` 内的子元素
- `scrollTo` 和 `getRenderedRange` 是工厂函数返回的闭包级别函数，测试通过解构 `createVirtuaMock()` 返回值使用，无需通过 DOM 或 ref 访问
- `latestOnScroll` 闭包变量解决工厂函数无法直接访问 React 组件 props 的问题：MockVirtualizer 每次渲染时将 `onScroll` prop 存入闭包，`scrollTo` 调用时从闭包读取

### 2. Detail 组件测试结构

**选择**：使用 Redux Provider + 真实 store 渲染完整组件树，mock 系统边界（virtua、useAdaptiveScrollbar、useTranslation、ResizeObserver）。

**理由**：遵循项目测试规范 — mock 系统边界，不 mock 内部实现。通过 Redux store 预设状态来控制组件行为。

**测试数据构造**：
- 使用 `createMockPanelMessage` 批量生成消息（已有 fixture，位于 `helpers/mocks/chatPanel.ts`）
- 复用已有的 `createMockPanelChatModel`（位于 `helpers/mocks/panelLayout.tsx`）构造 Detail 需要的 `ChatModel`（`types/chat.ts` 的 `ChatModel`，含 `modelId` + `chatHistoryList`），通过 `overrides` 参数传入自定义消息列表。与现有的 `createMockChatModel`（`types/model.ts` 的 `Model`，位于 `helpers/mocks/chatPanel.ts`）区分
- 通过 Redux store 的 `preloadedState` 控制选中聊天和运行时数据，需包含：
  - `chat.chatList`：包含测试聊天对象，该对象必须含 `chatModelList` 数组（内含匹配 `ChatModel.modelId` 的条目），否则 `useSelectedChat` → `useCurrentSelectedChat` 无法从 `chatList` 中找到匹配的聊天记录
  - `chat.selectedChatId`：匹配 chatList 中的某条聊天 ID
  - `chat.runningChat[chatId][modelId]`：嵌套的流式/错误场景数据
- 复用 `renderWithProviders`（`helpers/render/redux.tsx`），包含 `chat`、`chatPage`、`models`、`appConfig`、`modelProvider` 五个 reducer

**mock 模块清单**：
- `virtua`：通过 `createVirtuaMock()` 工厂创建的 MockVirtualizer/MockVList
- `useAdaptiveScrollbar`：返回 `{ onScrollEvent: vi.fn(), scrollbarClassname: 'custom-scrollbar', isScrolling: false }`（注意：必须包含 `isScrolling`，Detail 组件在 className 中使用了该值）
- `useTranslation`：参考 `ChatSidebar.test.tsx` 的 selector-based mock 模式
- `ResizeObserver`：全局 mock，回调中传入 `entry.contentRect.height = 0`

### 3. ResizeObserver mock

**选择**：全局 mock `ResizeObserver`，在回调中立即触发一次（传入 entry.contentRect.height = 0）。

**理由**：jsdom 不提供 ResizeObserver。Detail 组件使用它测量 Title 高度来设置 `startMargin`。mock 必须让组件正常挂载不报错。对于需要特定高度的场景，通过 `vi.spyOn` 在单个测试中覆盖。

### 4. 滚动指标 mock 策略

**选择**：创建 `mockContainerMetrics(container, metrics)` 辅助函数，通过 `Object.defineProperty` 模拟 DOM 容器的 `scrollHeight`、`clientHeight`、`scrollTop` 属性。

**理由**：Detail 组件的 `checkScrollStatus` 依赖 `container.scrollHeight > container.clientHeight` 判断 `needsScrollbar`，以及 `scrollTop` 判断 `isAtBottom`。jsdom 中所有元素高度为 0，这些状态永远为 false，导致回到底部按钮和流式自动跟随逻辑无法测试。

**实现思路**：
```typescript
// src/__test__/helpers/mocks/scrollMetrics.ts
interface ScrollMetrics {
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
}

function mockContainerMetrics(container: HTMLElement, metrics: ScrollMetrics) {
  // 所有属性均设置 writable: true + configurable: true
  // writable: true 是关键 — Detail 的 scrollToBottom 会执行 container.scrollTop = container.scrollHeight，
  // 如果 scrollTop 不可写则赋值静默失败，导致流式自动跟随测试无法验证
  // 例如：Object.defineProperty(container, 'scrollTop', { value: 1380, writable: true, configurable: true })
}
```
- 默认场景（内容不超出）：`scrollHeight=600, clientHeight=600, scrollTop=0`
- 需要滚动条场景：`scrollHeight=2000, clientHeight=600, scrollTop=0`
- 在底部场景：`scrollHeight=2000, clientHeight=600, scrollTop=1380`（2000-600-24≈1376）

> **关于 `scrollTo` 与 `mockContainerMetrics` 的职责区分**：`mockContainerMetrics` 负责设置容器 DOM 属性（`scrollHeight`/`clientHeight`/`scrollTop`），决定组件读取到的滚动状态；`mock.scrollTo` 仅触发 `onScroll` 回调让组件重新执行 `handleVirtualizerScroll` → `checkScrollStatus`。二者需要配合使用：先 `mockContainerMetrics` 设置好容器属性，再 `mock.scrollTo` 触发回调让组件读取这些属性。`scrollTo` 不会修改容器的 `scrollTop`。

**scrollContainerRef 的 DOM 获取方式**：`scrollContainerRef` 是 Detail 组件内部 ref（`index.tsx:49`），挂载在带 `flex flex-col items-center text-base h-full overflow-y-auto pt-2 pb-4 pl-3` className 的 div 上。测试中无法直接访问内部 ref，需通过容器查询获取该 DOM 元素。推荐使用 `container.querySelector('.h-full.overflow-y-auto')` 或在渲染结果中通过 `container.firstElementChild` 定位（Detail 组件最外层为 Fragment `<>...</>`，第一个子元素即为滚动容器 div）。

### 5. 异步时序控制

**选择**：在 Detail 测试中使用 `vi.useFakeTimers()` 控制 `requestAnimationFrame` 和 `setTimeout`，避免流式跟随测试出现时序竞态。

**理由**：`checkScrollStatus` 通过 `requestAnimationFrame` + `setTimeout(100ms)` 异步更新 `needsScrollbar`/`isAtBottom` 状态。流式自动跟随测试（task 3.12/3.13）需要验证 `shouldStickToBottom.current` 在正确时机为 true/false，若不控制时序会导致测试不稳定。

**实现思路**：
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

// 在需要等待 checkScrollStatus 完成的测试中
await act(async () => {
  vi.advanceTimersByTime(150); // 覆盖 rAF + 100ms setTimeout
});
```

### 6. Virtualizer ref handle 兼容

**选择**：MockVirtualizer 暴露 `scrollToIndex` 空方法（`vi.fn()`），保持与 `VirtualizerHandle` 的接口兼容。

**理由**：当前 Detail 组件声明了 `virtualizerRef` 但未调用其方法。预留接口避免后续使用时 Mock 缺失。

### 7. ChatBubble memo 测试策略

**选择**：使用渲染次数追踪 + 组合策略间接验证 `arePropsEqual`，而非直接测试该函数。

**理由**：`arePropsEqual`（`ChatBubble.tsx:98`）是模块内未导出的私有函数，直接导入会编译失败。

**具体策略**：
- **渲染次数追踪**：创建轻量 wrapper 组件包裹 `ChatBubble`，通过 `vi.fn()` 追踪实际渲染次数，对所有 props 变化场景统一验证 memo 是否生效
- **content 变化** → spy `generateCleanHtml` 调用次数（因 `generateCleanHtml` 被 `useMemo([content])` 包裹，content 变化时 useMemo 会重新计算，触发 spy）
- **role 变化** → 断言 DOM 结构变化（className `justify-end` ↔ `justify-start`）
- **reasoningContent 变化** → 断言 ThinkingSection 组件出现/消失
- **isRunning 变化** → 断言 ThinkingSection 标题文本变化（thinking ↔ thinkingComplete）
- **所有 props 相同** → 渲染追踪器验证未触发额外渲染

> 注意：不能对所有 props 变化统一使用 `generateCleanHtml` spy。该函数被 `useMemo([content])` 包裹（`ChatBubble.tsx:39`），只有 `content` 变化才会触发重新调用。`role`/`reasoningContent`/`isRunning` 变化虽触发组件重渲染，但 useMemo 命中缓存，`generateCleanHtml` 不会被调用。

**替代方案**：导出 `arePropsEqual` 并直接测试 — 需修改源码，仅为测试而导出私有实现违反封装原则。

### 8. 测试文件组织

**选择**：所有测试放在 `src/__test__/` 目录下，复用现有 helpers。

| 文件路径 | 内容 |
|---------|------|
| `helpers/mocks/virtua.ts` | 高级 virtua mock 工厂 |
| `helpers/mocks/scrollMetrics.ts` | 滚动指标 mock |
| `helpers/mocks/panelLayout.tsx` | 复用已有的 `createMockPanelChatModel` |
| `pages/Chat/Detail.test.tsx` | Detail 组件测试 |
| `pages/Chat/RunningBubble.test.tsx` | RunningBubble 组件测试 |
| `components/chat/ChatBubble.memo.test.tsx` | memo 重渲染行为测试 |

## Risks / Trade-offs

**[固定 itemHeight 不真实]** → mock 假设所有子项等高，真实场景高度不一。缓解：单元测试关注"是否只渲染了有限项"而非精确计算项数，对实际渲染数量使用断言范围而非精确值。

**[Detail 组件依赖链较长]** → 需要较多 mock（5+ 个模块）。缓解：复用已有 mock 工厂和 fixture，减少样板代码。

**[jsdom 无法真实模拟滚动]** → scroll 事件、scrollTop 等需要手动触发。缓解：通过 mock 的 `scrollTo` 方法绕过真实滚动，直接更新可见范围。
