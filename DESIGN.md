---
version: alpha
name: Multi Chat
description: 桌面端 AI 多模型聊天应用的设计系统，基于 shadcn/ui + Tailwind CSS，采用 oklch 色彩空间，支持 Light/Dark 双主题。
colors:
  primary: "#171717"
  primary-foreground: "#FAFAFA"
  secondary: "#F5F5F5"
  secondary-foreground: "#171717"
  accent: "#F5F5F5"
  accent-foreground: "#171717"
  muted: "#F5F5F5"
  muted-foreground: "#737373"
  destructive: "#E7000B"
  destructive-foreground: "#FAFAFA"
  background: "#FFFFFF"
  foreground: "#0A0A0A"
  card: "#FFFFFF"
  card-foreground: "#0A0A0A"
  popover: "#FFFFFF"
  popover-foreground: "#0A0A0A"
  border: "#E5E5E5"
  input: "#E5E5E5"
  ring: "#A1A1A1"
  sidebar: "#FAFAFA"
  sidebar-foreground: "#0A0A0A"
typography:
  headline:
    fontFamily: inherit
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  title-lg:
    fontFamily: inherit
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.01em
  title-md:
    fontFamily: inherit
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1
  body-lg:
    fontFamily: inherit
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: inherit
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: inherit
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: inherit
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
  label-sm:
    fontFamily: inherit
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.02em
rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 18px
  3xl: 22px
  4xl: 26px
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  button-primary-hover:
    backgroundColor: "#2A2A2A"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  button-secondary-hover:
    backgroundColor: "#EBEBEB"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: 36px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    borderColor: "{colors.input}"
    borderWidth: 1px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
  button-sm:
    height: 32px
    padding: "6px 12px"
    rounded: "{rounded.md}"
    fontSize: 12px
  button-lg:
    height: 40px
    padding: "8px 32px"
    rounded: "{rounded.md}"
  button-icon:
    height: 36px
    width: 36px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    borderColor: "{colors.border}"
    borderWidth: 1px
  card-header:
    padding: "{spacing.md}px {spacing.md}px 0"
  card-content:
    padding: "0 {spacing.md}px"
  card-footer:
    padding: "0 {spacing.md}px {spacing.md}px"
  input:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    borderColor: "{colors.input}"
    borderWidth: 1px
    height: 36px
    padding: "4px 12px"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    fontSize: 12px
  tooltip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    fontSize: 12px
---

# Multi Chat 设计系统

## Overview

Multi Chat 是一款桌面端 AI 多模型聊天应用，设计风格追求**简洁、高效、专注内容**。整体采用中性色调的极简主义风格，以黑白灰为主色系，不强调品牌色彩的视觉冲击，而是通过克制的色彩运用和清晰的层次结构让用户专注于对话内容本身。

设计理念：

- **内容优先**：界面元素服务于聊天内容，不喧宾夺主
- **克制用色**：中性色调为主，仅在错误/危险状态使用强调色
- **清晰层次**：通过留白、边框和微妙的阴影区分内容层级
- **双主题支持**：Light 模式以白色为基底，Dark 模式以深灰为基底，两种模式下均保持高可读性

## Colors

色彩系统基于 **oklch 色彩空间**，通过 CSS 变量实现 Light/Dark 主题切换。所有色值在 `src/main.css` 中定义。

### 语义色板

