## Context

`simplify-review.md` 第二轮审查发现 9 个残留问题，分为三类：mock 工厂复用（3 个，影响 20 个文件）、代码质量（3 个）、效率（3 个）。第一轮已修复 7 个高优先级问题（mock 状态泄漏、sonner mock 简化、类型安全等），本轮聚焦于中长期重构。

当前 mock 注册机制已有 `globalThis` 模式的先例：`__createI18nMockReturn` 和 `__createMemoryStorageMock`，分别用于 i18n 和存储 mock 的跨模块共享。

## Goals / Non-Goals

**Goals:**

- 将 tauriCompat mock、useResponsive mock、toast mock 三类分散定义收敛为共享工厂函数
- 消除 Layout.test.tsx 中的冗余断言
- 减少重复的 store 创建模式和加密测试
- 保持现有测试行为不变，仅重构内部实现

**Non-Goals:**

- 不重构 ChatPanel.test.tsx 的 CSS 类名选择器（2.5）——需要先在生产代码中添加 `data-testid`，属于独立变更
- 不改变测试框架或 mock 策略（如迁移到 MSW）
- 不处理 `beforeEach`/`afterEach` 层面的全局 mock 管理

## Decisions

### 1. 共享工厂注册方式

**决策**：沿用 `var` + `globalThis` 模式注册到 `setup.ts`。

**理由**：与 `__createI18nMockReturn` 和 `__createMemoryStorageMock` 保持一致。`vi.mock` 工厂函数被提升到 import 之上，只有 `globalThis` 上的属性能在这个时机被访问。每个工厂函数独立注册（而非合并为一个巨大对象），便于按需使用。

**替代方案**：使用 Vitest 的 `setupFiles` + 独立文件注册 → 增加文件数量但收益不明显，当前 `setup.ts` 已是唯一的 setup 文件。

### 2. tauriCompat mock 统一策略

**决策**：不强制所有文件使用同一个 mock 模式，而是提供 `createTauriCompatModuleMock(storeMap?)` 工厂函数返回完整的 `vi.mock('@/utils/tauriCompat')` 所需对象。

**理由**：三个集成测试对 tauriCompat 的需求不同——`model-config` 需要 keyring + 外部 Map，`settings-change` 只需要 `isTauri` + 存储，`modelStorage` 甚至 mock 的是 `storeUtils` 而非 `tauriCompat`。强制统一反而增加复杂度。工厂函数提供合理的默认值，各文件可选择性覆盖。

### 3. useResponsive mock 工厂设计

**决策**：创建 `createResponsiveMock(overrides?)` 函数，注册为 `globalThis.__createResponsiveMock`。返回 `{ layoutMode, width, height, isMobile, isCompact, isCompressed, isDesktop }` 的可变对象，配合 `vi.hoisted` + `vi.mock` 使用。

**适用范围**：12 个文件中有 **7 个适合迁移**，5 个因模式差异大而排除：

| 分类 | 文件 | 排除原因 |
|------|------|----------|
| 适合 | Layout、BottomNav、SettingPage、ToolsBar、drawer-state、bottom-nav、chat-button-render-count | — |
| 排除 | responsive-layout-switching | 有 `updateResponsiveState(width)` 自定义计算逻辑，工厂无法替代 |
| 排除 | PageSkeleton | 只 mock `isMobile` 一个字段，通过 `vi.fn()` spy 控制 |
| 排除 | ToasterWrapper | 需要测试 `undefined` 状态，`let` + `vi.fn()` 闭包逻辑复杂 |
| 排除 | ChatSidebar | mock 的是 `@/context/ResponsiveContext` 而非 `@/hooks/useResponsive` |

**理由**：7 个适合的文件覆盖了两种主流模式——可变对象（Layout，需 `vi.hoisted`）和静态默认值（BottomNav 等，只需 `overrides` 参数）。排除的 5 个文件各有特殊需求，强行迁移会增加复杂度而非降低。

### 4. toast mock 包装方式

**决策**：为 `createToastQueueMocks` 添加 `createToastQueueModuleMock()` 函数，返回完整的 `vi.mock('@/services/toast')` 所需对象。

**理由**：现有 `createToastQueueMocks` 返回的是方法级 mock，而 `vi.mock` 需要模块级对象。提供包装函数后，测试文件可直接 `vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock())`。

### 5. crypto-storage 测试合并策略

**决策**：将两个 100 次加密测试合并为一个，在同一个循环中同时验证密文唯一性和 nonce 唯一性。

**理由**：两个测试的核心操作完全相同（100 次 `encrypt` + 唯一性断言），区别仅在于断言的对象（密文 vs nonce）。合并后减少约 20 行代码和 100 次加密操作。

## Risks / Trade-offs

- **useResponsive mock 工厂推广到 7 个文件** → 需确保每个文件的测试行为不变。缓解：逐文件迁移，每次迁移后运行相关测试
- **tauriCompat mock 工厂覆盖不完全** → 三个文件的需求差异较大，工厂函数可能无法完全消除内联定义。缓解：工厂提供默认值 + 可选覆盖参数
- **store 创建提升到 `beforeEach`** → 测试间共享 store 实例可能引入状态泄漏。缓解：Layout 测试不依赖特定 Redux 状态，泄漏风险极低
