## MODIFIED Requirements

### Requirement: 硬编码色值迁移

系统中所有硬编码的 Tailwind 色值必须替换为 shadcn/ui 语义变量，确保暗色模式全局生效。暗色模式下，所有页面侧边栏容器必须使用 `bg-sidebar` 背景色，与全局图标导航栏保持统一亮度层级，通过边框区分区域边界。

**RATIONALE**: 页面侧边栏透出 `--background`（oklch 0.175）过深，与 `--sidebar`（oklch 0.22）存在亮度断层。统一使用 `--sidebar` 消除层级不一致，边框（`border-border`）已足够区分区域。

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

#### Scenario: 迁移完整性验证

- **WHEN** 暗色模式功能开发完成
- **THEN** 业务代码中不允许存在 `bg-white`、`bg-gray-50`、`border-gray-200`、`border-gray-300`、`bg-gray-100` 等硬编码色值
- **AND** 必须通过 Grep 搜索验证零遗漏
