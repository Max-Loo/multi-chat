## ADDED Requirements

### Requirement: ProviderCardHeader 渲染供应商名称和 Logo

组件 SHALL 渲染 `ProviderLogo`（传入 `providerKey` 和 `providerName`，`size=40`）和 `<h3>` 元素显示 `providerName`。

#### Scenario: 渲染供应商名称和首字母 Logo
- **WHEN** 传入 `providerName: 'DeepSeek'`、`providerKey: 'deepseek'`
- **THEN** 页面 SHALL 显示文本 "DeepSeek"（h3 标题）
- **AND** SHALL 渲染 ProviderLogo 组件

### Requirement: ProviderCardHeader 渲染可用状态徽章

当 `status` 为 `'available'` 时，组件 SHALL 显示绿色可用状态徽章（包含 CheckCircle 图标）。

#### Scenario: 显示可用状态
- **WHEN** 传入 `status: 'available'`
- **THEN** SHALL 显示包含 CheckCircle 图标的状态徽章
- **AND** 徽章文本 SHALL 为 i18n key `setting.modelProvider.status.available` 对应的翻译

### Requirement: ProviderCardHeader 渲染不可用状态徽章

当 `status` 为 `'unavailable'` 时，组件 SHALL 显示红色不可用状态徽章（包含 XCircle 图标）。

#### Scenario: 显示不可用状态
- **WHEN** 传入 `status: 'unavailable'`
- **THEN** SHALL 显示包含 XCircle 图标的状态徽章
- **AND** 徽章文本 SHALL 为 i18n key `setting.modelProvider.status.unavailable` 对应的翻译

### Requirement: ProviderCardHeader 展开/折叠图标方向

组件 SHALL 根据 `isExpanded` prop 显示不同的 chevron 图标：展开时显示 `ChevronUp`，收起时显示 `ChevronDown`。

#### Scenario: 收起时显示向下箭头
- **WHEN** 传入 `isExpanded: false`
- **THEN** SHALL 渲染 ChevronDown 图标

#### Scenario: 展开时显示向上箭头
- **WHEN** 传入 `isExpanded: true`
- **THEN** SHALL 渲染 ChevronUp 图标
