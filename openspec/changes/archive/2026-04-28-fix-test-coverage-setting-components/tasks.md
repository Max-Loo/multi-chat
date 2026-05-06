## 1. SettingHeader 测试

- [x] 1.1 创建 `src/__test__/pages/Setting/components/SettingHeader.test.tsx`，搭建基本渲染测试框架
- [x] 1.2 实现 `isMobile: true` 下菜单按钮渲染测试
- [x] 1.3 实现点击菜单按钮 dispatch `toggleDrawer()` 的交互测试

## 2. SettingSidebar 交互测试

- [x] 2.1 在 `SettingPage.test.tsx` 中补充点击设置按钮触发 `navigate` 的测试
- [x] 2.2 补充防重复点击逻辑测试（点击已选中按钮不触发 `navigate`）
- [x] 2.3 补充移动端样式测试（`isDesktop: false` 下按钮包含 `h-9 text-sm` 类名）

## 3. 验证

- [x] 3.1 运行 `pnpm test:coverage` 确认 `src/pages/Setting/components` 模块分支覆盖率从 32.25% 提升到 70%+
