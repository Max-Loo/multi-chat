# Redux 应用配置中间件测试规格（Delta）

## MODIFIED Requirements

### Requirement: 配置中间件必须验证自动命名开关的持久化

当用户切换自动命名功能开关时，中间件必须将新状态持久化到 localStorage。

#### Scenario: 启用自动命名并持久化
- **WHEN** 用户 dispatch setAutoNamingEnabled action，参数为 true
- **THEN** 中间件必须调用 localStorage.setItem，键为 LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY，值为 'true'
- **THEN** action 必须正常传递到下一个中间件

#### Scenario: 禁用自动命名并持久化
- **WHEN** 用户 dispatch setAutoNamingEnabled action，参数为 false
- **THEN** 中间件必须调用 localStorage.setItem，键为 LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY，值为 'false'
- **THEN** action 必须正常传递到下一个中间件

#### Scenario: 自动命名开关监听器不应调用 i18n 更新
- **WHEN** 用户 dispatch setAutoNamingEnabled action
- **THEN** 不应调用 changeAppLanguage 函数
