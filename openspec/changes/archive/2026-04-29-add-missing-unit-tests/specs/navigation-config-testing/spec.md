## ADDED Requirements

### Requirement: 导航项字段完整性校验

系统 SHALL 提供测试验证 `NAVIGATION_ITEMS` 中每一项包含所有必需字段。

#### Scenario: 每个导航项包含必需字段

- **WHEN** 遍历 `NAVIGATION_ITEMS` 数组
- **THEN** 每一项 SHALL 包含 `id`、`i18nKey`、`path`、`icon`、`IconComponent`、`theme` 字段
- **AND** `theme` SHALL 包含 `base`、`active`、`inactive` 子字段

### Requirement: 导航项 ID 唯一性校验

系统 SHALL 提供测试验证所有导航项的 ID 互不相同。

#### Scenario: 所有导航项 ID 唯一

- **WHEN** 提取 `NAVIGATION_ITEMS` 中所有项的 `id`
- **THEN** 所有 `id` SHALL 互不相同

### Requirement: 导航映射表一致性校验

系统 SHALL 提供测试验证 `NAVIGATION_ITEM_MAP` 与 `NAVIGATION_ITEMS` 完全一致。

#### Scenario: MAP 与数组一一对应

- **WHEN** 比较 `NAVIGATION_ITEM_MAP` 和 `NAVIGATION_ITEMS`
- **THEN** `NAVIGATION_ITEM_MAP` 的大小 SHALL 等于 `NAVIGATION_ITEMS` 的长度
- **AND** 每个导航项 SHALL 能通过 `id` 从 `NAVIGATION_ITEM_MAP` 中正确查找

### Requirement: 路由路径格式校验

系统 SHALL 提供测试验证所有导航项的路径格式合法。

#### Scenario: 路径以斜杠开头

- **WHEN** 遍历 `NAVIGATION_ITEMS` 的 `path` 字段
- **THEN** 每个路径 SHALL 以 `/` 字符开头

### Requirement: i18nKey 格式校验

系统 SHALL 提供测试验证所有导航项的国际化键路径格式正确。

#### Scenario: i18nKey 以 navigation. 前缀开头且包含对应 ID

- **WHEN** 遍历 `NAVIGATION_ITEMS` 的 `i18nKey` 字段
- **THEN** 每个键 SHALL 符合 `navigation.<id>` 的格式
