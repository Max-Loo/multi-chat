## Context

项目测试审查发现三个文件存在假绿测试问题：

1. **ChatPanel.test.tsx**：第 157 行和第 333 行的 `waitFor()` 缺少 `await`，导致内部断言永远不会执行。同一文件中第 363 行和第 393 行正确使用了 `await waitFor()`，说明这是遗漏而非设计选择。
2. **ModelSelect.test.tsx**：第 87-90 行使用 `expect(true).toBe(true)` 空断言，只要组件渲染不抛错就通过，未验证任何实际行为。
3. **Layout.test.tsx**：15 个测试中有 8 个只断言 `getByTestId('layout').toBeInTheDocument()`，但测试名称声称验证不同行为（Flexbox 布局、屏幕高度、移动端适配等）。

Layout 组件实际结构：根元素有 `data-testid="layout"` 和 `flex h-screen` 类，包含 Sidebar（仅桌面端）、`role="main"` 主内容区（含 Suspense + Outlet）、BottomNav（仅移动端）。

## Goals / Non-Goals

**Goals:**

- 修复 ChatPanel.test.tsx 的 2 处 `waitFor` 未 `await` 问题，使断言能正确执行
- 替换 ModelSelect.test.tsx 的空断言为验证实际渲染行为的断言
- 重写 Layout.test.tsx 的空洞测试，使每个测试的断言匹配其描述的行为
- 确保修复后的测试在 CI 中能正确反映被测组件的真实状态

**Non-Goals:**

- 不重构 ChatPanel.test.tsx 中大量 `document.querySelector` 的问题（属于 P2 冗余清理范围）
- 不修改任何生产代码
- 不新增测试用例（仅修复或重写现有假绿测试）
- 不处理其他文件的质量问题

## Decisions

### 决策 1：ChatPanel — 仅添加 `await`

直接在两处 `waitFor` 前添加 `await`，不改变断言逻辑或测试结构。这是最小改动，风险最低。

**替代方案**：重写整个测试用例 → 拒绝，因为超出本次修复范围。

### 决策 2：ModelSelect — 替换空断言为有意义的验证

将 `expect(true).toBe(true)` 替换为验证组件渲染了模型选择相关的 UI 元素（如表格、按钮等）。

### 决策 3：Layout — 按行为重写空洞测试

根据 Layout 组件的实际结构，为每个空洞测试补充匹配其名称的真实断言：

| 测试名称 | 当前断言 | 修复后断言 |
|---------|---------|-----------|
| "应该有正确的 Flexbox 布局结构" | `getByTestId('layout')` 存在 | 验证 `flex` 类存在 |
| "应该占满整个屏幕高度" | `getByTestId('layout')` 存在 | 验证 `h-screen` 类存在 |
| "应该使用 Suspense 包裹 Outlet" | `getByTestId('layout')` 存在 | 验证 `role="main"` 内存在内容区域 |
| "应该正确渲染 Sidebar 组件" | `getByTestId('layout')` 存在 | 验证 Sidebar 元素在桌面端存在 |
| "Sidebar 应该位于主内容区域之前" | `toContainElement(main)` | 验证 Sidebar 在 DOM 顺序上位于 main 之前 |
| "应该在移动端和桌面端都正确渲染" | `getByTestId('layout')` 存在 | 分别测试桌面端和移动端的渲染差异 |
| "应该保持固定高度布局不受视口影响" | `getByTestId('layout')` 存在 | 验证 `h-screen` 类不受 isMobile 影响 |
| "主内容区域应该占满父容器高度" | `getByRole('main')` 存在 | 验证 main 元素有 `flex-1` 类 |

**替代方案**：直接删除空洞测试 → 拒绝，因为这些测试名称描述了有意义的行为，值得真正验证。

### 决策 4：Layout — 需要引入 `useResponsive` mock

Layout 组件使用 `useResponsive()` hook 判断是否移动端。为测试移动端/桌面端差异，需要 mock 此 hook。使用 `vi.mock('@/hooks/useResponsive')` 在 `beforeEach` 中切换返回值。

## Risks / Trade-offs

- **[ChatPanel 修复后可能暴露真实 bug]** → 如果 `waitFor` 内部的断言验证的行为本身有 bug，修复后测试会失败。这是预期行为，需要根据失败原因修复组件或调整断言。
- **[Layout 测试对 CSS 类名的依赖]** → 部分修复后的断言依赖 `flex`、`h-screen` 等类名，未来 Tailwind 类名变更可能导致测试失败。但由于 Layout 是核心布局组件，类名变更频率低，且使用 `toHaveClass` 比 `querySelector` 更稳定。
- **[移动端测试需要 mock]** → 引入 `useResponsive` mock 增加了测试复杂度，但这是测试响应式行为的必要代价。
