## 1. 适配 Sonner 组件

- [x] 1.1 在 `src/components/ui/sonner.tsx` 中移除 `import { useTheme } from "next-themes"`，替换为基于 DOM 的主题检测逻辑（检测 `<html>` 元素的 `.dark` class）
- [x] 1.2 验证 Sonner 组件的 `theme` prop 仍能正确反映当前主题状态

## 2. 移除依赖

- [x] 2.1 执行 `pnpm remove next-themes` 从 `package.json` 中移除依赖

## 3. 更新测试

- [x] 3.1 更新以下测试文件中引用 `next-themes` 的注释说明：`src/__test__/integration/toast-system.integration.test.tsx`、`src/__test__/integration/toast-e2e.integration.test.tsx`、`src/__test__/services/lib/toast/ToasterWrapper.test.tsx`
- [x] 3.2 运行 `pnpm lint` 和 `pnpm tsc` 确保无编译错误
- [x] 3.3 运行 `pnpm test` 确保所有测试通过
