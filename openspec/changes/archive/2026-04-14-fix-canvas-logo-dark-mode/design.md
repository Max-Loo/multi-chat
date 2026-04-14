## Context

Canvas Logo 是应用启动后显示的动画（机器人打字场景），通过 `canvas-logo.ts` 中的 Canvas 2D API 绘制。当前所有 9 处颜色值硬编码为十六进制常量，完全不受项目 CSS 变量暗色模式系统的影响。

项目暗色模式架构为 CSS 自定义属性 + `.dark` class 切换，但 Canvas 不参与 DOM 样式系统，因此需要独立处理。

当前颜色分布：

| 常量名 | 值 | 用途 |
|--------|-----|------|
| `outline` | `#333333` | 机器人轮廓、手臂线条 |
| `fill` | `#FFFFFF` | 头部/身体填充（暗色模式最刺眼） |
| `accent` | `#4269C4` | LED 眼睛、天线球、气泡背景 |
| `desk` | `#666666` | 桌面线条 |
| `keyboard` | `#E5E5E5` | 键盘底座（暗色模式刺眼） |
| `key` | `#FFFFFF` | 按键颜色 |
| `bubble` | `#4269C4` | 聊天气泡背景 |
| `bubbleText` | `#FFFFFF` | 气泡内文字（跳动的圆点） |

此外 `drawEyes` 中有一处内联 `rgba(66, 105, 196, ${eyeBrightness})` 也需参数化。

## Goals / Non-Goals

**Goals:**

- Canvas Logo 在暗色模式下使用适配的配色方案，与项目整体暗色调协调
- 主题切换时 Logo 即时响应（无需刷新）
- 浅色模式行为完全不变
- API 向后兼容，现有外部调用无需修改

**Non-Goals:**

- 不重写为 SVG（方案 C，工作量与风险不匹配）
- 不修改动画逻辑（`updateState`、`AnimationState` 类型不变）
- 不引入 CSS 变量读取（`getComputedStyle` 有性能开销且初始化时变量可能未就绪）
- 不支持超出浅色/暗色的自定义主题

## Decisions

### 决策 1：双色板方案（而非 CSS 变量读取）

**选择**：定义 `LIGHT_COLORS` 和 `DARK_COLORS` 两套静态调色板，通过 `useTheme()` 选择

**备选方案**：
- A）通过 `getComputedStyle` 读取 CSS 变量 → 需处理 OKLCH 到 hex 的转换，且 Canvas 初始化时 CSS 变量可能未就绪
- B）SVG 重写 → 工作量大，打字手臂贝塞尔曲线在 SVG 中难以等效实现

**理由**：双色板方案改动最小、风险最低、与现有架构自然集成。颜色数量少（8 个常量 + 1 处内联），静态定义比运行时读取更可靠。

### 决策 2：主题感知方式——MutationObserver（而非 useTheme）

**选择**：通过 `MutationObserver` 监听 `<html>` 的 class 变化，配合 `colorsRef` 在动画循环中直接读取当前调色板

**备选方案**：
- A）使用 `useTheme()` hook 获取 `resolvedTheme` → 触发 React 重渲染，动画组件无需重渲染即可工作
- B）`getComputedStyle` 读取 CSS 变量 → Canvas 初始化时变量可能未就绪

**理由**：AnimatedLogo 是纯 Canvas 动画组件，动画循环通过 `requestAnimationFrame` 驱动，不依赖 React 渲染周期。使用 MutationObserver + ref 方案：
1. 避免 React 重渲染开销（主题切换不触发组件 update）
2. 动画循环通过 `colorsRef.current` 读取最新调色板，确保下一帧即时响应
3. 初始化阶段无需等待 ThemeProvider 加载，直接检测 `.dark` class 即可（`main.tsx` 在 React 渲染前已同步设置该 class）

### 决策 3：函数签名使用可选参数（而非必选）

**选择**：所有 `draw*` 函数的 `colors` 参数为可选，默认 `LIGHT_COLORS`

**理由**：确保向后兼容。`AnimatedLogo.tsx` 之外如有调用方（如测试），无需修改。`AnimatedLogo.tsx` 是唯一需要传入暗色的调用方。

### 决策 4：drawEyes rgba 转换方案

**选择**：使用 `ctx.globalAlpha` + `colors.accent` 替代内联 `rgba()` 构造

**备选方案**：
- A）在调色板中增加 `accentRgb: [r, g, b]` 元组字段 → 额外字段增加维护负担
- B）新增 `hexToRgb` 工具函数运行时解析 → 引入新函数，仅一处使用

**理由**：`drawEyes` 已在 `ctx.save()/restore()` 块内执行，`globalAlpha` 的作用域天然被隔离，不会泄漏到其他绘制调用。用 `ctx.globalAlpha = eyeBrightness; ctx.fillStyle = colors.accent;` 两行即可替代 `rgba(66, 105, 196, ${eyeBrightness})`，零额外依赖，改动最小。

### 决策 5：暗色调色板配色策略

**选择**：反转明暗关系——深色填充、浅色轮廓

| 常量 | 浅色 | 暗色 | 设计意图 |
|------|------|------|----------|
| `outline` | `#333333` | `#CCCCCC` | 轮廓从深变浅，在暗底上可见 |
| `fill` | `#FFFFFF` | `#454545` | 填充从白变暗，与暗色背景协调，保留一定体积感 |
| `accent` | `#4269C4` | `#6b8dd8` | 品牌蓝提亮，暗底上对比度更好 |
| `desk` | `#666666` | `#999999` | 桌面线条提亮 |
| `keyboard` | `#E5E5E5` | `#3a3a3a` | 键盘从浅灰变暗灰 |
| `key` | `#FFFFFF` | `#4a4a4a` | 按键从白变暗 |
| `bubble` | `#4269C4` | `#6b8dd8` | 气泡背景跟随 accent |
| `bubbleText` | `#FFFFFF` | `#FFFFFF` | 气泡文字保持白色（暗蓝底上白字） |

暗色 accent `#6b8dd8` 与 index.html spinner 的暗色旋转条色一致。

## Risks / Trade-offs

- **[风险] 新增主题时需手动添加调色板** → 当前项目只支持浅色/暗色，短期不会扩展。如未来支持自定义主题，可再引入 CSS 变量读取方案
- **[风险] 暗色调色板颜色可能需要微调** → 暗色 accent 和填充色的具体值可能需要根据实际渲染效果微调，建议实现后目视验证
- **[权衡] Canvas 主题切换是瞬变的，无过渡动画** → Canvas 无法像 DOM 元素那样用 CSS transition 平滑过渡。但 Logo 只在启动阶段短暂显示，用户不会在 Logo 展示期间切换主题，因此影响可忽略
