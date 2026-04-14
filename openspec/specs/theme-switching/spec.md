# theme-switching Specification

## Purpose
自定义主题管理系统，支持浅色/深色/跟随系统三种模式，基于 React Context 和 CSS 变量实现全局主题切换。
## Requirements
### Requirement: 自定义 useTheme Hook

系统必须提供基于 React Context 的 `ThemeProvider` 和 `useTheme` Hook，作为全局主题状态的唯一管理器，通过 `.dark` class 切换实现主题变化。所有消费组件共享同一份主题状态。

**RATIONALE**: 不引入外部依赖，使用约 50 行代码基于 Context 自建主题管理，确保多组件间状态同步。纯 Hook 模式（无 Context）会导致各消费组件持有独立状态，主题切换后其他组件的 `theme`/`resolvedTheme` 不会更新。

#### Scenario: 主题初始化无闪烁

- **WHEN** 应用启动
- **THEN** 必须在 React 渲染之前同步读取 localStorage 并设置 `.dark` class
- **AND** 首次渲染即使用正确的主题

#### Scenario: 纯 HTML 阶段响应系统暗色偏好

- **WHEN** 浏览器解析 `index.html`（JS 模块尚未加载）
- **AND** 操作系统偏好为暗色模式
- **THEN** inline script 必须在 Spinner 渲染前同步执行 `matchMedia("(prefers-color-scheme: dark)")`
- **AND** 检测到暗色偏好时必须在 `<html>` 元素上设置 `.dark` class
- **AND** `<body>` 背景必须显示为暗色（与 `main.css` 中 `--background` 暗色值一致）
- **AND** Spinner 的轨道和旋转条颜色必须适配暗色背景

#### Scenario: 纯 HTML 阶段浅色系统偏好

- **WHEN** 浏览器解析 `index.html`（JS 模块尚未加载）
- **AND** 操作系统偏好为浅色模式
- **THEN** `<html>` 元素不得有 `.dark` class
- **AND** `<body>` 背景必须为白色
- **AND** Spinner 显示浅色配色方案

#### Scenario: main.tsx 加载后覆盖 inline script 结果

- **WHEN** main.tsx 加载并执行同步初始化
- **AND** 用户在 localStorage 中存储了明确的主题偏好（如 "light"）
- **AND** 系统偏好为暗色
- **THEN** main.tsx 必须根据 localStorage 偏好重新计算并设置 `.dark` class
- **AND** 最终显示浅色主题（覆盖 inline script 设置的暗色）

#### Scenario: 主题偏好持久化

- **WHEN** 用户切换主题
- **THEN** 选择的主题必须立即存储到 localStorage 的 `multi-chat-theme` key
- **AND** 应用重启后必须恢复上次选择的主题

#### Scenario: 系统偏好跟随

- **WHEN** 主题设置为 "system"
- **AND** 操作系统切换到暗色模式
- **THEN** 应用必须自动切换到暗色模式
- **AND** `<html>` 元素必须获得 `.dark` class

#### Scenario: Hook 返回值

- **WHEN** 组件调用 `useTheme()`
- **THEN** 必须返回 `theme`（用户设置值：light/dark/system）
- **AND** 必须返回 `setTheme`（设置函数）
- **AND** 必须返回 `resolvedTheme`（实际生效值：light/dark）

### Requirement: 主题切换 UI

系统必须在设置页的通用设置中提供主题选择 UI，允许用户选择浅色、深色或跟随系统。

**RATIONALE**: 与语言、自动命名等偏好设置放在一起，符合用户心智模型。

#### Scenario: 主题选项展示

- **WHEN** 用户打开设置页的通用设置
- **THEN** 必须显示主题选择器
- **AND** 选项必须包含：浅色、深色、跟随系统

#### Scenario: 切换主题

- **WHEN** 用户选择"深色"主题
- **THEN** `<html>` 元素必须获得 `.dark` class
- **AND** 所有使用语义变量的组件必须立即切换为暗色样式
- **AND** 设置必须持久化到 localStorage

#### Scenario: 当前主题标识

- **WHEN** 用户打开设置页
- **THEN** 主题选择器必须显示当前生效的主题选项

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

### Requirement: 硬编码色值迁移

系统中所有硬编码的 Tailwind 色值必须替换为 shadcn/ui 语义变量，确保暗色模式全局生效。暗色模式下，所有页面侧边栏容器必须使用 `bg-sidebar` 背景色，与全局图标导航栏保持统一亮度层级，通过边框区分区域边界。包含 `dark:` 前缀的硬编码暗色模式覆盖也必须替换为 CSS 变量方案。

**RATIONALE**: 硬编码色值（如 `bg-white`、`border-gray-200`）不响应主题切换，是暗色模式无法生效的根本原因。约 50 处分布在约 20 个源文件中。`dark:` 前缀硬编码（如 `dark:bg-orange-600`）虽然能响应主题切换，但破坏了 CSS 变量统一管理的架构一致性。

#### Scenario: 容器和页面背景

- **WHEN** 组件使用页面或容器背景色
- **THEN** 必须使用 `bg-background` 替代 `bg-white`
- **AND** 亮色模式下渲染为白色，暗色模式下渲染为深色

#### Scenario: 侧边栏容器背景

- **WHEN** Chat、Model、Setting 页面的内容侧边栏容器渲染
- **THEN** 必须使用 `bg-sidebar` 作为背景色
- **AND** 亮色模式下渲染为 `--sidebar` 亮色值
- **AND** 暗色模式下渲染为 `--sidebar` 暗色值（oklch 0.22）
- **AND** 与全局图标导航栏保持相同背景亮度

#### Scenario: 侧边栏区域区分

- **WHEN** 暗色模式下多个侧边栏区域相邻显示
- **THEN** 必须通过 `border-border` 边框进行视觉区分
- **AND** 不依赖背景色亮度差区分区域

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
