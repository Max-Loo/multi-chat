# 优化 Web 端首屏加载体验

## Why

在弱网环境下，Web 端首页白屏时间过长（5-15秒），用户在 React 渲染初始化动画之前看到的是完全空白的页面，严重影响用户体验。需要优化加载策略，让用户尽快看到有意义的界面反馈。

## What Changes

- **HTML 内联 Spinner**：在 `index.html` 中添加简单的转圈动画，消除白屏
- **initSteps 动态加载**：在 App 组件挂载后动态导入 initSteps（包含 store），此期间用户看到 HTML Spinner
- **初始化动画优先加载**：通过代码分割让 InitializationController 组件独立打包，initSteps 加载完成后尽快显示初始化动画
- **主应用按需加载**：将 Router 等重型依赖延迟到初始化完成后加载

## Capabilities

### New Capabilities

- `progressive-loading`: 渐进式加载能力，支持三层渐进式加载策略（HTML Spinner → 初始化动画 → 主应用）

### Modified Capabilities

无

## Impact

**修改的文件：**
- `index.html` - 添加内联 Spinner
- `vite.config.ts` - 添加代码分割配置
- `src/main.tsx` - 重构为渐进式加载架构
- `src/components/InitializationController/index.tsx` - 移除 store 依赖，接收 initSteps 作为 prop
- `src/lib/initialization/types.ts` - 扩展 InitResult 类型添加 modelProviderStatus
- `src/config/initSteps.ts` - modelProvider 步骤返回状态信息

**新增的文件：**
- `src/MainApp.tsx` - 提取重型依赖的主应用组件

**影响范围：**
- Web 端首屏加载体验
- Bundle 分割策略
- 应用启动流程
