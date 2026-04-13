## Context

当前暗色模式通过 `src/main.css` 中 `.dark {} 块的 CSS 变量定义，使用 oklch 色彩空间。所有组件通过 Tailwind 的语义化颜色（`bg-background`、`text-foreground` 等）引用这些变量，实现主题切换。

当前暗色模式色彩值的主要问题：
- `--background: oklch(0.145)` 与 `--foreground: oklch(0.985)` 对比度约 15:1，远超舒适区间
- 导航栏 muted 色值 `oklch(0.22)` 偏暗，与背景层次感不足
- `Title.tsx` 中存在 `dark:bg-orange-600`、`alert.tsx` 中存在 `dark:border-destructive`，共 2 处硬编码 `dark:` 前缀，破坏了 CSS 变量统一管理

## Goals / Non-Goals

**Goals:**
- 将暗色模式主对比度降至 9:1~10:1 的舒适区间
- 保持所有文字/背景组合满足 WCAG AA（4.5:1）最低要求
- 导航栏色彩同步优化
- 移除硬编码 `dark:` 前缀，统一使用 CSS 变量

**Non-Goals:**
- 不引入新的色彩（如蓝调、紫调暗色），保持中性灰色调
- 不改变浅色模式的任何色彩值
- 不改变主题切换的机制或 UI（useTheme Hook、ThemeProvider）
- 不引入第三方暗色模式调色板工具

## Decisions

### 决策 1：使用方案 C（背景微提 + 前景降低）

**选择**：同时微提背景亮度和降低前景亮度。

**具体调色方案**：

| 变量 | 当前值 | 调整后 | 说明 |
|------|--------|--------|------|
| `--background` | oklch(0.145 0 0) | oklch(0.175 0 0) | 微提 0.03 |
| `--foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 降低 0.05 |
| `--card` | oklch(0.205 0 0) | oklch(0.230 0 0) | 微提 0.025 |
| `--card-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 降低 0.05 |
| `--popover` | oklch(0.205 0 0) | oklch(0.230 0 0) | 同 card |
| `--popover-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 同 card-foreground |
| `--primary` | oklch(0.922 0 0) | oklch(0.880 0 0) | 降低 0.04 |
| `--primary-foreground` | oklch(0.205 0 0) | oklch(0.205 0 0) | 保持不变 |
| `--secondary` | oklch(0.269 0 0) | oklch(0.290 0 0) | 微提 0.02 |
| `--secondary-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 同 foreground |
| `--muted` | oklch(0.269 0 0) | oklch(0.290 0 0) | 同 secondary |
| `--muted-foreground` | oklch(0.708 0 0) | oklch(0.650 0 0) | 降低 0.06，增强层次 |
| `--accent` | oklch(0.269 0 0) | oklch(0.290 0 0) | 同 secondary |
| `--accent-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 同 foreground |
| `--sidebar` | oklch(0.205 0 0) | oklch(0.230 0 0) | 同 card |
| `--sidebar-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 同 foreground |
| `--sidebar-primary` | oklch(0.488 0.243 264.376) | oklch(0.488 0.243 264.376) | 保持不变 |
| `--sidebar-primary-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 同 foreground |
| `--sidebar-accent` | oklch(0.269 0 0) | oklch(0.290 0 0) | 同 secondary |
| `--sidebar-accent-foreground` | oklch(0.985 0 0) | oklch(0.935 0 0) | 同 foreground |
| `--sidebar-border` | oklch(1 0 0 / 10%) | oklch(1 0 0 / 12%) | 微提透明度 |
| `--border` | oklch(1 0 0 / 10%) | oklch(1 0 0 / 12%) | 微提透明度 |
| `--input` | oklch(1 0 0 / 15%) | oklch(1 0 0 / 18%) | 微提透明度 |

**导航栏调色**：

| 变量 | 当前值 | 调整后 |
|------|--------|--------|
| `--nav-chat` | oklch(0.623 0.180 259) | oklch(0.623 0.180 259) | 保持不变 |
| `--nav-chat-muted` | oklch(0.22 0.05 256) | oklch(0.25 0.05 256) | 微提 0.03 |
| `--nav-model` | oklch(0.696 0.15 163) | oklch(0.696 0.15 163) | 保持不变 |
| `--nav-model-muted` | oklch(0.22 0.05 163) | oklch(0.25 0.05 163) | 微提 0.03 |
| `--nav-setting` | oklch(0.653 0.2 293) | oklch(0.653 0.2 293) | 保持不变 |
| `--nav-setting-muted` | oklch(0.22 0.05 294) | oklch(0.25 0.05 294) | 微提 0.03 |

**理由**：双方向调整比单方向调整效果更自然，微调幅度控制在 0.02~0.06 之间，确保视觉连续性。

**替代方案**：
- 仅调背景：纯白文字仍有光晕效应
- 仅调前景：背景过深显得沉闷

### 决策 2：硬编码 dark: 前缀改为 CSS 变量

**选择**：将 `Title.tsx` 中的 `dark:bg-orange-600` 和 `alert.tsx` 中的 `dark:border-destructive` 替换为 CSS 变量方案。

**理由**：项目已建立完整的 CSS 变量色彩系统，硬编码 `dark:` 前缀破坏了一致性。

**具体处理**：
- `Title.tsx` 的 `dark:bg-orange-600` → 使用 Tailwind 的条件类或直接使用一个自定义 CSS 变量来控制 badge 在暗色模式下的背景色
- `alert.tsx` 的 `dark:border-destructive` → 由于 shadcn/ui 组件中 `border-destructive` 在暗色模式下可能需要降低不透明度，考虑改为 `border-destructive/50`（已在浅色端使用），或通过 CSS 变量控制边框在暗色模式下的表现

### 决策 3：调色后验证策略

**选择**：通过视觉审查验证，不引入自动化对比度检测工具。

**理由**：oklch 色彩空间的对比度计算需要专门的工具支持，本次变更范围小，视觉审查即可确保质量。

## Risks / Trade-offs

- **[风险] 色彩层次感降低** → 微提背景后，card 与 background 的区分度可能减弱。缓解：保持至少 0.05 的亮度差（0.230 - 0.175 = 0.055），足以区分
- **[风险] muted-foreground 可读性** → 降低到 0.650 后与背景对比度约 6:1，仍满足 WCAG AA
- **[取舍] 不追求最低对比度** → 选择了 9:1~10:1 而非 8:1，优先保证可读性
