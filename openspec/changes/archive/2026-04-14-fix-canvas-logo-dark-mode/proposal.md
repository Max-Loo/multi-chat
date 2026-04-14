## Why

Canvas Logo（启动动画机器人）使用 9 处硬编码十六进制颜色值（`#FFFFFF`、`#E5E5E5`、`#333333` 等），不响应项目的 CSS 变量暗色模式系统。在暗色系统偏好下，用户会看到一个白色填充的机器人在深色背景上闪烁，与整体暗色调严重不协调。这是暗色模式审查报告中标记为 P1（高优先级）的遗留问题。

## What Changes

- 在 `canvas-logo.ts` 中新增 `DARK_COLORS` 暗色调色板，颜色与项目 `.dark` CSS 变量风格一致
- 将现有 `COLORS` 重命名为 `LIGHT_COLORS`，保留 `COLORS` 作为默认导出别名（向后兼容）
- 所有 `draw*` 绘制函数新增可选 `colors` 参数，默认使用 `LIGHT_COLORS`
- `drawEyes` 中内联的 `rgba(66, 105, 196, ...)` 改用 `ctx.globalAlpha` + `colors.accent` 替代（利用 save/restore 块隔离作用域）
- `AnimatedLogo.tsx` 组件通过 `useTheme()` 获取 `resolvedTheme`，选取对应调色板传入绘制函数

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `animated-logo`: 新增「Logo 必须响应主题切换」的需求，要求 Canvas 动画在暗色模式下使用适配的调色板

## Impact

- **代码**：`src/components/AnimatedLogo/canvas-logo.ts`（参数化颜色）、`src/components/AnimatedLogo/AnimatedLogo.tsx`（接入 useTheme）
- **依赖**：`AnimatedLogo.tsx` 新增对 `@/hooks/useTheme` 的导入
- **视觉**：暗色模式下 Logo 动画配色改变（浅色模式行为不变）
- **API**：`draw` 和 `drawStaticFrame` 函数签名新增可选参数，现有调用无需修改（默认值兼容）
