## Why

测试审查（simplify-review.md）第二轮仍余 9 个问题：3 个 mock 重复定义问题（tauriCompat mock、useResponsive mock、toast mock）横跨 20 个测试文件，3 个代码质量问题（冗余字段、冗余断言、CSS 类名选择器），3 个效率问题（重复加密测试、重复 store 创建模式）。这些问题增加维护成本且降低测试可读性。

## What Changes

- 将 `vi.mock('@/utils/tauriCompat')` 的完整 mock 模式（含 `isTauri`、`createLazyStore`、`keyring`）提取为共享工厂函数，通过 `globalThis` 注册供集成测试复用
- 创建 `createResponsiveMock` 辅助函数并注册到 `globalThis`，消除 7 个文件中重复的 `useResponsive` mock 定义（另有 5 个文件因模式差异大而排除：responsive-layout-switching 有自定义计算逻辑、PageSkeleton 只 mock 单字段、ToasterWrapper 需测试 undefined 状态、ChatSidebar mock 不同模块）
- 为 `createToastQueueMocks` 提供 `vi.mock` 兼容的包装函数，消除 5 个文件中的分散 toast mock 定义
- 移除 `Layout.test.tsx` 中 `getByTestId`/`getByRole` 后冗余的 `toBeInTheDocument()` 断言
- 合并 `crypto-storage.test.ts` 中两个重复的 100 次加密测试为一个测试
- 提取 `ChatPanel.test.tsx` 中重复的 store 创建模式为 `renderChatPanel` 辅助函数
- 将 `Layout.test.tsx` 的 store 创建提升到 `beforeEach` 共享

## Capabilities

### New Capabilities

- `test-mock-factory-consolidation`: 统一 mock 工厂注册机制，将 tauriCompat、useResponsive、toast 三类分散 mock 收敛为共享工厂函数
- `test-assertion-cleanup`: 测试断言精简规范，消除冗余断言

### Modified Capabilities

## Impact

- **测试文件**（约 16 个）：涉及 tauriCompat mock 的 2 个文件、useResponsive mock 的 7 个文件、toast mock 的 5 个文件，以及 Layout.test.tsx、ChatPanel.test.tsx、crypto-storage.test.ts
- **测试辅助代码**（2-3 个）：`src/__test__/helpers/mocks/` 下新增或扩展现有工厂函数
- **无生产代码变更、无 API 变更、无破坏性变更**
