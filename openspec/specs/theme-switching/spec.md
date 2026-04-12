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

### Requirement: 硬编码色值迁移

系统中所有硬编码的 Tailwind 色值必须替换为 shadcn/ui 语义变量，确保暗色模式全局生效。

**RATIONALE**: 硬编码色值（如 `bg-white`、`border-gray-200`）不响应主题切换，是暗色模式无法生效的根本原因。约 50 处分布在约 20 个源文件中。

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

#### Scenario: 迁移完整性验证

- **WHEN** 暗色模式功能开发完成
- **THEN** 业务代码中不允许存在 `bg-white`、`bg-gray-50`、`border-gray-200`、`border-gray-300`、`bg-gray-100` 等硬编码色值
- **AND** 必须通过 Grep 搜索验证零遗漏
