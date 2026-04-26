## 1. 组件修改

- [x] 1.1 为 BottomNav 组件的 `<nav>` 添加 `aria-label="底部导航"` 属性
- [x] 1.2 验证 BottomNav 单元测试通过（`src/__test__/components/BottomNav.test.tsx`）

## 2. 集成测试迁移

- [x] 2.1 替换第 78 行 `querySelector('nav:not([aria-label="主导航"])')` 为 `screen.queryByRole('navigation', { name: '底部导航' })`
- [x] 2.2 替换第 92 行 `querySelector('nav')` 为 `screen.getByRole('navigation', { name: '底部导航' })`
- [x] 2.3 替换第 102 行 `querySelector('nav:not([aria-label="主导航"])')` 为 `screen.queryByRole('navigation', { name: '底部导航' })`

## 3. 测试验证

- [x] 3.1 运行 `responsive-layout-switching` 集成测试确认通过
- [x] 3.2 运行 `bottom-nav` 相关测试确认通过
- [x] 3.3 运行全量测试确认无回归
