## Why

当前初始化界面仅显示简单的进度条和文字，缺乏品牌标识和视觉吸引力。通过添加 Logo 动画组件，可以提升用户体验，让应用启动过程更加专业和有趣。

## What Changes

- 将 `src/components/InitializationScreen/` 目录重命名为 `AnimatedLogo`，使其命名更准确反映组件用途
- 在 `InitializationController` 组件的加载进度条上方添加 `AnimatedLogo` 动画组件
- 保持现有的初始化流程和错误处理逻辑不变

## Capabilities

### New Capabilities
- `init-logo-animation`: 初始化界面 Logo 动画展示功能，在应用启动时显示品牌 Logo 动画

### Modified Capabilities
- 无现有功能规范需要修改

## Impact

**受影响的文件**:
- `src/components/InitializationScreen/` → 重命名为 `AnimatedLogo`
- `src/components/AnimatedLogo/index.ts` → 新增统一导出文件
- `src/components/InitializationController/index.tsx` → 添加 Logo 组件导入和渲染

**依赖**:
- 依赖现有的 `AnimatedLogo` 组件（原 `InitializationScreen` 中的组件）
- 不影响后端 API 或数据流
- 无破坏性变更
