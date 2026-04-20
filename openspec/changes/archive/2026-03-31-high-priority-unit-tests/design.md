## Context

当前项目测试体系成熟（1,650 用例，99.94% 通过率），但自定义业务组件和聊天面板核心组件存在测试空白。本次变更纯新增测试，不修改业务代码。

测试基础设施已完备：vitest + React Testing Library + happy-dom + MSW + fake-indexeddb。

## Goals / Non-Goals

**Goals:**

- 为 5 个自定义业务组件（AnimatedLogo、FilterInput、OpenExternalBrowserButton、ProviderLogo、Skeleton 系列）新增单元测试
- 为聊天面板中尚未覆盖的子组件补充测试：Grid、Splitter、PanelSkeleton、RunningBubble、Title、Detail 滚动行为
- 所有新测试遵循现有 BDD 测试规范

**Non-Goals:**

- 不为 shadcn/ui 基础组件编写测试（ROI 低，由库保证）
- 不修改任何业务代码
- 不重构现有测试结构
- 不修改覆盖率阈值（维持 60%）
- 不处理性能测试不稳定问题（单独变更处理）

## Decisions

### 决策 1：测试文件放置策略

**选择**：所有测试文件放在 `src/__test__/` 对应子目录下，与现有结构一致。

**理由**：项目约定测试集中管理在 `__test__/` 目录，而非与源文件并列（co-located）。

### 决策 2：Canvas 动画测试策略

**选择**：对 `canvas-logo.ts` 测试纯函数逻辑（状态计算、缩放计算）；对 `AnimatedLogo.tsx` 测试组件行为（渲染、reduced-motion、清理），不验证具体像素绘制。

**理由**：Canvas 像素级测试脆弱且维护成本高。纯函数逻辑（如动画状态更新、缩放计算）有明确的输入输出，适合单元测试。组件层面验证行为而非渲染细节。

**替代方案**：使用 `jest-canvas-mock` mock Canvas API 并验证绘制调用 → 拒绝，因为过于依赖实现细节。

### 决策 3：Panel 组件测试策略

**选择**：仅针对现有测试未覆盖的 Panel 子组件编写新测试（Grid、Splitter、PanelSkeleton、RunningBubble、Title）。Panel 容器、Header、Sender 已有完善的测试文件（ChatPanel.test.tsx、ChatPanelHeader.test.tsx、ChatPanelSender.test.tsx），不重复编写。

**理由**：现有测试已覆盖 Panel 容器渲染、Header 列数管理/生命周期、Sender 键盘处理/中文输入法等核心场景。重复造轮子浪费精力，应聚焦空白区域。

### 决策 4：Redux 依赖处理

**选择**：对依赖 Redux 的组件，根据复杂度选择方案——简单组件使用手动 `configureStore()` + 自定义 wrapper，复杂组件使用现有的 `renderWithProviders` helper。

**理由**：项目测试中两种模式并存，现有 Panel 测试均使用手动 store 创建。`renderWithProviders`（位于 `src/__test__/helpers/render/redux.tsx`）提供 Provider + Router + ConfirmProvider 包装，适合需要完整上下文的测试。

### 决策 5：测试用例命名和描述

**选择**：遵循现有中文 BDD 规范："应该 [预期行为] 当 [条件]"。

**理由**：项目测试规范要求（见 `src/__test__/guidelines/BDD_GUIDE.md`）。

## Risks / Trade-offs

- **Panel 组件耦合度较高** → RunningBubble/Title 依赖 Redux selector，mock 设置复杂。缓解：参考现有 ChatPanelHeader.test.tsx 中的 store 创建模式。
- **AnimatedLogo Canvas 测试有限** → Canvas 绘制逻辑难以完全覆盖。缓解：聚焦纯函数测试，组件测试验证行为。
- **测试文件数量增加** → 约 15 个新测试文件，CI 时间增加 5-10 秒。缓解：可接受的影响。
