# 语言检测能力规范

## Purpose

语言检测能力负责在应用启动时检测和确定用户界面语言。系统按优先级顺序检查：1) localStorage 中的缓存语言，2) 浏览器系统语言，3) 默认英语。支持语言代码迁移和降级处理，确保用户始终获得有效的语言设置。

## Requirements

### Requirement: 语言降级后必须持久化到 localStorage

当语言缓存无效或不存在时，系统在降级到系统语言或默认语言后，必须将降级后的语言代码持久化到 localStorage，以避免每次页面刷新都重复执行降级逻辑。

系统必须在以下场景中持久化降级语言：
1. localStorage 中的语言代码无效且不在迁移规则中
2. localStorage 中的语言代码无效但迁移目标也无效
3. localStorage 中的语言代码为空或不存在
4. 系统语言检测失败，降级到默认英语

#### Scenario: 无效语言代码降级到系统语言

- **WHEN** localStorage 中存储的语言代码无效（如 `de` 不在支持列表中）且无迁移规则
- **AND** 系统语言（如 `fr-FR`）在支持列表中
- **THEN** 系统必须降级到系统语言 `fr`
- **AND** 系统必须将 `fr` 写入 localStorage 的 `LOCAL_STORAGE_LANGUAGE_KEY`
- **AND** 系统应该显示降级 Toast 提示（告知用户语言已切换到系统语言）

#### Scenario: 无效语言代码降级到默认英语

- **WHEN** localStorage 中存储的语言代码无效（如 `de` 不在支持列表中）
- **AND** 系统语言也不在支持列表中（如 `de-DE`）
- **THEN** 系统必须降级到默认英语 `en`
- **AND** 系统必须将 `en` 写入 localStorage 的 `LOCAL_STORAGE_LANGUAGE_KEY`
- **AND** 系统应该显示降级 Toast 警告（告知用户语言代码无效，已切换到英语）

#### Scenario: 迁移目标无效时降级到系统语言

- **WHEN** localStorage 中存储的语言代码无效（如 `invalid-code`）
- **AND** 迁移规则中存在该代码但迁移目标也无效（如 `invalid-target` 不在支持列表中）
- **AND** 系统语言（如 `zh`）在支持列表中
- **THEN** 系统必须降级到系统语言 `zh`
- **AND** 系统必须删除旧的无效缓存
- **AND** 系统必须将 `zh` 写入 localStorage 的 `LOCAL_STORAGE_LANGUAGE_KEY`

#### Scenario: localStorage 为空时使用系统语言

- **WHEN** localStorage 中没有存储语言代码
- **AND** 系统语言（如 `fr`）在支持列表中
- **THEN** 系统必须使用系统语言 `fr`
- **AND** 系统必须将 `fr` 写入 localStorage 的 `LOCAL_STORAGE_LANGUAGE_KEY`
- **AND** 系统应该显示降级 Toast 提示（告知用户使用系统语言）

#### Scenario: 持久化失败时的降级处理

- **WHEN** 系统尝试将降级语言写入 localStorage
- **AND** localStorage 写入操作失败（如用户禁用存储或存储空间已满）
- **THEN** 系统必须捕获错误并记录警告日志
- **AND** 系统必须继续初始化流程，不阻塞应用启动
- **AND** 系统必须在内存中使用降级语言
- **AND** 系统不得显示额外的错误 Toast（避免 Toast 爆炸）

#### Scenario: 刷新页面后使用持久化的降级语言

- **GIVEN** 上次启动时语言从无效代码降级到系统语言 `fr` 并持久化到 localStorage
- **WHEN** 用户刷新页面
- **THEN** 系统必须从 localStorage 读取 `fr`
- **AND** 系统必须直接使用 `fr`，不再重复降级逻辑
- **AND** 系统不得再次显示降级 Toast 提示

### Requirement: 语言迁移成功后必须持久化新语言代码

当检测到旧版本的语言代码需要迁移时，系统必须在验证迁移目标有效后更新 localStorage。

#### Scenario: 语言代码迁移成功

- **WHEN** localStorage 中存储旧版本语言代码（如 `zh-CN`）
- **AND** 迁移规则中存在该代码（`zh-CN` → `zh`）
- **AND** 迁移目标 `zh` 在支持列表中
- **THEN** 系统必须将 `zh` 写入 localStorage 的 `LOCAL_STORAGE_LANGUAGE_KEY`
- **AND** 系统必须返回 `migrated: true` 和迁移信息
- **AND** 系统必须显示迁移成功 Toast 提示

### Requirement: 有效语言缓存必须直接使用

当 localStorage 中存储的语言代码有效时，系统必须直接使用该缓存，不执行任何降级或迁移逻辑。

#### Scenario: 直接使用有效的缓存语言

- **WHEN** localStorage 中存储有效的语言代码（如 `zh`）
- **AND** `zh` 在支持列表中
- **THEN** 系统必须直接使用 `zh`，不调用系统语言检测
- **AND** 系统不得显示任何 Toast 提示
- **AND** 系统不得修改 localStorage
