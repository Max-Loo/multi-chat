## Context

项目使用 shadcn/ui 组件库，Button 组件的 `destructive` variant 通过 Tailwind CSS 变量系统着色。当前 `main.css` 定义了 `--destructive`（背景色）但遗漏了 `--destructive-foreground`（前景色），导致 `text-destructive-foreground` 无法解析，文字回退为黑色。

涉及文件：`src/main.css`、`src/components/ui/button.tsx`、`src/pages/Setting/components/KeyManagementSetting/index.tsx`（其中 AlertDialog 确认按钮也使用了 destructive 样式覆盖）。

## Goals / Non-Goals

**Goals:**
- 补全 `--destructive-foreground` CSS 变量，使所有 destructive 按钮正确渲染为红底白字
- 保持亮色/暗色主题下的一致性

**Non-Goals:**
- 不调整 destructive 的背景色本身
- 不修改任何组件代码或 Button variant 定义

## Decisions

**在主题层（main.css）修复，而非组件层覆盖**

- 方案 A（采纳）：在 `main.css` 补充 CSS 变量，全局生效
- 方案 B（排除）：在 KeyManagementSetting 组件的 className 中硬编码 `text-white`，仅在单处生效，与主题系统脱耦

**颜色值选择**

亮色模式 `--destructive-foreground: oklch(0.985 0 0)`（白），暗色模式相同。与 `--primary-foreground` 保持一致，确保在红色背景上的可读性。

## Risks / Trade-offs

- **[低风险] KeyManagementSetting 中的 AlertDialog 确认按钮**：该按钮已有 `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"` 的内联覆盖（第 243 行）。修复主题变量后，此覆盖中的 `text-destructive-foreground` 将正确解析为白色，行为与预期一致，无需额外修改。
