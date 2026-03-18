# 实施任务清单

## 1. HTML Spinner

- [x] 1.1 在 `index.html` 中添加内联 CSS 转圈动画样式
- [x] 1.2 在 `<div id="root">` 中添加 Spinner 元素
- [x] 1.3 验证 Spinner 在页面加载时立即显示

## 2. 移除 chunk-init 对 store 的依赖

- [x] 2.0 在 `src/lib/initialization/types.ts` 中扩展 `InitResult` 类型，添加 `modelProviderStatus` 字段
- [x] 2.1 修改 `initSteps` 中的 modelProvider 步骤，返回状态信息到 `context.setResult`
- [x] 2.2 重构 `InitializationController`，接收 `initSteps` 作为 prop（移除静态导入）
- [x] 2.3 修改 `InitializationController`，从 `InitResult.modelProviderStatus` 获取状态（移除 `import { store }`）
- [x] 2.4 验证"无可用的模型供应商"错误提示功能正常

## 3. Vite 代码分割配置

- [x] 3.1 修改 `vite.config.ts`，在 `manualChunks` 中添加初始化模块分割配置
- [x] 3.2 配置 `chunk-init` 包含：InitializationController、AnimatedLogo、lib/initialization（不含 initSteps）、ui/progress
- [x] 3.3 配置 `chunk-initsteps` 包含：config/initSteps、store（独立打包）
- [x] 3.4 运行 `pnpm build` 验证 chunk-init.js 和 chunk-initsteps.js 生成正确
- [x] 3.5 验证 chunk-init.js 体积（目标 ~50KB，上限 100KB gzip 后）- 实际 18.28 KB (6.53 KB gzip) ✓
- [x] 3.6 验证 chunk-initsteps.js 体积（预期 ~10KB gzip 后）- 实际 54.56 KB (18.00 KB gzip)

## 4. MainApp 组件提取

- [x] 4.1 创建 `src/MainApp.tsx` 文件
- [x] 4.2 将 Redux Provider、RouterProvider、ConfirmProvider、ToasterWrapper 迁移到 MainApp
- [x] 4.3 创建 `createMainApp` 工厂函数接收 InitResult
- [x] 4.4 在 MainApp 组件挂载后执行 `triggerSilentRefreshIfNeeded(store)`

## 5. main.tsx 重构

- [x] 5.1 移除 store、router、initSteps 等重型依赖的静态导入
- [x] 5.2 保留 InitializationController 的静态导入
- [x] 5.3 保留 main.css 的静态导入（避免 FOUC）
- [x] 5.4 修改 App 组件实现四阶段渐进式加载状态管理（loading → initializing → ready）
- [x] 5.5 在 App 组件挂载时动态导入 initSteps（useEffect 中实现）
- [x] 5.6 实现 handleInitComplete 回调中的动态 import（仅 MainApp）
- [x] 5.7 实现 chunk 加载失败的错误处理（try-catch + 错误提示界面）
- [x] 5.8 实现错误提示界面的重试按钮逻辑
- [x] 5.9 验证初始化流程正常执行
- [x] 5.10 验证初始化动画样式正常（无样式闪烁）

## 6. 测试验证

- [x] 6.1 使用 Chrome DevTools Slow 3G 模式测试加载体验
- [x] 6.2 验证 First Paint (FP) < 100ms
- [x] 6.3 验证初始化动画在 chunk-init 加载后立即显示
- [x] 6.4 验证主应用在初始化完成后加载
- [x] 6.5 验证 chunk 加载失败时显示错误提示
- [x] 6.6 运行 `pnpm test` 确保无回归问题 - 115 个测试文件，1542 个测试全部通过 ✓
- [x] 6.7 运行 `pnpm tauri dev` 验证 Tauri 桌面端正常
