## Context

当前测试套件包含约 159 个测试文件，其中存在约 160 处与实现细节强耦合的断言：
- 91 处 `container.querySelector` 直接查询 DOM 结构
- 69 处 `toHaveClass` 断言 Tailwind CSS 类名
- 约 201 处 `getByTestId` 中部分可用语义查询替代

根因分析揭示两层问题：
1. **组件侧**：60 个应用层组件中 63% 为纯 `<div>` 结构，缺乏 ARIA 属性和语义化 HTML，导致测试无法使用 `getByRole` 等无障碍查询
2. **测试侧**：部分组件已有正确 ARIA（如 BottomNav 的 `aria-current="page"`），但测试仍然使用 CSS 类名断言，说明问题不完全是组件缺失

项目使用 oxlint 而非 ESLint，不引入新的 lint 依赖。测试环境为 happy-dom（不支持可靠的计算样式）。

## Goals / Non-Goals

**Goals:**
- 消除全部 91 处 `container.querySelector`，替换为语义查询
- 消除全部 69 处 `toHaveClass`，按语义层级替换或删除
- 为组件补充 ARIA 属性，使可访问查询成为可能
- 建立 `data-variant` 约定表达 ARIA 未覆盖的展示变体
- 更新 BDD Guide 强化语义断言规范

**Non-Goals:**
- 不引入视觉回归测试（Playwright/Chromatic）
- 不引入 ESLint/testing-library lint 规则
- 不重构组件内部逻辑或改变用户可见行为
- 不处理测试覆盖率的提升（本变更专注于断言质量）
- 不处理 flaky test 的时序问题（属于独立变更）

## Decisions

### 决策 1：三层语义断言模型

采用 ARIA 标准语义 → `data-variant` 自定义语义 → 删除 的三层模型。

**替代方案：**
- A) 全部用 ARIA：不可行，尺寸变体不是 ARIA 标准定义的语义状态
- B) 全部用 `data-testid`：没有解决意图表达问题，只是换了查询方式
- C) 自定义 vitest 匹配器：引入额外的抽象层，匹配器内部仍耦合类名

**理由：** ARIA 有的用 ARIA（一石二鸟：测试解耦 + 可访问性改善），ARIA 没有的用 `data-variant`（表达组件功能意图），纯装饰不管。

### 决策 2：`data-variant` 命名约定

```typescript
// 放置位置：组件最外层容器
<div data-variant="compact" aria-selected="true">

// 值的命名：形容词或名词，描述展示意图
type Variant = 'default' | 'compact' | 'minimal'

// 多维变体：用多个 data-* 属性
<div data-variant="compact" data-density="comfortable">
```

**规则：**
- 命名描述"是什么"而非"看起来怎样"（`compact` 而非 `py-1-text-xs`）
- 值为有限集合时用 TypeScript 联合类型约束
- 测试中断言 `expect(el).toHaveAttribute('data-variant', 'compact')`

### 决策 3：`container.querySelector` 替换策略

按查询优先级替换：

```
getByRole > getByLabelText > getByText > getByDisplayValue > getByTestId > querySelector
```

| 当前查询 | 替换为 | 条件 |
|---------|-------|------|
| `querySelector('input[type="number"]')` | `getByRole('spinbutton')` | 无需组件改动 |
| `querySelector('svg.animate-spin')` | `getByRole('status')` | Spinner 已有 role |
| `querySelector('[data-testid="..."]')` | `screen.getByTestId(...)` | 至少用正确 API |
| `querySelector('div.overflow-y-auto')` | `getByRole('log')` | 需组件加 role |
| `querySelector('button')` | `getByRole('button', { name })` | 需组件加 aria-label |
| `querySelector('details')` | `getByRole('group')` | 语义元素隐式 role |

### 决策 4：`toHaveClass` 分类处理

| 类别 | 判断标准 | 处理方式 | 示例 |
|------|---------|---------|------|
| 语义状态 | 表达组件的功能状态 | 替换为 ARIA 断言 | `bg-primary/20` → `aria-selected` |
| 展示变体 | 表达组件的展示模式 | 替换为 `data-variant` | `py-2/text-sm/h-8` → `data-variant="default"` |
| 纯装饰 | 不表达功能或模式 | 删除 | `flex`, `border-t`, `hover:*` |
| className 透传 | 测试自定义 class prop 功能 | 保留 `toHaveClass` | `custom-class` 透传测试 |

### 决策 5：分四阶段执行

| Phase | 内容 | 组件改动 | 测试改动 | 风险 |
|-------|------|---------|---------|------|
| P0 | 免费修复（组件已有 ARIA） | 0 | ~30 处 | 零 |
| P1 | 高价值组件（核心交互） | 5 个 | ~25 处 | 低 |
| P2 | ChatButton（最复杂单一组件） | 1 个 | ~42 处 | 中 |
| P3 | 横切模式 + 剩余清理 | ~20 个 | ~63 处 | 低 |

### 决策 6：组件 `<div>` 改为语义元素的边界

**改为语义元素：** 导航容器（`<nav>`）、主内容区（`<main>`）、侧栏（`<aside>`）、页头（`<header>`）

**保持 `<div>` 加 ARIA role：** 不含嵌套交互元素的可点击行（加 `role="button"`）、滚动容器（加 `role="log"`）、状态区域（加 `role="status"`）

**含嵌套交互元素的容器：** 当 `<div>` 内部包含按钮、下拉菜单等交互元素时，不加 `role="button"`，改为添加 `aria-selected`、`tabIndex={0}`、`onKeyDown` 等属性。例如 ChatButton 包含 DropdownMenu 触发按钮，添加 `role="button"` 会违反 ARIA 嵌套规则（`role="button"` 与 `<button>` 有相同的交互元素嵌套限制）。

**理由：** 导航/内容/侧栏的语义元素改造成本低、收益高（浏览器自动识别 landmark）。不含嵌套交互元素的可点击行使用 `role="button"` 提供明确语义。含嵌套交互元素的容器通过 `aria-selected` 等全局属性表达状态，避免 ARIA 违规。

## Risks / Trade-offs

**[风险] `data-variant` 成为另一种形式的 testid** → 命名必须描述功能意图（compact/default），禁止使用实现细节（py-2/h-8）。通过 code review 和 BDD Guide 规范约束。

**[风险] 组件改动引入行为变化** → 仅添加 HTML 属性（aria-*、role、data-variant），不改变事件处理、样式逻辑或渲染条件。每个 Phase 完成后运行完整测试套件验证。

**[风险] 删除 CSS 类断言后布局回归无检测** → 接受这个 trade-off。当前 toHaveClass 只验证类名存在不验证渲染效果，其检测布局回归的能力本就有限。如有需要可在未来引入视觉回归测试。

**[风险] 含嵌套交互元素的可点击容器（ChatButton、ProviderCard）需补充键盘事件** → `tabIndex={0}` 使元素可获得焦点，需补充 `onKeyDown` 处理 Enter 和 Space 键触发 onClick。这是可访问性改进的必要工作。这些容器不加 `role="button"`（因内部含 DropdownMenu、Input 等交互元素，加 role 会违反 ARIA 嵌套规则），改为通过 `aria-selected`、`aria-expanded` 等全局属性表达状态。
