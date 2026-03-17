## MODIFIED Requirements

### Requirement: 工具函数的可复用性

系统 SHALL 提供可在项目任何地方使用的工具函数，且项目中所有 logo URL 构建必须使用此工具函数。

#### Scenario: 导入工具函数
- **WHEN** 开发者需要使用供应商 logo URL
- **THEN** 系统通过 `@/utils/providerUtils` 导入工具函数
- **AND** 函数使用命名导出（named export）
- **AND** 函数命名为 `getProviderLogoUrl`

#### Scenario: TypeScript 类型支持
- **WHEN** 使用工具函数
- **THEN** 系统提供完整的 TypeScript 类型定义
- **AND** 函数签名为 `(providerKey: string): string`
- **AND** 返回类型为 string

#### Scenario: 禁止内联 URL 拼接
- **WHEN** 组件需要显示供应商 logo
- **THEN** 系统必须调用 `getProviderLogoUrl(providerKey)` 获取 URL
- **AND** 禁止使用内联字符串拼接 `\`https://models.dev/logos/${providerKey}.svg\``
- **AND** 确保 URL 格式的单一来源原则

#### Scenario: 函数文档
- **WHEN** 查看工具函数源码
- **THEN** 系统提供 JSDoc 注释
- **AND** 注释包含函数描述
- **AND** 注释包含参数说明（`@param`）
- **AND** 注释包含返回值说明（`@returns`）
- **AND** 注释包含使用示例（`@example`）
