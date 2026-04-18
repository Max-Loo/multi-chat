## Context

FatalErrorScreen 是应用初始化失败时显示的全屏页面。当前使用 shadcn/ui 的 `<Alert variant="destructive">` 展示错误信息，按钮以竖向 `gap-2` 排列。主要问题：错误卡片内边距不足，按钮区域紧凑缺乏层次。

技术栈：React + TypeScript + Tailwind CSS + shadcn/ui，支持 dark/light 主题。

## Goals / Non-Goals

**Goals:**

- 增大错误 Alert 的内边距和行间距，提升可读性
- 重新组织按钮布局，用分割线区分主操作与危险操作
- 保持红色警示感，不改变现有色彩体系

**Non-Goals:**

- 不添加动画、渐变背景或装饰性插图
- 不改变错误数据结构（InitError）或对话框逻辑
- 不调整 KeyRecoveryDialog 或重置确认 AlertDialog

## Decisions

### 1. 错误展示：保留 Alert 组件，增大间距

**选择**：继续使用 `<Alert variant="destructive">`，通过 Tailwind 工具类增加内边距和行间距。

**理由**：保留红色警示感（用户要求），避免引入新组件。通过 `className` 覆盖即可调整间距。

**备选**：换用 `<Card>` 组件 — 放弃，因为 Card 没有红色警示变体，需要额外样式工作。

### 2. 按钮布局：分割线 + 横向排列

**选择**：刷新按钮独占一行 → `<Separator>` 分割线 → 恢复和重置按钮横向并排。

**理由**：分割线清晰区分「安全操作」和「危险操作」的心理模型。横向排列减少纵向高度占用。

**备选**：继续竖排但加大间距 — 放弃，纵向占用过多空间且缺乏主次区分。

### 3. Separator 组件来源

**选择**：使用 shadcn/ui 的 `<Separator>` 组件（需检查是否已安装，若未安装则添加）。

**备选**：使用 `<div className="border-t">` — 可行但语义不如 Separator 组件。

## Risks / Trade-offs

- **[Separator 未安装]** → 需先安装 shadcn/ui Separator 组件，或使用 `border-t` 降级方案
- **[小屏幕适配]** → 横向按钮在极窄窗口下可能需要换行，使用 `flex-wrap` 兜底
