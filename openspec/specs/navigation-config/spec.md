# navigation-config Specification

## Purpose
TBD - created by archiving change unify-navigation-config. Update Purpose after archive.
## Requirements
### Requirement: 统一导航配置数据源

系统必须提供统一的导航配置文件，作为应用中所有导航项的唯一数据源。

**RATIONALE**: 消除重复定义，降低维护成本，确保导航项在不同组件间的一致性。

#### Scenario: 导航配置包含所有必要字段

- **WHEN** 系统加载导航配置
- **THEN** 配置必须包含以下字段：
  - `id`: 导航项唯一标识符（如 "chat", "model", "setting"）
  - `i18nKey`: 国际化键路径（如 "navigation.chat"）
  - `path`: 路由路径（如 "/chat"）
  - `icon`: 图标组件（LucideIcon 或 ReactNode）
  - `theme`: 主题样式配置（base, active, inactive）

#### Scenario: 导航配置导出只读常量

- **WHEN** 外部模块导入导航配置
- **THEN** 必须导出 `NAVIGATION_ITEMS` 只读数组
- **AND** 必须导出 `NAVIGATION_ITEM_MAP` Map 对象用于快速查找

### Requirement: 类型安全的导航配置

导航配置必须使用 TypeScript 严格类型定义，确保编译时类型检查。

**RATIONALE**: 防止运行时错误，提供 IDE 智能提示，提升开发体验。

#### Scenario: 导航项类型定义

- **WHEN** 定义导航项类型
- **THEN** 必须使用 `NavigationItem` 接口
- **AND** `id` 字段类型必须为 `NavigationItemId` 字面量联合类型
- **AND** `i18nKey` 字段类型必须为模板字面量类型 `` `navigation.${NavigationItemId}` ``
- **AND** `icon` 字段类型必须支持 `LucideIcon | ReactNode`

#### Scenario: 配置数组使用 as const

- **WHEN** 定义导航配置数组
- **THEN** 必须使用 `as const` 断言
- **AND** 数组类型必须为 `readonly NavigationItem[]`

### Requirement: 导航配置的组件适配

系统必须提供将统一配置转换为组件所需格式的机制。

**RATIONALE**: 保持组件接口不变，支持不同的数据格式需求。

#### Scenario: Sidebar 组件适配

- **WHEN** Sidebar 组件使用导航配置
- **THEN** 必须将 `NAVIGATION_ITEMS` 转换为包含 `name` 字段的格式
- **AND** `name` 字段必须通过 `t($ => $[item.i18nKey])` 动态生成
- **AND** 必须保留 `icon` 为 `ReactNode` 类型（已渲染的组件）

#### Scenario: BottomNav 组件适配

- **WHEN** BottomNav 组件使用导航配置
- **THEN** 必须将 `NAVIGATION_ITEMS` 转换为包含 `icon` 为组件类的格式
- **AND** 必须支持动态图标渲染（`<Icon />`）
- **AND** 必须使用 `aria-label` 和国际化键提供无障碍支持

### Requirement: 导航配置的扩展性

导航配置结构必须支持未来添加新导航项，无需修改现有代码。

**RATIONALE**: 遵循开放-封闭原则，降低扩展成本。

#### Scenario: 添加新导航项

- **WHEN** 需要添加新的导航项
- **THEN** 只需在 `NAVIGATION_ITEMS` 数组中添加新对象
- **AND** 不需要修改配置文件的其他部分
- **AND** 不需要修改使用配置的组件代码

#### Scenario: 按 ID 获取导航项

- **WHEN** 需要按 ID 获取特定导航项
- **THEN** 必须使用 `NAVIGATION_ITEM_MAP.get(id)` 方法
- **AND** 时间复杂度必须为 O(1)

### Requirement: 导航配置的主题样式支持

导航配置必须包含完整的主题样式信息，支持不同状态（active/inactive）的样式。

**RATIONALE**: 保持现有 UI 设计一致性，支持 Tailwind CSS 样式系统。

#### Scenario: 主题样式包含所有状态

- **WHEN** 定义导航项的 theme 对象
- **THEN** 必须包含 `base` 字段（基础样式）
- **AND** 必须包含 `active` 字段（激活状态样式）
- **AND** 必须包含 `inactive` 字段（未激活状态样式）

#### Scenario: 样式类名格式

- **WHEN** 定义样式类名
- **THEN** 必须使用 Tailwind CSS 类名格式
- **AND** 必须使用 `!` 标记确保样式优先级
- **AND** 必须支持颜色主题（如 blue, emerald, violet）

