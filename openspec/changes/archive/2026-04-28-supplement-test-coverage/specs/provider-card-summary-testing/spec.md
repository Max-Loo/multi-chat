## ADDED Requirements

### Requirement: ProviderCardSummary 渲染模型数量

组件 SHALL 使用 i18n key `setting.modelProvider.modelCount` 渲染模型数量文本，传入 `{ count: modelCount }` 作为插值参数。

#### Scenario: 渲染模型数量文本
- **WHEN** 传入 `modelCount: 5`
- **THEN** SHALL 显示 i18n 插值后的模型数量文本（如 "共 5 个模型"）

#### Scenario: 渲染零模型数量
- **WHEN** 传入 `modelCount: 0`
- **THEN** SHALL 显示 i18n 插值后的文本（如 "共 0 个模型"）

### Requirement: ProviderCardSummary 收起时显示提示信息

当 `isExpanded` 为 `false` 时，组件 SHALL 显示"点击查看详情"提示文本（i18n key `setting.modelProvider.clickToViewDetails`）。

#### Scenario: 收起时显示提示
- **WHEN** 传入 `isExpanded: false`
- **THEN** SHALL 显示 "点击查看详情" 文本

### Requirement: ProviderCardSummary 展开时隐藏提示信息

当 `isExpanded` 为 `true` 时，组件 SHALL NOT 渲染"点击查看详情"提示文本。

#### Scenario: 展开时隐藏提示
- **WHEN** 传入 `isExpanded: true`
- **THEN** "点击查看详情" 文本 SHALL NOT 出现在 DOM 中
