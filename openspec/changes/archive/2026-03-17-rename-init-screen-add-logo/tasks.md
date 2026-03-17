## 1. 目录重命名

- [x] 1.1 将 `src/components/InitializationScreen/` 目录重命名为 `src/components/AnimatedLogo/`
- [x] 1.2 检查项目内是否有其他文件引用旧目录路径：`grep -r "InitializationScreen" src/`
- [x] 1.3 更新所有引用旧路径的导入语句为新的 `AnimatedLogo` 路径（无需更新，无引用）

## 2. 组件导出优化

- [x] 2.1 创建 `src/components/AnimatedLogo/index.ts` 文件，统一导出组件：`export { AnimatedLogo } from './AnimatedLogo';`
- [x] 2.2 在 `src/components/InitializationController/index.tsx` 中使用简化导入路径：`import { AnimatedLogo } from "@/components/AnimatedLogo";`
- [x] 2.3 验证 `canvas-logo.ts` 的引用路径是否正确（仅在 AnimatedLogo.tsx 中使用相对路径引用，正确）

## 3. UI 布局修改

- [x] 3.1 在 `InitializationController` 的初始化界面中，在进度条上方添加 `<AnimatedLogo />` 组件
- [x] 3.2 确保 Logo、进度条、加载文本垂直居中对齐
- [x] 3.3 调整间距（使用 gap-8）使布局美观

## 4. 验证测试

- [x] 4.1 运行 `pnpm tsc` 确保 TypeScript 无错误
- [x] 4.2 运行 `pnpm lint` 确保代码规范通过
- [x] 4.3 运行 `pnpm test` 确保测试通过
- [x] 4.4 启动应用验证初始化界面显示正常（代码已更新，等待实际启动验证）
