## ADDED Requirements

### Requirement: 暗色模式色彩对比度规范

暗色模式下所有文字与背景的组合必须满足对比度在 8:1~12:1 的舒适区间内。背景亮度必须不低于 oklch(0.175)，前景亮度必须不高于 oklch(0.935)。

**RATIONALE**: 过高的对比度（>12:1）产生光晕效应导致视疲劳，过低的对比度（<8:1）影响可读性。主流暗色模式设计（macOS、VS Code、GitHub）均控制在此区间。

#### Scenario: 主背景与主文字对比度

- **WHEN** 应用处于暗色模式
- **THEN** `--background` 与 `--foreground` 的对比度必须在 8:1~12:1 之间
- **AND** `--background` 亮度值必须不低于 oklch(0.175)
- **AND** `--foreground` 亮度值必须不高于 oklch(0.935)

#### Scenario: 卡片层级对比度

- **WHEN** 应用处于暗色模式
- **THEN** `--card` 与 `--card-foreground` 的对比度必须在 8:1~12:1 之间
- **AND** `--card` 与 `--background` 的亮度差必须至少为 oklch(0.05)，确保层级可区分

#### Scenario: 次要文字可读性

- **WHEN** 应用处于暗色模式
- **THEN** `--muted-foreground` 与 `--background` 的对比度必须满足 WCAG AA（4.5:1）

#### Scenario: 导航栏色彩

- **WHEN** 应用处于暗色模式
- **THEN** `--nav-*-muted` 变量的亮度值必须不低于 oklch(0.25)
- **AND** 导航栏活跃色与 muted 色之间必须有足够的视觉区分度

## MODIFIED Requirements

### Requirement: 硬编码色值迁移

系统中所有硬编码的 Tailwind 色值必须替换为 shadcn/ui 语义变量，确保暗色模式全局生效。包含 `dark:` 前缀的硬编码暗色模式覆盖也必须替换为 CSS 变量方案。

**RATIONALE**: 硬编码色值（如 `bg-white`、`border-gray-200`）不响应主题切换，是暗色模式无法生效的根本原因。约 50 处分布在约 20 个源文件中。`dark:` 前缀硬编码（如 `dark:bg-orange-600`）虽然能响应主题切换，但破坏了 CSS 变量统一管理的架构一致性。

#### Scenario: 容器和页面背景

- **WHEN** 组件使用页面或容器背景色
- **THEN** 必须使用 `bg-background` 替代 `bg-white`
- **AND** 亮色模式下渲染为白色，暗色模式下渲染为深色

#### Scenario: 边框颜色

- **WHEN** 组件使用边框
- **THEN** 必须使用 `border-border` 替代 `border-gray-200` 和 `border-gray-300`
- **AND** 亮色模式下渲染为灰色边框，暗色模式下渲染为半透明边框

#### Scenario: 文字颜色

- **WHEN** 组件使用文字颜色
- **THEN** 主文字必须使用 `text-foreground` 替代 `text-gray-800`
- **AND** 次要文字必须使用 `text-muted-foreground` 替代 `text-gray-500` 和 `text-gray-400`

#### Scenario: 按钮和操作色

- **WHEN** 组件使用主操作按钮样式
- **THEN** 必须使用 `bg-primary` 替代 `bg-gray-900`
- **AND** 必须使用 `text-primary-foreground` 替代 `text-white`

#### Scenario: dark: 前缀硬编码

- **WHEN** 组件使用 `dark:` 前缀的 Tailwind 类覆盖暗色模式样式
- **THEN** 必须替换为 CSS 变量方案，不使用 `dark:` 前缀
- **AND** 暗色模式样式必须通过 `.dark {} 块中的 CSS 变量自动生效

#### Scenario: 迁移完整性验证

- **WHEN** 暗色模式功能开发完成
- **THEN** 业务代码中不允许存在 `bg-white`、`bg-gray-50`、`border-gray-200`、`border-gray-300`、`bg-gray-100` 等硬编码色值
- **AND** 业务代码中不允许存在 `dark:` 前缀的 Tailwind 类
- **AND** 必须通过 Grep 搜索验证零遗漏