- **Primary (#171717)**：近乎纯黑，用于主要操作按钮、标题文字和强调元素。传递权威感和确定性。
- **Primary Foreground (#FAFAFA)**：近白色，用于 Primary 背景上的文字。确保在深色背景上的可读性。
- **Secondary (#F5F5F5)**：极浅灰，用于次要按钮背景和低优先级容器。与 Primary 形成微妙的层级对比。
- **Muted (#F5F5F5) / Muted Foreground (#737373)**：Muted 用于静默状态的背景，Muted Foreground 用于辅助说明文字、占位符文本。
- **Accent (#F5F5F5)**：用于悬停状态、选中项背景，提供交互反馈。
- **Destructive (#E7000B)**：红色，仅用于错误状态和危险操作（如删除确认），以克制的方式引起注意。
- **Background (#FFFFFF) / Foreground (#0A0A0A)**：页面的基础色对，确保最高对比度和可读性。
- **Border (#E5E5E5) / Input (#E5E5E5)**：用于边框和输入框边框，在白色背景上提供微妙的分隔。
- **Ring (#A1A1A1)**：用于焦点环，确保键盘导航时的可见性。

### Dark 模式

Dark 模式下色彩发生反转：Background 变为深灰 (#0A0A0A)，Primary 变为浅色 (#E5E5E5)，Border 使用半透明白色 (rgba(255,255,255,0.1))。整体保持相同的语义结构，仅调整明度。

## Typography

字体策略采用 **浏览器默认字体栈**（未显式设置 font-family），使用 Tailwind CSS 默认的 sans-serif 配置，确保各操作系统上的原生渲染效果和最佳性能。

### 层级体系

- **Headline (24px / Semi-Bold)**：页面级标题，用于错误页、404 页等特殊场景（`text-2xl font-semibold`）
- **Title LG (18px / Semi-Bold)**：组件标题，用于 Dialog 标题、设置面板标题等。紧凑行高（1.0），配合 tracking-tight（`text-lg font-semibold`）
- **Title MD (16px / Semi-Bold)**：次要组件标题（`text-base font-semibold`）
- **Body LG (16px / Regular)**：大号正文（`text-base`）
- **Body MD (14px / Regular)**：正文内容，默认文本样式。行高 1.6 保证长文可读性（`text-sm`）
- **Body SM (12px / Regular)**：辅助文本、描述文字（`text-xs`）
- **Label MD (14px / Medium)**：表单标签、按钮文字。字重 500 区分于正文
- **Label SM (12px / Semi-Bold)**：Badge 文字、菜单标签。微调字间距增强辨识度

### 设计原则

- 正文使用 `text-sm`（14px）作为基础尺寸，适配桌面应用的信息密度需求
- 标题层级通过字重变化（400/500/600）区分，`font-bold`（700）仅用于 Logo 和 404 数字等极特殊场景
- 描述性文字统一使用 `text-muted-foreground`，与正文形成视觉退让

## Layout

布局遵循 **Tailwind CSS 默认间距体系**，以 4px 为基础单位。

### 间距规范

项目中的间距使用呈现以下模式：

- **4px (p-1, gap-1)**：图标与文字间距、菜单项内边距
- **8px (p-2, gap-2)**：小组件内边距、紧凑布局间距
- **12px (px-3)**：输入框水平内边距、Badge 水平内边距
- **16px (p-4, gap-4)**：组件标准内边距、Dialog/Sheet 内容区域
- **24px (p-6)**：Card 内边距、Dialog/Sheet 内容区域（宽裕布局）
- **32px (px-8)**：大按钮水平内边距
- **48px+**：页面级间距

### 布局模式

- 组件内部使用 Flexbox 布局（`flex`, `items-center`, `justify-between`）
- 卡片/容器使用统一的内边距体系（Header: p-6, Content: px-6, Footer: px-6）
- 列表项统一使用 `py-1.5 px-2` 的紧凑内边距

## Elevation & Depth

层次感主要通过 **边框和微妙的阴影** 表达，而非重度阴影。

### 层级定义

- **Level 0 - 平面**：页面背景（background），无边框无阴影
- **Level 1 - 容器**：Card 组件，使用 `border` + `shadow`（轻阴影）。在白色背景上通过边框区分
- **Level 2 - 浮层**：Popover、Dropdown Menu、Select Content，使用 `border` + `shadow-md`。从页面上浮起的交互面板
- **Level 3 - 模态**：Dialog、Sheet，使用 `border` + `shadow-lg`，配合半透明遮罩层（`bg-black/80`）
- **Level 4 - 提示**：Tooltip，使用 `bg-primary` 实色背景，无阴影

### Dark 模式适配

Dark 模式下边框使用半透明白色（`oklch(1 0 0 / 10%)`），比 Light 模式更含蓄，避免在深色背景上过于突兀。

## Shapes

圆角系统基于一个 **基础半径变量 `--radius: 0.625rem`（10px）**，通过 CSS calc 衍生出完整的圆角阶梯：

- **sm (6px)**：小元素如 Checkbox、Switch
- **md (8px)**：标准元素如 Button、Input、Badge、Tooltip
- **lg (10px)**：中等容器，作为 Dialog 的默认圆角
- **xl (14px)**：Card 容器的主圆角，`rounded-xl`
- **2xl (18px) ~ 4xl (26px)**：更大的容器或特殊组件
- **full (9999px)**：圆形元素如 Avatar、圆形按钮

### 设计原则

- 交互元素（按钮、输入框）统一使用 `rounded-md`（8px）
- 容器类组件（Card）使用 `rounded-xl`（14px），提供更柔和的视觉感
- 圆角从 Level 0 到 Level 3 逐渐增大，增强层级的视觉表达

## Components

### Buttons

按钮通过 CVA (class-variance-authority) 管理 6 种变体和 4 种尺寸：

| 变体 | 用途 | 背景 | 文字 |
|------|------|------|------|
| Default | 主要操作 | Primary | Primary Foreground |
| Secondary | 次要操作 | Secondary | Secondary Foreground |
| Destructive | 危险操作 | Destructive | Destructive Foreground |
| Outline | 边框按钮 | Transparent + Border | Foreground |
| Ghost | 极简按钮 | Transparent | Foreground → Accent on hover |
| Link | 链接式按钮 | Transparent | Primary + Underline on hover |

尺寸体系：default (36px), sm (32px, 12px字号), lg (40px), icon (36x36px 正方形)。

状态：所有按钮 disabled 状态统一 `opacity-50 pointer-events-none`，焦点状态使用 `ring-1 ring-ring`。

### Cards

Card 组件使用 `rounded-xl` 圆角，配合 `border` 和 `shadow`。内部结构分为 Header（`p-6`）、Content（`px-6 pt-0`）、Footer（`px-6 pt-0`），确保内容区域之间通过间距自然分隔。

### Input Fields

Input 和 Textarea 使用透明背景（`bg-transparent`），通过 `border-input` 边框定义边界。焦点状态使用 `ring-1 ring-ring`。高度与按钮保持一致（`h-9` = 36px），确保表单布局对齐。

### Dialogs & Sheets

Dialog 使用固定定位居中布局，遮罩层 `bg-black/80`。内容区域使用 `gap-4`、`p-6` 的宽松间距。Sheet 从屏幕边缘滑入，支持四个方向，默认宽度 `w-3/4`（最大 `sm:max-w-sm`）。

### Badges

Badge 使用 `rounded-md`、`px-2.5 py-0.5` 的紧凑尺寸，`text-xs font-semibold`。提供 Default（Primary 填充）、Secondary、Destructive、Outline 四种变体。

### Tooltips

Tooltip 使用 `bg-primary` 实色背景，`text-xs`，`rounded-md`，配合方向感知的滑入动画。

### Dropdown Menus

下拉菜单使用 `bg-popover` 背景，`rounded-md border shadow-md`。菜单项使用 `px-2 py-1.5 text-sm` 的紧凑布局，悬停/聚焦状态使用 `bg-accent`。分隔线使用 `bg-muted`，高度 1px。

## Do's and Don'ts

- Do 使用语义化的 CSS 变量（如 `bg-primary`、`text-muted-foreground`），而非硬编码色值
- Do 保持 Button 和 Input 的高度一致（`h-9`），确保表单行对齐
- Do 使用 `text-sm`（14px）作为正文基础尺寸
- Do 在 Dark 模式下使用半透明边框（`oklch(1 0 0 / 10%)`）
- Don't 在非错误/危险场景使用 Destructive 颜色
- Don't 混用不同的圆角层级（同一视图内保持一致的圆角大小）
- Don't 在组件中使用硬编码的 px 值作为间距，使用 Tailwind 的间距类
- Don't 在 Dark 模式下使用与 Light 模式相同的不透明边框颜色
