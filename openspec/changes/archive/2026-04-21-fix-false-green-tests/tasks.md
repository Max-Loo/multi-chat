## 1. ChatPanel.test.tsx — 修复 waitFor 未 await

- [x] 1.1 在 `src/__test__/components/ChatPanel.test.tsx` 第 157 行的 `waitFor()` 前添加 `await`
- [x] 1.2 在 `src/__test__/components/ChatPanel.test.tsx` 第 333 行的 `waitFor()` 前添加 `await`
- [x] 1.3 运行 ChatPanel 测试验证修复后行为，确认测试通过或识别真实的组件 bug

## 2. ModelSelect.test.tsx — 替换空断言

- [x] 2.1 将 `src/__test__/components/ModelSelect.test.tsx` 第 87-90 行的 `expect(true).toBe(true)` 替换为验证组件渲染的断言（如验证表格存在、模型名称可见等）

## 3. Layout.test.tsx — 重写空洞测试

- [x] 3.1 添加 `useResponsive` hook 的 mock（`vi.mock('@/hooks/useResponsive')`），支持切换 `isMobile` 返回值
- [x] 3.2 修复 "应该有正确的 Flexbox 布局结构" — 验证 `flex` 类存在
- [x] 3.3 修复 "应该占满整个屏幕高度" — 验证 `h-screen` 类存在
- [x] 3.4 修复 "应该使用 Suspense 包裹 Outlet" — 验证 `role="main"` 内存在内容结构
- [x] 3.5 修复 "应该正确渲染 Sidebar 组件" — 验证桌面端 Sidebar 存在
- [x] 3.6 修复 "Sidebar 应该位于主内容区域之前" — 验证 Sidebar 在 DOM 顺序上位于 main 之前
- [x] 3.7 修复 "应该在移动端和桌面端都正确渲染" — 分别验证桌面端和移动端差异
- [x] 3.8 修复 "应该保持固定高度布局不受视口影响" — 验证 `h-screen` 在两种模式下均存在
- [x] 3.9 修复 "主内容区域应该占满父容器高度" — 验证 `role="main"` 有 `flex-1` 类
- [x] 3.10 移除手动 `cleanup()` 调用（Vitest + RTL 默认全局启用）

## 4. 验证

- [x] 4.1 运行全部三个文件的测试，确认修复后测试通过
- [x] 4.2 运行 `pnpm tsc` 确认无类型错误
