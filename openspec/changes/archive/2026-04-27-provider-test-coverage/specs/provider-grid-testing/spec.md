## ADDED Requirements

### Requirement: 空供应商列表渲染
系统 SHALL 在 providers 为空数组时渲染空状态提示。

#### Scenario: 无供应商数据
- **WHEN** providers 为空数组
- **THEN** 渲染包含"暂无模型供应商数据"文本的提示区域
- **AND** 不渲染任何 ProviderCard 组件

### Requirement: 非空供应商列表渲染
系统 SHALL 在 providers 非空时使用 Masonry 瀑布流布局渲染所有供应商卡片。

#### Scenario: 渲染多个供应商卡片
- **WHEN** providers 包含多个供应商数据
- **THEN** 为每个供应商渲染一个 ProviderCard 组件
- **AND** 每个 ProviderCard 接收正确的 provider、isExpanded、onToggle 和 status 属性

### Requirement: 供应商状态判断
系统 SHALL 根据 models 数组是否为空判断供应商状态。

#### Scenario: 有模型的供应商标记为可用
- **WHEN** 供应商的 models 数组长度大于 0
- **THEN** getProviderStatus 返回 'available'

#### Scenario: 无模型的供应商标记为不可用
- **WHEN** 供应商的 models 数组长度为 0
- **THEN** getProviderStatus 返回 'unavailable'

### Requirement: 展开/折叠交互
系统 SHALL 将 onToggleProvider 回调正确传递给每个 ProviderCard。

#### Scenario: 点击卡片触发回调
- **WHEN** 用户点击某个供应商卡片
- **THEN** 调用 onToggleProvider 并传入对应的 providerKey
