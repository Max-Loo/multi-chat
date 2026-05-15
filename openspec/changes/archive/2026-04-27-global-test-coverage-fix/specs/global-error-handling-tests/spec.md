## ADDED Requirements

### Requirement: 外层 catch 块在 locale 抛异常时降级到系统语言

当 `getDefaultAppLanguage` 外层 try 块中 `locale()` 调用抛出异常时，系统 SHALL 进入 catch 块尝试再次调用 `locale()` 获取系统语言并降级。

#### Scenario: locale 首次抛异常，catch 内 locale 返回支持的语言
- **WHEN** `locale()` 首次调用抛出异常，catch 块内再次调用 `locale()` 返回 `zh-CN`
- **THEN** 系统 SHALL 返回 `{ lang: 'zh', migrated: false, fallbackReason: 'system-lang' }`

#### Scenario: locale 首次抛异常，catch 内 locale 返回不支持的语言
- **WHEN** `locale()` 首次调用抛出异常，catch 块内再次调用 `locale()` 返回 `de-DE`（不在支持列表中）
- **THEN** 系统 SHALL 返回 `{ lang: 'en', migrated: false, fallbackReason: 'default' }`

#### Scenario: locale 首次抛异常，catch 内 locale 也抛异常
- **WHEN** `locale()` 首次调用抛出异常，catch 块内再次调用 `locale()` 也抛出异常
- **THEN** 系统 SHALL 返回 `{ lang: 'en', migrated: false, fallbackReason: 'default' }`

#### Scenario: locale 首次抛异常，catch 内 locale 返回空值
- **WHEN** `locale()` 首次调用抛出异常，catch 块内再次调用 `locale()` 返回空字符串
- **THEN** 系统 SHALL 返回 `{ lang: 'en', migrated: false, fallbackReason: 'default' }`
