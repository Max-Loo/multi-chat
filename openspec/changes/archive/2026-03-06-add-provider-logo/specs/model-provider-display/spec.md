# Model Provider Display - Delta Spec

此文档定义 `model-provider-display` 能力的变更内容。

## MODIFIED Requirements

### Requirement: 显示模型供应商列表
系统 SHALL 在模型供应商设置页面显示所有已加载的模型供应商列表。

#### Scenario: 成功显示供应商列表
- **WHEN** 用户访问模型供应商设置页面
- **THEN** 系统显示卡片式布局的供应商列表
- **AND** 每个供应商卡片包含供应商名称、**logo 图片**和状态标识
- **AND** logo 图片优先使用，加载失败时降级到首字母显示

#### Scenario: 显示供应商 logo
- **WHEN** 供应商卡片渲染
- **THEN** 系统使用 `getProviderLogoUrl(providerKey)` 获取 logo URL
- **AND** 系统在卡片头部显示 logo 图片
- **AND** 图片尺寸为 40x40 像素
- **AND** 图片使用 SVG 格式，保证清晰度

#### Scenario: Logo 加载失败降级
- **WHEN** logo 图片无法加载（网络错误、资源不存在等）
- **THEN** 系统降级到首字母显示
- **AND** 显示大写的供应商名称第一个字符
- **AND** 保持原有的背景色和样式

#### Scenario: Logo 图片属性
- **WHEN** logo 图片显示时
- **THEN** 系统设置 `alt` 属性为 `{providerName} logo`
- **AND** 图片使用 `object-contain` 保持宽高比
- **AND** 图片添加轻微阴影效果优化视觉
