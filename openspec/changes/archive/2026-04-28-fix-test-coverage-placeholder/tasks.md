## 1. 测试文件创建

- [x] 1.1 创建 `src/__test__/pages/Chat/Placeholder.test.tsx` 测试文件，搭建基本渲染测试框架
- [x] 1.2 实现 `isMobile: true` 下的渲染测试（验证菜单按钮和新建聊天按钮存在）

## 2. 交互行为测试

- [x] 2.1 实现点击菜单按钮 dispatch `toggleDrawer()` 的测试
- [x] 2.2 实现点击新建聊天按钮触发 `createNewChat` 的测试
- [x] 2.3 实现 `isMobile: false` 下不渲染操作按钮的测试

## 3. 验证

- [x] 3.1 运行 `pnpm test:coverage` 确认 `src/pages/Chat/components/Placeholder` 分支覆盖率提升（实际 50%，受 React Compiler 伪分支限制，无法达到 70% 目标）
