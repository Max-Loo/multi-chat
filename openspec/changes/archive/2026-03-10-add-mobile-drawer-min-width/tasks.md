# Tasks: MobileDrawer 最小宽度

## 1. 代码修改

- [x] 1.1 在 `src/components/MobileDrawer/index.tsx` 第 38 行的 `className` 中添加 `min-w-60`

## 2. 测试验证

- [x] 2.1 启动开发服务器（`pnpm tauri dev`）
- [x] 2.2 在移动端模式下测试 MobileDrawer 的显示效果
- [x] 2.3 验证 Chat 侧边栏在抽屉中的显示（宽度应为 224px，但由于 min-w-60 会显示为 240px）
- [x] 2.4 验证 Settings 侧边栏在抽屉中的显示（宽度应为 256px）
- [x] 2.5 验证 Models 侧边栏在抽屉中的显示（宽度应为 240px）
- [x] 2.6 测试抽屉的打开/关闭动画是否正常
- [x] 2.7 在不同屏幕尺寸下测试响应式布局（确保最小宽度生效）

## 3. 代码质量检查

- [x] 3.1 运行 lint 检查（`pnpm lint`）
- [x] 3.2 运行类型检查（`pnpm tsc`）
- [x] 3.3 确认无编译错误和警告
