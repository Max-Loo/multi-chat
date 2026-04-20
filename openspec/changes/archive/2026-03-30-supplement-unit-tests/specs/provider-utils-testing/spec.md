## ADDED Requirements

### Requirement: getProviderLogoUrl 正确构建 logo URL
系统 SHALL 根据供应商 key 构建 models.dev 的 logo URL。

#### Scenario: 构建 openai logo URL
- **WHEN** 调用 `getProviderLogoUrl('openai')`
- **THEN** 返回 `'https://models.dev/logos/openai.svg'`

#### Scenario: 构建其他供应商 logo URL
- **WHEN** 调用 `getProviderLogoUrl('deepseek')`
- **THEN** 返回 `'https://models.dev/logos/deepseek.svg'`

#### Scenario: 空字符串也能拼接
- **WHEN** 调用 `getProviderLogoUrl('')`
- **THEN** 返回 `'https://models.dev/logos/.svg'`
