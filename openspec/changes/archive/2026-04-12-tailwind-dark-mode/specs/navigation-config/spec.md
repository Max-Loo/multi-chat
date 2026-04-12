## MODIFIED Requirements

### Requirement: 导航配置的主题样式支持

导航配置必须包含完整的主题样式信息，支持不同状态（active/inactive）的样式，且必须通过 CSS 变量实现以支持暗色模式。

**RATIONALE**: 保持现有 UI 设计一致性，同时使导航主题色在暗色模式下自动适配，消除 `!important` 的使用。

#### Scenario: 主题样式包含所有状态

- **WHEN** 定义导航项的 theme 对象
- **THEN** 必须包含 `base` 字段（基础样式）
- **AND** 必须包含 `active` 字段（激活状态样式）
- **AND** 必须包含 `inactive` 字段（未激活状态样式）

#### Scenario: 样式使用 CSS 变量而非硬编码色阶

- **WHEN** 定义导航项的颜色样式
- **THEN** 必须使用 CSS 变量映射的 Tailwind 工具类（如 `text-nav-chat`、`bg-nav-chat-muted`）
- **AND** 不得使用 `blue-*`、`emerald-*`、`violet-*` 等硬编码 Tailwind 色阶
- **AND** 不得使用 `!important` 标记

#### Scenario: 暗色模式下导航色自动适配

- **WHEN** 用户切换到暗色模式
- **THEN** 导航项的激活色必须自动调整为暗色友好的值
- **AND** 导航项的背景色必须降低亮度，避免在深色背景上过于刺眼

#### Scenario: 导航 CSS 变量定义

- **WHEN** 系统加载 `main.css`
- **THEN** 必须在 `:root` 和 `.dark` 中分别定义每个导航项的色值变量（`--nav-chat`、`--nav-model`、`--nav-setting` 及其 `-muted` 变体）
- **AND** 必须在 `@theme inline` 中将这些变量注册为 Tailwind 颜色 token（如 `--color-nav-chat`）
