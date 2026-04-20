## ADDED Requirements

### Requirement: 语言配置查找功能正确
系统 SHALL 通过 `getLanguageConfig` 根据语言代码返回对应的配置对象。

#### Scenario: 查找存在的语言
- **WHEN** 调用 `getLanguageConfig('zh')`
- **THEN** 返回 `{ code: 'zh', label: '中文', flag: '🇨🇳' }`

#### Scenario: 查找不存在的语言返回 undefined
- **WHEN** 调用 `getLanguageConfig('xx')`
- **THEN** 返回 `undefined`

### Requirement: 支持语言列表完整
系统 SHALL 导出与 LANGUAGE_CONFIGS 一致的 `SUPPORTED_LANGUAGE_LIST` 和 `SUPPORTED_LANGUAGE_SET`。

#### Scenario: SUPPORTED_LANGUAGE_LIST 包含所有配置语言
- **WHEN** 检查 `SUPPORTED_LANGUAGE_LIST`
- **THEN** 包含 `['zh', 'en', 'fr']`

#### Scenario: SUPPORTED_LANGUAGE_SET 支持 O(1) 查找
- **WHEN** 调用 `SUPPORTED_LANGUAGE_SET.has('zh')`
- **THEN** 返回 `true`

### Requirement: 语言迁移映射正确
系统 SHALL 通过 `LANGUAGE_MIGRATION_MAP` 将旧语言代码映射到新代码。

#### Scenario: zh-CN 迁移到 zh
- **WHEN** 查找 `LANGUAGE_MIGRATION_MAP['zh-CN']`
- **THEN** 返回 `'zh'`
