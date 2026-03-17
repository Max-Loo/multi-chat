## Context

当前 `InitializationController` 组件在应用启动时显示一个简单的进度条和 "Initializing application..." 文字。`InitializationScreen` 目录实际上包含的是 `AnimatedLogo` 组件，目录命名不够准确。本次变更将重命名目录并在初始化界面添加 Logo 动画。

## Goals / Non-Goals

**Goals:**
- 将 `InitializationScreen` 目录重命名为 `AnimatedLogo`，使其命名准确反映组件用途
- 在初始化进度条上方添加 Logo 动画组件，提升视觉体验
- 保持初始化流程和错误处理逻辑不变

**Non-Goals:**
- 不修改 Logo 动画本身的实现
- 不改变初始化步骤或逻辑
- 不影响错误状态（fatal_error, no_providers）的显示

## Decisions

### 1. 目录重命名方式
**决策**: 使用 `git mv` 或文件系统重命名，保持 Git 历史记录。
**理由**: 保留文件历史有助于追溯代码变更。
**替代方案**: 复制文件后删除旧目录（丢失历史）—— 不推荐。

### 2. Logo 动画位置
**决策**: 将 Logo 动画放在进度条上方，使用 flex 布局垂直排列。
**理由**: 视觉上 Logo 在上、进度条在下的布局符合常见的加载界面设计模式。
**布局结构**:
```
<flex-col items-center>
  <AnimatedLogo />
  <ProgressBar />
  <LoadingText />
</flex-col>
```

### 3. 组件导出方式
**决策**: 创建 `index.ts` 文件统一导出 `AnimatedLogo` 组件，简化导入路径。
**理由**: 遵循项目规范，使导入路径更简洁（`@/components/AnimatedLogo` 而非 `@/components/AnimatedLogo/AnimatedLogo`）。
**导出内容**:
```typescript
export { AnimatedLogo } from './AnimatedLogo';
```

### 4. 导入路径更新
**决策**: 更新所有引用 `InitializationScreen` 的导入语句为 `AnimatedLogo`。
**需要更新的文件**:
- `InitializationController/index.tsx` - 从 `@/components/AnimatedLogo` 导入 AnimatedLogo
- 检查其他文件是否有引用：`grep -r "InitializationScreen" src/`

## Risks / Trade-offs

- **[Risk]** 目录重命名后，如果有其他文件引用了旧路径，会导致构建失败
  - **缓解**: 使用全局搜索检查所有引用 `InitializationScreen` 的文件，确保全部更新

- **[Risk]** Logo 动画可能增加初始化界面的加载时间
  - **缓解**: Logo 动画组件已存在，本次只是复用，不会增加新的资源加载

## Migration Plan

1. 重命名目录 `src/components/InitializationScreen/` → `src/components/AnimatedLogo/`
2. 创建 `src/components/AnimatedLogo/index.ts` 文件统一导出组件
3. 使用 `grep -r "InitializationScreen" src/` 检查并更新所有引用旧路径的导入语句
4. 在 `InitializationController/index.tsx` 中从 `@/components/AnimatedLogo` 导入组件
5. 在 JSX 中添加 `<AnimatedLogo />` 组件到进度条上方
6. 运行构建验证无错误
