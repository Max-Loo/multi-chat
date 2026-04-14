## 1. 调色板定义

- [x] 1.1 在 `canvas-logo.ts` 中将现有 `COLORS` 重命名为 `LIGHT_COLORS`（无其他代码引用旧名，无需别名）
- [x] 1.2 在 `canvas-logo.ts` 中新增 `DARK_COLORS` 暗色调色板对象，定义 8 个颜色值（`#CCCCCC`、`#2a2a2a`、`#6b8dd8` 等）
- [x] 1.3 导出 `ColorsType` 类型（`typeof LIGHT_COLORS`），供组件使用

## 2. 绘制函数参数化

- [x] 2.1 为所有 `draw*` 函数（`drawDesk`、`drawKeyboard`、`drawBody`、`drawTypingArms`、`drawHead`、`drawEyes`、`drawMouth`、`drawAntenna`、`drawChatBubble`）添加可选 `colors` 参数，类型为 `ColorsType`，默认值 `LIGHT_COLORS`
- [x] 2.2 将 `drawEyes` 中 `ctx.fillStyle = \`rgba(66, 105, 196, ${eyeBrightness})\`` 替换为 `ctx.globalAlpha = eyeBrightness; ctx.fillStyle = colors.accent;`（利用已有 save/restore 块隔离 globalAlpha 作用域）
- [x] 2.3 更新 `draw` 和 `drawStaticFrame` 的公开 API，添加可选 `colors` 参数并透传给所有内部 `draw*` 调用

## 3. 组件接入主题

- [x] 3.1 在 `AnimatedLogo.tsx` 中导入 `LIGHT_COLORS`、`DARK_COLORS`，初始化 `colorsRef`（检测 `.dark` class 选择调色板）
- [x] 3.2 通过 `MutationObserver` 监听 `<html>` class 变化，动态更新 `colorsRef`，动画循环自动读取最新调色板
- [x] 3.3 将调色板传入所有 `draw` 和 `drawStaticFrame` 调用点（包括 `animate` 回调、`resizeCanvas` 中的静态帧绘制和条件绘制）

## 4. 验证

- [x] 4.1 浅色模式下启动应用，确认 Logo 动画配色与修改前一致（白色填充、深色轮廓）
- [x] 4.2 暗色模式下启动应用，确认 Logo 使用暗色调色板（深色填充、浅色轮廓、提亮蓝色），无刺眼的白色区域
- [x] 4.3 在 Logo 显示期间切换主题，确认下一帧即时响应调色板变化
- [x] 4.4 确认 Canvas 降级内容（`canvasSupported === false` 时显示的 "MC" 文字）仍使用 `text-primary` 语义类，无需修改
